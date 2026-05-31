'use client';

import React, { useState, useMemo } from 'react';
import { useCadStore } from '../../store/useCadStore';
import { EquationEngine } from '../../utils/EquationEngine';

interface EquationsModalProps {
  onClose: () => void;
}

export const EquationsModal: React.FC<EquationsModalProps> = ({ onClose }) => {
  const { globalVariables, setGlobalVariable, removeGlobalVariable, evaluatedVariables } = useCadStore();
  const [newVarName, setNewVarName] = useState('');
  const [newVarValue, setNewVarValue] = useState('');

  const handleAdd = () => {
    if (!newVarName.trim() || !newVarValue.trim()) return;
    setGlobalVariable(newVarName, newVarValue);
    setNewVarName('');
    setNewVarValue('');
  };

  const variables = Object.entries(globalVariables);

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-[700px] max-h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">∑</span>
            <div className="flex flex-col">
              <h3 className="text-white font-black uppercase tracking-widest text-sm">Equations & Global Variables</h3>
              <span className="text-[10px] text-slate-400 font-bold">SOLIDWORKS 2000 PARAMETRIC ENGINE</span>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 bg-slate-50">
          <table className="w-full text-left border-collapse bg-white rounded-lg shadow-sm overflow-hidden">
            <thead>
              <tr className="bg-slate-100 text-[11px] font-black uppercase text-slate-600 border-b border-slate-200">
                <th className="px-4 py-3 w-[200px]">Global Variable</th>
                <th className="px-4 py-3">Value / Equation</th>
                <th className="px-4 py-3 w-[120px] text-right">Evaluated</th>
                <th className="px-4 py-3 w-[60px]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {variables.map(([name, formula]) => (
                <tr key={name} className="hover:bg-indigo-50/30 transition-colors group">
                  <td className="px-4 py-2 font-mono text-[12px] font-bold text-indigo-700">{name}</td>
                  <td className="px-4 py-2">
                    <input 
                      className="w-full bg-transparent border-none outline-none font-mono text-[12px] text-slate-800"
                      value={formula}
                      onChange={(e) => setGlobalVariable(name, e.target.value)}
                    />
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-[12px] font-black text-emerald-600">
                    {evaluatedVariables[name]?.toFixed(3) || 'Error'}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button 
                      onClick={() => removeGlobalVariable(name)}
                      className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}

              {/* Add New Row */}
              <tr className="bg-emerald-50/50">
                <td className="px-4 py-3">
                  <input 
                    placeholder="NAME..."
                    className="w-full bg-white border border-emerald-200 rounded px-2 py-1 font-mono text-[12px] uppercase outline-none focus:border-emerald-500"
                    value={newVarName}
                    onChange={(e) => setNewVarName(e.target.value.toUpperCase())}
                  />
                </td>
                <td className="px-4 py-3">
                  <input 
                    placeholder="EQUATION..."
                    className="w-full bg-white border border-emerald-200 rounded px-2 py-1 font-mono text-[12px] outline-none focus:border-emerald-500"
                    value={newVarValue}
                    onChange={(e) => setNewVarValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <button 
                    onClick={handleAdd}
                    className="bg-emerald-600 text-white px-3 py-1 rounded text-[10px] font-black uppercase hover:bg-emerald-700 shadow-sm"
                  >
                    Add
                  </button>
                </td>
                <td></td>
              </tr>
            </tbody>
          </table>

          {variables.length === 0 && (
            <div className="text-center py-10 text-slate-400 italic text-sm">
              No equations defined. Parametric design intent starts here.
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 border-t border-slate-200 text-[10px] text-slate-500 font-medium bg-white flex justify-between">
          <span>HINT: DIMENSIONS CAN BE LINKED TO THESE BY ENTERING "=" FOLLOWED BY THE EXPRESSION.</span>
          <span>REBUILD DIRTY: {Object.keys(globalVariables).length > 0 ? 'YES' : 'NO'}</span>
        </div>
      </div>
    </div>
  );
};
