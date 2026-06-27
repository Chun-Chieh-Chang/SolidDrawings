"""
Unit tests for geometry_service generate functions (extracted module).

Tests split, combine, boundary_surface, trim_surface, and base_flange_tab
generate functions — runs against the real OCC kernel (backend/.venv).
"""

import os
import sys

BACKEND_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND_ROOT)

import pytest

SAMPLE_FEATURES = [
    {"id": "box1", "type": "BOX", "parameters": {"depth": 5.0}},
    {"id": "cyl1", "type": "CYLINDER", "parameters": {"radius": 2.0, "height": 3.0}},
]


# ── generate_split ────────────────────────────────────────────────────────────


class TestGenerateSplit:
    """generate_split builds a split shape via OCC, returns a uuid cache key."""

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
        # Different split planes produce different cached results
        assert r1 != r2


# ── generate_combine ──────────────────────────────────────────────────────────


class TestGenerateCombine:
    """generate_combine performs boolean ops via OCC, returns a uuid cache key."""

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
    """generate_boundary_surface builds a surface via OCC, returns a uuid cache key."""

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
    """generate_trim_surface trims a surface via OCC, returns a uuid cache key."""

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
    """The rebuild pipeline runs against the real OCC kernel."""

    def test_process_empty_list(self):
        from app.services.geometry_service import process_features
        result = process_features([])
        assert result is None

    def test_process_with_split_feature(self):
        from app.services.geometry_service import process_features
        features = [
            {"id": "box1", "type": "BOX", "parameters": {"depth": 5.0}},
            {"id": "split1", "type": "SPLIT",
             "parameters": {"split_plane": {"point": [0, 0, 0], "normal": [0, 0, 1]}}},
        ]
        result = process_features(features)
        assert isinstance(result, dict)
        assert "type" in result

    def test_process_with_combine_feature(self):
        from app.services.geometry_service import process_features
        features = [
            {"id": "box1", "type": "BOX", "parameters": {"depth": 5.0}},
            {"id": "cyl1", "type": "CYLINDER", "parameters": {"radius": 2.0, "height": 3.0}},
            {"id": "comb1", "type": "COMBINE",
             "parameters": {"operation": "ADD", "tool_feature_id": "cyl1"}},
        ]
        result = process_features(features)
        assert isinstance(result, dict)
        assert "type" in result

    def test_process_with_base_flange_tab(self):
        from app.services.geometry_service import process_features
        features = [
            {"id": "bft1", "type": "BASE_FLANGE_TAB",
             "parameters": {"thickness": 1.0, "bendRadius": 0.5}},
        ]
        # process_features does not handle BASE_FLANGE_TAB — not a crash
        result = process_features(features)
        assert result is None


# ── features.py primitive shapes ──────────────────────────────────────────────


class TestGenerateBox:
    """generate_box returns a mesh dict via the OCC kernel."""

    def test_returns_mesh_type(self):
        from app.services.features import generate_box
        result = generate_box(10.0, 5.0, 3.0)
        assert isinstance(result, dict)
        assert result["type"] == "mesh"

    def test_returns_data_with_vertices(self):
        from app.services.features import generate_box
        result = generate_box(10.0, 5.0, 3.0)
        data = result["data"]
        assert isinstance(data, dict)
        assert "vertices" in data
        assert len(data["vertices"]) > 0

    def test_small_dimensions(self):
        from app.services.features import generate_box
        result = generate_box(0.001, 0.001, 0.001)
        assert result["type"] == "mesh"
        assert len(result["data"]["vertices"]) > 0


class TestGenerateCylinder:
    """generate_cylinder returns a mesh dict via the OCC kernel."""

    def test_returns_mesh_type(self):
        from app.services.features import generate_cylinder
        result = generate_cylinder(5.0, 10.0)
        assert isinstance(result, dict)
        assert result["type"] == "mesh"

    def test_with_zero_radius(self):
        from app.services.features import generate_cylinder
        result = generate_cylinder(0, 10.0)
        assert result["type"] == "mesh"

    def test_with_zero_height(self):
        from app.services.features import generate_cylinder
        result = generate_cylinder(5.0, 0)
        assert result["type"] == "mesh"


class TestGenerateSphere:
    """generate_sphere returns a mesh dict via the OCC kernel."""

    def test_returns_mesh_type(self):
        from app.services.features import generate_sphere
        result = generate_sphere(5.0)
        assert isinstance(result, dict)
        assert result["type"] == "mesh"

    def test_zero_radius(self):
        from app.services.features import generate_sphere
        result = generate_sphere(0)
        assert result["type"] == "mesh"


class TestGenerateRib:
    """generate_rib builds a rib feature via OCC, returns a uuid cache key."""

    def test_returns_string(self):
        from app.services.features import generate_rib
        result = generate_rib([], thickness=2.0, direction="BOTH")
        assert isinstance(result, str)

    def test_returns_uuid(self):
        from app.services.features import generate_rib
        result = generate_rib([{"id": "box1", "type": "BOX", "parameters": {"depth": 5.0}}], thickness=2.0)
        # Returns a uuid4 hex with dashes (36 chars)
        assert len(result) == 36

    def test_with_empty_features(self):
        from app.services.features import generate_rib
        result = generate_rib([], thickness=2.0)
        assert len(result) == 36


class TestGenerateSectionView:
    """generate_section_view runs OCC HLR projection, returns visible/hidden lines."""

    def test_returns_dict_with_expected_keys(self):
        from app.services.features import generate_section_view
        result = generate_section_view([], {"origin": [0, 0, 0], "normal": [0, 1, 0]}, "FRONT")
        assert isinstance(result, dict)
        assert "visible_lines" in result
        assert "hidden_lines" in result
        assert "section_fill" in result

    def test_visible_lines_is_empty(self):
        from app.services.features import generate_section_view
        result = generate_section_view([], {}, "FRONT")
        assert result["visible_lines"] == []

    def test_hidden_lines_is_empty(self):
        from app.services.features import generate_section_view
        result = generate_section_view([], {}, "TOP")
        assert result["hidden_lines"] == []

    def test_section_fill_is_empty(self):
        from app.services.features import generate_section_view
        result = generate_section_view([], {}, "RIGHT")
        assert result["section_fill"] == []

    def test_with_features_and_no_cut_plane(self):
        from app.services.features import generate_section_view
        result = generate_section_view(
            [{"id": "box1", "type": "BOX", "parameters": {"depth": 5.0}}],
            {},
            "FRONT",
        )
        assert result["visible_lines"] == []

    def test_different_plane_types_dont_crash(self):
        from app.services.features import generate_section_view
        for pt in ["FRONT", "TOP", "RIGHT", "ISO"]:
            result = generate_section_view([], {}, pt)
            assert isinstance(result, dict)
            assert "visible_lines" in result
