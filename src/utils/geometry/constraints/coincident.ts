import type { SketchNode, SketchEdge, SketchConstraint } from '@/store/useCadStore';
import { projectPointToLine } from '@/utils/geometry/DistanceUtils';

export function solveCoincident(
  constraint: SketchConstraint,
  nodes: Record<string, SketchNode>,
  edges: Record<string, SketchEdge>
) {
  if (constraint.nodeIds && constraint.nodeIds.length === 2) {
    const n1 = nodes[constraint.nodeIds[0]];
    const n2 = nodes[constraint.nodeIds[1]];
    if (!n1 || !n2) return;

    const dx = n2.x - n1.x;
    const dy = n2.y - n1.y;

    const w1 = n1.isFixed ? 0 : (n2.isFixed ? 1 : 0.5);
    const w2 = n2.isFixed ? 0 : (n1.isFixed ? 1 : 0.5);

    if (w1 > 0) { n1.x += dx * w1; n1.y += dy * w1; }
    if (w2 > 0) { n2.x -= dx * w2; n2.y -= dy * w2; }
  } else if (constraint.nodeIds && constraint.nodeIds.length === 1 && constraint.edgeIds && constraint.edgeIds.length === 1) {
    const node = nodes[constraint.nodeIds[0]];
    const edge = edges[constraint.edgeIds[0]];
    if (!node || !edge || node.isFixed) return;

    if (edge.type === 'LINE' || edge.type === 'CENTER_LINE') {
      const e1 = nodes[edge.nodeIds[0]];
      const e2 = nodes[edge.nodeIds[1]];
      if (!e1 || !e2) return;
      const dx = e2.x - e1.x;
      const dy = e2.y - e1.y;
      const l2 = dx*dx + dy*dy;
      if (l2 < 1e-6) return;
      const t = ((node.x - e1.x) * dx + (node.y - e1.y) * dy) / l2;
      node.x = e1.x + t * dx;
      node.y = e1.y + t * dy;
    } else if (edge.type === 'CIRCLE' || edge.type === 'ARC') {
      const center = nodes[edge.nodeIds[0]];
      const perim = nodes[edge.nodeIds[1]];
      if (!center || !perim) return;
      const R = Math.hypot(perim.x - center.x, perim.y - center.y);
      const dist = Math.hypot(node.x - center.x, node.y - center.y);
      if (dist < 1e-6) return;
      const ratio = R / dist;
      node.x = center.x + (node.x - center.x) * ratio;
      node.y = center.y + (node.y - center.y) * ratio;
    }
  }
}
