import type { SketchNode, SketchEdge, SketchConstraint } from '@/store/useCadStore';

export function measureCoincidentError(
  relaxedNodes: Record<string, SketchNode>,
  constraint: SketchConstraint,
  edges: Record<string, SketchEdge>
): number {
  if (constraint.nodeIds && constraint.nodeIds.length === 2) {
    const n1 = relaxedNodes[constraint.nodeIds[0]];
    const n2 = relaxedNodes[constraint.nodeIds[1]];
    if (n1 && n2) return Math.hypot(n2.x - n1.x, n2.y - n1.y);
  } else if (constraint.nodeIds && constraint.nodeIds.length === 1 && constraint.edgeIds && constraint.edgeIds.length === 1) {
    const node = relaxedNodes[constraint.nodeIds[0]];
    const edge = edges[constraint.edgeIds[0]];
    if (node && edge) {
      const e1 = relaxedNodes[edge.nodeIds[0]];
      const e2 = relaxedNodes[edge.nodeIds[1]];
      if (e1 && e2) {
        if (edge.type === 'LINE' || edge.type === 'CENTER_LINE') {
          const dx = e2.x - e1.x;
          const dy = e2.y - e1.y;
          const l = Math.hypot(dx, dy);
          if (l > 1e-6) return Math.abs((node.x - e1.x) * (-dy / l) + (node.y - e1.y) * (dx / l));
        } else if (edge.type === 'CIRCLE' || edge.type === 'ARC') {
          const R = Math.hypot(e2.x - e1.x, e2.y - e1.y);
          return Math.abs(Math.hypot(node.x - e1.x, node.y - e1.y) - R);
        }
      }
    }
  }
  return 0;
}
