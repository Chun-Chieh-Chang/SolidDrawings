'use client';

import React from 'react';
import { Rollout } from '../PropertyManager/Rollout';
import type { FeatureContext } from './types';

const OPERATIONS = [
  { value: 'ADD', label: 'Add', description: 'Merge tool body with the part body', icon: '⊕' },
  { value: 'SUBTRACT', label: 'Subtract', description: 'Remove tool body from the part body', icon: '⊖' },
  { value: 'INTERSECT', label: 'Intersect', description: 'Keep only the volume common to both bodies', icon: '∩' },
];

/**
 * CombineRollout handles Boolean operation selection (ADD / SUBTRACT / INTERSECT)
 * and tool body selection for the COMBINE feature type.
 */
export function CombineRollout({
  selectedFeature,
  features,
  onParamChange,
  pendingFeatureCommand,
}: FeatureContext) {
  const currentOp = selectedFeature.parameters?.operation || 'ADD';
  const currentToolId = selectedFeature.parameters?.tool_feature_id || '';

  // Filter candidate tool bodies: exclude the current feature itself
  const toolCandidates = features.filter(
    (f: any) => f.id !== selectedFeature.id && f.id && !['REFERENCE_PLANE', 'REFERENCE_AXIS', 'REFERENCE_POINT', 'REFERENCE_COORDINATE_SYSTEM', 'SKETCH'].includes(f.type)
  );

  return (
    <div className="space-y-1">
      <Rollout
        title="Operation Type"
        icon={
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <circle cx="9" cy="12" r="7" />
            <circle cx="15" cy="12" r="7" />
          </svg>
        }
        defaultOpen={true}
      >
        <div className="space-y-1">
          {OPERATIONS.map((op) => (
            <button
              key={op.value}
              onClick={() => onParamChange('operation', op.value)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded border text-left text-[11px] transition-all ${
                currentOp === op.value
                  ? 'bg-blue-50 border-blue-300 text-blue-800 font-bold'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <span className="text-sm font-mono w-5 text-center">{op.icon}</span>
              <div className="flex-1">
                <div className="font-bold">{op.label}</div>
                <div className="text-[9px] text-slate-400 font-medium">{op.description}</div>
              </div>
            </button>
          ))}
        </div>
      </Rollout>

      <Rollout
        title="Tool Body"
        icon={
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <rect x="3" y="3" width="18" height="18" rx="2" />
          </svg>
        }
        defaultOpen={true}
      >
        {toolCandidates.length === 0 ? (
          <div className="text-[10px] text-slate-400 italic px-1">
            Create another solid body first.
          </div>
        ) : (
          <div className="space-y-0.5 max-h-[180px] overflow-y-auto">
            {toolCandidates.map((f: any) => (
              <button
                key={f.id}
                onClick={() => onParamChange('tool_feature_id', f.id)}
                className={`w-full flex items-center gap-2 px-2 py-1 rounded border text-[10px] transition-all ${
                  currentToolId === f.id
                    ? 'bg-blue-50 border-blue-300 text-blue-800 font-bold'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span className="truncate flex-1">{f.name}</span>
                <span className="text-[8px] text-slate-400 font-mono uppercase">{f.type}</span>
              </button>
            ))}
          </div>
        )}
      </Rollout>
    </div>
  );
}
