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

export function solveParallel(
  constraint: SketchConstraint,
  nodes: Record<string, SketchNode>,
  edges: Record<string, SketchEdge>
) {
  // Pierce case: single node with value/offset (legacy)
  if (constraint.nodeIds && constraint.nodeIds.length === 1) {
    const node = nodes[constraint.nodeIds[0]];
    if (node && !node.isFixed && constraint.value !== undefined && constraint.offset !== undefined) {
      node.x = constraint.value;
      node.y = constraint.offset;
    }
    return;
  }

  // Two-edge parallel case
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

  const len1 = Math.hypot(dx1, dy1);
  const len2 = Math.hypot(dx2, dy2);
  if (len1 < 1e-4 || len2 < 1e-4) return;

  const angle1 = Math.atan2(dy1, dx1);
  const angle2 = Math.atan2(dy2, dx2);
  let err = angle2 - angle1;
  err = Math.atan2(Math.sin(err), Math.cos(err));
  if (Math.abs(err) > Math.PI / 2) {
    err = err > 0 ? err - Math.PI : err + Math.PI;
  }
  if (Math.abs(err) < 1e-6) return;

  const m1x = (p1a.x + p1b.x) / 2;
  const m1y = (p1a.y + p1b.y) / 2;
  const m2x = (p2a.x + p2b.x) / 2;
  const m2y = (p2a.y + p2b.y) / 2;

  rotatePoint(p1a, m1x, m1y, err / 2);
  rotatePoint(p1b, m1x, m1y, err / 2);
  rotatePoint(p2a, m2x, m2y, -err / 2);
  rotatePoint(p2b, m2x, m2y, -err / 2);
}
