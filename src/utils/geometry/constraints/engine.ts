import type { SketchNode, SketchEdge, SketchConstraint } from '@/store/useCadStore';
import { solveCoincident } from './coincident';
import { solveHorizontal, solveVertical } from './alignment';
import { solveDistance } from './distance';
import { solveDistanceEdge } from './distance-edge';
import { solveEqualLength, solveEqualRadius } from './equality';
import { solveCollinear } from './collinear';
import { solveParallel } from './parallel';
import { solvePerpendicular } from './perpendicular';
import { solveAngle } from './angle';
import { solveMidpoint } from './symmetry';
import { solveConcentric } from './concentric';
import { solveLineCircleTangent, solveCircleCircleTangent } from './tangent';
import { solveSplineTangent } from './spline-tangent';

export function solveConstraints(
  nodes: Record<string, SketchNode>,
  edges: Record<string, SketchEdge>,
  constraints: Record<string, SketchConstraint>,
  iterations: number = 10
): Record<string, SketchNode> {
  const nextNodes: Record<string, SketchNode> = JSON.parse(JSON.stringify(nodes));
  const constraintList = Object.values(constraints);

  for (let i = 0; i < iterations; i++) {
    for (const constraint of constraintList) {
      applyConstraint(constraint, nextNodes, edges);
    }
  }

  return nextNodes;
}

function applyConstraint(
  constraint: SketchConstraint,
  nodes: Record<string, SketchNode>,
  edges: Record<string, SketchEdge>
) {
  switch (constraint.type) {
    case 'COINCIDENT': solveCoincident(constraint, nodes, edges); break;
    case 'HORIZONTAL': solveHorizontal(constraint, nodes, edges); break;
    case 'VERTICAL': solveVertical(constraint, nodes, edges); break;
    case 'DISTANCE': solveDistance(constraint, nodes, edges); solveDistanceEdge(constraint, nodes, edges); break;
    case 'EQUAL': solveEqualLength(constraint, nodes, edges); solveEqualRadius(constraint, nodes, edges); break;
    case 'COLLINEAR': solveCollinear(constraint, nodes, edges); break;
    case 'PIERCE': case 'PARALLEL': {
      if (constraint.nodeIds && constraint.nodeIds.length === 1) {
        const node = nodes[constraint.nodeIds[0]];
        if (node && !node.isFixed && constraint.value !== undefined && constraint.offset !== undefined) {
          node.x = constraint.value;
          node.y = constraint.offset;
        }
      } else {
        solveParallel(constraint, nodes, edges);
      }
      break;
    }
    case 'PERPENDICULAR': solvePerpendicular(constraint, nodes, edges); break;
    case 'ANGLE': solveAngle(constraint, nodes, edges); break;
    case 'MIDPOINT': solveMidpoint(constraint, nodes, edges); break;
    case 'CONCENTRIC': solveConcentric(constraint, nodes, edges); break;
    case 'TANGENT':
      solveLineCircleTangent(constraint, nodes, edges);
      solveCircleCircleTangent(constraint, nodes, edges);
      solveSplineTangent(constraint, nodes, edges);
      break;
  }
}

export function calculateDOF(
  nodes: Record<string, SketchNode>,
  constraints: Record<string, SketchConstraint>
): number {
  let nonFixedCount = 0;
  for (const n of Object.values(nodes)) {
    if (!n.isFixed) nonFixedCount++;
  }
  let dof = nonFixedCount * 2;
  for (const c of Object.values(constraints)) {
    if (c.type === 'COINCIDENT') {
      if (c.nodeIds?.length === 2) dof -= 2;
      else if (c.nodeIds?.length === 1 && c.edgeIds?.length === 1) dof -= 1;
    } else if (c.type === 'CONCENTRIC' || c.type === 'PIERCE') {
      dof -= 2;
    } else {
      dof -= 1;
    }
  }
  return dof;
}
