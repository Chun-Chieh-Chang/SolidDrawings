'use client';

import React from 'react';
import { useCadStore } from '@/store/useCadStore';
import { getParentsAndChildren } from '@/utils/feature-tree-relations';
import { Rollout } from '../PropertyManager/Rollout';
import { PMHeader } from '../PropertyManager/PMHeader';
import { ParamInput } from './rollouts';
import { ExtrudeRollout } from './extrude-rollout';
import { RevolveRollout } from './revolve-rollout';
import { FilletChamferRollout } from './fillet-chamfer-rollout';
import { ShellDraftRollout } from './shell-draft-rollout';
import { PatternRollout } from './pattern-rollout';
import { HoleWizardRollout } from './hole-wizard-rollout';
import { SweepRollout, SweepOptionsRollout } from './sweep-rollout';
import { RefGeometryRollout } from './ref-geometry-rollout';
import { DraftRollout } from './draft-rollout';
import { ThickenSurfaceRollout } from './thicken-surface-rollout';
import { DomeRollout } from './dome-rollout';
import { DumbSolidRollout, LoftRollout } from './loft-dumb-rollout';
import type { PartFeaturePropertyManagerProps } from './types';

export function PartFeaturePropertyManager({
  selectedFeature,
  features,
  onParamChange,
  onEditSketch,
  onSelectFeature,
  onBuildSweepLoft,
}: PartFeaturePropertyManagerProps) {
  const [pmTab, setPmTab] = React.useState<'FEATURE' | 'ADVANCED'>('FEATURE');
  const { parents, children } = getParentsAndChildren(selectedFeature, features);
  const updateFeatureProperty = useCadStore((state: any) => state.updateFeatureProperty);
  const setSelectedId = useCadStore((state: any) => state.setSelectedId);
  const pendingFeatureCommand = useCadStore((state: any) => state.pendingFeatureCommand);

  const handleConfirm = () => {
    if (onBuildSweepLoft && ['SWEEP', 'LOFT', 'HELICAL_SWEEP', 'FILLET', 'CHAMFER', 'SURFACE_OFFSET', 'SURFACE_KNIT', 'THICKEN', 'DRAFT', 'SURFACE_CUT', 'SHELL', 'DOME'].includes(selectedFeature.type)) {
      onBuildSweepLoft(selectedFeature);
    }
    setSelectedId(null);
  };

  const handleCancel = () => {
    setSelectedId(null);
  };

  const featureType = selectedFeature.type;
  const isFeatureTab = pmTab === 'FEATURE';

  const renderFeatureRollouts = () => {
    switch (featureType) {
      case 'SURFACE_OFFSET':
      case 'SURFACE_KNIT':
      case 'SURFACE_CUT':
      case 'THICKEN':
        return <ThickenSurfaceRollout selectedFeature={selectedFeature} features={features} onParamChange={onParamChange} pendingFeatureCommand={pendingFeatureCommand} />;
      case 'DRAFT':
        return <DraftRollout selectedFeature={selectedFeature} onParamChange={onParamChange} pendingFeatureCommand={pendingFeatureCommand} />;
      case 'PATTERN':
        return <PatternRollout selectedFeature={selectedFeature} features={features} onParamChange={onParamChange} pendingFeatureCommand={pendingFeatureCommand} />;
      case 'EXTRUDE':
        return <ExtrudeRollout selectedFeature={selectedFeature} onParamChange={onParamChange} pendingFeatureCommand={pendingFeatureCommand} />;
      case 'REVOLVE':
        return <RevolveRollout selectedFeature={selectedFeature} onParamChange={onParamChange} pendingFeatureCommand={pendingFeatureCommand} />;
      case 'FILLET':
      case 'CHAMFER':
        return <FilletChamferRollout selectedFeature={selectedFeature} onParamChange={onParamChange} pendingFeatureCommand={pendingFeatureCommand} />;
      case 'SHELL':
        return <ShellDraftRollout selectedFeature={selectedFeature} onParamChange={onParamChange} pendingFeatureCommand={pendingFeatureCommand} />;
      case 'HOLE_WIZARD':
        return <HoleWizardRollout selectedFeature={selectedFeature} onParamChange={onParamChange} pendingFeatureCommand={pendingFeatureCommand} />;
      case 'SWEEP':
        return (
          <>
            <SweepRollout selectedFeature={selectedFeature} features={features} onParamChange={onParamChange} pendingFeatureCommand={pendingFeatureCommand} />
            <SweepOptionsRollout selectedFeature={selectedFeature} onParamChange={onParamChange} pendingFeatureCommand={pendingFeatureCommand} />
          </>
        );
      case 'LOFT':
        return <LoftRollout selectedFeature={selectedFeature} features={features} onParamChange={onParamChange} pendingFeatureCommand={pendingFeatureCommand} />;
      case 'REFERENCE_PLANE':
      case 'PLANE':
      case 'REFERENCE_POINT':
      case 'REFERENCE_COORDINATE_SYSTEM':
        return <RefGeometryRollout selectedFeature={selectedFeature} features={features} onParamChange={onParamChange} pendingFeatureCommand={pendingFeatureCommand} />;
      case 'DUMB_SOLID':
        return <DumbSolidRollout selectedFeature={selectedFeature} onParamChange={onParamChange} pendingFeatureCommand={pendingFeatureCommand} />;
      case 'DOME':
        return <DomeRollout selectedFeature={selectedFeature} onParamChange={onParamChange} pendingFeatureCommand={pendingFeatureCommand} />;
      default:
        return null;
    }
  };

  return (
    <div className="h-full w-full border-t border-slate-300 bg-[#F5F5F5] flex flex-col z-10 shrink-0 overflow-hidden">
      <PMHeader
        title={`${selectedFeature.type} - ${selectedFeature.name}`}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />

      <div className="flex px-2 mb-1 border-b border-slate-200 bg-white">
        {['FEATURE', 'ADVANCED'].map((t) => (
          <button
            key={t}
            onClick={() => setPmTab(t as any)}
            className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-tighter border-b-2 transition-all ${
              pmTab === t ? 'border-[#005B9A] text-[#005B9A]' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1 custom-scrollbar">
        {isFeatureTab ? (
          renderFeatureRollouts()
        ) : (
          <div className="space-y-1 animate-in fade-in slide-in-from-right-1 duration-200">
            {(parents.length > 0 || children.length > 0) && (
              <Rollout title="Parent/Child Relations" icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M7 21l-4-4m0 0l4-4m-4 4h18V3"/></svg>}>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <div className="text-slate-400 font-bold mb-1 uppercase tracking-widest text-[9px]">Parents</div>
                    {parents.map((p) => (
                      <button key={p.id} onClick={() => p.type === 'SKETCH' ? onEditSketch(selectedFeature) : onSelectFeature(p.id)} className="w-full text-left mb-1 px-1.5 py-0.5 rounded border border-emerald-200 bg-emerald-50 text-emerald-800 font-bold truncate">
                        {p.name}
                      </button>
                    ))}
                  </div>
                  <div>
                    <div className="text-slate-400 font-bold mb-1 uppercase tracking-widest text-[9px]">Children</div>
                    {children.map((c) => (
                      <button key={c.id} onClick={() => onSelectFeature(c.id)} className="w-full text-left mb-1 px-1.5 py-0.5 rounded border border-blue-200 bg-blue-50 text-blue-800 font-bold truncate">
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              </Rollout>
            )}
            <Rollout title="Feature Appearance" icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"/><path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2H10a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z"/></svg>}>
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={selectedFeature.color || '#60A5FA'} onChange={(e) => updateFeatureProperty(selectedFeature.id, 'color', e.target.value)} className="w-8 h-8 rounded-md cursor-pointer border-none bg-transparent" />
                  <button onClick={() => updateFeatureProperty(selectedFeature.id, 'color', undefined)} className="text-[10px] text-slate-400 hover:text-red-500 font-bold underline transition-colors">Reset</button>
                </div>
              </div>
            </Rollout>
          </div>
        )}
      </div>
    </div>
  );
}
