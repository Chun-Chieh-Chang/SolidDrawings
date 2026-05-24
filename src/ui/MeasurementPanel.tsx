/**
 * Measurement Panel
 * 顯示測量結果的 PropertyManager 面板
 * 對標 SolidWorks Evaluate > Measure 功能
 */

import React from 'react';
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

  // 清除選取
  const handleClearSelection = () => {
    setMeasurementMode('NONE');
    setMeasurementPoints([]);
    setMeasurementResults(null);
  };

  // 切換測量模式
  const handleModeChange = (mode: MeasurementMode) => {
    setMeasurementMode(mode);
    setMeasurementPoints([]);
    setMeasurementResults(null);
  };

  // 格式化點座標
  const formatPoint = (point: any, index: number) => {
    if (!point || !point.coordinates) return null;
    const [x, y, z] = point.coordinates;
    return (
      <div key={`point_${index}`} className="flex items-center gap-2 p-1.5 bg-[#F8FAFC] rounded text-[13px]">
        <span className="font-bold text-primary">M{index + 1}</span>
        <span className="font-mono text-slate-600">
          [{x.toFixed(2)}, {y.toFixed(2)}, {z.toFixed(2)}]
        </span>
      </div>
    );
  };

  // 根據模式顯示說明
  const getModeInstructions = () => {
    switch (measurementMode) {
      case 'DISTANCE':
        return '點選兩個頂點以測量距離';
      case 'ANGLE':
        return '點選兩條邊以測量夾角';
      case 'AREA':
        return '點選一個面以測量面積';
      case 'VOLUME':
        return '點選一個實體以測量體積';
      default:
        return '選擇測量模式並點選幾何元素';
    }
  };

  return (
    <div className="p-2.5 bg-white rounded-xl border border-[#D1D5DB] shadow-sm space-y-3">
      {/* Panel Header */}
      <div className="text-[14px] text-slate-700 font-bold uppercase border-b border-[#D1D5DB]/50 pb-1 flex justify-between items-center">
        <span className="flex items-center gap-1">📋 量測屬性管理器</span>
        <span className="text-[13px] bg-slate-100 text-slate-500 px-1 py-0.5 rounded font-mono">MEASURE</span>
      </div>

      {/* Mode Selection */}
      <div className="grid grid-cols-2 gap-1.5">
        <button
          onClick={() => handleModeChange('DISTANCE')}
          className={`flex items-center justify-center gap-1.5 p-1.5 rounded border text-[13px] font-bold transition-all ${
            measurementMode === 'DISTANCE'
              ? 'bg-primary/10 border-primary text-primary shadow-sm'
              : 'bg-[#F8FAFC] border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <span>📏</span>
          <span>距離</span>
        </button>

        <button
          onClick={() => handleModeChange('ANGLE')}
          className={`flex items-center justify-center gap-1.5 p-1.5 rounded border text-[13px] font-bold transition-all ${
            measurementMode === 'ANGLE'
              ? 'bg-primary/10 border-primary text-primary shadow-sm'
              : 'bg-[#F8FAFC] border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <span>📐</span>
          <span>角度</span>
        </button>

        <button
          onClick={() => handleModeChange('AREA')}
          className={`flex items-center justify-center gap-1.5 p-1.5 rounded border text-[13px] font-bold transition-all ${
            measurementMode === 'AREA'
              ? 'bg-primary/10 border-primary text-primary shadow-sm'
              : 'bg-[#F8FAFC] border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <span>📐</span>
          <span>面積</span>
        </button>

        <button
          onClick={() => handleModeChange('VOLUME')}
          className={`flex items-center justify-center gap-1.5 p-1.5 rounded border text-[13px] font-bold transition-all ${
            measurementMode === 'VOLUME'
              ? 'bg-primary/10 border-primary text-primary shadow-sm'
              : 'bg-[#F8FAFC] border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <span>📦</span>
          <span>體積</span>
        </button>
      </div>

      {/* Instructions */}
      <div className="p-2 bg-[#F8FAFC] rounded text-[13px] text-slate-600 leading-tight">
        {getModeInstructions()}
      </div>

      {/* Selected Points */}
      {measurementPoints.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[13px] text-slate-500 font-bold uppercase">選取點:</div>
          {measurementPoints.map((point, index) => formatPoint(point, index))}
        </div>
      )}

      {/* Measurement Results */}
      {measurementResults && (
        <div className="p-3 bg-[#ECFDF5] rounded border border-[#10B981]/20 space-y-2">
          <div className="text-[13px] text-[#059669] font-bold uppercase">測量結果:</div>
          
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-slate-600 font-bold">模式:</span>
            <span className="text-[13px] text-[#059669] font-bold uppercase">{measurementResults.mode}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[13px] text-slate-600 font-bold">數值:</span>
            <span className="text-[16px] text-[#059669] font-bold font-mono">
              {(measurementResults.value ?? 0).toFixed(3)} {measurementResults.unit}
            </span>
          </div>

          {measurementResults.details && (
            <div className="text-[12px] text-slate-500 italic">
              {measurementResults.details}
            </div>
          )}
        </div>
      )}

      {/* Clear Button */}
      {(measurementMode !== 'NONE' || measurementPoints.length > 0) && (
        <button
          onClick={handleClearSelection}
          className="w-full flex items-center justify-center gap-1.5 p-2 bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#EF4444] rounded border border-[#E2E8F0] text-[13px] font-bold transition-all"
        >
          <span>🗑️</span>
          <span>清除選取</span>
        </button>
      )}
    </div>
  );
};
