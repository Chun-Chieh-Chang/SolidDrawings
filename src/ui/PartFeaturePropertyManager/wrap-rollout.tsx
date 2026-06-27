'use client';

import React from 'react';
import { Rollout } from '../PropertyManager/Rollout';
import { ParamInput } from './rollouts';
import type { FeatureContext } from './types';

const WRAP_TYPES = [
  { value: 'EMBOSS', label: 'Emboss', desc: 'Raised feature above the surface', color: 'text-blue-600' },
  { value: 'DEBOSS', label: 'Deboss', desc: 'Recessed feature into the surface', color: 'text-orange-600' },
  { value: 'SCRIBE', label: 'Scribe', desc: 'Outline only, no volume change', color: 'text-purple-600' },
];

export const WrapRollout: React.FC<FeatureContext> = ({ selectedFeature, onParamChange }) => {
  const params = selectedFeature.parameters;
  const wrapType = params.wrap_type || 'EMBOSS';
  const isScribe = wrapType === 'SCRIBE';

  return (
    <div className="space-y-1">
      <Rollout
        title="Wrap Type"
        icon={
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M4 12c0-4 2-8 8-8s8 4 8 8-2 8-8 8-8-4-8-8z" />
            <path d="M12 8v8M8 12h8" />
          </svg>
        }
        defaultOpen={true}
      >
        <div className="space-y-1">
          {WRAP_TYPES.map((wt) => (
            <button
              key={wt.value}
              onClick={() => onParamChange('wrap_type', wt.value)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded border text-left text-[11px] transition-all ${
                wrapType === wt.value
                  ? 'bg-blue-50 border-blue-300 text-blue-800 font-bold'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex-1">
                <div className={`font-bold ${wrapType === wt.value ? wt.color : ''}`}>{wt.label}</div>
                <div className="text-[9px] text-slate-400 font-medium">{wt.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </Rollout>

      {!isScribe && (
        <Rollout
          title="Parameters"
          icon={
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 3v18M15 3v18" />
            </svg>
          }
          defaultOpen={true}
        >
          <div className="space-y-3">
            <ParamInput
              label="Thickness"
              value={params.thickness || 1.0}
              onChange={(v: any) => onParamChange('thickness', v)}
              unit="mm"
              badge="T"
            />
          </div>
        </Rollout>
      )}
    </div>
  );
};
