'use client';

import React, { useState } from 'react';
import { useCadStore } from '../store/useCadStore';
import { HeavyEngineClient } from '../kernel/HeavyEngineClient';

/**
 * DimXpertToolbar provides controls for DimXpert operations:
 * - Toggle DimXpert mode
 * - Show/hide feature panel
 * - Run feature recognition via backend API
 */
export default function DimXpertToolbar() {
  const {
    isDimXpertActive,
    setIsDimXpertActive,
    dimxpertFeatures: features,
    setDimxpertFeatures: setFeatures,
    features: cadFeatures,
  } = useCadStore();

  const [isRecognizing, setIsRecognizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const engineClient = React.useMemo(() => HeavyEngineClient.getInstance(), []);

  const handleToggleDimXpert = () => {
    setIsDimXpertActive(!isDimXpertActive);
    setError(null);
  };

  const handleRecognizeFeatures = async () => {
    setIsRecognizing(true);
    setError(null);

    try {
      const result = await engineClient.recognizeDimXpert(cadFeatures);
      if (result.features && result.features.length > 0) {
        setFeatures(result.features);
        setIsDimXpertActive(true);
      } else {
        setError('No features recognized. Try a different part.');
      }
    } catch (err) {
      console.error('[DimXpertToolbar] Recognition failed:', err);
      setError('Feature recognition failed. Is the backend running?');
    } finally {
      setIsRecognizing(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={handleToggleDimXpert}
        className={`flex flex-col items-center justify-center gap-0.5 px-3 h-[78px] min-w-[75px] transition-all border ${
          isDimXpertActive ? 'bg-blue-50 border-blue-300 shadow-inner' : 'border-transparent hover:bg-white hover:border-[#A0A0A0]'
        } active:bg-slate-100 group`}
        title="DimXpert - Automatic Feature Recognition"
      >
        <div className={`w-10 h-10 flex items-center justify-center transition-transform ${
          isDimXpertActive ? 'text-blue-600 scale-110' : 'text-slate-600 group-hover:scale-110'
        }`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
          </svg>
        </div>
        <span className="text-[10px] font-bold text-slate-800 leading-none uppercase">DimXpert</span>
      </button>

      {isDimXpertActive && (
        <>
          <button
            onClick={handleRecognizeFeatures}
            disabled={isRecognizing}
            className="flex flex-col items-center justify-center gap-0.5 px-3 h-[78px] min-w-[75px] transition-all border border-transparent hover:bg-white hover:border-[#A0A0A0] active:bg-slate-100 group disabled:opacity-50"
            title="Recognize Features"
          >
            <div className="w-10 h-10 flex items-center justify-center transition-transform text-blue-600 group-hover:scale-110">
              {isRecognizing ? (
                <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
            </div>
            <span className="text-[10px] font-bold text-slate-800 leading-none uppercase">
              {isRecognizing ? 'Scanning' : 'Recognize'}
            </span>
          </button>

          <div className="w-[1px] h-10 bg-border/50 mx-1" />

          <div className="flex flex-col items-center justify-center gap-0.5 px-3 h-[78px] min-w-[75px]">
            <div className="text-xs font-bold text-blue-600">{features.length}</div>
            <span className="text-[10px] font-bold text-slate-800 leading-none uppercase">Features</span>
          </div>

          {error && (
            <div className="flex flex-col items-center justify-center px-3 h-[78px]">
              <span className="text-[9px] text-red-500 font-medium leading-tight text-center max-w-[120px]">
                {error}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
