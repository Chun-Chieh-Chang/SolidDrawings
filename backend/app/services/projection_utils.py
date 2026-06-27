"""
Projection utilities — 2D/3D projection, face finding, entity conversion, offset, intersection.
Extracted from geometry_service.py for modularity.
"""

import math

# Global flags
HAS_OCC = False

try:
    from OCC.Core.gp import gp_Pnt, gp_Dir, gp_Pln, gp_Ax2, gp_Vec, gp_Trsf
    from OCC.Core.TopLoc import TopLoc_Location
    from OCC.Core.TopoDS import topods, TopoDS_Compound
    from OCC.Core.BRep import BRep_Tool, BRep_Builder
    from OCC.Core.BRepBuilderAPI import BRepBuilderAPI_MakeEdge, BRepBuilderAPI_MakeWire, BRepBuilderAPI_MakeFace, BRepBuilderAPI_Transform, BRepBuilderAPI_Sewing
    from OCC.Core.BRepPrimAPI import BRepPrimAPI_MakePrism
    from OCC.Core.BRepAlgoAPI import BRepAlgoAPI_Section, BRepAlgoAPI_Fuse, BRepAlgoAPI_Cut
    from OCC.Core.BRepOffsetAPI import BRepOffsetAPI_MakeOffset, BRepOffsetAPI_ThruSections, BRepOffsetAPI_MakePipe
    from OCC.Core.BRepAdaptor import BRepAdaptor_Surface, BRepAdaptor_Curve
    from OCC.Core.TopExp import TopExp_Explorer
    from OCC.Core.TopAbs import TopAbs_FACE, TopAbs_EDGE, TopAbs_VERTEX, TopAbs_REVERSED, TopAbs_IN, TopAbs_ON
    from OCC.Core.GeomAbs import GeomAbs_Plane, GeomAbs_Cylinder, GeomAbs_Circle
    from OCC.Core.Geom import Geom_Plane
    from OCC.Core.Geom2d import Geom2d_Line
    from OCC.Core.GeomAPI import GeomAPI_Interpolate
    from OCC.Core.GC import GC_MakeArcOfCircle
    from OCC.Core.TColgp import TColgp_HArray1OfPnt
    from OCC.Core.IntCurvesFace import IntCurvesFace_ShapeIntersector
    from OCC.Core.GProp import GProp_GProps
    from OCC.Core.BRepGProp import brepgprop
    from OCC.Core.BRepFill import BRepFill_PipeShell
    from OCC.Core.BRepOffset import BRepOffset_Skin
    from OCC.Core.BRepTools import breptools
    from OCC.Core.Bnd import Bnd_Box
    from OCC.Core.BRepBndLib import brepbndlib
    from OCC.Core.BRepClass3d import BRepClass3d_SolidClassifier
    from OCC.Core.BRepTopAdaptor import BRepTopAdaptor_FClass2d
    from OCC.Core.HLRBRep import HLRBRep_Algo, HLRBRep_HLRToShape
    from OCC.Core.HLRAlgo import HLRAlgo_Projector
    from OCC.Core.BRepCheck import BRepCheck_Analyzer
    HAS_OCC = True
except ImportError:
    HAS_OCC = False


def project_2d(features, plane_type='FRONT', section_plane=None):
    """
    Industrial-grade 2D View Projection using OpenCASCADE HLR (Hidden Line Removal).
    Separates visible and hidden edges for technical drawing standards.
    """
    from .geometry_service import build_shape_only, generate_reference_plane, project_3d_to_2d

    shape = build_shape_only(features)
    if not shape or shape.IsNull():
        return []

    # --- P5-2 Section View Support ---
    if section_plane and HAS_OCC:
        try:
            p_ori = section_plane.get('origin', [0,0,0])
            p_norm = section_plane.get('normal', [0,0,1])
            plane = gp_Pln(gp_Pnt(*p_ori), gp_Dir(*p_norm))

            section_tool = BRepAlgoAPI_Section(shape, plane, True)
            section_tool.Build()
            if section_tool.IsDone():
                section_shape = section_tool.Shape()
                pass
        except Exception as sec_err:
            print(f"[ERROR] Section generation failed: {sec_err}")

    if not HAS_OCC:
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
                elif plane_type == 'TOP': u, v_val = pt.X(), -pt.Z()
                elif plane_type == 'RIGHT': u, v_val = pt.Z(), pt.Y()
                elif plane_type == 'ISO':
                    u = (pt.X() - pt.Z()) * 0.707106781
                    v_val = pt.Y() - (pt.X() + pt.Z()) * 0.35355339
                else: u, v_val = pt.X(), pt.Y()
                pnts.append([u, v_val])
                v_exp.Next()
            if len(pnts) >= 2: projected_lines.append({"points": pnts, "visible": True})
            explorer.Next()
        return projected_lines

    # --- Full HLR Algorithm for Production ---
    eye = gp_Dir(0, 0, 1)
    up = gp_Dir(0, 1, 0)
    custom_basis = None

    if plane_type == 'FRONT': eye = gp_Dir(0, 0, 1); up = gp_Dir(0, 1, 0)
    elif plane_type == 'TOP': eye = gp_Dir(0, 1, 0); up = gp_Dir(0, 0, -1)
    elif plane_type == 'RIGHT': eye = gp_Dir(1, 0, 0); up = gp_Dir(0, 1, 0)
    elif plane_type == 'ISO': eye = gp_Dir(1, 1, 1); up = gp_Dir(0, 1, 0)
    else:
        target_plane = next((f for f in features if (f.id if hasattr(f, 'id') else f.get('id')) == plane_type), None)
        if target_plane:
            p_params = target_plane.parameters if hasattr(target_plane, 'parameters') else target_plane.get('parameters', {})
            custom_basis = generate_reference_plane(p_params.get('planeType', 'OFFSET'), p_params.get('refs', []), p_params.get('offset', 0.0), features)
            eye = gp_Dir(*custom_basis['normal'])
            up = gp_Dir(*custom_basis['yDir'])

    projector = HLRAlgo_Projector(gp_Ax2(gp_Pnt(0,0,0), eye, up))

    hlr = HLRBRep_Algo()
    hlr.Add(shape)
    hlr.Projector(projector)
    hlr.Update()
    hlr.Hide()

    hlr_shapes = HLRBRep_HLRToShape(hlr)

    output_lines = []

    def extract_from_shape(s, is_visible):
        if s is None or s.IsNull():
            return
        exp = TopExp_Explorer(s, TopAbs_EDGE)
        while exp.More():
            e = topods.Edge(exp.Current())
            adaptor = BRepAdaptor_Curve(e)
            pnts = []
            n_samples = 10
            for i in range(n_samples + 1):
                p = adaptor.Value(adaptor.FirstParameter() + (adaptor.LastParameter()-adaptor.FirstParameter()) * i / n_samples)
                if plane_type == 'FRONT': u, v_val = p.X(), p.Y()
                elif plane_type == 'TOP': u, v_val = p.X(), -p.Z()
                elif plane_type == 'RIGHT': u, v_val = p.Z(), p.Y()
                elif plane_type == 'ISO':
                    u = (p.X() - p.Z()) * 0.707106781
                    v_val = p.Y() - (p.X() + p.Z()) * 0.35355339
                elif custom_basis:
                    uv = project_3d_to_2d(p.X(), p.Y(), p.Z(), 'FACE', face_origin=custom_basis['origin'], face_normal=custom_basis['normal'])
                    u, v_val = uv[0], uv[1]
                else: u, v_val = p.X(), p.Y()
                pnts.append([u, v_val])
            output_lines.append({"points": pnts, "visible": is_visible})
            exp.Next()

    extract_from_shape(hlr_shapes.VCompound(), True)
    extract_from_shape(hlr_shapes.OutLineVCompound(), True)
    extract_from_shape(hlr_shapes.HCompound(), False)
    extract_from_shape(hlr_shapes.OutLineHCompound(), False)

    return output_lines


def project_assembly_2d(components_data, plane_type='FRONT'):
    """
    Project a multi-body assembly into 2D using HLR.
    """
    if not HAS_OCC:
        return []

    from .geometry_service import build_shape_only

    builder = BRep_Builder()
    compound = TopoDS_Compound()
    builder.MakeCompound(compound)

    for comp in components_data:
        features = comp.get('features', [])
        transform = comp.get('transform', {})
        shape = build_shape_only(features)

        if shape and not shape.IsNull():
            pos = transform.get('position', [0.0, 0.0, 0.0])
            rot = transform.get('rotation', [0.0, 0.0, 0.0])

            rx, ry, rz = rot[0], rot[1], rot[2]
            trsf_x = gp_Trsf()
            trsf_x.SetRotation(gp_Ax1(gp_Pnt(0,0,0), gp_Dir(1,0,0)), rx)
            trsf_y = gp_Trsf()
            trsf_y.SetRotation(gp_Ax1(gp_Pnt(0,0,0), gp_Dir(0,1,0)), ry)
            trsf_z = gp_Trsf()
            trsf_z.SetRotation(gp_Ax1(gp_Pnt(0,0,0), gp_Dir(0,0,1)), rz)

            final_rot = trsf_z.Multiplied(trsf_y).Multiplied(trsf_x)
            final_trsf = gp_Trsf()
            final_trsf.SetTranslation(gp_Vec(*pos))
            final_trsf.Multiply(final_rot)

            shape.Move(TopLoc_Location(final_trsf))
            builder.Add(compound, shape)

    if plane_type == 'FRONT': eye = gp_Dir(0, 0, 1); up = gp_Dir(0, 1, 0)
    elif plane_type == 'TOP': eye = gp_Dir(0, 1, 0); up = gp_Dir(0, 0, -1)
    elif plane_type == 'RIGHT': eye = gp_Dir(1, 0, 0); up = gp_Dir(0, 1, 0)
    elif plane_type == 'ISO':
        eye = gp_Dir(1, 1, 1)
        up = gp_Dir(0, 1, 0)
    else: eye = gp_Dir(0, 0, 1); up = gp_Dir(0, 1, 0)

    projector = HLRAlgo_Projector(gp_Ax2(gp_Pnt(0,0,0), eye, up))

    hlr = HLRBRep_Algo()
    hlr.Add(compound)
    hlr.Projector(projector)
    hlr.Update()
    hlr.Hide()

    hlr_shapes = HLRBRep_HLRToShape(hlr)
    output_lines = []

    def extract_from_shape(s, is_visible):
        if s is None or s.IsNull():
            return
        exp = TopExp_Explorer(s, TopAbs_EDGE)
        while exp.More():
            e = topods.Edge(exp.Current())
            adaptor = BRepAdaptor_Curve(e)
            pnts = []
            n_samples = 10

            iso_u = lambda x,y,z: (x - z) * 0.707106781
            iso_v = lambda x,y,z: y - (x + z) * 0.35355339

            for i in range(n_samples + 1):
                p = adaptor.Value(adaptor.FirstParameter() + (adaptor.LastParameter()-adaptor.FirstParameter()) * i / n_samples)
                if plane_type == 'FRONT': u, v_val = p.X(), p.Y()
                elif plane_type == 'TOP': u, v_val = p.X(), -p.Z()
                elif plane_type == 'RIGHT': u, v_val = p.Z(), p.Y()
                elif plane_type == 'ISO': u, v_val = iso_u(p.X(), p.Y(), p.Z()), iso_v(p.X(), p.Y(), p.Z())
                else: u, v_val = p.X(), p.Y()
                pnts.append([u, v_val])
            output_lines.append({"points": pnts, "visible": is_visible})
            exp.Next()

    extract_from_shape(hlr_shapes.VCompound(), True)
    extract_from_shape(hlr_shapes.OutLineVCompound(), True)
    extract_from_shape(hlr_shapes.HCompound(), False)
    extract_from_shape(hlr_shapes.OutLineHCompound(), False)
    return output_lines


def project_3d_to_2d(x, y, z, plane_type, face_origin=None, face_normal=None):
    """Projects a 3D world space coordinate onto the active plane local 2D UV coordinate space."""
    if plane_type == 'FRONT':
        return [x, y]
    elif plane_type == 'TOP':
        return [x, z]
    elif plane_type == 'RIGHT':
        return [y, z]
    elif plane_type == 'FACE' and face_origin and face_normal:
        ox, oy, oz = float(face_origin[0]), float(face_origin[1]), float(face_origin[2])
        nx, ny, nz = float(face_normal[0]), float(face_normal[1]), float(face_normal[2])

        n_len = math.sqrt(nx*nx + ny*ny + nz*nz)
        if n_len > 1e-6:
            nx, ny, nz = nx/n_len, ny/n_len, nz/n_len
        else:
            nx, ny, nz = 0.0, 0.0, 1.0

        if abs(nx) < 1e-5 and abs(ny) < 1e-5:
            tx, ty, tz = 1.0, 0.0, 0.0
        else:
            tx, ty, tz = -ny, nx, 0.0
            t_len = math.sqrt(tx*tx + ty*ty)
            tx, ty = tx/t_len, ty/t_len

        bx = ny * tz - nz * ty
        by = nz * tx - nx * tz
        bz = nx * ty - ny * tx

        dx, dy, dz = x - ox, y - oy, z - oz
        u = dx * tx + dy * ty + dz * tz
        v = dx * bx + dy * by + dz * bz
        return [u, v]

    return [x, y]


def find_closest_face(shape, point_3d):
    """Finds the closest B-Rep TopoDS_Face in the shape to the given 3D coordinate point."""
    if not shape or shape.IsNull():
        return None

    try:
        target_pt = [float(point_3d[0]), float(point_3d[1]), float(point_3d[2])]
    except Exception:
        return None

    best_face = None
    min_dist = float('inf')

    explorer = TopExp_Explorer(shape, TopAbs_FACE)
    while explorer.More():
        face = topods.Face(explorer.Current())

        v_exp = TopExp_Explorer(face, TopAbs_VERTEX)
        face_min_v_dist = float('inf')
        sum_x, sum_y, sum_z = 0.0, 0.0, 0.0
        v_count = 0

        while v_exp.More():
            v = topods.Vertex(v_exp.Current())
            pt = BRep_Tool.Pnt(v)
            d = math.dist(target_pt, [pt.X(), pt.Y(), pt.Z()])
            if d < face_min_v_dist:
                face_min_v_dist = d
            sum_x += pt.X()
            sum_y += pt.Y()
            sum_z += pt.Z()
            v_count += 1
            v_exp.Next()

        if v_count > 0:
            center = [sum_x / v_count, sum_y / v_count, sum_z / v_count]
            d_center = math.dist(target_pt, center)
            effective_dist = min(face_min_v_dist, d_center)

            if effective_dist < min_dist:
                min_dist = effective_dist
                best_face = face

        explorer.Next()

    if min_dist < 10.0:
        return best_face
    return None


def find_matching_face(shape, ref_origin, ref_normal, signature=None):
    """
    Topological Naming Service (TNS) for faces:
    Prioritizes history-based matching (TNS 2.0) then falls back to geometric signatures.
    """
    from .geometry_service import get_shape_hash, linker

    if not shape or shape.IsNull():
        return ref_origin, ref_normal, None

    # 1. TNS 2.0: History-based resolution
    if signature and 'tns_name' in signature:
        tns_name = signature['tns_name']
        target_hash = linker.generation_map.get(tns_name)
        if target_hash:
            explorer = TopExp_Explorer(shape, TopAbs_FACE)
            while explorer.More():
                face = topods.Face(explorer.Current())
                if get_shape_hash(face) == target_hash:
                    v_exp = TopExp_Explorer(face, TopAbs_VERTEX); v_count = 0; sx, sy, sz = 0, 0, 0
                    while v_exp.More():
                        pt = BRep_Tool.Pnt(topods.Vertex(v_exp.Current()))
                        sx += pt.X(); sy += pt.Y(); sz += pt.Z(); v_count += 1
                        v_exp.Next()
                    center = [sx/v_count, sy/v_count, sz/v_count] if v_count > 0 else ref_origin
                    return center, ref_normal, face
                explorer.Next()

    # 2. TNS 1.0: Geometric fallback
    try:
        r_ori = [float(ref_origin[0]), float(ref_origin[1]), float(ref_origin[2])]
        r_nrm = [float(ref_normal[0]), float(ref_normal[1]), float(ref_normal[2])]
    except Exception:
        return ref_origin, ref_normal, None

    n_len = math.sqrt(r_nrm[0]**2 + r_nrm[1]**2 + r_nrm[2]**2)
    if n_len > 1e-6:
        r_nrm = [r_nrm[0]/n_len, r_nrm[1]/n_len, r_nrm[2]/n_len]
    else:
        r_nrm = [0.0, 0.0, 1.0]

    candidate_faces = []

    explorer = TopExp_Explorer(shape, TopAbs_FACE)
    while explorer.More():
        face = topods.Face(explorer.Current())

        v_exp = TopExp_Explorer(face, TopAbs_VERTEX)
        v_count = 0
        sum_x, sum_y, sum_z = 0.0, 0.0, 0.0
        while v_exp.More():
            v = topods.Vertex(v_exp.Current())
            pt = BRep_Tool.Pnt(v)
            sum_x += pt.X()
            sum_y += pt.Y()
            sum_z += pt.Z()
            v_count += 1
            v_exp.Next()

        if v_count == 0:
            explorer.Next()
            continue

        center = [sum_x / v_count, sum_y / v_count, sum_z / v_count]

        surf_normal = None
        try:
            adaptor = BRepAdaptor_Surface(face)
            surf_type = adaptor.GetType()
            if surf_type == 0:
                gp_pln = adaptor.Plane()
                gp_dir = gp_pln.Position().Direction()
                surf_normal = [gp_dir.X(), gp_dir.Y(), gp_dir.Z()]
                if face.Orientation() == TopAbs_REVERSED:
                    surf_normal = [-surf_normal[0], -surf_normal[1], -surf_normal[2]]
        except Exception:
            pass

        if not surf_normal:
            surf_normal = r_nrm

        dot = surf_normal[0]*r_nrm[0] + surf_normal[1]*r_nrm[1] + surf_normal[2]*r_nrm[2]
        if dot > 0.95:
            proj_dist = center[0]*r_nrm[0] + center[1]*r_nrm[1] + center[2]*r_nrm[2]
            candidate_faces.append({
                "face": face,
                "center": center,
                "normal": surf_normal,
                "proj_dist": proj_dist
            })

        explorer.Next()

    if not candidate_faces:
        explorer = TopExp_Explorer(shape, TopAbs_FACE)
        while explorer.More():
            face = topods.Face(explorer.Current())
            v_exp = TopExp_Explorer(face, TopAbs_VERTEX); v_count = 0; sx, sy, sz = 0, 0, 0
            while v_exp.More():
                pt = BRep_Tool.Pnt(topods.Vertex(v_exp.Current()))
                sx += pt.X(); sy += pt.Y(); sz += pt.Z(); v_count += 1
                v_exp.Next()
            if v_count > 0:
                center = [sx/v_count, sy/v_count, sz/v_count]
                try:
                    adaptor = BRepAdaptor_Surface(face)
                    stype = adaptor.GetType()
                    if stype == 0:
                        gp_dir = adaptor.Plane().Position().Direction()
                        surf_normal = [gp_dir.X(), gp_dir.Y(), gp_dir.Z()]
                    else: surf_normal = [0,0,1]
                except Exception: surf_normal = [0,0,1]
                candidate_faces.append({"face": face, "center": center, "normal": surf_normal})
            explorer.Next()

    if not candidate_faces:
        return ref_origin, ref_normal, None

    r_area = float(signature.get('area', 0.0)) if signature else 0.0
    r_curv = signature.get('curvature', 'PLANE') if signature else 'PLANE'

    def calculate_score(c):
        dist = math.dist(c["center"], r_ori)
        dot = c["normal"][0]*r_nrm[0] + c["normal"][1]*r_nrm[1] + c["normal"][2]*r_nrm[2]
        angular_penalty = (1.0 - max(-1.0, min(1.0, dot))) * 20.0
        c_props = GProp_GProps()
        brepgprop.SurfaceProperties(c["face"], c_props)
        c_area = c_props.Mass()
        area_penalty = abs(c_area - r_area) / (max(r_area, 1e-6)) * 5.0
        return dist + angular_penalty + area_penalty

    for c in candidate_faces:
        c["score"] = calculate_score(c)

    best_candidate = min(candidate_faces, key=lambda x: x["score"])

    return best_candidate["center"], best_candidate["normal"], best_candidate["face"]


def convert_entities(features, topology, plane_type, face_origin=None, face_normal=None, section_plane=None):
    """Projects outer boundaries of 3D selected faces or selected edges onto the sketch plane's LCS UV space."""
    if not HAS_OCC:
        return []

    from .geometry_service import build_shape_only, find_matching_edge

    shape = build_shape_only(features)
    if not shape or shape.IsNull():
        return []

    if section_plane and isinstance(section_plane, dict) and HAS_OCC:
        try:
            p_ori = section_plane.get('origin', [0,0,0])
            p_norm = section_plane.get('normal', [0,0,1])
            plane = gp_Pln(gp_Pnt(*p_ori), gp_Dir(*p_norm))

            section_tool = BRepAlgoAPI_Section(shape, plane, True)
            section_tool.Build()
            if section_tool.IsDone():
                section_shape = section_tool.Shape()
                pass
        except Exception as sec_err:
            print(f"[ERROR] Section generation failed: {sec_err}")

    topo_type = topology.get('type')
    coords = topology.get('coordinates', [0.0, 0.0, 0.0])

    projected_points = []

    if topo_type == 'EDGE':
        edge_data = topology.get('edgeData')
        if edge_data and 'start' in edge_data and 'end' in edge_data:
            t_start = edge_data['start']
            t_end = edge_data['end']
            matched_edge = find_matching_edge(shape, t_start, t_end)

            if matched_edge:
                adaptor = BRepAdaptor_Curve(matched_edge)
                n_samples = 10
                for i in range(n_samples + 1):
                    p = adaptor.Value(adaptor.FirstParameter() + (adaptor.LastParameter()-adaptor.FirstParameter()) * i / n_samples)
                    uv = project_3d_to_2d(p.X(), p.Y(), p.Z(), plane_type, face_origin, face_normal)
                    projected_points.append([uv[0], uv[1]])
            else:
                projected_points.append([0.0, 0.0])
                projected_points.append([10.0, 0.0])

    elif topo_type == 'FACE':
        explorer = TopExp_Explorer(shape, TopAbs_FACE)
        found_face = None
        min_dist = float('inf')
        while explorer.More():
            f = topods.Face(explorer.Current())
            v_exp = TopExp_Explorer(f, TopAbs_VERTEX); sx, sy, sz = 0, 0, 0; vc = 0
            while v_exp.More():
                pt = BRep_Tool.Pnt(topods.Vertex(v_exp.Current()))
                sx += pt.X(); sy += pt.Y(); sz += pt.Z(); vc += 1
                v_exp.Next()
            if vc > 0:
                d = math.dist(coords, [sx/vc, sy/vc, sz/vc])
                if d < min_dist: min_dist, found_face = d, f
            explorer.Next()

        if found_face:
            outer_wire = breptools.OuterWire(found_face)
            if outer_wire:
                wire_exp = TopExp_Explorer(outer_wire, TopAbs_EDGE)
                while wire_exp.More():
                    e = topods.Edge(wire_exp.Current())
                    adaptor = BRepAdaptor_Curve(e)
                    n_samples = 8
                    for i in range(n_samples + 1):
                        p = adaptor.Value(adaptor.FirstParameter() + (adaptor.LastParameter()-adaptor.FirstParameter()) * i / n_samples)
                        uv = project_3d_to_2d(p.X(), p.Y(), p.Z(), plane_type, face_origin, face_normal)
                        projected_points.append([uv[0], uv[1]])
                    wire_exp.Next()

    else:
        uv = project_3d_to_2d(coords[0], coords[1], coords[2], plane_type, face_origin, face_normal)
        projected_points.append(uv)

    return projected_points


def offset_entities(points_2d, distance, plane_type, face_origin=None, face_normal=None):
    """Offsets projected 2D entities by a specified distance along the sketch plane."""
    if not HAS_OCC or not points_2d:
        return points_2d

    try:
        edges = []
        for pt_pair in points_2d:
            if len(pt_pair) >= 2:
                e = BRepBuilderAPI_MakeEdge(gp_Pnt(pt_pair[0][0], pt_pair[0][1], 0), gp_Pnt(pt_pair[1][0], pt_pair[1][1], 0)).Edge()
                edges.append(e)

        if not edges:
            return points_2d

        wire_builder = BRepBuilderAPI_MakeWire()
        for e in edges:
            wire_builder.Add(e)
        wire = wire_builder.Wire()

        face = BRepBuilderAPI_MakeFace(wire).Face()

        offset_maker = BRepOffsetAPI_MakeOffset(face, distance, 1.0e-6)
        offset_maker.Build()
        if offset_maker.IsDone():
            offset_shape = offset_maker.Shape()
            offset_exp = TopExp_Explorer(offset_shape, TopAbs_EDGE)
            offset_points = []
            while offset_exp.More():
                oe = topods.Edge(offset_exp.Current())
                adaptor = BRepAdaptor_Curve(oe)
                pts = []
                for i in range(2):
                    p = adaptor.Value(adaptor.FirstParameter() + (adaptor.LastParameter()-adaptor.FirstParameter()) * i)
                    uv = project_3d_to_2d(p.X(), p.Y(), 0.0, plane_type, face_origin, face_normal)
                    pts.append([uv[0], uv[1]])
                if len(pts) == 2:
                    offset_points.append(pts)
                offset_exp.Next()
            return offset_points if offset_points else points_2d
    except Exception as e:
        print(f"[ERROR] offset_entities failed: {e}")

    return points_2d


def get_intersection_curve(features, plane_type, face_origin=None, face_normal=None, section_plane=None):
    """Computes the intersection curve between a 3D solid shape and a cutting plane."""
    if not HAS_OCC:
        return None

    from .geometry_service import build_shape_only

    shape = build_shape_only(features)
    if not shape or shape.IsNull():
        return None

    try:
        if section_plane:
            p_ori = section_plane.get('origin', [0,0,0])
            p_norm = section_plane.get('normal', [0,0,1])
            plane = gp_Pln(gp_Pnt(*p_ori), gp_Dir(*p_norm))
        else:
            if plane_type == 'FRONT':
                plane = gp_Pln(gp_Pnt(0, 0, 0), gp_Dir(0, 0, 1))
            elif plane_type == 'TOP':
                plane = gp_Pln(gp_Pnt(0, 0, 0), gp_Dir(0, 1, 0))
            elif plane_type == 'RIGHT':
                plane = gp_Pln(gp_Pnt(0, 0, 0), gp_Dir(1, 0, 0))
            else:
                return None

        section_tool = BRepAlgoAPI_Section(shape, plane, True)
        section_tool.Build()
        if section_tool.IsDone():
            section_shape = section_tool.Shape()
            exp = TopExp_Explorer(section_shape, TopAbs_EDGE)
            curves = []
            while exp.More():
                e = topods.Edge(exp.Current())
                adaptor = BRepAdaptor_Curve(e)
                pts = []
                n_samples = 15
                for i in range(n_samples + 1):
                    p = adaptor.Value(adaptor.FirstParameter() + (adaptor.LastParameter()-adaptor.FirstParameter()) * i / n_samples)
                    uv = project_3d_to_2d(p.X(), p.Y(), p.Z(), plane_type, face_origin, face_normal)
                    pts.append([uv[0], uv[1]])
                curves.append({"points": pts, "type": "SECTION"})
                exp.Next()
            return curves
    except Exception as e:
        print(f"[ERROR] get_intersection_curve failed: {e}")

    return None
