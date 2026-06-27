'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useCadStore } from '../store/useCadStore';
import type { DimXpertGrade, ToleranceCacheEntry, DeviationCacheEntry } from '../store/dimxpert-state';

const TOLERANCE_GRADES: { value: DimXpertGrade; label: string; description: string }[] = [
  { value: 'IT01', label: 'IT01', description: 'Gauge tolerance' },
  { value: 'IT0',  label: 'IT0',  description: 'Gauge tolerance' },
  { value: 'IT1',  label: 'IT1',  description: 'Gauge tolerance' },
  { value: 'IT2',  label: 'IT2',  description: 'High precision' },
  { value: 'IT3',  label: 'IT3',  description: 'High precision' },
  { value: 'IT4',  label: 'IT4',  description: 'Precision fit' },
  { value: 'IT5',  label: 'IT5',  description: 'Precision fit' },
  { value: 'IT6',  label: 'IT6',  description: 'Fine fit' },
  { value: 'IT7',  label: 'IT7',  description: 'Standard fit' },
  { value: 'IT8',  label: 'IT8',  description: 'Standard fit' },
];

/**
 * DimXpertPanel shows recognized features with their dimensions,
 * tolerance grade selection, and visualized tolerance values.
 */
export default function DimXpertPanel() {
  const {
    dimxpertFeatures: features,
    toggleDimxpertFeatureVisibility: toggleVisibility,
    removeDimxpertFeature: removeFeature,
    isDimXpertActive,
    setIsDimXpertActive,
    dimxpertActiveGrade,
    setDimxpertActiveGrade,
    computeTolerance,
    computeDeviations,
    toleranceCache,
    deviationCache,
  } = useCadStore();
  const [expandedFeatures, setExpandedFeatures] = useState<Set<string>>(new Set());
  const fetchingRef = useRef(false);

  // ── Fetch tolerance data when expanding features or changing grade ──
  useEffect(() => {
    if (expandedFeatures.size === 0) return;

    const fetchTolerances = async () => {
      fetchingRef.current = true;
      const promises: Promise<any>[] = [];
      for (const feature of features) {
        if (!expandedFeatures.has(feature.id)) continue;
        for (const dim of feature.dimensions) {
          if (dim.type === 'ANGLE') continue; // ISO 286 is for linear sizes
          const tolKey = `${dim.value}_${dimxpertActiveGrade}`;
          const cached = toleranceCache[tolKey];
          if (!cached || cached.loading) {
            promises.push(computeTolerance(dim.value, dimxpertActiveGrade));
          }
          const devKey = `${dim.value}_${dimxpertActiveGrade}_H`;
          const devCached = deviationCache[devKey];
          if (!devCached || devCached.loading) {
            promises.push(computeDeviations(dim.value, dimxpertActiveGrade, 'H'));
          }
        }
      }
      await Promise.all(promises);
      fetchingRef.current = false;
    };

    fetchTolerances();
  }, [expandedFeatures, dimxpertActiveGrade, features, computeTolerance, computeDeviations, toleranceCache, deviationCache]);

  if (!isDimXpertActive) return null;

  const toggleExpand = (featureId: string) => {
    setExpandedFeatures(prev => {
      const next = new Set(prev);
      if (next.has(featureId)) {
        next.delete(featureId);
      } else {
        next.add(featureId);
      }
      return next;
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'HOLE':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="4" />
          </svg>
        );
      case 'SLOT':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="6" width="18" height="12" rx="6" />
          </svg>
        );
      case 'FILLET':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 20 Q4 4 20 4" />
          </svg>
        );
      case 'CHAMFER':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 20 L20 4" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'HOLE': return 'text-blue-600';
      case 'SLOT': return 'text-green-600';
      case 'FILLET': return 'text-purple-600';
      case 'CHAMFER': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="w-72 bg-white border-l border-gray-200 overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-800">DimXpert Features</h2>
          <button
            onClick={() => setIsDimXpertActive(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">{features.length} features recognized</p>

        {/* Tolerance grade selector */}
        <div className="mt-3">
          <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Tolerance Grade</label>
          <div className="flex flex-wrap gap-1 mt-1">
            {TOLERANCE_GRADES.map(({ value, label, description }) => (
              <button
                key={value}
                onClick={() => setDimxpertActiveGrade(value)}
                className={`px-1.5 py-0.5 text-[10px] font-mono rounded border transition-all ${
                  dimxpertActiveGrade === value
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'
                }`}
                title={`${label} - ${description}`}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="text-[9px] text-gray-400 mt-1">
            {TOLERANCE_GRADES.find(g => g.value === dimxpertActiveGrade)?.description}
          </p>
        </div>
      </div>

      <div className="p-2 space-y-2">
        {features.map((feature: any) => (
          <div
            key={feature.id}
            className="border border-gray-200 rounded-lg overflow-hidden"
          >
            <div
              className="flex items-center gap-2 p-2 cursor-pointer hover:bg-gray-50"
              onClick={() => toggleExpand(feature.id)}
            >
              <span className={getTypeColor(feature.type)}>
                {getTypeIcon(feature.type)}
              </span>
              <span className="text-xs font-medium text-gray-700 flex-1 truncate">
                {feature.name}
              </span>
              <span className="text-xs text-gray-400">
                {Math.round(feature.confidence * 100)}%
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleVisibility(feature.id);
                }}
                className={`w-4 h-4 rounded border ${
                  feature.visible ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                }`}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFeature(feature.id);
                }}
                className="text-gray-400 hover:text-red-500"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" />
                </svg>
              </button>
            </div>

            {expandedFeatures.has(feature.id) && (
              <div className="px-3 pb-2 border-t border-gray-100 pt-2">
                {feature.dimensions.map((dim: any, idx: number) => {
                  if (dim.type === 'ANGLE') {
                    return (
                      <div key={idx} className="flex items-center justify-between text-xs py-0.5">
                        <span className="text-gray-500">{dim.type}</span>
                        <span className="font-mono text-gray-700">{dim.label}</span>
                      </div>
                    );
                  }
                  const tolKey = `${dim.value}_${dimxpertActiveGrade}`;
                  const tol = toleranceCache[tolKey] as ToleranceCacheEntry | undefined;
                  const devKey = `${dim.value}_${dimxpertActiveGrade}_H`;
                  const dev = deviationCache[devKey] as DeviationCacheEntry | undefined;

                  return (
                    <div key={idx} className="py-1 border-b border-gray-50 last:border-b-0">
                      {/* Dimension type + value */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">{dim.type}</span>
                        <span className="font-mono text-gray-700">{dim.label}</span>
                      </div>
                      {/* Tolerance info */}
                      <div className="flex items-center justify-between mt-0.5">
                        {tol?.loading ? (
                          <span className="text-[9px] text-blue-400 italic">computing…</span>
                        ) : tol?.error ? (
                          <span className="text-[9px] text-red-400">{tol.error}</span>
                        ) : tol ? (
                          <div className="flex items-center gap-2 text-[9px] font-mono text-gray-500">
                            <span className="bg-gray-100 px-1 rounded">{tol.grade}</span>
                            <span>±{tol.tolerance_um} µm</span>
                            <span className="text-gray-400">({tol.size_range})</span>
                          </div>
                        ) : null}
                        {/* Deviation info */}
                        {dev && !dev.loading && !dev.error && (
                          <div className="text-[9px] font-mono text-gray-400">
                            ({dev.lower_deviation_um < 0 ? '' : '+'}{dev.lower_deviation_um} / +{dev.upper_deviation_um} µm)
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div className="text-xs text-gray-400 mt-1">
                  Faces: {feature.faces.length} | Edges: {feature.edges.length}
                </div>
              </div>
            )}
          </div>
        ))}

        {features.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-xs">
            No features recognized.<br />
            Run feature recognition from the toolbar.
          </div>
        )}
      </div>
    </div>
  );
}
