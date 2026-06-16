'use client';

import React, { useState, useCallback } from 'react';

const SHEET_SIZES = [
  { id: 'A4', width: 210, height: 297, label: 'A4 (210×297)' },
  { id: 'A3', width: 297, height: 420, label: 'A3 (297×420)' },
  { id: 'A2', width: 420, height: 594, label: 'A2 (420×594)' },
  { id: 'A1', width: 594, height: 841, label: 'A1 (594×841)' },
  { id: 'A0', width: 841, height: 1189, label: 'A0 (841×1189)' },
];

interface SheetFormatSelectorProps {
  currentSize: string;
  onChange: (size: string) => void;
}

export const SheetFormatSelector: React.FC<SheetFormatSelectorProps> = ({
  currentSize,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const selected = SHEET_SIZES.find(s => s.id === currentSize) || SHEET_SIZES[0];

  const handleSelect = useCallback((size: string) => {
    onChange(size);
    setIsOpen(false);
  }, [onChange]);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50"
        title="Sheet Format"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <line x1="3" y1="9" x2="21" y2="9"/>
        </svg>
        {selected.label}
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute z-20 mt-1 bg-white border border-slate-300 rounded shadow-lg min-w-[180px]">
            <div className="px-2 py-1 bg-slate-100 text-[9px] font-black text-slate-500 uppercase tracking-wider">
              Sheet Format
            </div>
            {SHEET_SIZES.map((size) => (
              <button
                key={size.id}
                onClick={() => handleSelect(size.id)}
                className={`w-full text-left px-3 py-1.5 text-[11px] font-semibold hover:bg-blue-50 transition-colors flex items-center gap-2 ${
                  currentSize === size.id ? 'text-blue-600 bg-blue-50' : 'text-slate-700'
                }`}
              >
                <span className="w-4 h-4 border border-current rounded-sm flex items-center justify-center text-[7px]">
                  {size.id[0]}
                </span>
                {size.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
