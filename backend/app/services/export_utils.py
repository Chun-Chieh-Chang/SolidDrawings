"""
Export/Import utilities — STEP, IGES, STL, DXF file I/O and interference checking.
Extracted from geometry_service.py for modularity.
"""

import uuid

# Global flags
HAS_OCC = False
HAS_STEP = False
HAS_STL = False
HAS_IGES = False
HAS_XCAF = False

try:
    from OCC.Core.gp import gp_Pnt, gp_Dir, gp_Vec, gp_Ax1, gp_Trsf
    from OCC.Core.TopLoc import TopLoc_Location
    from OCC.Core.TopoDS import TopoDS_Compound
    from OCC.Core.BRep import BRep_Builder
    from OCC.Core.BRepBuilderAPI import BRepBuilderAPI_Transform
    from OCC.Core.BRepAlgoAPI import BRepAlgoAPI_Common, BRepAlgoAPI_Cut, BRepAlgoAPI_Fuse
    from OCC.Core.BRepMesh import BRepMesh_IncrementalMesh
    from OCC.Core.GProp import GProp_GProps
    from OCC.Core.BRepGProp import brepgprop
    from OCC.Core.TopExp import TopExp_Explorer
    from OCC.Core.TopAbs import TopAbs_FACE, TopAbs_EDGE, TopAbs_VERTEX
    from OCC.Core.TopoDS import topods
    from OCC.Core.BRepAdaptor import BRepAdaptor_Surface, BRepAdaptor_Curve
    from OCC.Core.GeomAbs import GeomAbs_Cylinder, GeomAbs_Circle
    from OCC.Core.BRepCheck import BRepCheck_Analyzer
    HAS_OCC = True

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

    try:
        from OCC.Core.STEPControl import STEPControl_Reader, STEPControl_Writer, STEPControl_AsIs
        HAS_STEP = True
    except ImportError:
        STEPControl_Reader = None
        STEPControl_Writer = None
        STEPControl_AsIs = None
        HAS_STEP = False

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

except ImportError:
    HAS_OCC = False


def export_cad_file(features, format_type, filepath):
    """
    Exports 3D CAD solid to standard formats (STEP, IGES, STL) directly on the local filesystem.
    Forces incremental meshing first for STL formatting.
    """
    if not HAS_OCC:
        return False

    try:
        from .geometry_service import build_shape_only, project_2d

        shape = build_shape_only(features)
        if not shape or shape.IsNull():
            print("[ERROR] export_cad_file: Valid 3D shape could not be constructed.")
            return False

        format_type = format_type.upper()
        if format_type == 'STEP':
            if not HAS_STEP:
                print("[ERROR] STEP export not available — missing OCC.Core.STEPControl")
                return False
            writer = STEPControl_Writer()
            writer.Transfer(shape, STEPControl_AsIs)
            status = writer.Write(filepath)
            return status == 1

        elif format_type == 'IGES':
            if not HAS_IGES:
                print("[ERROR] IGES export not available — missing OCC.Core.IGESControl (FreeImage dependency)")
                return False
            writer = IGESControl_Writer()
            writer.AddShape(shape)
            status = writer.Write(filepath)
            return bool(status)

        elif format_type == 'STL':
            if not HAS_STL:
                print("[ERROR] STL export not available — missing OCC.Core.StlAPI (FreeImage dependency)")
                return False
            BRepMesh_IncrementalMesh(shape, 0.1)
            writer = StlAPI_Writer()
            status = writer.Write(shape, filepath)
            return bool(status)

        elif format_type == 'DXF':
            hlr_lines = project_2d(features, plane_type='FRONT')
            if not hlr_lines:
                return False

            with open(filepath, 'w', encoding='utf-8') as f:
                f.write("  0\nSECTION\n  2\nENTITIES\n")
                for line in hlr_lines:
                    layer = "VISIBLE" if line.get("visible", True) else "HIDDEN"
                    pts = line.get("points", [])
                    if len(pts) < 2:
                        continue
                    for i in range(len(pts) - 1):
                        x1, y1 = pts[i]
                        x2, y2 = pts[i+1]
                        f.write("  0\nLINE\n")
                        f.write(f"  8\n{layer}\n")
                        f.write(f" 10\n{x1:.6f}\n")
                        f.write(f" 20\n{y1:.6f}\n")
                        f.write(" 30\n0.0\n")
                        f.write(f" 11\n{x2:.6f}\n")
                        f.write(f" 21\n{y2:.6f}\n")
                        f.write(" 31\n0.0\n")
                f.write("  0\nENDSEC\n  0\nEOF\n")
            return True

        else:
            print(f"[ERROR] Unsupported export format: {format_type}")
            return False

    except Exception as err:
        print(f"[ERROR] export_cad_file failed for format {format_type}:", err)
        return False


def import_step_file(filepath):
    """Import a STEP file and return the shape."""
    if not HAS_OCC or not HAS_STEP:
        return None
    try:
        reader = STEPControl_Reader()
        reader.ReadFile(filepath)
        reader.TransferRoot()
        return reader.Shape()
    except Exception as e:
        print(f"[ERROR] import_step_file failed: {e}")
        return None


def check_interferences(components_data):
    """
    Detects physical overlaps between assembly components using OCC Boolean operations.
    Returns a list of interferences with component IDs, volume, and mesh data.
    """
    if not HAS_OCC:
        return []

    interferences = []
    import math

    from .geometry_service import build_shape_only, _shape_to_mesh

    # 1. Rebuild and transform all component shapes
    transformed_shapes = {}
    for comp in components_data:
        cid = comp.get('id')
        features = comp.get('features', [])
        shape = build_shape_only(features)
        if not shape or shape.IsNull():
            continue

        trans = comp.get('transform', {})
        pos = trans.get('position', [0,0,0])
        rot = trans.get('rotation', [0,0,0])

        trsf = gp_Trsf()
        trsf.SetTranslation(gp_Vec(*pos))

        trsf_x = gp_Trsf(); trsf_x.SetRotation(gp_Ax1(gp_Pnt(0,0,0), gp_Dir(1,0,0)), rot[0])
        trsf_y = gp_Trsf(); trsf_y.SetRotation(gp_Ax1(gp_Pnt(0,0,0), gp_Dir(0,1,0)), rot[1])
        trsf_z = gp_Trsf(); trsf_z.SetRotation(gp_Ax1(gp_Pnt(0,0,0), gp_Dir(0,0,1)), rot[2])

        final_rot = trsf_z.Multiplied(trsf_y).Multiplied(trsf_x)
        trsf.Multiply(final_rot)

        shape = BRepBuilderAPI_Transform(shape, trsf).Shape()
        transformed_shapes[cid] = shape

    # 2. Pairwise intersection check
    ids = list(transformed_shapes.keys())
    for i in range(len(ids)):
        for j in range(i + 1, len(ids)):
            id1 = ids[i]
            id2 = ids[j]
            s1 = transformed_shapes[id1]
            s2 = transformed_shapes[id2]

            try:
                common_tool = BRepAlgoAPI_Common(s1, s2)
                common_tool.Build()
                if common_tool.IsDone():
                    clash_shape = common_tool.Shape()

                    props = GProp_GProps()
                    brepgprop.VolumeProperties(clash_shape, props)
                    volume = props.Mass()

                    if volume > 0.001:
                        mesh = _shape_to_mesh(clash_shape, deflection=0.1)
                        interferences.append({
                            "component_id_1": id1,
                            "component_id_2": id2,
                            "volume": float(volume),
                            "mesh": mesh
                        })
            except Exception as e:
                print(f"[ERROR] Interference check failed for {id1} vs {id2}: {e}")

    return interferences


def build_feature_chain(features: list) -> tuple:
    """
    Incrementally builds a shape by applying features one by one.
    Returns (final_shape, list_of_intermediate_shapes).
    Used by interference detection to get per-component shapes.
    """
    if not HAS_OCC or not features:
        return None, []

    shapes = []
    cumulative_shape = None

    for feat in features:
        if isinstance(feat, dict):
            f_type = feat.get('type', '')
            params = feat.get('parameters', {})
            f_id = feat.get('id', '')
        else:
            f_type = getattr(feat, 'type', '')
            params = getattr(feat, 'parameters', {})
            f_id = getattr(feat, 'id', '')

        if f_type in ('REFERENCE_PLANE', 'REFERENCE_AXIS', 'REFERENCE_POINT'):
            continue

        if f_type == 'SURFACE_CUT' and cumulative_shape is not None:
            try:
                from OCC.Core.TopExp import TopExp_Explorer
                from OCC.Core.TopAbs import TopAbs_FACE
                from OCC.Core.TopoDS import topods
                from OCC.Core.BRepAdaptor import BRepAdaptor_Surface
                from OCC.Core.BRepLProp import BRepLProp_SLProps
                from OCC.Core.gp import gp_Pnt, gp_Dir
                from OCC.Core.BRepPrimAPI import BRepPrimAPI_MakeBox
                from OCC.Core.BRepAlgoAPI import BRepAlgoAPI_Cut, BRepAlgoAPI_Common
                from .geometry_service import build_feature_shape_in_isolation

                tool_id = params.get('tool_feature_id')
                flip = params.get('flip', False)
                tool_feat = next((f for f in features if (f.get('id') if isinstance(f, dict) else getattr(f, 'id', None)) == tool_id), None)
                if tool_feat:
                    tf_type = tool_feat.get('type') if isinstance(tool_feat, dict) else getattr(tool_feat, 'type', '')
                    tf_params = tool_feat.get('parameters', {}) if isinstance(tool_feat, dict) else getattr(tool_feat, 'parameters', {})
                    tool_shape = build_feature_shape_in_isolation(tf_type, tf_params, None, features)
                    if tool_shape and not tool_shape.IsNull():
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
                                keep_dir = gp_Dir(-normal.X(), -normal.Y(), -normal.Z())
                                big_size = 100000.0
                                bx = p_ref.X() + keep_dir.X() * big_size * 0.5
                                by = p_ref.Y() + keep_dir.Y() * big_size * 0.5
                                bz = p_ref.Z() + keep_dir.Z() * big_size * 0.5
                                keep_box = BRepPrimAPI_MakeBox(
                                    gp_Pnt(bx - big_size*0.5, by - big_size*0.5, bz - big_size*0.5),
                                    gp_Pnt(bx + big_size*0.5, by + big_size*0.5, bz + big_size*0.5)
                                ).Shape()
                                common = BRepAlgoAPI_Common(cumulative_shape, keep_box)
                                common.Build()
                                if common.IsDone():
                                    result = common.Shape()
                                    if result is not None and not result.IsNull():
                                        cumulative_shape = result
            except Exception as sc_err:
                print(f"[ERROR] SURFACE_CUT in build_feature_chain failed: {sc_err}")
            shapes.append(cumulative_shape)
            continue

        from .geometry_service import build_feature_shape_in_isolation
        feature_shape = build_feature_shape_in_isolation(f_type, params, cumulative_shape, features)

        if feature_shape and not feature_shape.IsNull():
            if cumulative_shape is None:
                cumulative_shape = feature_shape
            else:
                operation = params.get('operation', 'ADD') if isinstance(params, dict) else 'ADD'
                if operation == 'REMOVE' or f_type in ('EXTRUDE_CUT', 'REVOLVE_CUT'):
                    try:
                        cutter = BRepAlgoAPI_Cut(cumulative_shape, feature_shape)
                        cutter.Build()
                        if cutter.IsDone():
                            cumulative_shape = cutter.Shape()
                        else:
                            shapes.append(cumulative_shape)
                            continue
                    except Exception:
                        shapes.append(cumulative_shape)
                        continue
                else:
                    try:
                        fused = BRepAlgoAPI_Fuse(cumulative_shape, feature_shape)
                        fused.Build()
                        if fused.IsDone():
                            cumulative_shape = fused.Shape()
                        else:
                            shapes.append(cumulative_shape)
                            continue
                    except Exception:
                        shapes.append(cumulative_shape)
                        continue

            shapes.append(cumulative_shape)

    return cumulative_shape, shapes


def analyze_topology(shape, subshape_id):
    """
    Analyzes a specific subshape (face/edge) to extract geometric properties
    useful for smart mating (e.g., hole radius, axis orientation).
    """
    if not HAS_OCC:
        return {"type": "UNKNOWN"}

    try:
        explorer = TopExp_Explorer(shape, TopAbs_FACE)
        while explorer.More():
            s = explorer.Current()
            if str(hash(s.TShape().this)) == subshape_id:
                adaptor = BRepAdaptor_Surface(s)
                if adaptor.GetType() == GeomAbs_Cylinder:
                    cyl = adaptor.Cylinder()
                    pos = cyl.Location()
                    axis = cyl.Axis().Direction()
                    return {
                        "type": "CYLINDRICAL_FACE",
                        "radius": cyl.Radius(),
                        "center": [pos.X(), pos.Y(), pos.Z()],
                        "axis": [axis.X(), axis.Y(), axis.Z()]
                    }
                return {"type": "OTHER_FACE"}
            explorer.Next()

        explorer = TopExp_Explorer(shape, TopAbs_EDGE)
        while explorer.More():
            s = explorer.Current()
            if str(hash(s.TShape().this)) == subshape_id:
                adaptor = BRepAdaptor_Curve(s)
                if adaptor.GetType() == GeomAbs_Circle:
                    circ = adaptor.Circle()
                    pos = circ.Location()
                    axis = circ.Axis().Direction()
                    return {
                        "type": "CIRCULAR_EDGE",
                        "radius": circ.Radius(),
                        "center": [pos.X(), pos.Y(), pos.Z()],
                        "axis": [axis.X(), axis.Y(), axis.Z()]
                    }
                return {"type": "OTHER_EDGE"}
            explorer.Next()

    except Exception as e:
        print(f"[ERROR] analyze_topology failed: {e}")

    return {"type": "UNKNOWN"}


def export_assembly_step(components_data, filepath):
    """
    Exports a multi-body assembly to a single STEP file using TopoDS_Compound.
    components_data is a list of dicts with 'id', 'features', and 'transform' (position, rotation).
    """
    if not HAS_OCC:
        return False

    if not HAS_XCAF or XCAFApp_Application is None:
        print("[WARNING] XCAF not available, assembly STEP export disabled")
        return False

    try:
        from .geometry_service import build_shape_only

        app = XCAFApp_Application.GetApplication()
        doc = TDocStd_Document(TCollection_ExtendedString("MDTV-XCAF"))
        app.NewDocument(TCollection_ExtendedString("MDTV-XCAF"), doc)

        shape_tool = XCAFDoc_DocumentTool.ShapeTool(doc.Main())
        color_tool = XCAFDoc_DocumentTool.ColorTool(doc.Main())

        assembly_label = shape_tool.NewShape()
        TDataStd_Name.Set(assembly_label, TCollection_ExtendedString("Assembly"))

        for idx, comp in enumerate(components_data):
            features = comp.get('features', [])
            transform = comp.get('transform', {})
            name = comp.get('name', f"Part_{idx+1}")
            color_hex = comp.get('color', "#60A5FA")

            shape = build_shape_only(features)
            if shape and not shape.IsNull():
                part_label = shape_tool.AddShape(shape, False)
                TDataStd_Name.Set(part_label, TCollection_ExtendedString(f"{name}_Def"))

                try:
                    color_hex = color_hex.lstrip('#')
                    if len(color_hex) == 6:
                        r = int(color_hex[0:2], 16) / 255.0
                        g = int(color_hex[2:4], 16) / 255.0
                        b = int(color_hex[4:6], 16) / 255.0
                        q_color = Quantity_Color(r, g, b, Quantity_TOC_RGB)
                        color_tool.SetColor(part_label, q_color, XCAFDoc_ColorGen)
                        color_tool.SetColor(part_label, q_color, XCAFDoc_ColorSurf)
                except Exception as e:
                    print(f"Color parsing failed for {color_hex}: {e}")

                pos = transform.get('position', [0.0, 0.0, 0.0])
                rot = transform.get('rotation', [0.0, 0.0, 0.0])

                trsf = gp_Trsf()

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

                loc = TopLoc_Location(final_trsf)
                inst_label = shape_tool.AddComponent(assembly_label, part_label, loc)
                TDataStd_Name.Set(inst_label, TCollection_ExtendedString(name))

        writer = STEPCAFControl_Writer()
        writer.Transfer(doc)
        status = writer.Write(filepath)
        return status == 1
    except Exception as e:
        import traceback
        traceback.print_exc()
        print("[ERROR] export_assembly_step failed:", e)
        return False


def detect_interference(component_shapes):
    """Legacy interference detection (early version)."""
    if not HAS_OCC:
        return []
    interferences = []
    ids = list(component_shapes.keys())
    for i in range(len(ids)):
        for j in range(i + 1, len(ids)):
            s1 = component_shapes[ids[i]]
            s2 = component_shapes[ids[j]]
            try:
                common = BRepAlgoAPI_Common(s1, s2)
                common.Build()
                if common.IsDone():
                    clash = common.Shape()
                    props = GProp_GProps()
                    brepgprop.VolumeProperties(clash, props)
                    if props.Mass() > 0.001:
                        interferences.append({"components": [ids[i], ids[j]], "volume": props.Mass()})
            except Exception:
                pass
    return interferences
