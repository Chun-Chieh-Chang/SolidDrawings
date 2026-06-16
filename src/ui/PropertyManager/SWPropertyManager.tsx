'use client';

import React from 'react';
import { Callouts } from './Callouts';
import { EnhancedRollout, SubRollout } from './EnhancedRollout';
import { EnhancedSelectionBox } from './EnhancedSelectionBox';

interface SWPropertyManagerProps {
  featureName: string;
  isActive: boolean;
  children: React.ReactNode;
  calloutItems?: {
    items: Array<{
      id: string;
      label: string;
      value: number | string;
      type?: 'number' | 'text' | 'checkbox' | 'dropdown';
      options?: string[];
      unit?: string;
    }>;
    onSubmit: () => void;
    onCancel: () => void;
  };
}

export const SWPropertyManager: React.FC<SWPropertyManagerProps> = ({
  featureName,
  isActive,
  children,
  calloutItems,
}) => {
  if (!isActive) return null;

  return (
    <>
      {/* PropertyManager Header */}
      <div className="h-[36px] flex items-center justify-between px-3 bg-gradient-to-r from-[#005B9A] to-[#0077CC] text-white shadow-md z-30">
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 3h18v18H3V3zm2 2v14h14V5H5zm2 2h4v4H7V7zm6 0h4v4h-4V7zm-6 6h4v4H7v-4zm6 0h4v4h-4v-4z"/>
          </svg>
          <span className="text-xs font-black uppercase tracking-widest">{featureName}</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="text-[10px] px-2 py-0.5 bg-white/20 hover:bg-white/30 rounded font-bold transition-colors">
            📎 Push to End
          </button>
        </div>
      </div>

      {/* PropertyManager Body */}
      <div className="flex-1 p-3 space-y-3 overflow-y-auto bg-white">
        {children}
      </div>

      {/* PropertyManager Footer */}
      <div className="h-[40px] flex items-center justify-between px-4 bg-[#F5F5F5] border-t border-[#A0A0A0] shadow-[0_-2px_4px_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500">Press ✓ to confirm</span>
        </div>
        <div className="flex items-center gap-1">
          <button className="w-7 h-7 flex items-center justify-center bg-[#28a745] text-white rounded text-xs font-bold hover:bg-[#218838] transition-colors shadow-sm">
            ✓
          </button>
          <button className="w-7 h-7 flex items-center justify-center bg-[#dc3545] text-white rounded text-xs font-bold hover:bg-[#c82333] transition-colors shadow-sm">
            ✕
          </button>
        </div>
      </div>

      {/* Callouts (optional) */}
      {calloutItems && (
        <Callouts {...calloutItems} />
      )}
    </>
  );
};
