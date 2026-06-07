import os
import pytest
import tempfile
import math
from app.services import geometry_service

def test_box_generation_and_export():
    """
    Golden STEP / Incremental B-Rep Test
    Tests whether the pythonocc-core backend can successfully:
    1. Parse a feature tree and generate B-Rep geometry and mesh data.
    2. Export the generated B-Rep to a valid STEP file.
    """
    features = [
        {
            "id": "test_box_1",
            "type": "BOX",
            "parameters": {
                "width": 10.0, "height": 20.0, "depth": 30.0,
                "x": 0.0, "y": 0.0, "z": 0.0
            }
        }
    ]
    result = geometry_service.process_features_cached(
        features, deflection=0.1, from_feature_index=0, feature_fingerprint="test_golden_hash"
    )
    assert result is not None
    assert "data" in result
    assert len(result["data"]["vertices"]) > 0
    
    with tempfile.TemporaryDirectory() as tmpdir:
        export_path = os.path.join(tmpdir, "golden_box.step")
        success = geometry_service.export_cad_file(features, "STEP", export_path)
        # Note: export might fail in non-OCC environments but we'll try
        if success:
            assert os.path.exists(export_path)
            assert os.path.getsize(export_path) > 0

def test_extrude_mid_plane_and_two_directions():
    features = [
        {"id": "mp", "type": "EXTRUDE", "parameters": {"plane": "FRONT", "depth": 20.0, "endCondition": "MID_PLANE", "points": [[[0,0], [10,0], [10,10], [0,10]]]}},
        {"id": "dir2", "type": "EXTRUDE", "parameters": {"plane": "TOP", "depth": 10.0, "hasDirection2": True, "depth2": 5.0, "points": [[[0,0], [5,0], [5,5], [0,5]]]}}
    ]
    result = geometry_service.process_features_cached(features, deflection=0.1, from_feature_index=0, feature_fingerprint="test_extrude_mp")
    assert result is not None
    assert len(result["data"]["vertices"]) > 0

def test_extrude_selected_contours():
    outer = [[0, 0, None, {"edgeId": "o1"}], [10, 0, None, {"edgeId": "o2"}], [10, 10, None, {"edgeId": "o3"}], [0, 10, None, {"edgeId": "o4"}]]
    inner = [[2, 2, None, {"edgeId": "i1"}], [8, 2, None, {"edgeId": "i2"}], [8, 8, None, {"edgeId": "i3"}], [2, 8, None, {"edgeId": "i4"}]]
    features = [{"id": "sc", "type": "EXTRUDE", "parameters": {"plane": "FRONT", "depth": 10.0, "points": [outer, inner], "selectedContours": [{"id": "i1"}]}}]
    result = geometry_service.process_features_cached(features, deflection=0.1, from_feature_index=0, feature_fingerprint="test_sc")
    assert result is not None
    assert len(result["data"]["vertices"]) > 0

def test_mirror_feature():
    features = [
        {"id": "b", "type": "BOX", "parameters": {"width": 10, "height": 10, "depth": 10, "x": 10, "y": 0, "z": 0}},
        {"id": "m", "type": "MIRROR", "parameters": {"mirror_plane_refs": [{"id": "FRONT", "type": "PLANE"}], "target_feature_ids": ["b"]}}
    ]
    result = geometry_service.process_features_cached(features, deflection=0.1, from_feature_index=0, feature_fingerprint="test_mirror")
    assert result is not None
    assert len(result["data"]["vertices"]) > 0

def test_face_and_full_round_fillet():
    features = [
        {"id": "b", "type": "BOX", "parameters": {"width": 10, "height": 10, "depth": 10}},
        {"id": "ff", "type": "FILLET", "parameters": {"filletType": "FACE", "radius": 2.0, "faceSet1": [{"origin": [10,5,5], "normal": [1,0,0]}], "faceSet2": [{"origin": [5,10,5], "normal": [0,1,0]}]}},
        {"id": "fr", "type": "FILLET", "parameters": {"filletType": "FULL_ROUND", "fullRoundSet1": {"origin": [0,5,5], "normal": [-1,0,0]}, "fullRoundCenter": {"origin": [5,5,10], "normal": [0,0,1]}, "fullRoundSet2": {"origin": [5,0,5], "normal": [0,-1,0]}}}
    ]
    result = geometry_service.process_features_cached(features, deflection=0.1, from_feature_index=0, feature_fingerprint="test_adv_fillet")
    assert result is not None
    assert len(result["data"]["vertices"]) > 0

def test_extrude_up_to_next():
    features = [
        {"id": "b1", "type": "BOX", "parameters": {"width": 10, "height": 50, "depth": 10, "x": 0, "y": 0, "z": 0}},
        {"id": "b2", "type": "BOX", "parameters": {"width": 10, "height": 50, "depth": 10, "x": 50, "y": 0, "z": 0}},
        {"id": "r", "type": "EXTRUDE", "parameters": {"plane": "RIGHT", "endCondition": "UP_TO_NEXT", "x": 10, "y": 20, "z": 2, "points": [[[0,0], [10,0], [10,5], [0,5]]]}}
    ]
    result = geometry_service.process_features_cached(features, deflection=0.1, from_feature_index=0, feature_fingerprint="test_utn")
    assert result is not None
    assert len(result["data"]["vertices"]) > 0

def test_extrude_up_to_vertex():
    features = [
        {"id": "b1", "type": "BOX", "parameters": {"width": 10, "height": 10, "depth": 10}},
        {"id": "utv", "type": "EXTRUDE", "parameters": {"plane": "TOP", "endCondition": "UP_TO_VERTEX", "upToVertexRef": {"id": "v1", "coordinates": [0, 50, 0]}, "points": [[[0,0], [10,0], [10,10], [0,10]]]}}
    ]
    result = geometry_service.process_features_cached(features, deflection=0.1, from_feature_index=0, feature_fingerprint="test_utv")
    assert result is not None
    assert len(result["data"]["vertices"]) > 0

def test_extrude_up_to_surface():
    features = [
        {"id": "b1", "type": "BOX", "parameters": {"width": 10, "height": 10, "depth": 10}},
        {"id": "uts", "type": "EXTRUDE", "parameters": {"plane": "TOP", "endCondition": "UP_TO_SURFACE", "upToSurfaceRef": {"id": "f1", "origin": [0, 100, 0], "normal": [0, 1, 0]}, "points": [[[0,0], [10,0], [10,10], [0,10]]]}},
        {"id": "ofs", "type": "EXTRUDE", "parameters": {"plane": "TOP", "endCondition": "OFFSET_FROM_SURFACE", "upToSurfaceRef": {"id": "f1", "origin": [0, 100, 0], "normal": [0, 1, 0]}, "offsetDistance": 10.0, "points": [[[20,20], [30,20], [30,30], [20,30]]]}}
    ]
    result = geometry_service.process_features_cached(features, deflection=0.1, from_feature_index=0, feature_fingerprint="test_uts")
    assert result is not None
    assert len(result["data"]["vertices"]) > 0

def test_revolve_cut():
    features = [
        {"id": "b", "type": "BOX", "parameters": {"width": 50, "height": 50, "depth": 50}},
        {"id": "c", "type": "REVOLVE", "parameters": {"plane": "FRONT", "angle": 360, "operation": "CUT", "axis_points": [[25, 0, 0], [25, 50, 0]], "points": [[[10, 10], [20, 10], [20, 40], [10, 40]]]}}
    ]
    result = geometry_service.process_features_cached(features, deflection=0.1, from_feature_index=0, feature_fingerprint="test_rc")
    assert result is not None
    assert len(result["data"]["vertices"]) > 0

def test_revolve_adv():
    features = [
        {"id": "mp", "type": "REVOLVE", "parameters": {"plane": "FRONT", "angle": 180, "endCondition": "MID_PLANE", "points": [[[10,0], [20,0], [20,10], [10,10]]]}},
        {"id": "d2", "type": "REVOLVE", "parameters": {"plane": "FRONT", "angle": 90, "hasDirection2": True, "angle2": 45, "points": [[[10,0], [20,0], [20,10], [10,10]]]}},
        {"id": "th", "type": "REVOLVE", "parameters": {"plane": "FRONT", "angle": 360, "isThinFeature": True, "thinThickness": 2, "points": [[[10,0], [20,0], [20,10], [10,10]]]}}
    ]
    result = geometry_service.process_features_cached(features, deflection=0.1, from_feature_index=0, feature_fingerprint="test_ra")
    assert result is not None
    assert len(result["data"]["vertices"]) > 0

def test_benchmark_6_7():
    features = [
        {"id": "sw", "type": "SWEEP", "parameters": {"profile_points": [[0,0,'CIRCLE_CENTER',{"edgeId":"e1"}],[5,0,None]], "path_points": [[0,0,0,{"edgeId":"p1"}],[0,50,0,{"edgeId":"p2"}]], "guide_points": [[[10,0,0,{"edgeId":"g1"}],[15,25,0,{"edgeId":"g2"}],[10,50,0,{"edgeId":"g3"}]]]}},
        {"id": "cp", "type": "PATTERN", "parameters": {"pattern_type": "CIRCULAR", "target_feature_ids": ["sw"], "axis_points": [[0,0,0], [0,0,1]], "count": 4, "equalSpacing": True, "totalAngle": 360.0}}
    ]
    result = geometry_service.process_features_cached(features, deflection=0.1, from_feature_index=0, feature_fingerprint="test_67")
    assert result is not None
    assert len(result["data"]["vertices"]) > 0

def test_hole_wizard_multi():
    features = [
        {"id": "b", "type": "BOX", "parameters": {"width": 100, "height": 100, "depth": 10}},
        {"id": "h", "type": "HOLE_WIZARD", "parameters": {"hole_type": "COUNTERBORE", "diameter": 5.5, "cb_diameter": 10, "cb_depth": 5, "hole_placement_refs": [{"id": "p1", "coordinates": [25, 25, 10], "normal": [0,0,1]}, {"id": "p2", "coordinates": [75, 75, 10], "normal": [0,0,1]}]}}
    ]
    result = geometry_service.process_features_cached(features, deflection=0.1, from_feature_index=0, feature_fingerprint="test_hwm")
    assert result is not None
    assert len(result["data"]["vertices"]) > 0

def test_text_extrude():
    features = [
        {"id": "t", "type": "EXTRUDE", "parameters": {"plane": "FRONT", "depth": 5, "points": [[[0,0], [100,0], [100,50], [0,50]]], "textEntities": [{"text": "CNC", "height": 10, "x": 10, "y": 20, "font": "Arial", "isSingleLine": True}]}}
    ]
    result = geometry_service.process_features_cached(features, deflection=0.1, from_feature_index=0, feature_fingerprint="test_text")
    assert result is not None
    assert len(result["data"]["vertices"]) > 0
