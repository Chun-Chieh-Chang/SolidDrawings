'use client';

import React, { useState } from 'react';

export const TaskPane: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('resources');
  const [isVisible, setIsVisible] = useState(true);
  const [width, setWidth] = useState(320);

  const tabs = [
    { id: 'resources', label: 'SW Resources', icon: '📖' },
    { id: 'library', label: 'Design Lib', icon: '📚' },
    { id: 'standards', label: 'Standards', icon: '📐' },
    { id: 'annotation', label: 'Annotation', icon: '✏️' },
  ];

  if (!isVisible) {
    return (
      <div 
        className="fixed right-0 top-[64px] bottom-0 w-[16px] bg-[#E8E8E8] border-l border-[#A0A0A0] flex items-center justify-center cursor-pointer hover:bg-[#D6D6D6] z-30"
        style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', fontSize: '10px', fontWeight: 'bold', color: '#404040', letterSpacing: '2px' }}
        onClick={() => setIsVisible(true)}
      >
        Task Pane
      </div>
    );
  }

  return (
    <div 
      className="fixed right-0 top-[64px] bottom-0 bg-white border-l border-[#A0A0A0] flex flex-col z-30 shadow-lg"
      style={{ width: \\px\ }}
    >
      {/* Tab bar */}
      <div className="flex items-center bg-[#F5F5F5] border-b border-[#A0A0A0]">
        <div className="flex flex-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={px-3 py-1.5 text-[10px] font-bold border-r border-[#A0A0A0] transition-colors flex flex-col items-center gap-0.5 \}
            >
              <span className="text-sm">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
        <button 
          onClick={() => setIsVisible(false)}
          className="px-2 py-1.5 text-slate-500 hover:text-slate-800 hover:bg-white/50 border-l border-[#A0A0A0] text-xs"
        >
          ✕
        </button>
      </div>
      
      {/* Content area */}
      <div className="flex-1 overflow-y-auto p-2">
        {activeTab === 'resources' && <SolidWorksResources />}
        {activeTab === 'library' && <DesignLibrary />}
        {activeTab === 'standards' && <Standards />}
        {activeTab === 'annotation' && <AnnotationWizard />}
      </div>
      
      {/* Resize handle */}
      <div 
        className="h-[4px] bg-[#A0A0A0] cursor-col-resize hover:bg-[#005B9A]"
        onMouseDown={(e) => {
          const startY = e.clientY;
          const startWidth = width;
          const handleMove = (ev: MouseEvent) => {
            const newWidth = startWidth - (ev.clientY - startY);
            setWidth(Math.max(200, Math.min(600, newWidth)));
          };
          const handleUp = () => {
            document.removeEventListener('mousemove', handleMove);
            document.removeEventListener('mouseup', handleUp);
          };
          document.addEventListener('mousemove', handleMove);
          document.addEventListener('mouseup', handleUp);
        }}
      />
    </div>
  );
};

const SolidWorksResources: React.FC = () => (
  <div className="space-y-3">
    <h3 className="text-xs font-bold text-[#005B9A] border-b border-[#A0A0A0] pb-1">SOLIDWORKS Resources</h3>
    <div className="space-y-2">
      {[
        { title: 'Getting Started', desc: 'Tutorial series for beginners' },
        { title: 'Customer Portal', desc: 'Login for support' },
        { title: 'Technical Support', desc: 'Download updates' },
        { title: 'Knowledge Base', desc: 'Search for answers' },
        { title: 'User Groups', desc: 'Find local groups' },
      ].map((item, i) => (
        <div key={i} className="flex items-start gap-2 p-2 bg-[#F5F5F5] rounded hover:bg-[#E8E8E8] cursor-pointer">
          <span className="text-lg">🔗</span>
          <div>
            <div className="text-[11px] font-bold text-[#404040]">{item.title}</div>
            <div className="text-[10px] text-slate-500">{item.desc}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const DesignLibrary: React.FC = () => (
  <div className="space-y-3">
    <h3 className="text-xs font-bold text-[#005B9A] border-b border-[#A0A0A0] pb-1">Design Library</h3>
    <div className="space-y-2">
      {[
        { title: 'Part Library', desc: 'Standard parts and components' },
        { title: 'Feature Library', desc: 'Reusable features' },
        { title: 'Surface Library', desc: 'Standard surfaces' },
        { title: 'Toolbox', desc: 'Fasteners and hardware' },
      ].map((item, i) => (
        <div key={i} className="flex items-start gap-2 p-2 bg-[#F5F5F5] rounded hover:bg-[#E8E8E8] cursor-pointer">
          <span className="text-lg">📦</span>
          <div>
            <div className="text-[11px] font-bold text-[#404040]">{item.title}</div>
            <div className="text-[10px] text-slate-500">{item.desc}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const Standards: React.FC = () => (
  <div className="space-y-3">
    <h3 className="text-xs font-bold text-[#005B9A] border-b border-[#A0A0A0] pb-1">Standards</h3>
    <div className="space-y-2">
      {[
        { title: 'Drawing Standards', desc: 'ISO, ANSI, JIS, DIN, GB' },
        { title: 'Symbol Standards', desc: 'Surface finish, GD&T' },
        { title: 'Thread Standards', desc: 'Metric, UNC, UNF' },
      ].map((item, i) => (
        <div key={i} className="flex items-start gap-2 p-2 bg-[#F5F5F5] rounded hover:bg-[#E8E8E8] cursor-pointer">
          <span className="text-lg">📏</span>
          <div>
            <div className="text-[11px] font-bold text-[#404040]">{item.title}</div>
            <div className="text-[10px] text-slate-500">{item.desc}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const AnnotationWizard: React.FC = () => (
  <div className="space-y-3">
    <h3 className="text-xs font-bold text-[#005B9A] border-b border-[#A0A0A0] pb-1">Annotation Wizard</h3>
    <div className="space-y-2">
      {[
        { title: 'BOM Templates', desc: 'Bill of Materials formats' },
        { title: 'Symbol Library', desc: 'Weld symbols, GD&T' },
        { title: 'Custom Symbols', desc: 'User-defined symbols' },
      ].map((item, i) => (
        <div key={i} className="flex items-start gap-2 p-2 bg-[#F5F5F5] rounded hover:bg-[#E8E8E8] cursor-pointer">
          <span className="text-lg">📝</span>
          <div>
            <div className="text-[11px] font-bold text-[#404040]">{item.title}</div>
            <div className="text-[10px] text-slate-500">{item.desc}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);
