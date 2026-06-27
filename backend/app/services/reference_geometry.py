"""
Reference geometry module — planes, axes, points, coordinate systems.
Extracted from geometry_service.py for modularity.
"""

import math

# Global flags
HAS_OCC = False

try:
    from OCC.Core.gp import gp_Pnt, gp_Dir, gp_Ax2
    from OCC.Core.BRepBuilderAPI import BRepBuilderAPI_MakeEdge, BRepBuilderAPI_MakeWire, BRepBuilderAPI_MakeFace
    from OCC.Core.BRepPrimAPI import BRepPrimAPI_MakeBox, BRepPrimAPI_MakePrism
    from OCC.Core.BRepAlgoAPI import BRepAlgoAPI_Common, BRepAlgoAPI_Cut
    from OCC.Core.BRepAdaptor import BRepAdaptor_Surface
    from OCC.Core.GeomAbs import GeomAbs_Cylinder, GeomAbs_Plane
    from OCC.Core.TopExp import TopExp_Explorer
    from OCC.Core.TopAbs import TopAbs_FACE, TopAbs_REVERSED
    from OCC.Core.TopoDS import topods
    from OCC.Core.BRep import BRep_Tool
    from OCC.Core.GProp import GProp_GProps
    from OCC.Core.BRepGProp import brepgprop
    HAS_OCC = True
except ImportError:
    HAS_OCC = False


def generate_reference_plane(plane_type, refs, offset=0.0, features=[], angle=0.0):
    """
    Computes a custom reference plane from topology references.
    Returns: { "origin": [x,y,z], "normal": [x,y,z], "xDir": [x,y,z], "yDir": [x,y,z] }
    """
    origin = [0.0, 0.0, 0.0]
    normal = [0.0, 0.0, 1.0]

    try:
        if plane_type == 'OFFSET' and len(refs) > 0:
            ref = refs[0]
            coords = ref.get('coordinates', [0.0, 0.0, 0.0])
            norm = ref.get('normal', [0.0, 0.0, 1.0])
            n_len = math.sqrt(norm[0]**2 + norm[1]**2 + norm[2]**2)
            unorm = [norm[0]/n_len, norm[1]/n_len, norm[2]/n_len] if n_len > 1e-6 else [0.0, 0.0, 1.0]
            origin = [coords[0] + offset * unorm[0], coords[1] + offset * unorm[1], coords[2] + offset * unorm[2]]
            normal = unorm

        elif plane_type == 'ANGLE' and len(refs) >= 2:
            axis_ref = refs[0]
            plane_ref = refs[1]
            angle_rad = math.radians(angle)

            # 1. Get axis vector (u)
            if axis_ref.get('type') == 'EDGE' and 'edgeData' in axis_ref:
                e = axis_ref['edgeData']
                origin = e['start']
                ux, uy, uz = e['end'][0]-e['start'][0], e['end'][1]-e['start'][1], e['end'][2]-e['start'][2]
                u_len = math.sqrt(ux*ux + uy*uy + uz*uz)
                if u_len > 1e-9:
                    ux, uy, uz = ux/u_len, uy/u_len, uz/u_len
                else:
                    ux, uy, uz = 0.0, 0.0, 1.0
            else:
                origin = [0,0,0]
                ux, uy, uz = 0,0,1

            # 2. Get reference normal (v)
            v = plane_ref.get('normal', [0,0,1])
            vx, vy, vz = v[0], v[1], v[2]

            # 3. Rodrigues' rotation formula: v_rot = v*cos + (u x v)*sin + u*(u . v)*(1 - cos)
            cos_t = math.cos(angle_rad)
            sin_t = math.sin(angle_rad)
            dot = ux*vx + uy*vy + uz*vz
            cross_x = uy*vz - uz*vy
            cross_y = uz*vx - ux*vz
            cross_z = ux*vy - uy*vx

            nx = vx*cos_t + cross_x*sin_t + ux*dot*(1 - cos_t)
            ny = vy*cos_t + cross_y*sin_t + uy*dot*(1 - cos_t)
            nz = vz*cos_t + cross_z*sin_t + uz*dot*(1 - cos_t)

            normal = [nx, ny, nz]

        elif plane_type == 'THREE_POINTS' and len(refs) >= 3:
            p1 = refs[0].get('coordinates', [0.0, 0.0, 0.0])
            p2 = refs[1].get('coordinates', [0.0, 0.0, 0.0])
            p3 = refs[2].get('coordinates', [0.0, 0.0, 0.0])
            origin = p1
            v1 = [p2[0]-p1[0], p2[1]-p1[1], p2[2]-p1[2]]
            v2 = [p3[0]-p1[0], p3[1]-p1[1], p3[2]-p1[2]]
            nx = v1[1]*v2[2] - v1[2]*v2[1]
            ny = v1[2]*v2[0] - v1[0]*v2[2]
            nz = v1[0]*v2[1] - v1[1]*v2[0]
            n_len = math.sqrt(nx**2 + ny**2 + nz**2)
            normal = [nx/n_len, ny/n_len, nz/n_len] if n_len > 1e-6 else [0.0, 0.0, 1.0]

        elif (plane_type == 'POINT_LINE' or plane_type == 'POINT_NORMAL') and len(refs) >= 2:
            p = refs[0].get('coordinates', [0.0, 0.0, 0.0])
            ref2 = refs[1]
            origin = p
            if ref2.get('type') == 'EDGE' and 'edgeData' in ref2:
                e = ref2['edgeData']
                v1 = [e['end'][0]-e['start'][0], e['end'][1]-e['start'][1], e['end'][2]-e['start'][2]]
                v2 = [p[0]-e['start'][0], p[1]-e['start'][1], p[2]-e['start'][2]]
                nx = v1[1]*v2[2] - v1[2]*v2[1]
                ny = v1[2]*v2[0] - v1[0]*v2[2]
                nz = v1[0]*v2[1] - v1[1]*v2[0]
            else:
                norm_dir = ref2.get('normal', [0.0, 0.0, 1.0])
                nx, ny, nz = norm_dir[0], norm_dir[1], norm_dir[2]
            n_len = math.sqrt(nx**2 + ny**2 + nz**2)
            normal = [nx/n_len, ny/n_len, nz/n_len] if n_len > 1e-6 else [0.0, 0.0, 1.0]

        elif plane_type == 'PARALLEL_AT_POINT' and len(refs) >= 2:
            ref_plane = refs[0]
            ref_point = refs[1]
            origin = ref_point.get('coordinates', [0.0, 0.0, 0.0])
            normal = ref_plane.get('normal', [0.0, 0.0, 1.0])

        elif plane_type == 'TWO_LINES' and len(refs) >= 2:
            e1 = refs[0].get('edgeData', {})
            e2 = refs[1].get('edgeData', {})
            if e1 and e2:
                v1 = [e1['end'][0]-e1['start'][0], e1['end'][1]-e1['start'][1], e1['end'][2]-e1['start'][2]]
                v2 = [e2['end'][0]-e2['start'][0], e2['end'][1]-e2['start'][1], e2['end'][2]-e2['start'][2]]
                nx = v1[1]*v2[2] - v1[2]*v2[1]
                ny = v1[2]*v2[0] - v1[0]*v2[2]
                nz = v1[0]*v2[1] - v1[1]*v2[0]
                n_len = math.sqrt(nx**2 + ny**2 + nz**2)
                normal = [nx/n_len, ny/n_len, nz/n_len] if n_len > 1e-6 else [0.0, 0.0, 1.0]
                origin = e1['start']

        nx, ny, nz = normal[0], normal[1], normal[2]
        if abs(nx) < 1e-5 and abs(ny) < 1e-5:
            xx, xy, xz = 1.0, 0.0, 0.0
        else:
            xx, xy, xz = -ny, nx, 0.0
            x_len = math.sqrt(xx**2 + xy**2)
            xx, xy = xx/x_len, xy/x_len
        yx, yy, yz = ny*xz - nz*xy, nz*xx - nx*xz, nx*xy - ny*xx
        y_len = math.sqrt(yx**2 + yy**2 + yz**2)
        if y_len > 1e-6:
            yx, yy, yz = yx/y_len, yy/y_len, yz/y_len
        else:
            yx, yy, yz = 0.0, 1.0, 0.0

        return { "origin": origin, "normal": normal, "xDir": [xx, xy, xz], "yDir": [yx, yy, yz] }
    except Exception as e:
        print("[ERROR] generate_reference_plane failed:", e)
        return { "origin": origin, "normal": normal, "xDir": [1.0, 0.0, 0.0], "yDir": [0.0, 1.0, 0.0] }


def generate_reference_axis(axis_type, refs, features=[]):
    """
    Computes a custom reference axis from topology references.
    Returns: { "origin": [x,y,z], "direction": [x,y,z] }
    """
    origin = [0.0, 0.0, 0.0]
    direction = [0.0, 0.0, 1.0]

    try:
        if axis_type == 'TWO_POINTS' and len(refs) >= 2:
            p1 = refs[0].get('coordinates', [0.0, 0.0, 0.0])
            p2 = refs[1].get('coordinates', [0.0, 0.0, 0.0])
            origin = p1
            dx = p2[0] - p1[0]
            dy = p2[1] - p1[1]
            dz = p2[2] - p1[2]
            d_len = math.sqrt(dx**2 + dy**2 + dz**2)
            if d_len > 1e-6:
                direction = [dx/d_len, dy/d_len, dz/d_len]

        elif axis_type == 'CYLINDER_AXIS' and len(refs) > 0 and HAS_OCC:
            ref = refs[0]
            coords = ref.get('coordinates', [0.0, 0.0, 0.0])
            # Lazy import to avoid circular dependency
            from .geometry_service import build_shape_only, find_closest_face

            shape = build_shape_only(features)
            if shape and not shape.IsNull():
                face = find_closest_face(shape, coords)
                if face:
                    surf = BRepAdaptor_Surface(face)
                    if surf.GetType() == GeomAbs_Cylinder:
                        cyl = surf.Cylinder()
                        axis = cyl.Axis()
                        loc = axis.Location()
                        direc = axis.Direction()
                        return {
                            "origin": [loc.X(), loc.Y(), loc.Z()],
                            "direction": [direc.X(), direc.Y(), direc.Z()]
                        }
            # Fallback using normal as direction if no shape or not cylinder
            origin = coords
            norm = ref.get('normal', [0.0, 0.0, 1.0])
            n_len = math.sqrt(norm[0]**2 + norm[1]**2 + norm[2]**2)
            if n_len > 1e-6:
                direction = [norm[0]/n_len, norm[1]/n_len, norm[2]/n_len]

        elif axis_type == 'PLANE_INTERSECTION' and len(refs) >= 2:
            p1 = refs[0].get('coordinates', [0.0, 0.0, 0.0])
            n1 = refs[0].get('normal', [0.0, 0.0, 1.0])
            p2 = refs[1].get('coordinates', [0.0, 0.0, 0.0])
            n2 = refs[1].get('normal', [0.0, 1.0, 0.0])

            dx = n1[1]*n2[2] - n1[2]*n2[1]
            dy = n1[2]*n2[0] - n1[0]*n2[2]
            dz = n1[0]*n2[1] - n1[1]*n2[0]

            d_len = math.sqrt(dx**2 + dy**2 + dz**2)
            if d_len > 1e-6:
                direction = [dx/d_len, dy/d_len, dz/d_len]
                origin = [
                    (p1[0] + p2[0])/2.0,
                    (p1[1] + p2[1])/2.0,
                    (p1[2] + p2[2])/2.0
                ]
            else:
                origin = p1

        return {
            "origin": origin,
            "direction": direction
        }
    except Exception as e:
        print("[ERROR] generate_reference_axis failed:", e)
        return {
            "origin": origin,
            "direction": direction
        }


def generate_reference_point(point_type, refs, offset=0.0, features=[]):
    """
    Computes a custom reference point from topology references.
    Returns: { "origin": [x,y,z] }
    """
    origin = [0.0, 0.0, 0.0]

    try:
        if point_type == 'FACE_CENTER' and len(refs) > 0:
            ref = refs[0]
            origin = ref.get('coordinates', [0.0, 0.0, 0.0])
        elif point_type == 'OFFSET' and len(refs) > 0:
            ref = refs[0]
            base_coord = ref.get('coordinates', [0.0, 0.0, 0.0])
            norm = ref.get('normal', [0.0, 0.0, 1.0])
            n_len = math.sqrt(norm[0]**2 + norm[1]**2 + norm[2]**2)
            unorm = [norm[0]/n_len, norm[1]/n_len, norm[2]/n_len] if n_len > 1e-6 else [0.0, 0.0, 1.0]
            origin = [
                base_coord[0] + offset * unorm[0],
                base_coord[1] + offset * unorm[1],
                base_coord[2] + offset * unorm[2]
            ]
        elif point_type == 'INTERSECTION' and len(refs) >= 2:
            p1 = refs[0].get('coordinates', [0.0, 0.0, 0.0])
            p2 = refs[1].get('coordinates', [0.0, 0.0, 0.0])
            origin = [(p1[0]+p2[0])/2, (p1[1]+p2[1])/2, (p1[2]+p2[2])/2]

        return { "origin": origin }
    except Exception as e:
        print("[ERROR] generate_reference_point failed:", e)
        return { "origin": origin }


def generate_reference_coordinate_system(coord_system_type, refs, offsets=None, origin=None, x_axis=None, y_axis=None, features=[]):
    """
    Computes a reference coordinate system from topology references.
    Returns: { "origin": [x,y,z], "xAxis": [x,y,z], "yAxis": [x,y,z], "zAxis": [x,y,z] }
    """
    result = {
        "origin": origin or [0.0, 0.0, 0.0],
        "xAxis": x_axis or [1.0, 0.0, 0.0],
        "yAxis": y_axis or [0.0, 1.0, 0.0],
        "zAxis": [0.0, 0.0, 1.0],
    }

    try:
        if coord_system_type == 'planes' and len(refs) >= 3:
            p1 = refs[0].get('coordinates', [0.0, 0.0, 0.0])
            result['origin'] = list(p1)
            p2 = refs[1].get('coordinates', [0.0, 0.0, 0.0])
            x_dir = [p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]]
            x_len = math.sqrt(x_dir[0]**2 + x_dir[1]**2 + x_dir[2]**2)
            if x_len > 1e-6:
                result['xAxis'] = [x_dir[0]/x_len, x_dir[1]/x_len, x_dir[2]/x_len]
            p3 = refs[2].get('coordinates', [0.0, 0.0, 0.0])
            nx = result['xAxis']
            v3 = [p3[0] - p1[0], p3[1] - p1[1], p3[2] - p1[2]]
            y_cross = [
                v3[1] * nx[2] - v3[2] * nx[1],
                v3[2] * nx[0] - v3[0] * nx[2],
                v3[0] * nx[1] - v3[1] * nx[0]
            ]
            y_len = math.sqrt(y_cross[0]**2 + y_cross[1]**2 + y_cross[2]**2)
            if y_len > 1e-6:
                result['yAxis'] = [y_cross[0]/y_len, y_cross[1]/y_len, y_cross[2]/y_len]
            else:
                result['yAxis'] = [0.0, 1.0, 0.0]
            result['zAxis'] = [
                nx[1] * result['yAxis'][2] - nx[2] * result['yAxis'][1],
                nx[2] * result['yAxis'][0] - nx[0] * result['yAxis'][2],
                nx[0] * result['yAxis'][1] - nx[1] * result['yAxis'][0]
            ]

        elif coord_system_type == 'axes' and len(refs) >= 2:
            a1 = refs[0]
            a2 = refs[1]
            result['origin'] = list(a1.get('coordinates', [0.0, 0.0, 0.0]))
            result['xAxis'] = list(a1.get('direction', [1.0, 0.0, 0.0]))
            result['yAxis'] = list(a2.get('direction', [0.0, 1.0, 0.0]))
            nx = result['xAxis']
            ny = result['yAxis']
            result['zAxis'] = [
                nx[1] * ny[2] - nx[2] * ny[1],
                nx[2] * ny[0] - nx[0] * ny[2],
                nx[0] * ny[1] - nx[1] * ny[0]
            ]

        elif coord_system_type == 'points' and len(refs) >= 3:
            p1 = refs[0].get('coordinates', [0.0, 0.0, 0.0])
            p2 = refs[1].get('coordinates', [0.0, 0.0, 0.0])
            p3 = refs[2].get('coordinates', [0.0, 0.0, 0.0])
            result['origin'] = list(p1)
            x_dir = [p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]]
            x_len = math.sqrt(x_dir[0]**2 + x_dir[1]**2 + x_dir[2]**2)
            if x_len > 1e-6:
                result['xAxis'] = [x_dir[0]/x_len, x_dir[1]/x_len, x_dir[2]/x_len]
            v3 = [p3[0] - p1[0], p3[1] - p1[1], p3[2] - p1[2]]
            nx = result['xAxis']
            y_cross = [
                v3[1] * nx[2] - v3[2] * nx[1],
                v3[2] * nx[0] - v3[0] * nx[2],
                v3[0] * nx[1] - v3[1] * nx[0]
            ]
            y_len = math.sqrt(y_cross[0]**2 + y_cross[1]**2 + y_cross[2]**2)
            if y_len > 1e-6:
                result['yAxis'] = [y_cross[0]/y_len, y_cross[1]/y_len, y_cross[2]/y_len]
            else:
                result['yAxis'] = [0.0, 1.0, 0.0]
            result['zAxis'] = [
                nx[1] * result['yAxis'][2] - nx[2] * result['yAxis'][1],
                nx[2] * result['yAxis'][0] - nx[0] * result['yAxis'][2],
                nx[0] * result['yAxis'][1] - nx[1] * result['yAxis'][0]
            ]

        if offsets:
            ox = offsets.get('x', 0)
            oy = offsets.get('y', 0)
            oz = offsets.get('z', 0)
            result['origin'] = [
                result['origin'][0] + ox,
                result['origin'][1] + oy,
                result['origin'][2] + oz
            ]

        return result
    except Exception as e:
        print("[ERROR] generate_reference_coordinate_system failed:", e)
        return result
