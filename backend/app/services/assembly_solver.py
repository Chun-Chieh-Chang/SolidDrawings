import numpy as np
from scipy.optimize import least_squares
import math
import json

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
                    
                    # Compute simplified delta (SW2000 style usually works on a single primary axis)
                    # We'll use the magnitude of the rotation vector change as a proxy or specific axis
                    return np.sum(np.array(curr_rot) - np.array(init_rot))

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
                dt_a = np.sum(np.array(curr_rot) - np.array(init_t_a['rotation']))
                
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
