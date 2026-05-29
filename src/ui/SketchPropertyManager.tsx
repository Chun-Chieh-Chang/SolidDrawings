'use client';

import React, { useMemo } from 'react';
import { useCadStore } from '../store/useCadStore';
import { previewSolve, commitPreciseSketchSolve } from '@/kernel/SketchSolverService';

export const SketchPropertyManager: React.FC = () => {
  const {
    selectedEntityIds,
    setSelectedEntityIds,
    sketchNodes,
    setSketchNodes,
    sketchEdges,
    setSketchEdges,
    sketchConstraints,
    setSketchConstraints
  } = useCadStore();

  const selectedNodes = useMemo(() => {
    return selectedEntityIds
      .filter(id => sketchNodes[id])
      .map(id => sketchNodes[id]);
  }, [selectedEntityIds, sketchNodes]);

  const selectedEdges = useMemo(() => {
    return selectedEntityIds
      .filter(id => sketchEdges[id])
      .map(id => sketchEdges[id]);
  }, [selectedEntityIds, sketchEdges]);

  const selectedConstraints = useMemo(() => {
    return Object.values(sketchConstraints).filter(c => {
      const nodeMatch = c.nodeIds?.some(id => selectedEntityIds.includes(id));
      const edgeMatch = c.edgeIds?.some(id => selectedEntityIds.includes(id));
      return nodeMatch || edgeMatch;
    });
  }, [selectedEntityIds, sketchConstraints]);

  const handleDeleteEntities = async () => {
    const nextNodes = { ...sketchNodes };
    const nextEdges = { ...sketchEdges };
    const nextConstraints = { ...sketchConstraints };

    const nodesToDelete = new Set<string>();
    const edgesToDelete = new Set<string>();

    selectedEntityIds.forEach(id => {
      if (nextNodes[id]) nodesToDelete.add(id);
      if (nextEdges[id]) edgesToDelete.add(id);
    });

    // Also delete dependent edges and constraints
    Object.values(nextEdges).forEach(edge => {
      if (edge.nodeIds.some(nid => nodesToDelete.has(nid))) {
        edgesToDelete.add(edge.id);
      }
    });

    Object.values(nextConstraints).forEach(c => {
      if (c.nodeIds?.some(nid => nodesToDelete.has(nid))) delete nextConstraints[c.id];
      if (c.edgeIds?.some(eid => edgesToDelete.has(eid))) delete nextConstraints[c.id];
    });

    nodesToDelete.forEach(id => delete nextNodes[id]);
    edgesToDelete.forEach(id => delete nextEdges[id]);

    setSketchNodes(nextNodes);
    setSketchEdges(nextEdges);
    setSketchConstraints(nextConstraints);
    setSelectedEntityIds([]);
    await commitPreciseSketchSolve();
    triggerRebuild();
  };

  const applyConstraint = async (type: 'COINCIDENT' | 'HORIZONTAL' | 'VERTICAL' | 'DISTANCE' | 'EQUAL' | 'CONCENTRIC' | 'TANGENT' | 'ANGLE') => {
    const cid = `c_${Date.now()}`;
    let newConstraint: any = { id: cid, type };

    if (type === 'HORIZONTAL' || type === 'VERTICAL') {
      if (selectedEdges.length === 1) {
        newConstraint.edgeIds = [selectedEdges[0].id];
      } else {
        return;
      }
    } else if (type === 'COINCIDENT') {
      if (selectedNodes.length === 2) {
        newConstraint.nodeIds = [selectedNodes[0].id, selectedNodes[1].id];
      } else {
        return;
      }
    } else if (type === 'DISTANCE') {
      if (selectedNodes.length === 2) {
        newConstraint.nodeIds = [selectedNodes[0].id, selectedNodes[1].id];
        newConstraint.value = Math.hypot(selectedNodes[0].x - selectedNodes[1].x, selectedNodes[0].y - selectedNodes[1].y);
      } else {
        return;
      }
    } else if (type === 'EQUAL') {
      if (selectedEdges.length === 2) {
        newConstraint.edgeIds = [selectedEdges[0].id, selectedEdges[1].id];
      } else {
        return;
      }
    } else if (type === 'CONCENTRIC') {
      if (selectedEdges.length === 2 && selectedEdges.every(e => e.type === 'CIRCLE')) {
        newConstraint.edgeIds = [selectedEdges[0].id, selectedEdges[1].id];
      } else {
        return;
      }
    } else if (type === 'TANGENT') {
      if (selectedEdges.length === 2) {
        newConstraint.edgeIds = [selectedEdges[0].id, selectedEdges[1].id];
      } else {
        return;
      }
    } else if (type === 'ANGLE') {
      if (selectedEdges.length === 2 && selectedEdges.every(e => e.type === 'LINE')) {
        newConstraint.edgeIds = [selectedEdges[0].id, selectedEdges[1].id];
        newConstraint.value = 90;
      } else {
        return;
      }
    }

    const nextConstraints = { ...sketchConstraints, [cid]: newConstraint };
    setSketchConstraints(nextConstraints);

    const previewNodes = previewSolve(sketchNodes, sketchEdges, nextConstraints, 6);
    setSketchNodes(previewNodes);
    await commitPreciseSketchSolve();
    triggerRebuild();
  };

  const deleteConstraint = async (cid: string) => {
    const nextConstraints = { ...sketchConstraints };
    delete nextConstraints[cid];
    setSketchConstraints(nextConstraints);
    await commitPreciseSketchSolve();
    triggerRebuild();
  };

  const triggerRebuild = () => {
    const rebuildHook = (window as any).__handleRebuild;
    if (rebuildHook) rebuildHook();
  };

  return (
    <div className="flex flex-col h-full bg-[#F5F6F9] select-none font-sans">
      {/* PropertyManager Header */}
      <div className="p-3 bg-white border-b border-slate-300 shadow-sm">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-[13px] font-black text-slate-800 uppercase tracking-tight">PropertyManager</h2>
          <div className="flex gap-1">
            <button className="w-5 h-5 rounded hover:bg-slate-100 flex items-center justify-center text-slate-400 border-none bg-transparent">?</button>
            <button className="w-5 h-5 rounded hover:bg-slate-100 flex items-center justify-center text-slate-400 border-none bg-transparent">×</button>
          </div>
        </div>
        <div className="text-[11px] text-slate-500 font-medium">
          {selectedEntityIds.length > 0 ? `Selected: ${selectedEntityIds.length} Entities` : 'Select entities to add relations'}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {/* Selection Rollout */}
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

        {/* Relations Rollout */}
        <div className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
          <div className="px-2 py-1 bg-slate-100 border-b border-slate-300">
            <span className="text-[11px] font-bold text-slate-700">Add Relations</span>
          </div>
          <div className="p-2 grid grid-cols-2 gap-1.5">
            {[
              { type: 'HORIZONTAL', label: 'Horizontal', icon: '—' },
              { type: 'VERTICAL', label: 'Vertical', icon: '|' },
              { type: 'COINCIDENT', label: 'Coincident', icon: '•' },
              { type: 'DISTANCE', label: 'Distance', icon: '↔' },
              { type: 'EQUAL', label: 'Equal', icon: '=' },
              { type: 'CONCENTRIC', label: 'Concentric', icon: '◎' },
              { type: 'TANGENT', label: 'Tangent', icon: '○' },
              { type: 'ANGLE', label: 'Angle', icon: '∠' }
            ].map(c => (
              <button
                key={c.type}
                onClick={() => applyConstraint(c.type as any)}
                className="flex flex-col items-center justify-center p-2 rounded border border-slate-200 hover:bg-blue-50 hover:border-blue-300 text-slate-600 hover:text-blue-700 transition-all bg-white cursor-pointer group"
              >
                <span className="text-lg font-bold group-hover:scale-110 transition-transform">{c.icon}</span>
                <span className="text-[9px] font-bold uppercase mt-1 tracking-tighter">{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Existing Constraints Rollout */}
        {selectedConstraints.length > 0 && (
          <div className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
            <div className="px-2 py-1 bg-slate-100 border-b border-slate-300 flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700">Existing Relations</span>
            </div>
            <div className="p-2 space-y-1">
              {selectedConstraints.map(c => (
                <div key={c.id} className="flex items-center justify-between p-1.5 bg-slate-50 border border-slate-200 rounded text-[11px]">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-700 uppercase text-[9px]">{c.type}</span>
                    <span className="text-slate-400 font-mono text-[9px]">{c.id.slice(0, 8)}</span>
                  </div>
                  <button 
                    onClick={() => deleteConstraint(c.id)}
                    className="w-5 h-5 rounded hover:bg-red-50 text-red-400 hover:text-red-600 flex items-center justify-center border-none bg-transparent cursor-pointer"
                  >×</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
