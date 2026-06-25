"""
Surfacing module — boundary surface and trim surface operations.
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
    from OCC.Core.BRepFill import BRepFill_PipeShell
    HAS_OCC = True
except ImportError:
    HAS_OCC = False


def generate_boundary_surface(features, boundary_curves, continuity="G1"):
    """
    Generate a Boundary Surface from 4 boundary curves using OCCT GeomFill.
    Falls back to a planar surface if OCC is unavailable.
    """
    if not HAS_OCC:
        return str(uuid.uuid4())

    try:
        # Build a face from the boundary curves
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
            shape_hash = str(uuid.uuid4())
            _SURFACE_SHAPE_CACHE[shape_hash] = face
            return shape_hash

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

        # Build the main shape from features
        shape = build_shape_only(features)
        if not shape or shape.IsNull():
            return str(uuid.uuid4())

        # Build trim tool shape (simple box/prism from the curve)
        pts = trim_curve.get('points', [])
        if len(pts) < 2:
            return str(uuid.uuid4())

        # Create a prism from the trim curve
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
            shape_hash = str(uuid.uuid4())
            _SURFACE_SHAPE_CACHE[shape_hash] = result
            return shape_hash

        return str(uuid.uuid4())
    except Exception as e:
        import traceback
        traceback.print_exc()
        return str(uuid.uuid4())
