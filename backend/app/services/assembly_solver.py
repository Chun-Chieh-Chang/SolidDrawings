import numpy as np
from scipy.optimize import least_squares
import math
import json


def _angle_diff(current: float, initial: float) -> float:
    """Compute signed angle difference handling 360 wrap-around."""
    diff = current - initial
    while diff > math.pi:
        diff -= 2 * math.pi
    while diff < -math.pi:
        diff += 2 * math.pi
    return diff


def solve_assembly_mates(components_dict, mates_list):
    """
    3D Rigid Body Constraint Solver for Assemblies.
    """
    comp_ids = sorted(components_dict.keys())
    # Component status check
    variable_comps = [cid for cid in comp_ids if not components_dict[cid].get('isFixed', False)]
    comp_to_idx = {cid: i for i, cid in enumerate(variable_comps)}
    
    x0 = []
    for cid in variable_comps:
        c = components_dict[cid]
        t = c.get('transform', {})
        pos = t.get('position', [0, 0, 0])
        rot = t.get('rotation', [0, 0, 0])
        x0.extend(pos)
        x0.extend(rot)
    
    x0 = np.array(x0, dtype=float)
    if len(x0) == 0:
        return components_dict, {"status": "ALL_FIXED", "residual": 0}

    def get_rotation_matrix(rx, ry, rz):
        cx, sx = math.cos(rx), math.sin(rx)
        cy, sy = math.cos(ry), math.sin(ry)
        cz, sz = math.cos(rz), math.sin(rz)
        return np.array([
            [cy*cz, sz*cy, -sy],
            [cz*sx*sy - sz*cx, sx*sy*sz + cz*cx, cy*sx],
            [cz*cx*sy + sz*sx, cx*sy*sz - cz*sx, cy*cx]
        ])

    def residual_func(x_vars):
        residuals = []
        for m in mates_list:
            m_type = m.get('type')
            ent1 = m.get('entity1', {})
            ent2 = m.get('entity2', {})
            params = m.get('parameters', {})
            offset = float(params.get('offset', 0))
            angle_target = float(params.get('angle', 0))
            
            def get_world_geom(ent):
                cid = ent.get('componentId')
                lo = ent.get('localOrigin', [0,0,0])
                ln = ent.get('localNormal', [0,0,1])
                if cid in comp_to_idx:
                    idx = comp_to_idx[cid]
                    v = x_vars[idx*6 : idx*6+6]
                    R = get_rotation_matrix(*v[3:])
                    w_pos = R @ np.array(lo) + np.array(v[:3])
                    w_norm = R @ np.array(ln)
                else:
                    c = components_dict[cid]
                    pos = c['transform']['position']
                    rot = c['transform']['rotation']
                    R = get_rotation_matrix(*rot)
                    w_pos = R @ np.array(lo) + np.array(pos)
                    w_norm = R @ np.array(ln)
                return w_pos, w_norm

            p1, n1 = get_world_geom(ent1)
            p2, n2 = get_world_geom(ent2)

            # Normalize normals for dot product operations
            n1_mag = np.linalg.norm(n1)
            if n1_mag > 1e-9: n1 /= n1_mag
            n2_mag = np.linalg.norm(n2)
            if n2_mag > 1e-9: n2 /= n2_mag

            align_flip = bool(params.get('alignmentFlip', False))
            sign = -1.0 if align_flip else 1.0

            if m_type == 'COINCIDENT':
                residuals.extend(np.cross(n1, sign * n2))
                residuals.append(np.dot(p2 - p1, n1) - offset)
            elif m_type == 'CONCENTRIC':
                dist_vec = p2 - p1
                residuals.extend(dist_vec - np.dot(dist_vec, n1) * n1)
                residuals.extend(np.cross(n1, n2))
            elif m_type == 'DISTANCE':
                residuals.extend(np.cross(n1, sign * n2)) # Ensure parallelism
                residuals.append(np.dot(p2 - p1, n1) - offset)
            elif m_type == 'PARALLEL':
                residuals.extend(np.cross(n1, sign * n2))
            elif m_type == 'PERPENDICULAR':
                residuals.append(np.dot(n1, n2))
            elif m_type == 'TANGENT':
                residuals.extend(np.cross(n1, n2))
                residuals.append(np.dot(p2 - p1, n1) - offset)
            elif m_type == 'ANGLE':
                is_limit = params.get('isLimitAngle', False)
                if is_limit:
                    min_ang = float(params.get('minAngle', 0))
                    max_ang = float(params.get('maxAngle', 180))
                    current_dot = np.dot(n1, n2) * sign
                    current_angle = math.degrees(math.acos(max(-1.0, min(1.0, current_dot))))
                    
                    if current_angle < min_ang:
                        target_dot = math.cos(math.radians(min_ang))
                        residuals.append(np.dot(n1, n2) - (sign * target_dot))
                    elif current_angle > max_ang:
                        target_dot = math.cos(math.radians(max_ang))
                        residuals.append(np.dot(n1, n2) - (sign * target_dot))
                    else:
                        # Inside limits, no penalty
                        residuals.append(0.0)
                else:
                    # Dot product of normals should equal cos(angle)
                    angle_rad = math.radians(angle_target)
                    target_dot = math.cos(angle_rad)
                    residuals.append(np.dot(n1, n2) - (sign * target_dot))
            elif m_type == 'GEAR':
                # Gear Mate: DeltaTheta_B = -Ratio * DeltaTheta_A
                ratio = float(params.get('ratio', 1.0))
                init_transforms = params.get('initialTransforms', {})
                
                def get_delta_theta(ent):
                    cid = ent.get('componentId')
                    if cid not in components_dict: return 0.0
                    
                    # Current rotation
                    if cid in comp_to_idx:
                        idx = comp_to_idx[cid]
                        curr_rot = x_vars[idx*6+3 : idx*6+6]
                    else:
                        curr_rot = components_dict[cid]['transform']['rotation']
                    
                    # Initial rotation
                    init_t = init_transforms.get(cid, components_dict[cid]['transform'])
                    init_rot = init_t['rotation']
                    
                    dx = _angle_diff(curr_rot[0], init_rot[0])
                    dy = _angle_diff(curr_rot[1], init_rot[1])
                    dz = _angle_diff(curr_rot[2], init_rot[2])
                    axes = [abs(dx), abs(dy), abs(dz)]
                    primary_axis = axes.index(max(axes))
                    deltas = [dx, dy, dz]
                    return deltas[primary_axis]

                dt1 = get_delta_theta(ent1)
                dt2 = get_delta_theta(ent2)
                residuals.append(dt2 - (-ratio * dt1))

            elif m_type == 'SCREW':
                # Screw Mate: DeltaPos = Pitch * DeltaTheta / 2PI
                pitch = float(params.get('pitch', 1.0)) # mm per revolution
                init_transforms = params.get('initialTransforms', {})
                
                cid_a = ent1.get('componentId')
                cid_b = ent2.get('componentId')
                
                # Component A (Rotation)
                if cid_a in comp_to_idx:
                    idx = comp_to_idx[cid_a]
                    curr_rot = x_vars[idx*6+3 : idx*6+6]
                else:
                    curr_rot = components_dict[cid_a]['transform']['rotation']
                init_t_a = init_transforms.get(cid_a, components_dict[cid_a]['transform'])
                dt_a = _angle_diff(curr_rot[0], init_t_a['rotation'][0])
                
                # Component B (Translation)
                if cid_b in comp_to_idx:
                    idx = comp_to_idx[cid_b]
                    curr_pos = x_vars[idx*6 : idx*6+3]
                else:
                    curr_pos = components_dict[cid_b]['transform']['position']
                init_t_b = init_transforms.get(cid_b, components_dict[cid_b]['transform'])
                dp_b = np.sum(np.array(curr_pos) - np.array(init_t_b['position']))
                
                # Linear translation = (Pitch / 2PI) * RotationInRadians
                residuals.append(dp_b - (pitch * dt_a / (2 * math.pi)))

            elif m_type == 'WIDTH':
                # WIDTH mate: centers component symmetrically between two parallel planes
                # Normal of entity2 should align with entity1 normal (parallel constraint)
                residuals.extend(np.cross(n1, sign * n2))
                # Midpoint of the two face positions should align with the component center
                midpoint = (p1 + p2) / 2.0
                width_offset = float(params.get('widthOffset', 0) if params else 0)
                # Constrain the component position to be at the midpoint
                cid2 = ent2.get('componentId')
                if cid2 in comp_to_idx:
                    idx = comp_to_idx[cid2]
                    v = x_vars[idx*6 : idx*6+3]
                    residuals.extend(midpoint - v - width_offset * n1)

            elif m_type == 'SYMMETRY':
                # SYMMETRY mate: mirrors component across a reference plane
                # Compute reflection of entity2 across entity1's plane (or vice versa)
                # Reflection: p_reflected = p2 - 2 * dot(p2 - p1, n1) * n1
                dot_val = np.dot(p2 - p1, n1)
                p_reflected = p2 - 2 * dot_val * n1
                # Reflected normal is negated along the plane normal
                n_reflected = n2 - 2 * np.dot(n2, n1) * n1
                # Coincident between entity1 and reflected entity2
                residuals.append(np.dot(p_reflected - p1, n1))
                residuals.extend(np.cross(n1, n_reflected))

            elif m_type == 'LOCK':
                # LOCK mate: completely locks all 6-DOF between two components
                cid1 = ent1.get('componentId')
                cid2 = ent2.get('componentId')
                if cid1 in comp_to_idx and cid2 in comp_to_idx:
                    idx1 = comp_to_idx[cid1]
                    idx2 = comp_to_idx[cid2]
                    v1 = x_vars[idx1*6 : idx1*6+6]
                    v2 = x_vars[idx2*6 : idx2*6+6]
                    # Zero position difference
                    residuals.extend(v1[:3] - v2[:3])
                    # Zero rotation difference
                    residuals.extend(v1[3:] - v2[3:])

            elif m_type == 'SNAP':
                # SNAP mate: aligns two vertices/edges with optional offset
                snap_offset = params.get('snapOffset', [0, 0, 0]) if params else [0, 0, 0]
                if isinstance(snap_offset, list):
                    snx, sny, snz = float(snap_offset[0]), float(snap_offset[1]), float(snap_offset[2])
                else:
                    snx, sny, snz = 0.0, 0.0, 0.0
                # Align the origins of both entities with the offset
                residuals.extend(p1 - (p2 + np.array([snx, sny, snz])))
        
        # Soft spring
        for i, cid in enumerate(variable_comps):
            orig = components_dict[cid]['transform']
            residuals.extend((x_vars[i*6:i*6+3] - np.array(orig['position'])) * 0.001)
            residuals.extend((x_vars[i*6+3:i*6+6] - np.array(orig['rotation'])) * 0.001)
            
        return np.array(residuals)

    res = least_squares(residual_func, x0, method='lm')
    solved_components = json.loads(json.dumps(components_dict))
    for i, cid in enumerate(variable_comps):
        v = res.x[i*6 : i*6+6]
        solved_components[cid]['transform']['position'] = [float(v[0]), float(v[1]), float(v[2])]
        solved_components[cid]['transform']['rotation'] = [float(v[3]), float(v[4]), float(v[5])]
    return solved_components, {"status": "SOLVED" if res.success else "FAILED", "residual": float(np.sum(res.fun**2))}
