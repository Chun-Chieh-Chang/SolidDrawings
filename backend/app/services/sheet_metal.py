"""
Sheet Metal module — forming tool geometry generation.
Extracted from geometry_service.py for modularity.
"""

import math
import uuid

# Global flags
HAS_OCC = False

# Cache for forming tool shapes
_FORMING_TOOL_SHAPE_CACHE: dict[str, object] = {}
_FORMING_TOOL_CACHE_MAX = 64

# Try loading OpenCASCADE
try:
    from OCC.Core.gp import gp_Pnt, gp_Vec, gp_Trsf, gp_Dir, gp_Ax1, gp_Ax2
    from OCC.Core.BRepPrimAPI import BRepPrimAPI_MakeBox, BRepPrimAPI_MakeSphere, BRepPrimAPI_MakePrism, BRepPrimAPI_MakeCylinder
    from OCC.Core.BRepAlgoAPI import BRepAlgoAPI_Cut, BRepAlgoAPI_Fuse
    from OCC.Core.BRepBuilderAPI import BRepBuilderAPI_Transform, BRepBuilderAPI_MakeEdge, BRepBuilderAPI_MakeWire, BRepBuilderAPI_MakeFace
    from OCC.Core.GC import GC_MakeArcOfCircle
    from OCC.Core.TopoDS import TopoDS_Shape
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


def _make_vent_hole(width: float, height: float, depth: float, radius: float,
                    thickness: float, pattern_type: str = 'CIRCULAR'):
    """
    Vent Hole: a pattern of ventilation holes on a sheet metal face.
    Supports CIRCULAR (round holes) and RECTANGULAR (slotted vents).
    """
    # Create a thin plate representing the vent feature
    vent_body = BRepPrimAPI_MakeBox(gp_Pnt(0, 0, 0), width, height, thickness * 0.5).Shape()
    
    if pattern_type == 'CIRCULAR':
        # Create circular holes using a cylinder cutter
        num_holes = max(2, int(min(width, height) / (radius * 2.5)))
        spacing_x = width / (num_holes + 1)
        spacing_y = height / (num_holes + 1)
        
        for i in range(num_holes):
            for j in range(num_holes):
                cx = spacing_x * (i + 1)
                cy = spacing_y * (j + 1)
                # Create cylinder as cutter
                axis = gp_Ax2(gp_Pnt(cx, cy, thickness), gp_Dir(0, 0, 1))
                cutter = BRepPrimAPI_MakeCylinder(axis, radius, thickness * 3).Shape()
                vent_body = BRepAlgoAPI_Cut(vent_body, cutter).Shape()
                vent_body.Build()
    
    elif pattern_type == 'RECTANGULAR':
        # Create rectangular slots
        num_slots = max(2, int(width / (height * 0.8)))
        slot_width = height * 0.6
        slot_length = width / (num_slots + 1)
        
        for i in range(num_slots):
            sx = spacing_x * (i + 1) if 'spacing_x' in dir() else i * slot_length
            # Create rectangular slot using a box cutter
            slot_cutter = BRepPrimAPI_MakeBox(
                gp_Pnt(sx - slot_length / 2, -0.1, -0.1),
                slot_length, slot_width + 0.2, thickness * 1.5
            ).Shape()
            vent_body = BRepAlgoAPI_Cut(vent_body, slot_cutter).Shape()
            vent_body.Build()
    
    return vent_body


def generate_venting(
    face_width: float = 50.0,
    face_height: float = 30.0,
    sheet_thickness: float = 1.0,
    hole_radius: float = 3.0,
    pattern_type: str = 'CIRCULAR',
) -> str:
    """
    Generate a venting feature (vent holes) on a sheet metal face.
    
    Args:
        face_width: Width of the vent area
        face_height: Height of the vent area
        sheet_thickness: Sheet metal thickness
        hole_radius: Radius of each vent hole
        pattern_type: 'CIRCULAR' or 'RECTANGULAR'
    
    Returns:
        Shape hash for cache lookup
    """
    if not HAS_OCC:
        raise RuntimeError("OpenCASCADE is not available")
    
    try:
        face_width = max(face_width, 10.0)
        face_height = max(face_height, 10.0)
        sheet_thickness = max(0.5, sheet_thickness)
        hole_radius = max(1.0, hole_radius)
        
        vent_shape = _make_vent_hole(
            face_width, face_height, face_height, hole_radius, sheet_thickness, pattern_type
        )
        
        if not vent_shape or vent_shape.IsNull():
            vent_shape = BRepPrimAPI_MakeBox(
                gp_Pnt(0, 0, 0), face_width, face_height, sheet_thickness
            ).Shape()
        
        shape_hash = str(uuid.uuid4())
        _FORMING_TOOL_SHAPE_CACHE[shape_hash] = vent_shape
        if len(_FORMING_TOOL_SHAPE_CACHE) > _FORMING_TOOL_CACHE_MAX:
            oldest = next(iter(_FORMING_TOOL_SHAPE_CACHE))
            del _FORMING_TOOL_SHAPE_CACHE[oldest]
        
        return shape_hash
    
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise RuntimeError(f"Venting generation ({pattern_type}) failed: {e}")


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
            'VENT_CIRCULAR': lambda w, h, d, r, a, t: _make_vent_hole(w, h, d, r, t, 'CIRCULAR'),
            'VENT_RECTANGULAR': lambda w, h, d, r, a, t: _make_vent_hole(w, h, d, r, t, 'RECTANGULAR'),
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


# ── Edge Flange caches ────────────────────────────────────────────────────────
_EDGE_FLANGE_SHAPE_CACHE: dict[str, object] = {}
_EDGE_FLANGE_CACHE_MAX = 64
_MITER_FLANGE_SHAPE_CACHE: dict[str, object] = {}
_MITER_FLANGE_CACHE_MAX = 64
_HEM_SHAPE_CACHE: dict[str, object] = {}
_HEM_CACHE_MAX = 64
_FLAT_PATTERN_SHAPE_CACHE: dict[str, object] = {}
_FLAT_PATTERN_CACHE_MAX = 16
_EDGE_DIRECTIONS = {'+X': 0, '-X': 1, '+Y': 2, '-Y': 3}


def _bend_allowance(angle_deg: float, radius: float, thickness: float, k_factor: float = 0.44) -> float:
    """Bend allowance per the standard K-factor formula."""
    return (math.pi / 180.0) * angle_deg * (radius + k_factor * thickness)


def _infer_flange_edge_dir(params: dict) -> str:
    """Heuristic: guess which edge (+X/-X/+Y/-Y) a flange is attached to."""
    edge_dir = params.get('edge_dir', '')
    if edge_dir in _EDGE_DIRECTIONS:
        return edge_dir
    return '+Y'


def generate_edge_flange(
    base_feature_id: str,
    edge_ref: str,
    flange_height: float,
    bend_radius: float,
    bend_angle: float,
    thickness: float,
    k_factor: float = 0.5,
    direction: str = 'OUTSIDE',
    relief_type: str = 'RECTANGULAR',
) -> str:
    """Generate a sheet metal edge flange feature using OpenCASCADE."""
    if not HAS_OCC:
        return str(uuid.uuid4())

    try:
        angle_rad = math.radians(bend_angle)
        flange_dir = gp_Dir(
            math.sin(angle_rad),
            0.0,
            math.cos(angle_rad) if direction == 'OUTSIDE' else -math.cos(angle_rad)
        )

        base_len = bend_radius + thickness
        flange_len = flange_height

        profile_wire_maker = BRepBuilderAPI_MakeWire()

        p0 = gp_Pnt(0.0, 0.0, 0.0)
        p1 = gp_Pnt(base_len, 0.0, 0.0)
        edge1 = BRepBuilderAPI_MakeEdge(p0, p1).Edge()
        profile_wire_maker.Add(edge1)

        arc_center = gp_Pnt(base_len, 0.0, 0.0)
        arc_start = gp_Pnt(base_len + bend_radius, 0.0, 0.0)
        arc_end = gp_Pnt(base_len, 0.0, bend_radius)
        arc = GC_MakeArcOfCircle(arc_start, arc_center, arc_end)
        if arc.IsDone():
            edge2 = BRepBuilderAPI_MakeEdge(arc.Value()).Edge()
            profile_wire_maker.Add(edge2)
        else:
            p_mid = gp_Pnt(base_len + bend_radius * 0.707, 0.0, bend_radius * 0.707)
            edge2 = BRepBuilderAPI_MakeEdge(p1, p_mid).Edge()
            profile_wire_maker.Add(edge2)
            edge2b = BRepBuilderAPI_MakeEdge(p_mid, arc_end).Edge()
            profile_wire_maker.Add(edge2b)

        p3 = gp_Pnt(base_len, 0.0, bend_radius + flange_len)
        edge3 = BRepBuilderAPI_MakeEdge(arc_end, p3).Edge()
        profile_wire_maker.Add(edge3)

        edge4 = BRepBuilderAPI_MakeEdge(p3, p0).Edge()
        profile_wire_maker.Add(edge4)

        profile_wire = profile_wire_maker.Wire()
        profile_face = BRepBuilderAPI_MakeFace(profile_wire).Face()

        flange_width = max(thickness * 4.0, 10.0)
        extrude_vec = gp_Vec(0.0, flange_width, 0.0)
        flange_shape = BRepPrimAPI_MakePrism(profile_face, extrude_vec).Shape()

        shape_hash = str(uuid.uuid4())
        _EDGE_FLANGE_SHAPE_CACHE[shape_hash] = flange_shape
        if len(_EDGE_FLANGE_SHAPE_CACHE) > _EDGE_FLANGE_CACHE_MAX:
            oldest = next(iter(_EDGE_FLANGE_SHAPE_CACHE))
            del _EDGE_FLANGE_SHAPE_CACHE[oldest]

        return shape_hash
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise RuntimeError(f"Edge flange generation failed: {e}")


def generate_miter_flange(
    edge_refs: list[str],
    flange_height: float,
    bend_radius: float,
    bend_angle: float,
    thickness: float,
    k_factor: float = 0.5,
    direction: str = 'OUTSIDE',
    corner_angle: float = 90.0,
) -> str:
    """Generate a miter flange with automatically mitered corners."""
    if not HAS_OCC:
        return str(uuid.uuid4())

    try:
        angle_rad = math.radians(bend_angle)
        corner_rad = math.radians(corner_angle)

        base_len = bend_radius + thickness
        flange_len = flange_height

        def _make_flange_segment() -> TopoDS_Shape:
            w = BRepBuilderAPI_MakeWire()

            p0 = gp_Pnt(0.0, 0.0, 0.0)
            p1 = gp_Pnt(base_len, 0.0, 0.0)
            w.Add(BRepBuilderAPI_MakeEdge(p0, p1).Edge())

            arc_center = gp_Pnt(base_len, 0.0, 0.0)
            arc_start = gp_Pnt(base_len + bend_radius, 0.0, 0.0)
            arc_end = gp_Pnt(base_len, 0.0, bend_radius)
            arc = GC_MakeArcOfCircle(arc_start, arc_center, arc_end)
            if arc.IsDone():
                w.Add(BRepBuilderAPI_MakeEdge(arc.Value()).Edge())
            else:
                pm = gp_Pnt(base_len + bend_radius * 0.707, 0.0, bend_radius * 0.707)
                w.Add(BRepBuilderAPI_MakeEdge(p1, pm).Edge())
                w.Add(BRepBuilderAPI_MakeEdge(pm, arc_end).Edge())

            p3 = gp_Pnt(base_len, 0.0, bend_radius + flange_len)
            w.Add(BRepBuilderAPI_MakeEdge(arc_end, p3).Edge())
            w.Add(BRepBuilderAPI_MakeEdge(p3, p0).Edge())

            face = BRepBuilderAPI_MakeFace(w.Wire()).Face()
            fw = max(thickness * 4.0, 10.0)
            return BRepPrimAPI_MakePrism(face, gp_Vec(0.0, fw, 0.0)).Shape()

        seg1 = _make_flange_segment()

        trsf = gp_Trsf()
        trsf.SetRotation(
            gp_Ax1(gp_Pnt(0.0, 0.0, 0.0), gp_Dir(0.0, 0.0, 1.0)),
            -corner_rad
        )
        seg2 = BRepBuilderAPI_Transform(seg1, trsf).Shape()

        fuse = BRepAlgoAPI_Fuse(seg1, seg2)
        fuse.Build()
        if fuse.IsDone():
            miter_shape = fuse.Shape()
        else:
            miter_shape = seg1

        shape_hash = str(uuid.uuid4())
        _MITER_FLANGE_SHAPE_CACHE[shape_hash] = miter_shape
        if len(_MITER_FLANGE_SHAPE_CACHE) > _MITER_FLANGE_CACHE_MAX:
            oldest = next(iter(_MITER_FLANGE_SHAPE_CACHE))
            del _MITER_FLANGE_SHAPE_CACHE[oldest]

        return shape_hash
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise RuntimeError(f"Miter flange generation failed: {e}")


def generate_hem(
    edge_ref: str,
    hem_length: float,
    hem_radius: float,
    thickness: float,
    hem_type: str = 'CLOSED',
    gap: float = 0.0,
) -> str:
    """Generate a sheet metal hem — a folded edge that curls back on itself."""
    if not HAS_OCC:
        return str(uuid.uuid4())

    try:
        R = max(hem_radius, 0.1)
        flat_len = max(hem_length, R * 2.5)

        if hem_type == 'CLOSED':
            gap_val = 0.0
        elif hem_type == 'TEARDROP':
            gap_val = R * 0.6
        else:
            gap_val = max(gap, 0.2)

        w = BRepBuilderAPI_MakeWire()

        p0 = gp_Pnt(0.0, 0.0, 0.0)
        p1 = gp_Pnt(flat_len, 0.0, 0.0)
        w.Add(BRepBuilderAPI_MakeEdge(p0, p1).Edge())

        arc_start = p1
        arc_mid = gp_Pnt(flat_len - R, 0.0, R)
        arc_end = gp_Pnt(flat_len - 2.0 * R, 0.0, 2.0 * R)
        arc = GC_MakeArcOfCircle(arc_start, arc_mid, arc_end)
        if arc.IsDone():
            w.Add(BRepBuilderAPI_MakeEdge(arc.Value()).Edge())
        else:
            w.Add(BRepBuilderAPI_MakeEdge(p1, arc_mid).Edge())
            w.Add(BRepBuilderAPI_MakeEdge(arc_mid, arc_end).Edge())

        p3 = gp_Pnt(gap_val, 0.0, 2.0 * R)
        w.Add(BRepBuilderAPI_MakeEdge(arc_end, p3).Edge())
        w.Add(BRepBuilderAPI_MakeEdge(p3, p0).Edge())

        profile_face = BRepBuilderAPI_MakeFace(w.Wire()).Face()
        ext_width = max(thickness * 4.0, 10.0)
        hem_shape = BRepPrimAPI_MakePrism(profile_face, gp_Vec(0.0, ext_width, 0.0)).Shape()

        shape_hash = str(uuid.uuid4())
        _HEM_SHAPE_CACHE[shape_hash] = hem_shape
        if len(_HEM_SHAPE_CACHE) > _HEM_CACHE_MAX:
            oldest = next(iter(_HEM_SHAPE_CACHE))
            del _HEM_SHAPE_CACHE[oldest]

        return shape_hash
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise RuntimeError(f"Hem generation failed: {e}")


def generate_flat_pattern(
    features: list,
    k_factor: float = 0.44,
    thickness: float = 1.0,
) -> str:
    """
    Generate a flat/unfolded 3D shape from a list of sheet metal features.
    Returns a hash key for cache lookup during rebuild.
    """
    if not HAS_OCC:
        return str(uuid.uuid4())

    try:
        base_w = 0.0
        base_d = 0.0
        for f in features:
            f_type = f.type if hasattr(f, 'type') else f.get('type', '')
            if f_type in ('BOX', 'EXTRUDE'):
                fp = f.parameters if hasattr(f, 'parameters') else f.get('parameters', {})
                base_w = float(fp.get('width', fp.get('w', 20.0)))
                base_d = float(fp.get('depth', fp.get('d', 20.0)))
                if f_type == 'EXTRUDE':
                    s = fp.get('shape', 'RECTANGLE')
                    if s in ('CIRCLE', 'ELLIPSE'):
                        r = float(fp.get('radius', 10.0))
                        base_w = base_d = r * 2.0
                break

        if base_w < 1e-6 or base_d < 1e-6:
            base_w = 20.0
            base_d = 20.0

        ext = {'+X': 0.0, '-X': 0.0, '+Y': 0.0, '-Y': 0.0}
        bend_lines = []

        for f in features:
            f_type = f.type if hasattr(f, 'type') else f.get('type', '')
            fp = f.parameters if hasattr(f, 'parameters') else f.get('parameters', {})
            t = float(fp.get('thickness', thickness))
            br = float(fp.get('bend_radius', 0.5))
            ba = float(fp.get('bend_angle', 90.0))
            kf = float(fp.get('k_factor', k_factor))

            if fp.get('_unfold') is False:
                continue

            if f_type == 'EDGE_FLANGE':
                fh = float(fp.get('flange_height', 10.0))
                unfold_len = fh - br - t + _bend_allowance(ba, br, t, kf)
                edge_dir = _infer_flange_edge_dir(fp)
                ext[edge_dir] = max(ext[edge_dir], unfold_len)
                if edge_dir == '+Y':
                    bend_lines.append((-base_w/2 + ext['-X'], base_d/2, base_w/2 + ext['+X'], base_d/2))
                elif edge_dir == '-Y':
                    bend_lines.append((-base_w/2 + ext['-X'], -base_d/2, base_w/2 + ext['+X'], -base_d/2))
                elif edge_dir == '+X':
                    bend_lines.append((base_w/2, -base_d/2 + ext['-Y'], base_w/2, base_d/2 + ext['+Y']))
                elif edge_dir == '-X':
                    bend_lines.append((-base_w/2, -base_d/2 + ext['-Y'], -base_w/2, base_d/2 + ext['+Y']))

            elif f_type == 'MITER_FLANGE':
                fh = float(fp.get('flange_height', 10.0))
                unfold_len = fh - br - t + _bend_allowance(ba, br, t, kf)
                edge_dir = _infer_flange_edge_dir(fp)
                ext[edge_dir] = max(ext[edge_dir], unfold_len)

            elif f_type == 'HEM':
                hl = float(fp.get('hem_length', 5.0))
                unfold_len = hl + _bend_allowance(180.0, br, t, kf)
                edge_dir = _infer_flange_edge_dir(fp)
                ext[edge_dir] = max(ext[edge_dir], unfold_len)

        total_w = base_w + ext['+X'] + ext['-X']
        total_d = base_d + ext['+Y'] + ext['-Y']

        total_w = max(total_w, 1.0)
        total_d = max(total_d, 1.0)

        half_w = total_w / 2.0
        half_d = total_d / 2.0

        plate_thickness = 0.1

        flat_face = BRepBuilderAPI_MakeFace(
            BRepBuilderAPI_MakeWire(
                BRepBuilderAPI_MakeEdge(gp_Pnt(-half_w, -half_d, 0.0),
                                        gp_Pnt( half_w, -half_d, 0.0)).Edge(),
                BRepBuilderAPI_MakeEdge(gp_Pnt( half_w, -half_d, 0.0),
                                        gp_Pnt( half_w,  half_d, 0.0)).Edge(),
                BRepBuilderAPI_MakeEdge(gp_Pnt( half_w,  half_d, 0.0),
                                        gp_Pnt(-half_w,  half_d, 0.0)).Edge(),
                BRepBuilderAPI_MakeEdge(gp_Pnt(-half_w,  half_d, 0.0),
                                        gp_Pnt(-half_w, -half_d, 0.0)).Edge(),
            ).Wire()
        ).Face()

        flat_shape = BRepPrimAPI_MakePrism(
            flat_face, gp_Vec(0.0, 0.0, plate_thickness)
        ).Shape()

        if not flat_shape or flat_shape.IsNull():
            return str(uuid.uuid4())

        shape_hash = str(uuid.uuid4())
        _FLAT_PATTERN_SHAPE_CACHE[shape_hash] = flat_shape
        if len(_FLAT_PATTERN_SHAPE_CACHE) > _FLAT_PATTERN_CACHE_MAX:
            oldest = next(iter(_FLAT_PATTERN_SHAPE_CACHE))
            del _FLAT_PATTERN_SHAPE_CACHE[oldest]

        return shape_hash

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise RuntimeError(f"Flat pattern generation failed: {e}")


def generate_unfold(features, bend_ids=None, k_factor=0.44, thickness=1.0):
    """Unfold (selectively flatten) sheet metal bends."""
    modified_features = list(features)
    for f in modified_features:
        if isinstance(f, dict) and f.get('type') in ('EDGE_FLANGE', 'MITER_FLANGE', 'HEM'):
            params = f.get('parameters', {})
            if bend_ids is None or f.get('id') in bend_ids:
                params['_unfold'] = True
            else:
                params['_unfold'] = False

    return generate_flat_pattern(modified_features, k_factor, thickness)


def generate_fold(features, bend_ids, k_factor=0.44, thickness=1.0):
    """Re-fold previously unfolded bends."""
    modified_features = list(features)
    for f in modified_features:
        if isinstance(f, dict) and f.get('type') in ('EDGE_FLANGE', 'MITER_FLANGE', 'HEM'):
            params = f.get('parameters', {})
            if f.get('id') in bend_ids:
                params['_unfold'] = False

    return generate_flat_pattern(modified_features, k_factor, thickness)
