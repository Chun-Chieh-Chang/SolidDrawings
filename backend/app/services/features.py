"""
Features module — primitive and advanced feature generation (box, cylinder, sphere, rib, split, combine).
Extracted from geometry_service.py for modularity.
"""

import uuid

# Global flags
HAS_OCC = False

# Try loading OpenCASCADE
try:
    from OCC.Core.gp import gp_Pnt, gp_Dir, gp_Vec, gp_Pln
    from OCC.Core.BRepBuilderAPI import BRepBuilderAPI_MakeEdge, BRepBuilderAPI_MakeWire, BRepBuilderAPI_MakeFace
    from OCC.Core.BRepPrimAPI import BRepPrimAPI_MakeBox, BRepPrimAPI_MakeCylinder, BRepPrimAPI_MakeSphere, BRepPrimAPI_MakePrism
    from OCC.Core.BRepAlgoAPI import BRepAlgoAPI_Fuse, BRepAlgoAPI_Cut, BRepAlgoAPI_Common, BRepAlgoAPI_Split, BRepAlgoAPI_Section
    HAS_OCC = True
except ImportError:
    HAS_OCC = False

# Shared cache imported from surfacing (safe — no circular dep)
from .surfacing import _SURFACE_SHAPE_CACHE


# ── Section View ─────────────────────────────────────────────────────────────


def generate_section_view(features, cut_plane, plane_type="FRONT"):
    """
    Generate a 2D section view by cutting a 3D model with a plane and projecting
    the result using HLR (Hidden Line Removal).

    Args:
        features: Feature list for build_shape_only
        cut_plane: dict with 'origin' [x,y,z] and 'normal' [x,y,z]
        plane_type: View orientation for the 2D projection ('FRONT','TOP','RIGHT','ISO')

    Returns:
        dict with keys:
          - visible_lines: list of {"points":[[u,v],...], "visible": true}
          - hidden_lines: list of {"points":[[u,v],...], "visible": false}
          - section_fill: list of {"points":[[u,v],...]} — fill polygons for hatching
          - section_line: {"u1":n,"v1":n,"u2":n,"v2":n} — cutting line in 2D view space
    """
    if not HAS_OCC:
        return {"visible_lines": [], "hidden_lines": [], "section_fill": [], "section_line": None}

    from geometry_service import build_shape_only

    # Lazy-import HLR and explorer classes
    from OCC.Core.HLRBRep import HLRBRep_Algo, HLRBRep_HLRToShape
    from OCC.Core.HLRAlgo import HLRAlgo_Projector
    from OCC.Core.gp import gp_Ax2, gp_Dir as GpDir
    from OCC.Core.BRepAdaptor import BRepAdaptor_Curve as BRepCurve
    from OCC.Core.TopExp import TopExp_Explorer
    from OCC.Core.TopAbs import TopAbs_EDGE
    from OCC.Core.TopoDS import topods

    try:
        shape = build_shape_only(features)
        if not shape or shape.IsNull():
            return {"visible_lines": [], "hidden_lines": [], "section_fill": [], "section_line": None}

        # Build the cutting plane
        p_ori = cut_plane.get("origin", [0, 0, 0])
        p_norm = cut_plane.get("normal", [0, 0, 1])
        plane = gp_Pln(gp_Pnt(*p_ori), gp_Dir(*p_norm))
        cut_face = BRepBuilderAPI_MakeFace(plane, -10000, 10000, -10000, 10000).Face()

        # Cut the shape — keep the half in front of the cutting plane
        cut_result = BRepAlgoAPI_Cut(shape, cut_face)
        cut_result.Build()
        if not cut_result.IsDone():
            return {"visible_lines": [], "hidden_lines": [], "section_fill": [], "section_line": None}

        clipped_shape = cut_result.Shape()
        if clipped_shape.IsNull():
            clipped_shape = shape

        # Extract section profile (intersection of cutting plane with shape)
        section_tool = BRepAlgoAPI_Section(shape, plane, True)
        section_tool.Build()
        section_edges = []
        if section_tool.IsDone():
            sec_shape = section_tool.Shape()
            if sec_shape and not sec_shape.IsNull():
                exp = TopExp_Explorer(sec_shape, TopAbs_EDGE)
                while exp.More():
                    e = topods.Edge(exp.Current())
                    adaptor = BRepCurve(e)
                    pnts = []
                    n_samples = 12
                    for i in range(n_samples + 1):
                        t = adaptor.FirstParameter() + (adaptor.LastParameter() - adaptor.FirstParameter()) * i / n_samples
                        p = adaptor.Value(t)
                        u, v = _map_point_to_2d(p.X(), p.Y(), p.Z(), plane_type)
                        pnts.append([u, v])
                    section_edges.append({"points": pnts})
                    exp.Next()

        # Project the clipped shape to 2D using HLR

        # Camera orientation
        eye = GpDir(0, 0, 1)
        up = GpDir(0, 1, 0)
        if plane_type == "FRONT":
            eye = GpDir(0, 0, 1); up = GpDir(0, 1, 0)
        elif plane_type == "TOP":
            eye = GpDir(0, 1, 0); up = GpDir(0, 0, -1)
        elif plane_type == "RIGHT":
            eye = GpDir(1, 0, 0); up = GpDir(0, 1, 0)
        elif plane_type == "ISO":
            eye = GpDir(1, 1, 1); up = GpDir(0, 1, 0)

        projector = HLRAlgo_Projector(gp_Ax2(gp_Pnt(0, 0, 0), eye, up))
        hlr = HLRBRep_Algo()
        hlr.Add(clipped_shape)
        hlr.Projector(projector)
        hlr.Update()
        hlr.Hide()

        hlr_shapes = HLRBRep_HLRToShape(hlr)

        visible_lines = []
        hidden_lines = []

        def extract_hlr(source_shape, is_visible, target_list):
            if source_shape is None or source_shape.IsNull():
                return
            exp = TopExp_Explorer(source_shape, TopAbs_EDGE)
            while exp.More():
                e = topods.Edge(exp.Current())
                adaptor = BRepCurve(e)
                pnts = []
                n_samples = 10
                for i in range(n_samples + 1):
                    t = adaptor.FirstParameter() + (adaptor.LastParameter() - adaptor.FirstParameter()) * i / n_samples
                    p = adaptor.Value(t)
                    u, v = _map_point_to_2d(p.X(), p.Y(), p.Z(), plane_type)
                    pnts.append([u, v])
                target_list.append({"points": pnts, "visible": is_visible})
                exp.Next()

        extract_hlr(hlr_shapes.VCompound(), True, visible_lines)
        extract_hlr(hlr_shapes.OutLineVCompound(), True, visible_lines)
        extract_hlr(hlr_shapes.HCompound(), False, hidden_lines)
        extract_hlr(hlr_shapes.OutLineHCompound(), False, hidden_lines)

        # Compute section line in 2D view space (for the UI cutting line)
        section_line = None
        if len(p_ori) >= 3 and len(p_norm) >= 3:
            # Project two points on the cutting plane to get the 2D line
            p1 = _map_point_to_2d(p_ori[0], p_ori[1], p_ori[2], plane_type)
            # Second point along the plane
            p2 = _map_point_to_2d(
                p_ori[0] + p_norm[1] * 10,
                p_ori[1] + p_norm[2] * 10,
                p_ori[2] + p_norm[0] * 10,
                plane_type,
            )
            section_line = {"u1": p1[0], "v1": p1[1], "u2": p2[0], "v2": p2[1]}

        return {
            "visible_lines": visible_lines,
            "hidden_lines": hidden_lines,
            "section_fill": section_edges,
            "section_line": section_line,
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"visible_lines": [], "hidden_lines": [], "section_fill": [], "section_line": None}


def _map_point_to_2d(x, y, z, plane_type):
    """Map a 3D point to 2D view coordinates based on plane type."""
    if plane_type == "FRONT":
        return [x, y]
    elif plane_type == "TOP":
        return [x, -z]
    elif plane_type == "RIGHT":
        return [z, y]
    elif plane_type == "ISO":
        u = (x - z) * 0.707106781
        v = y - (x + z) * 0.35355339
        return [u, v]
    else:
        return [x, y]


# ── Primitive Shapes ───────────────────────────────────────────────────────────


def generate_box(width, height, depth):
    if not HAS_OCC:
        from geometry_service import make_mock_box_mesh
        return {"type": "mesh", "data": make_mock_box_mesh(width, height, depth)}
    from geometry_service import _shape_to_mesh
    box = BRepPrimAPI_MakeBox(width, height, depth).Shape()
    return {"type": "mesh", "data": _shape_to_mesh(box)}


def generate_cylinder(radius, height):
    if not HAS_OCC:
        from geometry_service import make_mock_cylinder_mesh
        return {"type": "mesh", "data": make_mock_cylinder_mesh(radius, height)}
    from geometry_service import _shape_to_mesh
    cylinder = BRepPrimAPI_MakeCylinder(radius, height).Shape()
    return {"type": "mesh", "data": _shape_to_mesh(cylinder)}


def generate_sphere(radius):
    if not HAS_OCC:
        from geometry_service import make_mock_sphere_mesh
        return {"type": "mesh", "data": make_mock_sphere_mesh(radius)}
    from geometry_service import _shape_to_mesh
    sphere = BRepPrimAPI_MakeSphere(radius).Shape()
    return {"type": "mesh", "data": _shape_to_mesh(sphere)}


# ── Advanced Features ──────────────────────────────────────────────────────────


def generate_rib(features, thickness=2.0, direction="BOTH"):
    """
    Generate a Rib feature by extruding an open sketch profile with thickness.
    Maps to the RIB type in the rebuild pipeline.
    """
    if not HAS_OCC:
        return str(uuid.uuid4())

    try:
        from geometry_service import build_shape_only

        shape = build_shape_only(features)
        if not shape or shape.IsNull():
            return str(uuid.uuid4())

        # Find the sketch profile among features
        sketch_pts = []
        for f in features:
            if isinstance(f, dict) and f.get('type') == 'SKETCH':
                fp = f.get('parameters', {})
                pts = fp.get('points', [])
                if pts:
                    sketch_pts = pts
                break

        if not sketch_pts:
            return str(uuid.uuid4())

        # Build edge from sketch points
        pnts = [gp_Pnt(*p) for p in sketch_pts[:2]]
        edge = BRepBuilderAPI_MakeEdge(pnts[0], pnts[1]).Edge()
        wire = BRepBuilderAPI_MakeWire(edge).Wire()

        # Create a thick prism for the rib
        rib_dir = gp_Vec(0, 0, thickness) if direction == "BOTH" else gp_Vec(0, 0, thickness / 2)
        rib_shape = BRepPrimAPI_MakePrism(wire, rib_dir).Shape()

        shape_hash = str(uuid.uuid4())
        _SURFACE_SHAPE_CACHE[shape_hash] = rib_shape
        return shape_hash
    except Exception as e:
        import traceback
        traceback.print_exc()
        return str(uuid.uuid4())


def generate_split(features, split_plane):
    """
    Split a solid body using a plane. Uses OCC BRepAlgoAPI_Split.
    """
    if not HAS_OCC:
        return str(uuid.uuid4())

    try:
        from geometry_service import build_shape_only

        shape = build_shape_only(features)
        if not shape or shape.IsNull():
            return str(uuid.uuid4())

        # Build split plane from the provided point + normal
        pt = split_plane.get('point', [0, 0, 0])
        normal = split_plane.get('normal', [0, 0, 1])
        pnt = gp_Pnt(*pt)
        nrm = gp_Dir(*normal)
        plane = gp_Pln(pnt, nrm)
        face = BRepBuilderAPI_MakeFace(plane, -1000, 1000, -1000, 1000).Face()

        # Perform split
        splitter = BRepAlgoAPI_Split(shape, face)
        splitter.Build()
        if splitter.IsDone():
            shape_hash = str(uuid.uuid4())
            _SURFACE_SHAPE_CACHE[shape_hash] = splitter.Shape()
            return shape_hash

        return str(uuid.uuid4())
    except Exception as e:
        import traceback
        traceback.print_exc()
        return str(uuid.uuid4())


def generate_combine(features, operation="ADD", tool_feature_id=None):
    """
    Combine two bodies using boolean operations: ADD (Fuse), SUBTRACT (Cut), INTERSECT (Common).
    """
    if not HAS_OCC:
        return str(uuid.uuid4())

    try:
        from geometry_service import build_shape_only, build_feature_shape_in_isolation

        shape = build_shape_only(features)
        if not shape or shape.IsNull():
            return str(uuid.uuid4())

        # Find the tool feature
        tool_feat = None
        for f in features:
            if isinstance(f, dict) and f.get('id') == tool_feature_id:
                tool_feat = f
                break

        if not tool_feat:
            return str(uuid.uuid4())

        tool_shape = build_feature_shape_in_isolation(
            tool_feat.get('type'), tool_feat.get('parameters', {}), None, features
        )
        if not tool_shape or tool_shape.IsNull():
            return str(uuid.uuid4())

        if operation == "SUBTRACT":
            result = BRepAlgoAPI_Cut(shape, tool_shape)
        elif operation == "INTERSECT":
            result = BRepAlgoAPI_Common(shape, tool_shape)
        else:  # ADD / Fuse
            result = BRepAlgoAPI_Fuse(shape, tool_shape)

        result.Build()
        if result.IsDone():
            shape_hash = str(uuid.uuid4())
            _SURFACE_SHAPE_CACHE[shape_hash] = result.Shape()
            return shape_hash

        return str(uuid.uuid4())
    except Exception as e:
        import traceback
        traceback.print_exc()
        return str(uuid.uuid4())
