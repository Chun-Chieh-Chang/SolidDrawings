'use client';

import React from 'react';
import { Rollout } from '../PropertyManager/Rollout';
import { SelectionBox } from '../PropertyManager/SelectionBox';
import { ParamInput } from './rollouts';
import type { FeatureContext } from './types';

export const FilletChamferRollout: React.FC<FeatureContext> = ({ selectedFeature, onParamChange }) => {
  const params = selectedFeature.parameters;
  const isFillet = selectedFeature.type === 'FILLET';
  const itemType = isFillet ? "Edges to Fillet" : "Edges to Chamfer";
  const radiusLabel = isFillet ? "Radius" : "Distance";
  const paramKey = isFillet ? 'radius' : 'distance';
  const badge = isFillet ? 'R1' : 'D1';

  return (
    <>
      <Rollout title="Items to Fillet" icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}>
        <SelectionBox
          label={itemType}
          items={(params.refs || []).map((ref: any, idx: number) => ({ id: ref.id || `${idx}`, name: `Edge ${idx + 1}` }))}
          onRemove={(id: string) => {
            const newRefs = (params.refs as any[]).filter((r: any) => r.id !== id);
            onParamChange('refs', newRefs);
          }}
          onClear={() => onParamChange('refs', [])}
          placeholder="Select edges from 3D view"
        />
      </Rollout>
      <Rollout title={isFillet ? "Fillet Parameters" : "Chamfer Parameters"} icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"/><path d="M12 2a7 7 0 0 1 7 7"/></svg>}>
        <div className="space-y-3">
          <ParamInput label={radiusLabel} value={params[paramKey]} onChange={(v: any) => onParamChange(paramKey, v)} badge={badge} />
          {isFillet && <ParamInput label="Radius 2" value={params.radius2} onChange={(v: any) => onParamChange('radius2', v)} badge="R2" />}
        </div>
      </Rollout>
    </>
  );
};
