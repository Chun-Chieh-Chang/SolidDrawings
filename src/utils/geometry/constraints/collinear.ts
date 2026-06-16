import type { SketchNode, SketchEdge, SketchConstraint } from '@/store/useCadStore';

function rotatePoint(pt: SketchNode, cx: number, cy: number, dTheta: number) {
  if (pt.isFixed) return;
  const cos = Math.cos(dTheta);
  const sin = Math.sin(dTheta);
  const rx = pt.x - cx;
  const ry = pt.y - cy;
  pt.x = cx + rx * cos - ry * sin;
  pt.y = cy + rx * sin + ry * cos;
}

export function solveCollinear(
  constraint: SketchConstraint,
  nodes: Record<string, SketchNode>,
  edges: Record<string, SketchEdge>
) {
  if (!constraint.edgeIds || constraint.edgeIds.length !== 2) return;
  const e1 = edges[constraint.edgeIds[0]];
  const e2 = edges[constraint.edgeIds[1]];
  if (!e1 || !e2 || e1.nodeIds.length < 2 || e2.nodeIds.length < 2) return;

  const p1a = nodes[e1.nodeIds[0]];
  const p1b = nodes[e1.nodeIds[1]];
  const p2a = nodes[e2.nodeIds[0]];
  const p2b = nodes[e2.nodeIds[1]];
  if (!p1a || !p1b || !p2a || !p2b) return;

  const dx1 = p1b.x - p1a.x;
  const dy1 = p1b.y - p1a.y;
  const dx2 = p2b.x - p2a.x;
  const dy2 = p2b.y - p2a.y;

  const len1Sq = dx1*dx1 + dy1*dy1;
  const len2Sq = dx2*dx2 + dy2*dy2;
  const len1 = Math.sqrt(len1Sq);
  const len2 = Math.sqrt(len2Sq);
  
  if (len1 < 1e-4 || len2 < 1e-4) return;

  const angle1 = Math.atan2(dy1, dx1);
  const angle2 = Math.atan2(dy2, dx2);
  let errAngle = angle2 - angle1;
  errAngle = Math.atan2(Math.sin(errAngle), Math.cos(errAngle));
  if (Math.abs(errAngle) > Math.PI / 2) {
    errAngle = errAngle > 0 ? errAngle - Math.PI : errAngle + Math.PI;
  }

  if (Math.abs(errAngle) > 1e-6) {
    const m1x = (p1a.x + p1b.x) / 2;
    const m1y = (p1a.y + p1b.y) / 2;
    const m2x = (p2a.x + p2b.x) / 2;
    const m2y = (p2a.y + p2b.y) / 2;

    rotatePoint(p1a, m1x, m1y, errAngle / 2);
    rotatePoint(p1b, m1x, m1y, errAngle / 2);
    rotatePoint(p2a, m2x, m2y, -errAngle / 2);
    rotatePoint(p2b, m2x, m2y, -errAngle / 2);
  }

  const nx = -dy1 / len1;
  const ny = dx1 / len1;

  const distA = (p2a.x - p1a.x) * nx + (p2a.y - p1a.y) * ny;
  const distB = (p2b.x - p1a.x) * nx + (p2b.y - p1a.y) * ny;

  const w1 = (p1a.isFixed && p1b.isFixed) ? 0 : 0.5;
  const w2 = (p2a.isFixed && p2b.isFixed) ? 0 : 0.5;

  if (w2 > 0) {
    if (!p2a.isFixed) { p2a.x -= distA * nx * w2; p2a.y -= distA * ny * w2; }
    if (!p2b.isFixed) { p2b.x -= distB * nx * w2; p2b.y -= distB * ny * w2; }
  }
  if (w1 > 0) {
    const avgDist = (distA + distB) / 2;
    if (!p1a.isFixed) { p1a.x += avgDist * nx * w1; p1a.y += avgDist * ny * w1; }
    if (!p1b.isFixed) { p1b.x += avgDist * nx * w1; p1b.y += avgDist * ny * w1; }
  }
}
