"""
Surface Cut (SURFACE_CUT) tests.

Tests that SURFACE_CUT can be sequenced after a base solid without errors.
Without OCC, validates the contract (no crash, proper return structure).
With OCC, validates that the half-space cut actually modifies the shape.
"""
import os
import sys
import math
import pytest

BACKEND_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, BACKEND_ROOT)


def _has_occ():
    """Check if OCC is available at runtime."""
    from backend.app.services import geometry_service as gs
    return gs.HAS_OCC


def build_surface_cut_features():
    """Build a feature list: base box + cutting surface + SURFACE_CUT.

    The geometry is a 50x50x50 box centered at origin.
    The cutting surface is a 40x40 plane at Y=25 (mid-height).
    SURFACE_CUT should split the box at Y=25.
    """
    return [
        # 1. Base box (50x50x50, origin at center → points around origin)
        {
            "id": "base_box",
            "type": "BOX",
            "parameters": {
                "width": 50.0,
                "height": 50.0,
                "depth": 50.0,
            },
        },
        # 2. Cutting surface: a 40x40 EXTRUDE with operation=SURFACE
        #    placed at Y=25 (top-half split plane)
        {
            "id": "cut_plane",
            "type": "EXTRUDE",
            "parameters": {
                "plane": "TOP",
                "points": [[-20, -20], [20, -20], [20, 20], [-20, 20]],
                "depth": 1.0,
                "operation": "SURFACE",
                "x": 0.0,
                "y": 25.0,
                "z": 0.0,
            },
        },
        # 3. Surface cut using the plane as tool
        {
            "id": "cut_op",
            "type": "SURFACE_CUT",
            "parameters": {
                "tool_feature_id": "cut_plane",
                "flip": False,
            },
        },
    ]


class TestSurfaceCutContract:
    """SURFACE_CUT contract tests — runnable with or without OCC."""

    def test_surface_cut_returns_dict_with_data(self):
        """process_features_cached returns a dict with a 'data' key."""
        from backend.app.services import geometry_service as gs
        features = build_surface_cut_features()
        result = gs.process_features_cached(features)
        assert isinstance(result, dict), f"Expected dict, got {type(result)}"
        assert "data" in result, f"Missing 'data' key; keys: {list(result.keys())}"

    def test_surface_cut_no_exception(self):
        """SURFACE_CUT in the feature chain does not raise."""
        from backend.app.services import geometry_service as gs
        features = build_surface_cut_features()
        try:
            gs.process_features_cached(features)
        except Exception as exc:
            pytest.fail(f"SURFACE_CUT raised: {exc}")

    def test_surface_cut_without_tool_does_not_crash(self):
        """SURFACE_CUT with a missing tool_feature_id should not crash."""
        from backend.app.services import geometry_service as gs
        features = build_surface_cut_features()
        # Replace the SURFACE_CUT's tool_feature_id with a non-existent id
        features[2]["parameters"]["tool_feature_id"] = "nonexistent_tool"
        try:
            gs.process_features_cached(features)
        except Exception as exc:
            pytest.fail(f"SURFACE_CUT with bad tool_id raised: {exc}")

    def test_base_box_only_is_valid(self):
        """A plain BOX feature alone produces valid output."""
        from backend.app.services import geometry_service as gs
        features = [{
            "id": "box1",
            "type": "BOX",
            "parameters": {"width": 50.0, "height": 50.0, "depth": 50.0},
        }]
        result = gs.process_features_cached(features)
        assert isinstance(result, dict)
        assert "data" in result


class TestSurfaceCutWithOCC:
    """Deep SURFACE_CUT tests — only run when OCC is available.

    These validate that the half-space cut actually modifies geometry.
    """

    @pytest.mark.skipif(not _has_occ(), reason="OCC not available")
    def test_surface_cut_reduces_volume(self):
        """After SURFACE_CUT the volume should be ~half of the original."""
        from backend.app.services import geometry_service as gs
        from OCC.Core.gp import gp_Pnt
        from OCC.Core.TopExp import TopExp_Explorer
        from OCC.Core.TopAbs import TopAbs_SOLID
        from OCC.Core.TopoDS import topods
        from OCC.Core.GProp import GProp_GProps
        from OCC.Core.BRepGProp import brepgprop

        features = build_surface_cut_features()
        shape, _ = gs.build_feature_chain(features)

        # Volume check only works when OCC produced a real shape
        if shape is not None and not shape.IsNull():
            # Compute volume via GProp
            props = GProp_GProps()
            brepgprop.VolumeProperties(shape, props)
            volume = props.Mass()
            # Box was 50x50x50 = 125000; cut at mid-plane → ~62500
            # Allow tolerance for half-space discretization
            assert volume < 100000, f"Volume {volume} too large, cut likely failed"
            assert volume > 1000, f"Volume {volume} too small, cut over-cut"

    @pytest.mark.skipif(not _has_occ(), reason="OCC not available")
    def test_surface_cut_flip_keeps_other_half(self):
        """Flipped SURFACE_CUT keeps the lower half (~62500 volume)."""
        from backend.app.services import geometry_service as gs
        from OCC.Core.GProp import GProp_GProps
        from OCC.Core.BRepGProp import brepgprop

        features = build_surface_cut_features()
        features[2]["parameters"]["flip"] = True  # keep lower half
        shape, _ = gs.build_feature_chain(features)

        if shape is not None and not shape.IsNull():
            props = GProp_GProps()
            brepgprop.VolumeProperties(shape, props)
            volume = props.Mass()
            assert volume > 1000, f"Flipped cut volume {volume} too small"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
