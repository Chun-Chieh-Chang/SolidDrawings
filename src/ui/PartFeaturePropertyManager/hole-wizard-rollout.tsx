'use client';

import React from 'react';
import { Rollout } from '../PropertyManager/Rollout';
import { ParamInput } from './rollouts';
import type { FeatureContext } from './types';

export const HoleWizardRollout: React.FC<FeatureContext> = ({ selectedFeature, onParamChange }) => {
  const params = selectedFeature.parameters;
  const holeType = params.hole_type || 'SIMPLE';

  return (
    <>
      <Rollout title="Hole Type" icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>}>
        <div className="grid grid-cols-3 gap-1">
          {[
            { id: 'SIMPLE', label: 'Simple', icon: '🕳️' },
            { id: 'COUNTERBORE', label: 'C-Bore', icon: '⧉' },
            { id: 'COUNTERSINK', label: 'C-Sink', icon: '⌵' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => onParamChange('hole_type', t.id)}
              className={`flex flex-col items-center justify-center p-1.5 rounded border transition-all ${
                holeType === t.id
                  ? 'bg-primary/10 border-primary text-primary shadow-inner'
                  : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'
              }`}
            >
              <span className="text-lg">{t.icon}</span>
              <span className="text-[9px] font-black mt-1 uppercase tracking-tighter">{t.label}</span>
            </button>
          ))}
        </div>
      </Rollout>
      <Rollout title="Hole Specifications">
        <div className="space-y-3">
          <ParamInput label="Diameter" value={params.diameter} onChange={(v: any) => onParamChange('diameter', v)} badge="Ø" />
          <ParamInput label="Total Depth" value={params.depth} onChange={(v: any) => onParamChange('depth', v)} badge="HT" />
        </div>
      </Rollout>
    </>
  );
};
