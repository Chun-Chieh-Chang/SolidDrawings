'use client';

import React, { useState } from 'react';

interface CalloutItem {
  id: string;
  label: string;
  value: number | string;
  type?: 'number' | 'text' | 'checkbox' | 'dropdown';
  options?: string[];
  unit?: string;
}

interface CalloutsProps {
  items: CalloutItem[];
  onSubmit: () => void;
  onCancel: () => void;
}

export const Callouts: React.FC<CalloutsProps> = ({ items, onSubmit, onCancel }) => {
  const [values, setValues] = useState<Record<string, number | string | boolean>>(
    Object.fromEntries(items.map(item => [item.id, item.value])) as Record<string, number | string | boolean>
  );

  const handleChange = (id: string, newValue: string | number | boolean) => {
    setValues(prev => ({ ...prev, [id]: newValue }));
  };

  const handleSubmit = () => {
    onSubmit();
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#F5F5F5] border-t-2 border-[#005B9A] shadow-[0_-4px_12px_rgba(0,0,0,0.15)] z-40 transition-transform duration-200">
      {/* Callout Header */}
      <div className="flex items-center justify-between px-3 py-1 bg-gradient-to-r from-[#D6DADC] to-[#E8E8E8] border-b border-[#A0A0A0]">
        <span className="text-[11px] font-bold text-[#404040] tracking-wide">? Feature Callouts</span>
        <div className="flex items-center gap-2">
          <button onClick={onCancel} className="text-xs px-2 py-0.5 bg-white border border-[#A0A0A0] rounded hover:bg-red-50 hover:border-red-300 text-slate-600">
            ? Discard
          </button>
        </div>
      </div>
      
      {/* Callout Items */}
      <div className="flex items-center gap-6 px-4 py-2 min-h-[48px]">
        {items.map((item, index) => (
          <div key={item.id} className="flex items-center gap-2 min-w-[120px]">
            <label className="text-[10px] font-bold text-[#404040] uppercase whitespace-nowrap">
              {item.label}
            </label>
            {item.type === 'checkbox' ? (
              <input
                type="checkbox"
                checked={Boolean(values[item.id])}
                onChange={(e) => handleChange(item.id, e.target.checked)}
                className="w-3 h-3 border border-[#A0A0A0] rounded"
              />
            ) : item.type === 'dropdown' && item.options ? (
              <select
                value={String(values[item.id])}
                onChange={(e) => handleChange(item.id, e.target.value)}
                className="text-[11px] bg-white border border-[#A0A0A0] rounded px-1 py-0.5 outline-none font-semibold"
              >
                {item.options.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : (
              <input
                type={item.type === 'number' ? 'number' : 'text'}
                value={String(values[item.id])}
                onChange={(e) => handleChange(item.id, item.type === 'number' ? Number(e.target.value) : e.target.value)}
                className="w-20 text-[11px] bg-white border border-[#A0A0A0] rounded px-1.5 py-0.5 outline-none font-semibold text-right"
              />
            )}
            {item.unit && (
              <span className="text-[10px] text-slate-500">{item.unit}</span>
            )}
          </div>
        ))}
        
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={handleSubmit}
            className="w-7 h-7 flex items-center justify-center bg-[#28a745] text-white rounded text-xs font-bold hover:bg-[#218838] transition-colors shadow-sm"
            title="Push to End"
          >
            ?
          </button>
          <button
            onClick={onCancel}
            className="w-7 h-7 flex items-center justify-center bg-[#dc3545] text-white rounded text-xs font-bold hover:bg-[#c82333] transition-colors shadow-sm"
            title="Cancel"
          >
            ?
          </button>
        </div>
      </div>
    </div>
  );
};
