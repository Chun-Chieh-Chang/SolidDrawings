'use client';

import { useCallback } from 'react';
import { useCadStore, type CADFeature } from '../../store/useCadStore';

interface SweepLoftDeps {
  sketchFeatureTo3DPoints: (feat: CADFeature) => any[][];
  handleRebuild?: () => void;
}

export interface SweepParams {
  profile_id?: string;
  path_id?: string;
  guide_ids?: string[];
  profile_points?: any[][];
  path_points?: any[][];
  guide_points?: any[][][];
  thin_thickness?: number;
  thin_type?: string;
  thin_direction1?: number;
  thin_direction2?: number;
}

export interface LoftParams {
  profile_ids?: string[];
  profiles?: any[][][];
  guide_ids?: string[];
  guide_points?: any[][][];
}

export interface HelicalSweepParams {
  profile_id?: string;
  axis_ref?: any;
  profile_points?: any[][];
  axis_points?: number[][];
}

export const useSweepLoftBuilders = (sharedDeps: SweepLoftDeps) => {
  const { features, updateFeatureParams, pushToast } = useCadStore();

  const handleBuildSweepLoft = useCallback(
    (feat: CADFeature) => {
      if (feat.type === 'SWEEP') {
        const profileFeat = features.find((f) => f.id === feat.parameters.profile_id);
        const pathFeat = features.find((f) => f.id === feat.parameters.path_id);
        if (!profileFeat || !pathFeat) {
          pushToast('Sweep: Please select both a Profile and a Path sketch.', 'error');
          return;
        }

        const guideIds: string[] = feat.parameters.guide_ids || [];
        const guidePointsList = guideIds
          .filter(Boolean)
          .map((id) => {
            const f = features.find((ff) => ff.id === id);
            return f ? sharedDeps.sketchFeatureTo3DPoints(f) : [];
          });

        updateFeatureParams(feat.id, {
          ...feat.parameters,
          profile_points: sharedDeps.sketchFeatureTo3DPoints(profileFeat),
          path_points: sharedDeps.sketchFeatureTo3DPoints(pathFeat),
          guide_points: guidePointsList,
          thin_thickness: feat.parameters.thin_thickness
            ? parseFloat(feat.parameters.thin_thickness)
            : undefined,
          thin_type: feat.parameters.thin_type || undefined,
          thin_direction1: feat.parameters.thin_direction1
            ? parseFloat(feat.parameters.thin_direction1)
            : 0,
          thin_direction2: feat.parameters.thin_direction2
            ? parseFloat(feat.parameters.thin_direction2)
            : 0,
        });
      } else if (feat.type === 'HELICAL_SWEEP') {
        const profileFeat = features.find((f) => f.id === feat.parameters.profile_id);
        if (!profileFeat) {
          pushToast('Helical Sweep: Please select a Profile sketch.', 'error');
          return;
        }

        let axisPoints: number[][] = [];
        const axisRef = feat.parameters.axis_ref;
        if (axisRef && axisRef.type === 'EDGE' && axisRef.edgeData) {
          axisPoints = [axisRef.edgeData.start, axisRef.edgeData.end];
        } else if (axisRef && axisRef.coordinates) {
          axisPoints = [
            axisRef.coordinates,
            [axisRef.coordinates[0], axisRef.coordinates[1], axisRef.coordinates[2] + 10],
          ];
        }

        updateFeatureParams(feat.id, {
          ...feat.parameters,
          profile_points: sharedDeps.sketchFeatureTo3DPoints(profileFeat),
          axis_points: axisPoints,
        });
      } else if (feat.type === 'LOFT') {
        const profileIds: string[] = feat.parameters.profile_ids || [];
        if (profileIds.filter(Boolean).length < 2) {
          pushToast('Loft: Please select at least two Profile sketches.', 'error');
          return;
        }
        const profilePts = profileIds
          .filter(Boolean)
          .map((id) => {
            const f = features.find((ff) => ff.id === id);
            return f ? sharedDeps.sketchFeatureTo3DPoints(f) : [];
          });

        const guideIds: string[] = feat.parameters.guide_ids || [];
        const guidePointsList = guideIds
          .filter(Boolean)
          .map((id) => {
            const f = features.find((ff) => ff.id === id);
            return f ? sharedDeps.sketchFeatureTo3DPoints(f) : [];
          });

        updateFeatureParams(feat.id, {
          ...feat.parameters,
          profiles: profilePts,
          guide_points: guidePointsList,
        });
      } else if (feat.type === 'FILLET' || feat.type === 'CHAMFER') {
        const rebuildHook = (window as any).__handleRebuild;
        if (rebuildHook) rebuildHook();
        else if (sharedDeps.handleRebuild) sharedDeps.handleRebuild();
      }
    },
    [features, updateFeatureParams, pushToast, sharedDeps.sketchFeatureTo3DPoints, sharedDeps.handleRebuild]
  );

  return { handleBuildSweepLoft };
};
