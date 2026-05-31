'use client';

import React from 'react';

interface SelectionBoxProps {
  label: string;
  items?: { id: string, name: string }[];
  selectedCount?: number;
  onRemove?: (id: string) => void;
  onClear: () => void;
  placeholder?: string;
  maxHeight?: string;
  active?: boolean;
  onClick?: () => void;
}

export const SelectionBox: React.FC<SelectionBoxProps> = ({ 
  label, 
  items = [], 
  selectedCount,
  onRemove, 
  onClear, 
  placeholder = 'Select entities...', 
  maxHeight = '100px',
  active = false,
  onClick
}) => {
  const count = selectedCount !== undefined ? selectedCount : items.length;

  return (
    <div className="space-y-1" onClick={onClick}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <label className={`text-[10px] font-black uppercase tracking-widest transition-colors ${active ? 'text-primary' : 'text-slate-500'}`}>
            {label}
          </label>
          {count > 0 && (
            <span className="bg-primary text-white text-[9px] font-black px-1.5 rounded-full min-w-[16px] h-4 flex items-center justify-center">
              {count}
            </span>
          )}
        </div>
        {count > 0 && (
          <button 
            onClick={(e) => { e.stopPropagation(); onClear(); }}
            className="text-[9px] text-red-500 font-bold hover:underline"
          >
            Clear All
          </button>
        )}
      </div>
      <div 
        className={`border rounded transition-all p-1 min-h-[40px] flex flex-col gap-1 cursor-pointer ${
          active 
            ? 'border-primary bg-primary/5 ring-1 ring-primary/20 shadow-inner' 
            : 'border-slate-300 bg-[#F9FBFF] hover:border-slate-400'
        }`}
        style={{ maxHeight }}
      >
        {count === 0 ? (
          <div className="text-[11px] text-slate-400 italic px-1 py-1">{placeholder}</div>
        ) : items.length > 0 ? (
          items.map((item) => (
            <div 
              key={item.id} 
              className="bg-white text-[#005B9A] text-[11px] font-bold px-2 py-0.5 rounded border border-[#B8D4FF] flex items-center justify-between group hover:shadow-sm transition-all"
            >
              <span className="truncate">{item.name}</span>
              <button 
                onClick={(e) => { e.stopPropagation(); onRemove?.(item.id); }}
                className="text-slate-300 hover:text-red-500 font-black text-[12px] leading-none transition-colors"
              >
                ×
              </button>
            </div>
          ))
        ) : (
          <div className="text-[11px] text-primary font-black px-1 py-1">
            {count} Entities Selected
          </div>
        )}
      </div>
    </div>
  );
};
