import type { SketchNode, SketchEdge, SketchConstraint } from '@/store/useCadStore';

export function solveLineCircleTangent(
  constraint: SketchConstraint,
  nodes: Record<string, SketchNode>,
  edges: Record<string, SketchEdge>
) {
  if (!constraint.edgeIds || constraint.edgeIds.length !== 2) return;
  const e1 = edges[constraint.edgeIds[0]];
  const e2 = edges[constraint.edgeIds[1]];
  if (!e1 || !e2) return;

  const lineEdge = e1.type === 'LINE' ? e1 : (e2.type === 'LINE' ? e2 : null);
  const circleEdge = e1.type === 'CIRCLE' ? e1 : (e2.type === 'CIRCLE' ? e2 : null);

  if (!lineEdge || !circleEdge || lineEdge.nodeIds.length < 2 || circleEdge.nodeIds.length < 2) return;

  const p1 = nodes[lineEdge.nodeIds[0]];
  const p2 = nodes[lineEdge.nodeIds[1]];
  const pc = nodes[circleEdge.nodeIds[0]];
  const pr = nodes[circleEdge.nodeIds[1]];
  if (!p1 || !p2 || !pc || !pr) return;

  const R = Math.hypot(pr.x - pc.x, pr.y - pc.y);
  if (R < 1e-4) return;

  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 1e-6) return;

  const t = ((pc.x - p1.x) * dx + (pc.y - p1.y) * dy) / lenSq;
  const projX = p1.x + t * dx;
  const projY = p1.y + t * dy;

  const dist = Math.hypot(projX - pc.x, projY - pc.y);
  if (dist < 1e-6) return;

  const err = dist - R;
  const nx = (projX - pc.x) / dist;
  const ny = (projY - pc.y) / dist;

  const w_c = pc.isFixed ? 0 : 0.5;
  const w_line = 1 - w_c;

  if (w_c > 0) { pc.x += nx * err * w_c; pc.y += ny * err * w_c; }

  if (w_line > 0) {
    const p1_w = p1.isFixed ? 0 : (p2.isFixed ? 1 : 0.5);
    const p2_w = p2.isFixed ? 0 : (p1.isFixed ? 1 : 0.5);
    const corrX = -nx * err * w_line;
    const corrY = -ny * err * w_line;

    if (p1_w > 0) { p1.x += corrX * (1 - t) * p1_w; p1.y += corrY * (1 - t) * p1_w; }
    if (p2_w > 0) { p2.x += corrX * t * p2_w; p2.y += corrY * t * p2_w; }
  }
}

export function solveCircleCircleTangent(
  constraint: SketchConstraint,
  nodes: Record<string, SketchNode>,
  edges: Record<string, SketchEdge>
) {
  if (!constraint.edgeIds || constraint.edgeIds.length !== 2) return;
  const e1 = edges[constraint.edgeIds[0]];
  const e2 = edges[constraint.edgeIds[1]];
  if (!e1 || !e2) return;

  const is_c1 = e1.type === 'CIRCLE' || e1.type === 'ARC';
  const is_c2 = e2.type === 'CIRCLE' || e2.type === 'ARC';
  if (!is_c1 || !is_c2) return;
  if (e1.nodeIds.length < 2 || e2.nodeIds.length < 2) return;

  const c1n = nodes[e1.nodeIds[0]];
  const r1n = nodes[e1.nodeIds[1]];
  const c2n = nodes[e2.nodeIds[0]];
  const r2n = nodes[e2.nodeIds[1]];
  if (!c1n || !r1n || !c2n || !r2n) return;

  const R1 = Math.hypot(r1n.x - c1n.x, r1n.y - c1n.y);
  const R2 = Math.hypot(r2n.x - c2n.x, r2n.y - c2n.y);
  const dx = c2n.x - c1n.x;
  const dy = c2n.y - c1n.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1e-6) return;

  const target = Math.abs(dist - (R1 + R2)) < Math.abs(dist - Math.abs(R1 - R2))
    ? (R1 + R2) : Math.abs(R1 - R2);
  const diff = dist - target;
  const nx = dx / dist;
  const ny = dy / dist;

  const w1 = c1n.isFixed ? 0 : (c2n.isFixed ? 1 : 0.5);
  const w2 = c2n.isFixed ? 0 : (c1n.isFixed ? 1 : 0.5);

  if (w1 > 0) { c1n.x += nx * diff * w1; c1n.y += ny * diff * w1; }
  if (w2 > 0) { c2n.x -= nx * diff * w2; c2n.y -= ny * diff * w2; }
}
