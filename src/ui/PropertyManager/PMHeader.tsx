'use client';

import React from 'react';

interface PMHeaderProps {
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const PMHeader: React.FC<PMHeaderProps> = ({ title, onConfirm, onCancel }) => {
  return (
    <div className="flex items-center justify-between bg-[#F8F9FA] border-b border-slate-300 p-1 mb-2 sticky top-0 z-20">
      <div className="flex items-center gap-1">
        <button 
          onClick={onConfirm}
          className="w-8 h-8 flex items-center justify-center bg-[#D4EDDA] border border-[#C3E6CB] rounded hover:bg-[#C3E6CB] text-emerald-700 transition-colors shadow-sm"
          title="OK (Confirm)"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </button>
        <button 
          onClick={onCancel}
          className="w-8 h-8 flex items-center justify-center bg-[#F8D7DA] border border-[#F5C6CB] rounded hover:bg-[#F5C6CB] text-red-700 transition-colors shadow-sm"
          title="Cancel"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div className="flex-1 px-3 text-center">
        <span className="text-[12px] font-black text-slate-700 uppercase tracking-wider truncate block">{title}</span>
      </div>
      <div className="w-16" /> {/* Spacer for balance */}
    </div>
  );
};
