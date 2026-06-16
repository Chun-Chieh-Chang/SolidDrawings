import type { SketchNode, SketchEdge, SketchConstraint } from '@/store/useCadStore';
import { solveConstraints, calculateDOF } from './engine';
import { measureCoincidentError } from './measure-coincident';
import { measureDistanceError } from './measure-distance';
import { measureAngleConstraintError } from './measure-angle';
import { measureParallelError, measurePerpendicularError } from './measure-parallel';
import { measureHorizontalAlignment, measureVerticalAlignment, measureEqualError, measureConcentricError } from './measure-align';
import { measureTangentError, measureCollinearError } from './measure-surface';

export interface SketchDefinitionReport {
  nodes: Record<string, 'UNDER' | 'FULLY' | 'CONFLICT'>;
  edges: Record<string, 'UNDER' | 'FULLY' | 'CONFLICT'>;
  hasConflict: boolean;
  dof: number;
}

const errorMeasurers: Record<string, (rn: Record<string, SketchNode>, c: SketchConstraint, e: Record<string, SketchEdge>) => number> = {
  COINCIDENT: measureCoincidentError, HORIZONTAL: measureHorizontalAlignment, VERTICAL: measureVerticalAlignment,
  DISTANCE: measureDistanceError, EQUAL: measureEqualError, CONCENTRIC: measureConcentricError,
  TANGENT: measureTangentError, ANGLE: measureAngleConstraintError, PARALLEL: measureParallelError,
  PERPENDICULAR: measurePerpendicularError, COLLINEAR: measureCollinearError,
};

function classifyNodeStatus(nodeIds: string[], relaxedNodes: Record<string, SketchNode>, edges: Record<string, SketchEdge>, constraints: Record<string, SketchConstraint>, nodeStatus: Record<string, 'UNDER' | 'FULLY' | 'CONFLICT'>) {
  for (const nId of nodeIds) {
    if (nodeStatus[nId] === 'CONFLICT') continue;
    const originalNode = relaxedNodes[nId];
    if (!originalNode) continue;
    if (originalNode.isFixed) { nodeStatus[nId] = 'FULLY'; continue; }
    const perturbedNodes = JSON.parse(JSON.stringify(relaxedNodes));
    perturbedNodes[nId].x += 0.2;
    perturbedNodes[nId].y += 0.2;
    const resolved = solveConstraints(perturbedNodes, edges, constraints, 5);
    const dist = Math.hypot(resolved[nId].x - originalNode.x, resolved[nId].y - originalNode.y);
    nodeStatus[nId] = dist < 0.01 ? 'FULLY' : 'UNDER';
  }
}

function classifyEdgeStatus(edgeIds: string[], edges: Record<string, SketchEdge>, nodeStatus: Record<string, 'UNDER' | 'FULLY' | 'CONFLICT'>, edgeStatus: Record<string, 'UNDER' | 'FULLY' | 'CONFLICT'>) {
  for (const eId of edgeIds) {
    if (edgeStatus[eId] === 'CONFLICT') continue;
    const edge = edges[eId];
    if (!edge || edge.nodeIds.length < 2) { edgeStatus[eId] = 'UNDER'; continue; }
    edgeStatus[eId] = edge.nodeIds.every((nId: string) => nodeStatus[nId] === 'FULLY') ? 'FULLY' : 'UNDER';
  }
}

export function analyzeSketchDefinitions(
  nodes: Record<string, SketchNode>,
  edges: Record<string, SketchEdge>,
  constraints: Record<string, SketchConstraint>
): SketchDefinitionReport {
  const nodeIds = Object.keys(nodes);
  const edgeIds = Object.keys(edges);
  const constraintList = Object.values(constraints);
  const nodeStatus: Record<string, 'UNDER' | 'FULLY' | 'CONFLICT'> = {};
  const edgeStatus: Record<string, 'UNDER' | 'FULLY' | 'CONFLICT'> = {};
  let hasConflict = false;
  const relaxedNodes = solveConstraints(nodes, edges, constraints, 10);

  for (const constraint of constraintList) {
    const measurer = errorMeasurers[constraint.type];
    const err = measurer ? measurer(relaxedNodes, constraint, edges) : 0;
    if (err > 0.05) {
      hasConflict = true;
      constraint.nodeIds?.forEach((id: string) => { nodeStatus[id] = 'CONFLICT'; });
      constraint.edgeIds?.forEach((id: string) => {
        edgeStatus[id] = 'CONFLICT';
        edges[id]?.nodeIds?.forEach((nId: string) => { nodeStatus[nId] = 'CONFLICT'; });
      });
    }
  }

  classifyNodeStatus(nodeIds, relaxedNodes, edges, constraints, nodeStatus);
  classifyEdgeStatus(edgeIds, edges, nodeStatus, edgeStatus);
  const dof = calculateDOF(nodes, constraints);
  return { nodes: nodeStatus, edges: edgeStatus, hasConflict, dof };
}
