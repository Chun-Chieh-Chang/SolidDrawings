'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useCadStore } from '../store/useCadStore';
import {
  KEYBOARD_SHORTCUTS,
  SHORTCUT_CATEGORIES,
  formatKeyCombo,
  groupShortcutsByCategory,
  type KeyboardShortcut,
} from '../utils/keyboard-shortcuts';

const LineIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="19" x2="19" y2="5"/><circle cx="5" cy="19" r="1"/><circle cx="19" cy="5" r="1"/></svg>;
const CircleIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/></svg>;
const RectIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>;
const SplineIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19c4 0 6-8 10-8s6 8 10 8" /></svg>;
const DimIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m18 8 3 3-3 3"/><path d="m6 8-3 3 3 3"/><path d="M2 11h20"/><path d="M2 4v14"/><path d="M22 4v14"/></svg>;
const ExitIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>;
const ExtrudeIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>;
const MeasureIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.3 15.3l-5-5L19 7.7l-2-2L14.7 8l-5-5-1.4 1.4 1 1-1.5 1.5-1-1L5.4 7.3l1 1-1.5 1.5-1-1-1.4 1.4 5 5-2.3 2.3 2 2 2.3-2.3 5 5 1.4-1.4-1-1 1.5-1.5 1 1 1.4-1.4-1-1 1.5-1.5 1 1z"/></svg>;

const RevolveIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v4"/><path d="m16.2 7.8 2.9-2.9"/><path d="M18 12h4"/><path d="m16.2 16.2 2.9 2.9"/><path d="M12 18v4"/><path d="m7.8 16.2-2.9 2.9"/><path d="M2 12h4"/><path d="m7.8 7.8-2.9-2.9"/><circle cx="12" cy="12" r="3"/></svg>
);

const FilletIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 20h16"/><path d="M4 4v16"/><path d="M4 12c4 0 8-4 8-8"/></svg>
);

const ChamferIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 20V4"/><path d="M4 20 16 4"/></svg>
);

const ShellIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><path d="M7 7h10v10H7z"/></svg>
);

const HoleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><path d="M12 2v4"/><path d="M12 18v4"/><path d="M2 12h4"/><path d="M18 12h4"/></svg>
);

const SectionIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 3h18v18H3z"/><path d="M3 12h18"/><path d="M12 3v18"/></svg>
);

const ArcIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 12a8 8 0 0 0-16 0"/><path d="M4 12v4"/><path d="M20 12v4"/></svg>
);

const CenterLineIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="4 2"><line x1="4" y1="12" x2="20" y2="12"/></svg>
);

const ConvertIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M12 22V12"/><path d="M12 12 3.5 7.5"/><path d="M12 12l8.5-4.5"/></svg>
);

const OffsetIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 12A10 10 0 0 0 12 2v0"/><path d="M22 12A10 10 0 0 1 12 22v0"/><path d="M12 22a10 10 0 0 1-10-10v0"/><path d="M12 2a10 10 0 0 0-10 10v0"/><path d="M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"/></svg>
);

const TrimIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/><path d="M18 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/><path d="m17 17-5-5-5 5"/><path d="m14.5 10.5-2.5 2.5-2.5-2.5"/><path d="M15 18H9"/></svg>
);

const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
);

const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`transition-transform ${open ? 'rotate-180' : ''}`}>
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

const CollapsibleCategory = ({
  category,
  label,
  shortcuts,
  filter,
}: {
  category: string;
  label: string;
  shortcuts: KeyboardShortcut[];
  filter: string;
}) => {
  const [isOpen, setIsOpen] = useState(true);

  const filtered = useMemo(() => {
    if (!filter) return shortcuts;
    const lower = filter.toLowerCase();
    return shortcuts.filter(
      (s) =>
        s.description.toLowerCase().includes(lower) ||
        s.command.toLowerCase().includes(lower) ||
        formatKeyCombo(s).toLowerCase().includes(lower),
    );
  }, [shortcuts, filter]);

  if (filtered.length === 0) return null;

  return (
    <div className="mb-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600 hover:text-[#005B9A] transition-colors"
      >
        <ChevronIcon open={isOpen} />
        {label} ({filtered.length})
      </button>
      {isOpen && (
        <div className="ml-3 border-l border-slate-200 pl-2">
          {filtered.map((sc, i) => (
            <div
              key={`${sc.command}-${i}`}
              className="flex items-center justify-between py-0.5 px-1.5 rounded hover:bg-blue-50 group"
            >
              <span className="text-[10px] text-slate-700 font-medium truncate">{sc.description}</span>
              <kbd className="text-[9px] font-bold text-slate-400 group-hover:text-[#005B9A] transition-colors whitespace-nowrap ml-2">
                {formatKeyCombo(sc)}
              </kbd>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const ShortcutBox: React.FC = () => {
  const { 
    shortcutBox, setShortcutBox, 
    isSketchMode, setSketchTool, setSketchMode, 
    setActivePlane, smartDimensionActive, setSmartDimensionActive,
    setMeasurementMode, measurementMode, features, triggerCameraNormal,
    setViewportDisplayMode, viewportDisplayMode,
  } = useCadStore();
  const boxRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(event.target as Node)) setShortcutBox(null);
    };
    if (shortcutBox?.visible) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [shortcutBox, setShortcutBox]);

  const grouped = useMemo(() => groupShortcutsByCategory(KEYBOARD_SHORTCUTS), []);
  const sortedCategories = useMemo(
    () => Object.entries(SHORTCUT_CATEGORIES).sort((a, b) => a[1].order - b[1].order),
    [],
  );

  if (!shortcutBox?.visible) return null;

  const handleAction = (tool: any) => {
    if (tool.id === 'NORMAL_TO') {
      triggerCameraNormal();
    } else {
      tool.action();
    }
    setShortcutBox(null);
  };

  const sketchTools = [
    { id: 'SELECT', icon: '↖', label: 'Select', action: () => setSketchTool('SELECT') },
    { id: 'SMART_DIMENSION', icon: '📏', label: 'Smart Dim', action: () => setSmartDimensionActive(true) },
    { id: 'LINE', icon: '╱', label: 'Line', action: () => setSketchTool('LINE') },
    { id: 'CIRCLE', icon: '○', label: 'Circle', action: () => setSketchTool('CIRCLE') },
    { id: 'RECTANGLE', icon: '▭', label: 'Rect', action: () => setSketchTool('RECTANGLE') },
    { id: 'ARC', icon: '⌒', label: 'Arc', action: () => setSketchTool('ARC') },
    { id: 'NORMAL_TO', icon: '⟕', label: 'Normal To', action: () => {} },
    { id: 'EXIT_SKETCH', icon: '🚪', label: 'Exit', action: () => setSketchMode(false) },
  ];

  const featureTools = [
    { id: 'EXTRUDE', icon: <ExtrudeIcon />, label: 'Extrude', action: () => { (window as any).__handleExtrude?.(); } },
    { id: 'REVOLVE', icon: <RevolveIcon />, label: 'Revolve', action: () => { (window as any).__handleRevolve?.(); } },
    { id: 'FILLET', icon: <FilletIcon />, label: 'Fillet', action: () => { 
        if (features.length > 0) {
          useCadStore.setState({ pendingFeatureCommand: 'FILLET' });
        } else {
          alert('Create a solid body first!');
        }
    } },
    { id: 'CHAMFER', icon: <ChamferIcon />, label: 'Chamfer', action: () => { 
        if (features.length > 0) {
          useCadStore.setState({ pendingFeatureCommand: 'CHAMFER' });
        } else {
          alert('Create a solid body first!');
        }
    } },
    { id: 'NORMAL_TO', icon: '⟕', label: 'Normal To', action: () => {} },
  ];

  const tools = isSketchMode ? sketchTools : featureTools;

  return (
    <div
      ref={boxRef}
      className="fixed z-[1000] bg-white/95 backdrop-blur-xl border border-slate-300 rounded-lg shadow-2xl flex overflow-hidden animate-in zoom-in-95 duration-100 origin-top-left"
      style={{
        left: shortcutBox.x,
        top: shortcutBox.y,
        transform: 'translate(-10px, -10px)',
        width: '480px',
        height: '420px',
      }}
    >
      {/* Left: Tool palette */}
      <div className="w-[140px] border-r border-slate-200 p-1.5 flex flex-col">
        <div className="px-2 py-1 mb-1">
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Tools</span>
        </div>
        {tools.map((t) => (
          <button
            key={t.id}
            onClick={() => handleAction(t)}
            className="w-full h-10 flex flex-col items-center justify-center rounded hover:bg-[#005B9A] hover:text-white transition-all group border-none bg-transparent cursor-pointer mb-0.5"
            title={t.label}
          >
            <span className="text-base font-bold group-hover:scale-110 transition-transform leading-none">
              {typeof t.icon === 'string' ? t.icon : ''}
            </span>
            <span className="text-[7px] font-bold uppercase mt-0.5 opacity-60 group-hover:opacity-100 leading-tight">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Right: Keyboard shortcuts */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-2 py-1.5 border-b border-slate-200 flex items-center gap-1.5">
          <SearchIcon />
          <input
            type="text"
            placeholder="Search shortcuts..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="flex-1 text-[10px] bg-transparent outline-none text-slate-700 placeholder-slate-300"
          />
        </div>
        <div className="flex-1 overflow-y-auto px-2 py-1 scrollbar-thin">
          {sortedCategories.map(([catKey, catInfo]) => {
            const catShortcuts = grouped[catKey] || [];
            return (
              <CollapsibleCategory
                key={catKey}
                category={catKey}
                label={catInfo.label}
                shortcuts={catShortcuts}
                filter={filter}
              />
            );
          })}
        </div>
        <div className="px-2 py-1 border-t border-slate-200">
          <span className="text-[8px] text-slate-400 font-medium">
            {KEYBOARD_SHORTCUTS.length} shortcuts · SolidWorks 2010 Compatible
          </span>
        </div>
      </div>
    </div>
  );
};
