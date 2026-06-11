import sys
import os
import math

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../backend')))

from app.services import geometry_service

def test_sweep_twist_degrees():
    print("--- Testing Sweep with Twist - Degrees ---")
    path_points = [
        [0, 0, 0],
        [0, 0, 50]
    ]
    profile_points = [
        [-5, -5, 0],
        [5, -5, 0],
        [5, 5, 0],
        [-5, 5, 0],
        [-5, -5, 0]
    ]
    
    features = [
        {
            "id": "sweep_twist_deg",
            "type": "SWEEP",
            "parameters": {
                "profile_points": profile_points,
                "path_points": path_points,
                "operation": "ADD",
                "twistType": "DEGREES",
                "twistValue": 360.0
            }
        }
    ]
    
    result = geometry_service.process_features_cached(features)
    assert result is not None and "data" in result, "Rebuild failed"
    data = result.get("data", {})
    assert len(data.get("vertices", [])) > 0 or len(data.get("position", [])) > 0
    print("SUCCESS: Sweep Twist (Degrees) Success!")

def test_sweep_twist_turns_thin():
    print("--- Testing Thin Sweep with Twist - Turns ---")
    path_points = [
        [0, 0, 0],
        [0, 0, 50]
    ]
    profile_points = [
        [-5, -5, 0],
        [5, -5, 0],
        [5, 5, 0],
        [-5, 5, 0],
        [-5, -5, 0]
    ]
    
    features = [
        {
            "id": "sweep_twist_turns",
            "type": "SWEEP",
            "parameters": {
                "profile_points": profile_points,
                "path_points": path_points,
                "operation": "ADD",
                "isThin": True,
                "thinThickness": 1.0,
                "thinDirection": "ONE_DIRECTION",
                "twistType": "TURNS",
                "twistValue": 2.5
            }
        }
    ]
    
    result = geometry_service.process_features_cached(features)
    assert result is not None and "data" in result, "Rebuild failed"
    data = result.get("data", {})
    assert len(data.get("vertices", [])) > 0 or len(data.get("position", [])) > 0
    print("SUCCESS: Thin Sweep Twist (Turns) Success!")

if __name__ == "__main__":
    test_sweep_twist_degrees()
    test_sweep_twist_turns_thin()
