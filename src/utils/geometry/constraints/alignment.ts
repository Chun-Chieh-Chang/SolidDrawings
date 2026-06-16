import type { SketchNode, SketchEdge, SketchConstraint } from '@/store/useCadStore';

export function solveHorizontal(
  constraint: SketchConstraint,
  nodes: Record<string, SketchNode>,
  edges: Record<string, SketchEdge>
) {
  if (!constraint.edgeIds || constraint.edgeIds.length !== 1) return;
  const edge = edges[constraint.edgeIds[0]];
  if (!edge || edge.nodeIds.length < 2) return;
  const n1 = nodes[edge.nodeIds[0]];
  const n2 = nodes[edge.nodeIds[1]];
  if (!n1 || !n2) return;

  const dy = n2.y - n1.y;
  const w1 = n1.isFixed ? 0 : (n2.isFixed ? 1 : 0.5);
  const w2 = n2.isFixed ? 0 : (n1.isFixed ? 1 : 0.5);

  if (w1 > 0) n1.y += dy * w1;
  if (w2 > 0) n2.y -= dy * w2;
}

export function solveVertical(
  constraint: SketchConstraint,
  nodes: Record<string, SketchNode>,
  edges: Record<string, SketchEdge>
) {
  if (!constraint.edgeIds || constraint.edgeIds.length !== 1) return;
  const edge = edges[constraint.edgeIds[0]];
  if (!edge || edge.nodeIds.length < 2) return;
  const n1 = nodes[edge.nodeIds[0]];
  const n2 = nodes[edge.nodeIds[1]];
  if (!n1 || !n2) return;

  const dx = n2.x - n1.x;
  const w1 = n1.isFixed ? 0 : (n2.isFixed ? 1 : 0.5);
  const w2 = n2.isFixed ? 0 : (n1.isFixed ? 1 : 0.5);

  if (w1 > 0) n1.x += dx * w1;
  if (w2 > 0) n2.x -= dx * w2;
}
