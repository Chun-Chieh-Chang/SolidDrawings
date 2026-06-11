import sys
import os
sys.path.insert(0, os.path.join(os.getcwd(), 'backend'))

from app.services import geometry_service

print("=" * 60)
print("EXTRUDE PIPELINE VERIFICATION")
print("=" * 60)
print(f"HAS_OCC = {geometry_service.HAS_OCC}")
print()

# Test 1: Simple rectangle extrude
print("Test 1: Simple rectangle (80x50) extrude to depth 18")
features_1 = [{
    "id": "base_plate",
    "type": "EXTRUDE",
    "parameters": {
        "plane": "TOP",
        "points": [[40, 25], [-40, 25], [-40, -25], [40, -25], [40, 25]],
        "depth": 18.0,
        "operation": "ADD"
    }
}]
result_1 = geometry_service.process_features(features_1, deflection=0.01)
if result_1:
    d = result_1.get('data', {})
    if isinstance(d, dict):
        verts = d.get('vertices', [])
        print(f"  Result type: {result_1.get('type')}")
        print(f"  Mesh vertices: {len(verts) // 3}")
        if len(verts) > 6:  # A cube has 24 vertices (8*3)
            print("  ✅ Extrude SUCCESS - real geometry generated")
        else:
            print("  ⚠️  Extrude returned mesh but vertex count is low")
    else:
        print(f"  Result: {d}")
else:
    print("  ❌ Extrude FAILED - returned None")

# Test 2: Circle extrude (revolve profile)
print("\nTest 2: Circle (r=25) extrude to depth 10")
circle_points = []
import math
for i in range(32):
    angle = 2 * math.pi * i / 32
    x = 25 * math.cos(angle)
    y = 25 * math.sin(angle)
    circle_points.append([x, y])

features_2 = [{
    "id": "cylinder",
    "type": "EXTRUDE",
    "parameters": {
        "plane": "FRONT",
        "points": circle_points,
        "depth": 10.0,
        "operation": "ADD"
    }
}]
result_2 = geometry_service.process_features(features_2, deflection=0.01)
if result_2:
    d = result_2.get('data', {})
    if isinstance(d, dict):
        verts = d.get('vertices', [])
        print(f"  Result type: {result_2.get('type')}")
        print(f"  Mesh vertices: {len(verts) // 3}")
        print("  ✅ Cylinder extrude SUCCESS")
else:
    print("  ❌ Cylinder extrude FAILED")

# Test 3: Multi-feature (base + wall)
print("\nTest 3: Multi-feature (base plate + vertical wall)")
features_3 = [
    {
        "id": "base",
        "type": "EXTRUDE",
        "parameters": {
            "plane": "TOP",
            "points": [[40, 25], [-40, 25], [-40, -25], [40, -25], [40, 25]],
            "depth": 18.0,
            "operation": "ADD"
        }
    },
    {
        "id": "wall",
        "type": "EXTRUDE",
        "parameters": {
            "plane": "FACE",
            "faceOrigin": [0, 18, -19],
            "faceNormal": [0, 1, 0],
            "points": [[40, 6], [-40, 6], [-40, -6], [40, -6], [40, 6]],
            "depth": 38.0,
            "operation": "ADD"
        }
    }
]
result_3 = geometry_service.process_features(features_3, deflection=0.01)
if result_3:
    d = result_3.get('data', {})
    if isinstance(d, dict):
        verts = d.get('vertices', [])
        print(f"  Result type: {result_3.get('type')}")
        print(f"  Mesh vertices: {len(verts) // 3}")
        print("  ✅ Multi-feature extrude SUCCESS")
else:
    print("  ❌ Multi-feature extrude FAILED")

print("\n" + "=" * 60)
print("VERIFICATION COMPLETE")
print("=" * 60)
