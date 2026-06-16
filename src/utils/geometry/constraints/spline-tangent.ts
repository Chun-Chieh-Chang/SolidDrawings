import type { SketchNode, SketchEdge, SketchConstraint } from '@/store/useCadStore';

export function solveSplineTangent(
  constraint: SketchConstraint,
  nodes: Record<string, SketchNode>,
  edges: Record<string, SketchEdge>
) {
  if (!constraint.edgeIds || constraint.edgeIds.length !== 2) return;
  const e1 = edges[constraint.edgeIds[0]];
  const e2 = edges[constraint.edgeIds[1]];
  if (!e1 || !e2) return;

  const spline = e1.type === 'SPLINE' ? e1 : (e2.type === 'SPLINE' ? e2 : null);
  if (!spline) return;

  const other = e1 === spline ? e2 : e1;
  const commonId = spline.nodeIds.find(id => other.nodeIds.includes(id));
  if (!commonId) return;

  const common = nodes[commonId];
  const neighborIdx = spline.nodeIds.indexOf(commonId) === 0 ? 1 : spline.nodeIds.length - 2;
  const neighbor = nodes[spline.nodeIds[neighborIdx]];
  if (!common || !neighbor) return;

  let targetAngle = 0;
  if (other.type === 'LINE' || other.type === 'CENTER_LINE') {
    const p1 = nodes[other.nodeIds[0]];
    const p2 = nodes[other.nodeIds[1]];
    if (!p1 || !p2) return;
    targetAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
  } else if (other.type === 'CIRCLE' || other.type === 'ARC') {
    const pc = nodes[other.nodeIds[0]];
    if (!pc) return;
    const radialAngle = Math.atan2(common.y - pc.y, common.x - pc.x);
    targetAngle = radialAngle + Math.PI / 2;
  } else {
    return;
  }

  const sAngle = Math.atan2(neighbor.y - common.y, neighbor.x - common.x);
  let diff = sAngle - targetAngle;
  diff = Math.atan2(Math.sin(diff), Math.cos(diff));
  if (Math.abs(diff) > Math.PI / 2) {
    diff = diff > 0 ? diff - Math.PI : diff + Math.PI;
  }

  if (Math.abs(diff) > 1e-6 && !neighbor.isFixed) {
    const mag = Math.hypot(neighbor.x - common.x, neighbor.y - common.y);
    neighbor.x = common.x + Math.cos(sAngle - diff) * mag;
    neighbor.y = common.y + Math.sin(sAngle - diff) * mag;
  }
}
