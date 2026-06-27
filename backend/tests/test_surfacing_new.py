"""
New surfacing feature tests: SURFACE_FILL, PLANAR_SURFACE, SURFACE_EXTEND,
SURFACE_UNTRIM, RULED_SURFACE.

Tests that each feature type can be created via the pipeline without errors.
With OCC, validates that real shapes are produced. Without OCC, validates
the contract (no crash, proper return structure).
"""
import os
import sys
import math
import pytest

BACKEND_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, BACKEND_ROOT)


def _has_occ():
    from backend.app.services import geometry_service as gs
    return gs.HAS_OCC


def _build_base_box():
    """Shared base box fixture: 50x50x50 centered at origin."""
    return {
        "id": "base_box",
        "type": "BOX",
        "parameters": {
            "width": 50.0,
            "height": 50.0,
            "depth": 50.0,
        },
    }


def _shape_valid(result):
    """Check that process_features returned a valid mesh dict (OCC-aware)."""
    if result is None:
        return False
    if isinstance(result, dict):
        # process_features returns {'type': 'mesh', 'data': {...}, 'ref_geometry': [...]}
        return result.get('type') == 'mesh' and 'vertices' in result.get('data', {})
    # Fallback: check if it's a TopoDS_Shape
    try:
        return not result.IsNull()
    except Exception:
        return False


class TestFilledSurface:
    def test_planar_fill(self):
        """SURFACE_FILL with a 4-point planar square."""
        from backend.app.services.geometry_service import process_features
        feats = [
            {
                "id": "fill_1",
                "type": "SURFACE_FILL",
                "parameters": {
                    "boundary_points": [[0,0,0], [20,0,0], [20,20,0], [0,20,0]],
                    "constraint_points": [],
                },
            },
        ]
        result = process_features(feats)
        assert result is not None
        if _has_occ():
            assert _shape_valid(result), "Filled surface should produce a valid non-null shape"
        print("[PASS] test_planar_fill")

    def test_fill_less_than_3_points(self):
        """SURFACE_FILL with fewer than 3 points should not crash (None expected)."""
        from backend.app.services.geometry_service import process_features
        feats = [
            {
                "id": "fill_invalid",
                "type": "SURFACE_FILL",
                "parameters": {
                    "boundary_points": [[0,0,0], [10,0,0]],
                    "constraint_points": [],
                },
            },
        ]
        # <3 points -> no valid fill -> None is acceptable
        process_features(feats)
        print("[PASS] test_fill_less_than_3_points (no crash)")

    def test_fill_triangular(self):
        """SURFACE_FILL with a triangular boundary."""
        from backend.app.services.geometry_service import process_features
        feats = [
            {
                "id": "fill_tri",
                "type": "SURFACE_FILL",
                "parameters": {
                    "boundary_points": [[0,0,0], [20,0,0], [10,20,0]],
                    "constraint_points": [],
                },
            },
        ]
        result = process_features(feats)
        assert result is not None
        print("[PASS] test_fill_triangular")

    def test_fill_after_box(self):
        """SURFACE_FILL sequenced after a base box (no crash)."""
        from backend.app.services.geometry_service import process_features
        feats = [
            _build_base_box(),
            {
                "id": "fill_after",
                "type": "SURFACE_FILL",
                "parameters": {
                    "boundary_points": [[0,0,0], [20,0,0], [20,20,0], [0,20,0]],
                    "constraint_points": [],
                },
            },
        ]
        result = process_features(feats)
        assert result is not None
        print("[PASS] test_fill_after_box")


class TestPlanarSurface:
    def test_planar_square(self):
        """PLANAR_SURFACE from a square boundary."""
        from backend.app.services.geometry_service import process_features
        feats = [
            {
                "id": "planar_1",
                "type": "PLANAR_SURFACE",
                "parameters": {
                    "boundary_points": [[0,0,0], [30,0,0], [30,20,0], [0,20,0]],
                },
            },
        ]
        result = process_features(feats)
        assert result is not None
        if _has_occ():
            assert _shape_valid(result), "Planar surface should produce a valid non-null shape"
        print("[PASS] test_planar_square")

    def test_planar_less_than_3_points(self):
        """PLANAR_SURFACE with <3 points must not crash (None expected)."""
        from backend.app.services.geometry_service import process_features
        feats = [
            {
                "id": "planar_invalid",
                "type": "PLANAR_SURFACE",
                "parameters": {
                    "boundary_points": [[0,0,0], [10,0,0]],
                },
            },
        ]
        # <3 points -> no valid face -> None is acceptable
        process_features(feats)
        print("[PASS] test_planar_less_than_3_points (no crash)")

    def test_planar_offset_plane(self):
        """PLANAR_SURFACE in a non-Z-plane orientation."""
        from backend.app.services.geometry_service import process_features
        z = 15.0
        feats = [
            {
                "id": "planar_off",
                "type": "PLANAR_SURFACE",
                "parameters": {
                    "boundary_points": [[0,0,z], [20,0,z], [20,15,z], [0,15,z]],
                },
            },
        ]
        result = process_features(feats)
        assert result is not None
        print("[PASS] test_planar_offset_plane")


class TestExtendSurface:
    def test_extend_after_box(self):
        """SURFACE_EXTEND after a base box (extends all faces)."""
        from backend.app.services.geometry_service import process_features
        feats = [
            _build_base_box(),
            {
                "id": "ext_1",
                "type": "SURFACE_EXTEND",
                "parameters": {"distance": 5.0},
            },
        ]
        result = process_features(feats)
        assert result is not None
        print("[PASS] test_extend_after_box")

    def test_extend_zero_distance(self):
        """SURFACE_EXTEND with zero distance."""
        from backend.app.services.geometry_service import process_features
        feats = [
            _build_base_box(),
            {
                "id": "ext_zero",
                "type": "SURFACE_EXTEND",
                "parameters": {"distance": 0.0},
            },
        ]
        result = process_features(feats)
        assert result is not None
        print("[PASS] test_extend_zero_distance")

    def test_extend_negative_distance(self):
        """SURFACE_EXTEND with negative distance (should still process)."""
        from backend.app.services.geometry_service import process_features
        feats = [
            _build_base_box(),
            {
                "id": "ext_neg",
                "type": "SURFACE_EXTEND",
                "parameters": {"distance": -2.0},
            },
        ]
        result = process_features(feats)
        assert result is not None
        print("[PASS] test_extend_negative_distance")


class TestUntrimSurface:
    def test_untrim_after_box(self):
        """SURFACE_UNTRIM after a base box."""
        from backend.app.services.geometry_service import process_features
        feats = [
            _build_base_box(),
            {
                "id": "untrim_1",
                "type": "SURFACE_UNTRIM",
                "parameters": {},
            },
        ]
        result = process_features(feats)
        assert result is not None
        print("[PASS] test_untrim_after_box")

    def test_untrim_solo(self):
        """SURFACE_UNTRIM as the only feature (no prior shape => None expected)."""
        from backend.app.services.geometry_service import process_features
        feats = [
            {
                "id": "untrim_solo",
                "type": "SURFACE_UNTRIM",
                "parameters": {},
            },
        ]
        # No prior shape -> nothing to untrim -> None is acceptable
        process_features(feats)
        print("[PASS] test_untrim_solo (no crash)")


class TestRuledSurface:
    def test_ruled_between_two_curves(self):
        """RULED_SURFACE between two parallel 3-point curves."""
        from backend.app.services.geometry_service import process_features
        feats = [
            {
                "id": "ruled_1",
                "type": "RULED_SURFACE",
                "parameters": {
                    "curve1_points": [[0,0,0], [10,5,0], [20,0,0]],
                    "curve2_points": [[0,0,10], [10,5,10], [20,0,10]],
                },
            },
        ]
        result = process_features(feats)
        assert result is not None
        if _has_occ():
            assert _shape_valid(result), "Ruled surface should produce a valid non-null shape"
        print("[PASS] test_ruled_between_two_curves")

    def test_ruled_short_curve(self):
        """RULED_SURFACE with curve of <2 points (should not crash)."""
        from backend.app.services.geometry_service import process_features
        feats = [
            {
                "id": "ruled_short",
                "type": "RULED_SURFACE",
                "parameters": {
                    "curve1_points": [[0,0,0]],
                    "curve2_points": [[0,0,10], [10,0,10]],
                },
            },
        ]
        process_features(feats)
        print("[PASS] test_ruled_short_curve (no crash)")

    def test_ruled_straight_lines(self):
        """RULED_SURFACE between two straight line segments."""
        from backend.app.services.geometry_service import process_features
        feats = [
            {
                "id": "ruled_line",
                "type": "RULED_SURFACE",
                "parameters": {
                    "curve1_points": [[0,0,0], [10,0,0]],
                    "curve2_points": [[0,0,15], [10,0,15]],
                },
            },
        ]
        result = process_features(feats)
        assert result is not None
        print("[PASS] test_ruled_straight_lines")
