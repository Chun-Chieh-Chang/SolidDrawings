import React from 'react';
import { SketchNode, SketchEdge } from '@/store/useCadStore';

interface SelectionRolloutProps {
  selectedNodes: SketchNode[];
  selectedEdges: SketchEdge[];
  selectedEntityIds: string[];
  handleDeleteEntities: () => Promise<void>;
}

export const SelectionRollout: React.FC<SelectionRolloutProps> = ({
  selectedNodes,
  selectedEdges,
  selectedEntityIds,
  handleDeleteEntities,
}) => {
  return (
    <div className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
      <div className="px-2 py-1 bg-slate-100 border-b border-slate-300 flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-700">Selected Entities</span>
        <button onClick={handleDeleteEntities} className="text-[10px] text-red-600 hover:underline border-none bg-transparent cursor-pointer">Delete All</button>
      </div>
      <div className="p-2 max-h-[120px] overflow-y-auto space-y-1">
        {selectedNodes.map(node => (
          <div key={node.id} className="flex items-center gap-2 px-2 py-1 bg-blue-50 text-blue-800 text-[11px] rounded border border-blue-100 font-mono">
            <span className="opacity-50">●</span> Point: ({node.x.toFixed(1)}, {node.y.toFixed(1)})
          </div>
        ))}
        {selectedEdges.map(edge => (
          <div key={edge.id} className="flex items-center gap-2 px-2 py-1 bg-sky-50 text-sky-800 text-[11px] rounded border border-sky-100 font-mono">
            <span className="opacity-50">/</span> {edge.type} ({edge.id.slice(0, 4)})
          </div>
        ))}
        {selectedEntityIds.length === 0 && (
          <div className="text-[11px] text-slate-400 italic text-center py-2">No selection</div>
        )}
      </div>
    </div>
  );
};
