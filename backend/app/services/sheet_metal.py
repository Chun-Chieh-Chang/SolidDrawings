"""
Sheet Metal module — forming tool geometry generation.
Extracted from geometry_service.py for modularity.
"""

import uuid

# Global flags
HAS_OCC = False

# Cache for forming tool shapes
_FORMING_TOOL_SHAPE_CACHE: dict[str, object] = {}
_FORMING_TOOL_CACHE_MAX = 64

# Try loading OpenCASCADE
try:
    from OCC.Core.gp import gp_Pnt, gp_Vec, gp_Trsf
    from OCC.Core.BRepPrimAPI import BRepPrimAPI_MakeBox, BRepPrimAPI_MakeSphere
    from OCC.Core.BRepAlgoAPI import BRepAlgoAPI_Cut, BRepAlgoAPI_Fuse
    from OCC.Core.BRepBuilderAPI import BRepBuilderAPI_Transform
    HAS_OCC = True
except ImportError:
    HAS_OCC = False


def _make_louver(width: float, height: float, depth: float, radius: float,
                 angle: float, thickness: float):
    """
    Louver: a raised slot with angled ends.
    - width: longitudinal length of the louver
    - height: width of the louver opening
    - depth: how far it protrudes from the face
    - angle: opening angle in degrees
    """
    base = BRepPrimAPI_MakeBox(gp_Pnt(0, 0, 0), width, height, depth).Shape()
    cutter = BRepPrimAPI_MakeBox(
        gp_Pnt(-0.1, -0.1, depth * 0.3),
        width + 0.2, height * 0.6, depth * 1.2
    ).Shape()
    cut = BRepAlgoAPI_Cut(base, cutter)
    cut.Build()
    if cut.IsDone():
        return cut.Shape()
    return base


def _make_lance(width: float, height: float, depth: float, angle: float,
                thickness: float):
    """
    Lance: a tab cut on 3 sides and bent upward.
    """
    base = BRepPrimAPI_MakeBox(gp_Pnt(0, 0, 0), width, height, depth).Shape()
    cut_wedge = BRepPrimAPI_MakeBox(
        gp_Pnt(width * 0.15, -0.1, depth * 0.2),
        width * 0.7, height * 0.5, depth
    ).Shape()
    cut = BRepAlgoAPI_Cut(base, cut_wedge)
    cut.Build()
    if cut.IsDone():
        return cut.Shape()
    return base


def _make_bridge(width: float, height: float, depth: float, radius: float,
                 thickness: float):
    """
    Bridge: a raised tab with both ends attached.
    """
    body = BRepPrimAPI_MakeBox(gp_Pnt(0, 0, 0), width, height, depth).Shape()
    side_cut_left = BRepPrimAPI_MakeBox(
        gp_Pnt(-0.1, -0.1, -0.1),
        width * 0.25 + 0.2, height + 0.2, depth + 0.2
    ).Shape()
    side_cut_right = BRepPrimAPI_MakeBox(
        gp_Pnt(width * 0.75, -0.1, -0.1),
        width * 0.25 + 0.2, height + 0.2, depth + 0.2
    ).Shape()
    body = BRepAlgoAPI_Cut(body, side_cut_left)
    body.Build()
    if body.IsDone():
        body = BRepAlgoAPI_Cut(body.Shape(), side_cut_right)
        body.Build()
        if body.IsDone():
            return body.Shape()
    return BRepPrimAPI_MakeBox(gp_Pnt(0, 0, 0), width, height, depth).Shape()


def _make_dimple(width: float, height: float, depth: float, radius: float,
                 thickness: float):
    """
    Dimple: an embossed spherical indentation on the face.
    """
    base = BRepPrimAPI_MakeBox(gp_Pnt(0, 0, 0), width, height, thickness).Shape()
    sphere_radius = min(width, height, depth * 2) * 0.4
    sphere = BRepPrimAPI_MakeSphere(
        gp_Pnt(width / 2, height / 2, thickness), sphere_radius
    ).Shape()
    fuse = BRepAlgoAPI_Fuse(base, sphere)
    fuse.Build()
    if fuse.IsDone():
        return fuse.Shape()
    return base


def _make_drawn_cutout(width: float, height: float, depth: float, radius: float,
                        thickness: float):
    """
    Drawn Cutout: a cutout with a flanged edge.
    """
    outer = BRepPrimAPI_MakeBox(gp_Pnt(0, 0, 0), width, height, depth).Shape()
    inset = thickness * 2
    inner = BRepPrimAPI_MakeBox(
        gp_Pnt(inset, inset, -0.1),
        width - 2 * inset, height - 2 * inset, depth + 0.2
    ).Shape()
    cut = BRepAlgoAPI_Cut(outer, inner)
    cut.Build()
    if cut.IsDone():
        return cut.Shape()
    return outer


def generate_forming_tool(
    tool_type: str,
    width: float = 10.0,
    height: float = 10.0,
    depth: float = 5.0,
    radius: float = 1.0,
    angle: float = 45.0,
    thickness: float = 1.0,
    direction: str = 'OUTSIDE',
) -> str:
    """
    Generate a forming tool shape (Louver, Lance, Bridge, Dimple, Drawn Cutout).

    Returns a hash key for cache lookup during rebuild.
    """
    if not HAS_OCC:
        raise RuntimeError("OpenCASCADE is not available")

    try:
        width = max(width, 1.0)
        height = max(height, 1.0)
        depth = max(0.5, depth)
        radius = max(0.1, radius)
        thickness = max(0.1, thickness)

        tool_map = {
            'LOUVER': _make_louver,
            'LANCE': _make_lance,
            'BRIDGE': _make_bridge,
            'DIMPLE': _make_dimple,
            'DRAWN_CUTOUT': _make_drawn_cutout,
        }

        builder = tool_map.get(tool_type, _make_louver)
        tool_shape = builder(width, height, depth, radius, angle, thickness)

        if not tool_shape or tool_shape.IsNull():
            tool_shape = BRepPrimAPI_MakeBox(
                gp_Pnt(0, 0, 0), width, height, depth
            ).Shape()

        if direction == 'OUTSIDE':
            trsf = gp_Trsf()
            trsf.SetTranslation(gp_Vec(0.0, 0.0, 0.0))
            tool_shape = BRepBuilderAPI_Transform(tool_shape, trsf).Shape()

        shape_hash = str(uuid.uuid4())
        _FORMING_TOOL_SHAPE_CACHE[shape_hash] = tool_shape
        if len(_FORMING_TOOL_SHAPE_CACHE) > _FORMING_TOOL_CACHE_MAX:
            oldest = next(iter(_FORMING_TOOL_SHAPE_CACHE))
            del _FORMING_TOOL_SHAPE_CACHE[oldest]

        return shape_hash

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise RuntimeError(f"Forming tool generation ({tool_type}) failed: {e}")
