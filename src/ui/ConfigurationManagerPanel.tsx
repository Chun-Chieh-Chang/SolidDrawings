'use client';

import React, { useState } from 'react';
import { useCadStore, CADConfiguration } from '../store/useCadStore';
import { v4 as uuidv4 } from 'uuid';

export const ConfigurationManagerPanel: React.FC = () => {
  const { 
    configurations, 
    activeConfigurationId, 
    setActiveConfiguration, 
    addConfiguration,
    deleteConfiguration,
    features,
    toggleFeatureSuppression,
    pushToast
  } = useCadStore();

  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');

  const handleAddConfig = () => {
    if (!newName.trim()) return;
    
    // Capture current state for the new configuration
    const suppression: Record<string, boolean> = {};
    const overrides: Record<string, any> = {};
    features.forEach(f => {
      suppression[f.id] = !!f.isSuppressed;
      overrides[f.id] = JSON.parse(JSON.stringify(f.parameters));
    });

    const newConfig: CADConfiguration = {
      id: `cfg_${uuidv4().slice(0,8)}`,
      name: newName,
      featureSuppression: suppression,
      parameterOverrides: overrides
    };

    addConfiguration(newConfig);
    setNewName('');
    setIsAdding(false);
    pushToast(`Configuration '${newName}' created.`, 'info');
  };

  const handleDuplicate = (config: CADConfiguration) => {
    const newConfig: CADConfiguration = {
      ...JSON.parse(JSON.stringify(config)),
      id: `cfg_${uuidv4().slice(0,8)}`,
      name: `${config.name} (Copy)`
    };
    addConfiguration(newConfig);
    pushToast(`Duplicated ${config.name}`, 'info');
  };

  const activeConfig = configurations.find(c => c.id === activeConfigurationId) || configurations[0];

  return (
    <div className="flex-1 flex flex-col bg-[#F5F6F9] overflow-hidden">
      <div className="p-3 border-b border-slate-300 bg-white shadow-sm relative z-10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            Configurations
          </span>
          <button 
            onClick={() => setIsAdding(true)}
            className="w-5 h-5 flex items-center justify-center bg-indigo-600 text-white rounded shadow-sm hover:bg-indigo-700 transition-colors"
            title="Add Configuration"
          >
            <span className="text-lg leading-none">+</span>
          </button>
        </div>

        {isAdding && (
          <div className="flex gap-1 mb-2 animate-in slide-in-from-top-1 duration-200">
            <input 
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddConfig()}
              placeholder="Config Name..."
              className="flex-1 px-2 py-1 text-[12px] border border-slate-300 rounded outline-none focus:border-primary font-bold"
            />
            <button onClick={handleAddConfig} className="px-2 py-1 bg-primary text-white text-[10px] font-black rounded shadow-sm">ADD</button>
            <button onClick={() => setIsAdding(false)} className="px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded">×</button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {configurations.map((config) => (
          <div 
            key={config.id}
            onClick={() => setActiveConfiguration(config.id)}
            className={`group flex items-center justify-between p-2.5 rounded border transition-all ${
              config.id === activeConfigurationId 
                ? 'bg-white border-primary shadow-sm ring-1 ring-primary/20' 
                : 'bg-transparent border-transparent text-slate-600 hover:bg-slate-200/50'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`w-3 h-3 rounded-full flex items-center justify-center border ${config.id === activeConfigurationId ? 'bg-primary border-primary' : 'bg-white border-slate-300'}`}>
                {config.id === activeConfigurationId && <div className="w-1 h-1 bg-white rounded-full" />}
              </div>
              <span className={`text-[12px] truncate ${config.id === activeConfigurationId ? 'font-black text-slate-900' : 'font-bold'}`}>
                {config.name}
              </span>
            </div>
            
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={(e) => { e.stopPropagation(); handleDuplicate(config); }}
                className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                title="Duplicate"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              </button>
              {config.id !== 'default' && (
                <button 
                  onClick={(e) => { e.stopPropagation(); deleteConfiguration(config.id); }}
                  className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                  title="Delete"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Suppression Summary for Active Config */}
      <div className="p-3 bg-white border-t border-slate-300 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Active Config Details</span>
          <span className="text-[9px] font-bold text-indigo-500 bg-indigo-50 px-1 rounded">{activeConfig.name}</span>
        </div>
        <div className="max-h-[220px] overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
          {features.map(f => {
            const isSuppressed = activeConfig.featureSuppression[f.id];
            return (
              <div key={f.id} className="flex items-center justify-between text-[11px] group/item">
                <span className={`truncate flex-1 font-bold ${isSuppressed ? 'text-slate-300 line-through italic' : 'text-slate-600'}`}>
                  {f.name}
                </span>
                <button 
                  onClick={() => toggleFeatureSuppression(f.id)}
                  className={`ml-2 px-1.5 py-0.5 rounded text-[9px] font-black tracking-tighter transition-all border ${
                    isSuppressed 
                      ? 'bg-amber-50 text-amber-600 border-amber-200' 
                      : 'bg-white text-slate-400 border-slate-100 hover:border-indigo-300 hover:text-indigo-600'
                  }`}
                >
                  {isSuppressed ? 'SUPPRESSED' : 'ACTIVE'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
