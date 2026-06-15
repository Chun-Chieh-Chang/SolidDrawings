import { SketchToolHandler, SketchToolContext } from './BaseTool';
import { useCadStore } from '../../../store/useCadStore';
import { sketchActions } from '../../../store/sketchActions';
import { v4 as uuidv4 } from 'uuid';

export class PolygonToolHandler implements SketchToolHandler {
  private centerNodeId: string | null = null;
  private previewRadius: number = 0;

  onPointerDown(ctx: SketchToolContext): void {
    const state = useCadStore.getState();

    if (state.sketchNewChain || !state.lastClickedNodeId) {
      // First click: set polygon center
      let centerId = ctx.snappedNodeId;
      if (!centerId) {
        const isOrigin = Math.abs(ctx.snappedU) < 1e-5 && Math.abs(ctx.snappedV) < 1e-5;
        centerId = sketchActions.addNode(ctx.snappedU, ctx.snappedV, isOrigin);
        if (!centerId) return;
      }
      this.centerNodeId = centerId;
      this.previewRadius = 0;
      useCadStore.setState({
        sketchNewChain: false,
        lastClickedNodeId: centerId,
        firstChainNodeId: centerId,
      });
      useCadStore.setState({ hint: `Polygon: Drag to set size (${this.getSides()} sides)` });
    }
  }

  onPointerMove(ctx: SketchToolContext): void {
    if (!this.centerNodeId) return;

    const state = useCadStore.getState();
    const centerNode = state.sketchNodes[this.centerNodeId];
    if (!centerNode) return;

    const dx = ctx.snappedU - centerNode.x;
    const dy = ctx.snappedV - centerNode.y;
    const radius = Math.hypot(dx, dy);

    if (radius < 0.1) return;

    this.previewRadius = radius;
    const sides = this.getSides();
    const angleStep = (2 * Math.PI) / sides;
    // Start from the angle of the drag (first vertex aligns with drag direction)
    const startAngle = Math.atan2(dy, dx);

    const newNodes: Record<string, any> = {};
    const newEdges: Record<string, any> = {};

    const vertices: string[] = [];

    for (let i = 0; i < sides; i++) {
      const angle = startAngle + i * angleStep;
      const vx = centerNode.x + radius * Math.cos(angle);
      const vy = centerNode.y + radius * Math.sin(angle);
      const nodeId = `node_poly_${i}`;
      newNodes[nodeId] = { id: nodeId, x: vx, y: vy };
      vertices.push(nodeId);
    }

    for (let i = 0; i < sides; i++) {
      const edgeId = `edge_poly_${i}`;
      const fromId = vertices[i];
      const toId = vertices[(i + 1) % sides];
      newEdges[edgeId] = { id: edgeId, type: 'LINE', nodeIds: [fromId, toId] };
    }

    // Store preview data for onPointerUp to commit
    (this as any)._previewData = { newNodes, newEdges, vertices, centerNode, radius };
    (this as any)._previewCenterNode = centerNode;
    (this as any)._previewStartAngle = startAngle;
  }

  onPointerUp(ctx: SketchToolContext): void {
    if (!this.centerNodeId || !this.previewRadius) {
      this.reset();
      return;
    }

    const state = useCadStore.getState();
    const centerNode = state.sketchNodes[this.centerNodeId];
    if (!centerNode) {
      this.reset();
      return;
    }

    const sides = this.getSides();
    const angleStep = (2 * Math.PI) / sides;
    const startAngle = (this as any)._previewStartAngle || Math.atan2(ctx.snappedV - centerNode.y, ctx.snappedU - centerNode.x);
    const radius = this.previewRadius;

    const newNodes: Record<string, any> = { ...state.sketchNodes };
    const newEdges: Record<string, any> = { ...state.sketchEdges };
    const newConstraints: Record<string, any> = { ...state.sketchConstraints };

    const vertices: string[] = [];

    for (let i = 0; i < sides; i++) {
      const angle = startAngle + i * angleStep;
      const vx = centerNode.x + radius * Math.cos(angle);
      const vy = centerNode.y + radius * Math.sin(angle);
      const nodeId = `node_${i}`;
      newNodes[nodeId] = { id: nodeId, x: vx, y: vy };
      vertices.push(nodeId);
    }

    const edgeIds: string[] = [];

    for (let i = 0; i < sides; i++) {
      const edgeId = `edge_${i}`;
      const fromId = vertices[i];
      const toId = vertices[(i + 1) % sides];
      newEdges[edgeId] = { id: edgeId, type: 'LINE', nodeIds: [fromId, toId] };
      edgeIds.push(edgeId);
    }

    // Auto-add COINCIDENT constraint between last node and first node to close the loop
    const coincidentConstraintId = uuidv4();
    newConstraints[coincidentConstraintId] = {
      id: coincidentConstraintId,
      type: 'COINCIDENT' as const,
      nodeIds: [vertices[sides - 1], vertices[0]],
    };

    sketchActions.commitBatch(newNodes, newEdges, newConstraints);

    useCadStore.setState({
      sketchNewChain: true,
      lastClickedNodeId: null,
      firstChainNodeId: null,
      hint: `Polygon created with ${sides} sides`,
    });

    this.reset();
  }

  onDoubleClick(): void {
    this.reset();
  }

  onContextMenu(): void {
    this.reset();
  }

  onCancel(): void {
    this.reset();
  }

  private getSides(): number {
    const pm = useCadStore.getState().activePropertyManager;
    if (pm?.polygonSides && typeof pm.polygonSides === 'number') {
      return Math.max(3, Math.min(100, Math.round(pm.polygonSides)));
    }
    return 6;
  }

  private reset(): void {
    this.centerNodeId = null;
    this.previewRadius = 0;
    (this as any)._previewData = null;
    (this as any)._previewCenterNode = null;
    (this as any)._previewStartAngle = 0;
  }
}
