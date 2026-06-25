"""
Unit tests for geometry_service generate functions (extracted module).

Tests split, combine, boundary_surface, trim_surface, and base_flange_tab
generate functions — all patched to run without OCC (HAS_OCC=False).
"""

import os
import sys
import uuid

BACKEND_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND_ROOT)

import pytest

# ── Fixtures ──────────────────────────────────────────────────────────────────


@pytest.fixture(autouse=True)
def patch_has_occ():
    """All tests in this file run without OCC unless overridden."""
    from app.services import geometry_service as gs
    saved = gs.HAS_OCC
    gs.HAS_OCC = False
    yield
    gs.HAS_OCC = saved


@pytest.fixture(autouse=True)
def patch_surfacing_has_occ():
    """Also patch surfacing module's HAS_OCC."""
    from app.services import surfacing
    saved = surfacing.HAS_OCC
    surfacing.HAS_OCC = False
    yield
    surfacing.HAS_OCC = saved


SAMPLE_FEATURES = [
    {"id": "box1", "type": "BOX", "parameters": {"depth": 5.0}},
    {"id": "cyl1", "type": "CYLINDER", "parameters": {"radius": 2.0, "height": 3.0}},
]


# ── generate_split ────────────────────────────────────────────────────────────


class TestGenerateSplit:
    """generate_split returns a uuid4 hash when OCC is unavailable."""

    def test_returns_string(self):
        from app.services.geometry_service import generate_split
        result = generate_split(SAMPLE_FEATURES, {})
        assert isinstance(result, str)

    def test_returns_valid_uuid(self):
        from app.services.geometry_service import generate_split
        result = generate_split(SAMPLE_FEATURES, {"point": [0, 0, 0], "normal": [0, 0, 1]})
        # uuid4 hex is 32 chars, but str(uuid4()) includes dashes → 36
        assert len(result) == 36

    def test_handles_empty_features(self):
        from app.services.geometry_service import generate_split
        result = generate_split([], {"point": [0, 0, 0], "normal": [0, 0, 1]})
        assert isinstance(result, str)

    def test_different_plane_gives_different_hash(self):
        from app.services.geometry_service import generate_split
        r1 = generate_split(SAMPLE_FEATURES, {"point": [0, 0, 0], "normal": [0, 0, 1]})
        r2 = generate_split(SAMPLE_FEATURES, {"point": [1, 0, 0], "normal": [1, 0, 0]})
        # Without OCC, both return random uuids — they'll differ
        assert r1 != r2


# ── generate_combine ──────────────────────────────────────────────────────────


class TestGenerateCombine:
    """generate_combine returns a uuid4 hash when OCC is unavailable."""

    def test_returns_string(self):
        from app.services.geometry_service import generate_combine
        result = generate_combine(SAMPLE_FEATURES, "ADD", "cyl1")
        assert isinstance(result, str)

    def test_returns_uuid(self):
        from app.services.geometry_service import generate_combine
        result = generate_combine(SAMPLE_FEATURES, "ADD", "cyl1")
        assert len(result) == 36

    def test_supports_subtract(self):
        from app.services.geometry_service import generate_combine
        result = generate_combine(SAMPLE_FEATURES, "SUBTRACT", "cyl1")
        assert len(result) == 36

    def test_supports_intersect(self):
        from app.services.geometry_service import generate_combine
        result = generate_combine(SAMPLE_FEATURES, "INTERSECT", "cyl1")
        assert len(result) == 36

    def test_handles_missing_tool(self):
        from app.services.geometry_service import generate_combine
        result = generate_combine(SAMPLE_FEATURES, "ADD", "nonexistent_feat")
        assert len(result) == 36


# ── generate_boundary_surface (from surfacing module) ─────────────────────────


class TestGenerateBoundarySurface:
    """generate_boundary_surface returns a uuid4 hash when OCC unavailable."""

    def test_returns_string(self):
        from app.services.surfacing import generate_boundary_surface
        result = generate_boundary_surface(SAMPLE_FEATURES, [], "G1")
        assert isinstance(result, str)

    def test_with_boundary_curves(self):
        from app.services.surfacing import generate_boundary_surface
        curves = [
            {"points": [[0, 0, 0], [10, 0, 0]]},
            {"points": [[10, 0, 0], [10, 10, 0]]},
            {"points": [[10, 10, 0], [0, 10, 0]]},
            {"points": [[0, 10, 0], [0, 0, 0]]},
        ]
        result = generate_boundary_surface(SAMPLE_FEATURES, curves, "G1")
        assert len(result) == 36

    def test_single_curve(self):
        from app.services.surfacing import generate_boundary_surface
        curves = [{"points": [[0, 0, 0], [10, 0, 0]]}]
        result = generate_boundary_surface(SAMPLE_FEATURES, curves, "G1")
        assert isinstance(result, str)


# ── generate_trim_surface (from surfacing module) ─────────────────────────────


class TestGenerateTrimSurface:
    """generate_trim_surface returns a uuid4 hash when OCC unavailable."""

    def test_returns_string(self):
        from app.services.surfacing import generate_trim_surface
        result = generate_trim_surface(SAMPLE_FEATURES, {}, "INSIDE")
        assert isinstance(result, str)

    def test_with_trim_curve(self):
        from app.services.surfacing import generate_trim_surface
        curve = {"points": [[0, 0, 0], [5, 5, 0]]}
        result = generate_trim_surface(SAMPLE_FEATURES, curve, "INSIDE")
        assert isinstance(result, str)

    def test_outside_keep_side(self):
        from app.services.surfacing import generate_trim_surface
        curve = {"points": [[0, 0, 0], [5, 5, 0]]}
        result = generate_trim_surface(SAMPLE_FEATURES, curve, "OUTSIDE")
        assert isinstance(result, str)


# ── process_features (rebuild pipeline) ───────────────────────────────────────


class TestProcessFeatures:
    """The rebuild pipeline must handle new feature types gracefully."""

    def test_process_empty_list(self):
        from app.services.geometry_service import process_features
        result = process_features([])
        # Without OCC, process_features returns a mock mesh dict, not None
        assert result is not None

    def test_process_with_split_feature(self):
        from app.services.geometry_service import process_features
        features = [
            {"id": "box1", "type": "BOX", "parameters": {"depth": 5.0}},
            {"id": "split1", "type": "SPLIT",
             "parameters": {"split_plane": {"point": [0, 0, 0], "normal": [0, 0, 1]}}},
        ]
        # Should not raise
        result = process_features(features)
        assert result is not None

    def test_process_with_combine_feature(self):
        from app.services.geometry_service import process_features
        features = [
            {"id": "box1", "type": "BOX", "parameters": {"depth": 5.0}},
            {"id": "cyl1", "type": "CYLINDER", "parameters": {"radius": 2.0, "height": 3.0}},
            {"id": "comb1", "type": "COMBINE",
             "parameters": {"operation": "ADD", "tool_feature_id": "cyl1"}},
        ]
        result = process_features(features)
        assert result is not None

    def test_process_with_base_flange_tab(self):
        from app.services.geometry_service import process_features
        features = [
            {"id": "bft1", "type": "BASE_FLANGE_TAB",
             "parameters": {"thickness": 1.0, "bendRadius": 0.5}},
        ]
        result = process_features(features)
        assert result is not None
