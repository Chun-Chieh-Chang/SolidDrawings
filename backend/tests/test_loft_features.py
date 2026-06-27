import math
import sys
import os

import pytest

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.services.geometry_service import process_features, HAS_OCC

pytestmark = pytest.mark.skipif(not HAS_OCC, reason="OpenCASCADE not available")

def test_loft_solid_and_thin():
    # Define two square profiles at different heights
    p1 = [[-20,-10,0], [20,-10,0], [20,10,0], [-20,10,0], [-20,-10,0]]
    p2 = [[-10,-5,50], [10,-5,50], [10,5,50], [-10,5,50], [-10,-5,50]]

    # 1. Test basic Loft (ADD)
    features_solid = [
        {
            "id": "loft_solid",
            "type": "LOFT",
            "parameters": {
                "operation": "ADD",
                "profiles": [p1, p2],
                "startConstraint": "NORMAL_TO_PROFILE",
                "startMagnitude": 1.5,
                "endConstraint": "NONE"
            }
        }
    ]

    res_solid = process_features(features_solid)
    assert res_solid is not None
    assert res_solid.get('type') == 'mesh'
    data = res_solid.get('data', {})
    assert len(data.get('vertices', [])) > 0 or len(data.get('position', [])) > 0

    # 2. Test Thin Loft (Hollow)
    features_thin = [
        {
            "id": "loft_thin",
            "type": "LOFT",
            "parameters": {
                "operation": "ADD",
                "profiles": [p1, p2],
                "isThin": True,
                "thinThickness": 1.2
            }
        }
    ]

    res_thin = process_features(features_thin)
    assert res_thin is not None
    assert res_thin.get('type') == 'mesh'
    data_thin = res_thin.get('data', {})
    assert len(data_thin.get('vertices', [])) > 0 or len(data_thin.get('position', [])) > 0


def test_loft_cut():
    # Define a base box first, then cut a Loft through it
    features = [
        {
            "id": "base_box",
            "type": "BOX",
            "parameters": {
                "width": 50,
                "height": 50,
                "depth": 50,
                "x": 0,
                "y": 0,
                "z": 0
            }
        },
        {
            "id": "loft_cut",
            "type": "LOFT",
            "parameters": {
                "operation": "CUT",
                "profiles": [
                    [[-15,-15,10], [15,-15,10], [15,15,10], [-15,15,10], [-15,-15,10]],
                    [[-5,-5,40], [5,-5,40], [5,5,40], [-5,5,40], [-5,-5,40]]
                ]
            }
        }
    ]

    res = process_features(features)
    assert res is not None
    assert res.get('type') == 'mesh'
    data_cut = res.get('data', {})
    assert len(data_cut.get('vertices', [])) > 0 or len(data_cut.get('position', [])) > 0
