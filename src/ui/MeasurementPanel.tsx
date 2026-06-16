/**
 * Measurement Panel
 * DisplayMeasureResult PropertyManager Panel
 * Aligned with SolidWorks Evaluate > Measure 
 */

import React, { useEffect } from 'react';
import { useCadStore, type MeasurementMode, type MeasurementResult } from '../store/useCadStore';
import { MeasurementService } from '../kernel/MeasurementService';

export const MeasurementPanel = () => {
  const {
    measurementMode,
    measurementPoints,
    measurementResults,
    setMeasurementMode,
    setMeasurementPoints,
    setMeasurementResults,
  } = useCadStore();

  const measurementService = new MeasurementService();

  useEffect(() => {
    if (measurementPoints.length === 2) {
      const p1 = measurementPoints[0];
      const p2 = measurementPoints[1];

      const dist = measurementService.calculateDistance(p1.coordinates, p2.coordinates);

      let angle = 0;
      if (p1.normal && p2.normal) {
        angle = measurementService.calculateAngle(p1.normal, p2.normal);
      }

      setMeasurementResults({
        mode: measurementMode,
        value: dist,
        unit: 'mm',
        details: angle > 0 ? `Angle (Angle): ${angle.toFixed(2)}°` : undefined
      });
    } else if (measurementPoints.length === 1 && (measurementMode === 'AREA' || measurementMode === 'VOLUME')) {
       // Future: Call backend for precision area/volume
       const p = measurementPoints[0];
       if (p.signature && 'area' in p.signature) {
          setMeasurementResults({
            mode: 'AREA',
            value: (p.signature as any).area,
            unit: 'mm²',
            details: `Face ID: ${p.id}`
          });
       }
    } else {
      setMeasurementResults(null);
    }
  }, [measurementPoints, measurementMode, setMeasurementResults]);

  const handleClearSelection = () => {
    setMeasurementPoints([]);
    setMeasurementResults(null);
  };

  const handleModeChange = (mode: MeasurementMode) => {
    setMeasurementMode(mode);
    setMeasurementPoints([]);
    setMeasurementResults(null);
  };

  const formatPoint = (point: any, index: number) => {
    if (!point || !point.coordinates) return null;
    const [x, y, z] = point.coordinates;
    return (
      <div key={`point_${index}`} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg text-[12px] group">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 flex items-center justify-center bg-primary text-white rounded-full font-bold text-[10px]">
            {index + 1}
          </span>
          <div className="flex flex-col">
            <span className="font-bold text-slate-700 uppercase tracking-tighter">{point.type}</span>
            <span className="font-mono text-slate-400 text-[10px]">ID: {point.id.slice(0, 8)}</span>
          </div>
        </div>
        <div className="text-right font-mono text-slate-600">
          [{x.toFixed(1)}, {y.toFixed(1)}, {z.toFixed(1)}]
        </div>
      </div>
    );
  };

  return (
    <div className="p-3 bg-white rounded-xl border border-slate-300 shadow-lg space-y-4 w-full">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-emerald-500 text-white rounded flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m11 15.5 2 2 4.5-4.5"/><path d="M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18z"/></svg>
          </div>
          <span className="text-[13px] font-black text-slate-800 uppercase tracking-wider">Geometry Measure (Measure)</span>
        </div>
        <button 
           onClick={() => setMeasurementMode('NONE')}
           className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </div>

      {/* Mode Selection */}
      <div className="grid grid-cols-2 gap-1.5">
        {(['DISTANCE', 'ANGLE', 'AREA', 'VOLUME'] as MeasurementMode[]).map(mode => (
          <button
            key={mode}
            onClick={() => handleModeChange(mode)}
            className={`flex items-center justify-center gap-2 p-1.5 rounded-lg border text-[11px] font-bold transition-all ${
              measurementMode === mode
                ? 'bg-primary text-white border-primary shadow-md'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {mode}
          </button>
        ))}
      </div>

      {/* Selected Entities */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center px-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Selected Solid ({measurementPoints.length})</span>
          {measurementPoints.length > 0 && (
            <button onClick={handleClearSelection} className="text-[10px] text-primary font-bold hover:underline">Clear</button>
          )}
        </div>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {measurementPoints.length === 0 ? (
             <div className="py-4 text-center border border-dashed border-slate-200 rounded-lg bg-slate-50 text-[11px] text-slate-400 italic">
               In 3D viewport, select Midpoint ofFace、EdgeorVertex
             </div>
          ) : (
            measurementPoints.map((point, index) => formatPoint(point, index))
          )}
        </div>
      </div>

      {/* Measurement Results */}
      {measurementResults && (
        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] text-emerald-600 font-bold uppercase tracking-widest">{measurementResults.mode} Result</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-emerald-800 font-mono tracking-tighter">
                {measurementResults.value?.toFixed(3) ?? '0.000'}
              </span>
              <span className="text-[12px] text-emerald-600 font-bold">{measurementResults.unit}</span>
            </div>
          </div>

          {measurementResults.details && (
            <div className="text-[12px] text-slate-600 bg-white/50 p-2 rounded-lg border border-emerald-100/50 font-medium">
              {measurementResults.details}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
