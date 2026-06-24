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

  const handleCreateMiterFlange = useCallback(async (params: {
    edgeRefs: string[];
    flangeHeight: number;
    bendRadius: number;
    bendAngle: number;
    thickness: number;
    kFactor?: number;
    direction: 'INSIDE' | 'OUTSIDE';
    cornerAngle?: number;
  }) => {
    const { edgeRefs, flangeHeight, bendRadius, bendAngle, thickness, kFactor = 0.5 } = params;

    if (!selectedTopology || selectedTopology.type !== 'EDGE') {
      pushToast('Please select an edge on the solid body first.', 'warning');
      return;
    }

    // Find base solid body
    const baseSolid = features.find(
      (f: any) => f.type === 'EXTRUDE' && !features.some((f2: any) => f2.parameters?.base_feature_id === f.id)
    );

    if (!baseSolid) {
      pushToast('Create a base extruded body first before adding miter flanges.', 'error');
      return;
    }

    try {
      const client = HeavyEngineClient.getInstance();

      // Build edge chain: start with selected edge, extend with provided refs
      const edgeChain = [selectedTopology.id, ...edgeRefs.filter(id => id !== selectedTopology.id)];

      const result = await client.createMiterFlange({
        base_feature_id: baseSolid.id,
        edge_refs: edgeChain,
        flange_height: flangeHeight,
        bend_radius: bendRadius,
        bend_angle: bendAngle,
        thickness: thickness,
        k_factor: kFactor,
        direction: params.direction,
        corner_angle: params.cornerAngle || 90,
      });

      if (!result.success) {
        pushToast(`Miter Flange failed: ${result.error || 'Backend error'}`, 'error');
        return;
      }

      const featId = `feat_${uuidv4()}`;
      addFeature({
        id: featId,
        type: 'MITER_FLANGE',
        name: `Miter Flange ${features.filter((f: any) => f.type === 'MITER_FLANGE').length + 1}`,
        parameters: {
          edge_refs: edgeChain,
          flange_height: flangeHeight,
          bend_radius: bendRadius,
          bend_angle: bendAngle,
          thickness: thickness,
          k_factor: kFactor,
          direction: params.direction,
          corner_angle: params.cornerAngle || 90,
          base_feature_id: baseSolid.id,
          occt_shape_hash: result.shapeHash,
        },
      });

      setSelectedId(featId);
      setActiveTab('SHEET_METALS');
      setHint(`Miter Flange created: h=${flangeHeight}mm, R=${bendRadius}mm, ${edgeChain.length} edges`);
      pushToast('Miter Flange created', 'info');
      handleRebuild();
    } catch (err: any) {
      pushToast(`Miter Flange error: ${err.message || 'Unknown error'}`, 'error');
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

  const handleCreateHem = useCallback(async (params: {
    edgeId: string;
    hemLength: number;
    hemRadius: number;
    thickness: number;
    hemType?: 'CLOSED' | 'OPEN' | 'TEARDROP';
    gap?: number;
  }) => {
    const { edgeId, hemLength, hemRadius, thickness, hemType = 'CLOSED', gap = 0 } = params;

    if (!selectedTopology || selectedTopology.type !== 'EDGE') {
      pushToast('Please select an edge on the solid body first.', 'warning');
      return;
    }

    const baseSolid = features.find(
      (f: any) => f.type === 'EXTRUDE' && !features.some((f2: any) => f2.parameters?.base_feature_id === f.id)
    );

    if (!baseSolid) {
      pushToast('Create a base extruded body first before adding hems.', 'error');
      return;
    }

    try {
      const client = HeavyEngineClient.getInstance();

      const result = await client.createHem({
        edge_ref: edgeId || selectedTopology.id,
        hem_length: hemLength,
        hem_radius: hemRadius,
        thickness: thickness,
        hem_type: hemType,
        gap: gap,
      });

      if (!result.success) {
        pushToast(`Hem failed: ${result.error || 'Backend error'}`, 'error');
        return;
      }

      const featId = `feat_${uuidv4()}`;
      addFeature({
        id: featId,
        type: 'HEM',
        name: `Hem ${features.filter((f: any) => f.type === 'HEM').length + 1}`,
        parameters: {
          edge_ref: edgeId || selectedTopology.id,
          hem_length: hemLength,
          hem_radius: hemRadius,
          thickness: thickness,
          hem_type: hemType,
          gap: gap,
          base_feature_id: baseSolid.id,
          occt_shape_hash: result.shapeHash,
        },
      });

      setSelectedId(featId);
      setActiveTab('SHEET_METALS');
      setHint(`Hem created: ${hemType} type, L=${hemLength}mm, R=${hemRadius}mm`);
      pushToast(`${hemType} Hem created`, 'info');
      handleRebuild();
    } catch (err: any) {
      pushToast(`Hem error: ${err.message || 'Unknown error'}`, 'error');
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

  /** Flat Pattern: compute unfolded geometry from all sheet metal features. */
  const handleCreateFlatPattern = useCallback(async () => {
    const sheetMetalFeatures = features.filter(
      (f: any) => f.type === 'EDGE_FLANGE' || f.type === 'MITER_FLANGE' || f.type === 'HEM'
    );

    const baseBody = features.find(
      (f: any) => (f.type === 'EXTRUDE' || f.type === 'BOX') && !f.parameters?.base_feature_id
    );

    if (!baseBody && sheetMetalFeatures.length === 0) {
      pushToast('Create a base body and sheet metal features first (Edge Flange, Miter Flange, or Hem).', 'warning');
      return;
    }

    try {
      const client = HeavyEngineClient.getInstance();

      // Send the full feature list (all features up to now) to the backend
      const allFeatures = features.map((f: any) => ({
        id: f.id,
        type: f.type,
        parameters: f.parameters || {},
      }));

      const thickness = baseBody?.parameters?.thickness ?? 1.0;

      const result = await client.createFlatPattern({
        features: allFeatures,
        k_factor: 0.44,
        thickness: Number(thickness),
      });

      if (!result.success) {
        pushToast(`Flat pattern failed: ${result.error || 'Backend error'}`, 'error');
        return;
      }

      const featId = `feat_${uuidv4()}`;
      addFeature({
        id: featId,
        type: 'FLAT_PATTERN',
        name: `Flat Pattern ${features.filter((f: any) => f.type === 'FLAT_PATTERN').length + 1}`,
        parameters: {
          occt_shape_hash: result.shapeHash,
          k_factor: 0.44,
          thickness: Number(thickness),
        },
      });

      setSelectedId(featId);
      setActiveTab('SHEET_METALS');
      setHint('Flat pattern computed. The unfolded plate appears above the folded body.');
      pushToast('Flat Pattern created', 'info');
      handleRebuild();
    } catch (err: any) {
      pushToast(`Flat pattern error: ${err.message || 'Unknown error'}`, 'error');
    }
  }, [
    features,
    addFeature,
    setSelectedId,
    setHint,
    pushToast,
    setActiveTab,
    handleRebuild,
  ]);

  return {
    handleCreateEdgeFlange,
    handleCreateMiterFlange,
    handleCreateHem,
    handleCreateFlatPattern,
  };
};
