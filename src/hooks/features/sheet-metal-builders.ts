'use client';

import { useCallback } from 'react';
import { useCadStore } from '../../store';
import { v4 as uuidv4 } from 'uuid';
import { HeavyEngineClient } from '../../kernel/HeavyEngineClient';

export interface EdgeFlangeParams {
  edgeId: string;
  flangeHeight: number;
  bendRadius: number;
  bendAngle: number; // degrees from original plane (90 = right angle)
  thickness: number;
  kFactor?: number;
  direction: 'INSIDE' | 'OUTSIDE';
  reliefType?: 'RECTANGULAR' | 'ROUND' | 'NONE';
}

export const useSheetMetalBuilders = (handleRebuild: () => void) => {
  const {
    features,
    sketchNodes,
    sketchEdges,
    selectedTopology,
    activePlane,
    addFeature,
    setSelectedId,
    setHint,
    pushToast,
    setActiveTab,
  } = useCadStore();

  const handleCreateEdgeFlange = useCallback(async (params: EdgeFlangeParams) => {
    const { edgeId, flangeHeight, bendRadius, bendAngle, thickness, kFactor = 0.5 } = params;

    if (!selectedTopology || selectedTopology.type !== 'EDGE') {
      pushToast('Please select an edge on the solid body first.', 'warning');
      return;
    }

    // Check if we have a base solid body
    const baseSolid = features.find(
      (f: any) => f.type === 'EXTRUDE' && !features.some((f2: any) => f2.parameters?.base_feature_id === f.id)
    );

    if (!baseSolid) {
      pushToast('Create a base extruded body first before adding edge flanges.', 'error');
      return;
    }

    try {
      const client = HeavyEngineClient.getInstance();
      
      // Call backend to generate edge flange geometry
      const result = await client.createEdgeFlange({
        base_feature_id: baseSolid.id,
        edge_ref: edgeId || selectedTopology.id,
        flange_height: flangeHeight,
        bend_radius: bendRadius,
        bend_angle: bendAngle,
        thickness: thickness,
        k_factor: kFactor,
        direction: params.direction,
        relief_type: params.reliefType || 'RECTANGULAR',
      });

      if (!result.success) {
        pushToast(`Edge Flange failed: ${result.error || 'Backend error'}`, 'error');
        return;
      }

      // Create the feature record
      const featId = `feat_${uuidv4()}`;
      addFeature({
        id: featId,
        type: 'EDGE_FLANGE',
        name: `Flange ${features.filter((f: any) => f.type === 'EDGE_FLANGE').length + 1}`,
        parameters: {
          edge_ref: edgeId || selectedTopology.id,
          flange_height: flangeHeight,
          bend_radius: bendRadius,
          bend_angle: bendAngle,
          thickness: thickness,
          k_factor: kFactor,
          direction: params.direction,
          relief_type: params.reliefType || 'RECTANGULAR',
          base_feature_id: baseSolid.id,
          occt_shape_hash: result.shapeHash,
        },
      });

      setSelectedId(featId);
      setActiveTab('SHEET_METALS');
      setHint(`Edge Flange created: h=${flangeHeight}mm, R=${bendRadius}mm, θ=${bendAngle}°`);
      handleRebuild();
    } catch (err: any) {
      pushToast(`Edge Flange error: ${err.message || 'Unknown error'}`, 'error');
    }
  }, [
    features,
    selectedTopology,
    addFeature,
    setSelectedId,
    setHint,
    pushToast,
    setActiveTab,
    handleRebuild,
  ]);

  return {
    handleCreateEdgeFlange,
  };
};
