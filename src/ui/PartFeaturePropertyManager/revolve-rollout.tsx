'use client';

import React from 'react';
import { Rollout } from '../PropertyManager/Rollout';
import { ParamInput } from './rollouts';
import type { FeatureContext } from './types';

export const RevolveRollout: React.FC<FeatureContext> = ({ selectedFeature, onParamChange }) => {
  const params = selectedFeature.parameters;
  const operation = params.operation === 'CUT' ? 'CUT' : 'ADD';

  return (
    <>
      <Rollout title={operation === 'CUT' ? "Revolved Cut Parameters" : "Revolve Parameters"} icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><polyline points="21 3 21 8 16 8"/></svg>}>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <select
              value={operation}
              onChange={(e) => onParamChange('operation', e.target.value)}
              className="flex-1 bg-white border border-slate-300 rounded px-2 py-1 text-[12px] font-bold"
            >
              <option value="ADD">Boss/Base</option>
              <option value="CUT">Cut</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Revolve Type</label>
            <select value="ONE_DIRECTION" disabled className="w-full bg-[#F5F5F5] border border-slate-300 rounded px-2 py-1 text-[12px] font-bold text-slate-500">
              <option value="ONE_DIRECTION">One-Direction</option>
            </select>
          </div>
          <ParamInput label="Angle" value={params.angle} onChange={(v: any) => onParamChange('angle', v)} unit="deg" badge="A1" />
        </div>
      </Rollout>
      <Rollout title="Axis of Revolution" icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="2" x2="12" y2="22"/><polyline points="5 12 12 12 19 12"/></svg>}>
        <div className="p-2 border border-dashed border-slate-200 rounded text-center">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest italic">Default: Sketch Axis</span>
        </div>
      </Rollout>
    </>
  );
};
