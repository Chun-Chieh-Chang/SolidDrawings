'use client';

import React, { useState } from 'react';
import { useCadStore } from '../store/useCadStore';
import type { SelectionFilterType } from '../utils/selection-filters';
import { getEntityCategoryName } from '../utils/selection-filters';

const ZoomIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    <path d="M8 11h6" /><path d="M11 8v6" />
  </svg>
);

const ViewIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21 16-4 4-4-4" /><path d="M17 20V4" /><path d="m3 8 4-4 4 4" /><path d="M7 4v16" />
  </svg>
);

const StyleIcon = ({ wireframe }: { wireframe?: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    {wireframe ? (
      <g>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
      </g>
    ) : (
      <path d="M12 22.08V12L3.27 6.96" />
    )}
  </svg>
);

const SectionIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3h18v18H3z" /><path d="M3 12h18" /><path d="M12 3v18" />
  </svg>
);

type FilterOption = { type: SelectionFilterType; label: string; icon: React.ReactNode };

const VertexIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3" />
    <line x1="4" y1="4" x2="8" y2="8" />
    <line x1="16" y1="4" x2="20" y2="8" />
    <line x1="4" y1="20" x2="8" y2="16" />
    <line x1="16" y1="20" x2="20" y2="16" />
  </svg>
);

const EdgeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="5" y1="19" x2="19" y2="5" />
    <polyline points="8 5 5 5 5 8" />
    <polyline points="16 19 19 19 19 16" />
  </svg>
);

const FaceIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="12 3 20 9 12 21 4 9" />
  </svg>
);

const SketchEntityIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="12" y1="3" x2="12" y2="21" />
  </svg>
);

const FeatureIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
    <path d="M2 17l10 5 10-5" />
    <path d="M2 12l10 5 10-5" />
  </svg>
);

const ComponentIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

const ReferenceIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="2" y1="12" x2="22" y2="12" />
    <line x1="12" y1="2" x2="12" y2="22" />
    <circle cx="12" cy="12" r="2" />
    <line x1="12" y1="2" x2="12" y2="6" />
    <line x1="12" y1="18" x2="12" y2="22" />
  </svg>
);

const AllIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="3" />
    <line x1="12" y1="2" x2="12" y2="5" />
    <line x1="12" y1="19" x2="12" y2="22" />
    <line x1="2" y1="12" x2="5" y2="12" />
    <line x1="19" y1="12" x2="22" y2="12" />
  </svg>
);

const FILTER_OPTIONS: FilterOption[] = [
  { type: 'NONE', label: '全部', icon: <AllIcon /> },
  { type: 'VERTEX', label: '頂點', icon: <VertexIcon /> },
  { type: 'EDGE', label: '邊線', icon: <EdgeIcon /> },
  { type: 'FACE', label: '面', icon: <FaceIcon /> },
  { type: 'SKETCH_ENTITY', label: '草圖圖元', icon: <SketchEntityIcon /> },
  { type: 'FEATURE', label: '特徵', icon: <FeatureIcon /> },
  { type: 'COMPONENT', label: '零組件', icon: <ComponentIcon /> },
  { type: 'REFERENCE', label: '參考幾何', icon: <ReferenceIcon /> },
];

export const HeadsUpToolbar: React.FC = () => {
  const {
    triggerCameraNormal,
    setActivePlane,
    controls,
    isSketchMode,
    setSketchMode,
    viewportDisplayMode,
    setViewportDisplayMode,
    selectionFilter,
    setSelectionFilter,
  } = useCadStore();
  const [showOrientation, setShowOrientation] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = React.useRef<{ startX: number, startY: number, initialX: number, initialY: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y
    };
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPosition({
      x: dragRef.current.initialX + dx,
      y: dragRef.current.initialY + dy
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    dragRef.current = null;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const handleZoomToFit = () => { if (controls) controls.reset(); };

  const setOrientation = (view: 'FRONT' | 'TOP' | 'RIGHT' | 'ISOMETRIC' | 'NORMAL_TO') => {
    if (view === 'ISOMETRIC') {
      if (controls) {
        controls.object.position.set(150, 150, 150);
        controls.target.set(0, 0, 0);
        controls.update();
      }
    } else if (view === 'NORMAL_TO') {
      triggerCameraNormal();
    } else {
      setActivePlane(view);
      triggerCameraNormal();
    }
    setShowOrientation(false);
  };

  return (
    <div 
      className={`absolute flex items-center gap-1 p-1 bg-[#F5F6F9]/80 backdrop-blur-xl border border-slate-300/50 rounded-lg shadow-2xl z-40 select-none font-sans ${isDragging ? '' : 'transition-colors hover:bg-white/90'}`}
      style={{
        top: `calc(1.5rem + ${position.y}px)`,
        left: `calc(50% + ${position.x}px)`,
        transform: 'translateX(-50%)'
      }}
    >
      <div 
        className="h-9 flex flex-col flex-wrap gap-[3px] items-center justify-center cursor-move text-slate-300 hover:text-slate-500 px-1 border-r border-slate-300/50 opacity-80 hover:opacity-100 transition-all touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        title="Drag to move toolbar"
      >
        <div className="w-[3px] h-[3px] rounded-full bg-current" />
        <div className="w-[3px] h-[3px] rounded-full bg-current" />
        <div className="w-[3px] h-[3px] rounded-full bg-current" />
        <div className="w-[3px] h-[3px] rounded-full bg-current" />
        <div className="w-[3px] h-[3px] rounded-full bg-current" />
        <div className="w-[3px] h-[3px] rounded-full bg-current" />
      </div>

      <button onClick={handleZoomToFit} className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-slate-200/50 text-slate-700 transition-all border-none bg-transparent cursor-pointer" title="Zoom to Fit (F)">
        <ZoomIcon />
      </button>

      <div className="relative">
        <button onClick={() => setShowOrientation(!showOrientation)} className={`w-9 h-9 flex items-center justify-center rounded-md transition-all border-none bg-transparent cursor-pointer ${showOrientation ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'hover:bg-slate-200/50 text-slate-700'}`} title="View Orientation">
          <ViewIcon />
        </button>

        {showOrientation && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-48 bg-white/95 backdrop-blur-2xl border border-slate-200 rounded-md shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            {[
              { id: 'NORMAL_TO', label: 'Normal To', key: 'N', color: 'bg-slate-700' },
              { id: 'FRONT', label: 'Front View', key: 'F', color: 'bg-blue-500' },
              { id: 'TOP', label: 'Top View', key: 'T', color: 'bg-green-500' },
              { id: 'RIGHT', label: 'Right View', key: 'R', color: 'bg-red-500' },
              { id: 'ISOMETRIC', label: 'Isometric', key: 'I', color: 'bg-purple-500' }
            ].map((v) => (
              <button key={v.id} onClick={() => setOrientation(v.id as any)} className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-all flex items-center gap-3 border-none bg-transparent cursor-pointer">
                <span className={`w-5 h-5 ${v.color} text-white rounded-md flex items-center justify-center text-[10px] shadow-sm font-black`}>{v.key}</span>
                {v.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="w-[1px] h-6 bg-slate-300/50 mx-1" />

      {/* Selection Filter Dropdown */}
      <div className="relative">
        <button
          onClick={() => setShowFilterMenu(!showFilterMenu)}
          className={`w-9 h-9 flex items-center justify-center rounded-md transition-all border-none cursor-pointer ${
            selectionFilter !== 'NONE'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700'
              : 'hover:bg-slate-200/50 text-slate-700'
          }`}
          title="Selection Filter"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
        </button>

        {showFilterMenu && (
          <div className="absolute top-full left-0 mt-2 w-36 bg-white/95 backdrop-blur-2xl border border-slate-200 rounded-md shadow-2xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.type}
                onClick={() => {
                  setSelectionFilter(opt.type);
                  setShowFilterMenu(false);
                }}
                className={`w-full text-left px-3 py-2 flex items-center gap-2.5 transition-all border-none bg-transparent cursor-pointer ${
                  selectionFilter === opt.type
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
                title={opt.label}
              >
                <span className={`flex-shrink-0 ${selectionFilter === opt.type ? 'text-blue-600' : 'text-slate-500'}`}>
                  {opt.icon}
                </span>
                <span className="text-[11px] font-semibold">{opt.label}</span>
                {selectionFilter === opt.type && (
                  <span className="ml-auto text-blue-600">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => {
          const next =
            viewportDisplayMode === 'SHADED_EDGES'
              ? 'WIREFRAME'
              : viewportDisplayMode === 'WIREFRAME'
                ? 'SHADED'
                : 'SHADED_EDGES';
          setViewportDisplayMode(next);
        }}
        className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-slate-200/50 text-slate-700 transition-all border-none bg-transparent cursor-pointer"
        title="顯示樣式：著色含邊線 / 線框"
      >
        <StyleIcon wireframe={viewportDisplayMode === 'WIREFRAME'} />
      </button>

      <button
        onClick={() => {
          const newState = !useCadStore.getState().sectionView.isActive;
          useCadStore.getState().setSectionView({ isActive: newState });
          useCadStore.getState().setActivePropertyManager(newState ? 'SECTION_VIEW' : null);
        }}
        className={`w-9 h-9 flex items-center justify-center rounded-md transition-all border-none cursor-pointer ${
          useCadStore.getState().sectionView.isActive
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700'
            : 'bg-transparent hover:bg-slate-200/50 text-slate-700'
        }`}
        title="Section View"
      >
        <SectionIcon />
      </button>

      {isSketchMode && (
        <>
          <div className="w-[1px] h-6 bg-slate-300/50 mx-1" />
          <button 
            onClick={() => setSketchMode(false)}
            className="px-3 h-9 flex items-center gap-2 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-all border border-emerald-200/50 cursor-pointer font-bold text-[11px] uppercase tracking-wider"
            title="Exit Sketch"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
            Exit
          </button>
        </>
      )}

      {/* Active filter indicator tooltip */}
      {selectionFilter !== 'NONE' && (
        <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-slate-800 text-white text-[10px] font-bold rounded shadow-md whitespace-nowrap z-50">
          {getEntityCategoryName(selectionFilter)}
        </div>
      )}
    </div>
  );
};
