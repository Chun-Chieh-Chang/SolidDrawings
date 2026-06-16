import sys
import os
import math

# Add backend to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../backend')))

from app.services import geometry_service

def test_circular_profile_sweep():
    print("--- Testing Circular Profile Sweep ---")
    
    # Path: straight line along Z-axis of length 50
    path_points = [
        [0, 0, 0],
        [0, 0, 50]
    ]
    
    features = [
        {
            "id": "sweep_feat",
            "type": "SWEEP",
            "parameters": {
                "circularProfile": True,
                "diameter": 10.0,
                "path_points": path_points,
                "operation": "ADD"
            }
        }
    ]
    
    result = geometry_service.process_features_cached(features)
    assert result is not None and "data" in result, "Rebuild failed"
    print("SUCCESS: Circular Profile Sweep Success!")

def test_thin_sweep():
    print("--- Testing Thin Sweep ---")
    
    # Path: straight line along Z-axis of length 50
    path_points = [
        [0, 0, 0],
        [0, 0, 50]
    ]
    
    features = [
        {
            "id": "thin_sweep_feat",
            "type": "SWEEP",
            "parameters": {
                "circularProfile": True,
                "diameter": 10.0,
                "path_points": path_points,
                "isThin": True,
                "thinThickness": 2.0,
                "thinDirection": "ONE_DIRECTION",
                "operation": "ADD"
            }
        }
    ]
    
    result = geometry_service.process_features_cached(features)
    assert result is not None and "data" in result, "Rebuild failed"
    print("SUCCESS: Thin Sweep Success!")

if __name__ == "__main__":
    try:
        test_circular_profile_sweep()
        test_thin_sweep()
        print("\nAll Sweep Tests Passed successfully!")
    except Exception as e:
        print(f"Test Failed with Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
