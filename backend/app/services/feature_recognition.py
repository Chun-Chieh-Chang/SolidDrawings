"""
DimXpert Feature Recognition Module

OCCT-based topology analysis to automatically recognize manufacturing features:
- Holes (simple, counterbore, countersink)
- Slots (two-hole slot, full-slot)
- Fillets (edge blend)
- Chamfers (edge bevel)

Each recognized feature is annotated with:
- Type, name, confidence score
- Geometric parameters (diameter, depth, radius, etc.)
- Associated topological entities (faces, edges, vertices)
- Dimension constraints (GD&T ready)
"""

import math
import uuid
import hashlib
from typing import List, Dict, Any, Optional

# Global flag for OCC availability
HAS_OCC = False

try:
    from OCC.Core.TopExp import TopExp_Explorer
    from OCC.Core.TopAbs import TopAbs_FACE, TopAbs_EDGE, TopAbs_VERTEX, TopAbs_SOLID, TopAbs_COMPOUND
    from OCC.Core.BRep import BRep_Tool
    from OCC.Core.BRepAdaptor import BRepAdaptor_Surface, BRepAdaptor_Curve
    from OCC.Core.BRepFilletAPI import BRepFilletAPI_MakeFillet, BRepFilletAPI_MakeChamfer
    from OCC.Core.GeomAbs import GeomAbs_Plane, GeomAbs_Cylinder, GeomAbs_Sphere, GeomAbs_Cone, GeomAbs_Torus, GeomAbs_Line, GeomAbs_ArcOfCircle, GeomAbs_ArcOfEllipse
    from OCC.Core.BRepTools import BRepTools_UVShape
    from OCC.Core.gp import gp_Pnt, gp_Vec, gp_Dir
    from OCC.Core.TopTools import TopTools_IndexedDataMapOfShapeVertex, TopTools_IndexedDataMapOfShapeListOfShape
    from OCC.Core.TopExp import TopExp_MapOfShape
    from OCC.Core.GProp import GProp_GProps
    from OCC.Core.BRepGProp import brepgprop
    HAS_OCC = True
except ImportError:
    pass


def recognize_features(shape) -> List[Dict[str, Any]]:
    """
    Main entry point: analyze a BRep shape and return a list of recognized features.
    
    Returns a list of feature dicts, each containing:
    - id: str
    - type: str ('HOLE', 'SLOT', 'FILLET', 'CHAMFER')
    - name: str
    - confidence: float (0.0 - 1.0)
    - parameters: dict of geometric parameters
    - faces: list of face IDs
    - edges: list of edge IDs
    - vertices: list of vertex IDs
    - dimensions: list of dimension constraints
    """
    if not HAS_OCC:
        return []
    
    features = []
    
    # Step 1: Recognize holes (cylindrical/conical faces that are cuts)
    holes = _recognize_holes(shape)
    features.extend(holes)
    
    # Step 2: Recognize slots (pairs of cylindrical faces)
    slots = _recognize_slots(shape)
    features.extend(slots)
    
    # Step 3: Recognize fillets (rounded edges)
    fillets = _recognize_fillets(shape)
    features.extend(fillets)
    
    # Step 4: Recognize chamfers (beveled edges)
    chamfers = _recognize_chamfers(shape)
    features.extend(chamfers)
    
    return features


def _recognize_holes(shape) -> List[Dict[str, Any]]:
    """
    Detect holes by finding cylindrical faces whose normal points inward
    (indicating a cut rather than a protrusion).
    """
    holes = []
    
    # Explore all faces
    face_exp = TopExp_Explorer(shape, TopAbs_FACE)
    face_map = TopTools_IndexedDataMapOfShapeListOfShape()
    TopExp.MapOfShape(shape, TopAbs_FACE, face_map)
    
    # Track which faces belong to holes
    hole_faces = set()
    
    for i in range(1, face_map.Extent() + 1):
        face = face_map.FindKey(i)
        
        # Check if this face is cylindrical or conical
        adaptor = BRepAdaptor_Surface(face)
        geom_type = adaptor.GetType()
        
        if geom_type in (GeomAbs_Cylinder, GeomAbs_Cone):
            # Get the center point of this face for dimension calculation
            center = _get_face_center(face)
            
            if geom_type == GeomAbs_Cylinder:
                circ = adaptor.Cylinder()
                radius = circ.Radius()
                axis = circ.Axis()
                cone_angle = 0.0
                hole_type = "SIMPLE"
            else:
                circ = adaptor.Cone()
                radius = circ.Radius()
                axis = circ.Axis()
                cone_angle = circ.ConsemiAngle()
                hole_type = "COUNTERSINK" if cone_angle > 0.01 else "SIMPLE"
            
            # Check if this is a hole (cut) by examining adjacent faces
            # Holes typically have edges that are tangent to planar faces
            is_cut = _is_cut_feature(shape, face)
            
            if is_cut or radius > 0.5:  # Minimum hole size threshold
                hole_id = f"hole_{uuid.uuid4().hex[:8]}"
                
                # Calculate hole depth by measuring along axis
                depth = _measure_feature_depth(shape, face, axis)
                
                feature = {
                    "id": hole_id,
                    "type": "HOLE",
                    "subtype": hole_type,
                    "name": f"Hole-{len(holes) + 1}",
                    "confidence": 0.85 if is_cut else 0.6,
                    "parameters": {
                        "diameter": radius * 2,
                        "radius": radius,
                        "depth": depth,
                        "cone_angle": cone_angle if cone_angle > 0.01 else None,
                        "axis_direction": _vec_to_list(axis.Direction()),
                        "origin": center,
                    },
                    "faces": [_shape_to_id(face)],
                    "edges": [],
                    "vertices": [],
                    "dimensions": [
                        {
                            "type": "DIAMETER",
                            "value": radius * 2,
                            "tolerance": None,
                            "label": f"@{radius * 2:.3f}"
                        }
                    ]
                }
                holes.append(feature)
                hole_faces.add(_shape_to_id(face))
    
    return holes


def _recognize_slots(shape) -> List[Dict[str, Any]]:
    """
    Detect slots by finding pairs of cylindrical faces that are roughly parallel
    and at a consistent distance.
    """
    slots = []
    
    # Collect all cylindrical faces
    cylindrical_faces = []
    face_exp = TopExp_Explorer(shape, TopAbs_FACE)
    
    while face_exp.More():
        face = face_exp.Current()
        adaptor = BRepAdaptor_Surface(face)
        if adaptor.GetType() == GeomAbs_Cylinder:
            center = _get_face_center(face)
            circ = adaptor.Cylinder()
            radius = circ.Radius()
            axis_dir = circ.Axis().Direction()
            cylindrical_faces.append({
                "face": face,
                "center": center,
                "radius": radius,
                "axis": axis_dir,
                "id": _shape_to_id(face)
            })
        face_exp.Next()
    
    # Look for pairs of cylindrical faces that could form a slot
    # A slot has two cylindrical faces with parallel axes
    processed = set()
    
    for i, cf1 in enumerate(cylindrical_faces):
        if i in processed:
            continue
            
        for j, cf2 in enumerate(cylindrical_faces):
            if j <= i or j in processed:
                continue
            
            # Check if axes are parallel
            dot_product = abs(cf1["axis"].Dot(cf2["axis"]))
            if dot_product < 0.95:  # Not parallel
                continue
            
            # Check if radii are similar
            if abs(cf1["radius"] - cf2["radius"]) > 0.1:
                continue
            
            # Calculate distance between centers
            vec = gp_Vec(
                cf2["center"][0] - cf1["center"][0],
                cf2["center"][1] - cf1["center"][1],
                cf2["center"][2] - cf1["center"][2]
            )
            distance = vec.Magnitude()
            
            # If distance is reasonable (not too close, not too far)
            if distance > cf1["radius"] * 2 and distance < 500:
                slot_id = f"slot_{uuid.uuid4().hex[:8]}"
                
                # Determine slot type based on geometry
                slot_type = "FULL_SLOT" if distance > cf1["radius"] * 4 else "TWO_HOLE_SLOT"
                
                feature = {
                    "id": slot_id,
                    "type": "SLOT",
                    "subtype": slot_type,
                    "name": f"Slot-{len(slots) + 1}",
                    "confidence": 0.75,
                    "parameters": {
                        "width": cf1["radius"] * 2,
                        "length": distance,
                        "center1": cf1["center"],
                        "center2": cf2["center"],
                        "axis_direction": _vec_to_list(cf1["axis"]),
                    },
                    "faces": [cf1["id"], cf2["id"]],
                    "edges": [],
                    "vertices": [],
                    "dimensions": [
                        {
                            "type": "LENGTH",
                            "value": distance,
                            "tolerance": None,
                            "label": f"{distance:.3f}"
                        },
                        {
                            "type": "WIDTH",
                            "value": cf1["radius"] * 2,
                            "tolerance": None,
                            "label": f"{cf1['radius'] * 2:.3f}"
                        }
                    ]
                }
                slots.append(feature)
                processed.add(i)
                processed.add(j)
    
    return slots


def _recognize_fillets(shape) -> List[Dict[str, Any]]:
    """
    Detect fillets by finding edges where the adjacent faces have a rounded transition.
    """
    fillets = []
    
    # Explore all edges
    edge_exp = TopExp_Explorer(shape, TopAbs_EDGE)
    edge_vertex_map = TopTools_IndexedDataMapOfShapeListOfShape()
    TopExp.VertexColors(shape, edge_vertex_map)
    
    fillet_edges = []
    
    while edge_exp.More():
        edge = edge_exp.Current()
        
        # Check if this edge is a fillet edge by examining its curvature
        curve_adaptor = BRepAdaptor_Curve(edge)
        geom_type = curve_adaptor.GetType()
        
        # Fillet edges are typically arcs or lines with specific curvature patterns
        if geom_type in (GeomAbs_ArcOfCircle, GeomAbs_Line):
            # Check the edge's adjacent faces for smooth transition
            adjacent_faces = _get_adjacent_faces(shape, edge)
            
            if len(adjacent_faces) >= 2:
                # Check if the transition is smooth (fillet characteristic)
                is_fillet = _is_smooth_transition(shape, edge, adjacent_faces)
                
                if is_fillet:
                    edge_center = _get_edge_center(edge)
                    
                    # Estimate fillet radius
                    radius = _estimate_fillet_radius(edge, adjacent_faces)
                    
                    if radius > 0.1:  # Minimum fillet size
                        fillet_edges.append({
                            "edge": edge,
                            "center": edge_center,
                            "radius": radius,
                            "faces": [_shape_to_id(f) for f in adjacent_faces],
                            "id": _shape_to_id(edge)
                        })
        
        edge_exp.Next()
    
    # Group nearby fillet edges into fillet features
    grouped = _group_fillet_edges(fillet_edges)
    
    for group in grouped:
        fillet_id = f"fillet_{uuid.uuid4().hex[:8]}"
        avg_radius = sum(f["radius"] for f in group) / len(group)
        
        feature = {
            "id": fillet_id,
            "type": "FILLET",
            "subtype": "ROUND",
            "name": f"Fillet-{len(fillets) + 1}",
            "confidence": 0.8,
            "parameters": {
                "radius": avg_radius,
                "edge_count": len(group),
                "edges": [f["id"] for f in group],
                "faces": list(set(f["faces"] for f in group)),
            },
            "faces": list(set(f["faces"] for f in group)),
            "edges": [f["id"] for f in group],
            "vertices": [],
            "dimensions": [
                {
                    "type": "RADIUS",
                    "value": avg_radius,
                    "tolerance": None,
                    "label": f"R{avg_radius:.3f}"
                }
            ]
        }
        fillets.append(feature)
    
    return fillets


def _recognize_chamfers(shape) -> List[Dict[str, Any]]:
    """
    Detect chamfers by finding edges where adjacent faces meet at a bevel angle.
    """
    chamfers = []
    
    # Explore all edges
    edge_exp = TopExp_Explorer(shape, TopAbs_EDGE)
    
    chamfer_edges = []
    
    while edge_exp.More():
        edge = edge_exp.Current()
        
        adjacent_faces = _get_adjacent_faces(shape, edge)
        
        if len(adjacent_faces) >= 2:
            # Check if the transition is a chamfer (sharp bevel)
            chamfer_data = _detect_chamfer(shape, edge, adjacent_faces)
            
            if chamfer_data:
                edge_center = _get_edge_center(edge)
                chamfer_edges.append({
                    "edge": edge,
                    "center": edge_center,
                    "distance": chamfer_data["distance"],
                    "angle": chamfer_data["angle"],
                    "faces": [_shape_to_id(f) for f in adjacent_faces],
                    "id": _shape_to_id(edge)
                })
        
        edge_exp.Next()
    
    # Group nearby chamfer edges
    grouped = _group_chamfer_edges(chamfer_edges)
    
    for group in grouped:
        chamfer_id = f"chamfer_{uuid.uuid4().hex[:8]}"
        avg_distance = sum(f["distance"] for f in group) / len(group)
        avg_angle = sum(f["angle"] for f in group) / len(group)
        
        feature = {
            "id": chamfer_id,
            "type": "CHAMFER",
            "subtype": "DISTANCE_ANGLE" if avg_angle > 0.01 else "DISTANCE_DISTANCE",
            "name": f"Chamfer-{len(chamfers) + 1}",
            "confidence": 0.75,
            "parameters": {
                "distance": avg_distance,
                "angle": avg_angle if avg_angle > 0.01 else None,
                "edge_count": len(group),
                "edges": [f["id"] for f in group],
                "faces": list(set(f["faces"] for f in group)),
            },
            "faces": list(set(f["faces"] for f in group)),
            "edges": [f["id"] for f in group],
            "vertices": [],
            "dimensions": [
                {
                    "type": "DISTANCE",
                    "value": avg_distance,
                    "tolerance": None,
                    "label": f"C{avg_distance:.3f}"
                }
            ]
        }
        chamfers.append(feature)
    
    return chamfers


def _get_face_center(face) -> List[float]:
    """Get the center point of a face as [x, y, z]."""
    try:
        UVBounds = BRepTools_UVShape(face)
        umin, umax, vmin, vmax = UVBounds.MinU(), UVBounds.MaxU(), UVBounds.MinV(), UVBounds.MaxV()
        
        adaptor = BRepAdaptor_Surface(face)
        surf = adaptor.Surface()
        
        # Sample center point in UV space
        mid_u = (umin + umax) / 2.0
        mid_v = (vmin + vmax) / 2.0
        
        pnt = gp_Pnt()
        surf.D0(mid_u, mid_v, pnt)
        
        return [pnt.X(), pnt.Y(), pnt.Z()]
    except Exception:
        return [0.0, 0.0, 0.0]


def _get_edge_center(edge) -> List[float]:
    """Get the center point of an edge as [x, y, z]."""
    try:
        curve_adaptor = BRepAdaptor_Curve(edge)
        umin, umax = curve_adaptor.FirstParameter(), curve_adaptor.LastParameter()
        mid_u = (umin + umax) / 2.0
        
        pnt = gp_Pnt()
        curve_adaptor.D0(mid_u, pnt)
        
        return [pnt.X(), pnt.Y(), pnt.Z()]
    except Exception:
        return [0.0, 0.0, 0.0]


def _vec_to_list(vec) -> List[float]:
    """Convert a gp_Vec or gp_Dir to a list of floats."""
    return [vec.X(), vec.Y(), vec.Z()]


def _shape_to_id(shape) -> str:
    """Generate a stable ID for a TopoDS shape."""
    try:
        hasher = hashlib.sha256()
        hasher.update(str(shape.Hash()).encode())
        return f"shape_{hasher.hexdigest()[:12]}"
    except Exception:
        return f"shape_{uuid.uuid4().hex[:8]}"


def _get_adjacent_faces(shape, edge) -> List[Any]:
    """Get faces adjacent to an edge."""
    adjacent = []
    
    # Use TopExp to find faces sharing this edge
    face_exp = TopExp_Explorer(shape, TopAbs_FACE)
    while face_exp.More():
        face = face_exp.Current()
        # Check if the edge is part of this face's wire
        try:
            wire_exp = TopExp_Explorer(face, TopAbs_EDGE)
            while wire_exp.More():
                wire_edge = wire_exp.Current()
                if wire_edge.IsSame(edge):
                    adjacent.append(face)
                    break
                wire_exp.Next()
        except Exception:
            pass
        face_exp.Next()
    
    return adjacent


def _is_cut_feature(shape, face) -> bool:
    """
    Heuristic: check if a cylindrical/conical face is likely a cut (hole)
    rather than a protrusion.
    
    A cut feature typically:
    - Has a smaller volume than the overall shape
    - Has edges that are internal to the shape's boundary
    """
    try:
        # Check if the face is internal by examining its bounding box
        from OCC.Core.Bnd import Bnd_Box
        from OCC.Core.BRepBndLib import BRepBndLib
        
        box = Bnd_Box()
        BRepBndLib.Add(shape, box)
        
        xmin, ymin, zmin, xmax, ymax, zmax = box.Get()
        shape_volume = _compute_shape_volume(shape)
        
        # Get face bounds
        face_box = Bnd_Box()
        BRepBndLib.Add(face, face_box)
        fxmin, fymin, fzmin, fxmax, fymax, fzmax = face_box.Get()
        
        # Face volume vs shape volume ratio
        face_extent = (fxmax - fxmin) * (fymax - fymin) * (fzmax - fzmin)
        if shape_volume > 0 and face_extent / shape_volume < 0.3:
            return True
        
        return False
    except Exception:
        return True  # Assume it's a cut if we can't determine


def _compute_shape_volume(shape) -> float:
    """Compute the volume of a shape."""
    try:
        props = GProp_GProps()
        brepgprop.VolumeProperties(shape, props)
        return props.Mass()
    except Exception:
        return 1.0


def _measure_feature_depth(shape, face, axis) -> float:
    """Measure the depth of a hole feature along its axis."""
    try:
        from OCC.Core.BRepExtrema import BRepExtrema_DistShapeShape
        
        # Get the face's bounding box extent along the axis
        center = _get_face_center(face)
        
        # Create a probe point in the opposite direction of the axis
        depth = 0.0
        step = 0.1
        max_depth = 1000.0  # Reasonable upper bound
        
        for d in range(int(max_depth / step)):
            probe_point = gp_Pnt(
                center[0] - axis.X() * d * step,
                center[1] - axis.Y() * d * step,
                center[2] - axis.Z() * d * step
            )
            
            # Check if this point is inside the shape
            # If it goes outside, we've found the depth
            if not _is_point_inside_shape(shape, probe_point):
                depth = d * step
                break
        
        return depth if depth > 0 else 10.0  # Default depth
    except Exception:
        return 10.0  # Default depth


def _is_point_inside_shape(shape, point) -> bool:
    """Check if a point is inside a shape (heuristic)."""
    try:
        from OCC.Core.BRepClass3d import BRepClass3d_SolidClassifier
        from OCC.Core.TopAbs import TopAbs_INS, TopAbs_OUT, TopAbs_ON
        
        classifier = BRepClass3d_SolidClassifier(shape)
        classifier.Perform(point, 1e-7)
        
        result = classifier.State()
        return result in (TopAbs_INS, TopAbs_ON)
    except Exception:
        return True


def _is_smooth_transition(shape, edge, faces) -> bool:
    """Check if the transition between faces at an edge is smooth (fillet characteristic)."""
    try:
        if len(faces) < 2:
            return False
        
        # Get normals of adjacent faces
        normals = []
        for face in faces[:2]:
            adaptor = BRepAdaptor_Surface(face)
            if adaptor.GetType() == GeomAbs_Plane:
                pln = adaptor.Plane()
                normals.append(pln.Axis().Direction())
            elif adaptor.GetType() == GeomAbs_Cylinder:
                circ = adaptor.Cylinder()
                normals.append(circ.Axis().Direction())
            else:
                return False
        
        # Calculate angle between normals
        if len(normals) == 2:
            angle = normals[0].Angle(normals[1])
            # Fillets typically have angles between 30-150 degrees
            # (not sharp 90-degree corners, not flat 0/180)
            return 0.5 < angle < 2.5  # radians
        
        return False
    except Exception:
        return False


def _estimate_fillet_radius(edge, faces) -> float:
    """Estimate the radius of a fillet from edge geometry."""
    try:
        curve_adaptor = BRepAdaptor_Curve(edge)
        if curve_adaptor.GetType() == GeomAbs_ArcOfCircle:
            return curve_adaptor.Circle().Radius()
        elif curve_adaptor.GetType() == GeomAbs_Line:
            # Linear edge - estimate from adjacent face analysis
            return 1.0  # Default
        return 0.5
    except Exception:
        return 0.5


def _detect_chamfer(shape, edge, faces) -> Optional[Dict[str, float]]:
    """Detect if an edge is a chamfer and return its parameters."""
    try:
        if len(faces) < 2:
            return None
        
        # Get the angle between adjacent faces
        normals = []
        for face in faces[:2]:
            adaptor = BRepAdaptor_Surface(face)
            if adaptor.GetType() == GeomAbs_Plane:
                pln = adaptor.Plane()
                normals.append(pln.Axis().Direction())
            elif adaptor.GetType() == GeomAbs_Cylinder:
                circ = adaptor.Cylinder()
                normals.append(circ.Axis().Direction())
            else:
                return None
        
        if len(normals) == 2:
            angle = normals[0].Angle(normals[1])
            # Chamfers typically have angles between 30-60 degrees from horizontal
            # (sharp transition, not rounded)
            if 0.3 < angle < 1.2:  # radians (~17-69 degrees)
                # Estimate chamfer distance from edge length
                curve_adaptor = BRepAdaptor_Curve(edge)
                umin, umax = curve_adaptor.FirstParameter(), curve_adaptor.LastParameter()
                length = umax - umin
                distance = length * 0.1  # Heuristic
                
                return {
                    "distance": max(distance, 0.5),
                    "angle": angle
                }
        
        return None
    except Exception:
        return None


def _group_fillet_edges(edges: List[Dict]) -> List[List[Dict]]:
    """Group fillet edges by proximity and radius similarity."""
    if not edges:
        return []
    
    groups = []
    used = set()
    
    for i, edge in enumerate(edges):
        if i in used:
            continue
        
        group = [edge]
        used.add(i)
        
        for j, other in enumerate(edges):
            if j in used:
                continue
            
            # Check if this edge is close to the group center
            dist = _point_distance(edge["center"], other["center"])
            radius_diff = abs(edge["radius"] - other["radius"])
            
            if dist < 50.0 and radius_diff < 0.5:  # Proximity thresholds
                group.append(other)
                used.add(j)
        
        groups.append(group)
    
    return groups


def _group_chamfer_edges(edges: List[Dict]) -> List[List[Dict]]:
    """Group chamfer edges by proximity and angle similarity."""
    if not edges:
        return []
    
    groups = []
    used = set()
    
    for i, edge in enumerate(edges):
        if i in used:
            continue
        
        group = [edge]
        used.add(i)
        
        for j, other in enumerate(edges):
            if j in used:
                continue
            
            dist = _point_distance(edge["center"], other["center"])
            angle_diff = abs(edge["angle"] - other["angle"])
            
            if dist < 50.0 and angle_diff < 0.3:
                group.append(other)
                used.add(j)
        
        groups.append(group)
    
    return groups


def _point_distance(p1: List[float], p2: List[float]) -> float:
    """Calculate Euclidean distance between two points."""
    return math.sqrt(
        (p1[0] - p2[0]) ** 2 +
        (p1[1] - p2[1]) ** 2 +
        (p1[2] - p2[2]) ** 2
    )


def get_iso_tolerance(class_grade: str, nominal_size: float) -> Dict[str, Any]:
    """
    Get ISO tolerance values based on grade and nominal size.
    
    Grades: IT01, IT0, IT1, IT2, ..., IT16 (standard ISO grades)
    Returns: dict with upper_deviation, lower_deviation, tolerance_band
    """
    # Simplified ISO 286 tolerance table (micrometers)
    tolerance_table = {
        "IT01": [0.3, 0.4, 0.5, 0.6, 0.8, 1.0, 1.2, 1.5, 1.8, 2.2, 2.7, 3.2, 3.8, 4.5, 5.4, 6.5, 7.5, 9.0],
        "IT0": [0.5, 0.6, 0.8, 1.0, 1.2, 1.5, 1.8, 2.2, 2.7, 3.2, 3.8, 4.5, 5.4, 6.5, 7.5, 9.0, 11, 13],
        "IT1": [0.8, 1.0, 1.2, 1.5, 1.8, 2.2, 2.7, 3.2, 3.8, 4.5, 5.4, 6.5, 7.5, 9.0, 11, 13, 15, 18],
        "IT2": [1.2, 1.5, 1.8, 2.2, 2.7, 3.2, 3.8, 4.5, 5.4, 6.5, 7.5, 9.0, 11, 13, 15, 18, 21, 25],
        "IT3": [2.0, 2.5, 3.0, 4.0, 4.5, 5.5, 6.5, 8.0, 9.5, 11, 13, 15, 18, 20, 22, 25, 27, 30],
        "IT4": [3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 10, 12, 14, 16, 18, 20, 22, 25, 27, 30, 33, 36],
        "IT5": [4.0, 5.0, 6.0, 8.0, 9.0, 11, 13, 15, 18, 20, 22, 25, 27, 30, 33, 36, 39, 43],
        "IT6": [6.0, 8.0, 9.0, 11, 13, 15, 16, 19, 21, 25, 29, 32, 36, 39, 43, 46, 50, 54],
        "IT7": [10, 12, 15, 18, 21, 25, 30, 33, 39, 46, 52, 57, 63, 70, 80, 89, 100, 110],
        "IT8": [14, 18, 22, 27, 33, 39, 46, 54, 63, 72, 81, 90, 100, 110, 130, 140, 150, 170],
    }
    
    # Size ranges in mm
    size_ranges = [
        (0, 1), (1, 3), (3, 6), (6, 10), (10, 18), (18, 30),
        (30, 50), (50, 80), (80, 120), (120, 180), (180, 250),
        (250, 315), (315, 400), (400, 500), (500, 650), (650, 800),
        (800, 1000), (1000, 1200)
    ]
    
    # Find size range index
    range_idx = 0
    for i, (low, high) in enumerate(size_ranges):
        if low <= nominal_size < high:
            range_idx = i
            break
    
    grade_key = class_grade.upper()
    if grade_key not in tolerance_table:
        grade_key = "IT7"  # Default to IT7
    
    tolerances = tolerance_table[grade_key]
    tolerance_value = tolerances[min(range_idx, len(tolerances) - 1)]
    
    return {
        "grade": class_grade,
        "tolerance_um": tolerance_value,
        "tolerance_mm": tolerance_value / 1000.0,
        "nominal_size": nominal_size,
        "upper_deviation": tolerance_value / 1000.0,  # Simplified (H shaft)
        "lower_deviation": 0.0,  # Simplified
    }
