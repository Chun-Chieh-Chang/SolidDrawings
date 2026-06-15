'use client';

import React, { useState } from 'react';

// SOLIDWORKS 2010 style CommandManager tabs
// Replaces the current RibbonController with SW-style tabs

export type CommandTab = 
  | 'STANDARD' 
  | 'SKETCH' 
  | 'FEATURES' 
  | 'SURFACES' 
  | 'ANNOTATIONS'
  | 'MOTION'
  | 'EVALUATE'
  | 'ASSEMBLY'
  | 'DRAWING';

interface SWCommandManagerProps {
  activeTab: CommandTab;
  setActiveTab: (tab: CommandTab) => void;
}

const TAB_DEFINITIONS: { id: CommandTab; label: string; icon: string }[] = [
  { id: 'STANDARD', label: 'Standard', icon: '📁' },
  { id: 'SKETCH', label: 'Sketch', icon: '✏️' },
  { id: 'FEATURES', label: 'Features', icon: '🔧' },
  { id: 'SURFACES', label: 'Surfaces', icon: '📐' },
  { id: 'ANNOTATIONS', label: 'Annotations', icon: '📝' },
  { id: 'MOTION', label: 'Motion', icon: '⚙️' },
  { id: 'EVALUATE', label: 'Evaluate', icon: '📊' },
  { id: 'ASSEMBLY', label: 'Assembly', icon: '🧩' },
  { id: 'DRAWING', label: 'Drawing', icon: '📄' },
];

export const SWCommandManager: React.FC<SWCommandManagerProps> = ({ activeTab, setActiveTab }) => {
  return (
    <div className="w-full bg-gradient-to-r from-[#D6DADC] to-[#E8E8E8] border-b border-[#A0A0A0] select-none">
      {/* Tab bar */}
      <div className="flex items-end px-2 h-[32px] gap-0">
        {TAB_DEFINITIONS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={px-4 py-1 text-[11px] font-bold transition-all border-b-[3px] flex items-center gap-1.5 }
          >
            <span className="text-[12px]">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};
