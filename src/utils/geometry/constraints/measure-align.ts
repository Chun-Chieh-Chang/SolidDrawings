import type { SketchNode, SketchEdge, SketchConstraint } from '@/store/useCadStore';

export function measureHorizontalAlignment(
  relaxedNodes: Record<string, SketchNode>,
  constraint: SketchConstraint,
  edges: Record<string, SketchEdge>
): number {
  if (constraint.edgeIds && constraint.edgeIds.length === 1) {
    const edge = edges[constraint.edgeIds[0]];
    if (edge && edge.nodeIds.length >= 2) {
      const n1 = relaxedNodes[edge.nodeIds[0]];
      const n2 = relaxedNodes[edge.nodeIds[1]];
      if (n1 && n2) return Math.abs(n2.y - n1.y);
    }
  }
  return 0;
}

export function measureVerticalAlignment(
  relaxedNodes: Record<string, SketchNode>,
  constraint: SketchConstraint,
  edges: Record<string, SketchEdge>
): number {
  if (constraint.edgeIds && constraint.edgeIds.length === 1) {
    const edge = edges[constraint.edgeIds[0]];
    if (edge && edge.nodeIds.length >= 2) {
      const n1 = relaxedNodes[edge.nodeIds[0]];
      const n2 = relaxedNodes[edge.nodeIds[1]];
      if (n1 && n2) return Math.abs(n2.x - n1.x);
    }
  }
  return 0;
}

export function measureEqualError(
  relaxedNodes: Record<string, SketchNode>,
  constraint: SketchConstraint,
  edges: Record<string, SketchEdge>
): number {
  if (constraint.edgeIds && constraint.edgeIds.length === 2) {
    const e1 = edges[constraint.edgeIds[0]];
    const e2 = edges[constraint.edgeIds[1]];
    if (e1 && e2 && e1.nodeIds.length >= 2 && e2.nodeIds.length >= 2) {
      const n1a = relaxedNodes[e1.nodeIds[0]];
      const n1b = relaxedNodes[e1.nodeIds[1]];
      const n2a = relaxedNodes[e2.nodeIds[0]];
      const n2b = relaxedNodes[e2.nodeIds[1]];
      if (n1a && n1b && n2a && n2b) {
        return Math.abs(Math.hypot(n1b.x - n1a.x, n1b.y - n1a.y) - Math.hypot(n2b.x - n2a.x, n2b.y - n2a.y));
      }
    }
  }
  return 0;
}

export function measureConcentricError(
  relaxedNodes: Record<string, SketchNode>,
  constraint: SketchConstraint,
  edges: Record<string, SketchEdge>
): number {
  if (constraint.edgeIds && constraint.edgeIds.length === 2) {
    const c1 = edges[constraint.edgeIds[0]];
    const c2 = edges[constraint.edgeIds[1]];
    if (c1 && c2 && c1.nodeIds.length > 0 && c2.nodeIds.length > 0) {
      const n1 = relaxedNodes[c1.nodeIds[0]];
      const n2 = relaxedNodes[c2.nodeIds[0]];
      if (n1 && n2) return Math.hypot(n2.x - n1.x, n2.y - n1.y);
    }
  }
  return 0;
}
