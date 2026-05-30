'use client';

import React from 'react';
import { useCadStore } from '../store/useCadStore';
import { AssemblyService } from '../kernel/AssemblyService';
import { HeavyEngineClient } from '../kernel/HeavyEngineClient';

export const AssemblyTreePanel = () => {
  const {
    components,
    activeComponentId,
    setActiveComponentId,
    mates,
    setMates,
    setComponents,
    addComponent,
    removeComponent,
    projectName,
    updateComponentColor,
    setInterferenceMeshes,
    features,
  } = useCadStore();

  const handleRebuild = async () => {
    const assemblyService = new AssemblyService();
    const updated = await assemblyService.solve(components, mates, []);
    setComponents(updated);
  };

  const handleInsertComponent = () => {
    const isFirst = components.length === 0;
    const newComp = {
      id: `comp_${Date.now()}`,
      instanceName: `${projectName} (Instance ${components.length + 1})`,
      isFixed: isFirst,
      transform: {
        position: isFirst ? [0, 0, 0] : [10 + Math.random() * 20, 10 + Math.random() * 20, 10 + Math.random() * 20],
        rotation: [0, 0, 0]
      }
    };
    addComponent(newComp as any);
  };

  const handleDuplicate = (comp: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const newComp = {
      ...comp,
      id: `comp_${Date.now()}`,
      instanceName: `${comp.instanceName} (Copy)`,
      isFixed: false,
      transform: {
        position: [comp.transform.position[0] + 20, comp.transform.position[1] + 20, comp.transform.position[2] + 20],
        rotation: [...comp.transform.rotation]
      }
    };
    addComponent(newComp);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeComponentId === id) setActiveComponentId(null);
    removeComponent(id);
  };

  return (
    <div className="flex-1 overflow-y-auto p-3 flex flex-col group/panel">
      <div className="text-[11px] uppercase tracking-[0.2em] text-secondary-text mb-4 font-black flex justify-between items-center border-b border-border pb-2">
        <span>裝配體樹 (Assembly Tree)</span>
        <button
          type="button"
          onClick={handleRebuild}
          className="text-primary hover:text-primary-dark transition-all"
          title="重新解算配合 (Re-solve Mates)"
        >
          🔄
        </button>
      </div>

      <div className="mb-4 flex flex-col gap-2">
        <button
          onClick={handleInsertComponent}
          className="w-full py-1.5 px-2 text-[12px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded transition-colors flex items-center justify-center gap-1"
        >
          <span>➕</span>
          <span>插入組件 (Insert Component)</span>
        </button>
        <button
          onClick={async () => {
            if (components.length === 0) return alert('No components to export.');
            try {
              const res = await fetch('http://localhost:8000/api/v1/geometry/export_assembly/step', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ components, filename: `${projectName || 'assembly'}.step` })
              });
              if (!res.ok) throw new Error('Export failed');
              const data = await res.json();
              alert(`成功匯出至: ${data.filepath}`);
            } catch (err) {
              console.error(err);
              alert('匯出失敗');
            }
          }}
          className="w-full py-1.5 px-2 text-[12px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition-colors flex items-center justify-center gap-1"
        >
          <span>📥</span>
          <span>匯出 STEP (Export Assembly)</span>
        </button>
        <button
          onClick={async () => {
            if (components.length < 2) return alert('需要至少兩個組件才能進行干涉檢查');
            try {
              const client = HeavyEngineClient.getInstance();
              const req = components.map(c => ({ id: c.id, features, transform: c.transform }));
              const res = await client.detectInterference(req);
              if (res && res.length > 0) {
                setInterferenceMeshes(res.map(r => ({ data: r.mesh })));
                alert(`發現 ${res.length} 處干涉！已在畫面中以紅色高亮標示。`);
              } else {
                setInterferenceMeshes([]);
                alert('未偵測到干涉，組裝完美！');
              }
            } catch (err) {
              console.error(err);
              alert('干涉檢查失敗');
            }
          }}
          className="w-full py-1.5 px-2 text-[12px] font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded transition-colors flex items-center justify-center gap-1"
        >
          <span>⚠️</span>
          <span>干涉檢查 (Interference)</span>
        </button>
      </div>

      <div className="space-y-1.5 text-[14px] select-none">
        <div className="flex items-center gap-2 p-1 text-primary-text font-bold">
          <span>⚙️</span>
          <span>裝配體 (Assembly)</span>
        </div>
        
        <div className="pl-4 space-y-1 text-secondary-text">
          {components.length === 0 ? (
            <div className="text-[12px] italic text-slate-400 p-2 text-center">
              (尚未插入任何組件)
            </div>
          ) : (
            components.map((comp) => (
              <div
                key={comp.id}
                onClick={() => setActiveComponentId(comp.id === activeComponentId ? null : comp.id)}
                className={`group flex items-center justify-between p-1.5 rounded cursor-pointer transition-all border ${
                  activeComponentId === comp.id
                    ? 'bg-primary/10 border-primary/30 text-primary font-bold shadow-sm'
                    : 'hover:bg-slate-100 border-transparent hover:text-primary-text'
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <span>📦</span>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-[13px] leading-tight truncate w-[130px]">{comp.instanceName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {comp.isFixed ? '(固定 Fixed)' : '(浮動 Floating)'}
                    </span>
                  </div>
                </div>
                
                {/* Hover Actions */}
                <div className="hidden group-hover:flex items-center gap-1 pr-1 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      useCadStore.getState().toggleComponentFixed(comp.id);
                    }}
                    className={`w-6 h-6 flex items-center justify-center text-[12px] bg-white border rounded-sm shadow-sm transition-all ${
                      comp.isFixed ? 'border-amber-400 text-amber-600 bg-amber-50' : 'border-slate-200 text-slate-400 hover:text-amber-500 hover:border-amber-300'
                    }`}
                    title="切換固定/浮動 (Toggle Fixed/Floating)"
                  >
                    ⚓
                  </button>
                  <input
                    type="color"
                    value={comp.color || '#60A5FA'}
                    onChange={(e) => {
                      e.stopPropagation();
                      updateComponentColor(comp.id, e.target.value);
                    }}
                    title="設定顏色 (Set Color)"
                    className="w-6 h-6 p-0 border-0 cursor-pointer rounded-sm"
                  />
                  <button 
                    onClick={(e) => handleDuplicate(comp, e)}
                    className="w-6 h-6 flex items-center justify-center text-[12px] bg-white border border-slate-200 hover:border-indigo-400 hover:text-indigo-600 rounded-sm shadow-sm transition-all"
                    title="複製組件 (Duplicate)"
                  >
                    📄
                  </button>
                  <button 
                    onClick={(e) => handleDelete(comp.id, e)}
                    className="w-6 h-6 flex items-center justify-center text-[12px] bg-white border border-slate-200 hover:border-red-400 hover:bg-red-50 hover:text-red-600 rounded-sm shadow-sm transition-all"
                    title="刪除組件 (Delete)"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Mates List */}
      {mates.length > 0 && (
        <div className="flex-1 min-h-[150px] bg-white border border-slate-300 rounded shadow-sm flex flex-col overflow-hidden">
          <div className="h-[28px] bg-[#E8E8E8] flex items-center px-2 border-b border-slate-300 flex-shrink-0">
            <span className="text-[11px] font-bold text-slate-700 tracking-wider">配合 (Mates)</span>
            <span className="ml-auto text-[10px] text-slate-500 bg-slate-200 px-1.5 rounded">{mates.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-1 flex flex-col gap-1">
            {mates.map(mate => (
              <div key={mate.id} className="group flex items-center justify-between p-1.5 bg-slate-50 border border-slate-200 rounded hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="text-[12px]">🔗</span>
                  <div className="flex flex-col">
                    <span className="text-[12px] font-medium text-slate-700">{mate.name}</span>
                    <span className="text-[10px] text-slate-500">{mate.type}</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    useCadStore.getState().removeMate(mate.id);
                    // Rebuild after removing a mate
                    setTimeout(handleRebuild, 50);
                  }}
                  className="w-5 h-5 flex items-center justify-center text-[10px] text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors hidden group-hover:flex"
                  title="移除此約束 (Remove Mate)"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
