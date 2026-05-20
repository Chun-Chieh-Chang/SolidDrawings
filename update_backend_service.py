import os

file_path = r"C:\Users\3kids\Downloads\3D-Builder\backend\app\services\geometry_service.py"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Add missing imports for HLR
if "from OCC.Core.HLRBRep" not in content:
    content = """from OCC.Core.HLRBRep import HLRBRep_Algo, HLRBRep_HLRToShape
from OCC.Core.gp import gp_Ax2, gp_Dir, gp_Pnt, gp_Ax3
""" + content

# Add project_2d function
project_fn = """
def project_2d(features, plane_type='FRONT'):
    shape = build_shape_only(features)
    if not shape or shape.IsNull():
        return []

    # Simplified projection: extract edges and project them to 2D
    projected_lines = []
    explorer = TopExp_Explorer(shape, TopAbs_EDGE)
    while explorer.More():
        edge = topods.Edge(explorer.Current())
        v_exp = TopExp_Explorer(edge, TopAbs_VERTEX)
        pnts = []
        while v_exp.More():
            v = topods.Vertex(v_exp.Current())
            pt = BRep_Tool.Pnt(v)
            if plane_type == 'FRONT': u, v_val = pt.X(), pt.Y()
            elif plane_type == 'TOP': u, v_val = pt.X(), pt.Z()
            elif plane_type == 'RIGHT': u, v_val = pt.Y(), pt.Z()
            else: u, v_val = pt.X(), pt.Y()
            pnts.append([u, v_val])
            v_exp.Next()
        if len(pnts) >= 2:
            projected_lines.append(pnts)
        explorer.Next()
    
    return projected_lines
"""

if "def project_2d" not in content:
    content += project_fn

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("geometry_service.py updated with project_2d")
