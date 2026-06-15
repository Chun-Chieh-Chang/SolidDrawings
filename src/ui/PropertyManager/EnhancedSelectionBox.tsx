'use client';

import React, { useState } from 'react';

interface SelectionBoxProps {
  label: string;
  selected: string;
  placeholder?: string;
  onSelect: (selection: string) => void;
  clearable?: boolean;
}

export const EnhancedSelectionBox: React.FC<SelectionBoxProps> = ({ 
  label, 
  selected, 
  placeholder = 'Select...', 
  onSelect, 
  clearable = true 
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-bold text-[#404040] uppercase tracking-wider">{label}</label>
      <div className={lex items-center gap-1 border rounded transition-colors }>
        <div className="flex-1 px-2 py-1 text-[11px] font-semibold text-[#404040] min-w-[80px]">
          {selected || placeholder}
        </div>
        <div className="flex items-center gap-0.5 px-1">
          {clearable && selected && (
            <button
              onClick={() => onSelect('')}
              className="text-xs text-red-500 hover:text-red-700 font-bold p-0.5 rounded hover:bg-red-50"
              title="Clear Selection"
            >
              ✕
            </button>
          )}
          <button
            onClick={() => {
              const url = window.location.href;
              onSelect('Selected from viewport');
            }}
            className="text-xs text-[#005B9A] hover:text-[#003d66] font-bold p-0.5 rounded hover:bg-blue-50"
            title="Pick from graphics area"
          >
            🎯
          </button>
          <span className="text-xs text-slate-400">▼</span>
        </div>
      </div>
    </div>
  );
};
