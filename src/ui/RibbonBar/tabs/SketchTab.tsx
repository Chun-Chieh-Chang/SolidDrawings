import React from 'react';
import { useCadStore } from '../../../store/useCadStore';
import type { RibbonTabProps } from './types';

export const SketchTab: React.FC<RibbonTabProps> = ({
  sketchTool, setSketchTool,
}) => {
  const is3DMode = useCadStore((s) => s.is3DMode);
  const set3DMode = useCadStore((s) => s.set3DMode);
  const active3DPlane = useCadStore((s) => s.active3DPlane);
  const setActive3DPlane = useCadStore((s) => s.setActive3DPlane);
  return (
    <div className="flex items-center gap-2 h-full animate-in fade-in slide-in-from-left-2 duration-300">
      <button onClick={() => { (window as any).__handleSaveSketchOnly?.(); }} className="flex flex-col items-center justify-center gap-0.5 px-3 h-[78px] min-w-[75px] transition-all border border-transparent hover:bg-white hover:border-[#A0A0A0] active:bg-slate-100 group" title="Save Sketch">
        <div className="w-10 h-10 flex items-center justify-center text-blue-600 transition-transform group-hover:scale-110">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
        </div>
        <span className="text-[10px] font-bold text-slate-800 leading-none uppercase">Save</span>
      </button>
      <button onClick={() => { (window as any).__resetSketchSession?.(); }} className="flex flex-col items-center justify-center gap-0.5 px-3 h-[78px] min-w-[75px] transition-all border border-transparent hover:bg-white hover:border-[#A0A0A0] active:bg-slate-100 group" title="Discard/Exit Sketch">
        <div className="w-10 h-10 flex items-center justify-center text-emerald-600 transition-transform group-hover:scale-110">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
        </div>
        <span className="text-[10px] font-bold text-slate-800 leading-none uppercase">Exit</span>
      </button>
      <div className="w-[1px] h-10 bg-border/50 mx-2" />

      {/* Basic Sketch Primitives */}
      <button onClick={() => setSketchTool('LINE')} className={`flex flex-col items-center justify-center gap-0.5 px-3 h-[78px] min-w-[65px] transition-all border ${sketchTool === 'LINE' ? 'bg-white border-[#A0A0A0] shadow-inner' : 'border-transparent hover:bg-white hover:border-[#A0A0A0]'} active:bg-slate-100 group`} title="Line">
        <div className={`w-10 h-10 flex items-center justify-center transition-transform ${sketchTool === 'LINE' ? 'text-[#005B9A] scale-110' : 'text-slate-600 group-hover:scale-110'}`}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="19" x2="19" y2="5"/><circle cx="5" cy="19" r="1.5"/><circle cx="19" cy="5" r="1.5"/></svg>
        </div>
        <span className="text-[10px] font-bold text-slate-800 leading-none uppercase">Line</span>
      </button>

      <button onClick={() => setSketchTool('RECTANGLE')} className={`flex flex-col items-center justify-center gap-0.5 px-3 h-[78px] min-w-[65px] transition-all border ${sketchTool === 'RECTANGLE' ? 'bg-white border-[#A0A0A0] shadow-inner' : 'border-transparent hover:bg-white hover:border-[#A0A0A0]'} active:bg-slate-100 group`} title="Corner Rectangle">
        <div className={`w-10 h-10 flex items-center justify-center transition-transform ${sketchTool === 'RECTANGLE' ? 'text-[#005B9A] scale-110' : 'text-slate-600 group-hover:scale-110'}`}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
        </div>
        <span className="text-[10px] font-bold text-slate-800 leading-none uppercase">Rect</span>
      </button>

      <button onClick={() => setSketchTool('CENTER_RECTANGLE')} className={`flex flex-col items-center justify-center gap-0.5 px-3 h-[78px] min-w-[65px] transition-all border ${sketchTool === 'CENTER_RECTANGLE' ? 'bg-white border-[#A0A0A0] shadow-inner' : 'border-transparent hover:bg-white hover:border-[#A0A0A0]'} active:bg-slate-100 group`} title="Center Rectangle">
        <div className={`w-10 h-10 flex items-center justify-center transition-transform ${sketchTool === 'CENTER_RECTANGLE' ? 'text-[#005B9A] scale-110' : 'text-slate-600 group-hover:scale-110'}`}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
            <line x1="12" y1="3" x2="12" y2="21" strokeDasharray="2 2"/>
            <line x1="3" y1="12" x2="21" y2="12" strokeDasharray="2 2"/>
          </svg>
        </div>
        <span className="text-[10px] font-bold text-slate-800 leading-none uppercase">Ctr Rect</span>
      </button>

      <button onClick={() => setSketchTool('CIRCLE')} className={`flex flex-col items-center justify-center gap-0.5 px-3 h-[78px] min-w-[65px] transition-all border ${sketchTool === 'CIRCLE' ? 'bg-white border-[#A0A0A0] shadow-inner' : 'border-transparent hover:bg-white hover:border-[#A0A0A0]'} active:bg-slate-100 group`} title="Circle">
        <div className={`w-10 h-10 flex items-center justify-center transition-transform ${sketchTool === 'CIRCLE' ? 'text-[#005B9A] scale-110' : 'text-slate-600 group-hover:scale-110'}`}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="9"/></svg>
        </div>
        <span className="text-[10px] font-bold text-slate-800 leading-none uppercase">Circle</span>
      </button>

      <button onClick={() => setSketchTool('ARC')} className={`flex flex-col items-center justify-center gap-0.5 px-3 h-[78px] min-w-[65px] transition-all border ${sketchTool === 'ARC' ? 'bg-white border-[#A0A0A0] shadow-inner' : 'border-transparent hover:bg-white hover:border-[#A0A0A0]'} active:bg-slate-100 group`} title="3 Point Arc">
        <div className={`w-10 h-10 flex items-center justify-center transition-transform ${sketchTool === 'ARC' ? 'text-[#005B9A] scale-110' : 'text-slate-600 group-hover:scale-110'}`}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 12a8 8 0 0 0-16 0"/><path d="M4 12v4"/><path d="M20 12v4"/></svg>
        </div>
        <span className="text-[10px] font-bold text-slate-800 leading-none uppercase">Arc</span>
      </button>

      <button onClick={() => setSketchTool('SPLINE')} className={`flex flex-col items-center justify-center gap-0.5 px-3 h-[78px] min-w-[65px] transition-all border ${sketchTool === 'SPLINE' ? 'bg-white border-[#A0A0A0] shadow-inner' : 'border-transparent hover:bg-white hover:border-[#A0A0A0]'} active:bg-slate-100 group`} title="Spline">
        <div className={`w-10 h-10 flex items-center justify-center transition-transform ${sketchTool === 'SPLINE' ? 'text-[#005B9A] scale-110' : 'text-slate-600 group-hover:scale-110'}`}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 19c4 0 6-8 10-8s6 8 10 8" /></svg>
        </div>
        <span className="text-[10px] font-bold text-slate-800 leading-none uppercase">Spline</span>
      </button>

      <button onClick={() => setSketchTool('POLYGON')} className={`flex flex-col items-center justify-center gap-0.5 px-3 h-[78px] min-w-[65px] transition-all border ${sketchTool === 'POLYGON' ? 'bg-white border-[#A0A0A0] shadow-inner' : 'border-transparent hover:bg-white hover:border-[#A0A0A0]'} active:bg-slate-100 group`} title="Polygon">
        <div className={`w-10 h-10 flex items-center justify-center transition-transform ${sketchTool === 'POLYGON' ? 'text-[#005B9A] scale-110' : 'text-slate-600 group-hover:scale-110'}`}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="12,2 20,8.5 20,15.5 12,22 4,15.5 4,8.5" />
          </svg>
        </div>
        <span className="text-[10px] font-bold text-slate-800 leading-none uppercase">Polygon</span>
      </button>

      <div className="w-[1px] h-10 bg-border/50 mx-2" />
      <button onClick={() => useCadStore.setState(s => ({ smartDimensionActive: !s.smartDimensionActive }))} className={`flex flex-col items-center justify-center gap-0.5 px-3 h-[78px] min-w-[75px] transition-all border ${useCadStore.getState().smartDimensionActive ? 'bg-white border-[#A0A0A0] shadow-inner' : 'border-transparent hover:bg-white hover:border-[#A0A0A0]'} active:bg-slate-100 group`} title="Smart Dimension">
        <div className={`w-10 h-10 flex items-center justify-center transition-transform ${useCadStore.getState().smartDimensionActive ? 'text-[#005B9A] scale-110' : 'text-slate-600 group-hover:scale-110'}`}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m18 8 3 3-3 3"/><path d="m6 8-3 3 3 3"/><path d="M2 11h20"/><path d="M2 4v14"/><path d="M22 4v14"/></svg>
        </div>
        <span className="text-[10px] font-bold text-slate-800 leading-none uppercase">Smart Dim</span>
      </button>
      <div className="w-[1px] h-10 bg-border/50 mx-1" />
      <button onClick={() => { setSketchTool('TRIM'); }} className={`flex flex-col items-center justify-center gap-0.5 px-3 h-[78px] min-w-[75px] transition-all border ${sketchTool === 'TRIM' ? 'bg-white border-[#A0A0A0] shadow-inner' : 'border-transparent hover:bg-white hover:border-[#A0A0A0]'} active:bg-slate-100 group`} title="Trim Entities">
        <div className={`w-10 h-10 flex items-center justify-center transition-transform ${sketchTool === 'TRIM' ? 'text-red-500 scale-110' : 'text-slate-600 group-hover:scale-110'}`}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/><path d="M18 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/><path d="m17 17-5-5-5 5"/><path d="m14.5 10.5-2.5 2.5-2.5-2.5"/><path d="M15 18H9"/></svg>
        </div>
        <span className="text-[10px] font-bold text-slate-800 leading-none uppercase">Trim</span>
      </button>
      <div className="w-[1px] h-10 bg-border/50 mx-1" />
      <button onClick={() => { setSketchTool('MIRROR'); }} className={`flex flex-col items-center justify-center gap-0.5 px-3 h-[78px] min-w-[75px] transition-all border ${sketchTool === 'MIRROR' ? 'bg-white border-[#A0A0A0] shadow-inner' : 'border-transparent hover:bg-white hover:border-[#A0A0A0]'} active:bg-slate-100 group`} title="Mirror Entities">
        <div className={`w-10 h-10 flex items-center justify-center transition-transform ${sketchTool === 'MIRROR' ? 'text-indigo-600 scale-110' : 'text-slate-600 group-hover:scale-110'}`}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v20"/><path d="m2 8 8 2"/><path d="m2 14 8-2"/><path d="m22 8-8 2"/><path d="m22 14-8-2"/></svg>
        </div>
        <span className="text-[10px] font-bold text-slate-800 leading-none uppercase">Mirror</span>
      </button>
      <div className="w-[1px] h-10 bg-border/50 mx-1" />
      <button onClick={() => { setSketchTool('EXTEND'); }} className={`flex flex-col items-center justify-center gap-0.5 px-3 h-[78px] min-w-[75px] transition-all border ${sketchTool === 'EXTEND' ? 'bg-white border-[#A0A0A0] shadow-inner' : 'border-transparent hover:bg-white hover:border-[#A0A0A0]'} active:bg-slate-100 group`} title="Extend Entities">
        <div className={`w-10 h-10 flex items-center justify-center transition-transform ${sketchTool === 'EXTEND' ? 'text-emerald-600 scale-110' : 'text-slate-600 group-hover:scale-110'}`}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14"/><path d="m15 16 4-4-4-4"/><path d="M12 2v20"/></svg>
        </div>
        <span className="text-[10px] font-bold text-slate-800 leading-none uppercase text-center">Extend</span>
      </button>
      <div className="w-[1px] h-10 bg-border/50 mx-1" />
      <button onClick={() => { setSketchTool('FILLET'); }} className={`flex flex-col items-center justify-center gap-0.5 px-3 h-[78px] min-w-[75px] transition-all border ${sketchTool === 'FILLET' ? 'bg-white border-[#A0A0A0] shadow-inner' : 'border-transparent hover:bg-white hover:border-[#A0A0A0]'} active:bg-slate-100 group`} title="Sketch Fillet">
        <div className={`w-10 h-10 flex items-center justify-center transition-transform ${sketchTool === 'FILLET' ? 'text-rose-600 scale-110' : 'text-slate-600 group-hover:scale-110'}`}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 20V8a4 4 0 0 1 4-4h12"/><path d="M4 20h12a4 4 0 0 0 4-4V4"/><circle cx="16" cy="16" r="1" fill="currentColor"/></svg>
        </div>
        <span className="text-[10px] font-bold text-slate-800 leading-none uppercase">Fillet</span>
      </button>
      <button onClick={() => { setSketchTool('CHAMFER'); }} className={`flex flex-col items-center justify-center gap-0.5 px-3 h-[78px] min-w-[75px] transition-all border ${sketchTool === 'CHAMFER' ? 'bg-white border-[#A0A0A0] shadow-inner' : 'border-transparent hover:bg-white hover:border-[#A0A0A0]'} active:bg-slate-100 group`} title="Sketch Chamfer">
        <div className={`w-10 h-10 flex items-center justify-center transition-transform ${sketchTool === 'CHAMFER' ? 'text-amber-600 scale-110' : 'text-slate-600 group-hover:scale-110'}`}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 20V8a4 4 0 0 1 4-4h12"/><path d="m4 20 6-6"/><path d="M10 14h4v4"/></svg>
        </div>
        <span className="text-[10px] font-bold text-slate-800 leading-none uppercase">Chamfer</span>
      </button>
      <div className="w-[1px] h-10 bg-border/50 mx-1" />
      <button onClick={() => { setSketchTool('LINEAR_PATTERN'); }} className={`flex flex-col items-center justify-center gap-0.5 px-3 h-[78px] min-w-[75px] transition-all border ${sketchTool === 'LINEAR_PATTERN' ? 'bg-white border-[#A0A0A0] shadow-inner' : 'border-transparent hover:bg-white hover:border-[#A0A0A0]'} active:bg-slate-100 group`} title="Linear Sketch Pattern">
        <div className={`w-10 h-10 flex items-center justify-center transition-transform ${sketchTool === 'LINEAR_PATTERN' ? 'text-[#005B9A] scale-110' : 'text-slate-600 group-hover:scale-110'}`}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="6" height="6" rx="1"/><rect x="15" y="3" width="6" height="6" rx="1"/><rect x="3" y="15" width="6" height="6" rx="1"/><path d="M12 6h3"/><path d="M6 12v3"/></svg>
        </div>
        <span className="text-[10px] font-bold text-slate-800 leading-none uppercase text-center">Linear<br/>Pattern</span>
      </button>
      <button onClick={() => { setSketchTool('CIRCULAR_PATTERN'); }} className={`flex flex-col items-center justify-center gap-0.5 px-3 h-[78px] min-w-[75px] transition-all border ${sketchTool === 'CIRCULAR_PATTERN' ? 'bg-white border-[#A0A0A0] shadow-inner' : 'border-transparent hover:bg-white hover:border-[#A0A0A0]'} active:bg-slate-100 group`} title="Circular Sketch Pattern">
        <div className={`w-10 h-10 flex items-center justify-center transition-transform ${sketchTool === 'CIRCULAR_PATTERN' ? 'text-[#005B9A] scale-110' : 'text-slate-600 group-hover:scale-110'}`}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="3"/><path d="M12 2v2"/><path d="M12 18v2"/><path d="M2 12h2"/><path d="M18 12h2"/><path d="m4.9 4.9 1.4 1.4"/><path d="m17.7 17.7 1.4 1.4"/><path d="m4.9 19.1 1.4-1.4"/><path d="m17.7 6.3 1.4-1.4"/></svg>
        </div>
        <span className="text-[10px] font-bold text-slate-800 leading-none uppercase text-center">Circular<br/>Pattern</span>
      </button>
      <div className="w-[1px] h-10 bg-border/50 mx-1" />
      <button onClick={() => { (window as any).__handleConvertEntities?.(); }} className="flex flex-col items-center justify-center gap-0.5 px-3 h-[78px] min-w-[75px] transition-all border border-transparent hover:bg-white hover:border-[#A0A0A0] active:bg-slate-100 group" title="Convert Entities">
        <div className="w-10 h-10 flex items-center justify-center text-slate-700 transition-transform group-hover:scale-110">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M12 22V12"/><path d="M12 12 3.5 7.5"/><path d="M12 12l8.5-4.5"/></svg>
        </div>
        <span className="text-[10px] font-bold text-slate-800 leading-none uppercase">Convert</span>
      </button>
      <button onClick={() => { (window as any).__handleOffsetEntities?.(); }} className="flex flex-col items-center justify-center gap-0.5 px-3 h-[78px] min-w-[75px] transition-all border border-transparent hover:bg-white hover:border-[#A0A0A0] active:bg-slate-100 group" title="Offset Entities">
        <div className="w-10 h-10 flex items-center justify-center text-slate-700 transition-transform group-hover:scale-110">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 12A10 10 0 0 0 12 2v0"/><path d="M22 12A10 10 0 0 1 12 22v0"/><path d="M12 22a10 10 0 0 1-10-10v0"/><path d="M12 2a10 10 0 0 0-10 10v0"/><path d="M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"/></svg>
        </div>
        <span className="text-[10px] font-bold text-slate-800 leading-none uppercase">Offset</span>
      </button>

      <div className="w-[1px] h-10 bg-border/50 mx-2" />
      {/* 3D Sketch Toggle */}
      <button onClick={() => set3DMode(!is3DMode)} className={`flex flex-col items-center justify-center gap-0.5 px-3 h-[78px] min-w-[75px] transition-all border ${is3DMode ? 'bg-white border-[#A0A0A0] shadow-inner' : 'border-transparent hover:bg-white hover:border-[#A0A0A0]'} active:bg-slate-100 group`} title="3D Sketch">
        <div className={`w-10 h-10 flex items-center justify-center transition-transform ${is3DMode ? 'text-[#005B9A] scale-110' : 'text-slate-600 group-hover:scale-110'}`}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 3l18 18"/><path d="M3 21l18-18"/><path d="M3 12h18"/><path d="M12 3v18"/></svg>
        </div>
        <span className="text-[10px] font-bold text-slate-800 leading-none uppercase">3D</span>
      </button>
      {is3DMode && (
        <div className="flex items-center gap-1 ml-1">
          {(['FRONT', 'TOP', 'RIGHT'] as const).map((plane) => (
            <button key={plane} onClick={() => setActive3DPlane(active3DPlane === plane ? null : plane)} className={`flex flex-col items-center justify-center gap-0.5 px-2 h-[78px] min-w-[55px] transition-all border ${active3DPlane === plane ? 'bg-white border-[#A0A0A0] shadow-inner' : 'border-transparent hover:bg-white hover:border-[#A0A0A0]'} active:bg-slate-100 group`} title={`${plane} Plane`}>
              <span className="text-[9px] font-bold text-slate-700 leading-tight uppercase">{plane}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
