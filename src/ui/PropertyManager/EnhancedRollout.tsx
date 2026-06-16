'use client';

import React, { useState } from 'react';

interface RolloutProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

export const EnhancedRollout: React.FC<RolloutProps> = ({ title, children, defaultExpanded = true }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="border border-[#A0A0A0] rounded overflow-hidden bg-white shadow-sm">
      {/* Rollout Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-2 py-1 bg-gradient-to-r from-[#D6DADC] to-[#E8E8E8] hover:bg-[#E8E8E8] transition-colors"
      >
        <div className="flex items-center gap-1.5">
          <span className="text-[8px] transition-transform duration-150">▼</span>
          <span className="text-[10px] font-black text-[#005B9A] uppercase tracking-wide">{title}</span>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={(e) => { e.stopPropagation(); setIsExpanded(true); }}
            className="text-[9px] px-1 py-0.5 bg-white border border-[#A0A0A0] rounded hover:bg-[#005B9A] hover:text-white transition-colors"
            title="Expand All"
          >
            ⊞
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
            className="text-[9px] px-1 py-0.5 bg-white border border-[#A0A0A0] rounded hover:bg-[#005B9A] hover:text-white transition-colors"
            title="Collapse All"
          >
            ⊟
          </button>
        </div>
      </button>
      
      {/* Rollout Content */}
      {isExpanded && (
        <div className="p-2 space-y-2 bg-white">
          {children}
        </div>
      )}
    </div>
  );
};

// Sub-rollout for nested options
export const SubRollout: React.FC<{ title: string; children: React.ReactNode; defaultExpanded?: boolean }> = ({ title, children, defaultExpanded = false }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="ml-2 border-l-2 border-[#D6DADC] pl-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1 py-1 text-[10px] font-semibold text-slate-700 hover:text-[#005B9A] transition-colors"
      >
        <span className="text-[7px] transition-transform duration-150">▶</span>
        {title}
      </button>
      {isExpanded && <div className="pl-4 mt-1">{children}</div>}
    </div>
  );
};
