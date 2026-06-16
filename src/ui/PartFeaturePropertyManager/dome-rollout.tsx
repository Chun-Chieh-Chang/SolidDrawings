'use client';

import React from 'react';
import { Rollout } from '../PropertyManager/Rollout';
import { ParamInput } from './rollouts';
import type { FeatureContext } from './types';

export const DomeRollout: React.FC<FeatureContext> = ({ selectedFeature, onParamChange }) => {
  const params = selectedFeature.parameters;
  return (
    <Rollout title="Dome" icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}>
      <div className="space-y-3">
        <ParamInput label="Dome Angle" value={params.angle || 0} onChange={(v: any) => onParamChange('angle', v)} unit="deg" badge="ANG" />
        <ParamInput label="Offset" value={params.offset || 0} onChange={(v: any) => onParamChange('offset', v)} badge="OFF" />
      </div>
    </Rollout>
  );
};
