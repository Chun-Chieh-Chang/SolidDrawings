"""
Mock geometry module — fallback mesh generators for non-OCC environments.
Extracted from geometry_service.py for modularity.
"""

import math


def make_mock_box_mesh(w, h, d, x=0, y=0, z=0):
    vertices = [
        x, y, z,          # 0
        x+w, y, z,        # 1
        x+w, y+h, z,      # 2
        x, y+h, z,        # 3
        x, y, z+d,        # 4
        x+w, y, z+d,      # 5
        x+w, y+h, z+d,    # 6
        x, y+h, z+d       # 7
    ]
    indices = [
        # Front
        0, 2, 1,  0, 3, 2,
        # Back
        4, 5, 6,  4, 6, 7,
        # Left
        0, 7, 3,  0, 4, 7,
        # Right
        1, 2, 6,  1, 6, 5,
        # Top
        3, 6, 2,  3, 7, 6,
        # Bottom
        0, 1, 5,  0, 5, 4
    ]
    return {"vertices": vertices, "indices": indices, "normals": []}


def make_mock_cylinder_mesh(r, h, x=0, y=0, z=0):
    segments = 32
    vertices = []
    indices = []

    # Bottom cap (z)
    for i in range(segments):
        theta = (i / segments) * 2.0 * math.pi
        vertices.extend([x + r * math.cos(theta), y + r * math.sin(theta), z])
    # Top cap (z+h)
    for i in range(segments):
        theta = (i / segments) * 2.0 * math.pi
        vertices.extend([x + r * math.cos(theta), y + r * math.sin(theta), z + h])

    v_bot_center = 2 * segments
    v_top_center = 2 * segments + 1
    vertices.extend([x, y, z])
    vertices.extend([x, y, z + h])

    for i in range(segments):
        curr = i
        nxt = (i + 1) % segments
        indices.extend([v_bot_center, nxt, curr])

    for i in range(segments):
        curr = segments + i
        nxt = segments + (i + 1) % segments
        indices.extend([v_top_center, curr, nxt])

    for i in range(segments):
        b_curr = i
        b_nxt = (i + 1) % segments
        t_curr = segments + i
        t_nxt = segments + (i + 1) % segments
        indices.extend([b_curr, t_curr, b_nxt])
        indices.extend([b_nxt, t_curr, t_nxt])

    return {"vertices": vertices, "indices": indices, "normals": []}


def make_mock_sphere_mesh(r, x=0, y=0, z=0):
    rings = 16
    segments = 32
    vertices = []
    indices = []

    for ring in range(rings + 1):
        phi = (ring / rings) * math.pi
        sin_phi = math.sin(phi)
        cos_phi = math.cos(phi)
        for seg in range(segments + 1):
            theta = (seg / segments) * 2.0 * math.pi
            vx = x + r * sin_phi * math.cos(theta)
            vy = y + r * sin_phi * math.sin(theta)
            vz = z + r * cos_phi
            vertices.extend([vx, vy, vz])

    for ring in range(rings):
        for seg in range(segments):
            v00 = ring * (segments + 1) + seg
            v01 = ring * (segments + 1) + seg + 1
            v10 = (ring + 1) * (segments + 1) + seg
            v11 = (ring + 1) * (segments + 1) + seg + 1
            indices.extend([v00, v10, v01])
            indices.extend([v01, v10, v11])

    return {"vertices": vertices, "indices": indices, "normals": []}


def make_mock_revolve_mesh(points_2d, angle_deg=360.0):
    angle_rad = angle_deg * math.pi / 180.0
    steps = 32
    vertices = []
    indices = []

    M = len(points_2d)
    for s in range(steps + 1):
        theta = s * angle_rad / steps
        cos_t = math.cos(theta)
        sin_t = math.sin(theta)
        for p in range(M):
            u = float(points_2d[p][0])
            v = float(points_2d[p][1])
            x = u * cos_t
            y = v
            z = u * sin_t
            vertices.extend([x, y, z])

    for s in range(steps):
        for p in range(M - 1):
            v00 = s * M + p
            v01 = s * M + p + 1
            v10 = (s + 1) * M + p
            v11 = (s + 1) * M + p + 1
            indices.extend([v00, v10, v01])
            indices.extend([v01, v10, v11])

    return {"vertices": vertices, "indices": indices, "normals": []}


def make_mock_aviv_mesh(W=100.0, D=80.0, H=20.0, R=33.4, F=5.0):
    cx = W/2.0 - F
    cz = D/2.0 - F

    outer_points = []
    # Corner 1: top-right (+X, +Z)
    for i in range(8):
        theta = (i / 7.0) * (math.pi / 2.0)
        outer_points.append([cx + F * math.cos(theta), cz + F * math.sin(theta)])
    # Corner 2: top-left (-X, +Z)
    for i in range(8):
        theta = math.pi / 2.0 + (i / 7.0) * (math.pi / 2.0)
        outer_points.append([-cx + F * math.cos(theta), cz + F * math.sin(theta)])
    # Corner 3: bottom-left (-X, -Z)
    for i in range(8):
        theta = math.pi + (i / 7.0) * (math.pi / 2.0)
        outer_points.append([-cx + F * math.cos(theta), -cz + F * math.sin(theta)])
    # Corner 4: bottom-right (+X, -Z)
    for i in range(8):
        theta = 1.5 * math.pi + (i / 7.0) * (math.pi / 2.0)
        outer_points.append([cx + F * math.cos(theta), -cz + F * math.sin(theta)])

    inner_points = []
    for i in range(32):
        theta = (i / 32.0) * 2.0 * math.pi
        inner_points.append([R * math.cos(theta), R * math.sin(theta)])

    vertices = []
    indices = []

    # 0 to 31: bottom outer (Y=0)
    # 32 to 63: bottom inner (Y=0)
    # 64 to 95: top outer (Y=H)
    # 96 to 127: top inner (Y=H)
    for p in outer_points:
        vertices.extend([p[0], 0.0, p[1]])
    for p in inner_points:
        vertices.extend([p[0], 0.0, p[1]])
    for p in outer_points:
        vertices.extend([p[0], H, p[1]])
    for p in inner_points:
        vertices.extend([p[0], H, p[1]])

    # Top face
    for i in range(32):
        o_curr = 64 + i
        o_next = 64 + (i + 1) % 32
        aria = 96 + i
        a_next = 96 + (i + 1) % 32
        indices.extend([o_curr, o_next, aria])
        indices.extend([aria, o_next, a_next])

    # Bottom face
    for i in range(32):
        o_curr = i
        o_next = (i + 1) % 32
        aria = 32 + i
        a_next = 32 + (i + 1) % 32
        indices.extend([o_curr, aria, o_next])
        indices.extend([aria, a_next, o_next])

    # Outer side walls
    for i in range(32):
        b_curr = i
        b_next = (i + 1) % 32
        t_curr = 64 + i
        t_next = 64 + (i + 1) % 32
        indices.extend([b_curr, t_curr, b_next])
        indices.extend([b_next, t_curr, t_next])

    # Inner cylinder wall
    for i in range(32):
        b_curr = 32 + i
        b_next = 32 + (i + 1) % 32
        t_curr = 96 + i
        t_next = 96 + (i + 1) % 32
        indices.extend([b_curr, b_next, t_curr])
        indices.extend([b_next, t_next, t_curr])

    return {"vertices": vertices, "indices": indices, "normals": []}


def generate_mock_mesh(features):
    W, D, H, R, F = 100.0, 80.0, 20.0, 33.4, 5.0
    has_extrude = False
    has_cut = False

    for feat in features:
        f_type = feat.get('type') if isinstance(feat, dict) else getattr(feat, 'type', None)
        params = feat.get('parameters', {}) if isinstance(feat, dict) else getattr(feat, 'parameters', {})
        if f_type == 'EXTRUDE' or f_type == 'BOX':
            has_extrude = True
            points = params.get('points', [])
            if points and isinstance(points[0], list) and len(points[0]) > 0 and isinstance(points[0][0], list):
                points = points[0]
            if len(points) >= 4:
                us = [float(pt[0]) for pt in points]
                vs = [float(pt[1]) for pt in points]
                width = max(us) - min(us)
                height = max(vs) - min(vs)
                if width > 0: W = width
                if height > 0: D = height
            H = float(params.get('depth', 20.0))
        elif (f_type == 'CYLINDER' or f_type == 'EXTRUDE') and params.get('operation') == 'CUT':
            has_cut = True
            points = params.get('points', [])
            if points and isinstance(points[0], list) and len(points[0]) > 0 and isinstance(points[0][0], list):
                points = points[0]
            if len(points) >= 2:
                us = [float(pt[0]) for pt in points]
                radius = (max(us) - min(us)) / 2.0
                if radius > 0: R = radius
            else:
                R = float(params.get('radius', 33.4))
        elif f_type == 'FILLET':
            F = float(params.get('radius', 5.0))

    if has_extrude and has_cut:
        return make_mock_aviv_mesh(W, D, H, R, F)

    for feat in features:
        f_type = feat.get('type') if isinstance(feat, dict) else getattr(feat, 'type', None)
        params = feat.get('parameters', {}) if isinstance(feat, dict) else getattr(feat, 'parameters', {})
        if f_type == 'REVOLVE':
            points = params.get('points', [])
            if points and isinstance(points[0], list) and len(points[0]) > 0 and isinstance(points[0][0], list):
                points = points[0]
            angle = float(params.get('angle', 360.0))
            return make_mock_revolve_mesh(points, angle)
        elif f_type == 'BOX':
            w = float(params.get('width', 10.0))
            h = float(params.get('height', 10.0))
            d = float(params.get('depth', 10.0))
            x = float(params.get('x', 0.0))
            y = float(params.get('y', 0.0))
            z = float(params.get('z', 0.0))
            return make_mock_box_mesh(w, h, d, x, y, z)
        elif f_type == 'CYLINDER':
            r = float(params.get('radius', 5.0))
            h = float(params.get('height', 10.0))
            x = float(params.get('x', 0.0))
            y = float(params.get('y', 0.0))
            z = float(params.get('z', 0.0))
            return make_mock_cylinder_mesh(r, h, x, y, z)
        elif f_type == 'SPHERE':
            r = float(params.get('radius', 5.0))
            x = float(params.get('x', 0.0))
            y = float(params.get('y', 0.0))
            z = float(params.get('z', 0.0))
            return make_mock_sphere_mesh(r, x, y, z)

        elif f_type == 'EDGE_FLANGE':
            flange_h = float(params.get('flange_height', 10.0))
            thickness = float(params.get('thickness', 1.0))
            return make_mock_box_mesh(W + thickness, D + flange_h, H, -10, -10, -10)
    return make_mock_box_mesh(20, 20, 20, -10, -10, -10)
