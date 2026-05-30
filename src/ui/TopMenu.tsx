'use client';

import React from 'react';
import { useCadStore } from '../store/useCadStore';

interface TopMenuProps {
  engineStatus: 'CONNECTED' | 'DISCONNECTED';
}

export const TopMenu: React.FC<TopMenuProps> = ({ engineStatus }) => {
  const activePlane = useCadStore((state) => state.activePlane);

  return (
    <header className="h-[32px] w-full bg-[#F5F5F5] border-b border-[#A0A0A0] flex items-center justify-between px-3 select-none z-50 shrink-0" style={{ background: "linear-gradient(to bottom, #FFFFFF 0%, #E8E8E8 100%)" }}>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-[14px] font-black tracking-tighter text-[#000000]">
          <div className="w-6 h-6 bg-[#005B9A] rounded-sm flex items-center justify-center text-white text-[11px] shadow-sm font-sans">3D</div>
          3D-Builder Pro
        </div>
        <nav className="flex items-center gap-4 text-[12px] text-[#404040] font-semibold">
          {["File", "Edit", "View", "Insert", "Tools", "Help"].map(m => (
            <span key={m} className="hover:text-[#005B9A] cursor-pointer transition-colors px-1 uppercase tracking-wider">{m}</span>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-[11px] text-[#404040] font-medium bg-[#FFFFFF] px-4 py-1 rounded-sm border border-[#A0A0A0] shadow-inner">
          Part 1.3DBPART * <span className="text-[#005B9A] font-bold">[{activePlane || "No Active Plane"}]</span>
        </div>
        <div className="flex items-center gap-3 text-[12px]">
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${engineStatus === "CONNECTED" ? "bg-[#28a745]" : "bg-[#dc3545]"} shadow-sm`} />
            <span className="text-[#404040] font-bold uppercase tracking-widest text-[10px]">Kernel: <span className={engineStatus === "CONNECTED" ? "text-[#28a745]" : "text-[#dc3545]"}>{engineStatus}</span></span>
          </div>
        </div>
      </div>
    </header>
  );
};
