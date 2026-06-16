import type { SketchNode, SketchEdge, SketchConstraint } from '@/store/useCadStore';

export function measureAngleConstraintError(
  relaxedNodes: Record<string, SketchNode>,
  constraint: SketchConstraint,
  edges: Record<string, SketchEdge>
): number {
  if (constraint.edgeIds && constraint.edgeIds.length === 2) {
    const e1 = edges[constraint.edgeIds[0]];
    const e2 = edges[constraint.edgeIds[1]];
    if (e1 && e2 && e1.nodeIds.length >= 2 && e2.nodeIds.length >= 2) {
      const p1a = relaxedNodes[e1.nodeIds[0]];
      const p1b = relaxedNodes[e1.nodeIds[1]];
      const p2a = relaxedNodes[e2.nodeIds[0]];
      const p2b = relaxedNodes[e2.nodeIds[1]];
      if (p1a && p1b && p2a && p2b) {
        const dx1 = p1b.x - p1a.x;
        const dy1 = p1b.y - p1a.y;
        const dx2 = p2b.x - p2a.x;
        const dy2 = p2b.y - p2a.y;
        const len1 = Math.hypot(dx1, dy1);
        const len2 = Math.hypot(dx2, dy2);
        if (len1 > 1e-4 && len2 > 1e-4) {
          const angle1 = Math.atan2(dy1, dx1);
          const angle2 = Math.atan2(dy2, dx2);
          const currentAngle = angle2 - angle1;
          const targetAngleRad = (constraint.value ?? 45.0) * Math.PI / 180.0;
          let diff = targetAngleRad - currentAngle;
          diff = Math.atan2(Math.sin(diff), Math.cos(diff));
          return Math.abs(diff);
        }
      }
    }
  }
  return 0;
}
