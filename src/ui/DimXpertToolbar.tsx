'use client';

import React from 'react';
import { useCadStore } from '../store/useCadStore';

/**
 * DimXpertToolbar provides controls for DimXpert operations:
 * - Toggle DimXpert mode
 * - Show/hide feature panel
 * - Run feature recognition (placeholder for backend call)
 */
export default function DimXpertToolbar() {
  const { isDimXpertActive, setIsDimXpertActive, dimxpertFeatures: features, setDimxpertFeatures: setFeatures } = useCadStore();

  const handleToggleDimXpert = () => {
    setIsDimXpertActive(!isDimXpertActive);
  };

  // Placeholder: simulate feature recognition
  const handleRecognizeFeatures = () => {
    // In a real implementation, this would call the backend API
    // For now, create some sample features
    const sampleFeatures = [
      {
        id: `sample_hole_${Date.now()}`,
        type: 'HOLE' as const,
        subtype: 'SIMPLE',
        name: 'Hole-1',
        confidence: 0.9,
        parameters: {
          diameter: 10.0,
          radius: 5.0,
          depth: 15.0,
          axis_direction: [0, 0, 1],
          origin: [0, 0, 0],
        },
        faces: ['face_1'],
        edges: ['edge_1'],
        vertices: ['vertex_1'],
        dimensions: [
          {
            id: 'dim_1',
            type: 'DIAMETER' as const,
            value: 10.0,
            label: '@10.000',
          },
        ],
        visible: true,
      },
      {
        id: `sample_fillet_${Date.now()}`,
        type: 'FILLET' as const,
        subtype: 'ROUND',
        name: 'Fillet-1',
        confidence: 0.85,
        parameters: {
          radius: 2.0,
          edge_count: 4,
          edges: ['edge_2', 'edge_3', 'edge_4', 'edge_5'],
          faces: ['face_2', 'face_3'],
        },
        faces: ['face_2', 'face_3'],
        edges: ['edge_2', 'edge_3', 'edge_4', 'edge_5'],
        vertices: [],
        dimensions: [
          {
            id: 'dim_2',
            type: 'RADIUS' as const,
            value: 2.0,
            label: 'R2.000',
          },
        ],
        visible: true,
      },
    ];

    setFeatures(sampleFeatures);
    setIsDimXpertActive(true);
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
            className="flex flex-col items-center justify-center gap-0.5 px-3 h-[78px] min-w-[75px] transition-all border border-transparent hover:bg-white hover:border-[#A0A0A0] active:bg-slate-100 group"
            title="Recognize Features"
          >
            <div className="w-10 h-10 flex items-center justify-center transition-transform text-blue-600 group-hover:scale-110">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <span className="text-[10px] font-bold text-slate-800 leading-none uppercase">Recognize</span>
          </button>

          <div className="w-[1px] h-10 bg-border/50 mx-1" />

          <div className="flex flex-col items-center justify-center gap-0.5 px-3 h-[78px] min-w-[75px]">
            <div className="text-xs font-bold text-blue-600">{features.length}</div>
            <span className="text-[10px] font-bold text-slate-800 leading-none uppercase">Features</span>
          </div>
        </>
      )}
    </div>
  );
}
