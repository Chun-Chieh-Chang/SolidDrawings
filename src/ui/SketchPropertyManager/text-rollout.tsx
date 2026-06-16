import React from 'react';
import { SketchEdge } from '@/store/useCadStore';

interface TextRolloutProps {
  selectedEntityIds: string[];
  sketchEdges: Record<string, SketchEdge>;
  updateEntityProperty: (id: string, key: string, value: any) => void;
}

export const TextRollout: React.FC<TextRolloutProps> = ({
  selectedEntityIds,
  sketchEdges,
  updateEntityProperty,
}) => {
  return (
    <div className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden animate-in slide-in-from-top-2 duration-200">
      <div className="px-2 py-1 bg-slate-100 border-b border-slate-300 flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-700 uppercase tracking-tighter flex items-center gap-1.5">
          <span className="text-blue-600">✍️</span> Text Parameters
        </span>
      </div>
      <div className="p-2 space-y-3">
        <div className="space-y-1">
          <label className="text-[9px] font-bold text-slate-500 uppercase">Input Text</label>
          <input
            type="text"
            defaultValue="3D Builder"
            className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-[12px] font-bold"
            onChange={(e) => {
              selectedEntityIds.forEach(id => {
                if (sketchEdges[id]?.type === 'TEXT') {
                  updateEntityProperty(id, 'parameters', { ...sketchEdges[id].parameters, text: e.target.value });
                }
              });
            }}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-500 uppercase">Height (mm)</label>
            <input
              type="number"
              defaultValue={10}
              className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-[12px] font-bold"
              onChange={(e) => {
                selectedEntityIds.forEach(id => {
                  if (sketchEdges[id]?.type === 'TEXT') {
                    updateEntityProperty(id, 'parameters', { ...sketchEdges[id].parameters, height: parseFloat(e.target.value) });
                  }
                });
              }}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-500 uppercase">Font</label>
            <select
              className="w-full bg-white border border-slate-300 rounded px-1 py-1 text-[11px] font-bold"
              onChange={(e) => {
                selectedEntityIds.forEach(id => {
                  if (sketchEdges[id]?.type === 'TEXT') {
                    updateEntityProperty(id, 'parameters', { ...sketchEdges[id].parameters, font: e.target.value });
                  }
                });
              }}
            >
              <option value="SingleLine">Stick (CNC)</option>
              <option value="Arial">Arial</option>
              <option value="Times New Roman">Times</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            defaultChecked={true}
            id="single_line_check"
            onChange={(e) => {
              selectedEntityIds.forEach(id => {
                if (sketchEdges[id]?.type === 'TEXT') {
                  updateEntityProperty(id, 'parameters', { ...sketchEdges[id].parameters, isSingleLine: e.target.checked });
                }
              });
            }}
          />
          <label htmlFor="single_line_check" className="text-[10px] font-bold text-slate-600">Single Line (CNC Mode)</label>
        </div>
      </div>
    </div>
  );
};
