import type { SketchNode, SketchEdge, SketchConstraint } from '@/store/useCadStore';

export function solveEqualLength(
  constraint: SketchConstraint,
  nodes: Record<string, SketchNode>,
  edges: Record<string, SketchEdge>
) {
  if (!constraint.edgeIds || constraint.edgeIds.length !== 2) return;
  const e1 = edges[constraint.edgeIds[0]];
  const e2 = edges[constraint.edgeIds[1]];
  if (!e1 || !e2 || e1.nodeIds.length < 2 || e2.nodeIds.length < 2) return;

  if ((e1.type === 'LINE' || e1.type === 'CENTER_LINE') && (e2.type === 'LINE' || e2.type === 'CENTER_LINE')) {
    const n1a = nodes[e1.nodeIds[0]];
    const n1b = nodes[e1.nodeIds[1]];
    const n2a = nodes[e2.nodeIds[0]];
    const n2b = nodes[e2.nodeIds[1]];
    if (!n1a || !n1b || !n2a || !n2b) return;

    const l1 = Math.hypot(n1b.x - n1a.x, n1b.y - n1a.y);
    const l2 = Math.hypot(n2b.x - n2a.x, n2b.y - n2a.y);
    if (l1 < 1e-6 || l2 < 1e-6) return;

    const avgLength = (l1 + l2) / 2.0;
    const relaxLine = (na: SketchNode, nb: SketchNode, target: number) => {
      const curr = Math.hypot(nb.x - na.x, nb.y - na.y);
      const diff = curr - target;
      const ux = (nb.x - na.x) / curr;
      const uy = (nb.y - na.y) / curr;
      const wa = na.isFixed ? 0 : (nb.isFixed ? 1 : 0.5);
      const wb = nb.isFixed ? 0 : (na.isFixed ? 1 : 0.5);
      if (wa > 0) { na.x += ux * diff * wa; na.y += uy * diff * wa; }
      if (wb > 0) { nb.x -= ux * diff * wb; nb.y -= uy * diff * wb; }
    };
    relaxLine(n1a, n1b, avgLength);
    relaxLine(n2a, n2b, avgLength);
  }
}

export function solveEqualRadius(
  constraint: SketchConstraint,
  nodes: Record<string, SketchNode>,
  edges: Record<string, SketchEdge>
) {
  if (!constraint.edgeIds || constraint.edgeIds.length !== 2) return;
  const e1 = edges[constraint.edgeIds[0]];
  const e2 = edges[constraint.edgeIds[1]];
  if (!e1 || !e2 || e1.nodeIds.length < 2 || e2.nodeIds.length < 2) return;

  if (e1.type === 'CIRCLE' && e2.type === 'CIRCLE') {
    const c1 = nodes[e1.nodeIds[0]];
    const p1 = nodes[e1.nodeIds[1]];
    const c2 = nodes[e2.nodeIds[0]];
    const p2 = nodes[e2.nodeIds[1]];
    if (!c1 || !p1 || !c2 || !p2) return;

    const r1 = Math.hypot(p1.x - c1.x, p1.y - c1.y);
    const r2 = Math.hypot(p2.x - c2.x, p2.y - c2.y);
    const targetR = (r1 + r2) / 2;

    const relaxRadius = (c: SketchNode, p: SketchNode, target: number) => {
      const curr = Math.hypot(p.x - c.x, p.y - c.y);
      if (curr < 1e-4) return;
      const ratio = target / curr;
      const wc = c.isFixed ? 0 : (p.isFixed ? 1 : 0.5);
      const wp = p.isFixed ? 0 : (c.isFixed ? 1 : 0.5);

      if (wp > 0) {
        p.x = c.x + (p.x - c.x) * ratio;
        p.y = c.y + (p.y - c.y) * ratio;
      } else if (wc > 0) {
        c.x = p.x - (p.x - c.x) * ratio;
        c.y = p.y - (p.y - c.y) * ratio;
      }
    };

    relaxRadius(c1, p1, targetR);
    relaxRadius(c2, p2, targetR);
  }
}
