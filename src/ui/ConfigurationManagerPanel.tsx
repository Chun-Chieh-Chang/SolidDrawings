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
    toggleFeatureSuppression
  } = useCadStore();

  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');

  const handleAddConfig = () => {
    if (!newName.trim()) return;
    const newConfig: CADConfiguration = {
      id: uuidv4(),
      name: newName,
      featureSuppression: {},
      parameterOverrides: {}
    };
    addConfiguration(newConfig);
    setNewName('');
    setIsAdding(false);
  };

  const activeConfig = configurations.find(c => c.id === activeConfigurationId) || configurations[0];

  return (
    <div className="flex-1 flex flex-col bg-[#F5F6F9] overflow-hidden">
      <div className="p-3 border-b border-slate-300 bg-white">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider">Configurations</span>
          <button 
            onClick={() => setIsAdding(true)}
            className="w-5 h-5 flex items-center justify-center bg-emerald-500 text-white rounded shadow-sm hover:bg-emerald-600 transition-colors"
          >
            +
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
              className="flex-1 px-2 py-1 text-[12px] border border-slate-300 rounded outline-none focus:border-primary"
            />
            <button onClick={handleAddConfig} className="px-2 py-1 bg-primary text-white text-[10px] font-bold rounded">OK</button>
            <button onClick={() => setIsAdding(false)} className="px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded">X</button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {configurations.map((config) => (
          <div 
            key={config.id}
            onClick={() => setActiveConfiguration(config.id)}
            className={`group flex items-center justify-between p-2 rounded border cursor-pointer transition-all ${
              config.id === activeConfigurationId 
                ? 'bg-white border-primary shadow-sm text-primary' 
                : 'bg-transparent border-transparent text-slate-600 hover:bg-slate-200/50'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">{config.id === activeConfigurationId ? '🔘' : '⚪'}</span>
              <span className="text-[12px] font-bold truncate max-w-[180px]">{config.name}</span>
            </div>
            {config.id !== 'default' && (
              <button 
                onClick={(e) => { e.stopPropagation(); deleteConfiguration(config.id); }}
                className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 p-1"
              >
                🗑️
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Suppression Summary for Active Config */}
      <div className="p-3 bg-white border-t border-slate-300">
        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Feature Suppression State</span>
        <div className="max-h-[200px] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
          {features.map(f => {
            const isSuppressed = activeConfig.featureSuppression[f.id];
            return (
              <div key={f.id} className="flex items-center justify-between text-[11px] py-0.5">
                <span className={`truncate flex-1 ${isSuppressed ? 'text-slate-400 line-through italic' : 'text-slate-700 font-medium'}`}>
                  {f.name}
                </span>
                <button 
                  onClick={() => toggleFeatureSuppression(f.id)}
                  className={`ml-2 px-1.5 py-0.5 rounded text-[9px] font-black tracking-tighter ${
                    isSuppressed ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400 hover:bg-amber-50 hover:text-amber-600'
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
