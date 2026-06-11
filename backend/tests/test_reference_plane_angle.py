import math
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.services.geometry_service import generate_reference_plane, process_features

def test_angle_reference_plane():
    # Define an axis edge (Z-axis) and a reference plane (pointing along +X)
    refs = [
        {
            "type": "EDGE",
            "edgeData": {
                "start": [0.0, 0.0, 0.0],
                "end": [0.0, 0.0, 10.0]
            }
        },
        {
            "type": "FACE",
            "normal": [1.0, 0.0, 0.0],
            "coordinates": [0.0, 0.0, 0.0]
        }
    ]

    # Rotate 90 degrees around Z axis. (1, 0, 0) should rotate to (0, 1, 0)
    res_90 = generate_reference_plane("ANGLE", refs, angle=90.0)
    assert res_90 is not None
    assert abs(res_90["normal"][0] - 0.0) < 1e-5
    assert abs(res_90["normal"][1] - 1.0) < 1e-5
    assert abs(res_90["normal"][2] - 0.0) < 1e-5

    # Rotate 45 degrees. Normal should be (cos(45), sin(45), 0)
    res_45 = generate_reference_plane("ANGLE", refs, angle=45.0)
    assert res_45 is not None
    assert abs(res_45["normal"][0] - math.cos(math.radians(45.0))) < 1e-5
    assert abs(res_45["normal"][1] - math.sin(math.radians(45.0))) < 1e-5
    assert abs(res_45["normal"][2] - 0.0) < 1e-5

def test_reference_plane_feature_rebuild():
    features = [
        {
            "id": "ref_plane_angle",
            "type": "REFERENCE_PLANE",
            "parameters": {
                "planeType": "ANGLE",
                "angle": 60.0,
                "refs": [
                    {
                        "type": "EDGE",
                        "edgeData": {
                            "start": [0,0,0],
                            "end": [0,0,20]
                        }
                    },
                    {
                        "type": "FACE",
                        "normal": [1,0,0],
                        "coordinates": [0,0,0]
                    }
                ]
            }
        }
    ]
    result = process_features(features)
    assert result is not None
    ref_geoms = result.get("ref_geometry", [])
    assert len(ref_geoms) == 1
    assert ref_geoms[0]["id"] == "ref_plane_angle"
    assert ref_geoms[0]["type"] == "PLANE"
    assert abs(ref_geoms[0]["data"]["normal"][0] - math.cos(math.radians(60.0))) < 1e-5
