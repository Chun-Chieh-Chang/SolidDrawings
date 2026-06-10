import { v4 as uuidv4 } from 'uuid';
import { useCadStore } from '../../../store/useCadStore';

export const TextToolHandler = {
  onMouseDown: (u: number, v: number) => {
    const { sketchNodes, setSketchNodes, sketchEdges, setSketchEdges, setSketchTool, commitPreciseSketchSolve } = useCadStore.getState();
    
    const nodeId = `node_${uuidv4()}`;
    const edgeId = `text_${uuidv4()}`;
    
    // Create an anchor node for the text
    setSketchNodes({
      ...sketchNodes,
      [nodeId]: { id: nodeId, x: u, y: v, isFixed: true }
    });
    
    // Create a special edge type for text
    setSketchEdges({
      ...sketchEdges,
      [edgeId]: { 
        id: edgeId, 
        type: 'TEXT' as any, // Temporary cast until type is updated
        nodeIds: [nodeId],
        parameters: {
          text: '3D Builder',
          height: 10,
          font: 'SingleLine'
        }
      } as any
    });
    
    setSketchTool('SELECT'); // Switch back to select after placing
    commitPreciseSketchSolve();
  }
};
