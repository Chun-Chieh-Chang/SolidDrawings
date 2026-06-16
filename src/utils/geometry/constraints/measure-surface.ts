import type { SketchNode, SketchEdge, SketchConstraint } from '@/store/useCadStore';

export function measureTangentError(
  relaxedNodes: Record<string, SketchNode>,
  constraint: SketchConstraint,
  edges: Record<string, SketchEdge>
): number {
  if (constraint.edgeIds && constraint.edgeIds.length === 2) {
    const e1 = edges[constraint.edgeIds[0]];
    const e2 = edges[constraint.edgeIds[1]];
    if (e1 && e2) {
      const line = e1.type === 'LINE' ? e1 : (e2.type === 'LINE' ? e2 : null);
      const circle = e1.type === 'CIRCLE' ? e1 : (e2.type === 'CIRCLE' ? e2 : null);
      if (line && circle && line.nodeIds.length >= 2 && circle.nodeIds.length >= 2) {
        const p1 = relaxedNodes[line.nodeIds[0]];
        const p2 = relaxedNodes[line.nodeIds[1]];
        const pc = relaxedNodes[circle.nodeIds[0]];
        const pr = relaxedNodes[circle.nodeIds[1]];
        if (p1 && p2 && pc && pr) {
          const R = Math.hypot(pr.x - pc.x, pr.y - pc.y);
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const lenSq = dx * dx + dy * dy;
          if (lenSq > 1e-6) {
            const t = ((pc.x - p1.x) * dx + (pc.y - p1.y) * dy) / lenSq;
            const projX = p1.x + t * dx;
            const projY = p1.y + t * dy;
            const dist = Math.hypot(projX - pc.x, projY - pc.y);
            return Math.abs(dist - R);
          }
        }
      }
    }
  }
  return 0;
}

export function measureCollinearError(
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
        const len1 = Math.hypot(dx1, dy1);
        if (len1 > 1e-4) {
          const nx = -dy1 / len1;
          const ny = dx1 / len1;
          const distA = Math.abs((p2a.x - p1a.x) * nx + (p2a.y - p1a.y) * ny);
          const distB = Math.abs((p2b.x - p1a.x) * nx + (p2b.y - p1a.y) * ny);
          return distA + distB;
        }
      }
    }
  }
  return 0;
}
