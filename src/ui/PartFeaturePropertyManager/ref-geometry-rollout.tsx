'use client';

import React from 'react';
import { useCadStore } from '@/store/useCadStore';
import { Rollout } from '../PropertyManager/Rollout';
import { SelectionBox } from '../PropertyManager/SelectionBox';
import { ParamInput } from './rollouts';
import type { FeatureContext } from './types';

export const RefGeometryRollout: React.FC<FeatureContext> = ({ selectedFeature, features, onParamChange, pendingFeatureCommand }) => {
  const params = selectedFeature.parameters;
  const planeType = params.planeType || 'OFFSET';

  if (selectedFeature.type === 'REFERENCE_POINT') {
    return (
      <Rollout title="Reference Point" icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="4" fill="currentColor"/></svg>}>
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Method</label>
            <select
              value={params.pointType || 'FACE_CENTER'}
              onChange={(e) => onParamChange('pointType', e.target.value)}
              className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-[12px] font-bold"
            >
              <option value="FACE_CENTER">Center of Face</option>
              <option value="OFFSET">Offset</option>
              <option value="INTERSECTION">Intersection</option>
            </select>
          </div>
          {params.pointType === 'OFFSET' && (
            <ParamInput label="Offset Distance" value={params.offset || 0} onChange={(v: any) => onParamChange('offset', v)} badge="DIST" />
          )}
          <SelectionBox
            label="References"
            selectedCount={params.refs?.length || 0}
            onClear={() => onParamChange('refs', [])}
            placeholder="Select face or edge"
            active={pendingFeatureCommand === 'REFERENCE_POINT'}
            onClick={() => useCadStore.setState({ pendingFeatureCommand: 'REFERENCE_POINT' as any })}
          />
        </div>
      </Rollout>
    );
  }

  if (selectedFeature.type === 'REFERENCE_COORDINATE_SYSTEM') {
    const creationType = params.type || 'planes';
    return (
      <Rollout title="Coordinate System" icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
        <line x1="2" y1="12" x2="22" y2="12" stroke="#EF4444" strokeWidth="4"/>
        <polyline points="16 8 22 12 16 16"/>
        <line x1="12" y1="2" x2="12" y2="22" stroke="#10B981" strokeWidth="4"/>
        <polyline points="8 8 12 2 16 8"/>
      </svg>}>
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Creation Method</label>
            <select
              value={creationType}
              onChange={(e) => onParamChange('type', e.target.value)}
              className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-[12px] font-bold"
            >
              <option value="planes">3 Planes/Faces (3個平面)</option>
              <option value="axes">2 Axes (2個軸)</option>
              <option value="points">3 Points (3個點)</option>
              <option value="origin">Origin + 2 Axes (原點 + 2軸)</option>
            </select>
          </div>

          {creationType === 'planes' && (
            <>
              <div className="p-2 bg-blue-50 border border-blue-100 rounded text-[10px] text-blue-700 font-bold leading-tight">
                Select 3 planar faces or reference planes. The first plane defines the origin, the second defines the X-axis direction, and the third defines the Y-axis direction.
              </div>
              <SelectionBox label="Selected Planes" selectedCount={params.selections?.length || 0} onClear={() => onParamChange('selections', [])} active={pendingFeatureCommand === 'COORDINATE_SYSTEM'} onClick={() => useCadStore.setState({ pendingFeatureCommand: 'COORDINATE_SYSTEM' as any })} />
            </>
          )}

          {creationType === 'axes' && (
            <>
              <div className="p-2 bg-blue-50 border border-blue-100 rounded text-[10px] text-blue-700 font-bold leading-tight">
                Select 2 reference axes. The first axis defines the X direction, and the second axis defines the Y direction.
              </div>
              <SelectionBox label="Selected Axes" selectedCount={params.selections?.length || 0} onClear={() => onParamChange('selections', [])} active={pendingFeatureCommand === 'COORDINATE_SYSTEM'} onClick={() => useCadStore.setState({ pendingFeatureCommand: 'COORDINATE_SYSTEM' as any })} />
            </>
          )}

          {creationType === 'points' && (
            <>
              <div className="p-2 bg-blue-50 border border-blue-100 rounded text-[10px] text-blue-700 font-bold leading-tight">
                Select 3 points. Point 1 = Origin, Point 2 = X-axis direction, Point 3 = Y-axis direction.
              </div>
              <SelectionBox label="Selected Points" selectedCount={params.selections?.length || 0} onClear={() => onParamChange('selections', [])} active={pendingFeatureCommand === 'COORDINATE_SYSTEM'} onClick={() => useCadStore.setState({ pendingFeatureCommand: 'COORDINATE_SYSTEM' as any })} />
            </>
          )}

          {creationType === 'origin' && (
            <>
              <div className="p-2 bg-blue-50 border border-blue-100 rounded text-[10px] text-blue-700 font-bold leading-tight">
                Define the origin point and two axis directions for the coordinate system.
              </div>
              <ParamInput label="Origin X" value={params.origin?.[0] || 0} onChange={(v: any) => {
                const current = params.origin || [0, 0, 0];
                onParamChange('origin', [v, current[1], current[2]]);
              }} badge="OX" />
              <ParamInput label="Origin Y" value={params.origin?.[1] || 0} onChange={(v: any) => {
                const current = params.origin || [0, 0, 0];
                onParamChange('origin', [current[0], v, current[2]]);
              }} badge="OY" />
              <ParamInput label="Origin Z" value={params.origin?.[2] || 0} onChange={(v: any) => {
                const current = params.origin || [0, 0, 0];
                onParamChange('origin', [current[0], current[1], v]);
              }} badge="OZ" />
              <div className="border-t border-slate-200 pt-2">
                <ParamInput label="X-Axis Direction" value={params.xAxis ? params.xAxis.join(',') : '[1, 0, 0]'} onChange={(v: any) => onParamChange('xAxis', v.split(',').map(Number))} badge="X" />
              </div>
              <div className="border-t border-slate-200 pt-2">
                <ParamInput label="Y-Axis Direction" value={params.yAxis ? params.yAxis.join(',') : '[0, 1, 0]'} onChange={(v: any) => onParamChange('yAxis', v.split(',').map(Number))} badge="Y" />
              </div>
            </>
          )}

          {params.offsets && (
            <div className="border-t border-slate-200 pt-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Offset</label>
              <div className="grid grid-cols-3 gap-1">
                <ParamInput label="X" value={params.offsets.x || 0} onChange={(v: any) => onParamChange('offsets', { ...params.offsets, x: v })} badge="X" />
                <ParamInput label="Y" value={params.offsets.y || 0} onChange={(v: any) => onParamChange('offsets', { ...params.offsets, y: v })} badge="Y" />
                <ParamInput label="Z" value={params.offsets.z || 0} onChange={(v: any) => onParamChange('offsets', { ...params.offsets, z: v })} badge="Z" />
              </div>
            </div>
          )}
        </div>
      </Rollout>
    );
  }

  return (
    <Rollout title="Construction Method" icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M4 22V4h16v18H4z"/><path d="M4 9h16"/></svg>}>
      <div className="space-y-3">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase">Method</label>
          <select
            value={planeType}
            onChange={(e) => onParamChange('planeType', e.target.value)}
            className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-[12px] font-bold"
          >
            <option value="OFFSET">Offset from Plane</option>
            <option value="THREE_POINTS">Three Points</option>
            <option value="ANGLE">Angle</option>
          </select>
        </div>

        {(planeType === 'OFFSET' || !planeType) && (
          <ParamInput label="Offset Distance" value={params.offset} onChange={(v: any) => onParamChange('offset', v)} badge="DIST" />
        )}

        {planeType === 'ANGLE' && (
          <ParamInput label="Angle" value={params.angle || 0} onChange={(v: any) => onParamChange('angle', v)} badge="DEG" />
        )}

        <SelectionBox
          label="References"
          selectedCount={params.refs?.length || 0}
          onClear={() => onParamChange('refs', [])}
          placeholder={planeType === 'ANGLE' ? "Select Axis then Ref Plane" : "Select planar faces or points"}
          active={pendingFeatureCommand === 'REFERENCE_PLANE'}
          onClick={() => useCadStore.setState({ pendingFeatureCommand: 'REFERENCE_PLANE' })}
        />

        {planeType === 'ANGLE' && (
          <div className="p-2 bg-indigo-50 border border-indigo-100 rounded text-[10px] text-indigo-700 font-bold leading-tight">
            First reference must be an axis (linear edge). Second must be a planar face.
          </div>
        )}
      </div>
    </Rollout>
  );
};
