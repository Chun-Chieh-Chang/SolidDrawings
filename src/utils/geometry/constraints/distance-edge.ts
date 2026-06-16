import type { SketchNode, SketchEdge, SketchConstraint } from '@/store/useCadStore';
import { projectPointToLine, getLineProjectionT } from '@/utils/geometry/DistanceUtils';

export function solveDistanceEdge(
  constraint: SketchConstraint,
  nodes: Record<string, SketchNode>,
  edges: Record<string, SketchEdge>
) {
  const targetValue = constraint.value;
  if (targetValue === undefined) return;
  if (!constraint.edgeIds || constraint.edgeIds.length !== 2) return;

  const edge1 = edges[constraint.edgeIds[0]];
  const edge2 = edges[constraint.edgeIds[1]];
  if (!edge1 || !edge2) return;

  const e_line = edge1.type === 'LINE' ? edge1 : (edge2.type === 'LINE' ? edge2 : null);
  const e_circle = edge1.type === 'CIRCLE' ? edge1 : (edge2.type === 'CIRCLE' ? edge2 : null);

  if (!e_line || !e_circle || e_line.nodeIds.length < 2 || e_circle.nodeIds.length < 2) return;

  const p1 = nodes[e_line.nodeIds[0]];
  const p2 = nodes[e_line.nodeIds[1]];
  const pc = nodes[e_circle.nodeIds[0]];
  const pr = nodes[e_circle.nodeIds[1]];
  if (!p1 || !p2 || !pc || !pr) return;

  const radius = Math.hypot(pr.x - pc.x, pr.y - pc.y);
  const proj = projectPointToLine(pc, p1, p2);
  const t = getLineProjectionT(pc, p1, p2);

  const dx = proj.x - pc.x;
  const dy = proj.y - pc.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1e-6) return;

  let effectiveTarget = targetValue;
  if (constraint.arcCondition === 'MIN') effectiveTarget = targetValue + radius;
  else if (constraint.arcCondition === 'MAX') effectiveTarget = targetValue - radius;

  const diff = dist - effectiveTarget;
  const nx = dx / dist;
  const ny = dy / dist;
  const w_circle = pc.isFixed ? 0 : 0.5;
  const w_line = 1.0 - w_circle;

  if (w_circle > 0) {
    pc.x += nx * diff * w_circle;
    pc.y += ny * diff * w_circle;
  }

  if (w_line > 0) {
    const p1_w = p1.isFixed ? 0 : (p2.isFixed ? 1 : 0.5);
    const p2_w = p2.isFixed ? 0 : (p1.isFixed ? 1 : 0.5);
    const corrX = -nx * diff * w_line;
    const corrY = -ny * diff * w_line;

    if (p1_w > 0) { p1.x += corrX * (1 - t) * p1_w; p1.y += corrY * (1 - t) * p1_w; }
    if (p2_w > 0) { p2.x += corrX * t * p2_w; p2.y += corrY * t * p2_w; }
  }
}
