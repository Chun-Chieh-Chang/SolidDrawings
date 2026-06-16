import type { SketchNode, SketchEdge, SketchConstraint } from '@/store/useCadStore';

export function solveDistance(
  constraint: SketchConstraint,
  nodes: Record<string, SketchNode>,
  edges: Record<string, SketchEdge>
) {
  const targetValue = constraint.value;
  if (targetValue === undefined) return;

  let n1: SketchNode | undefined;
  let n2: SketchNode | undefined;
  let e_circle: SketchEdge | undefined | null;

  if (constraint.nodeIds && constraint.nodeIds.length === 2) {
    n1 = nodes[constraint.nodeIds[0]];
    n2 = nodes[constraint.nodeIds[1]];
  } else if (constraint.nodeIds && constraint.nodeIds.length === 1 && constraint.edgeIds && constraint.edgeIds.length === 1) {
    n1 = nodes[constraint.nodeIds[0]];
    e_circle = edges[constraint.edgeIds[0]];
    if (e_circle && e_circle.type === 'CIRCLE' && e_circle.nodeIds.length >= 2) {
      n2 = nodes[e_circle.nodeIds[0]];
    }
  } else if (constraint.nodeIds && constraint.nodeIds.length === 1) {
    const node = nodes[constraint.nodeIds[0]];
    if (!node) return;
    if (constraint.label === 'X') {
      if (!node.isFixed) node.x = targetValue;
    } else if (constraint.label === 'Y') {
      if (!node.isFixed) node.y = targetValue;
    } else {
      const curr = Math.hypot(node.x, node.y);
      if (curr < 1e-6) return;
      const ratio = targetValue / curr;
      if (!node.isFixed) { node.x *= ratio; node.y *= ratio; }
    }
    return;
  } else if (constraint.edgeIds && constraint.edgeIds.length === 1) {
    const edge = edges[constraint.edgeIds[0]];
    if (edge && edge.nodeIds.length >= 2) {
      n1 = nodes[edge.nodeIds[0]];
      n2 = nodes[edge.nodeIds[1]];
    }
  }

  if (n1 && n2) {
    const dx = n2.x - n1.x;
    const dy = n2.y - n1.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 1e-6) return;

    let effectiveTarget = targetValue;
    if (e_circle && e_circle.type === 'CIRCLE' && e_circle.nodeIds.length >= 2) {
      const rim = nodes[e_circle.nodeIds[1]];
      const radius = Math.hypot(rim.x - n2.x, rim.y - n2.y);
      if (constraint.arcCondition === 'MIN') effectiveTarget = targetValue + radius;
      else if (constraint.arcCondition === 'MAX') effectiveTarget = targetValue - radius;
    }

    const diff = dist - effectiveTarget;
    const nx = dx / dist;
    const ny = dy / dist;
    const w1 = n1.isFixed ? 0 : (n2.isFixed ? 1 : 0.5);
    const w2 = n2.isFixed ? 0 : (n1.isFixed ? 1 : 0.5);

    if (w1 > 0) { n1.x += nx * diff * w1; n1.y += ny * diff * w1; }
    if (w2 > 0) { n2.x -= nx * diff * w2; n2.y -= ny * diff * w2; }
  }
}
