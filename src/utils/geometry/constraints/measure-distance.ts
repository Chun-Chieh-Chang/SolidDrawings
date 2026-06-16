import type { SketchNode, SketchEdge, SketchConstraint } from '@/store/useCadStore';
import { pointToLineDistance } from '@/utils/geometry/DistanceUtils';

export function measureDistanceError(
  relaxedNodes: Record<string, SketchNode>,
  constraint: SketchConstraint,
  edges: Record<string, SketchEdge>
): number {
  if (constraint.value === undefined) return 0;
  let d = -1;
  if (constraint.nodeIds && constraint.nodeIds.length === 2) {
    const n1 = relaxedNodes[constraint.nodeIds[0]];
    const n2 = relaxedNodes[constraint.nodeIds[1]];
    if (n1 && n2) d = Math.hypot(n2.x - n1.x, n2.y - n1.y);
  } else if (constraint.nodeIds && constraint.nodeIds.length === 1 && constraint.edgeIds && constraint.edgeIds.length === 1) {
    const n1 = relaxedNodes[constraint.nodeIds[0]];
    const e = edges[constraint.edgeIds[0]];
    if (n1 && e && e.type === 'CIRCLE' && e.nodeIds.length >= 2) {
      const pc = relaxedNodes[e.nodeIds[0]];
      const pr = relaxedNodes[e.nodeIds[1]];
      const radius = Math.hypot(pr.x - pc.x, pr.y - pc.y);
      const distCenter = Math.hypot(n1.x - pc.x, n1.y - pc.y);
      if (constraint.arcCondition === 'MIN') d = Math.abs(distCenter - radius);
      else if (constraint.arcCondition === 'MAX') d = distCenter + radius;
      else d = distCenter;
    }
  } else if (constraint.edgeIds && constraint.edgeIds.length === 2) {
    const e1 = edges[constraint.edgeIds[0]];
    const e2 = edges[constraint.edgeIds[1]];
    const el = e1.type === 'LINE' ? e1 : (e2.type === 'LINE' ? e2 : null);
    const ec = e1.type === 'CIRCLE' ? e1 : (e2.type === 'CIRCLE' ? e2 : null);
    if (el && ec && el.nodeIds.length >= 2 && ec.nodeIds.length >= 2) {
      const p1 = relaxedNodes[el.nodeIds[0]];
      const p2 = relaxedNodes[el.nodeIds[1]];
      const pc = relaxedNodes[ec.nodeIds[0]];
      const pr = relaxedNodes[ec.nodeIds[1]];
      const radius = Math.hypot(pr.x - pc.x, pr.y - pc.y);
      const distCenter = pointToLineDistance(pc, p1, p2);
      if (constraint.arcCondition === 'MIN') d = Math.abs(distCenter - radius);
      else if (constraint.arcCondition === 'MAX') d = distCenter + radius;
      else d = distCenter;
    }
  }
  return d >= 0 ? Math.abs(d - constraint.value) : 0;
}
