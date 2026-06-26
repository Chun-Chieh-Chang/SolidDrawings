import { SketchToolHandler, SketchToolContext } from './BaseTool';
import { useCadStore } from '../../../store/useCadStore';
import { sketchActions } from '../../../store/sketchActions';

interface ChamferState {
  phase: 'SELECT_EDGE1' | 'SELECT_EDGE2';
  edge1Id: string | null;
}

export class ChamferToolHandler implements SketchToolHandler {
  private state: ChamferState = { phase: 'SELECT_EDGE1', edge1Id: null };

  onPointerDown(ctx: SketchToolContext): void {
    const cadState = useCadStore.getState();
    const edges = cadState.sketchEdges;
    const nodes = cadState.sketchNodes;
    const { snappedU, snappedV } = ctx;

    const closest = this.findClosestEdge(snappedU, snappedV, edges, nodes);
    if (!closest) return;

    if (this.state.phase === 'SELECT_EDGE1') {
      this.state = { phase: 'SELECT_EDGE2', edge1Id: closest };
      cadState.setHint('Select second edge for chamfer');
    } else if (this.state.phase === 'SELECT_EDGE2') {
      if (closest === this.state.edge1Id) return;
      this.performChamfer(this.state.edge1Id!, closest);
      this.state = { phase: 'SELECT_EDGE1', edge1Id: null };
      cadState.setHint('');
    }
  }

  onPointerMove(ctx: SketchToolContext): void {
    const cadState = useCadStore.getState();
    const edges = cadState.sketchEdges;
    const nodes = cadState.sketchNodes;
    const closest = this.findClosestEdge(ctx.snappedU, ctx.snappedV, edges, nodes);
    cadState.setHoveredEntityId(closest);
  }

  onPointerUp(_ctx: SketchToolContext): void {}

  onDoubleClick(_ctx: SketchToolContext): void {}

  onContextMenu(_ctx: SketchToolContext): void {}

  onCancel(): void {
    this.state = { phase: 'SELECT_EDGE1', edge1Id: null };
    useCadStore.getState().setHoveredEntityId(null);
    useCadStore.getState().setHint('');
  }

  // ── Private ──────────────────────────────────────────────────────────────

  private performChamfer(edgeId1: string, edgeId2: string): void {
    const distance = 10; // default distance — override via setChamferDistance()
    const ok = sketchActions.applyChamfer(edgeId1, edgeId2, distance);
    if (ok) {
      useCadStore.getState().setHint('Chamfer applied');
    } else {
      useCadStore.getState().setHint('Chamfer failed — edges may not intersect');
    }
  }

  private findClosestEdge(
    u: number, v: number,
    edges: Record<string, any>,
    nodes: Record<string, any>,
  ): string | null {
    let closest: string | null = null;
    let minDist = Infinity;
    const SNAP_DIST = 5.0;

    for (const edge of Object.values(edges) as any[]) {
      if (edge.type !== 'LINE') continue;
      const n1 = nodes[edge.nodeIds[0]];
      const n2 = nodes[edge.nodeIds[1]];
      if (!n1 || !n2) continue;

      const d = this.pointToSegmentDistance(u, v, n1.x, n1.y, n2.x, n2.y);
      if (d < SNAP_DIST && d < minDist) {
        minDist = d;
        closest = edge.id;
      }
    }
    return closest;
  }

  private pointToSegmentDistance(
    px: number, py: number,
    x1: number, y1: number,
    x2: number, y2: number,
  ): number {
    const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
  }
}
