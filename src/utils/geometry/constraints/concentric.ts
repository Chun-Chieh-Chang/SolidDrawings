import type { SketchNode, SketchEdge, SketchConstraint } from '@/store/useCadStore';

export function solveConcentric(
  constraint: SketchConstraint,
  nodes: Record<string, SketchNode>,
  edges: Record<string, SketchEdge>
) {
  if (!constraint.edgeIds || constraint.edgeIds.length !== 2) return;
  const c1 = edges[constraint.edgeIds[0]];
  const c2 = edges[constraint.edgeIds[1]];
  if (!c1 || !c2 || c1.nodeIds.length === 0 || c2.nodeIds.length === 0) return;
  const n1 = nodes[c1.nodeIds[0]];
  const n2 = nodes[c2.nodeIds[0]];
  if (!n1 || !n2) return;

  const dx = n2.x - n1.x;
  const dy = n2.y - n1.y;

  const w1 = n1.isFixed ? 0 : (n2.isFixed ? 1 : 0.5);
  const w2 = n2.isFixed ? 0 : (n1.isFixed ? 1 : 0.5);

  if (w1 > 0) { n1.x += dx * w1; n1.y += dy * w1; }
  if (w2 > 0) { n2.x -= dx * w2; n2.y -= dy * w2; }
}
