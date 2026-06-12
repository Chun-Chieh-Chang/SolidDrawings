'use client';

import React, { useState, useMemo } from 'react';
import { useCadStore, CADConfiguration } from '../../store/useCadStore';

interface DesignTableModalProps {
  onClose: () => void;
}

export const DesignTableModal: React.FC<DesignTableModalProps> = ({ onClose }) => {
  const { 
    configurations, 
    features, 
    setConfigurations, 
    pushToast,
    markProjectDirty 
  } = useCadStore();

  const [localConfigs, setLocalConfigs] = useState<CADConfiguration[]>(
    JSON.parse(JSON.stringify(configurations))
  );

  // Identify all parameters and features that are used across any configuration
  const columns = useMemo(() => {
    const cols: { featId: string, featName: string, param: string | 'SUPPRESSION' }[] = [];
    
    features.forEach(f => {
      // 1. Suppression column for each feature
      cols.push({ featId: f.id, featName: f.name, param: 'SUPPRESSION' });
      
      // 2. Notable parameters (width, height, depth, radius, distance, etc.)
      const paramsToTrack = ['width', 'height', 'depth', 'radius', 'distance', 'angle', 'thickness'];
      Object.keys(f.parameters).forEach(p => {
        if (paramsToTrack.includes(p)) {
          cols.push({ featId: f.id, featName: f.name, param: p });
        }
      });
    });
    
    return cols;
  }, [features]);

  const handleUpdate = (configId: string, featId: string, param: string, value: any) => {
    setLocalConfigs(prev => prev.map(c => {
      if (c.id === configId) {
        if (param === 'SUPPRESSION') {
          return { 
            ...c, 
            featureSuppression: { ...c.featureSuppression, [featId]: value } 
          };
        } else {
          const currentOverrides = c.parameterOverrides[featId] || {};
          return {
            ...c,
            parameterOverrides: {
              ...c.parameterOverrides,
              [featId]: { ...currentOverrides, [param]: value }
            }
          };
        }
      }
      return c;
    }));
  };

  const saveAll = () => {
    setConfigurations(localConfigs);
    markProjectDirty();
    pushToast('Design Table synchronized to model.', 'info');
    onClose();
  };

  return (
    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[1100] p-8">
      <div className="w-full h-full bg-[#F1F5F9] border border-slate-300 rounded-lg shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 to-emerald-600 p-4 flex justify-between items-center text-white shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xl">📊</span>
            <div>
              <h3 className="text-[14px] font-black tracking-wider uppercase leading-none">模型設計表 (Design Table)</h3>
              <p className="text-[10px] opacity-80 mt-1 font-bold">SOLIDWORKS 2010 PARITY BATCH EDITOR</p>
            </div>
          </div>
          <button onClick={onClose} className="hover:text-slate-200 text-2xl font-bold leading-none">×</button>
        </div>

        {/* Table Area */}
        <div className="flex-1 overflow-auto bg-white p-4 custom-scrollbar">
          <table className="min-w-full border-collapse border border-slate-200 shadow-sm">
            <thead className="sticky top-0 bg-slate-50 z-20">
              <tr>
                <th className="border border-slate-300 p-2 text-[11px] font-black text-slate-500 uppercase bg-slate-100 w-48 text-left">Configuration</th>
                {columns.map((col, idx) => (
                  <th key={idx} className="border border-slate-300 p-2 text-[10px] font-black text-slate-700 uppercase bg-slate-50 min-w-[100px]">
                    <div className="text-primary truncate">{col.featName}</div>
                    <div className="text-[8px] opacity-60">{col.param}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {localConfigs.map((config) => (
                <tr key={config.id} className="hover:bg-slate-50 group">
                  <td className="border border-slate-300 p-2 bg-slate-50/50 sticky left-0 z-10 group-hover:bg-slate-100">
                    <span className="text-[12px] font-black text-slate-800">{config.name}</span>
                  </td>
                  {columns.map((col, idx) => {
                    if (col.param === 'SUPPRESSION') {
                      const isSuppressed = !!config.featureSuppression[col.featId];
                      return (
                        <td key={idx} className="border border-slate-300 p-2 text-center">
                          <button 
                            onClick={() => handleUpdate(config.id, col.featId, 'SUPPRESSION', !isSuppressed)}
                            className={`w-full py-1 rounded text-[9px] font-black tracking-tighter transition-all ${
                              isSuppressed 
                                ? 'bg-amber-100 text-amber-700 border border-amber-200' 
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-100 hover:border-emerald-300'
                            }`}
                          >
                            {isSuppressed ? 'SUPPRESSED' : 'RESOLVED'}
                          </button>
                        </td>
                      );
                    } else {
                      // Parameter Overrides
                      const featInConfig = config.parameterOverrides[col.featId] || {};
                      const value = featInConfig[col.param] ?? features.find(f => f.id === col.featId)?.parameters[col.param] ?? 0;
                      
                      return (
                        <td key={idx} className="border border-slate-300 p-0">
                          <input 
                            type="number"
                            step="any"
                            value={value}
                            onChange={(e) => handleUpdate(config.id, col.featId, col.param, parseFloat(e.target.value) || 0)}
                            className="w-full h-full p-2 text-center text-[12px] font-mono font-bold bg-transparent outline-none focus:bg-indigo-50 focus:text-indigo-700 transition-colors"
                          />
                        </td>
                      );
                    }
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-slate-300 p-4 flex justify-between items-center shrink-0">
          <p className="text-[11px] text-slate-400 font-bold italic flex items-center gap-2">
            <span className="text-emerald-500">ℹ️</span> 
            Double-click a configuration name to activate it in the model (currently batch-editing only).
          </p>
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="px-6 py-2 border border-slate-300 text-slate-600 rounded font-bold text-[12px] hover:bg-slate-50 transition-all"
            >
              取消 (Cancel)
            </button>
            <button 
              onClick={saveAll}
              className="px-8 py-2 bg-emerald-600 text-white rounded font-black text-[12px] shadow-lg shadow-emerald-200 hover:bg-emerald-700 hover:-translate-y-0.5 transition-all"
            >
              同步至模型 (Sync to Model)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
