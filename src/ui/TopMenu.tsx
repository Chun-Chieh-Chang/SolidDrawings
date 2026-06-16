'use client';

import React from 'react';
import { useCadStore } from '../store/useCadStore';
import { RecentFilesDropdown } from './RecentFilesDropdown';

interface TopMenuProps {
  engineStatus: 'CONNECTED' | 'DISCONNECTED';
  onExport?: () => void;
  onOpenFile?: () => void;
  onSaveFile?: () => void;
}

export const TopMenu: React.FC<TopMenuProps> = ({
  engineStatus,
  onExport,
  onOpenFile,
  onSaveFile,
}) => {
  const activePlane = useCadStore((state) => state.activePlane);
  const [showFileMenu, setShowFileMenu] = React.useState(false);
  const [showRecentFiles, setShowRecentFiles] = React.useState(false);

  const handleRecentFileSelect = React.useCallback(
    (filePath: string) => {
      // Bridge: let parent handle the actual file opening
      const event = new CustomEvent('3db-mru-file-select', { detail: filePath });
      window.dispatchEvent(event);
    },
    [],
  );

  return (
    <header className="h-[32px] w-full bg-[#F5F5F5] border-b border-[#A0A0A0] flex items-center justify-between px-3 select-none z-50 shrink-0" style={{ background: "linear-gradient(to bottom, #FFFFFF 0%, #E8E8E8 100%)" }}>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-[14px] font-black tracking-tighter text-[#000000]">
          <div className="w-6 h-6 bg-[#005B9A] rounded-sm flex items-center justify-center text-white text-[11px] shadow-sm font-sans">3D</div>
          3D-Builder Pro
        </div>
        <nav className="flex items-center gap-4 text-[12px] text-[#404040] font-semibold relative">
          <div className="relative">
            <span 
              onClick={() => { setShowFileMenu(!showFileMenu); setShowRecentFiles(false); }}
              className={`hover:text-[#005B9A] cursor-pointer transition-colors px-1 uppercase tracking-wider ${showFileMenu ? 'text-[#005B9A]' : ''}`}
            >
              File
            </span>
            {showFileMenu && (
              <div className="absolute top-[22px] left-0 w-[180px] bg-white border border-slate-300 shadow-xl rounded-sm py-1 z-[100]">
                <button className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white transition-colors flex justify-between">
                  <span>New</span>
                  <span className="opacity-50 text-[10px]">Ctrl+N</span>
                </button>
                <button
                  onClick={() => {
                    onOpenFile?.();
                    setShowFileMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white transition-colors flex justify-between"
                >
                  <span>Open...</span>
                  <span className="opacity-50 text-[10px]">Ctrl+O</span>
                </button>
                <div className="h-[1px] bg-slate-200 my-1" />
                <button
                  onClick={() => {
                    onSaveFile?.();
                    setShowFileMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white transition-colors flex justify-between"
                >
                  <span>Save</span>
                  <span className="opacity-50 text-[10px]">Ctrl+S</span>
                </button>
                <button 
                  onClick={() => { onExport?.(); setShowFileMenu(false); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white transition-colors flex justify-between"
                >
                  <span>Export...</span>
                  <span className="opacity-50 text-[10px]">Ctrl+E</span>
                </button>
                <div className="h-[1px] bg-slate-200 my-1" />
                <div className="relative">
                  <span
                    onClick={() => {
                      setShowRecentFiles(!showRecentFiles);
                      setShowFileMenu(false);
                    }}
                    className="block w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white transition-colors cursor-pointer"
                  >
                    最近使用
                  </span>
                  <RecentFilesDropdown
                    visible={showRecentFiles}
                    onFileSelect={handleRecentFileSelect}
                    onClose={() => setShowRecentFiles(false)}
                  />
                </div>
                <div className="h-[1px] bg-slate-200 my-1" />
                <button className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white transition-colors">
                  Exit
                </button>
              </div>
            )}
          </div>
          {["Edit", "View", "Insert", "Tools", "Help"].map(m => (
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
