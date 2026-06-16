'use client';

import React from 'react';
import { Rollout } from '../PropertyManager/Rollout';
import { SelectionBox } from '../PropertyManager/SelectionBox';
import { ParamInput } from './rollouts';
import type { FeatureContext } from './types';

export const DumbSolidRollout: React.FC<FeatureContext> = ({ selectedFeature, onParamChange }) => {
  const params = selectedFeature.parameters;
  return (
    <Rollout title="Translation">
      <div className="space-y-2">
        {['x', 'y', 'z'].map(axis => <ParamInput key={axis} label={axis.toUpperCase()} value={params[axis]} onChange={(v: any) => onParamChange(axis, v)} badge={axis.toUpperCase()} />)}
      </div>
    </Rollout>
  );
};

export const LoftRollout: React.FC<FeatureContext> = ({ selectedFeature, features, onParamChange }) => {
  const params = selectedFeature.parameters;

  const addProfile = () => {
    const id = prompt('Enter profile sketch ID to add:');
    if (id) {
      const current = params.profile_ids || [];
      if (!current.includes(id)) onParamChange('profile_ids', [...current, id]);
    }
  };

  const addGuide = () => {
    const id = prompt('Enter guide sketch ID to add:');
    if (id) {
      const current = params.guide_ids || [];
      if (!current.includes(id)) onParamChange('guide_ids', [...current, id]);
    }
  };

  return (
    <>
      <Rollout title="Loft Profiles" icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M4 20h16"/><path d="M6 12h12"/><path d="M8 4h8"/><path d="M4 20L8 4"/><path d="M20 20L16 4"/></svg>}>
        <div className="space-y-2">
          <button
            onClick={addProfile}
            className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-[12px] font-bold hover:bg-slate-50"
          >
            + Add Profile Sketch...
          </button>
          <SelectionBox
            label="Profiles"
            items={(params.profile_ids || []).map((id: string) => ({ id, name: (features || []).find(f => f.id === id)?.name || id }))}
            onRemove={(id: string) => onParamChange('profile_ids', (params.profile_ids as string[]).filter((tid: string) => tid !== id))}
            onClear={() => onParamChange('profile_ids', [])}
          />
        </div>
      </Rollout>

      <Rollout title="Guide Curves" icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M4 22C4 13 14 13 14 4"/><circle cx="14" cy="4" r="2"/><circle cx="4" cy="22" r="2"/></svg>}>
        <div className="space-y-2">
          <button
            onClick={addGuide}
            className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-[12px] font-bold hover:bg-slate-50"
          >
            + Add Guide Sketch...
          </button>
          <SelectionBox
            label="Guide Curves"
            items={(params.guide_ids || []).map((id: string) => ({ id, name: (features || []).find(f => f.id === id)?.name || id }))}
            onRemove={(id: string) => onParamChange('guide_ids', (params.guide_ids as string[]).filter((tid: string) => tid !== id))}
            onClear={() => onParamChange('guide_ids', [])}
          />
        </div>
      </Rollout>
    </>
  );
};
