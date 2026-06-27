import math
import json
import hashlib
import os
import sys
import uuid
from collections import OrderedDict

# Global flags and placeholders
HAS_OCC = False

# Try loading OpenCASCADE (pythonocc-core with OCC module)
# pyocc conda env provides pythonocc-core 7.9.3 which exports OCC.Core.*
try:
    from OCC.Core.HLRBRep import HLRBRep_Algo, HLRBRep_HLRToShape
    from OCC.Core.gp import gp_Ax2, gp_Dir, gp_Pnt, gp_Ax3, gp_Trsf, gp_Vec, gp_Ax1, gp_Lin2d, gp_Pnt2d, gp_Dir2d, gp_Pln, gp_Circ, gp_Lin, gp_Trsf2d
    from OCC.Core.BRepPrimAPI import BRepPrimAPI_MakeBox, BRepPrimAPI_MakeCylinder, BRepPrimAPI_MakeHalfSpace, BRepPrimAPI_MakeSphere, BRepPrimAPI_MakePrism, BRepPrimAPI_MakeRevol, BRepPrimAPI_MakeCone
    from OCC.Core.BRepMesh import BRepMesh_IncrementalMesh
    from OCC.Core.TopExp import TopExp_Explorer, topexp
    from OCC.Core.TopAbs import TopAbs_FACE, TopAbs_SOLID, TopAbs_EDGE, TopAbs_VERTEX, TopAbs_REVERSED, TopAbs_IN, TopAbs_ON
    from OCC.Core.BRep import BRep_Tool, BRep_Builder
    from OCC.Core.TopLoc import TopLoc_Location
    from OCC.Core.BRepBuilderAPI import BRepBuilderAPI_MakeEdge, BRepBuilderAPI_MakeWire, BRepBuilderAPI_MakeFace, BRepBuilderAPI_Sewing, BRepBuilderAPI_Transform
    from OCC.Core.BRepAlgoAPI import BRepAlgoAPI_Fuse, BRepAlgoAPI_Cut, BRepAlgoAPI_Common, BRepAlgoAPI_Section
    from OCC.Core.BRepFill import BRepFill_PipeShell
    from OCC.Core.BRepOffsetAPI import BRepOffsetAPI_ThruSections, BRepOffsetAPI_MakeOffsetShape, BRepOffsetAPI_MakeThickSolid, BRepOffsetAPI_MakeOffset, BRepOffsetAPI_DraftAngle, BRepOffsetAPI_MakePipe, BRepOffsetAPI_MakePipeShell
    from OCC.Core.GC import GC_MakeArcOfCircle
    from OCC.Core.TopoDS import topods, TopoDS_Compound
    from OCC.Core.BRepFilletAPI import BRepFilletAPI_MakeFillet, BRepFilletAPI_MakeChamfer
    from OCC.Core.GProp import GProp_GProps
    from OCC.Core.BRepGProp import brepgprop
    # from OCC.Core.IGESControl import IGESControl_Writer  # needs freeimageplus
    try:
        from OCC.Core.StlAPI import StlAPI_Writer
        HAS_STL = True
    except ImportError:
        StlAPI_Writer = None
        HAS_STL = False

    try:
        from OCC.Core.IGESControl import IGESControl_Writer, IGESControl_Reader
        HAS_IGES = True
    except ImportError:
        IGESControl_Writer = None
        IGESControl_Reader = None
        HAS_IGES = False

    from OCC.Core.BRepAdaptor import BRepAdaptor_Surface, BRepAdaptor_Curve
    from OCC.Core.BRepLProp import BRepLProp_SLProps
    from OCC.Core.GeomAbs import GeomAbs_Cylinder, GeomAbs_Plane, GeomAbs_Arc, GeomAbs_Circle, GeomAbs_Line, GeomAbs_Cone, GeomAbs_Sphere, GeomAbs_Torus, GeomAbs_Ellipse
    from OCC.Core.TopTools import TopTools_ListOfShape, TopTools_IndexedDataMapOfShapeListOfShape, TopTools_ListIteratorOfListOfShape
    from OCC.Core.BRepOffset import BRepOffset_Skin
    from OCC.Core.TColgp import TColgp_HArray1OfPnt
    from OCC.Core.GeomAPI import GeomAPI_Interpolate
    from OCC.Core.Geom import Geom_CylindricalSurface, Geom_ConicalSurface, Geom_Plane
    from OCC.Core.Geom2d import Geom2d_Line
    try:
        from OCC.Core.STEPControl import STEPControl_Reader, STEPControl_Writer, STEPControl_AsIs
        HAS_STEP = True
    except ImportError:
        STEPControl_Reader = None
        STEPControl_Writer = None
        STEPControl_AsIs = None
        HAS_STEP = False

    from OCC.Core.IFSelect import IFSelect_RetDone
    from OCC.Core.BRepCheck import BRepCheck_Analyzer
    from OCC.Core.IntCurvesFace import IntCurvesFace_ShapeIntersector
    from OCC.Core.GeomFill import GeomFill_IsFrenet
    from OCC.Core.BRepTools import breptools
    from OCC.Core.Bnd import Bnd_Box
    from OCC.Core.BRepBndLib import brepbndlib
    from OCC.Core.BRepClass3d import BRepClass3d_SolidClassifier
    from OCC.Core.BRepTopAdaptor import BRepTopAdaptor_FClass2d
    from OCC.Core.HLRAlgo import HLRAlgo_Projector
    HAS_OCC = True
except ImportError as e:
    HAS_OCC = False
    print(f"[WARNING] OpenCASCADE (OCC.Core) not found: {e}")
    print("  To fix: conda activate pyocc && pip install numpy")

# XDE (XCAF) imports for STEP assembly export (independent of OCC availability check)
try:
    from OCC.Core.XCAFApp import XCAFApp_Application
    from OCC.Core.TDocStd import TDocStd_Document
    from OCC.Core.TCollection import TCollection_ExtendedString
    from OCC.Core.XCAFDoc import XCAFDoc_DocumentTool, XCAFDoc_ColorGen, XCAFDoc_ColorSurf
    from OCC.Core.TDataStd import TDataStd_Name
    from OCC.Core.Quantity import Quantity_Color, Quantity_TOC_RGB
    from OCC.Core.STEPControl import STEPCAFControl_Writer
    HAS_XCAF = True
except ImportError:
    XCAFApp_Application = None
    TDocStd_Document = None
    TCollection_ExtendedString = None
    XCAFDoc_DocumentTool = None
    XCAFDoc_ColorGen = None
    XCAFDoc_ColorSurf = None
    TDataStd_Name = None
    Quantity_Color = None
    Quantity_TOC_RGB = None
    STEPCAFControl_Writer = None
    HAS_XCAF = False

try:
    import threading
    HAS_THREADING = True
except ImportError:
    HAS_THREADING = False

# Import domain modules for surfacing, sheet metal, and features
from .surfacing import (
    generate_boundary_surface,
    generate_trim_surface,
    _SURFACE_SHAPE_CACHE,
    _SURFACE_CACHE_MAX,
)
# Import from extracted sub-modules
from .reference_geometry import (
    generate_reference_plane, generate_reference_axis,
    generate_reference_point, generate_reference_coordinate_system,
)
from .projection_utils import (
    project_2d, project_assembly_2d, project_3d_to_2d,
    find_closest_face, find_matching_face,
    convert_entities, offset_entities, get_intersection_curve,
)
from .export_utils import (
    export_cad_file, check_interferences, build_feature_chain,
    analyze_topology, export_assembly_step, import_step_file,
    detect_interference,
)
from .sheet_metal import (
    # Forming tools
    generate_forming_tool,
    _FORMING_TOOL_SHAPE_CACHE,
    _FORMING_TOOL_CACHE_MAX,
    # Edge flanges, hems, flat pattern
    generate_edge_flange,
    generate_miter_flange,
    generate_hem,
    generate_flat_pattern,
    generate_unfold,
    generate_fold,
    _EDGE_FLANGE_SHAPE_CACHE,
    _EDGE_FLANGE_CACHE_MAX,
    _MITER_FLANGE_SHAPE_CACHE,
    _MITER_FLANGE_CACHE_MAX,
    _HEM_SHAPE_CACHE,
    _HEM_CACHE_MAX,
    _FLAT_PATTERN_SHAPE_CACHE,
    _FLAT_PATTERN_CACHE_MAX,
)
from .features import (
    generate_box,
    generate_cylinder,
    generate_sphere,
    generate_rib,
    generate_split,
    generate_combine,
    generate_section_view,
)

def get_shape_hash(shape, upper=10000000):
    """Robust hashing for OCC shapes across different versions."""
    if not HAS_OCC or shape is None:
        return 0
    try:
        # Newer pythonocc versions might not have HashCode on the object
        if hasattr(shape, 'HashCode'):
            return shape.HashCode(upper)
        else:
            # Fallback to python ID or a custom hash implementation if needed
            return id(shape) % upper
    except Exception:
        return id(shape) % upper


def _shape_to_mesh(shape, deflection=0.01):
    if not HAS_OCC: return None
    """Converts an OCCT shape to a mesh format for Three.js."""
    if shape.IsNull():
        return None
    
    # Use a finer deflection for industrial smoothness
    BRepMesh_IncrementalMesh(shape, deflection)
    vertices = []
    indices = []
    normals = []
    colors = [] # New colors array
    face_metadata = []
    edge_metadata = []

    # Extract Face Metadata
    explorer = TopExp_Explorer(shape, TopAbs_FACE)
    while explorer.More():
        face = topods.Face(explorer.Current())
        h_face = get_shape_hash(face)
        
        # Resolve Color
        f_color_hex = linker.color_map.get(h_face, "#60A5FA") # Default Blue
        r, g, b = 0.37, 0.65, 0.98
        try:
            c_hex = f_color_hex.lstrip('#')
            if len(c_hex) == 6:
                r, g, b = int(c_hex[0:2], 16)/255.0, int(c_hex[2:4], 16)/255.0, int(c_hex[4:6], 16)/255.0
        except: pass

        location = face.Location()
        triangulation = BRep_Tool.Triangulation(face, location)
        
        if triangulation:
            node_offset = len(vertices) // 3
            trsf = location.Transformation()
            is_reversed = (face.Orientation() == TopAbs_REVERSED)
            
            # Extract vertices and apply location transformation
            for i in range(1, triangulation.NbNodes() + 1):
                pnt = triangulation.Node(i)
                pnt.Transform(trsf)
                vertices.extend([pnt.X(), pnt.Y(), pnt.Z()])
                colors.extend([r, g, b])
                
            # Compute and extract high-precision normals at each node
            has_uv = triangulation.HasUVNodes()
            if has_uv:
                try:
                    adaptor = BRepAdaptor_Surface(face)
                    for i in range(1, triangulation.NbNodes() + 1):
                        uv = triangulation.UVNode(i)
                        props = BRepLProp_SLProps(adaptor, uv.X(), uv.Y(), 1, 1e-6)
                        if props.IsNormalDefined():
                            normal = props.Normal()
                            normal.Transform(trsf)
                            nx, ny, nz = normal.X(), normal.Y(), normal.Z()
                            if is_reversed:
                                nx, ny, nz = -nx, -ny, -nz
                            normals.extend([nx, ny, nz])
                        else:
                            normals.extend([0.0, 0.0, 1.0])
                except Exception as norm_err:
                    print(f"[WARNING] Normal extraction failed for face: {norm_err}")
                    for _ in range(triangulation.NbNodes()):
                        normals.extend([0.0, 0.0, 1.0])
            else:
                for _ in range(triangulation.NbNodes()):
                    normals.extend([0.0, 0.0, 1.0])
                
            # Extract triangles (indices)
            for i in range(1, triangulation.NbTriangles() + 1):
                tri = triangulation.Triangle(i)
                idx1, idx2, idx3 = tri.Get()
                # OCCT indices are 1-based
                indices.extend([idx1 - 1 + node_offset, idx2 - 1 + node_offset, idx3 - 1 + node_offset])

            # Compute basic face properties
            props = GProp_GProps()
            brepgprop.SurfaceProperties(face, props)
            face_area = props.Mass()
            v_count = triangulation.NbNodes()
            curvature = "unknown"
            
            surface_type = "UNKNOWN"
            axis_origin = None
            axis_direction = None
            radius = None
            
            try:
                adaptor = BRepAdaptor_Surface(face)
                geom_type = adaptor.GetType()
                if geom_type == GeomAbs_Cylinder:
                    surface_type = "CYLINDER"
                    curvature = "cylindrical"
                    cyl = adaptor.Cylinder()
                    ax3 = cyl.Position()
                    loc = ax3.Location()
                    dir_vec = ax3.Direction()
                    axis_origin = [loc.X(), loc.Y(), loc.Z()]
                    axis_direction = [dir_vec.X(), dir_vec.Y(), dir_vec.Z()]
                    radius = cyl.Radius()
                elif geom_type == GeomAbs_Plane:
                    surface_type = "PLANE"
                    curvature = "planar"
            except Exception as e:
                print(f"[WARNING] Surface type extraction failed: {e}")

            # Resolve TNS 2.0 Name
            tns_name = None
            for name, h_val in linker.generation_map.items():
                if h_val == h_face:
                    tns_name = name
                    break

            # Record face metadata for selection resolution
            face_metadata.append({
                "id": str(get_shape_hash(face, 1000000)), # Transient Hash
                "tns_name": tns_name,
                "area": face_area,
                "curvature": curvature,
                "v_count": v_count,
                "index_range": [node_offset, len(vertices) // 3],
                "surface_type": surface_type,
                "axis_origin": axis_origin,
                "axis_direction": axis_direction,
                "radius": radius
            })
                
        explorer.Next()

    # Extract Edge Metadata
    explorer_edge = TopExp_Explorer(shape, TopAbs_EDGE)
    while explorer_edge.More():
        edge = topods.Edge(explorer_edge.Current())
        if not edge.IsNull():
            v_exp = TopExp_Explorer(edge, TopAbs_VERTEX)
            pnts = []
            while v_exp.More():
                v = topods.Vertex(v_exp.Current())
                pt = BRep_Tool.Pnt(v)
                pnts.append([pt.X(), pt.Y(), pt.Z()])
                v_exp.Next()
            
            if len(pnts) >= 2:
                # Basic signature
                props = GProp_GProps()
                brepgprop.LinearProperties(edge, props)
                length = props.Mass()
                
                edge_metadata.append({
                    "id": str(get_shape_hash(edge, 1000000)),
                    "start": pnts[0],
                    "end": pnts[-1],
                    "length": length
                })
        explorer_edge.Next()
        
    return {
        "vertices": vertices,
        "indices": indices,
        "normals": normals,
        "colors": colors,
        "face_metadata": face_metadata,
        "edge_metadata": edge_metadata
    }

def find_matching_edge(shape, target_start, target_end, signature=None):
    """
    Topological Naming Service (TNS) for edges:
    Prioritizes history-based matching (TNS 2.0) then falls back to geometric proximity.
    """
    if not shape or shape.IsNull():
        return None
        
    # 1. TNS 2.0: History-based resolution
    if signature and 'tns_name' in signature:
        tns_name = signature['tns_name']
        target_hash = linker.generation_map.get(tns_name)
        if target_hash:
            explorer = TopExp_Explorer(shape, TopAbs_EDGE)
            while explorer.More():
                edge = topods.Edge(explorer.Current())
                if get_shape_hash(edge, 10000000) == target_hash:
                    return edge
                explorer.Next()

    # 2. TNS 1.0: Geometric fallback
    try:
        t_start = [float(target_start[0]), float(target_start[1]), float(target_start[2])]
        t_end = [float(target_end[0]), float(target_end[1]), float(target_end[2])]
    except Exception:
        return None
        
    best_edge = None
    min_dist = float('inf')
    
    explorer = TopExp_Explorer(shape, TopAbs_EDGE)
    while explorer.More():
        edge = topods.Edge(explorer.Current())
        v_exp = TopExp_Explorer(edge, TopAbs_VERTEX)
        pnts = []
        while v_exp.More():
            v = topods.Vertex(v_exp.Current())
            pt = BRep_Tool.Pnt(v)
            pnts.extend([[pt.X(), pt.Y(), pt.Z()]])
            v_exp.Next()
            
        if len(pnts) >= 2:
            unique_pnts = []
            for p in pnts:
                if not any(math.dist(p, up) < 1e-4 for up in unique_pnts):
                    unique_pnts.append(p)
                    
            if len(unique_pnts) >= 2:
                d1 = math.dist(unique_pnts[0], t_start) + math.dist(unique_pnts[1], t_end)
                d2 = math.dist(unique_pnts[0], t_end) + math.dist(unique_pnts[1], t_start)
                d = min(d1, d2)
                if d < min_dist:
                    min_dist = d
                    best_edge = edge
                    
        explorer.Next()
        
        # TNS Edge Signature Matching
    if signature and 'length' in signature:
        target_len = float(signature['length'])
        # Re-evaluate candidates based on length similarity
        # (This is a simplified version, in a full TNS we'd store all candidate scores)
        pass

    if min_dist < 5.0:
        return best_edge
    return None

def get_tangent_edges(shape, start_edge, angular_tolerance=0.01):
    tangent_edges = [start_edge]
    visited_hashes = set([get_shape_hash(start_edge, 2**31 - 1)])
    
    # Map vertices to edges
    v_e_map = TopTools_IndexedDataMapOfShapeListOfShape()
    topexp.MapShapesAndAncestors(shape, TopAbs_VERTEX, TopAbs_EDGE, v_e_map)
    
    queue = [start_edge]
    while queue:
        current_edge = queue.pop(0)
        c_curve = BRepAdaptor_Curve(current_edge)
        
        # Get vertices of current edge
        v_exp = TopExp_Explorer(current_edge, TopAbs_VERTEX)
        while v_exp.More():
            v = topods.Vertex(v_exp.Current())
            v_exp.Next()
            
            # evaluate tangent of current_edge at v
            param_c = BRep_Tool.Parameter(v, current_edge)
            pt_c = gp_Pnt()
            vec_c = gp_Vec()
            c_curve.D1(param_c, pt_c, vec_c)
            if vec_c.Magnitude() < 1e-7:
                continue
            vec_c.Normalize()
            
            # Check adjacent edges
            if v_e_map.Contains(v):
                edge_list = v_e_map.FindFromKey(v)
                it = TopTools_ListIteratorOfListOfShape(edge_list)
                while it.More():
                    adj_shape = it.Value()
                    it.Next()
                    adj_edge = topods.Edge(adj_shape)
                    ehash = get_shape_hash(adj_edge, 2**31 - 1)
                    if ehash in visited_hashes:
                        continue
                        
                    # Check tangency
                    adj_curve = BRepAdaptor_Curve(adj_edge)
                    param_adj = BRep_Tool.Parameter(v, adj_edge)
                    pt_adj = gp_Pnt()
                    vec_adj = gp_Vec()
                    adj_curve.D1(param_adj, pt_adj, vec_adj)
                    if vec_adj.Magnitude() < 1e-7:
                        continue
                    vec_adj.Normalize()
                    
                    # Angle between vectors
                    dot = max(-1.0, min(1.0, vec_c.Dot(vec_adj)))
                    angle = math.acos(dot)
                    
                    # Tangent if angle is ~0 or ~180 degrees
                    if angle < angular_tolerance or abs(angle - math.pi) < angular_tolerance:
                        tangent_edges.append(adj_edge)
                        visited_hashes.add(ehash)
                        queue.append(adj_edge)
                        
    return tangent_edges

def _build_wire_from_points(points, is_closed=True, edge_map=None):
    """
    Builds a TopoDS_Wire from a list of points.
    If edge_map is provided, it populates it with { edge_id: TopoDS_Edge }.
    """
    make_wire = BRepBuilderAPI_MakeWire()
    
    def get_gp_pnt(p):
        x_val = float(p[0])
        y_val = float(p[1])
        z_val = float(p[2]) if len(p) >= 3 and isinstance(p[2], (int, float)) else 0.0
        return gp_Pnt(x_val, y_val, z_val)

    def get_label(p):
        return p[2] if len(p) > 2 and isinstance(p[2], str) else None
        
    def get_metadata(p):
        # Metadata is expected at index 3: [x, y, tag, metadata_dict]
        return p[3] if len(p) > 3 and isinstance(p[3], dict) else {}

    i = 0
    n_points = len(points)
    limit = n_points if is_closed else n_points - 1
    
    while i < limit:
        p_start = points[i]
        p_next = points[(i + 1) % n_points]
        start_label = get_label(p_start)
        next_label = get_label(p_next)
        metadata = get_metadata(p_start)
        edge_id = metadata.get('edgeId')

        current_edge = None
        if start_label == 'CIRCLE_CENTER':
            p_perimeter = p_next
            center_pnt = get_gp_pnt(p_start)
            perim_pnt = get_gp_pnt(p_perimeter)
            radius = center_pnt.Distance(perim_pnt)
            if radius > 1e-6:
                # Fetch normal from metadata or default to Z-up for 2D profiles
                normal_vec = metadata.get('planeNormal', [0.0, 0.0, 1.0])
                nx, ny, nz = float(normal_vec[0]), float(normal_vec[1]), float(normal_vec[2])
                n_len = math.sqrt(nx*nx + ny*ny + nz*nz)
                if n_len > 1e-6: nx, ny, nz = nx/n_len, ny/n_len, nz/n_len
                else: nx, ny, nz = 0.0, 0.0, 1.0
                
                circle = gp_Circ(gp_Ax2(center_pnt, gp_Dir(nx, ny, nz)), radius)
                current_edge = BRepBuilderAPI_MakeEdge(circle).Edge()
            i += 2
        elif next_label == 'ARC_CONTROL':
            p_control = p_next
            p_end = points[(i + 2) % n_points]

            arc = GC_MakeArcOfCircle(get_gp_pnt(p_start), get_gp_pnt(p_control), get_gp_pnt(p_end))
            if arc.IsDone():
                current_edge = BRepBuilderAPI_MakeEdge(arc.Value()).Edge()
            else:
                p_s = get_gp_pnt(p_start)
                p_e = get_gp_pnt(p_end)
                if p_s.Distance(p_e) > 1e-6:
                    current_edge = BRepBuilderAPI_MakeEdge(p_s, p_e).Edge()
            i += 2
        elif next_label == 'SPLINE_CONTROL':
            spline_pts = [p_start]
            curr_idx = (i + 1) % n_points
            while get_label(points[curr_idx]) == 'SPLINE_CONTROL':
                spline_pts.append(points[curr_idx])
                curr_idx = (curr_idx + 1) % n_points
                if not is_closed and curr_idx == 0:
                    break
            
            p_end = points[curr_idx]
            spline_pts.append(p_end)
            
            h_array = TColgp_HArray1OfPnt(1, len(spline_pts))
            for idx, pt in enumerate(spline_pts):
                h_array.SetValue(idx + 1, get_gp_pnt(pt))
                
            anInterpolation = GeomAPI_Interpolate(h_array, False, 1.0e-3)
            anInterpolation.Perform()
            if anInterpolation.IsDone():
                spline_curve = anInterpolation.Curve()
                current_edge = BRepBuilderAPI_MakeEdge(spline_curve).Edge()
            else:
                p_s = get_gp_pnt(p_start)
                p_e = get_gp_pnt(p_end)
                if p_s.Distance(p_e) > 1e-6:
                    current_edge = BRepBuilderAPI_MakeEdge(p_s, p_e).Edge()
                
            if curr_idx > i: i = curr_idx
            else: i = n_points
        else:
            p_s = get_gp_pnt(p_start)
            p_e = get_gp_pnt(p_next)
            if p_s.Distance(p_e) > 1e-6:
                current_edge = BRepBuilderAPI_MakeEdge(p_s, p_e).Edge()
            i += 1
            
        if current_edge:
            make_wire.Add(current_edge)
            if edge_map is not None and edge_id:
                edge_map[edge_id] = current_edge
            
    return make_wire.Wire()

def generate_iso_bolt(size_name, length=20.0):
    """
    Generates an ISO standard metric bolt (Hex head).
    """
    if not HAS_OCC: return None
    
    # Standard dimensions (approximate)
    bolt_specs = {
        "M3": {"d": 3.0, "k": 2.0, "s": 5.5},
        "M4": {"d": 4.0, "k": 2.8, "s": 7.0},
        "M5": {"d": 5.0, "k": 3.5, "s": 8.0},
        "M6": {"d": 6.0, "k": 4.0, "s": 10.0},
        "M8": {"d": 8.0, "k": 5.3, "s": 13.0},
        "M10": {"d": 10.0, "k": 6.4, "s": 17.0},
        "M12": {"d": 12.0, "k": 7.5, "s": 19.0}
    }
    
    spec = bolt_specs.get(size_name.upper(), bolt_specs["M6"])
    d, k, s = spec["d"], spec["k"], spec["s"]
    
    # 1. Shank (Cylinder)
    ax_shank = gp_Ax2(gp_Pnt(0, 0, 0), gp_Dir(0, 0, 1))
    shank = BRepPrimAPI_MakeCylinder(ax_shank, d/2.0, length).Shape()
    
    # 2. Hex Head
    pts = []
    r_head = s / math.cos(math.pi/6) / 2.0 
    for i in range(7):
        angle = i * (2 * math.pi / 6)
        pts.append([r_head * math.cos(angle), r_head * math.sin(angle), 0])
    
    head_wire = _build_wire_from_points(pts, is_closed=True)
    head_face = BRepBuilderAPI_MakeFace(head_wire).Face()
    prism_head = BRepPrimAPI_MakePrism(head_face, gp_Vec(0, 0, -k)).Shape()
    
    # 3. Fuse
    final_bolt = BRepAlgoAPI_Fuse(shank, prism_head).Shape()
    return final_bolt

def generate_iso_nut(size_name):
    """
    Generates an ISO standard metric hex nut.
    """
    if not HAS_OCC: return None
    
    nut_specs = {
        "M3": {"m": 2.4, "s": 5.5, "d": 3.0},
        "M4": {"m": 3.2, "s": 7.0, "d": 4.0},
        "M5": {"m": 4.0, "s": 8.0, "d": 5.0},
        "M6": {"m": 5.0, "s": 10.0, "d": 6.0},
        "M8": {"m": 6.5, "s": 13.0, "d": 8.0},
        "M10": {"m": 8.0, "s": 17.0, "d": 10.0},
        "M12": {"m": 10.0, "s": 19.0, "d": 12.0}
    }
    
    spec = nut_specs.get(size_name.upper(), nut_specs["M6"])
    m, s, d = spec["m"], spec["s"], spec["d"]
    
    # 1. Hex Body
    pts = []
    r_nut = s / math.cos(math.pi/6) / 2.0
    for i in range(7):
        angle = i * (2 * math.pi / 6)
        pts.append([r_nut * math.cos(angle), r_nut * math.sin(angle), 0])
        
    head_wire = _build_wire_from_points(pts, is_closed=True)
    head_face = BRepBuilderAPI_MakeFace(head_wire).Face()
    body = BRepPrimAPI_MakePrism(head_face, gp_Vec(0, 0, m)).Shape()
    
    # 2. Hole
    ax_hole = gp_Ax2(gp_Pnt(0, 0, -1), gp_Dir(0, 0, 1))
    hole = BRepPrimAPI_MakeCylinder(ax_hole, d/2.0, m + 2).Shape()
    
    # 3. Cut
    final_nut = BRepAlgoAPI_Cut(body, hole).Shape()
    return final_nut

# import_step_file, detect_interference — moved to export_utils.py

def build_feature_shape_in_isolation(f_type, params, parent_shape=None, all_features=[]):
    print(f"[DEBUG] build_feature_shape_in_isolation: type={f_type}, HAS_OCC={HAS_OCC}")
    if not HAS_OCC:
        return None

    current_feat_shape = None

    if f_type == 'DUMB_SOLID':
        filepath = params.get('filepath')
        if filepath and os.path.exists(filepath):
            # We cache the imported shape in a way or just re-read for now
            imported_shape = import_step_file(filepath)
            if imported_shape:
                # Apply optional transformation
                x, y, z = float(params.get('x', 0)), float(params.get('y', 0)), float(params.get('z', 0))
                if x != 0 or y != 0 or z != 0:
                    trsf = gp_Trsf()
                    trsf.SetTranslation(gp_Vec(x, y, z))
                    imported_shape.Move(TopLoc_Location(trsf))
                return imported_shape
        return None

    if f_type == 'TOOLBOX_PART':
        part_type = params.get('partType', 'BOLT')
        size = params.get('size', 'M6')
        length = float(params.get('length', 20.0))
        if part_type == 'BOLT':
            return generate_iso_bolt(size, length)
        elif part_type == 'NUT':
            return generate_iso_nut(size)
        return None

    if f_type == 'SKETCH_POLYLINE' or f_type == 'EXTRUDE':
        plane_type = params.get('plane', 'FRONT')
        depth = float(params.get('depth', 10.0))
        points_2d = params.get('points', [])

        # Check if nested list of loops (multi-loop)
        is_nested = False
        if points_2d and isinstance(points_2d[0], list) and len(points_2d[0]) > 0 and isinstance(points_2d[0][0], list):
            is_nested = True

        loops = points_2d if is_nested else [points_2d]
        cleaned_loops = []

        for loop in loops:
            filtered_points = []
            for pt in loop:
                if not pt:
                    continue
                if not filtered_points:
                    filtered_points.append(pt)
                else:
                    prev = filtered_points[-1]
                    dist = math.hypot(float(pt[0]) - float(prev[0]), float(pt[1]) - float(prev[1]))
                    if dist > 1e-4:
                        filtered_points.append(pt)

            if len(filtered_points) > 1:
                first = filtered_points[0]
                last = filtered_points[-1]
                dist = math.hypot(float(first[0]) - float(last[0]), float(first[1]) - float(last[1]))
                if dist < 1e-4:
                    filtered_points.pop()

            if len(filtered_points) >= 3:
                cleaned_loops.append(filtered_points)

        if not cleaned_loops:
            return None

        x_origin = float(params.get('x', 0.0))
        y_origin = float(params.get('y', 0.0))
        z_origin = float(params.get('z', 0.0))

        if plane_type == 'FRONT':
            ax2 = gp_Ax2(gp_Pnt(x_origin, y_origin, z_origin), gp_Dir(0, 0, 1), gp_Dir(1, 0, 0))
        elif plane_type == 'TOP':
            ax2 = gp_Ax2(gp_Pnt(x_origin, y_origin, z_origin), gp_Dir(0, 1, 0), gp_Dir(1, 0, 0))
        elif plane_type == 'RIGHT':
            ax2 = gp_Ax2(gp_Pnt(x_origin, y_origin, z_origin), gp_Dir(1, 0, 0), gp_Dir(0, 1, 0))
        elif plane_type == 'FACE':
            face_origin = params.get('faceOrigin', [0.0, 0.0, 0.0])
            face_normal = params.get('faceNormal', [0.0, 0.0, 1.0])

            # Resolve face topology naming on rebuilt parent shape
            if parent_shape is not None and not parent_shape.IsNull():
                matched_origin, matched_normal, _ = find_matching_face(parent_shape, face_origin, face_normal)
                face_origin = matched_origin
                face_normal = matched_normal

            ox, oy, oz = float(face_origin[0]), float(face_origin[1]), float(face_origin[2])
            nx, ny, nz = float(face_normal[0]), float(face_normal[1]), float(face_normal[2])
            
            n_len = math.sqrt(nx*nx + ny*ny + nz*nz)
            if n_len > 1e-6: nx, ny, nz = nx/n_len, ny/n_len, nz/n_len
            else: nx, ny, nz = 0.0, 0.0, 1.0

            if abs(nx) < 1e-5 and abs(ny) < 1e-5: xx, xy, xz = 1.0, 0.0, 0.0
            else:
                xx, xy, xz = -ny, nx, 0.0
                x_len = math.sqrt(xx*xx + xy*xy)
                xx, xy = xx/x_len, xy/x_len

            ax2 = gp_Ax2(gp_Pnt(ox, oy, oz), gp_Dir(nx, ny, nz), gp_Dir(xx, xy, xz))
        
        # Custom Reference Plane Resolution (TNS Stage 2+)
        elif any((f.get('id') if isinstance(f, dict) else getattr(f, 'id', None)) == plane_type for f in all_features):
            target_plane = next((f for f in all_features if (f.get('id') if isinstance(f, dict) else getattr(f, 'id', None)) == plane_type), None)
            p_params = target_plane.get('parameters', {}) if isinstance(target_plane, dict) else getattr(target_plane, 'parameters', {})
            p_res = generate_reference_plane(p_params.get('planeType', 'OFFSET'), p_params.get('refs', []), p_params.get('offset', 0.0), all_features, angle=p_params.get('angle', 0.0))
            ax2 = gp_Ax2(gp_Pnt(*p_res['origin']), gp_Dir(*p_res['normal']), gp_Dir(*p_res['xDir']))
        
        else:
            ax2 = gp_Ax2(gp_Pnt(x_origin, y_origin, z_origin), gp_Dir(0, 0, 1))

        # Extrude along plane normal in global coordinates
        normal_dir = ax2.Direction()
        is_flip = params.get('flip', False)
        depth = float(params.get('depth', 10.0))
        end_cond = params.get('endCondition', 'BLIND')
        
        # --- Up To Next / Up To Surface implementation via Raycasting ---
        if end_cond in ['UP_TO_NEXT', 'UP_TO_SURFACE'] and parent_shape and not parent_shape.IsNull():
            try:
                # Use multiple sample points from the first sketch loop as ray origins for robustness
                sample_pts = []
                if cleaned_loops:
                    loop = cleaned_loops[0]
                    # Centroid
                    cx, cy, cz = 0.0, 0.0, 0.0
                    for pt in loop:
                        cx += float(pt[0]); cy += float(pt[1]); cz += float(pt[2])
                    sample_pts.append(gp_Pnt(cx/len(loop), cy/len(loop), cz/len(loop)))
                    # Add mid-points of some edges
                    if len(loop) > 4:
                        for i in [0, len(loop)//4, len(loop)//2]:
                            p1, p2 = loop[i], loop[(i+1)%len(loop)]
                            sample_pts.append(gp_Pnt((p1[0]+p2[0])/2, (p1[1]+p2[1])/2, (p1[2]+p2[2])/2))

                ray_dir_gp = gp_Dir(-normal_dir.X(), -normal_dir.Y(), -normal_dir.Z()) if is_flip else normal_dir
                intersector = IntCurvesFace_ShapeIntersector()
                intersector.Load(parent_shape, 1e-4)
                
                valid_distances = []
                trsf = gp_Trsf()
                trsf.SetTransformation(gp_Ax3(ax2), gp_Ax3())
                
                for pnt in sample_pts:
                    pnt.Transform(trsf)
                    ray = gp_Lin(pnt, ray_dir_gp)
                    intersector.Perform(ray, 0.001, 9999.0)
                    
                    if intersector.IsDone():
                        for i in range(1, intersector.NbPnt() + 1):
                            d = intersector.WParameter(i)
                            if d > 0.001:
                                valid_distances.append(d)
                
                if valid_distances:
                    depth = min(valid_distances)
            except Exception as e:
                print(f"[WARNING] {end_cond} ray casting failed: {e}")

        mag = -depth if is_flip else depth
        vec = gp_Vec(normal_dir.X() * mag, normal_dir.Y() * mag, normal_dir.Z() * mag)
        
        print(f"[DEBUG] EXTRUDE: plane={plane_type}, depth={depth}, flip={is_flip}, vec=({vec.X()},{vec.Y()},{vec.Z()})")

        try:
            wires = []
            edge_map = {} # { edge_id: TopoDS_Edge }
            for loop in cleaned_loops:
                wire = _build_wire_from_points(loop, edge_map=edge_map)
                wires.append(wire)

            if params.get('operation') == 'SURFACE':
                # Surface extrusion tracking
                builder = BRep_Builder()
                comp = TopoDS_Compound()
                builder.MakeCompound(comp)
                
                for w in wires:
                    trsf = gp_Trsf()
                    trsf.SetTransformation(gp_Ax3(ax2), gp_Ax3())
                    moved_wire = BRepBuilderAPI_Transform(w, trsf).Shape()
                    prism_tool = BRepPrimAPI_MakePrism(moved_wire, vec)
                    prism_shape = prism_tool.Shape()
                    builder.Add(comp, prism_shape)
                    
                    # Track generated faces for surface sweep/extrude
                    for eid, edge in edge_map.items():
                        gen_faces = prism_tool.Generated(edge)
                        # TopTools_ListOfShape needs iterator in pythonocc
                        if gen_faces is not None:
                            try:
                                extent = gen_faces.Extent()
                            except Exception:
                                extent = 0
                            if extent > 0:
                                it = TopTools_ListIteratorOfListOfShape(gen_faces)
                                while it.More():
                                    gf = it.Value()
                                    it.Next()
                                    if gf and not gf.IsNull():
                                        linker.mapping[f"{eid}_GEN"] = get_shape_hash(gf, 10000000)
                                        break

                current_feat_shape = comp
            else:
                # --- Thin Feature Logic ---
                is_thin = params.get('isThin', False)
                if is_thin:
                    try:
                        thin_thickness = float(params.get('thinThickness', 1.0))
                        thin_dir = params.get('thinDirection', 'ONE_DIRECTION')
                        
                        # We use the first loop as the base for the thin wall
                        base_wire = wires[0]
                        offset_tool = BRepOffsetAPI_MakeOffset()
                        offset_tool.AddWire(base_wire)
                        
                        if thin_dir == 'MID_PLANE':
                            offset_tool.Perform(thin_thickness / 2.0)
                            w1 = topods.Wire(offset_tool.Shape())
                            offset_tool.Perform(-thin_thickness / 2.0)
                            w2 = topods.Wire(offset_tool.Shape())
                            
                            make_face = BRepBuilderAPI_MakeFace(w1)
                            make_face.Add(w2)
                            face = make_face.Face()
                        else:
                            # One Direction
                            offset_tool.Perform(thin_thickness)
                            w_off = topods.Wire(offset_tool.Shape())
                            
                            make_face = BRepBuilderAPI_MakeFace(w_off)
                            make_face.Add(base_wire)
                            face = make_face.Face()
                    except Exception as thin_err:
                        print(f"[WARNING] Thin Feature failed: {thin_err}, falling back to solid.")
                        make_face = BRepBuilderAPI_MakeFace(wires[0])
                        for inner_wire in wires[1:]:
                            make_face.Add(inner_wire)
                        face = make_face.Face()
                else:
                    # Solid extrusion tracking
                    make_face = BRepBuilderAPI_MakeFace(wires[0])
                    for inner_wire in wires[1:]:
                        make_face.Add(inner_wire)
                    face = make_face.Face()
                
                # Move face to local plane
                trsf = gp_Trsf()
                trsf.SetTransformation(gp_Ax3(ax2), gp_Ax3())
                face.Move(TopLoc_Location(trsf))

                prism_tool = BRepPrimAPI_MakePrism(face, vec)
                current_feat_shape = prism_tool.Shape()
                
                # --- Draft Logic (Refined with History) ---
                draft_angle = float(params.get('draftAngle', 0.0))
                if draft_angle > 0.1:
                    try:
                        draft_tool = BRepOffsetAPI_DraftAngle(current_feat_shape)
                        angle_rad = math.radians(draft_angle)
                        if params.get('draftOutward'): angle_rad = -angle_rad

                        # Use history to find only the side faces generated from sketch edges
                        for eid, local_edge in edge_map.items():
                            moved_edge = topods.Edge(BRepBuilderAPI_Transform(local_edge, trsf).Shape())
                            gen_faces = prism_tool.Generated(moved_edge)
                            if gen_faces is not None:
                                try:
                                    extent = gen_faces.Extent()
                                except Exception:
                                    extent = 0
                                if extent > 0:
                                    it = TopTools_ListIteratorOfListOfShape(gen_faces)
                                    while it.More():
                                        gf = it.Value()
                                        it.Next()
                                        if gf and not gf.IsNull():
                                            # draft_tool.Add(face, direction, angle, neutral_plane)
                                            draft_tool.Add(gf, normal_dir, angle_rad, gp_Pln(ax2))

                        if draft_tool.IsDone():
                            current_feat_shape = draft_tool.Shape()
                    except Exception as draft_err:
                        print(f"[WARNING] Draft failed: {draft_err}")
                # --- Surface Mode Check ---
                if params.get('isSurfaceOnly'):
                    # Remove start/end caps if surface mode
                    explorer = TopExp_Explorer(current_feat_shape, TopAbs_FACE)
                    side_faces = []
                    while explorer.More():
                        side_faces.append(explorer.Current())
                        explorer.Next()
                    
                    # Logic to identify side vs caps
                    # We'll just return the compound of all faces for now as a "Surface"
                    builder = BRep_Builder()
                    comp_surf = TopoDS_Compound()
                    builder.MakeCompound(comp_surf)
                    for sf in side_faces:
                        builder.Add(comp_surf, sf)
                    current_feat_shape = comp_surf

                # --- TNS 2.0 Tracking ---
                feat_id = params.get('id', 'unknown')
                
                # 1. Track Side Faces (from edges)
                for eid, local_edge in edge_map.items():
                    moved_edge = topods.Edge(BRepBuilderAPI_Transform(local_edge, trsf).Shape())
                    gen_faces = prism_tool.Generated(moved_edge)
                    # TopTools_ListOfShape needs iterator in pythonocc
                    if gen_faces is not None:
                        try:
                            extent = gen_faces.Extent()
                        except Exception:
                            extent = 0
                        if extent > 0:
                            it = TopTools_ListIteratorOfListOfShape(gen_faces)
                            while it.More():
                                gf = it.Value()
                                it.Next()
                                if gf and not gf.IsNull():
                                    linker.record_generation(f"{eid}_GEN", gf)
                                    break
                
                # 2. Track Top Face (from the sketch face)
                gen_top_faces = prism_tool.Generated(face)
                if gen_top_faces is not None:
                    try:
                        extent = gen_top_faces.Extent()
                    except Exception:
                        extent = 0
                    if extent > 0:
                        it = TopTools_ListIteratorOfListOfShape(gen_top_faces)
                        while it.More():
                            gf = it.Value()
                            it.Next()
                            if gf and not gf.IsNull():
                                linker.record_generation(f"{feat_id}_TOP", gf)
                                break
                    
                # 3. Track Bottom Face (the original face itself is the bottom)
                linker.record_generation(f"{feat_id}_BOT", face)

        except Exception as sketch_err:
            print(f"[ERROR] Failed to construct sketch/prism with history: {sketch_err}")
            current_feat_shape = None

    elif f_type == 'REVOLVE':
        plane_type = params.get('plane', 'FRONT')
        angle = float(params.get('angle', 360.0)) * math.pi / 180.0
        points_2d = params.get('points', [])

        is_nested = False
        if points_2d and isinstance(points_2d[0], list) and len(points_2d[0]) > 0 and isinstance(points_2d[0][0], list):
            is_nested = True

        loops = points_2d if is_nested else [points_2d]
        cleaned_loops = []

        for loop in loops:
            filtered_points = []
            for pt in loop:
                if not pt:
                    continue
                if not filtered_points:
                    filtered_points.append(pt)
                else:
                    prev = filtered_points[-1]
                    dist = math.hypot(float(pt[0]) - float(prev[0]), float(pt[1]) - float(prev[1]))
                    if dist > 1e-4:
                        filtered_points.append(pt)

            if len(filtered_points) > 1:
                first = filtered_points[0]
                last = filtered_points[-1]
                dist = math.hypot(float(first[0]) - float(last[0]), float(first[1]) - float(last[1]))
                if dist < 1e-4:
                    filtered_points.pop()

            if len(filtered_points) >= 3:
                cleaned_loops.append(filtered_points)

        if not cleaned_loops:
            return None

        x_origin = float(params.get('x', 0.0))
        y_origin = float(params.get('y', 0.0))
        z_origin = float(params.get('z', 0.0))

        if plane_type == 'FRONT':
            ax2 = gp_Ax2(gp_Pnt(x_origin, y_origin, z_origin), gp_Dir(0, 0, 1), gp_Dir(1, 0, 0))
        elif plane_type == 'TOP':
            ax2 = gp_Ax2(gp_Pnt(x_origin, y_origin, z_origin), gp_Dir(0, 1, 0), gp_Dir(1, 0, 0))
        elif plane_type == 'RIGHT':
            ax2 = gp_Ax2(gp_Pnt(x_origin, y_origin, z_origin), gp_Dir(1, 0, 0), gp_Dir(0, 1, 0))
        elif plane_type == 'FACE':
            face_origin = params.get('faceOrigin', [0.0, 0.0, 0.0])
            face_normal = params.get('faceNormal', [0.0, 0.0, 1.0])

            # Resolve face topology naming on rebuilt parent shape
            if parent_shape is not None and not parent_shape.IsNull():
                matched_origin, matched_normal, _ = find_matching_face(parent_shape, face_origin, face_normal)
                face_origin = matched_origin
                face_normal = matched_normal

            ox, oy, oz = float(face_origin[0]), float(face_origin[1]), float(face_origin[2])
            nx, ny, nz = float(face_normal[0]), float(face_normal[1]), float(face_normal[2])
            
            n_len = math.sqrt(nx*nx + ny*ny + nz*nz)
            if n_len > 1e-6: nx, ny, nz = nx/n_len, ny/n_len, nz/n_len
            else: nx, ny, nz = 0.0, 0.0, 1.0

            if abs(nx) < 1e-5 and abs(ny) < 1e-5: xx, xy, xz = 1.0, 0.0, 0.0
            else:
                xx, xy, xz = -ny, nx, 0.0
                x_len = math.sqrt(xx*xx + xy*xy)
                xx, xy = xx/x_len, xy/x_len

            ax2 = gp_Ax2(gp_Pnt(ox, oy, oz), gp_Dir(nx, ny, nz), gp_Dir(xx, xy, xz))
        
        # Custom Reference Plane Resolution (TNS Stage 2+)
        elif any((f.get('id') if isinstance(f, dict) else getattr(f, 'id', None)) == plane_type for f in all_features):
            target_plane = next((f for f in all_features if (f.get('id') if isinstance(f, dict) else getattr(f, 'id', None)) == plane_type), None)
            p_params = target_plane.get('parameters', {}) if isinstance(target_plane, dict) else getattr(target_plane, 'parameters', {})
            p_res = generate_reference_plane(p_params.get('planeType', 'OFFSET'), p_params.get('refs', []), p_params.get('offset', 0.0), all_features, angle=p_params.get('angle', 0.0))
            ax2 = gp_Ax2(gp_Pnt(*p_res['origin']), gp_Dir(*p_res['normal']), gp_Dir(*p_res['xDir']))
        
        else:
            ax2 = gp_Ax2(gp_Pnt(x_origin, y_origin, z_origin), gp_Dir(0, 0, 1))

        try:
            edge_map = {}
            wires = []
            for loop in cleaned_loops:
                wire = _build_wire_from_points(loop, edge_map=edge_map)
                wires.append(wire)

            # Build face with holes
            make_face = BRepBuilderAPI_MakeFace(wires[0])
            for inner_wire in wires[1:]:
                make_face.Add(inner_wire)
            face = make_face.Face()

            # Revolve around custom axis if provided, otherwise default to local Y-axis
            axis_origin = gp_Pnt(0, 0, 0)
            axis_dir = gp_Dir(0, 1, 0)
            
            axis_edge_id = params.get('axis_edge_id')
            axis_pts_param = params.get('axis_points')
            
            if axis_pts_param and len(axis_pts_param) >= 2:
                p1 = gp_Pnt(float(axis_pts_param[0][0]), float(axis_pts_param[0][1]), float(axis_pts_param[0][2]))
                p2 = gp_Pnt(float(axis_pts_param[1][0]), float(axis_pts_param[1][1]), float(axis_pts_param[1][2]))
                vec = gp_Vec(p1, p2)
                if vec.Magnitude() > 1e-6:
                    axis_origin = p1
                    axis_dir = gp_Dir(vec)
            elif axis_edge_id and edge_map and axis_edge_id in edge_map:
                # Find the axis in the local edge_map
                axis_edge = edge_map[axis_edge_id]
                adaptor = BRepAdaptor_Curve(axis_edge)
                axis_origin = adaptor.Value(adaptor.FirstParameter())
                p_end = adaptor.Value(adaptor.LastParameter())
                vec = gp_Vec(axis_origin, p_end)
                if vec.Magnitude() > 1e-6:
                    axis_dir = gp_Dir(vec)

            local_axis = gp_Ax1(axis_origin, axis_dir)
            revol_tool = BRepPrimAPI_MakeRevol(face, local_axis, angle)
            revol_shape = revol_tool.Shape()

            # Move and rotate the revolved solid to ax2 plane
            trsf = gp_Trsf()
            trsf.SetTransformation(gp_Ax3(ax2), gp_Ax3())
            revol_shape.Move(TopLoc_Location(trsf))
            current_feat_shape = revol_shape
            
            # --- TNS 2.0 Tracking ---
            feat_id = params.get('id', 'unknown')
            for eid, local_edge in edge_map.items():
                gen_faces = revol_tool.Generated(local_edge)
                if gen_faces is not None:
                    try:
                        it = TopTools_ListIteratorOfListOfShape(gen_faces)
                        while it.More():
                            gf = it.Value()
                            it.Next()
                            if gf and not gf.IsNull():
                                gf.Move(TopLoc_Location(trsf))
                                linker.record_generation(f"{eid}_GEN", gf)
                                break
                    except:
                        if hasattr(gen_faces, 'IsNull') and not gen_faces.IsNull():
                            gen_faces.Move(TopLoc_Location(trsf))
                            linker.record_generation(f"{eid}_GEN", gen_faces)
            
            if angle < 2 * math.pi:
                start_cap = revol_tool.FirstShape()
                end_cap = revol_tool.LastShape()
                if not start_cap.IsNull():
                    start_cap.Move(TopLoc_Location(trsf))
                    linker.record_generation(f"{feat_id}_START", start_cap)
                if not end_cap.IsNull():
                    end_cap.Move(TopLoc_Location(trsf))
                    linker.record_generation(f"{feat_id}_END", end_cap)
        except Exception as e:
            print(f"[ERROR] Revolve failed inside build_feature_shape_in_isolation with history: {e}")
            current_feat_shape = None

    elif f_type == 'BOX':
        w = float(params.get('width', 10.0))
        h = float(params.get('height', 10.0))
        d = float(params.get('depth', 10.0))
        x = float(params.get('x', 0.0))
        y = float(params.get('y', 0.0))
        z = float(params.get('z', 0.0))
        current_feat_shape = BRepPrimAPI_MakeBox(gp_Pnt(x, y, z), w, h, d).Shape()

    elif f_type == 'CYLINDER':
        r = float(params.get('radius', 5.0))
        h = float(params.get('height', 10.0))
        x = float(params.get('x', 0.0))
        y = float(params.get('y', 0.0))
        z = float(params.get('z', 0.0))
        ax = gp_Ax2(gp_Pnt(x, y, z), gp_Dir(0, 0, 1))
        current_feat_shape = BRepPrimAPI_MakeCylinder(ax, r, h).Shape()

    elif f_type == 'SPHERE':
        r = float(params.get('radius', 5.0))
        x = float(params.get('x', 0.0))
        y = float(params.get('y', 0.0))
        z = float(params.get('z', 0.0))
        current_feat_shape = BRepPrimAPI_MakeSphere(gp_Pnt(x, y, z), r).Shape()

    elif f_type == 'SWEEP':
        profile_points = params.get('profile_points', [])
        path_points = params.get('path_points', [])
        guide_points_list = params.get('guide_points', []) # List of point arrays
        
        is_circular = params.get('circularProfile') or params.get('circular_profile')
        is_thin = params.get('isThin', False)
        
        twist_type = params.get('twistType', 'NONE')
        twist_value = float(params.get('twistValue', 0.0))
        
        total_twist_angle = 0.0
        if twist_type == 'DEGREES':
            total_twist_angle = math.radians(twist_value)
        elif twist_type == 'TURNS':
            total_twist_angle = twist_value * 2.0 * math.pi
        
        if not path_points:
            return None
        if not is_circular and not profile_points:
            return None
            
        try:
            # Construct path wire (open)
            path_wire = _build_wire_from_points(path_points, is_closed=False)
            edge_map = {}
            
            # Setup path start properties for circular profile
            circle_ax2 = None
            radius = 5.0
            if is_circular:
                diameter = float(params.get('diameter', 10.0))
                radius = diameter / 2.0
                exp_edge = TopExp_Explorer(path_wire, TopAbs_EDGE)
                if exp_edge.More():
                    first_edge = topods.Edge(exp_edge.Current())
                    adaptor = BRepAdaptor_Curve(first_edge)
                    first_param = adaptor.FirstParameter()
                    pt_start = gp_Pnt()
                    tangent_vec = gp_Vec()
                    adaptor.D1(first_param, pt_start, tangent_vec)
                    if tangent_vec.Magnitude() > 1e-6:
                        tangent_vec.Normalize()
                        circle_ax2 = gp_Ax2(pt_start, gp_Dir(tangent_vec))
                    else:
                        circle_ax2 = gp_Ax2(gp_Pnt(0, 0, 0), gp_Dir(0, 0, 1))
                else:
                    circle_ax2 = gp_Ax2(gp_Pnt(0, 0, 0), gp_Dir(0, 0, 1))

            def _subdivide_path_points(points, num_divisions=24):
                if len(points) < 2: return points
                lens = []
                tot_len = 0.0
                for i in range(len(points) - 1):
                    dx = points[i+1][0] - points[i][0]
                    dy = points[i+1][1] - points[i][1]
                    dz = points[i+1][2] - points[i][2]
                    l = math.sqrt(dx*dx + dy*dy + dz*dz)
                    lens.append(l)
                    tot_len += l
                if tot_len < 1e-6: return points
                new_points = []
                for j in range(num_divisions + 1):
                    target_d = (j / num_divisions) * tot_len
                    curr_d = 0.0
                    for i in range(len(points) - 1):
                        seg_l = lens[i]
                        if curr_d + seg_l >= target_d - 1e-9:
                            t = (target_d - curr_d) / seg_l if seg_l > 1e-9 else 0.0
                            p_start = points[i]
                            p_end = points[i+1]
                            px = p_start[0] + t * (p_end[0] - p_start[0])
                            py = p_start[1] + t * (p_end[1] - p_start[1])
                            pz = p_start[2] + t * (p_end[2] - p_start[2])
                            new_points.append([px, py, pz])
                            break
                        curr_d += seg_l
                return new_points

            def build_single_sweep(p_wire):
                if abs(total_twist_angle) > 1e-6:
                    # Subdivision-based twist sweep using ThruSections
                    M = 24
                    subdivided_pts = _subdivide_path_points(path_points, M)
                    loft_tool = BRepOffsetAPI_ThruSections(True, False)
                    
                    for j in range(M + 1):
                        p_j = subdivided_pts[j]
                        if j < M:
                            T_j = [subdivided_pts[j+1][0] - p_j[0], subdivided_pts[j+1][1] - p_j[1], subdivided_pts[j+1][2] - p_j[2]]
                        else:
                            T_j = [p_j[0] - subdivided_pts[j-1][0], p_j[1] - subdivided_pts[j-1][1], p_j[2] - subdivided_pts[j-1][2]]
                        
                        t_len = math.sqrt(T_j[0]**2 + T_j[1]**2 + T_j[2]**2)
                        T_j = [T_j[0]/t_len, T_j[1]/t_len, T_j[2]/t_len] if t_len > 1e-9 else [0.0, 0.0, 1.0]
                        
                        angle_j = (j / M) * total_twist_angle
                        
                        V_j = [p_j[0] - path_points[0][0], p_j[1] - path_points[0][1], p_j[2] - path_points[0][2]]
                        trsf = gp_Trsf()
                        trsf.SetTranslation(gp_Vec(V_j[0], V_j[1], V_j[2]))
                        translated = BRepBuilderAPI_Transform(p_wire, trsf).Shape()
                        
                        if abs(angle_j) > 1e-6:
                            rot_axis = gp_Ax1(gp_Pnt(p_j[0], p_j[1], p_j[2]), gp_Dir(T_j[0], T_j[1], T_j[2]))
                            trsf_rot = gp_Trsf()
                            trsf_rot.SetRotation(rot_axis, angle_j)
                            transformed = BRepBuilderAPI_Transform(translated, trsf_rot).Shape()
                        else:
                            transformed = translated
                            
                        wire_j = topods.Wire(transformed)
                        loft_tool.AddWire(wire_j)
                        
                    loft_tool.Build()
                    if loft_tool.IsDone():
                        return loft_tool.Shape(), None
                    return None, None
                else:
                    sweep_tool = BRepOffsetAPI_MakePipeShell(path_wire)
                    sweep_tool.Add(p_wire)
                    
                    # Add guide curves if provided
                    for guide_pts in guide_points_list:
                        if guide_pts:
                            guide_wire = _build_wire_from_points(guide_pts, is_closed=False)
                            try:
                                sweep_tool.SetGuide(guide_wire)
                            except Exception:
                                pass
                    
                    # Alignment control
                    alignment = params.get('alignment', 'PARALLEL')
                    if alignment == 'PERPENDICULAR':
                        try:
                            sweep_tool.SetMode(GeomAbs_Perpendicular)
                        except Exception:
                            pass
                    
                    # Flip profile control
                    flip_profile = params.get('flip_profile', False)
                    if flip_profile:
                        try:
                            reversed_wire = p_wire.Reversed()
                            sweep_tool = BRepOffsetAPI_MakePipeShell(path_wire)
                            sweep_tool.Add(reversed_wire)
                            for guide_pts in guide_points_list:
                                if guide_pts:
                                    guide_wire = _build_wire_from_points(guide_pts, is_closed=False)
                                    try:
                                        sweep_tool.SetGuide(guide_wire)
                                    except Exception:
                                        pass
                        except Exception:
                            pass
                    
                    sweep_tool.Build()
                    if sweep_tool.IsDone():
                        sweep_tool.MakeSolid()
                        return sweep_tool.Shape(), sweep_tool
                    return None, None

            if is_thin:
                thin_thickness = float(params.get('thinThickness', 1.0))
                thin_dir = params.get('thinDirection', 'ONE_DIRECTION')
                
                # Build outer and inner wires
                if is_circular:
                    r_out = radius
                    r_in = radius - thin_thickness if thin_dir == 'ONE_DIRECTION' else (radius - thin_thickness/2.0 if thin_dir == 'MID_PLANE' else radius - thin_thickness)
                    r_in = max(0.1, r_in)
                    
                    circle_geom_out = gp_Circ(circle_ax2, r_out)
                    outer_wire = BRepBuilderAPI_MakeWire(BRepBuilderAPI_MakeEdge(circle_geom_out).Edge()).Wire()
                    
                    circle_geom_in = gp_Circ(circle_ax2, r_in)
                    inner_wire = BRepBuilderAPI_MakeWire(BRepBuilderAPI_MakeEdge(circle_geom_in).Edge()).Wire()
                else:
                    profile_wire = _build_wire_from_points(profile_points, is_closed=True, edge_map=edge_map)
                    outer_wire = profile_wire
                    offset_tool = BRepOffsetAPI_MakeOffset()
                    offset_tool.AddWire(profile_wire)
                    if thin_dir == 'MID_PLANE':
                        offset_tool.Perform(-thin_thickness / 2.0)
                        inner_wire = topods.Wire(offset_tool.Shape())
                        
                        offset_tool_out = BRepOffsetAPI_MakeOffset()
                        offset_tool_out.AddWire(profile_wire)
                        offset_tool_out.Perform(thin_thickness / 2.0)
                        outer_wire = topods.Wire(offset_tool_out.Shape())
                    else:
                        offset_tool.Perform(-thin_thickness)
                        inner_wire = topods.Wire(offset_tool.Shape())
                
                outer_solid, out_shell = build_single_sweep(outer_wire)
                inner_solid, _ = build_single_sweep(inner_wire)
                
                if outer_solid and inner_solid:
                    res_shape = BRepAlgoAPI_Cut(outer_solid, inner_solid).Shape()
                    
                    # Track TNS 2.0 for outer shell
                    if out_shell:
                        for eid, local_edge in edge_map.items():
                            gen_faces = out_shell.Generated(local_edge)
                            if gen_faces is not None:
                                try:
                                    ext = gen_faces.Extent()
                                except Exception:
                                    ext = 0
                                if ext > 0:
                                    it = TopTools_ListIteratorOfListOfShape(gen_faces)
                                    while it.More():
                                        gf = it.Value()
                                        it.Next()
                                        if gf and not gf.IsNull():
                                            linker.record_generation(f"{eid}_GEN", gf)
                                            break
                    return res_shape
            else:
                # Solid / standard sweep
                if is_circular:
                    circle_geom = gp_Circ(circle_ax2, radius)
                    profile_wire = BRepBuilderAPI_MakeWire(BRepBuilderAPI_MakeEdge(circle_geom).Edge()).Wire()
                else:
                    profile_wire = _build_wire_from_points(profile_points, is_closed=True, edge_map=edge_map)
                
                solid_shape, sweep_tool = build_single_sweep(profile_wire)
                if solid_shape:
                    # Track TNS 2.0
                    if sweep_tool:
                        for eid, local_edge in edge_map.items():
                            gen_faces = sweep_tool.Generated(local_edge)
                            if gen_faces is not None:
                                try:
                                    ext = gen_faces.Extent()
                                except Exception:
                                    ext = 0
                                if ext > 0:
                                    it = TopTools_ListIteratorOfListOfShape(gen_faces)
                                    while it.More():
                                        gf = it.Value()
                                        it.Next()
                                        if gf and not gf.IsNull():
                                            linker.record_generation(f"{eid}_GEN", gf)
                                            break
                    return solid_shape
        except Exception as sweep_err:
            print(f"[ERROR] SWEEP feature failed: {sweep_err}")
            return None
    elif f_type == 'HELICAL_SWEEP':
        profile_points = params.get('profile_points', [])
        if not profile_points:
            return None
            
        pitch = float(params.get('pitch', 5.0))
        revolutions = float(params.get('revolutions', 10.0))
        diameter = float(params.get('diameter', 20.0))
        handedness = params.get('handedness', 'CW')
        start_angle = float(params.get('start_angle', 0.0))
        taper_angle = float(params.get('taper_angle', 0.0))
        axis_points = params.get('axis_points', [])
        
        try:
            # 1. Setup axis (gp_Ax2)
            if len(axis_points) >= 2:
                p1 = gp_Pnt(axis_points[0][0], axis_points[0][1], axis_points[0][2])
                p2 = gp_Pnt(axis_points[1][0], axis_points[1][1], axis_points[1][2])
                vec = gp_Vec(p1, p2)
                if vec.Magnitude() < 1e-6:
                    axis_ax = gp_Ax2(p1, gp_Dir(0, 0, 1))
                else:
                    axis_ax = gp_Ax2(p1, gp_Dir(vec))
            else:
                axis_ax = gp_Ax2(gp_Pnt(0, 0, 0), gp_Dir(0, 0, 1))

            # 2. Setup surface (Cylindrical or Conical)
            if abs(taper_angle) < 1e-6:
                surf = Geom_CylindricalSurface(axis_ax, diameter/2.0)
            else:
                # taper_angle is semi-angle in degrees
                semi_angle_rad = taper_angle * math.pi / 180.0
                surf = Geom_ConicalSurface(axis_ax, semi_angle_rad, diameter/2.0)
            
            # 3. Define helix as a 2D line on the UV surface
            u_start = start_angle * math.pi / 180.0
            u_end = u_start + revolutions * 2.0 * math.pi
            if handedness == 'CCW':
                u_end = u_start - revolutions * 2.0 * math.pi
            
            v_start = 0.0
            v_end = pitch * revolutions
            
            u_delta = u_end - u_start
            v_delta = v_end - v_start
            
            helix_lin2d = gp_Lin2d(gp_Pnt2d(u_start, v_start), gp_Dir2d(u_delta, v_delta))
            helix_curve2d = Geom2d_Line(helix_lin2d)
            
            dist = math.hypot(u_delta, v_delta)
            make_edge = BRepBuilderAPI_MakeEdge(helix_curve2d, surf, 0.0, dist)
            if not make_edge.IsDone():
                return None
            
            helix_edge = make_edge.Edge()
            helix_wire = BRepBuilderAPI_MakeWire(helix_edge).Wire()
            
            # 4. Sweep profile
            profile_wire = _build_wire_from_points(profile_points, is_closed=True)
            sweep_tool = BRepOffsetAPI_MakePipe(helix_wire, profile_wire)
            sweep_tool.Build()
            if sweep_tool.IsDone():
                return sweep_tool.Shape()
        except Exception as helix_err:
            print(f"[ERROR] HELICAL_SWEEP failed: {helix_err}")
            return None
    elif f_type == 'HOLE_WIZARD':
        # Standard ISO Metric sizes mapping (diameter in mm)
        STANDARD_SIZES = {
            'M3': 3.0, 'M4': 4.0, 'M5': 5.0, 'M6': 6.0, 'M8': 8.0, 
            'M10': 10.0, 'M12': 12.0, 'M16': 16.0, 'M20': 20.0
        }
        
        hole_type = params.get('hole_type', 'SIMPLE') # SIMPLE, COUNTERBORE, COUNTERSINK
        size_key = params.get('size')
        if size_key in STANDARD_SIZES:
            diameter = STANDARD_SIZES[size_key]
        else:
            diameter = float(params.get('diameter', 6.0))
            
        depth = float(params.get('depth', 10.0))
        
        # Position & Orientation
        x, y, z = float(params.get('x', 0)), float(params.get('y', 0)), float(params.get('z', 0))
        nx, ny, nz = float(params.get('nx', 0)), float(params.get('ny', 0)), float(params.get('nz', 1))
        
        axis = gp_Ax1(gp_Pnt(x, y, z), gp_Dir(nx, ny, nz))
        
        try:
            # 1. Base Drilled Hole
            main_hole = BRepPrimAPI_MakeCylinder(axis, diameter/2.0, depth).Shape()
            final_hole_shape = main_hole
            
            if hole_type == 'COUNTERBORE':
                # Industrial defaults: CB diameter = 1.5 * dia, depth = 0.5 * dia
                cb_diameter = float(params.get('cb_diameter', diameter * 1.5))
                cb_depth = float(params.get('cb_depth', diameter * 0.5))
                cb_hole = BRepPrimAPI_MakeCylinder(axis, cb_diameter/2.0, cb_depth).Shape()
                final_hole_shape = BRepAlgoAPI_Fuse(main_hole, cb_hole).Shape()
                
            elif hole_type == 'COUNTERSINK':
                cs_diameter = float(params.get('cs_diameter', diameter * 1.5))
                cs_angle = float(params.get('cs_angle', 90.0)) * math.pi / 180.0
                cs_height = (cs_diameter/2.0 - diameter/2.0) / math.tan(cs_angle/2.0)
                cs_hole = BRepPrimAPI_MakeCone(axis, cs_diameter/2.0, diameter/2.0, cs_height).Shape()
                final_hole_shape = BRepAlgoAPI_Fuse(main_hole, cs_hole).Shape()
            
            return final_hole_shape
        except Exception as hole_err:
            print(f"[ERROR] HOLE_WIZARD feature failed: {hole_err}")
            return None
    elif f_type == 'LOFT':
        profiles_data = params.get('profiles', []) # List of point loops: List[List[List[Point]]]
        guide_data = params.get('guide_points', []) # List of point loops
        is_surface = params.get('isSurfaceOnly', False)
        is_thin = params.get('isThin', False)
        thin_thickness = float(params.get('thinThickness', params.get('thickness', 1.0)))
        
        start_constraint = params.get('startConstraint', 'NONE')
        end_constraint = params.get('endConstraint', 'NONE')
        start_magnitude = float(params.get('startMagnitude', 1.0))
        end_magnitude = float(params.get('endMagnitude', 1.0))
        
        if len(profiles_data) < 2:
            return None
            
        try:
            # Extract outer loops for each profile
            profile_wires = []
            for sketch_loops in profiles_data:
                if not sketch_loops: continue
                # Handle both List[List[Point]] (list of sketch loops) and List[Point] (single loop)
                if isinstance(sketch_loops[0][0], (int, float)):
                    loop_pts = sketch_loops
                else:
                    if not sketch_loops[0]: continue
                    loop_pts = sketch_loops[0]
                wire = _build_wire_from_points(loop_pts, is_closed=not is_surface)
                profile_wires.append(wire)
            
            if len(profile_wires) < 2: return None

            if is_thin and not is_surface:
                # Build thin loft by subtracting inner loft from outer loft
                inner_profile_wires = []
                for pw in profile_wires:
                    try:
                        offset_tool = BRepOffsetAPI_MakeOffset()
                        offset_tool.AddWire(pw)
                        offset_tool.Perform(-thin_thickness)
                        if offset_tool.IsDone():
                            inner_pw = topods.Wire(offset_tool.Shape())
                            inner_profile_wires.append(inner_pw)
                        else:
                            inner_profile_wires.append(pw)
                    except Exception:
                        inner_profile_wires.append(pw)
                
                def build_loft_solid(wires):
                    if guide_data and len(guide_data) > 0 and guide_data[0]:
                        path_wire = _build_wire_from_points(guide_data[0][0], is_closed=False)
                        pipe_shell = BRepOffsetAPI_MakePipeShell(path_wire)
                        for pw in wires:
                            pipe_shell.Add(pw)
                        for i in range(1, len(guide_data)):
                            if not guide_data[i] or not guide_data[i][0]: continue
                            g_wire = _build_wire_from_points(guide_data[i][0], is_closed=False)
                            try:
                                pipe_shell.SetGuide(g_wire)
                            except Exception:
                                pass
                        pipe_shell.Build()
                        if pipe_shell.IsDone():
                            pipe_shell.MakeSolid()
                            return pipe_shell.Shape()
                    
                    loft_tool = BRepOffsetAPI_ThruSections(True, False)
                    for pw in wires:
                        loft_tool.AddWire(pw)
                    if start_constraint in ['NORMAL_TO_PROFILE', 'TANGENT_TO_FACE'] or end_constraint in ['NORMAL_TO_PROFILE', 'TANGENT_TO_FACE']:
                        try:
                            loft_tool.SetSmoothing(True)
                        except Exception:
                            pass
                    loft_tool.Build()
                    if loft_tool.IsDone():
                        return loft_tool.Shape()
                    return None

                outer_shape = build_loft_solid(profile_wires)
                inner_shape = build_loft_solid(inner_profile_wires)
                
                if outer_shape and inner_shape:
                    try:
                        return BRepAlgoAPI_Cut(outer_shape, inner_shape).Shape()
                    except Exception:
                        return outer_shape
                elif outer_shape:
                    return outer_shape

            # --- Advanced Logic: Guided Loft via PipeShell ---
            if guide_data and len(guide_data) > 0 and guide_data[0]:
                # Use the first guide curve as the primary path
                path_wire = _build_wire_from_points(guide_data[0][0], is_closed=False)
                pipe_shell = BRepOffsetAPI_MakePipeShell(path_wire)
                
                # Add sections
                for pw in profile_wires:
                    pipe_shell.Add(pw)
                
                # Add additional guides if any
                for i in range(1, len(guide_data)):
                    if not guide_data[i] or not guide_data[i][0]: continue
                    g_wire = _build_wire_from_points(guide_data[i][0], is_closed=False)
                    try:
                        pipe_shell.SetGuide(g_wire)
                    except Exception:
                        pass  # SetGuide may not be supported, ignore
                
                pipe_shell.Build()
                if pipe_shell.IsDone():
                    if not is_surface:
                        pipe_shell.MakeSolid()
                    return pipe_shell.Shape()

            # --- Fallback: Standard Loft via ThruSections ---
            loft_tool = BRepOffsetAPI_ThruSections(not is_surface, False) 
            for pw in profile_wires:
                loft_tool.AddWire(pw)
            
            if start_constraint in ['NORMAL_TO_PROFILE', 'TANGENT_TO_FACE'] or end_constraint in ['NORMAL_TO_PROFILE', 'TANGENT_TO_FACE']:
                try:
                    loft_tool.SetSmoothing(True)
                except Exception:
                    pass

            loft_tool.Build()
            if loft_tool.IsDone():
                return loft_tool.Shape()
                
        except Exception as loft_err:
            print(f"[ERROR] LOFT feature failed: {loft_err}")
            return None
    return current_feat_shape

_REBUILD_MESH_CACHE: OrderedDict[str, object] = OrderedDict()
_REBUILD_CACHE_MAX = 48
_SHAPE_PREFIX_CACHE: OrderedDict[str, object] = OrderedDict()
_SHAPE_PREFIX_CACHE_MAX = 32


def _store_shape_prefix(cache_key: str, shape) -> None:
    if shape is None or (HAS_OCC and shape.IsNull()):
        return
    _SHAPE_PREFIX_CACHE[cache_key] = shape
    _SHAPE_PREFIX_CACHE.move_to_end(cache_key)
    while len(_SHAPE_PREFIX_CACHE) > _SHAPE_PREFIX_CACHE_MAX:
        _SHAPE_PREFIX_CACHE.popitem(last=False)


def _feature_tree_fingerprint(features) -> str:
    serializable = []
    for feat in features:
        if hasattr(feat, "model_dump"):
            serializable.append(feat.model_dump())
        elif hasattr(feat, "dict"):
            serializable.append(feat.dict())
        elif hasattr(feat, "type"):
            serializable.append(
                {"id": feat.id, "type": feat.type, "parameters": feat.parameters}
            )
        else:
            serializable.append(feat)
    payload = json.dumps(serializable, sort_keys=True, default=str)
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def process_features_cached(
    features,
    deflection=0.01,
    from_feature_index=0,
    feature_fingerprint=None,
):
    """
    Rebuild with LRU mesh cache. When from_feature_index > 0 and a cached
    TopoDS prefix exists, only the suffix feature list is boolean-processed.
    """
    fp = feature_fingerprint or _feature_tree_fingerprint(features)
    cache_key = f"{fp}|from:{from_feature_index}|def:{deflection}"
    if cache_key in _REBUILD_MESH_CACHE:
        _REBUILD_MESH_CACHE.move_to_end(cache_key)
        return _REBUILD_MESH_CACHE[cache_key]

    from_index = max(0, int(from_feature_index or 0))
    result = None

    if not HAS_OCC:
        result = process_features(features, deflection=deflection)
    elif from_index > 0 and from_index < len(features):
        prefix = features[:from_index]
        prefix_key = _feature_tree_fingerprint(prefix)
        initial_shape = _SHAPE_PREFIX_CACHE.get(prefix_key)
        if initial_shape is None:
            initial_shape = build_shape_only(
                prefix,
                cache_prefixes=True,
                full_features=features,
                start_index=0,
            )
            if initial_shape is not None:
                _store_shape_prefix(prefix_key, initial_shape)
        if initial_shape is not None:
            ref_geometry = []
            final_shape = build_shape_only(
                features[from_index:],
                initial_shape=initial_shape,
                cache_prefixes=True,
                full_features=features,
                start_index=from_index,
            )
            if final_shape:
                result = {
                    "type": "mesh",
                    "data": _shape_to_mesh(final_shape, deflection),
                    "ref_geometry": ref_geometry,
                }
        if result is None:
            result = process_features(features, deflection=deflection)
    else:
        result = process_features(features, deflection=deflection)
        if result is not None:
            build_shape_only(
                features,
                cache_prefixes=True,
                full_features=features,
                start_index=0,
            )

    if result is not None:
        _REBUILD_MESH_CACHE[cache_key] = result
        while len(_REBUILD_MESH_CACHE) > _REBUILD_CACHE_MAX:
            _REBUILD_MESH_CACHE.popitem(last=False)
    return result


class TopologicalLinker:
    """Tracks how shapes evolve through operations (Boolean, Transform) and manages property inheritance."""
    def __init__(self):
        self.mapping = {} # Original Shape Hash -> List of New Shape Hashes
        self.generation_map = {} # TNS Name (e.g. EdgeID_GEN) -> New Shape Hash
        self.shape_pool = {} # Hash -> Shape object
        self.color_map = {} # Hash -> Hex Color string
        
    def record_generation(self, tns_name, shape):
        if shape is None or (HAS_OCC and shape.IsNull()): return
        h = get_shape_hash(shape, 10000000)
        self.generation_map[tns_name] = h
        self.shape_pool[h] = shape

    def record_evolution(self, tool, original_shapes):
        """Records Generated and Modified shapes from an OCC tool (e.g. BRepAlgoAPI)."""
        
        for orig in original_shapes:
            if orig is None or (HAS_OCC and orig.IsNull()): continue
            h_orig = get_shape_hash(orig, 10000000)
            self.shape_pool[h_orig] = orig
            
            # Get color from original shape if it exists
            orig_color = self.color_map.get(h_orig)
            
            # Track sub-shapes
            for sub_type in [TopAbs_FACE, TopAbs_EDGE]:
                exp = TopExp_Explorer(orig, sub_type)
                while exp.More():
                    sub = exp.Current()
                    h_sub = get_shape_hash(sub, 10000000)
                    self.shape_pool[h_sub] = sub
                    
                    # Inherit color from parent if sub-shape doesn't have one
                    sub_color = self.color_map.get(h_sub) or orig_color
                    if sub_color: self.color_map[h_sub] = sub_color
                    
                    # Get Generated
                    generated_list = tool.Generated(sub)
                    if generated_list is not None:
                        try:
                            # In pythonocc 7.8+, Generated() returns TopTools_ListOfShape
                            # It is NOT a TopoDS_Shape, so TopExp_Explorer fails.
                            # It is NOT a Python iterable, so 'for' fails.
                            # Must use TopTools_ListIteratorOfListOfShape.
                            it = TopTools_ListIteratorOfListOfShape(generated_list)
                            while it.More():
                                gen_sub = it.Value()
                                it.Next()
                                if gen_sub and not gen_sub.IsNull():
                                    h_gen = get_shape_hash(gen_sub, 10000000)
                                    if h_sub not in self.mapping: self.mapping[h_sub] = []
                                    self.mapping[h_sub].append(h_gen)
                                    self.shape_pool[h_gen] = gen_sub
                                    # Propagate Color to Generated
                                    if sub_color: self.color_map[h_gen] = sub_color
                        except:
                            # Fallback if generated_list is a single TopoDS_Shape (older versions)
                            if hasattr(generated_list, 'IsNull') and not generated_list.IsNull():
                                gen_sub = generated_list
                                h_gen = get_shape_hash(gen_sub, 10000000)
                                if h_sub not in self.mapping: self.mapping[h_sub] = []
                                self.mapping[h_sub].append(h_gen)
                                self.shape_pool[h_gen] = gen_sub
                                if sub_color: self.color_map[h_gen] = sub_color
                        
                    # Get Modified
                    modified_list = tool.Modified(sub)
                    if modified_list is not None:
                        try:
                            it = TopTools_ListIteratorOfListOfShape(modified_list)
                            while it.More():
                                mod_sub = it.Value()
                                it.Next()
                                if mod_sub and not mod_sub.IsNull():
                                    h_mod = get_shape_hash(mod_sub, 10000000)
                                    if h_sub not in self.mapping: self.mapping[h_sub] = []
                                    self.mapping[h_sub].append(h_mod)
                                    self.shape_pool[h_mod] = mod_sub
                                    # Propagate Color to Modified
                                    if sub_color: self.color_map[h_mod] = sub_color
                        except:
                            if hasattr(modified_list, 'IsNull') and not modified_list.IsNull():
                                mod_sub = modified_list
                                h_mod = get_shape_hash(mod_sub, 10000000)
                                if h_sub not in self.mapping: self.mapping[h_sub] = []
                                self.mapping[h_sub].append(h_mod)
                                self.shape_pool[h_mod] = mod_sub
                                if sub_color: self.color_map[h_mod] = sub_color
                    exp.Next()

linker = TopologicalLinker()

def process_features(features, deflection=0.01):
    """
    The Core CAD Kernel: Processes a sequence of parametric features to build a B-Rep model.
    Implements the 'Sketch -> Extrude' workflow with Datum Plane support.
    Supports BOX, CYLINDER, SPHERE, and EXTRUDE features.
    """
    if not HAS_OCC:
        raise RuntimeError("OpenCASCADE kernel not available. Cannot process features.")

    final_shape = None
    ref_geometry = [] # [{id, type, origin, normal/direction, xDir, yDir}]

    for feat in features:
        if hasattr(feat, 'type'):
            f_id = feat.id
            f_type = feat.type
            params = feat.parameters
        else:
            f_id = feat.get('id')
            f_type = feat.get('type')
            params = feat.get('parameters', {})

        if f_type == 'REFERENCE_PLANE':
            res = generate_reference_plane(params.get('planeType', 'OFFSET'), params.get('refs', []), params.get('offset', 0.0), features, angle=params.get('angle', 0.0))
            ref_geometry.append({"id": f_id, "type": "PLANE", "data": res})
            continue
        
        elif f_type == 'REFERENCE_AXIS':
            res = generate_reference_axis(params.get('axisType', 'TWO_POINTS'), params.get('refs', []), features)
            ref_geometry.append({"id": f_id, "type": "AXIS", "data": res})
            continue
    
    for feat in features:
        # Support both Pydantic models (with attribute access) and plain dicts
        if hasattr(feat, 'type'):
            f_type = feat.type
            params = feat.parameters
            f_color = getattr(feat, 'color', None)
        else:
            f_type = feat.get('type')
            params = feat.get('parameters', {})
            f_color = feat.get('color')
            
        current_feat_shape = None
        op = params.get('operation', 'ADD')
        
        if f_type == 'FILLET':
            if final_shape is not None:
                r1 = float(params.get('radius', 2.0))
                r2 = float(params.get('radius2', r1))
                tangent_prop = params.get('tangentPropagation', True)
                refs = params.get('refs', [])
                if not refs:
                    # Fallback for old format
                    edge_start = params.get('edge_start')
                    edge_end = params.get('edge_end')
                    if edge_start and edge_end:
                        refs = [{"edgeData": {"start": edge_start, "end": edge_end}, "signature": params.get("signature")}]
                
                if refs:
                    try:
                        fillet_tool = BRepFilletAPI_MakeFillet(final_shape)
                        edges_added = 0
                        visited_hashes = set()
                        
                        for ref in refs:
                            edge_data = ref.get('edgeData', {})
                            edge_start = edge_data.get('start')
                            edge_end = edge_data.get('end')
                            signature = ref.get('signature')
                            if edge_start and edge_end:
                                matched_edge = find_matching_edge(final_shape, edge_start, edge_end, signature)
                                if matched_edge:
                                    edges_to_fillet = [matched_edge]
                                    if tangent_prop:
                                        edges_to_fillet = get_tangent_edges(final_shape, matched_edge)
                                        
                                    for e in edges_to_fillet:
                                        ehash = get_shape_hash(e, 2**31 - 1)
                                        if ehash not in visited_hashes:
                                            if abs(r1 - r2) < 1e-4:
                                                fillet_tool.Add(r1, e)
                                            else:
                                                fillet_tool.Add(r1, r2, e)
                                            visited_hashes.add(ehash)
                                            edges_added += 1
                        
                        if edges_added > 0:
                            fillet_tool.Build()
                            if fillet_tool.IsDone():
                                res_shape = fillet_tool.Shape()
                                # --- TNS 2.0 Tracking ---
                                for ref in refs:
                                    edge_data = ref.get('edgeData', {})
                                    signature = ref.get('signature')
                                    matched_edge = find_matching_edge(final_shape, edge_data.get('start'), edge_data.get('end'), signature)
                                    if matched_edge:
                                        gen_faces = fillet_tool.Generated(matched_edge)
                                        if gen_faces is not None:
                                            try:
                                                it = TopTools_ListIteratorOfListOfShape(gen_faces)
                                                while it.More():
                                                    gf = it.Value()
                                                    it.Next()
                                                    if gf and not gf.IsNull():
                                                        linker.record_generation(f"{f_id}_GEN", gf)
                                                        break
                                            except:
                                                if hasattr(gen_faces, 'IsNull') and not gen_faces.IsNull():
                                                    linker.record_generation(f"{f_id}_GEN", gen_faces)
                                final_shape = res_shape
                    except Exception as fillet_err:
                        print(f"[ERROR] Fillet failed: {fillet_err}")
            continue

        elif f_type == 'THICKEN':
            if final_shape is not None:
                thickness = float(params.get('thickness', 1.0))
                try:
                    
                    # MakeThickSolid requires a solid, but for a surface we can use BRepOffsetAPI_MakeOffsetShape
                    # Actually BRepOffsetAPI_MakeOffsetShape creates a solid from a face if the offset is non-zero
                    
                    offset_maker = BRepOffsetAPI_MakeOffsetShape()
                    # PerformByJoin(Shape, OffsetValue, Tolerance, Mode, Intersection, SelfInter, JoinType)
                    offset_maker.PerformByJoin(final_shape, thickness, 1e-3, BRepOffset_Skin, False, False, GeomAbs_Arc)
                    if offset_maker.IsDone():
                        final_shape = offset_maker.Shape()
                except Exception as thicken_err:
                    print(f"[ERROR] THICKEN failed: {thicken_err}")
            continue

        elif f_type == 'SHELL':
            if final_shape is not None:
                thickness = float(params.get('thickness', 2.0))
                is_flip = params.get('flip', False)
                # In OCC, negative offset usually means internal shell
                actual_offset = thickness if is_flip else -thickness
                
                faces_to_remove_params = params.get('faces_to_remove_refs', [])
                
                
                removed_faces = TopTools_ListOfShape()
                for f_ref in faces_to_remove_params:
                    f_origin = f_ref.get('coordinates', [0,0,0])
                    f_normal = f_ref.get('normal', [0,0,1])
                    f_sig = f_ref.get('signature', {})
                    
                    # Resolve face using TNS Stage 2
                    _, _, matched_face = find_matching_face(final_shape, f_origin, f_normal, f_sig)
                    if matched_face:
                        removed_faces.Append(matched_face)
                
                try:
                    # Create the hollow solid
                    # Tolerance (1e-3), JoinType (GeomAbs_Arc), Inside(False)
                    shell_tool = BRepOffsetAPI_MakeThickSolid()
                    shell_tool.MakeThickSolidByJoin(final_shape, removed_faces, actual_offset, 1e-3)
                    if shell_tool.IsDone():
                        final_shape = shell_tool.Shape()
                except Exception as shell_err:
                    print(f"[ERROR] SHELL feature failed: {shell_err}")
            continue

        elif f_type == 'CHAMFER':
            if final_shape is not None:
                distance = float(params.get('distance', 1.5))
                edge_start = params.get('edge_start')
                edge_end = params.get('edge_end')
                if edge_start and edge_end:
                    matched_edge = find_matching_edge(final_shape, edge_start, edge_end, params.get("signature"))
                    if matched_edge:
                        try:
                            chamfer_tool = BRepFilletAPI_MakeChamfer(final_shape)
                            chamfer_tool.Add(distance, matched_edge)
                            chamfer_tool.Build()
                            if chamfer_tool.IsDone():
                                final_shape = chamfer_tool.Shape()
                        except Exception as chamfer_err:
                            print(f"[ERROR] Chamfer failed: {chamfer_err}")
            continue

        elif f_type == 'DRAFT':
            if final_shape is not None:
                angle_deg = float(params.get('angle', 5))
                angle_rad = math.radians(angle_deg)
                neutral_refs = params.get('neutral_plane_refs', [])
                face_refs = params.get('faces_to_draft_refs', [])
                
                if neutral_refs and face_refs:
                    n_ref = neutral_refs[0]
                    n_origin = n_ref.get('coordinates', [0,0,0])
                    n_normal = n_ref.get('normal', [0,0,1])
                    n_sig = n_ref.get('signature', {})
                    
                    _, _, matched_n_face = find_matching_face(final_shape, n_origin, n_normal, n_sig)
                    
                    if matched_n_face:
                        surf_adaptor = BRep_Tool.Surface(matched_n_face)
                        if surf_adaptor:
                            n_norm_vec = gp_Vec(*n_normal)
                            if n_norm_vec.Magnitude() > 1e-6:
                                n_norm_vec.Normalize()
                            else:
                                n_norm_vec = gp_Vec(0,0,1)
                            
                            pull_dir = gp_Dir(n_norm_vec.X(), n_norm_vec.Y(), n_norm_vec.Z())
                            neutral_plane_gp = gp_Pln(gp_Pnt(*n_origin), pull_dir)
                            
                            try:
                                draft_tool = BRepOffsetAPI_DraftAngle(final_shape)
                                faces_added = 0
                                
                                for f_ref in face_refs:
                                    f_origin = f_ref.get('coordinates', [0,0,0])
                                    f_normal = f_ref.get('normal', [0,0,1])
                                    f_sig = f_ref.get('signature', {})
                                    _, _, matched_face = find_matching_face(final_shape, f_origin, f_normal, f_sig)
                                    if matched_face:
                                        draft_tool.Add(matched_face, pull_dir, angle_rad, neutral_plane_gp)
                                        faces_added += 1
                                
                                if faces_added > 0:
                                    draft_tool.Build()
                                    if draft_tool.IsDone():
                                        final_shape = draft_tool.Shape()
                            except Exception as draft_err:
                                print(f"[ERROR] Draft failed: {draft_err}")
            continue

        elif f_type == 'RIB':
            if final_shape is not None:
                # Map RIB to a Thin Feature Extrude with UP_TO_NEXT
                tf_params = dict(params)
                tf_params['operation'] = 'ADD'
                tf_params['endCondition'] = 'UP_TO_NEXT'
                tf_params['isThin'] = True
                tf_params['thinThickness'] = float(params.get('thickness', 10.0))
                tf_params['thinDirection'] = params.get('direction', 'MID_PLANE')
                
                try:
                    rib_shape = build_feature_shape_in_isolation('EXTRUDE', tf_params, final_shape, features)
                    if rib_shape:
                        builder = BRepAlgoAPI_Fuse(final_shape, rib_shape)
                        builder.Build()
                        if builder.IsDone():
                            final_shape = builder.Shape()
                except Exception as rib_err:
                    print(f"[ERROR] Rib failed: {rib_err}")
            continue

        elif f_type == 'SURFACE_OFFSET':
            if final_shape is not None:
                distance = float(params.get('distance', 1.0))
                faces_refs = params.get('refs', [])
                if faces_refs:
                    try:
                        
                        # Extract specific faces to offset
                        builder = BRep_Builder()
                        comp_to_offset = TopoDS_Compound()
                        builder.MakeCompound(comp_to_offset)
                        
                        for ref in faces_refs:
                            origin = ref.get('coordinates', [0,0,0])
                            normal = ref.get('normal', [0,0,1])
                            f_sig = ref.get('signature', {})
                            _, _, matched_face = find_matching_face(final_shape, origin, normal, f_sig)
                            if matched_face:
                                builder.Add(comp_to_offset, matched_face)
                        
                        offset_tool = BRepOffsetAPI_MakeOffsetShape()
                        offset_tool.PerformByJoin(comp_to_offset, distance, 1e-3, BRepOffset_Skin, False, False, GeomAbs_Arc)
                        
                        if offset_tool.IsDone():
                            res_shape = offset_tool.Shape()
                            if op == 'ADD':
                                final_shape = BRepAlgoAPI_Fuse(final_shape, res_shape).Shape()
                            else:
                                final_shape = res_shape
                    except Exception as offset_err:
                        print(f"[ERROR] SURFACE_OFFSET failed: {offset_err}")
            continue

        elif f_type == 'SURFACE_KNIT':
            try:
                sewer = BRepBuilderAPI_Sewing(1e-3)
                if final_shape:
                    sewer.Add(final_shape)
                    sewer.Perform()
                    final_shape = sewer.SewedShape()
            except Exception as knit_err:
                print(f"[ERROR] SURFACE_KNIT failed: {knit_err}")
            continue

        elif f_type == 'SURFACE_CUT':
            if final_shape is not None:
                tool_id = params.get('tool_feature_id')
                flip = params.get('flip', False)
                
                # Try both features and all_features contexts
                feat_list = locals().get('features', []) or locals().get('all_features', [])
                tool_feat = next((f for f in feat_list if (f.id if hasattr(f, 'id') else f.get('id')) == tool_id), None)
                if tool_feat:
                    tf_type = tool_feat.type if hasattr(tool_feat, 'type') else tool_feat.get('type')
                    tf_params = tool_feat.parameters if hasattr(tool_feat, 'parameters') else tool_feat.get('parameters', {})
                    tool_shape = build_feature_shape_in_isolation(tf_type, tf_params, None, feat_list)
                    
                    if tool_shape and not tool_shape.IsNull():
                        try:
                            exp = TopExp_Explorer(tool_shape, TopAbs_FACE)
                            if exp.More():
                                face = topods.Face(exp.Current())
                                adaptor = BRepAdaptor_Surface(face)
                                u_mid = (adaptor.FirstUParameter() + adaptor.LastUParameter()) / 2.0
                                v_mid = (adaptor.FirstVParameter() + adaptor.LastVParameter()) / 2.0
                                props = BRepLProp_SLProps(adaptor, u_mid, v_mid, 1, 1e-6)
                                
                                if props.IsNormalDefined():
                                    normal = props.Normal()
                                    if flip: normal.Reverse()
                                    p_ref = props.Value()
                                    p_in = gp_Pnt(p_ref.X() + normal.X()*10.0, p_ref.Y() + normal.Y()*10.0, p_ref.Z() + normal.Z()*10.0)
                                    hs_tool = BRepPrimAPI_MakeHalfSpace(face, p_in)
                                    hs_solid = hs_tool.Solid()
                                    
                                    cut_tool = BRepAlgoAPI_Cut(final_shape, hs_solid)
                                    cut_tool.Build()
                                    if cut_tool.IsDone():
                                        if 'linker' in globals():
                                            linker.record_evolution(cut_tool, [final_shape])
                                        final_shape = cut_tool.Shape()
                        except Exception as sc_err:
                            print(f"[ERROR] SURFACE_CUT logic failed: {sc_err}")
            continue

        elif f_type == 'SURFACE_BOUNDARY':
            try:
                boundary_curves = params.get('boundary_curves', [])
                continuity = params.get('continuity', 'G1')
                result_hash = generate_boundary_surface(
                    features, boundary_curves, continuity
                )
                if result_hash and HAS_OCC:
                    final_shape = _SURFACE_SHAPE_CACHE.get(result_hash)
            except Exception as bnd_err:
                print(f"[ERROR] SURFACE_BOUNDARY failed: {bnd_err}")
            continue

        elif f_type == 'SURFACE_TRIM':
            try:
                trim_curve = params.get('trim_curve', {})
                keep_side = params.get('keep_side', 'INSIDE')
                result_hash = generate_trim_surface(
                    features, trim_curve, keep_side
                )
                if result_hash and HAS_OCC:
                    final_shape = _SURFACE_SHAPE_CACHE.get(result_hash)
            except Exception as trim_err:
                print(f"[ERROR] SURFACE_TRIM failed: {trim_err}")
            continue

        elif f_type == 'SPLIT':
            if final_shape is not None:
                try:
                    split_plane = params.get('split_plane', {})
                    result_hash = generate_split(features, split_plane)
                    if result_hash and HAS_OCC:
                        final_shape = _SURFACE_SHAPE_CACHE.get(result_hash)
                except Exception as split_err:
                    print(f"[ERROR] SPLIT failed: {split_err}")
            continue

        elif f_type == 'COMBINE':
            if final_shape is not None:
                try:
                    operation = params.get('operation', 'ADD')
                    tool_feature_id = params.get('tool_feature_id')
                    result_hash = generate_combine(features, operation, tool_feature_id)
                    if result_hash and HAS_OCC:
                        final_shape = _SURFACE_SHAPE_CACHE.get(result_hash)
                except Exception as combine_err:
                    print(f"[ERROR] COMBINE failed: {combine_err}")
            continue

        elif f_type == 'BASE_FLANGE_TAB':
            # Map to a thin extrude with sheet metal defaults
            try:
                thickness = float(params.get('thickness', 1.0))
                bend_radius = float(params.get('bendRadius', 0.5))
                # Use a box-like default if no prior shape exists
                if final_shape is None:
                    sketch_id = params.get('sketchId')
                    if sketch_id:
                        # Find referenced sketch and hand off to EXTRUDE
                        tf_params = dict(params)
                        tf_params['operation'] = 'ADD'
                        tf_params['endCondition'] = 'BLIND'
                        tf_params['depth'] = thickness * 20  # Scale for visual thickness
                        tf_params['isThin'] = True
                        tf_params['thinThickness'] = thickness
                        tf_params['thinDirection'] = 'MID_PLANE'
                        feat_shape = build_feature_shape_in_isolation('EXTRUDE', tf_params, final_shape, features)
                        if feat_shape and not feat_shape.IsNull():
                            final_shape = feat_shape
                else:
                    # Add thin material to existing body
                    builder = BRepPrimAPI_MakeBox(gp_Pnt(-10, -10, 0), gp_Pnt(10, 10, thickness))
                    builder.Build()
                    if builder.IsDone():
                        thin_shape = builder.Shape()
                        if final_shape is not None and not final_shape.IsNull():
                            fuse = BRepAlgoAPI_Fuse(final_shape, thin_shape)
                            fuse.Build()
                            if fuse.IsDone():
                                final_shape = fuse.Shape()
            except Exception as bft_err:
                print(f"[ERROR] BASE_FLANGE_TAB failed: {bft_err}")
            continue

        if f_type in ['SKETCH', 'SKETCH_POLYLINE', 'EXTRUDE', 'REVOLVE', 'BOX', 'CYLINDER', 'SPHERE', 'SWEEP', 'LOFT', 'WRAP']:
            current_feat_shape = build_feature_shape_in_isolation(f_type, params, final_shape, features)

        elif f_type == 'PATTERN':
            target_id = params.get('target_feature_id')
            pattern_type = params.get('pattern_type', 'LINEAR')
            axis = params.get('axis', 'X')
            count = int(params.get('count', 2))
            spacing = float(params.get('spacing', 10.0))

            target_feat = None
            for prev_feat in features:
                prev_id = prev_feat.id if hasattr(prev_feat, 'id') else prev_feat.get('id')
                if prev_id == target_id:
                    target_feat = prev_feat
                    break

            if target_feat:
                tf_type = target_feat.type if hasattr(target_feat, 'type') else target_feat.get('type')
                tf_params = target_feat.parameters if hasattr(target_feat, 'parameters') else target_feat.get('parameters', {})
                target_shape = build_feature_shape_in_isolation(tf_type, tf_params, None, features)

                if target_shape:
                    copies = []
                    for i in range(1, count):
                        trsf = gp_Trsf()
                        if pattern_type == 'LINEAR':
                            val = spacing * i
                            if axis == 'X':
                                vec = gp_Vec(val, 0, 0)
                            elif axis == 'Y':
                                vec = gp_Vec(0, val, 0)
                            else:
                                vec = gp_Vec(0, 0, val)
                            trsf.SetTranslation(vec)
                        else:  # CIRCULAR
                            angle_rad = math.radians(spacing * i)
                            if axis == 'X':
                                ax1 = gp_Ax1(gp_Pnt(0, 0, 0), gp_Dir(1, 0, 0))
                            elif axis == 'Y':
                                ax1 = gp_Ax1(gp_Pnt(0, 0, 0), gp_Dir(0, 1, 0))
                            else:
                                ax1 = gp_Ax1(gp_Pnt(0, 0, 0), gp_Dir(0, 0, 1))
                            trsf.SetRotation(ax1, angle_rad)

                        shape_copy = target_shape.Moved(TopLoc_Location(trsf))
                        copies.append(shape_copy)

                    target_op = tf_params.get('operation', 'ADD')
                    for copy_shape in copies:
                        if final_shape is None:
                            final_shape = copy_shape
                        else:
                            if target_op == 'ADD':
                                final_shape = BRepAlgoAPI_Fuse(final_shape, copy_shape).Shape()
                            elif target_op == 'CUT':
                                final_shape = BRepAlgoAPI_Cut(final_shape, copy_shape).Shape()

        # Perform the B-Rep boolean combination
        if current_feat_shape:
            # Assign color to the new shape in the linker
            if f_color:
                h_feat = get_shape_hash(current_feat_shape, 10000000)
                linker.color_map[h_feat] = f_color

            if final_shape is None:
                final_shape = current_feat_shape
            else:
                try:
                    if op == 'ADD':
                        tool = BRepAlgoAPI_Fuse(final_shape, current_feat_shape)
                    else:
                        tool = BRepAlgoAPI_Cut(final_shape, current_feat_shape)
                    
                    tool.Build()
                    if tool.IsDone():
                        linker.record_evolution(tool, [final_shape, current_feat_shape])
                        final_shape = tool.Shape()
                except Exception as bool_err:
                    print(f"[ERROR] Boolean TNS 3.0 failed: {bool_err}")
                    # Fallback to standard non-tracking boolean
                    if op == 'ADD': final_shape = BRepAlgoAPI_Fuse(final_shape, current_feat_shape).Shape()
                    else: final_shape = BRepAlgoAPI_Cut(final_shape, current_feat_shape).Shape()

    if final_shape or len(ref_geometry) > 0:
        return {
            "type": "mesh",
            "data": _shape_to_mesh(final_shape, deflection) if final_shape else {"vertices": [], "indices": [], "normals": []},
            "ref_geometry": ref_geometry
        }
    return None

def build_shape_only(
    features,
    initial_shape=None,
    cache_prefixes=False,
    full_features=None,
    start_index=0,
):
    """Processes features and returns the raw OCCT TopoDS_Shape."""
    final_shape = initial_shape
    all_features = full_features if full_features is not None else features
    ref_geometry = [] # [{id, type, origin, normal/direction, xDir, yDir}]

    for feat in features:
        if hasattr(feat, 'type'):
            f_id = feat.id
            f_type = feat.type
            params = feat.parameters
        else:
            f_id = feat.get('id')
            f_type = feat.get('type')
            params = feat.get('parameters', {})

        if f_type == 'REFERENCE_PLANE':
            res = generate_reference_plane(params.get('planeType', 'OFFSET'), params.get('refs', []), params.get('offset', 0.0), features, angle=params.get('angle', 0.0))
            ref_geometry.append({"id": f_id, "type": "PLANE", "data": res})
            continue
        
        elif f_type == 'REFERENCE_AXIS':
            res = generate_reference_axis(params.get('axisType', 'TWO_POINTS'), params.get('refs', []), features)
            ref_geometry.append({"id": f_id, "type": "AXIS", "data": res})
            continue
    
    for local_idx, feat in enumerate(features):
        if hasattr(feat, 'type'):
            f_type = feat.type
            params = feat.parameters
            f_color = getattr(feat, 'color', None)
        else:
            f_type = feat.get('type')
            params = feat.get('parameters', {})
            f_color = feat.get('color')

        op = params.get('operation', 'ADD')
        current_feat_shape = None
            
        if f_type == 'FILLET':
            if final_shape is not None:
                radius = float(params.get('radius', 2.0))
                edge_start = params.get('edge_start')
                edge_end = params.get('edge_end')
                if edge_start and edge_end:
                    matched_edge = find_matching_edge(final_shape, edge_start, edge_end, params.get("signature"))
                    if matched_edge:
                        try:
                            fillet_tool = BRepFilletAPI_MakeFillet(final_shape)
                            fillet_tool.Add(radius, matched_edge)
                            fillet_tool.Build()
                            if fillet_tool.IsDone():
                                final_shape = fillet_tool.Shape()
                        except Exception as fillet_err:
                            print(f"[ERROR] Fillet failed: {fillet_err}")
            continue

        elif f_type == 'SHELL':
            if final_shape is not None:
                thickness = float(params.get('thickness', 2.0))
                is_flip = params.get('flip', False)
                # In OCC, negative offset usually means internal shell
                actual_offset = thickness if is_flip else -thickness
                
                faces_to_remove_params = params.get('faces_to_remove_refs', [])
                
                
                removed_faces = TopTools_ListOfShape()
                for f_ref in faces_to_remove_params:
                    f_origin = f_ref.get('coordinates', [0,0,0])
                    f_normal = f_ref.get('normal', [0,0,1])
                    f_sig = f_ref.get('signature', {})
                    
                    # Resolve face using TNS Stage 2
                    _, _, matched_face = find_matching_face(final_shape, f_origin, f_normal, f_sig)
                    if matched_face:
                        removed_faces.Append(matched_face)
                
                try:
                    # Create the hollow solid
                    # Tolerance (1e-3), JoinType (GeomAbs_Arc), Inside(False)
                    shell_tool = BRepOffsetAPI_MakeThickSolid()
                    shell_tool.MakeThickSolidByJoin(final_shape, removed_faces, actual_offset, 1e-3)
                    if shell_tool.IsDone():
                        final_shape = shell_tool.Shape()
                except Exception as shell_err:
                    print(f"[ERROR] SHELL feature failed: {shell_err}")
            continue

        elif f_type == 'CHAMFER':
            if final_shape is not None:
                distance = float(params.get('distance', 1.5))
                tangent_prop = params.get('tangentPropagation', True)
                refs = params.get('refs', [])
                if not refs:
                    # Fallback for old format
                    edge_start = params.get('edge_start')
                    edge_end = params.get('edge_end')
                    if edge_start and edge_end:
                        refs = [{"edgeData": {"start": edge_start, "end": edge_end}, "signature": params.get("signature")}]
                
                if refs:
                    try:
                        chamfer_tool = BRepFilletAPI_MakeChamfer(final_shape)
                        edges_added = 0
                        visited_hashes = set()
                        
                        for ref in refs:
                            edge_data = ref.get('edgeData', {})
                            edge_start = edge_data.get('start')
                            edge_end = edge_data.get('end')
                            signature = ref.get('signature')
                            if edge_start and edge_end:
                                matched_edge = find_matching_edge(final_shape, edge_start, edge_end, signature)
                                if matched_edge:
                                    edges_to_chamfer = [matched_edge]
                                    if tangent_prop:
                                        edges_to_chamfer = get_tangent_edges(final_shape, matched_edge)
                                    
                                    for e in edges_to_chamfer:
                                        ehash = get_shape_hash(e, 2**31 - 1)
                                        if ehash not in visited_hashes:
                                            chamfer_tool.Add(distance, e)
                                            visited_hashes.add(ehash)
                                            edges_added += 1
                        
                        if edges_added > 0:
                            chamfer_tool.Build()
                            if chamfer_tool.IsDone():
                                final_shape = chamfer_tool.Shape()
                    except Exception as chamfer_err:
                        print(f"[ERROR] Chamfer failed: {chamfer_err}")
            continue

        elif f_type == 'FILLET':
            if final_shape is not None:
                r1 = float(params.get('radius', 2.0))
                r2 = float(params.get('radius2', r1))
                tangent_prop = params.get('tangentPropagation', True)
                refs = params.get('refs', [])
                if not refs:
                    # Fallback for old format
                    edge_start = params.get('edge_start')
                    edge_end = params.get('edge_end')
                    if edge_start and edge_end:
                        refs = [{"edgeData": {"start": edge_start, "end": edge_end}, "signature": params.get("signature")}]
                
                edges_added = 0
                visited_hashes = set()
                fillet_tool = None
                res_shape = None
                
                if refs:
                    try:
                        fillet_tool = BRepFilletAPI_MakeFillet(final_shape)
                        
                        for ref in refs:
                            edge_data = ref.get('edgeData', {})
                            edge_start = edge_data.get('start')
                            edge_end = edge_data.get('end')
                            signature = ref.get('signature')
                            if edge_start and edge_end:
                                matched_edge = find_matching_edge(final_shape, edge_start, edge_end, signature)
                                if matched_edge:
                                    edges_to_fillet = [matched_edge]
                                    if tangent_prop:
                                        edges_to_fillet = get_tangent_edges(final_shape, matched_edge)
                                        
                                    for e in edges_to_fillet:
                                        ehash = get_shape_hash(e, 2**31 - 1)
                                        if ehash not in visited_hashes:
                                            if abs(r1 - r2) < 1e-4:
                                                fillet_tool.Add(r1, e)
                                            else:
                                                fillet_tool.Add(r1, r2, e)
                                            visited_hashes.add(ehash)
                                            edges_added += 1
                        
                        if edges_added > 0:
                            fillet_tool.Build()
                            if fillet_tool.IsDone():
                                res_shape = fillet_tool.Shape()
                                # TNS 2.0 Tracking
                                for ref in refs:
                                    edge_data = ref.get('edgeData', {})
                                    signature = ref.get('signature')
                                    matched_edge = find_matching_edge(final_shape, edge_data.get('start'), edge_data.get('end'), signature)
                                    if matched_edge:
                                        gen_faces = fillet_tool.Generated(matched_edge)
                                        if gen_faces is not None:
                                            try:
                                                it = TopTools_ListIteratorOfListOfShape(gen_faces)
                                                while it.More():
                                                    gf = it.Value()
                                                    it.Next()
                                                    if gf and not gf.IsNull():
                                                        linker.record_generation(f"{f_id}_GEN", gf)
                                                        break
                                            except:
                                                if hasattr(gen_faces, 'IsNull') and not gen_faces.IsNull():
                                                    linker.record_generation(f"{f_id}_GEN", gen_faces)
                                final_shape = res_shape
                    except Exception as fillet_err:
                        print(f"[ERROR] Fillet failed: {fillet_err}")
            continue

        elif f_type == 'SURFACE_OFFSET':
            if final_shape is not None:
                distance = float(params.get('distance', 1.0))
                faces_refs = params.get('refs', [])
                if faces_refs:
                    try:
                        
                        # Extract specific faces to offset
                        builder = BRep_Builder()
                        comp_to_offset = TopoDS_Compound()
                        builder.MakeCompound(comp_to_offset)
                        
                        for ref in faces_refs:
                            origin = ref.get('coordinates', [0,0,0])
                            normal = ref.get('normal', [0,0,1])
                            f_sig = ref.get('signature', {})
                            _, _, matched_face = find_matching_face(final_shape, origin, normal, f_sig)
                            if matched_face:
                                builder.Add(comp_to_offset, matched_face)
                        
                        offset_tool = BRepOffsetAPI_MakeOffsetShape()
                        offset_tool.PerformByJoin(comp_to_offset, distance, 1e-3, BRepOffset_Skin, False, False, GeomAbs_Arc)
                        
                        if offset_tool.IsDone():
                            res_shape = offset_tool.Shape()
                            if op == 'ADD':
                                final_shape = BRepAlgoAPI_Fuse(final_shape, res_shape).Shape()
                            else:
                                final_shape = res_shape
                    except Exception as offset_err:
                        print(f"[ERROR] SURFACE_OFFSET failed: {offset_err}")
            continue

        elif f_type == 'SURFACE_KNIT':
            try:
                sewer = BRepBuilderAPI_Sewing(1e-3)
                if final_shape:
                    sewer.Add(final_shape)
                    sewer.Perform()
                    final_shape = sewer.SewedShape()
            except Exception as knit_err:
                print(f"[ERROR] SURFACE_KNIT failed: {knit_err}")
            continue

        elif f_type == 'SURFACE_CUT':
            if final_shape is not None:
                tool_id = params.get('tool_feature_id')
                flip = params.get('flip', False)
                
                # Try both features and all_features contexts
                feat_list = locals().get('features', []) or locals().get('all_features', [])
                tool_feat = next((f for f in feat_list if (f.id if hasattr(f, 'id') else f.get('id')) == tool_id), None)
                if tool_feat:
                    tf_type = tool_feat.type if hasattr(tool_feat, 'type') else tool_feat.get('type')
                    tf_params = tool_feat.parameters if hasattr(tool_feat, 'parameters') else tool_feat.get('parameters', {})
                    tool_shape = build_feature_shape_in_isolation(tf_type, tf_params, None, feat_list)
                    
                    if tool_shape and not tool_shape.IsNull():
                        try:
                            exp = TopExp_Explorer(tool_shape, TopAbs_FACE)
                            if exp.More():
                                face = topods.Face(exp.Current())
                                adaptor = BRepAdaptor_Surface(face)
                                u_mid = (adaptor.FirstUParameter() + adaptor.LastUParameter()) / 2.0
                                v_mid = (adaptor.FirstVParameter() + adaptor.LastVParameter()) / 2.0
                                props = BRepLProp_SLProps(adaptor, u_mid, v_mid, 1, 1e-6)
                                
                                if props.IsNormalDefined():
                                    normal = props.Normal()
                                    if flip: normal.Reverse()
                                    p_ref = props.Value()
                                    p_in = gp_Pnt(p_ref.X() + normal.X()*10.0, p_ref.Y() + normal.Y()*10.0, p_ref.Z() + normal.Z()*10.0)
                                    hs_tool = BRepPrimAPI_MakeHalfSpace(face, p_in)
                                    hs_solid = hs_tool.Solid()
                                    
                                    cut_tool = BRepAlgoAPI_Cut(final_shape, hs_solid)
                                    cut_tool.Build()
                                    if cut_tool.IsDone():
                                        if 'linker' in globals():
                                            linker.record_evolution(cut_tool, [final_shape])
                                        final_shape = cut_tool.Shape()
                        except Exception as sc_err:
                            print(f"[ERROR] SURFACE_CUT logic failed: {sc_err}")
            continue

        elif f_type == 'SURFACE_BOUNDARY':
            try:
                boundary_curves = params.get('boundary_curves', [])
                continuity = params.get('continuity', 'G1')
                result_hash = generate_boundary_surface(
                    features, boundary_curves, continuity
                )
                if result_hash and HAS_OCC:
                    final_shape = _SURFACE_SHAPE_CACHE.get(result_hash)
            except Exception as bnd_err:
                print(f"[ERROR] SURFACE_BOUNDARY failed: {bnd_err}")
            continue

        elif f_type == 'SURFACE_TRIM':
            try:
                trim_curve = params.get('trim_curve', {})
                keep_side = params.get('keep_side', 'INSIDE')
                result_hash = generate_trim_surface(
                    features, trim_curve, keep_side
                )
                if result_hash and HAS_OCC:
                    final_shape = _SURFACE_SHAPE_CACHE.get(result_hash)
            except Exception as trim_err:
                print(f"[ERROR] SURFACE_TRIM failed: {trim_err}")
            continue

        elif f_type == 'SPLIT':
            if final_shape is not None:
                try:
                    split_plane = params.get('split_plane', {})
                    result_hash = generate_split(features, split_plane)
                    if result_hash and HAS_OCC:
                        final_shape = _SURFACE_SHAPE_CACHE.get(result_hash)
                except Exception as split_err:
                    print(f"[ERROR] SPLIT failed: {split_err}")
            continue

        elif f_type == 'COMBINE':
            if final_shape is not None:
                try:
                    operation = params.get('operation', 'ADD')
                    tool_feature_id = params.get('tool_feature_id')
                    result_hash = generate_combine(features, operation, tool_feature_id)
                    if result_hash and HAS_OCC:
                        final_shape = _SURFACE_SHAPE_CACHE.get(result_hash)
                except Exception as combine_err:
                    print(f"[ERROR] COMBINE failed: {combine_err}")
            continue

        elif f_type == 'BASE_FLANGE_TAB':
            try:
                thickness = float(params.get('thickness', 1.0))
                if final_shape is None:
                    # Create box-like base
                    builder = BRepPrimAPI_MakeBox(gp_Pnt(-10, -10, 0), gp_Pnt(10, 10, thickness * 20))
                    builder.Build()
                    if builder.IsDone():
                        final_shape = builder.Shape()
                else:
                    # Add thin material to existing body
                    builder = BRepPrimAPI_MakeBox(gp_Pnt(-10, -10, 0), gp_Pnt(10, 10, thickness))
                    builder.Build()
                    if builder.IsDone():
                        thin_shape = builder.Shape()
                        if not thin_shape.IsNull():
                            fuse = BRepAlgoAPI_Fuse(final_shape, thin_shape)
                            fuse.Build()
                            if fuse.IsDone():
                                final_shape = fuse.Shape()
            except Exception as bft_err:
                print(f"[ERROR] BASE_FLANGE_TAB failed: {bft_err}")
            continue

        elif f_type == 'EDGE_FLANGE':
            if final_shape is not None:
                try:
                    # Try to use pre-generated cached shape first
                    shape_hash = params.get('occt_shape_hash')
                    flange_shape = None
                    if shape_hash and shape_hash in _EDGE_FLANGE_SHAPE_CACHE:
                        flange_shape = _EDGE_FLANGE_SHAPE_CACHE[shape_hash]
                        # Transform to position it near the base body
                        trsf = gp_Trsf()
                        trsf.SetTranslation(gp_Vec(5.0, 5.0, 5.0))
                        flange_shape = BRepBuilderAPI_Transform(flange_shape, trsf).Shape()

                    if flange_shape is None:
                        # Fallback: create simplified flange box
                        flange_h = float(params.get('flange_height', 10.0))
                        bend_r = float(params.get('bend_radius', 0.5))
                        thickness = float(params.get('thickness', 1.0))
                        direction = params.get('direction', 'OUTSIDE')
                        bend_offset = bend_r + thickness
                        fz = bend_offset if direction == 'OUTSIDE' else -bend_offset
                        flange_shape = BRepPrimAPI_MakeBox(
                            gp_Pnt(0, 0, fz),
                            thickness,
                            flange_h,
                            bend_r
                        ).Shape()

                    fuse_tool = BRepAlgoAPI_Fuse(final_shape, flange_shape)
                    fuse_tool.Build()
                    if fuse_tool.IsDone():
                        final_shape = fuse_tool.Shape()
                except Exception as flange_err:
                    print(f'[ERROR] EDGE_FLANGE failed: {flange_err}')
            continue

        elif f_type == 'MITER_FLANGE':
            if final_shape is not None:
                try:
                    shape_hash = params.get('occt_shape_hash')
                    miter_shape = None
                    if shape_hash and shape_hash in _MITER_FLANGE_SHAPE_CACHE:
                        miter_shape = _MITER_FLANGE_SHAPE_CACHE[shape_hash]
                        # Offset from origin so it's visible beside base
                        trsf = gp_Trsf()
                        trsf.SetTranslation(gp_Vec(8.0, 8.0, 5.0))
                        miter_shape = BRepBuilderAPI_Transform(miter_shape, trsf).Shape()

                    if miter_shape is None:
                        # Fallback: simplified miter flange (L-box)
                        fh = float(params.get('flange_height', 10.0))
                        br = float(params.get('bend_radius', 0.5))
                        t = float(params.get('thickness', 1.0))
                        seg_len = max(fh, 15.0)
                        miter_shape = BRepPrimAPI_MakeBox(
                            gp_Pnt(0, 0, 0),
                            seg_len, t, br + fh
                        ).Shape()

                    fuse_tool = BRepAlgoAPI_Fuse(final_shape, miter_shape)
                    fuse_tool.Build()
                    if fuse_tool.IsDone():
                        final_shape = fuse_tool.Shape()
                except Exception as miter_err:
                    print(f'[ERROR] MITER_FLANGE failed: {miter_err}')
            continue

        elif f_type == 'HEM':
            if final_shape is not None:
                try:
                    shape_hash = params.get('occt_shape_hash')
                    hem_shape = None
                    if shape_hash and shape_hash in _HEM_SHAPE_CACHE:
                        hem_shape = _HEM_SHAPE_CACHE[shape_hash]
                        trsf = gp_Trsf()
                        trsf.SetTranslation(gp_Vec(5.0, 5.0, 8.0))
                        hem_shape = BRepBuilderAPI_Transform(hem_shape, trsf).Shape()

                    if hem_shape is None:
                        # Fallback: simplified hem box
                        hl = float(params.get('hem_length', 5.0))
                        t = float(params.get('thickness', 1.0))
                        hr = float(params.get('hem_radius', 1.0))
                        hem_shape = BRepPrimAPI_MakeBox(
                            gp_Pnt(0, 0, 0), hl, t, hr * 2
                        ).Shape()

                    fuse_tool = BRepAlgoAPI_Fuse(final_shape, hem_shape)
                    fuse_tool.Build()
                    if fuse_tool.IsDone():
                        final_shape = fuse_tool.Shape()
                except Exception as hem_err:
                    print(f'[ERROR] HEM failed: {hem_err}')
            continue

        elif f_type == 'FORMING_TOOL':
            if final_shape is not None:
                try:
                    shape_hash = params.get('occt_shape_hash')
                    ft_shape = None
                    if shape_hash and shape_hash in _FORMING_TOOL_SHAPE_CACHE:
                        ft_shape = _FORMING_TOOL_SHAPE_CACHE[shape_hash]
                        trsf = gp_Trsf()
                        trsf.SetTranslation(gp_Vec(3.0, 3.0, 0.0))
                        ft_shape = BRepBuilderAPI_Transform(ft_shape, trsf).Shape()

                    if ft_shape is None:
                        # Fallback: small embossed box
                        w = float(params.get('width', 10.0))
                        h = float(params.get('height', 5.0))
                        d = float(params.get('depth', 3.0))
                        ft_shape = BRepPrimAPI_MakeBox(
                            gp_Pnt(0, 0, 0), w, h, d
                        ).Shape()

                    fuse_tool = BRepAlgoAPI_Fuse(final_shape, ft_shape)
                    fuse_tool.Build()
                    if fuse_tool.IsDone():
                        final_shape = fuse_tool.Shape()
                except Exception as ft_err:
                    print(f'[ERROR] FORMING_TOOL failed: {ft_err}')
            continue

        elif f_type == 'FLAT_PATTERN':
            # Flat Pattern: compute the flat shape from all features so far.
            # This replaces — not fuses — the folded 3D shape with a planar
            # unfolded plate, positioned above the folded body.
            try:
                shape_hash = params.get('occt_shape_hash')
                fp_shape = None
                if shape_hash and shape_hash in _FLAT_PATTERN_SHAPE_CACHE:
                    fp_shape = _FLAT_PATTERN_SHAPE_CACHE[shape_hash]
                    trsf = gp_Trsf()
                    trsf.SetTranslation(gp_Vec(0.0, 0.0, 25.0))
                    fp_shape = BRepBuilderAPI_Transform(fp_shape, trsf).Shape()

                if fp_shape is None:
                    # Fallback: generate flat pattern on-the-fly from full feature list
                    fp_hash = generate_flat_pattern(features)
                    if fp_hash and fp_hash in _FLAT_PATTERN_SHAPE_CACHE:
                        fp_shape = _FLAT_PATTERN_SHAPE_CACHE[fp_hash]
                        trsf = gp_Trsf()
                        trsf.SetTranslation(gp_Vec(0.0, 0.0, 25.0))
                        fp_shape = BRepBuilderAPI_Transform(fp_shape, trsf).Shape()

                if fp_shape is not None:
                    final_shape = fp_shape  # Replace folded shape with flat
            except Exception as fp_err:
                print(f'[ERROR] FLAT_PATTERN failed: {fp_err}')
            continue

        if f_type in ['SKETCH', 'SKETCH_POLYLINE', 'EXTRUDE', 'REVOLVE', 'BOX', 'CYLINDER', 'SPHERE', 'SWEEP', 'LOFT', 'WRAP']:
            current_feat_shape = build_feature_shape_in_isolation(f_type, params, final_shape, features)

        elif f_type == 'PATTERN':
            target_ids = params.get('target_feature_ids', [])
            # Legacy support
            single_target = params.get('target_feature_id')
            if single_target and single_target not in target_ids:
                target_ids.append(single_target)
                
            pattern_type = params.get('pattern_type', 'LINEAR')
            
            # --- Fill Pattern Logic ---
            if pattern_type == 'FILL':
                boundary_id = params.get('boundary_id')
                fill_layout = params.get('fill_layout', 'SQUARE')
                spacing = float(params.get('spacing', 10.0))
                margin = float(params.get('margin', 2.0))
                angle = math.radians(float(params.get('fill_angle', 0.0)))
                
                # 1. Find Boundary Shape
                boundary_feat = next((f for f in features if (f.id if hasattr(f, 'id') else f.get('id')) == boundary_id), None)
                if not boundary_feat: return None
                
                bf_type = boundary_feat.type if hasattr(boundary_feat, 'type') else boundary_feat.get('type')
                bf_params = boundary_feat.parameters if hasattr(boundary_feat, 'parameters') else boundary_feat.get('parameters', {})
                boundary_shape = build_feature_shape_in_isolation(bf_type, bf_params, None, features)
                if not boundary_shape: return None
                
                # 2. Extract Planar Context
                
                bbox = Bnd_Box()
                brepbndlib.Add(boundary_shape, bbox)
                xmin, ymin, zmin, xmax, ymax, zmax = bbox.Get()
                
                # For Fill, we assume a dominant plane (usually XY local to sketch)
                # We'll use a simpler BBox-based grid and PIP test on the first face found
                face_explorer = TopExp_Explorer(boundary_shape, TopAbs_FACE)
                if not face_explorer.More(): return None
                target_face = topods.Face(face_explorer.Current())
                classifier = BRepTopAdaptor_FClass2d(target_face, 1e-4)

                # 3. Build Target Shapes
                target_shapes = []
                for tid in target_ids:
                    tf = next((f for f in features if (f.id if hasattr(f, 'id') else f.get('id')) == tid), None)
                    if tf:
                        t_type = tf.type if hasattr(tf, 'type') else tf.get('type')
                        t_params = tf.parameters if hasattr(tf, 'parameters') else tf.get('parameters', {})
                        ts = build_feature_shape_in_isolation(t_type, t_params, None, features)
                        if ts: target_shapes.append((ts, t_params.get('operation', 'ADD')))
                
                if not target_shapes: return None

                # 4. Grid Generation & PIP Filtering
                # Scan a wider grid to account for rotation
                diag = math.sqrt((xmax-xmin)**2 + (ymax-ymin)**2)
                cx, cy = (xmin+xmax)/2.0, (ymin+ymax)/2.0
                
                
                grid_pts = []
                steps_x = int(diag / spacing) + 4
                steps_y = int(diag / spacing) + 4
                
                for i in range(-steps_x, steps_x):
                    for j in range(-steps_y, steps_y):
                        # Base local grid point
                        lx = i * spacing
                        ly = j * spacing
                        
                        if fill_layout == 'PERFORATION':
                            if j % 2 != 0: lx += spacing / 2.0
                        elif fill_layout == 'HEXAGON':
                            ly = j * spacing * math.sqrt(3)/2.0
                            if j % 2 != 0: lx += spacing / 2.0
                            
                        # Apply rotation around center
                        rx = lx * math.cos(angle) - ly * math.sin(angle) + cx
                        ry = lx * math.sin(angle) + ly * math.cos(angle) + cy
                        
                        # Check PIP (in UV space of the face - simplified to XY if planar)
                        # BRepTopAdaptor_FClass2d expects UV. For planar sketch faces, XY maps to UV.
                        state = classifier.Perform(gp_Pnt2d(rx, ry))
                        if state in [TopAbs_IN, TopAbs_ON]:
                            # TODO: Implement margin by checking distance to boundary edges
                            grid_pts.append((rx, ry))

                # 5. Transform & Combine
                for gx, gy in grid_pts:
                    trsf = gp_Trsf()
                    # Offset from seed location (assuming seed is at origin or first profile pt)
                    trsf.SetTranslation(gp_Vec(gx, gy, (zmin+zmax)/2.0)) 
                    
                    for ts, op in target_shapes:
                        copy_shape = BRepBuilderAPI_Transform(ts, trsf, True).Shape()
                        if final_shape is None: final_shape = copy_shape
                        else:
                            if op == 'ADD': final_shape = BRepAlgoAPI_Fuse(final_shape, copy_shape).Shape()
                            elif op == 'CUT': final_shape = BRepAlgoAPI_Cut(final_shape, copy_shape).Shape()
                return final_shape

            # --- Standard Patterns (Linear/Circular) ---
            count = int(params.get('count', 2))
            spacing = float(params.get('spacing', 10.0))
            direction_refs = params.get('direction_refs', [])
            
            # Direction 2 (Linear Only)
            count2 = int(params.get('count2', 0))
            spacing2 = float(params.get('spacing2', 10.0))
            direction2_refs = params.get('direction2_refs', [])
            
            flip1 = params.get('flip1', False)
            flip2 = params.get('flip2', False)
            pattern_seed_only = params.get('patternSeedOnly', False)

            # Circular specific
            equal_spacing = params.get('equalSpacing', False)
            instances_to_skip = params.get('instancesToSkip', [])

            # --- Resolve Direction 1 / Axis ---
            dir_vec = gp_Vec(1, 0, 0)
            dir_pnt = gp_Pnt(0, 0, 0)
            if direction_refs and len(direction_refs) > 0 and final_shape is not None:
                ref = direction_refs[0]
                if ref.get('type') == 'FACE':
                    matched_face = find_matching_face(final_shape, ref.get('coordinates'), ref.get('normal'), ref.get('signature'))
                    if matched_face:
                        surf_adaptor = BRepAdaptor_Surface(matched_face)
                        stype = surf_adaptor.GetType()
                        if stype in [GeomAbs_Cylinder, GeomAbs_Cone, GeomAbs_Sphere, GeomAbs_Torus]:
                            if stype == GeomAbs_Cylinder: ax = surf_adaptor.Cylinder().Axis()
                            elif stype == GeomAbs_Cone: ax = surf_adaptor.Cone().Axis()
                            elif stype == GeomAbs_Sphere: ax = surf_adaptor.Sphere().Position().Axis()
                            elif stype == GeomAbs_Torus: ax = surf_adaptor.Torus().Axis()
                            dir_pnt = ax.Location()
                            dir_vec = gp_Vec(ax.Direction())
                else:
                    matched_edge = find_matching_edge(final_shape, ref.get('coordinates'), ref.get('end_coordinates'), ref.get('signature'))
                    if matched_edge:
                        curve_adaptor = BRepAdaptor_Curve(matched_edge)
                        ctype = curve_adaptor.GetType()
                        if ctype in [GeomAbs_Circle, GeomAbs_Ellipse]:
                            if ctype == GeomAbs_Circle: circ = curve_adaptor.Circle()
                            else: circ = curve_adaptor.Ellipse()
                            dir_pnt = circ.Location()
                            dir_vec = gp_Vec(circ.Axis().Direction())
                        else:
                            u_min = curve_adaptor.FirstParameter()
                            pnt = gp_Pnt()
                            vec = gp_Vec()
                            curve_adaptor.D1(u_min, pnt, vec)
                            if vec.Magnitude() > 1e-6:
                                dir_vec = vec.Normalized()
                            dir_pnt = pnt
            else:
                axis_str = params.get('axis', 'X')
                if axis_str == 'X': dir_vec = gp_Vec(1, 0, 0)
                elif axis_str == 'Y': dir_vec = gp_Vec(0, 1, 0)
                else: dir_vec = gp_Vec(0, 0, 1)

            if flip1:
                dir_vec.Reverse()

            # --- Resolve Direction 2 ---
            dir2_vec = gp_Vec(0, 1, 0)
            if count2 > 0:
                if direction2_refs and len(direction2_refs) > 0 and final_shape is not None:
                    ref2 = direction2_refs[0]
                    matched_edge2 = find_matching_edge(final_shape, ref2.get('coordinates'), ref2.get('end_coordinates'), ref2.get('signature'))
                    if matched_edge2:
                        curve_adaptor2 = BRepAdaptor_Curve(matched_edge2)
                        u_min2 = curve_adaptor2.FirstParameter()
                        pnt2 = gp_Pnt()
                        vec2 = gp_Vec()
                        curve_adaptor2.D1(u_min2, pnt2, vec2)
                        if vec2.Magnitude() > 1e-6:
                            dir2_vec = vec2.Normalized()
                else:
                    if abs(dir_vec.X()) > 0.9: dir2_vec = gp_Vec(0, 1, 0)
                    else: dir2_vec = gp_Vec(1, 0, 0)
            
            if flip2:
                dir2_vec.Reverse()

            
            for target_id in target_ids:
                target_feat = None
                for prev_feat in features:
                    prev_id = prev_feat.id if hasattr(prev_feat, 'id') else prev_feat.get('id')
                    if prev_id == target_id:
                        target_feat = prev_feat
                        break

                if target_feat:
                    tf_type = target_feat.type if hasattr(target_feat, 'type') else target_feat.get('type')
                    tf_params = target_feat.parameters if hasattr(target_feat, 'parameters') else target_feat.get('parameters', {})
                    target_shape = build_feature_shape_in_isolation(tf_type, tf_params, None, features)

                    if target_shape:
                        target_op = tf_params.get('operation', 'ADD')
                        
                        # Collect instance shapes for optimized Boolean performance
                        instance_shapes_add = []
                        instance_shapes_cut = []
                        
                        # Pattern Loops
                        for i in range(count):
                            for j in range(max(1, count2)):
                                if i == 0 and j == 0: continue
                                
                                # Skip specific instances
                                instance_idx = i + j * count
                                if instance_idx in instances_to_skip: continue
                                
                                # Pattern Seed Only logic
                                if pattern_seed_only and i > 0 and j > 0:
                                    continue

                                trsf = gp_Trsf()
                                if pattern_type == 'LINEAR':
                                    offset = dir_vec.Multiplied(spacing * i).Added(dir2_vec.Multiplied(spacing2 * j))
                                    trsf.SetTranslation(offset)
                                else:  # CIRCULAR
                                    step_angle = spacing / count if equal_spacing else spacing
                                    angle_rad = math.radians(step_angle * i)
                                    ax1 = gp_Ax1(dir_pnt, gp_Dir(dir_vec.X(), dir_vec.Y(), dir_vec.Z()))
                                    trsf.SetRotation(ax1, angle_rad)

                                copy_shape = BRepBuilderAPI_Transform(target_shape, trsf, True).Shape()
                                if target_op == 'ADD':
                                    instance_shapes_add.append(copy_shape)
                                else:
                                    instance_shapes_cut.append(copy_shape)
                                    
                        # Perform bulk Boolean operations
                        if instance_shapes_add:
                            builder = BRepAlgoAPI_Fuse()
                            builder.SetArguments(final_shape)
                            builder.SetTools(instance_shapes_add)
                            builder.Build()
                            if builder.IsDone():
                                final_shape = builder.Shape()
                        
                        if instance_shapes_cut:
                            builder = BRepAlgoAPI_Cut()
                            builder.SetArguments(final_shape)
                            builder.SetTools(instance_shapes_cut)
                            builder.Build()
                            if builder.IsDone():
                                final_shape = builder.Shape()
                                
        elif f_type == 'MIRROR':
            target_ids = params.get('target_feature_ids', [])
            # Legacy support for single target_id
            single_target = params.get('target_feature_id')
            if single_target and single_target not in target_ids:
                target_ids.append(single_target)
                
            mirror_plane_refs = params.get('mirror_plane_refs', [])
            
            ax2 = gp_Ax2(gp_Pnt(0,0,0), gp_Dir(0,0,1))
            
            if mirror_plane_refs and len(mirror_plane_refs) > 0:
                ref = mirror_plane_refs[0]
                if ref.get('type') == 'FACE':
                    face_origin = ref.get('coordinates', [0,0,0])
                    face_normal = ref.get('normal', [0,0,1])
                    ax2 = gp_Ax2(gp_Pnt(*face_origin), gp_Dir(*face_normal))
                elif ref.get('id') in ['FRONT', 'TOP', 'RIGHT']:
                    plane = ref['id']
                    if plane == 'FRONT':
                        ax2 = gp_Ax2(gp_Pnt(0,0,0), gp_Dir(0,0,1), gp_Dir(1,0,0))
                    elif plane == 'TOP':
                        ax2 = gp_Ax2(gp_Pnt(0,0,0), gp_Dir(0,1,0), gp_Dir(1,0,0))
                    elif plane == 'RIGHT':
                        ax2 = gp_Ax2(gp_Pnt(0,0,0), gp_Dir(1,0,0), gp_Dir(0,0,-1))
            
            trsf = gp_Trsf()
            trsf.SetMirror(ax2)
            
            
            if target_ids:
                for target_id in target_ids:
                    target_feat = None
                    for prev_feat in features:
                        prev_id = prev_feat.id if hasattr(prev_feat, 'id') else prev_feat.get('id')
                        if prev_id == target_id:
                            target_feat = prev_feat
                            break
                    
                    if target_feat:
                        tf_type = target_feat.type if hasattr(target_feat, 'type') else target_feat.get('type')
                        tf_params = target_feat.parameters if hasattr(target_feat, 'parameters') else target_feat.get('parameters', {})
                        target_shape = build_feature_shape_in_isolation(tf_type, tf_params, None, features)
                        
                        if target_shape:
                            # Use BRepBuilderAPI_Transform for mirror (better than Moved/TopLoc)
                            copy_shape = BRepBuilderAPI_Transform(target_shape, trsf, True).Shape()
                            target_op = tf_params.get('operation', 'ADD')
                            if target_op == 'ADD':
                                final_shape = BRepAlgoAPI_Fuse(final_shape, copy_shape).Shape()
                            elif target_op == 'CUT':
                                final_shape = BRepAlgoAPI_Cut(final_shape, copy_shape).Shape()
            else:
                if final_shape:
                    copy_shape = BRepBuilderAPI_Transform(final_shape, trsf, True).Shape()
                    final_shape = BRepAlgoAPI_Fuse(final_shape, copy_shape).Shape()

        elif f_type == 'DRAFT':
            angle_deg = float(params.get('angle', 5))
            angle_rad = math.radians(angle_deg)
            neutral_refs = params.get('neutral_plane_refs', [])
            face_refs = params.get('faces_to_draft_refs', [])
            
            if final_shape and neutral_refs and face_refs:
                n_ref = neutral_refs[0]
                n_origin = n_ref.get('coordinates', [0,0,0])
                n_normal = n_ref.get('normal', [0,0,1])
                n_sig = n_ref.get('signature', {})
                
                # Resolve neutral face with signature
                matched_n_origin, matched_n_normal, _ = find_matching_face(final_shape, n_origin, n_normal, n_sig)
                
                n_norm_vec = gp_Vec(*matched_n_normal)
                if n_norm_vec.Magnitude() > 1e-6:
                    n_norm_vec.Normalize()
                else:
                    n_norm_vec = gp_Vec(0,0,1)
                pull_dir = gp_Dir(n_norm_vec.X(), n_norm_vec.Y(), n_norm_vec.Z())
                
                neutral_plane_gp = gp_Pln(gp_Pnt(*matched_n_origin), pull_dir)
                
                draft_tool = BRepOffsetAPI_DraftAngle(final_shape)
                
                faces_added = 0
                for f_ref in face_refs:
                    f_origin = f_ref.get('coordinates', [0,0,0])
                    f_normal = f_ref.get('normal', [0,0,1])
                    f_sig = f_ref.get('signature', {})
                    _, _, matched_face = find_matching_face(final_shape, f_origin, f_normal, f_sig)
                    if matched_face:
                        draft_tool.Add(matched_face, pull_dir, angle_rad, neutral_plane_gp)
                        faces_added += 1
                
                if faces_added > 0:
                    try:
                        draft_tool.Build()
                        if draft_tool.IsDone():
                            final_shape = draft_tool.Shape()
                    except Exception as e:
                        print(f"[ERROR] Draft failed: {e}")

        elif f_type == 'SHELL':
            thickness = float(params.get('thickness', 2.0))
            is_flip = params.get('flip', False)
            actual_offset = thickness if is_flip else -thickness
            faces_refs = params.get('faces_to_remove_refs', [])
            
            if final_shape:
                
                faces_to_remove = TopTools_ListOfShape()
                for ref in faces_refs:
                    origin = ref.get('coordinates', [0,0,0])
                    normal = ref.get('normal', [0,0,1])
                    f_sig = ref.get('signature', {})
                    _, _, matched_face = find_matching_face(final_shape, origin, normal, f_sig)
                    if matched_face:
                        faces_to_remove.Append(matched_face)
                
                try:
                    faces_to_remove = TopTools_ListOfShape()
                    for ref in faces_refs:
                        origin = ref.get('coordinates', [0,0,0])
                        normal = ref.get('normal', [0,0,1])
                        f_sig = ref.get('signature', {})
                        _, _, matched_face = find_matching_face(final_shape, origin, normal, f_sig)
                        if matched_face:
                            faces_to_remove.Append(matched_face)
                    
                    shell_tool = BRepOffsetAPI_MakeThickSolid()
                    shell_tool.MakeThickSolidByJoin(final_shape, faces_to_remove, actual_offset, 1e-3)
                    
                    if shell_tool.IsDone():
                        final_shape = shell_tool.Shape()
                except Exception as e:
                    print(f"[ERROR] Isolated SHELL failed: {e}")
            continue
                    
        elif f_type == 'HOLE_WIZARD':
            hole_type = params.get('hole_type', 'SIMPLE')
            diameter = float(params.get('diameter', 5))
            depth = float(params.get('depth', 10))
            refs = params.get('hole_placement_refs', [])
            
            if final_shape and refs:
                ref = refs[0]
                origin = ref.get('coordinates', [0,0,0])
                normal = ref.get('normal', [0,0,1])
                
                norm_vec = gp_Vec(*normal)
                if norm_vec.Magnitude() > 1e-6: norm_vec.Normalize()
                else: norm_vec = gp_Vec(0,0,1)
                    
                drill_dir = gp_Dir(-norm_vec.X(), -norm_vec.Y(), -norm_vec.Z())
                drill_pnt = gp_Pnt(*origin)
                drill_ax2 = gp_Ax2(drill_pnt, drill_dir)
                
                try:
                    hole_tool_shape = None
                    if hole_type == 'SIMPLE':
                        make_cyl = BRepPrimAPI_MakeCylinder(drill_ax2, diameter/2.0, depth)
                        hole_tool_shape = make_cyl.Shape()
                        linker.record_generation(f"{f_id}_SIDE", make_cyl.Shape()) # Simplified side face tracking
                        
                    elif hole_type == 'COUNTERBORE':
                        cb_dia = float(params.get('cb_diameter', 10))
                        cb_depth = float(params.get('cb_depth', 5))
                        cb_cyl = BRepPrimAPI_MakeCylinder(drill_ax2, cb_dia/2.0, cb_depth).Shape()
                        p2 = gp_Pnt(drill_pnt.X() + drill_dir.X()*cb_depth, drill_pnt.Y() + drill_dir.Y()*cb_depth, drill_pnt.Z() + drill_dir.Z()*cb_depth)
                        ax2_2 = gp_Ax2(p2, drill_dir)
                        main_cyl = BRepPrimAPI_MakeCylinder(ax2_2, diameter/2.0, max(0.1, depth - cb_depth)).Shape()
                        hole_tool_shape = BRepAlgoAPI_Fuse(cb_cyl, main_cyl).Shape()
                        
                    elif hole_type == 'COUNTERSINK':
                        cs_dia = float(params.get('cs_diameter', 10))
                        cs_angle = float(params.get('cs_angle', 90))
                        angle_rad = math.radians(cs_angle / 2.0)
                        cone_depth = (cs_dia - diameter) / (2.0 * math.tan(angle_rad)) if angle_rad > 0.01 else 0.1
                        cone = BRepPrimAPI_MakeCone(drill_ax2, cs_dia/2.0, diameter/2.0, cone_depth).Shape()
                        p2 = gp_Pnt(drill_pnt.X() + drill_dir.X()*cone_depth, drill_pnt.Y() + drill_dir.Y()*cone_depth, drill_pnt.Z() + drill_dir.Z()*cone_depth)
                        ax2_2 = gp_Ax2(p2, drill_dir)
                        main_cyl = BRepPrimAPI_MakeCylinder(ax2_2, diameter/2.0, max(0.1, depth - cone_depth)).Shape()
                        hole_tool_shape = BRepAlgoAPI_Fuse(cone, main_cyl).Shape()
                    
                    if hole_tool_shape:
                        cut_tool = BRepAlgoAPI_Cut(final_shape, hole_tool_shape)
                        cut_tool.Build()
                        if cut_tool.IsDone():
                            linker.record_evolution(cut_tool, [final_shape, hole_tool_shape])
                            final_shape = cut_tool.Shape()
                except Exception as e:
                    print(f"[ERROR] Hole Wizard TNS failed: {e}")

        # Perform the B-Rep boolean combination
        if current_feat_shape:
            # Assign color to the new shape in the linker
            if f_color:
                h_feat = get_shape_hash(current_feat_shape, 10000000)
                linker.color_map[h_feat] = f_color

            if final_shape is None:
                final_shape = current_feat_shape
            else:
                try:
                    if op == 'ADD':
                        tool = BRepAlgoAPI_Fuse(final_shape, current_feat_shape)
                    else:
                        tool = BRepAlgoAPI_Cut(final_shape, current_feat_shape)
                    
                    tool.Build()
                    if tool.IsDone():
                        linker.record_evolution(tool, [final_shape, current_feat_shape])
                        final_shape = tool.Shape()
                except Exception as bool_err:
                    print(f"[ERROR] Boolean TNS 3.0 failed: {bool_err}")
                    # Fallback to standard non-tracking boolean
                    if op == 'ADD': final_shape = BRepAlgoAPI_Fuse(final_shape, current_feat_shape).Shape()
                    else: final_shape = BRepAlgoAPI_Cut(final_shape, current_feat_shape).Shape()

        if cache_prefixes and final_shape is not None and HAS_OCC and not final_shape.IsNull():
            global_idx = start_index + local_idx
            prefix_key = _feature_tree_fingerprint(all_features[: global_idx + 1])
            _store_shape_prefix(prefix_key, final_shape)

    return final_shape

# ==========================================
# Pure-Python High-Fidelity Parametric Mesh Engine
# ==========================================

# --- P5-3 Material Database & Density (g/cm^3) ---
MATERIAL_LIBRARY = {
    "STEEL": {"density": 7.85, "name": "Alloy Steel", "color": "#71717A"},
    "ALUMINUM": {"density": 2.70, "name": "Aluminum 6061", "color": "#CBD5E1"},
    "PLASTIC": {"density": 1.05, "name": "ABS Plastic", "color": "#F8FAFC"},
    "COPPER": {"density": 8.96, "name": "Pure Copper", "color": "#B45309"},
    "GENERIC": {"density": 1.00, "name": "Generic Material", "color": "#94A3B8"}
}


def calculate_mass_properties(features, material_id='GENERIC'):
    """
    Calculates precise CAD physical/mass properties (Volume, Surface Area, Center of Mass, Inertia Matrix).
    """
    mat_info = MATERIAL_LIBRARY.get(material_id.upper(), MATERIAL_LIBRARY["GENERIC"])
    density = mat_info["density"] 
    density_mm3 = density * 0.001

    if not HAS_OCC:
        # High-Fidelity Pure-Python Fallback
        vol = 0.0
        surf = 0.0
        for feat in features:
            t = feat.get('type') if isinstance(feat, dict) else getattr(feat, 'type', None)
            p = feat.get('parameters', {}) if isinstance(feat, dict) else getattr(feat, 'parameters', {})
            op = p.get('operation', 'ADD')
            fv, fa = 0.0, 0.0
            if t == 'BOX':
                w, h, d = float(p.get('width', 10)), float(p.get('height', 10)), float(p.get('depth', 10))
                fv = w * h * d
                fa = 2 * (w*h + h*d + d*w)
            elif t == 'CYLINDER':
                r, h = float(p.get('radius', 5)), float(p.get('height', 10))
                fv = 3.14159265 * r * r * h
                fa = 2 * 3.14159265 * r * (r + h)
            elif t == 'SPHERE':
                r = float(p.get('radius', 5))
                fv = (4/3) * 3.14159265 * r**3
                fa = 4 * 3.14159265 * r**2
            elif t == 'EXTRUDE':
                depth = float(p.get('depth', 10))
                points_data = p.get('points', [])
                if points_data:
                    poly = points_data[0] if isinstance(points_data[0][0], list) else points_data
                    area = 0.0
                    for i in range(len(poly)):
                        p1, p2 = poly[i], poly[(i + 1) % len(poly)]
                        area += (float(p1[0]) * float(p2[1])) - (float(p2[0]) * float(p1[1]))
                    area = abs(area) / 2.0
                    perimeter = sum(math.hypot(float(poly[i][0])-float(poly[(i-1)%len(poly)][0]), float(poly[i][1])-float(poly[(i-1)%len(poly)][1])) for i in range(len(poly)))
                    fv, fa = area * depth, 2 * area + perimeter * depth
            elif t == 'REVOLVE':
                angle_deg = float(p.get('angle', 360.0))
                points_data = p.get('points', [])
                if points_data:
                    poly = points_data[0] if isinstance(points_data[0][0], list) else points_data
                    clean_poly = [pt for pt in poly if len(pt) < 3 or pt[2] != 'ARC_CONTROL']
                    area_sum = 0.0
                    u_centroid_sum = 0.0
                    for i in range(len(clean_poly)):
                        p1, p2 = clean_poly[i], clean_poly[(i + 1) % len(clean_poly)]
                        u1, v1 = float(p1[0]), float(p1[1])
                        u2, v2 = float(p2[0]), float(p2[1])
                        cross = (u1 * v2) - (u2 * v1)
                        area_sum += cross
                        u_centroid_sum += (u1 + u2) * cross
                    area = abs(area_sum) / 2.0
                    if area > 1e-6:
                        u_c = u_centroid_sum / (3.0 * area_sum)
                        fv = abs(2 * math.pi * u_c * area * (angle_deg / 360.0))
                        fa = 2 * area + 100
                    else:
                        fv, fa = 0.0, 0.0

            if op == 'ADD': vol += fv; surf += fa
            else: vol -= fv; surf += fa

        mass = vol * density_mm3
        return {
            "volume": vol, "mass": mass, "surface_area": surf, "material": mat_info["name"],
            "center_of_mass": [0.0, 0.0, 0.0],
            "inertia_matrix": [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]
        }

    try:
        shape = build_shape_only(features)
        if not shape or shape.IsNull(): return None
        props = GProp_GProps()
        brepgprop.VolumeProperties(shape, props)
        vol = props.Mass()
        mass = vol * density_mm3
        com_pnt = props.CentreOfMass()
        inertia = props.MatrixOfInertia()
        return {
            "volume": vol, "mass": mass, "material": mat_info["name"],
            "center_of_mass": [com_pnt.X(), com_pnt.Y(), com_pnt.Z()],
            "inertia_matrix": [[inertia.Value(i,j) for j in range(1,4)] for i in range(1,4)]
        }
    except Exception as err:
        print("[ERROR] calculate_mass_properties failed:", err)
        return None


def recognize_dimxpert_features(features):
    """
    Build the shape from features and run DimXpert feature recognition.
    Returns a list of recognized manufacturing features (holes, slots, fillets, chamfers).
    """
    try:
        from app.services.feature_recognition import recognize_features
        shape = build_shape_only(features)
        if shape is None:
            return []
        result = recognize_features(shape)
        return result if result else []
    except ImportError as e:
        print("[ERROR] DimXpert feature_recognition not available:", e)
        return []
    except Exception as e:
        print("[ERROR] recognize_dimxpert_features failed:", e)
        import traceback
        traceback.print_exc()
        return []

