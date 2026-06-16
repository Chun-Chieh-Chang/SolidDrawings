import type { SketchNode, SketchEdge, SketchConstraint } from '@/store/useCadStore';

export function solveMidpoint(
  constraint: SketchConstraint,
  nodes: Record<string, SketchNode>,
  edges: Record<string, SketchEdge>
) {
  if (!constraint.nodeIds || constraint.nodeIds.length !== 1 || !constraint.edgeIds || constraint.edgeIds.length !== 1) return;
  const targetNode = nodes[constraint.nodeIds[0]];
  const edge = edges[constraint.edgeIds[0]];
  if (!targetNode || !edge || edge.nodeIds.length < 2) return;
  const n1 = nodes[edge.nodeIds[0]];
  const n2 = nodes[edge.nodeIds[1]];
  if (!n1 || !n2) return;

  const midX = (n1.x + n2.x) / 2;
  const midY = (n1.y + n2.y) / 2;

  const dx = midX - targetNode.x;
  const dy = midY - targetNode.y;

  const w_target = targetNode.isFixed ? 0 : 1.0;
  const w_edge = (n1.isFixed && n2.isFixed) ? 0 : 0.5;

  if (w_target > 0) {
    targetNode.x += dx * w_target;
    targetNode.y += dy * w_target;
  } else if (w_edge > 0) {
    const moveX = -dx * w_edge;
    const moveY = -dy * w_edge;
    if (!n1.isFixed) { n1.x += moveX; n1.y += moveY; }
    if (!n2.isFixed) { n2.x += moveX; n2.y += moveY; }
  }
}

export function solveSymmetric(
  constraint: SketchConstraint,
  nodes: Record<string, SketchNode>,
  edges: Record<string, SketchEdge>
) {
  if (!constraint.nodeIds || constraint.nodeIds.length !== 2 || !constraint.edgeIds || constraint.edgeIds.length !== 1) return;
  const p1 = nodes[constraint.nodeIds[0]];
  const p2 = nodes[constraint.nodeIds[1]];
  const axis = edges[constraint.edgeIds[0]];
  if (!p1 || !p2 || !axis || axis.nodeIds.length < 2) return;
  const a1 = nodes[axis.nodeIds[0]];
  const a2 = nodes[axis.nodeIds[1]];
  if (!a1 || !a2) return;

  const dx = a2.x - a1.x;
  const dy = a2.y - a1.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 1e-6) return;

  const getProj = (p: SketchNode) => {
    const t = ((p.x - a1.x) * dx + (p.y - a1.y) * dy) / lenSq;
    return { x: a1.x + t * dx, y: a1.y + t * dy };
  };

  const proj1 = getProj(p1);
  const proj2 = getProj(p2);

  const avgProjX = (proj1.x + proj2.x) / 2;
  const avgProjY = (proj1.y + proj2.y) / 2;

  const dist1 = Math.hypot(p1.x - proj1.x, p1.y - proj1.y);
  const dist2 = Math.hypot(p2.x - proj2.x, p2.y - proj2.y);
  const avgDist = (dist1 + dist2) / 2;

  const relaxPoint = (p: SketchNode, proj: {x: number, y: number}, targetDist: number) => {
    if (p.isFixed) return;
    const vx = p.x - proj.x;
    const vy = p.y - proj.y;
    const curDist = Math.hypot(vx, vy);
    if (curDist < 1e-6) {
      const nx = -dy / Math.sqrt(lenSq);
      const ny = dx / Math.sqrt(lenSq);
      p.x = avgProjX + nx * targetDist;
      p.y = avgProjY + ny * targetDist;
    } else {
      const ratio = targetDist / curDist;
      p.x = avgProjX + vx * ratio;
      p.y = avgProjY + vy * ratio;
    }
  };

  relaxPoint(p1, proj1, avgDist);
  relaxPoint(p2, proj2, avgDist);
}
