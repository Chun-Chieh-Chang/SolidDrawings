import sys, os
sys.path.append(os.path.join(os.getcwd(), 'backend'))
from app.services import geometry_service

print("=" * 60)
print("DIAGNOSTIC: Extrude Pipeline Health Check")
print("=" * 60)
print(f"\n1. HAS_OCC = {geometry_service.HAS_OCC}")

if not geometry_service.HAS_OCC:
    print("   WARNING: pythonocc-core / OCP not installed!")
    print("   All Extrude/Revolve/Boolean ops return mock mesh.")
else:
    print("   OK: OCP/OCCT is installed!")
    test_features = [{
        "id": "test_extrude", "type": "EXTRUDE",
        "parameters": {
            "plane": "FRONT", "depth": 10.0, "operation": "ADD",
            "points": [[0,0],[10,0],[10,10],[0,10],[0,0]]
        }
    }]
    try:
        result = geometry_service.process_features(test_features, deflection=0.01)
        if result:
            print(f"   Extrude succeeded! Type: {result.get('type')}")
            d = result.get('data', {})
            if isinstance(d, dict):
                print(f"   Mesh vertices: {len(d.get('vertices',[]))//3}")
        else:
            print("   Extrude returned None")
    except Exception as e:
        print(f"   Extrude FAILED: {e}")

print("\n" + "=" * 60)
from app.main import app
routes = [str(r.path) for r in app.routes]
print("3. Backend Routes:")
for r in sorted(routes):
    if 'geometry' in r or 'health' in r or 'rebuild' in r:
        print(f"   {r}")
