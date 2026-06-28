'use client';

import React, { useState, useCallback } from 'react';

/**
 * Sheet Format Editor — SW2010-style sheet properties dialog.
 * Allows selecting sheet size, orientation, border style, and title block fields.
 */

const SHEET_SIZES = [
  { id: 'A4', width: 210, height: 297, label: 'A4' },
  { id: 'A3', width: 297, height: 420, label: 'A3' },
  { id: 'A2', width: 420, height: 594, label: 'A2' },
  { id: 'A1', width: 594, height: 841, label: 'A1' },
  { id: 'A0', width: 841, height: 1189, label: 'A0' },
];

const BORDER_STYLES = [
  { id: 'standard', label: 'Standard (Inner Border)' },
  { id: 'title_block', label: 'With Title Block' },
  { id: 'none', label: 'No Border' },
];

const TITLE_BLOCK_FIELDS = [
  { key: 'title', label: 'Title', default: '3D-Builder Drawing' },
  { key: 'partNo', label: 'Part No.', default: '3DB-001' },
  { key: 'material', label: 'Material', default: 'Steel' },
  { key: 'scale', label: 'Scale', default: '1:1' },
  { key: 'drawnBy', label: 'Drawn By', default: '—' },
  { key: 'checkedBy', label: 'Checked By', default: '—' },
  { key: 'approvedBy', label: 'Approved By', default: '—' },
  { key: 'date', label: 'Date', default: '2026-06-28' },
] as const;

interface SheetFormatEditorProps {
  visible: boolean;
  currentSize: string;
  currentOrientation: 'PORTRAIT' | 'LANDSCAPE';
  currentBorderStyle: string;
  titleBlockFields: Record<string, string>;
  onClose: () => void;
  onSizeChange: (size: string) => void;
  onOrientationChange: (orientation: 'PORTRAIT' | 'LANDSCAPE') => void;
  onBorderStyleChange: (style: string) => void;
  onTitleBlockFieldChange: (key: string, value: string) => void;
}

export const SheetFormatEditor: React.FC<SheetFormatEditorProps> = ({
  visible,
  currentSize,
  currentOrientation,
  currentBorderStyle,
  titleBlockFields,
  onClose,
  onSizeChange,
  onOrientationChange,
  onBorderStyleChange,
  onTitleBlockFieldChange,
}) => {
  if (!visible) return null;

  const selectedSize = SHEET_SIZES.find(s => s.id === currentSize) || SHEET_SIZES[0];
  const displayWidth = currentOrientation === 'LANDSCAPE' ? selectedSize.height : selectedSize.width;
  const displayHeight = currentOrientation === 'LANDSCAPE' ? selectedSize.width : selectedSize.height;

  return (
    <div className="fixed inset-0 bg-black/40 z-[2000] flex items-center justify-center" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-2xl w-[520px] max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#005B9A] text-white px-4 py-2.5 flex items-center justify-between">
          <span className="text-[12px] font-black uppercase tracking-wider">Sheet Properties</span>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/20 text-[14px] font-bold"
          >✕</button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Sheet Size Section */}
          <div className="mb-4">
            <div className="text-[10px] font-black text-[#005B9A] uppercase tracking-wider mb-2 pb-1 border-b border-slate-200">
              Sheet Size
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              {SHEET_SIZES.map((size) => (
                <button
                  key={size.id}
                  onClick={() => onSizeChange(size.id)}
                  className={`px-3 py-2 text-[11px] font-bold border rounded transition-all flex items-center gap-2 ${
                    currentSize === size.id
                      ? 'bg-[#005B9A] text-white border-[#005B9A]'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-[9px] opacity-70">{size.label}</span>
                  <span className="text-[8px] opacity-60">({size.width}×{size.height})</span>
                </button>
              ))}
            </div>

            {/* Orientation */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-slate-500">Orientation:</span>
              <button
                onClick={() => onOrientationChange('PORTRAIT')}
                className={`px-3 py-1 text-[10px] font-bold border rounded transition-all ${
                  currentOrientation === 'PORTRAIT'
                    ? 'bg-[#005B9A] text-white border-[#005B9A]'
                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                }`}
              >
                Portrait
              </button>
              <button
                onClick={() => onOrientationChange('LANDSCAPE')}
                className={`px-3 py-1 text-[10px] font-bold border rounded transition-all ${
                  currentOrientation === 'LANDSCAPE'
                    ? 'bg-[#005B9A] text-white border-[#005B9A]'
                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                }`}
              >
                Landscape
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="mb-4">
            <div className="text-[10px] font-black text-[#005B9A] uppercase tracking-wider mb-2 pb-1 border-b border-slate-200">
              Preview
            </div>
            <div className="bg-slate-100 border border-slate-300 rounded p-4 flex items-center justify-center">
              <div
                className="bg-white border-2 border-slate-800 relative flex items-center justify-center"
                style={{
                  width: `${Math.min(displayWidth * 0.3, 180)}px`,
                  height: `${Math.min(displayHeight * 0.3, 120)}px`,
                }}
              >
                <span className="text-[8px] text-slate-400 font-mono">
                  {displayWidth}×{displayHeight} mm
                </span>
              </div>
            </div>
          </div>

          {/* Border Style */}
          <div className="mb-4">
            <div className="text-[10px] font-black text-[#005B9A] uppercase tracking-wider mb-2 pb-1 border-b border-slate-200">
              Border Style
            </div>
            <div className="space-y-1">
              {BORDER_STYLES.map((style) => (
                <label
                  key={style.id}
                  className="flex items-center gap-2 px-2 py-1.5 text-[11px] text-slate-700 hover:bg-slate-50 rounded cursor-pointer"
                >
                  <input
                    type="radio"
                    name="borderStyle"
                    checked={currentBorderStyle === style.id}
                    onChange={() => onBorderStyleChange(style.id)}
                    className="accent-[#005B9A]"
                  />
                  {style.label}
                </label>
              ))}
            </div>
          </div>

          {/* Title Block Fields */}
          <div>
            <div className="text-[10px] font-black text-[#005B9A] uppercase tracking-wider mb-2 pb-1 border-b border-slate-200">
              Title Block Fields
            </div>
            <div className="grid grid-cols-2 gap-2">
              {TITLE_BLOCK_FIELDS.map((field) => (
                <div key={field.key} className="flex flex-col gap-0.5">
                  <label className="text-[9px] font-bold text-slate-500 uppercase">{field.label}</label>
                  <input
                    type="text"
                    value={titleBlockFields[field.key] || ''}
                    onChange={(e) => onTitleBlockFieldChange(field.key, e.target.value)}
                    className="px-2 py-1 text-[10px] border border-slate-300 rounded focus:outline-none focus:border-[#005B9A] focus:ring-1 focus:ring-[#005B9A]/20"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-[10px] font-bold text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-[10px] font-bold text-white bg-[#005B9A] border border-[#005B9A] rounded hover:bg-[#004A80] transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};
