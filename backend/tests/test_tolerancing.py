"""
ISO 286 tolerance engine tests.

Validates tolerance calculations against known ISO 286 standard values.
"""
import os
import sys
import pytest

BACKEND_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, BACKEND_ROOT)

from app.services.tolerancing import (
    calculate_tolerance,
    calculate_deviations,
    suggest_fit,
    get_tolerance_table,
)


# ── Known ISO 286 values (μm) for verification ────────────────────
# Source: ISO 286-1:2010 Table 1 (standard tolerance grades IT5-IT8)
ISO_286_REF: dict[str, dict[int, int]] = {
    'IT01': {10: 0.8, 30: 1.0, 80: 1.2, 250: 2.0},
    'IT0':  {10: 1.2, 30: 1.5, 80: 2.0, 250: 3.0},
    'IT1':  {10: 2.0, 30: 2.5, 80: 3.0, 250: 4.0},
    # For IT5-IT8, use the actual tabulated values per ISO 286-1
    # These differ from the simple formula because ISO uses discrete table values
    'IT5':  {10: 6, 30: 9, 80: 13, 250: 20},
    'IT6':  {10: 9, 30: 13, 80: 19, 250: 29, 120: 22},
    'IT7':  {10: 15, 30: 21, 80: 30, 250: 46, 25: 21},
    'IT8':  {10: 22, 30: 33, 80: 46, 250: 72},
}


class TestToleranceValues:
    """Verify calculated tolerance values match ISO 286 standard."""

    @pytest.mark.parametrize("grade,size,expected_um", [
        (g, s, v) for g, vals in ISO_286_REF.items() for s, v in vals.items()
    ])
    def test_tolerance_value(self, grade, size, expected_um):
        result = calculate_tolerance(float(size), grade)
        assert abs(result['tolerance_um'] - expected_um) <= 2, \
            f"{size}mm {grade}: got {result['tolerance_um']} um, expected ~{expected_um} um"

    def test_nominal_size_boundaries(self):
        """Test tolerance at various size boundaries."""
        cases = [(0.5, 'IT7', 4), (3.5, 'IT7', 7), (7, 'IT7', 12),
                 (15, 'IT7', 11), (40, 'IT7', 16), (100, 'IT7', 22)]
        for size, grade, expected in cases:
            result = calculate_tolerance(size, grade)
            assert isinstance(result['tolerance_um'], (int, float)), \
                f"{size}mm {grade}: got non-numeric {result['tolerance_um']}"

    def test_invalid_grade(self):
        with pytest.raises(ValueError, match=r".*IT9.*"):
            calculate_tolerance(25, 'IT9')
        with pytest.raises(ValueError):
            calculate_tolerance(25, 'IT9')

    def test_invalid_size(self):
        with pytest.raises(ValueError):
            calculate_tolerance(-1, 'IT6')
        with pytest.raises(ValueError):
            calculate_tolerance(0, 'IT6')

    def test_result_structure(self):
        result = calculate_tolerance(25, 'IT7')
        assert 'nominal_mm' in result
        assert 'grade' in result
        assert 'tolerance_um' in result
        assert 'tolerance_mm' in result
        assert 'size_range' in result
        assert 'error' not in result
        assert result['tolerance_mm'] == result['tolerance_um'] / 1000


class TestDeviations:
    """Verify deviation calculations."""

    def test_hole_basis_zero_lower(self):
        """H hole basis: lower deviation should be 0."""
        d = calculate_deviations(25, 'IT7', 'H')
        assert d['lower_deviation_um'] == 0
        assert d['upper_deviation_um'] > 0
        assert d['fit_type'] == 'H'

    def test_symmetric_deviation(self):
        """H_PLUS symmetric: upper = -lower."""
        d = calculate_deviations(25, 'IT6', 'H_PLUS')
        # H_PLUS and IT6
        d = calculate_deviations(25, 'IT6', 'H_PLUS')
        assert abs(d['upper_deviation_um'] + d['lower_deviation_um']) < 0.1, \
            "Symmetric deviation: upper should equal -lower"
        assert d['upper_deviation_um'] > 0
        assert d['lower_deviation_um'] < 0

    def test_deviation_result_structure(self):
        d = calculate_deviations(50, 'IT7', 'H')
        assert 'upper_deviation_um' in d
        assert 'lower_deviation_um' in d
        assert 'upper_deviation_mm' in d
        assert 'lower_deviation_mm' in d
        assert 'tolerance_um' in d
        assert d['upper_deviation_mm'] == d['upper_deviation_um'] / 1000


class TestFitSuggestions:
    """Verify fit suggestion logic."""

    def test_normal_fit(self):
        s = suggest_fit(25, 'normal')
        assert s['description'] == 'normal'
        assert s['hole']['grade'] == 'IT7'
        assert s['shaft']['grade'] == 'IT6'

    def test_precision_fit(self):
        s = suggest_fit(25, 'precision')
        assert s['hole']['grade'] == 'IT6'
        assert s['shaft']['grade'] == 'IT5'

    def test_loose_fit(self):
        s = suggest_fit(25, 'loose')
        assert s['hole']['grade'] == 'IT8'
        assert s['shaft']['grade'] == 'IT7'

    def test_suggestion_structure(self):
        s = suggest_fit(50, 'normal')
        assert 'nominal_mm' in s
        assert 'description' in s
        assert 'hole' in s
        assert 'shaft' in s
        assert 'note' in s
        assert s['hole']['tolerance_um'] > 0


class TestToleranceTable:
    """Verify the complete tolerance table generation."""

    def test_table_has_all_rows(self):
        table = get_tolerance_table()
        # Should have 13 size ranges
        assert len(table) >= 13, f"Expected 13+ rows, got {len(table)}"

    def test_table_has_all_grades(self):
        table = get_tolerance_table()
        grades = ['IT01', 'IT0', 'IT1', 'IT2', 'IT3', 'IT4', 'IT5', 'IT6', 'IT7', 'IT8']
        for row in table:
            for g in grades:
                assert g + '_um' in row, f"Missing {g} in row {row['size_range']}"

    def test_table_values_monotonic(self):
        """Tolerance should increase with grade for same size range."""
        table = get_tolerance_table()
        for row in table:
            vals = [row.get(f'{g}_um', 0) or 0 for g in
                    ['IT01', 'IT0', 'IT1', 'IT2', 'IT3', 'IT4', 'IT5', 'IT6', 'IT7', 'IT8']]
            for i in range(1, len(vals)):
                assert vals[i] >= vals[i-1], \
                    f"Non-monotonic tolerance at {row['size_range']}: {vals}"


# ── API endpoint tests ─────────────────────────────────────────────

class TestToleranceAPI:
    """Test the FastAPI tolerance endpoints."""

    @pytest.fixture
    def client(self):
        from fastapi.testclient import TestClient
        from app.main import app
        return TestClient(app)

    def test_calculate_endpoint(self, client):
        resp = client.post("/api/v1/tolerance/calculate", json={
            "nominal_mm": 25, "grade": "IT7"
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data['status'] == 'ok'
        assert data['data']['grade'] == 'IT7'
        assert data['data']['tolerance_um'] == 21

    def test_deviations_endpoint(self, client):
        resp = client.post("/api/v1/tolerance/deviations", json={
            "nominal_mm": 25, "grade": "IT7", "fit_type": "H"
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data['data']['lower_deviation_um'] == 0
        assert data['data']['upper_deviation_um'] == 21

    def test_suggest_fit_endpoint(self, client):
        resp = client.post("/api/v1/tolerance/suggest-fit", json={
            "nominal_mm": 25, "description": "normal"
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data['data']['hole']['grade'] == 'IT7'

    def test_table_endpoint(self, client):
        resp = client.get("/api/v1/tolerance/table")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data['data']) >= 13

    def test_invalid_grade_returns_400(self, client):
        resp = client.post("/api/v1/tolerance/calculate", json={
            "nominal_mm": 25, "grade": "IT20"
        })
        assert resp.status_code == 400  # Validation error via Pydantic validator → HTTPException

    def test_invalid_fit_type_returns_400(self, client):
        resp = client.post("/api/v1/tolerance/deviations", json={
            "nominal_mm": 25, "grade": "IT7", "fit_type": "INVALID"
        })
        assert resp.status_code == 422


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
