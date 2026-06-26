import { useCallback } from 'react';
import { useCadStore } from '../../store/useCadStore';
import { v4 as uuidv4 } from 'uuid';

/**
 * 3D Sketch tool hook.
 * Returns event handlers to attach to the Three.js canvas for 3D point picking.
 * When a 3D plane is active, click detects intersections with that plane
 * and creates 3D sketch nodes.
 */
export function useSketch3DTool() {
  const is3DMode = useCadStore((s) => s.is3DMode);
  const active3DPlane = useCadStore((s) => s.active3DPlane);
  const setSketchNodes = useCadStore((s) => s.setSketchNodes);
  const sketchNodes = useCadStore((s) => s.sketchNodes);
  const setSketchEdges = useCadStore((s) => s.setSketchEdges);
  const sketchEdges = useCadStore((s) => s.sketchEdges);
  const lastClickedNodeId = useCadStore((s) => s.lastClickedNodeId);
  const setLastClickedNodeId = useCadStore((s) => s.setLastClickedNodeId);

  const handlePointerDown = useCallback(
    (event: { point: [number, number, number] }) => {
      if (!is3DMode || !active3DPlane) return;

      const [x, y, z] = event.point;
      const newNodeId = uuidv4();
      const newNode = {
        id: newNodeId,
        x,
        y,
        z,
        is3D: true,
        plane: active3DPlane,
        isFixed: false,
      };

      setSketchNodes((prev: Record<string, any>) => ({
        ...prev,
        [newNodeId]: newNode,
      }));

      // If shift is held and there's a last node, create an edge
      if (lastClickedNodeId && sketchNodes[lastClickedNodeId]) {
        const edgeId = uuidv4();
        setSketchEdges((prev: Record<string, any>) => ({
          ...prev,
          [edgeId]: {
            id: edgeId,
            type: 'LINE',
            nodeIds: [lastClickedNodeId, newNodeId],
            is3D: true,
          },
        }));
      }

      setLastClickedNodeId(newNodeId);
    },
    [is3DMode, active3DPlane, lastClickedNodeId, sketchNodes, setSketchNodes, setSketchEdges, setLastClickedNodeId]
  );

  return {
    handlePointerDown,
    active: is3DMode && active3DPlane !== null,
  };
}
