'use client';

import React from 'react';
import { useCadStore } from '@/store/useCadStore';

export function SectionViewPropertyManager() {
  const { sectionView, setSectionView } = useCadStore();

  if (!sectionView.isActive) return null;

  return (
    <div className="h-[250px] w-full border-t border-border bg-surface flex flex-col p-3 z-10 shrink-0">
      <div className="text-[14px] uppercase tracking-wider text-secondary-text mb-2 font-bold flex justify-between items-center border-b border-border/40 pb-1">
        <span>Section View (Section View)</span>
        <button 
          onClick={() => {
            setSectionView({ isActive: false });
            useCadStore.getState().setActivePropertyManager(null);
          }}
          className="text-secondary-text hover:text-red-500 transition-colors"
          title="Deactivate"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
        <div className="bg-surface p-0 rounded border border-border shadow-sm overflow-hidden text-[14px]">
          <div className="bg-slate-50 px-2 py-1.5 border-b border-border font-bold text-slate-700 text-[13px] flex items-center gap-1">
            <span className="text-[14px]">▼</span> Section Plane 1
          </div>
          <div className="p-2 space-y-3">
            
            {/* Reference Plane Selection */}
            <div className="flex gap-2 justify-center">
              {[
                { id: 'FRONT', label: 'Front' },
                { id: 'TOP', label: 'Top' },
                { id: 'RIGHT', label: 'Right' }
              ].map(plane => (
                <button
                  key={plane.id}
                  onClick={() => setSectionView({ plane: plane.id as any })}
                  className={`flex-1 py-1.5 rounded text-[13px] font-bold border transition-all ${
                    sectionView.plane === plane.id
                      ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {plane.label}
                </button>
              ))}
            </div>

            {/* Offset */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[13px] text-slate-600 font-medium">
                <span>Distance (Offset)</span>
                <span className="font-mono text-slate-500">{sectionView.offset} mm</span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                step="1"
                value={sectionView.offset}
                onChange={(e) => setSectionView({ offset: parseFloat(e.target.value) })}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <input
                type="number"
                value={sectionView.offset}
                onChange={(e) => setSectionView({ offset: parseFloat(e.target.value) || 0 })}
                className="w-full mt-1 border border-[#C4C7CE] rounded px-2 py-1 text-right font-mono text-[13px]"
              />
            </div>

            {/* Flip */}
            <label className="flex items-center gap-2 text-[13px] text-slate-700 cursor-pointer pt-1 border-t border-slate-100">
              <input
                type="checkbox"
                checked={sectionView.flip}
                onChange={(e) => setSectionView({ flip: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="font-medium">Reverse Direction (Reverse Direction)</span>
            </label>

          </div>
        </div>
      </div>
    </div>
  );
}
