import numpy as np
from scipy.optimize import least_squares
import math
import json

def solve_sketch_constraints(nodes_dict, edges_dict, constraints_dict):
    """
    Precise 2D Geometric Constraint Solver using Scipy's Levenberg-Marquardt / Least Squares.
    Returns solved nodes and a report containing residual and estimated DOF.
    """
    node_ids = sorted(nodes_dict.keys())
    variable_nodes = [nid for nid in node_ids if not nodes_dict[nid].get('isFixed', False)]
    node_to_idx = {nid: i for i, nid in enumerate(variable_nodes)}
    
    x0 = []
    for nid in variable_nodes:
        x0.extend([nodes_dict[nid]['x'], nodes_dict[nid]['y']])
    x0 = np.array(x0, dtype=float)
    
    num_vars = len(x0)
    if num_vars == 0:
        return nodes_dict, {"residual": 0, "status": "ALL_FIXED", "dof": 0}

    def get_node_coords(nid, x_vars):
        if nid in node_to_idx:
            idx = node_to_idx[nid]
            return x_vars[idx*2], x_vars[idx*2+1]
        else:
            n = nodes_dict[nid]
            return float(n['x']), float(n['y'])

    def residual_func(x_vars):
        residuals = []
        for cid, c in constraints_dict.items():
            ctype = c.get('type')
            c_node_ids = c.get('nodeIds', [])
            c_edge_ids = c.get('edgeIds', [])
            val = float(c.get('value', 0))
            
            if ctype == 'COINCIDENT' and len(c_node_ids) == 2:
                p1x, p1y = get_node_coords(c_node_ids[0], x_vars)
                p2x, p2y = get_node_coords(c_node_ids[1], x_vars)
                residuals.extend([p1x - p2x, p1y - p2y])
            elif ctype == 'HORIZONTAL':
                targets = c_node_ids if len(c_node_ids) == 2 else (edges_dict.get(c_edge_ids[0], {}).get('nodeIds', [])[:2] if c_edge_ids else [])
                if len(targets) == 2:
                    _, p1y = get_node_coords(targets[0], x_vars); _, p2y = get_node_coords(targets[1], x_vars)
                    residuals.append(p1y - p2y)
            elif ctype == 'VERTICAL':
                targets = c_node_ids if len(c_node_ids) == 2 else (edges_dict.get(c_edge_ids[0], {}).get('nodeIds', [])[:2] if c_edge_ids else [])
                if len(targets) == 2:
                    p1x, _ = get_node_coords(targets[0], x_vars); p2x, _ = get_node_coords(targets[1], x_vars)
                    residuals.append(p1x - p2x)
            elif ctype == 'DISTANCE':
                targets = c_node_ids if len(c_node_ids) == 2 else (edges_dict.get(c_edge_ids[0], {}).get('nodeIds', [])[:2] if c_edge_ids else [])
                if len(targets) == 2:
                    p1x, p1y = get_node_coords(targets[0], x_vars); p2x, p2y = get_node_coords(targets[1], x_vars)
                    residuals.append(math.sqrt((p1x-p2x)**2 + (p1y-p2y)**2 + 1e-9) - val)
            elif ctype == 'EQUAL' and len(c_edge_ids) == 2:
                e1 = edges_dict.get(c_edge_ids[0]); e2 = edges_dict.get(c_edge_ids[1])
                if e1 and e2 and len(e1['nodeIds']) >= 2 and len(e2['nodeIds']) >= 2:
                    p1ax, p1ay = get_node_coords(e1['nodeIds'][0], x_vars); p1bx, p1by = get_node_coords(e1['nodeIds'][1], x_vars)
                    p2ax, p2ay = get_node_coords(e2['nodeIds'][0], x_vars); p2bx, p2by = get_node_coords(e2['nodeIds'][1], x_vars)
                    residuals.append(math.sqrt((p1ax-p1bx)**2 + (p1ay-p1by)**2 + 1e-9) - math.sqrt((p2ax-p2bx)**2 + (p2ay-p2by)**2 + 1e-9))
            elif ctype == 'ANGLE' and len(c_edge_ids) == 2:
                e1 = edges_dict.get(c_edge_ids[0]); e2 = edges_dict.get(c_edge_ids[1])
                if e1 and e2 and len(e1['nodeIds']) >= 2 and len(e2['nodeIds']) >= 2:
                    p1ax, p1ay = get_node_coords(e1['nodeIds'][0], x_vars); p1bx, p1by = get_node_coords(e1['nodeIds'][1], x_vars)
                    p2ax, p2ay = get_node_coords(e2['nodeIds'][0], x_vars); p2bx, p2by = get_node_coords(e2['nodeIds'][1], x_vars)
                    
                    dx1, dy1 = p1bx - p1ax, p1by - p1ay
                    dx2, dy2 = p2bx - p2ax, p2by - p2ay
                    len1 = math.sqrt(dx1**2 + dy1**2 + 1e-9)
                    len2 = math.sqrt(dx2**2 + dy2**2 + 1e-9)
                    
                    dot_prod = (dx1 * dx2 + dy1 * dy2) / (len1 * len2)
                    dot_prod = max(-1.0, min(1.0, dot_prod))
                    angle = math.acos(dot_prod)
                    target_rad = val * math.pi / 180.0
                    residuals.append((angle - target_rad) * 10.0)
            elif ctype == 'TANGENT' and len(c_edge_ids) == 2:
                e1 = edges_dict.get(c_edge_ids[0]); e2 = edges_dict.get(c_edge_ids[1])
                if e1 and e2 and len(e1['nodeIds']) >= 2 and len(e2['nodeIds']) >= 2:
                    is_c1 = e1.get('type') in ['CIRCLE', 'ARC']
                    is_c2 = e2.get('type') in ['CIRCLE', 'ARC']
                    if is_c1 != is_c2:
                        c_edge = e1 if is_c1 else e2
                        l_edge = e2 if is_c1 else e1
                        cx, cy = get_node_coords(c_edge['nodeIds'][0], x_vars)
                        px, py = get_node_coords(c_edge['nodeIds'][1], x_vars)
                        x1, y1 = get_node_coords(l_edge['nodeIds'][0], x_vars)
                        x2, y2 = get_node_coords(l_edge['nodeIds'][1], x_vars)
                        
                        R = math.sqrt((px - cx)**2 + (py - cy)**2 + 1e-9)
                        
                        dx, dy = x2 - x1, y2 - y1
                        length = math.sqrt(dx**2 + dy**2 + 1e-9)
                        dist = abs(dx * (y1 - cy) - (x1 - cx) * dy) / length
                        
                        residuals.append((dist - R) * 5.0)
                    elif is_c1 and is_c2:
                        c1x, c1y = get_node_coords(e1['nodeIds'][0], x_vars)
                        p1x, p1y = get_node_coords(e1['nodeIds'][1], x_vars)
                        c2x, c2y = get_node_coords(e2['nodeIds'][0], x_vars)
                        p2x, p2y = get_node_coords(e2['nodeIds'][1], x_vars)
                        
                        R1 = math.sqrt((p1x - c1x)**2 + (p1y - c1y)**2 + 1e-9)
                        R2 = math.sqrt((p2x - c2x)**2 + (p2y - c2y)**2 + 1e-9)
                        dist_centers = math.sqrt((c2x - c1x)**2 + (c2y - c1y)**2 + 1e-9)
                        
                        # Distance between centers should be R1 + R2 or |R1 - R2|
                        res = min(abs(dist_centers - (R1 + R2)), abs(dist_centers - abs(R1 - R2)))
                        residuals.append(res * 5.0)

        # Estimated DOF = Total Variables - Rank of Jacobian (effectively)
        # For simplicity in this mock-oriented NR, we count constraints
        num_constraints = len(residuals)
        
        # Add soft spring to prevent drift
        for i, nid in enumerate(variable_nodes):
            residuals.extend([(x_vars[i*2] - nodes_dict[nid]['x']) * 0.001, (x_vars[i*2+1] - nodes_dict[nid]['y']) * 0.001])
        return np.array(residuals), num_constraints

    def solve_residual(x_vars):
        res, _ = residual_func(x_vars)
        return res

    res = least_squares(solve_residual, x0, method='lm', ftol=1e-7, xtol=1e-7)
    
    _, constraint_count = residual_func(res.x)
    estimated_dof = max(0, num_vars - constraint_count)

    solved_nodes = json.loads(json.dumps(nodes_dict))
    for i, nid in enumerate(variable_nodes):
        solved_nodes[nid]['x'] = float(res.x[i*2])
        solved_nodes[nid]['y'] = float(res.x[i*2+1])
        
    return solved_nodes, {
        "residual": float(np.sum(res.fun**2)), 
        "status": "SOLVED" if res.success else "FAILED",
        "dof": estimated_dof
    }
