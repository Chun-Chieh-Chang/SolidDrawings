'use client';

import React, { useState } from 'react';
import { useCadStore } from '../store/useCadStore';
import { HeavyEngineClient } from '../kernel/HeavyEngineClient';

export const AssemblyTreePanel = () => {
  const {
    components,
    setComponents,
    activeComponentId,
    setActiveComponentId,
    setInterferenceMeshes,
    toggleLightweight,
    setAllLightweight,
    features,
    explodedView,
    setExplodedView,
    setExplosionFactor,
    setExplodedDirection,
    calculateAutoExplosion,
    saveExplodeStep,
    loadExplodeStep,
    deleteExplodeStep,
    setShowExportModal,
    mates,
    setMates,
    solverReport,
    solveMates,
    toggleMateSuppressed,
  } = useCadStore();

  const [newStepName, setNewStepName] = useState('');
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const [showStepManager, setShowStepManager] = useState(false);
  const [showMates, setShowMates] = useState(true);

  const handleToggleVisibility = (id: string) => {
    setComponents(components.map(c => c.id === id ? { ...c, visible: !c.visible } : c));
  };

  const handleSetAllLightweight = (light: boolean) => {
    setAllLightweight(light);
  };

  const handleDeleteComponent = (id: string) => {
    if (confirm('Remove this component from the assembly?')) {
      setComponents(components.filter(c => c.id !== id));
      if (activeComponentId === id) setActiveComponentId(null);
    }
  };

  const handleDirectionChange = (componentId: string, axis: 0 | 1 | 2, delta: number) => {
    const currentDir = explodedView.directions[componentId] || [0, 0, 1];
    const newDir = [...currentDir] as [number, number, number];
    newDir[axis] = Math.max(-1, Math.min(1, newDir[axis] + delta));
    // Renormalize
    const len = Math.sqrt(newDir[0]**2 + newDir[1]**2 + newDir[2]**2);
    if (len > 1e-6) {
      newDir[0] /= len;
      newDir[1] /= len;
      newDir[2] /= len;
    }
    setExplodedDirection(componentId, newDir);
  };

  const handleToggleDirPanel = (id: string) => {
    setExpandedDirs(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSaveStep = () => {
    const name = newStepName.trim() || `View ${explodedView.steps.length + 1}`;
    saveExplodeStep(name);
    setNewStepName('');
  };

  const handleDeleteStep = (index: number) => {
    deleteExplodeStep(index);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-left-2 duration-300">
      {/* Header */}
      <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-indigo-500 text-white rounded flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
          </div>
          <span className="text-[13px] font-black text-slate-800 uppercase tracking-wider">Assembly Tree</span>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {components.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-slate-200 rounded-lg bg-slate-50 text-[11px] text-slate-400 italic">
            No components added yet
          </div>
        ) : (
          components.map((comp) => (
            <div
              key={comp.id}
              onClick={() => setActiveComponentId(comp.id)}
              className={`p-2 rounded-lg border transition-all cursor-pointer group flex items-center justify-between ${
                activeComponentId === comp.id
                  ? 'bg-indigo-50 border-indigo-300'
                  : 'bg-white border-slate-100 hover:border-indigo-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">{comp.isFixed ? '📌' : '📦'}</span>
                <span className={`text-[12px] font-bold ${activeComponentId === comp.id ? 'text-indigo-800' : 'text-slate-700'}`}>
                  {comp.instanceName}
                </span>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => { e.stopPropagation(); toggleLightweight(comp.id); }}
                  className={`w-6 h-6 flex items-center justify-center rounded transition-all ${comp.isLightweight ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'hover:bg-slate-200 text-slate-500'}`}
                  title={comp.isLightweight ? "Switch to Fully Resolved" : "Switch to Lightweight"}
                >
                  <span className="text-[10px]">🪶</span>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleToggleVisibility(comp.id); }}
                  className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-200 text-slate-500"
                >
                  {comp.visible ? '👁️' : '🕶️'}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteComponent(comp.id); }}
                  className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-500 hover:text-white text-slate-400 font-bold"
                >
                  ×
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Exploded View Control */}
      <div className="p-3 bg-indigo-50/50 border-t border-indigo-100">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-black text-indigo-700 uppercase tracking-tight">Exploded View (Exploded)</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowStepManager(!showStepManager)}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                showStepManager 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'bg-white text-indigo-600 border border-indigo-200'
              }`}
              title="Exploded Step Management"
            >
              📋 Steps
            </button>
            <button
              onClick={() => {
                const nextActive = !explodedView.isActive;
                setExplodedView({ isActive: nextActive });
                if (nextActive && Object.keys(explodedView.directions).length === 0) {
                  calculateAutoExplosion();
                }
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                explodedView.isActive 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'bg-white text-indigo-600 border border-indigo-200'
              }`}
            >
              {explodedView.isActive ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
        
        {explodedView.isActive && (
          <div className="space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-indigo-600 font-medium">Explosion Factor</span>
              <span className="text-[10px] font-mono text-indigo-700">{(explodedView.factor * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={explodedView.factor}
              onChange={(e) => setExplosionFactor(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            
            {/* Step Manager */}
            {showStepManager && (
              <div className="mt-2 p-2 bg-white border border-indigo-100 rounded-lg space-y-1.5 animate-in fade-in duration-150">
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={newStepName}
                    onChange={(e) => setNewStepName(e.target.value)}
                    placeholder="Step name..."
                    className="flex-1 text-[10px] px-1.5 py-0.5 border border-indigo-200 rounded outline-none focus:border-indigo-400"
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveStep()}
                  />
                  <button
                    onClick={handleSaveStep}
                    className="px-2 py-0.5 text-[10px] font-bold bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                  >
                    + Save
                  </button>
                </div>
                
                {explodedView.steps.length > 0 && (
                  <div className="space-y-0.5 max-h-24 overflow-y-auto">
                    {explodedView.steps.map((step, idx) => (
                      <div key={idx} className={`flex items-center justify-between px-1.5 py-0.5 rounded text-[10px] ${idx === explodedView.currentStepIndex ? 'bg-indigo-100' : 'bg-slate-50'}`}>
                        <button
                          onClick={() => loadExplodeStep(idx)}
                          className="flex-1 text-left font-medium truncate"
                        >
                          {step.name}
                        </button>
                        <button
                          onClick={() => handleDeleteStep(idx)}
                          className="ml-1 px-1 text-[9px] text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            <button
              onClick={() => calculateAutoExplosion()}
              className="w-full mt-1 py-1 text-[9px] font-bold text-indigo-500 bg-white border border-indigo-100 rounded hover:bg-indigo-100 transition-colors"
            >
              Recalculate Explode Vectors
            </button>
          </div>
        )}

        {/* Per-Component Direction Editor */}
        {explodedView.isActive && explodedView.directions && Object.keys(explodedView.directions).length > 0 && (
          <div className="mt-2 border-t border-indigo-100 pt-2">
            <div className="text-[10px] font-bold text-indigo-600 mb-1">Component Explode Direction</div>
            <div className="max-h-40 overflow-y-auto space-y-0.5 pr-0.5">
              {components.map((comp) => {
                const dir = explodedView.directions[comp.id];
                const isExpanded = expandedDirs.has(comp.id);
                if (!dir) return null;
                
                return (
                  <div key={comp.id} className="border border-indigo-50 rounded overflow-hidden">
                    <button
                      onClick={() => handleToggleDirPanel(comp.id)}
                      className={`w-full flex items-center justify-between px-1.5 py-0.5 text-[10px] transition-colors ${
                        activeComponentId === comp.id ? 'bg-indigo-50 text-indigo-700' : 'bg-white text-slate-600 hover:bg-indigo-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <span>{comp.isFixed ? '📌' : '📦'}</span>
                        <span className="font-bold truncate">{comp.instanceName}</span>
                      </div>
                      <span className="text-[8px]">{isExpanded ? '▾' : '▸'}</span>
                    </button>
                    
                    {isExpanded && (
                      <div className="p-1.5 bg-indigo-50/30 space-y-1">
                        {(['X', 'Y', 'Z'] as const).map((axis, ai) => (
                          <div key={axis} className="flex items-center justify-between">
                            <span className="text-[9px] font-bold text-indigo-500 w-3">{axis}</span>
                            <div className="flex items-center gap-0.5">
                              <button
                                onClick={() => handleDirectionChange(comp.id, ai as 0 | 1 | 2, -0.1)}
                                className="w-4 h-4 flex items-center justify-center bg-white border border-indigo-200 rounded text-[8px] font-bold text-indigo-600 hover:bg-indigo-100 transition-colors"
                              >
                                −
                              </button>
                              <span className="w-8 text-center text-[9px] font-mono text-indigo-700">
                                {dir[ai].toFixed(2)}
                              </span>
                              <button
                                onClick={() => handleDirectionChange(comp.id, ai as 0 | 1 | 2, 0.1)}
                                className="w-4 h-4 flex items-center justify-center bg-white border border-indigo-200 rounded text-[8px] font-bold text-indigo-600 hover:bg-indigo-100 transition-colors"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        ))}
                        <button
                          onClick={() => {
                            handleDirectionChange(comp.id, 0, 0);
                            handleDirectionChange(comp.id, 1, 0);
                            handleDirectionChange(comp.id, 2, 0);
                          }}
                          className="w-full py-0.5 text-[8px] font-bold text-indigo-400 bg-white border border-indigo-100 rounded hover:bg-indigo-50 transition-colors"
                        >
                          Reset
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Mates List */}
      <div className="border-t border-slate-200">
        <button
          onClick={() => setShowMates(!showMates)}
          className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <span>Mates ({mates.length})</span>
          <span className="text-[9px]">{showMates ? '▾' : '▸'}</span>
        </button>
        {showMates && (
          <div className="px-2 pb-2 space-y-1 max-h-36 overflow-y-auto">
            {mates.length === 0 ? (
              <div className="text-[10px] text-slate-400 italic text-center py-2">
                No mates yet. Use Smart Mate to add.
              </div>
            ) : (
              mates.map((mate) => (
                <div
                  key={mate.id}
                  className={`flex items-center justify-between px-1.5 py-1 rounded text-[10px] ${
                    mate.suppressed ? 'bg-gray-100 opacity-60' : 'bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleMateSuppressed(mate.id); }}
                      className={`w-3 h-3 rounded shrink-0 flex items-center justify-center text-[7px] ${
                        mate.suppressed ? 'bg-red-200 text-red-600' : 'bg-white border border-gray-300'
                      }`}
                      title={mate.suppressed ? 'Suppressed' : 'Active'}
                    >
                      {mate.suppressed ? '×' : ''}
                    </button>
                    <span className={`font-medium truncate ${mate.suppressed ? 'line-through text-gray-400' : 'text-slate-700'}`}>
                      {mate.name}
                    </span>
                    <span className="text-[8px] text-slate-400 uppercase shrink-0">{mate.type}</span>
                  </div>
                  <button
                    onClick={() => setMates(mates.filter(m => m.id !== mate.id))}
                    className="text-red-300 hover:text-red-500 ml-1 shrink-0"
                    title="Delete mate"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" />
                    </svg>
                  </button>
                </div>
              ))
            )}
            {/* Solver status */}
            {solverReport && (
              <div className={`text-[9px] font-mono px-1 py-0.5 rounded ${
                solverReport.status === 'SOLVED' ? 'bg-green-50 text-green-700' :
                solverReport.status === 'ALL_FIXED' ? 'bg-blue-50 text-blue-600' :
                solverReport.status === 'ERROR' ? 'bg-red-50 text-red-600' :
                'bg-yellow-50 text-yellow-700'
              }`}>
                {solverReport.status === 'SOLVED' && `✓ Solved (residual: ${solverReport.residual?.toFixed(4)})`}
                {solverReport.status === 'ALL_FIXED' && '⛔ All components fixed'}
                {solverReport.status === 'FAILED' && `⚠ Solver failed (residual: ${solverReport.residual?.toFixed(4)})`}
                {solverReport.status === 'ERROR' && '✗ Solver error'}
                {solverReport.converged !== undefined && ` | ${solverReport.iterations} iters`}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Assembly Tools */}
      <div className="p-2 bg-slate-50 border-t border-slate-200 space-y-1.5">
        <button
          onClick={async () => {
            await solveMates();
          }}
          className="w-full py-1.5 px-2 text-[11px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded transition-colors flex items-center justify-center gap-1"
          disabled={mates.length === 0}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
          </svg>
          <span>Solve All Mates</span>
        </button>
        <div className="grid grid-cols-2 gap-1">
          <button
            onClick={() => handleSetAllLightweight(true)}
            className="py-1 px-2 text-[10px] font-bold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded transition-colors flex items-center justify-center gap-1"
          >
            <span>🪶</span> AllLightweight
          </button>
          <button
            onClick={() => handleSetAllLightweight(false)}
            className="py-1 px-2 text-[10px] font-bold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded transition-colors flex items-center justify-center gap-1"
          >
            <span>📦</span> AllResolved
          </button>
        </div>
        <button
          onClick={() => setShowExportModal(true)}
          className="w-full py-1.5 px-2 text-[12px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition-colors flex items-center justify-center gap-1"
        >
          <span>📥</span>
          <span>Industrial-gradeExport (Standard Export)</span>
        </button>
        <button
          onClick={async () => {
            if (components.length < 2) return alert('Requires at least twoComponentto proceedInterference Check');
            try {
              const client = HeavyEngineClient.getInstance();
              const res = await client.checkInterferences(components);
              if (res && res.length > 0) {
                useCadStore.getState().setInterferenceResults(res);
                setInterferenceMeshes(res.map((r: any) => r.mesh));
                alert(`Found ${res.length} interference(s)！Highlighted inFacewith red。`);
                useCadStore.getState().setInterferenceActive(true);
              } else {
                setInterferenceMeshes([]);
                alert('No interference detected，Assembly complete！');
              }
            } catch (err) {
              console.error(err);
              alert('Interference Checkfailed');
            }
          }}
          className="w-full py-1.5 px-2 text-[12px] font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded transition-colors flex items-center justify-center gap-1"
        >
          <span>⚠️</span>
          <span>Interference Check (Interference)</span>
        </button>
      </div>
    </div>
  );
};
