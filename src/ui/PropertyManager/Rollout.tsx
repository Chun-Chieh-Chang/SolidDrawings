'use client';

import React, { useState } from 'react';

interface RolloutProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export const Rollout: React.FC<RolloutProps> = ({ title, icon, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-slate-300 rounded overflow-hidden mb-1 shadow-sm">
      <div 
        className="bg-[#EFEFEF] hover:bg-[#E5E5E5] px-2 py-1 flex items-center justify-between cursor-pointer border-b border-slate-200 select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] transition-transform duration-200 ${isOpen ? 'rotate-0' : '-rotate-90'}`}>▼</span>
          {icon && <div className="text-slate-600">{icon}</div>}
          <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">{title}</span>
        </div>
      </div>
      {isOpen && (
        <div className="p-2 bg-white space-y-2 animate-in slide-in-from-top-1 duration-100">
          {children}
        </div>
      )}
    </div>
  );
};
