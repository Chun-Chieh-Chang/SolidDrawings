import { SketchToolHandler, SketchToolContext } from './BaseTool';
import { useCadStore } from '../../../store/useCadStore';
import { sketchActions } from '../../../store/sketchActions';
import { previewSolve } from '@/kernel/SketchSolverService';

export class LineToolHandler implements SketchToolHandler {
  private isCenterLine: boolean;

  constructor(isCenterLine: boolean = false) {
    this.isCenterLine = isCenterLine;
  }

  onPointerDown(ctx: SketchToolContext): void {
    const state = useCadStore.getState();
    const { snappedU, snappedV, snappedNodeId } = ctx;
    
    // 1. Determine or create node
    let nId = snappedNodeId;
    if (!nId) {
      const isOrigin = Math.abs(snappedU) < 1e-5 && Math.abs(snappedV) < 1e-5;
      nId = sketchActions.addNode(snappedU, snappedV, isOrigin);
      if (!nId) return; // Validation failed
    }

    // 2. Check Loop Closure
    let isClosing = false;
    if (!state.sketchNewChain && state.firstChainNodeId === nId) {
      isClosing = true;
    }

    // 3. Connect to previous node if not a new chain
    if (!state.sketchNewChain && state.lastClickedNodeId) {
      if (state.lastClickedNodeId === nId) return; // Prevent degenerate lines
      const eId = sketchActions.addEdge(this.isCenterLine ? 'CENTER_LINE' : 'LINE', [state.lastClickedNodeId, nId]);
      
      // Auto-Constraint Capture (Horizontal/Vertical)
      if (ctx.activeSnapType === 'HORIZONTAL' || ctx.activeSnapType === 'VERTICAL') {
        sketchActions.addConstraint(ctx.activeSnapType, [eId]);
      }

      // Auto-Constraint Capture (Tangent)
      if (ctx.activeSnapType === 'TANGENT' && ctx.snappedEdgeId) {
        sketchActions.addConstraint('TANGENT', [eId, ctx.snappedEdgeId]);
      }

      // Auto-Constraint Capture (Midpoint)
      if (ctx.activeSnapType === 'MIDPOINT' && ctx.snappedEdgeId) {
        sketchActions.addConstraint('MIDPOINT', [ctx.snappedEdgeId], [nId]);
      }

      // Auto-Constraint Capture (Coincident on Edge - not a node)
      if (ctx.activeSnapType === 'COINCIDENT' && ctx.snappedEdgeId && !ctx.snappedNodeId) {
        sketchActions.addConstraint('COINCIDENT', [ctx.snappedEdgeId], [nId]);
      }
      
      // Solve the sketch precisely
      const solved = previewSolve(
        useCadStore.getState().sketchNodes,
        useCadStore.getState().sketchEdges,
        useCadStore.getState().sketchConstraints,
        4
      );
      useCadStore.setState({ sketchNodes: { ...useCadStore.getState().sketchNodes, ...solved } });
    }

    // 4. Update UI chain state
    if (isClosing) {
      // Auto-closure optimization: Select the closed chain and end tool mode
      const closedNodeId = nId;
      useCadStore.setState({
        sketchNewChain: true,
        lastClickedNodeId: null,
        firstChainNodeId: null,
      });

      // Find an edge connected to the closing node to start the chain selection
      const finalEdges = useCadStore.getState().sketchEdges;
      const closingEdge = Object.values(finalEdges).find(e => e.nodeIds.includes(closedNodeId));
      if (closingEdge) {
        sketchActions.selectChain(closingEdge.id);
      }
      
      // Industrial UX: Auto-switch back to SELECT tool on closure if desired
      // useCadStore.setState({ sketchTool: 'SELECT' });
    } else {
      useCadStore.setState({
        sketchNewChain: false,
        lastClickedNodeId: nId,
        firstChainNodeId: state.firstChainNodeId || nId
      });
    }
  }

  onPointerMove(ctx: SketchToolContext): void {
    // Usually handled by DatumPlanes grid snap, but we could put preview constraints here
  }

  onPointerUp(): void {}

  onDoubleClick(ctx: SketchToolContext): void {
    useCadStore.setState({
      sketchNewChain: true,
      lastClickedNodeId: null,
      firstChainNodeId: null
    });
  }

  onContextMenu(ctx: SketchToolContext): void {
    this.onDoubleClick(ctx); // Right click ends chain in SW
  }

  onCancel(): void {
    this.onDoubleClick({} as any);
  }
}
