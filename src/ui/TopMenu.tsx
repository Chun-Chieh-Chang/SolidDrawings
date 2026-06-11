'use client';

import React from 'react';
import { useCadStore } from '../store/useCadStore';
import { saveProject, saveProjectAs, openProject, getNewProjectState, getCurrentFileName } from '../services/projectService';

interface TopMenuProps {
  engineStatus: 'CONNECTED' | 'DISCONNECTED';
  onExport?: () => void;
}

export const TopMenu: React.FC<TopMenuProps> = ({ engineStatus, onExport }) => {
  const activePlane = useCadStore((state) => state.activePlane);
  const projectName = useCadStore((state) => state.projectName);
  const isDirty = useCadStore((state) => state.isDirty);
  const [showFileMenu, setShowFileMenu] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Close menu on outside click
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowFileMenu(false);
      }
    };
    if (showFileMenu) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showFileMenu]);

  const handleNew = () => {
    const state = useCadStore.getState();
    if (state.isDirty) {
      const confirmed = window.confirm('目前有未儲存的變更，確定要新建專案嗎？');
      if (!confirmed) return;
    }
    const newState = getNewProjectState();
    useCadStore.setState(newState);
    useCadStore.getState().pushToast('已建立新專案。', 'info');
    setShowFileMenu(false);
  };

  const handleOpen = async () => {
    const state = useCadStore.getState();
    if (state.isDirty) {
      const confirmed = window.confirm('目前有未儲存的變更，確定要開啟其他專案嗎？');
      if (!confirmed) return;
    }
    const result = await openProject();
    if (result.success && result.data) {
      useCadStore.setState(result.data);
      useCadStore.getState().pushToast(`已開啟：${result.filename}`, 'info');
    } else if (result.error && result.error !== 'Open cancelled by user.') {
      useCadStore.getState().pushToast(`開啟失敗：${result.error}`, 'error');
    }
    setShowFileMenu(false);
  };

  const handleSave = async () => {
    const state = useCadStore.getState();
    const result = await saveProject(state);
    if (result.success) {
      useCadStore.getState().markProjectClean();
      useCadStore.getState().pushToast(`已儲存：${result.filename}`, 'info');
    } else if (result.error && result.error !== 'Save cancelled by user.') {
      useCadStore.getState().pushToast(`儲存失敗：${result.error}`, 'error');
    }
    setShowFileMenu(false);
  };

  const handleSaveAs = async () => {
    const state = useCadStore.getState();
    const result = await saveProjectAs(state);
    if (result.success) {
      useCadStore.getState().markProjectClean();
      useCadStore.getState().pushToast(`已另存為：${result.filename}`, 'info');
    } else if (result.error && result.error !== 'Save cancelled by user.') {
      useCadStore.getState().pushToast(`儲存失敗：${result.error}`, 'error');
    }
    setShowFileMenu(false);
  };

  // Expose save/open/new to keyboard shortcuts via window
  React.useEffect(() => {
    (window as any).__handleFileSave = handleSave;
    (window as any).__handleFileSaveAs = handleSaveAs;
    (window as any).__handleFileOpen = handleOpen;
    (window as any).__handleFileNew = handleNew;
    return () => {
      delete (window as any).__handleFileSave;
      delete (window as any).__handleFileSaveAs;
      delete (window as any).__handleFileOpen;
      delete (window as any).__handleFileNew;
    };
  });

  const displayName = getCurrentFileName() || `${projectName}.3db.json`;

  return (
    <header className="h-[32px] w-full bg-[#F5F5F5] border-b border-[#A0A0A0] flex items-center justify-between px-3 select-none z-50 shrink-0" style={{ background: "linear-gradient(to bottom, #FFFFFF 0%, #E8E8E8 100%)" }}>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-[14px] font-black tracking-tighter text-[#000000]">
          <div className="w-6 h-6 bg-[#005B9A] rounded-sm flex items-center justify-center text-white text-[11px] shadow-sm font-sans">3D</div>
          3D-Builder Pro
        </div>
        <nav className="flex items-center gap-4 text-[12px] text-[#404040] font-semibold relative">
          <div className="relative" ref={menuRef}>
            <span 
              onClick={() => setShowFileMenu(!showFileMenu)}
              className={`hover:text-[#005B9A] cursor-pointer transition-colors px-1 uppercase tracking-wider ${showFileMenu ? 'text-[#005B9A]' : ''}`}
            >
              File
            </span>
            {showFileMenu && (
              <div className="absolute top-[22px] left-0 w-[200px] bg-white border border-slate-300 shadow-xl rounded-sm py-1 z-[100]">
                <button onClick={handleNew} className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white transition-colors flex justify-between text-[12px]">
                  <span>New</span>
                  <span className="opacity-50 text-[10px]">Ctrl+N</span>
                </button>
                <button onClick={handleOpen} className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white transition-colors flex justify-between text-[12px]">
                  <span>Open...</span>
                  <span className="opacity-50 text-[10px]">Ctrl+O</span>
                </button>
                <div className="h-[1px] bg-slate-200 my-1" />
                <button onClick={handleSave} className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white transition-colors flex justify-between text-[12px]">
                  <span>Save</span>
                  <span className="opacity-50 text-[10px]">Ctrl+S</span>
                </button>
                <button onClick={handleSaveAs} className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white transition-colors flex justify-between text-[12px]">
                  <span>Save As...</span>
                  <span className="opacity-50 text-[10px]">Ctrl+Shift+S</span>
                </button>
                <div className="h-[1px] bg-slate-200 my-1" />
                <button 
                  onClick={() => { onExport?.(); setShowFileMenu(false); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white transition-colors flex justify-between text-[12px]"
                >
                  <span>Export...</span>
                  <span className="opacity-50 text-[10px]">Ctrl+E</span>
                </button>
                <div className="h-[1px] bg-slate-200 my-1" />
                <button className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white transition-colors text-[12px]">
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
          {displayName}{isDirty ? ' *' : ''} <span className="text-[#005B9A] font-bold">[{activePlane || "No Active Plane"}]</span>
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

