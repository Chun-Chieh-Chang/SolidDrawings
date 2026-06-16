import { SketchToolHandler, SketchToolContext } from './BaseTool';
import { useCadStore } from '../../../store/useCadStore';
import { sketchActions } from '../../../store/sketchActions';
import { intersectLines } from '../../geometry/Intersection';

interface ExtendState {
  phase: 'SELECT_TO_EXTEND' | 'SELECT_BOUNDARY';
  targetEdgeId: string | null;
  extendNodeId: string | null;
  baseNodeId: string | null;
}

export class ExtendToolHandler implements SketchToolHandler {
  private state: ExtendState = { phase: 'SELECT_TO_EXTEND', targetEdgeId: null, extendNodeId: null, baseNodeId: null };

  onPointerDown(ctx: SketchToolContext): void {
    const cadState = useCadStore.getState();
    const { snappedU, snappedV } = ctx;
    const edges = cadState.sketchEdges;
    const nodes = cadState.sketchNodes;

    if (this.state.phase === 'SELECT_TO_EXTEND') {
      let closestEdgeId: string | null = null;
      let minDist = Infinity;
      const SNAP_DIST = 5.0;

      for (const edge of Object.values(edges)) {
        if (edge.type !== 'LINE') continue;
        const n1 = nodes[edge.nodeIds[0]];
        const n2 = nodes[edge.nodeIds[1]];
        if (!n1 || !n2) continue;

        const d = this.pointToSegmentDistance(snappedU, snappedV, n1.x, n1.y, n2.x, n2.y);
        if (d < SNAP_DIST && d < minDist) {
          minDist = d;
          closestEdgeId = edge.id;
        }
      }

      if (!closestEdgeId) return;

      const edge = edges[closestEdgeId];
      const n1 = nodes[edge.nodeIds[0]];
      const n2 = nodes[edge.nodeIds[1]];
      if (!n1 || !n2) return;

      const d1 = Math.hypot(snappedU - n1.x, snappedV - n1.y);
      const d2 = Math.hypot(snappedU - n2.x, snappedV - n2.y);

      this.state = {
        phase: 'SELECT_BOUNDARY',
        targetEdgeId: closestEdgeId,
        extendNodeId: d1 < d2 ? edge.nodeIds[0] : edge.nodeIds[1],
        baseNodeId: d1 < d2 ? edge.nodeIds[1] : edge.nodeIds[0],
      };

      cadState.setHint('Select boundary edge to extend');
    }
    else if (this.state.phase === 'SELECT_BOUNDARY') {
      this.performExtend(snappedU, snappedV, edges, nodes);
      this.reset();
    }
  }

  onPointerMove(ctx: SketchToolContext): void {
    if (this.state.phase !== 'SELECT_BOUNDARY') return;

    const cadState = useCadStore.getState();
    const nodes = cadState.sketchNodes;
    const edges = cadState.sketchEdges;

    const extendNode = nodes[this.state.extendNodeId!];
    const baseNode = nodes[this.state.baseNodeId!];
    if (!extendNode || !baseNode) return;

    const dx = extendNode.x - baseNode.x;
    const dy = extendNode.y - baseNode.y;
    const mag = Math.hypot(dx, dy);
    if (mag < 1e-6) return;

    const ux = dx / mag;
    const uy = dy / mag;

    let bestT = Infinity;
    let bestP: { x: number; y: number } | null = null;

    for (const other of Object.values(edges)) {
      if (other.id === this.state.targetEdgeId) continue;
      if (other.type === 'LINE') {
        const o1 = nodes[other.nodeIds[0]];
        const o2 = nodes[other.nodeIds[1]];
        if (!o1 || !o2) continue;

        const intersection = intersectLines(baseNode, extendNode, o1, o2);
        if (!intersection) continue;

        const t = Math.hypot(intersection.x - extendNode.x, intersection.y - extendNode.y);
        if (t > 1e-6 && t < bestT) {
          bestT = t;
          bestP = intersection;
        }
      }
      else if (other.type === 'CIRCLE') {
        const center = nodes[other.nodeIds[0]];
        const perimeter = nodes[other.nodeIds[1]];
        if (!center || !perimeter) continue;

        const radius = Math.hypot(perimeter.x - center.x, perimeter.y - center.y);
        this.tryRayCircleIntersection(baseNode, ux, uy, center, radius, extendNode);
      }
      else if (other.type === 'ARC' && other.parameters) {
        const center = nodes[other.nodeIds[0]];
        const startNode = nodes[other.nodeIds[1]];
        if (!center || !startNode) continue;

        const radius = Math.hypot(startNode.x - center.x, startNode.y - center.y);
        const endNode = nodes[other.nodeIds[2]];
        if (!endNode) continue;

        this.tryRayCircleIntersection(baseNode, ux, uy, center, radius, extendNode);
      }
    }

    if (bestP) {
      cadState.setHoveredEntityId(this.state.targetEdgeId);
    } else {
      cadState.setHoveredEntityId(null);
    }
  }

  onPointerUp(ctx: SketchToolContext): void {
    if (this.state.phase === 'SELECT_BOUNDARY') {
      useCadStore.getState().setHoveredEntityId(null);
    }
  }

  private performExtend(clickU: number, clickV: number, edges: Record<string, any>, nodes: Record<string, any>): void {
    const cadState = useCadStore.getState();
    const extendNode = nodes[this.state.extendNodeId!];
    const baseNode = nodes[this.state.baseNodeId!];
    const targetEdgeId = this.state.targetEdgeId!;

    if (!extendNode || !baseNode) return;

    const edge = edges[targetEdgeId];
    if (!edge) return;

    const dx = extendNode.x - baseNode.x;
    const dy = extendNode.y - baseNode.y;
    const mag = Math.hypot(dx, dy);
    if (mag < 1e-6) return;

    const ux = dx / mag;
    const uy = dy / mag;

    let bestT = Infinity;
    let bestP: { x: number; y: number } | null = null;

    for (const other of Object.values(edges)) {
      if (other.id === targetEdgeId) continue;
      if (other.type === 'LINE') {
        const o1 = nodes[other.nodeIds[0]];
        const o2 = nodes[other.nodeIds[1]];
        if (!o1 || !o2) continue;

        const x1 = baseNode.x, y1 = baseNode.y;
        const x2 = baseNode.x + ux * 1000, y2 = baseNode.y + uy * 1000;
        const x3 = o1.x, y3 = o1.y, x4 = o2.x, y4 = o2.y;

        const den = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
        if (Math.abs(den) < 1e-6) continue;

        const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / den;
        const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / den;

        if (ua > 1.0 && ub >= 0 && ub <= 1) {
          const tx = x1 + ua * (x2 - x1);
          const ty = y1 + ua * (y2 - y1);
          const dist = Math.hypot(tx - extendNode.x, ty - extendNode.y);
          if (dist < bestT) {
            bestT = dist;
            bestP = { x: tx, y: ty };
          }
        }
      }
      else if (other.type === 'CIRCLE') {
        const center = nodes[other.nodeIds[0]];
        const perimeter = nodes[other.nodeIds[1]];
        if (!center || !perimeter) continue;

        const radius = Math.hypot(perimeter.x - center.x, perimeter.y - center.y);
        this.tryRayCircleIntersection(baseNode, ux, uy, center, radius, extendNode);
      }
      else if (other.type === 'ARC' && other.parameters) {
        const center = nodes[other.nodeIds[0]];
        const startNode = nodes[other.nodeIds[1]];
        if (!center || !startNode) continue;

        const radius = Math.hypot(startNode.x - center.x, startNode.y - center.y);
        const endNode = nodes[other.nodeIds[2]];
        if (!endNode) continue;

        this.tryRayCircleIntersection(baseNode, ux, uy, center, radius, extendNode);
      }
    }

    if (bestP) {
      cadState.saveSnapshot();
      sketchActions.updateNodePosition(this.state.extendNodeId!, bestP.x, bestP.y);
      cadState.setHint('ExtendDone (Extend complete)');
    } else {
      cadState.setHint('No intersecting boundary found');
    }
  }

  private tryRayCircleIntersection(
    baseNode: { x: number; y: number },
    ux: number, uy: number,
    center: { x: number; y: number },
    radius: number,
    extendNode: { x: number; y: number }
  ): void {
    const dx = center.x - baseNode.x;
    const dy = center.y - baseNode.y;
    const a = ux * ux + uy * uy;
    const b = 2 * (dx * ux + dy * uy);
    const c = dx * dx + dy * dy - radius * radius;
    const discriminant = b * b - 4 * a * c;
    if (discriminant < 0) return;

    const sqrtD = Math.sqrt(discriminant);
    let bestT = Infinity;
    let bestP: { x: number; y: number } | null = null;

    for (const sign of [-1, 1]) {
      const t = (-b + sign * sqrtD) / (2 * a);
      if (t < 0) continue;
      const px = baseNode.x + t * ux;
      const py = baseNode.y + t * uy;
      const dist = Math.hypot(px - extendNode.x, py - extendNode.y);
      if (dist < bestT) {
        bestT = dist;
        bestP = { x: px, y: py };
      }
    }

    if (bestP) {
      const cadState = useCadStore.getState();
      const nodes = cadState.sketchNodes;
      cadState.saveSnapshot();
      cadState.setSketchNodes(prev => {
        const updated = { ...prev };
        const existing = updated[this.state.extendNodeId!];
        if (existing) {
          updated[this.state.extendNodeId!] = { ...existing, x: bestP.x, y: bestP.y };
        }
        return updated;
      });
      sketchActions.updateNodePosition(this.state.extendNodeId!, bestP.x, bestP.y);
      cadState.setHint('ExtendDone (Extend complete)');
    }
  }

  private pointToSegmentDistance(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
    const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
  }

  onCancel(): void {
    this.reset();
    useCadStore.getState().setHint('Extend cancelled');
  }

  private reset(): void {
    this.state = { phase: 'SELECT_TO_EXTEND', targetEdgeId: null, extendNodeId: null, baseNodeId: null };
    useCadStore.getState().setHoveredEntityId(null);
    useCadStore.getState().setHint('Select entity to extend');
  }

  onDoubleClick(ctx: SketchToolContext): void {}
  onContextMenu(ctx: SketchToolContext): void {}
}
