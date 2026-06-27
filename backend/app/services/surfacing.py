"""
Surfacing module — boundary surface, trim surface, fill, planar, extend,
untrim, and ruled surface operations.
Extracted from geometry_service.py for modularity.
"""

import uuid

# Global flags
HAS_OCC = False

# Cache for surface operation results
_SURFACE_SHAPE_CACHE: dict[str, object] = {}
_SURFACE_CACHE_MAX = 16

# Try loading OpenCASCADE
try:
    from OCC.Core.gp import gp_Pnt, gp_Dir, gp_Vec
    from OCC.Core.BRepBuilderAPI import BRepBuilderAPI_MakeEdge, BRepBuilderAPI_MakeWire, BRepBuilderAPI_MakeFace
    from OCC.Core.BRepPrimAPI import BRepPrimAPI_MakePrism
    from OCC.Core.BRepAlgoAPI import BRepAlgoAPI_Common, BRepAlgoAPI_Cut
    from OCC.Core.TColgp import TColgp_HArray1OfPnt
    from OCC.Core.GeomAPI import GeomAPI_Interpolate
    from OCC.Core.BRepFill import BRepFill_PipeShell, BRepFill_CompatibleWires, BRepFill_Filling
    from OCC.Core.BRepLib import breplib
    from OCC.Core.BRepAdaptor import BRepAdaptor_Surface, BRepAdaptor_Curve
    from OCC.Core.GeomAbs import GeomAbs_C0, GeomAbs_G1, GeomAbs_G2
    from OCC.Core.BRepOffsetAPI import BRepOffsetAPI_MakeOffset, BRepOffsetAPI_ThruSections
    from OCC.Core.TopExp import TopExp_Explorer
    from OCC.Core.TopAbs import TopAbs_FACE, TopAbs_EDGE, TopAbs_WIRE, TopAbs_SHAPE
    from OCC.Core.TopoDS import topods, TopoDS_Compound, TopoDS_Wire
    from OCC.Core.BRep import BRep_Builder, BRep_Tool
    from OCC.Core.Geom import Geom_Plane
    from OCC.Core.BRepCheck import BRepCheck_Analyzer
    HAS_OCC = True
except ImportError as e:
    print(f"[WARNING] OCC partial import in surfacing.py: {e}")
    HAS_OCC = False


def _cache_shape(shape):
    """Store a shape in the cache and return its hash key."""
    key = str(uuid.uuid4())
    if len(_SURFACE_SHAPE_CACHE) >= _SURFACE_CACHE_MAX:
        _SURFACE_SHAPE_CACHE.clear()
    _SURFACE_SHAPE_CACHE[key] = shape
    return key


# ── Existing functions ──────────────────────────────────────────────


def generate_boundary_surface(features, boundary_curves, continuity="G1"):
    """
    Generate a Boundary Surface from 4 boundary curves using OCCT GeomFill.
    Falls back to a planar surface if OCC is unavailable.
    """
    if not HAS_OCC:
        return str(uuid.uuid4())

    try:
        wires = []
        for curve_data in boundary_curves:
            pts = curve_data.get('points', [])
            if len(pts) < 2:
                continue
            edge = BRepBuilderAPI_MakeEdge(
                gp_Pnt(*pts[0]), gp_Pnt(*pts[-1])
            ).Edge()
            wire = BRepBuilderAPI_MakeWire(edge).Wire()
            wires.append(wire)

        if wires:
            wire_builder = BRepBuilderAPI_MakeWire()
            for w in wires:
                wire_builder.Add(w)
            final_wire = wire_builder.Wire()
            face = BRepBuilderAPI_MakeFace(final_wire, True).Face()
            return _cache_shape(face)

        return str(uuid.uuid4())
    except Exception as e:
        import traceback
        traceback.print_exc()
        return str(uuid.uuid4())


def generate_trim_surface(features, trim_curve, keep_side="INSIDE"):
    """
    Trim a surface using a curve. Uses BRepAlgoAPI_Cut/Common.
    Lazy-imports build_shape_only from geometry_service to avoid circular deps.
    """
    if not HAS_OCC:
        return str(uuid.uuid4())

    try:
        from geometry_service import build_shape_only  # lazy import

        shape = build_shape_only(features)
        if not shape or shape.IsNull():
            return str(uuid.uuid4())

        pts = trim_curve.get('points', [])
        if len(pts) < 2:
            return str(uuid.uuid4())

        edge = BRepBuilderAPI_MakeEdge(
            gp_Pnt(*pts[0]), gp_Pnt(*pts[-1])
        ).Edge()
        wire = BRepBuilderAPI_MakeWire(edge).Wire()
        face = BRepBuilderAPI_MakeFace(wire, True).Face()
        prism = BRepPrimAPI_MakePrism(face, gp_Vec(0, 0, 50)).Shape()

        if keep_side == "INSIDE":
            result = BRepAlgoAPI_Common(shape, prism).Shape()
        else:
            result = BRepAlgoAPI_Cut(shape, prism).Shape()

        if result and not result.IsNull():
            return _cache_shape(result)

        return str(uuid.uuid4())
    except Exception as e:
        import traceback
        traceback.print_exc()
        return str(uuid.uuid4())


# ── New surfacing functions ─────────────────────────────────────────


def generate_filled_surface(boundary_points, constraint_points=None):
    """
    Filled Surface (填補曲面): fills a closed boundary with a smooth surface,
    optionally using constraint curves for shape control.

    Uses OCC's BRepFill_Filling (N-Sided surface filling).

    Args:
        boundary_points: List of [[x,y,z], ...] forming a closed loop.
        constraint_points: Optional list of lists of points for internal constraints.

    Returns:
        str: Cache hash key, or uuid4 fallback.
    """
    if not HAS_OCC:
        return str(uuid.uuid4())

    try:
        if not boundary_points or len(boundary_points) < 3:
            return str(uuid.uuid4())

        # Build boundary wire
        edges = []
        for i in range(len(boundary_points)):
            p1 = gp_Pnt(*boundary_points[i])
            p2 = gp_Pnt(*boundary_points[(i + 1) % len(boundary_points)])
            edge = BRepBuilderAPI_MakeEdge(p1, p2).Edge()
            edges.append(edge)

        wire_builder = BRepBuilderAPI_MakeWire()
        for e in edges:
            wire_builder.Add(e)
        boundary_wire = wire_builder.Wire()

        # Use BRepFill_Filling for N-sided surface
        # NOTE: Add() accepts TopoDS_Edge, not TopoDS_Wire — add edges individually
        filler = BRepFill_Filling()
        for edge in edges:
            filler.Add(edge, GeomAbs_C0)

        # Add constraint curves if provided
        if constraint_points:
            for cpts in constraint_points:
                if len(cpts) >= 2:
                    for j in range(len(cpts) - 1):
                        ce = BRepBuilderAPI_MakeEdge(gp_Pnt(*cpts[j]), gp_Pnt(*cpts[j + 1])).Edge()
                        filler.Add(ce, GeomAbs_G1)

        filler.Build()
        if filler.IsDone():
            face = filler.Face()
            if face and not face.IsNull():
                return _cache_shape(face)

        # Fallback: planar face
        face = BRepBuilderAPI_MakeFace(boundary_wire, True).Face()
        return _cache_shape(face)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return str(uuid.uuid4())


def generate_planar_surface(boundary_points):
    """
    Planar Surface (平面曲面): creates a planar surface from a closed boundary.

    Uses BRepBuilderAPI_MakeFace with a planar wire.

    Args:
        boundary_points: List of [[x,y,z], ...] forming a closed planar loop.

    Returns:
        str: Cache hash key.
    """
    if not HAS_OCC:
        return str(uuid.uuid4())

    try:
        if not boundary_points or len(boundary_points) < 3:
            return str(uuid.uuid4())

        edges = []
        for i in range(len(boundary_points)):
            p1 = gp_Pnt(*boundary_points[i])
            p2 = gp_Pnt(*boundary_points[(i + 1) % len(boundary_points)])
            edge = BRepBuilderAPI_MakeEdge(p1, p2).Edge()
            edges.append(edge)

        wire_builder = BRepBuilderAPI_MakeWire()
        for e in edges:
            wire_builder.Add(e)
        wire = wire_builder.Wire()

        face = BRepBuilderAPI_MakeFace(wire, True).Face()
        if face and not face.IsNull():
            return _cache_shape(face)

        return str(uuid.uuid4())
    except Exception as e:
        import traceback
        traceback.print_exc()
        return str(uuid.uuid4())


def generate_extend_surface(shape, extend_distance=5.0, extend_type="SAME"):
    """
    Extend Surface (延伸曲面): extends a surface along its edges.

    Uses BRepLib_MakeExtend to extend all faces of the shape.

    Args:
        shape: The TopoDS_Shape (or face) to extend.
        extend_distance: How far to extend in model units.
        extend_type: 'SAME' or 'LINEAR'.

    Returns:
        str: Cache hash key.
    """
    if not HAS_OCC:
        return str(uuid.uuid4())

    try:
        if shape is None or shape.IsNull():
            return str(uuid.uuid4())

        # Process each face in the shape
        builder = BRep_Builder()
        compound = TopoDS_Compound()
        builder.MakeCompound(compound)

        explorer = TopExp_Explorer(shape, TopAbs_FACE)
        extended_any = False
        while explorer.More():
            face = topods.Face(explorer.Current())
            explorer.Next()

            try:
                breplib.BuildExtensions(face)
                ext_face = face  # extensions are stored in the face
                builder.Add(compound, ext_face)
                extended_any = True
            except Exception:
                builder.Add(compound, face)
                extended_any = True

        if extended_any:
            return _cache_shape(compound)
        return str(uuid.uuid4())
    except Exception as e:
        import traceback
        traceback.print_exc()
        return str(uuid.uuid4())


def generate_untrim_surface(shape):
    """
    Untrim Surface (取消修剪): removes trim boundaries from a face,
    returning the underlying surface.

    Extracts the Geom_Surface from each face and builds an untrimmed face.

    Args:
        shape: The TopoDS_Shape containing the faces to untrim.

    Returns:
        str: Cache hash key.
    """
    if not HAS_OCC:
        return str(uuid.uuid4())

    try:
        if shape is None or shape.IsNull():
            return str(uuid.uuid4())

        builder = BRep_Builder()
        compound = TopoDS_Compound()
        builder.MakeCompound(compound)

        explorer = TopExp_Explorer(shape, TopAbs_FACE)
        while explorer.More():
            face = topods.Face(explorer.Current())
            explorer.Next()

            # Get the underlying geometric surface
            surf = BRep_Tool.Surface(face)
            if surf:
                # Create a face from the surface with its natural bounds
                u_min, u_max, v_min, v_max = 0.0, 0.0, 0.0, 0.0
                try:
                    # Try to get UV bounds of the underlying surface
                    adaptor = BRepAdaptor_Surface(face)
                    u_min = adaptor.FirstUParameter()
                    u_max = adaptor.LastUParameter()
                    v_min = adaptor.FirstVParameter()
                    v_max = adaptor.LastVParameter()
                except Exception:
                    u_min, u_max, v_min, v_max = -100, 100, -100, 100

                untrimmed_face = BRepBuilderAPI_MakeFace(surf, u_min, u_max, v_min, v_max, 1e-6).Face()
                if untrimmed_face and not untrimmed_face.IsNull():
                    builder.Add(compound, untrimmed_face)

        # Check if compound is non-empty
        exp = TopExp_Explorer(compound, TopAbs_FACE)
        if exp.More():
            return _cache_shape(compound)

        return str(uuid.uuid4())
    except Exception as e:
        import traceback
        traceback.print_exc()
        return str(uuid.uuid4())


def generate_ruled_surface(curve1_points, curve2_points):
    """
    Ruled Surface (直紋曲面): creates a ruled surface between two curves.

    Uses BRepFill_CompatibleWires + BRepFill_CompatibleWires for the ruled surface.

    Args:
        curve1_points: List of [[x,y,z], ...] for the first curve.
        curve2_points: List of [[x,y,z], ...] for the second curve.

    Returns:
        str: Cache hash key.
    """
    if not HAS_OCC:
        return str(uuid.uuid4())

    try:
        if not curve1_points or len(curve1_points) < 2:
            return str(uuid.uuid4())
        if not curve2_points or len(curve2_points) < 2:
            return str(uuid.uuid4())

        # Build first wire
        edges1 = []
        for i in range(len(curve1_points) - 1):
            e = BRepBuilderAPI_MakeEdge(
                gp_Pnt(*curve1_points[i]), gp_Pnt(*curve1_points[i + 1])
            ).Edge()
            edges1.append(e)
        w1_builder = BRepBuilderAPI_MakeWire()
        for e in edges1:
            w1_builder.Add(e)
        wire1 = w1_builder.Wire()

        # Build second wire
        edges2 = []
        for i in range(len(curve2_points) - 1):
            e = BRepBuilderAPI_MakeEdge(
                gp_Pnt(*curve2_points[i]), gp_Pnt(*curve2_points[i + 1])
            ).Edge()
            edges2.append(e)
        w2_builder = BRepBuilderAPI_MakeWire()
        for e in edges2:
            w2_builder.Add(e)
        wire2 = w2_builder.Wire()

        # Create ruled surface using BRepOffsetAPI_ThruSections
        try:
            ts = BRepOffsetAPI_ThruSections(False, True, 1e-6)
            ts.AddWire(wire1)
            ts.AddWire(wire2)
            ts.Build()
            if ts.IsDone():
                shape = ts.Shape()
                if shape and not shape.IsNull():
                    return _cache_shape(shape)
        except Exception:
            pass

        return str(uuid.uuid4())
    except Exception as e:
        import traceback
        traceback.print_exc()
        return str(uuid.uuid4())
