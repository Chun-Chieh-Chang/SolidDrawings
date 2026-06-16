'use client';

import React from 'react';
import { Rollout } from '../PropertyManager/Rollout';
import { SelectionBox } from '../PropertyManager/SelectionBox';
import { ParamInput } from './rollouts';
import type { FeatureContext } from './types';

export const DraftRollout: React.FC<FeatureContext> = ({ selectedFeature, onParamChange }) => {
  const params = selectedFeature.parameters;

  return (
    <Rollout title="Draft" icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}>
      <div className="space-y-3">
        <ParamInput
          label="Draft Angle"
          value={params.draftAngle || params.angle || 5}
          onChange={(v: any) => onParamChange('angle', v)}
          unit="deg"
          badge="ANG"
        />
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold text-slate-500 uppercase">Outward Direction</label>
          <button
            onClick={() => onParamChange('outward', !params.outward)}
            className={`px-3 py-1 rounded text-[10px] font-black border transition-all ${params.outward ? 'bg-[#005B9A] text-white border-[#005B9A]' : 'bg-white text-slate-400 border-slate-200'}`}
          >
            {params.outward ? 'OUTWARD' : 'INWARD'}
          </button>
        </div>
        <SelectionBox
          label="Neutral Plane/Axis"
          items={(params.neutral_plane_refs || []).map((ref: any, idx: number) => ({ id: ref.id || `${idx}`, name: ref.type === 'FACE' ? `Face ${ref.id.slice(0,4)}` : `Axis ${idx + 1}` }))}
          onRemove={() => onParamChange('neutral_plane_refs', [])}
          onClear={() => onParamChange('neutral_plane_refs', [])}
          placeholder="Select neutral plane or axis"
          maxHeight="60px"
        />
      </div>
    </Rollout>
  );
};
