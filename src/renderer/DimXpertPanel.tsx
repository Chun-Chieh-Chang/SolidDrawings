'use client';

import React, { useState } from 'react';
import { useCadStore } from '../store/useCadStore';

/**
 * DimXpertPanel shows recognized features with their dimensions
 * and allows toggling visibility.
 */
export default function DimXpertPanel() {
  const { dimxpertFeatures: features, toggleDimxpertFeatureVisibility: toggleVisibility, removeDimxpertFeature: removeFeature, isDimXpertActive, setIsDimXpertActive } = useCadStore();
  const [expandedFeatures, setExpandedFeatures] = useState<Set<string>>(new Set());

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
              <div className="px-3 pb-2 space-y-1 border-t border-gray-100 pt-2">
                {feature.dimensions.map((dim: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">{dim.type}</span>
                    <span className="font-mono text-gray-700">{dim.label}</span>
                  </div>
                ))}
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
