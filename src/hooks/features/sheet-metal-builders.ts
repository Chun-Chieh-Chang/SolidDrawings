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

  /** Forming Tool: create louver/lance/bridge/dimple/drawn cutout on a face. */
  const handleCreateFormingTool = useCallback(async (params: {
    toolType: string;
    width: number;
    height: number;
    depth: number;
    radius: number;
    angle: number;
    thickness: number;
    direction: string;
  }) => {
    const { toolType, width, height, depth, radius, angle, thickness, direction } = params;

    if (!selectedTopology || selectedTopology.type !== 'FACE') {
      pushToast('Please select a face on the solid body first.', 'warning');
      return;
    }

    const baseSolid = features.find(
      (f: any) => f.type === 'EXTRUDE' && !features.some((f2: any) => f2.parameters?.base_feature_id === f.id)
    );

    if (!baseSolid) {
      pushToast('Create a base extruded body first before applying forming tools.', 'error');
      return;
    }

    try {
      const client = HeavyEngineClient.getInstance();

      const result = await client.createFormingTool({
        tool_type: toolType,
        width,
        height,
        depth,
        radius,
        angle,
        thickness,
        direction,
      });

      if (!result.success) {
        pushToast(`Forming tool (${toolType}) failed: ${result.error || 'Backend error'}`, 'error');
        return;
      }

      const featId = `feat_${uuidv4()}`;
      const toolLabel = toolType.charAt(0) + toolType.slice(1).toLowerCase().replace(/_/g, ' ');
      addFeature({
        id: featId,
        type: 'FORMING_TOOL',
        name: `${toolLabel} ${features.filter((f: any) => f.type === 'FORMING_TOOL').length + 1}`,
        parameters: {
          tool_type: toolType,
          width,
          height,
          depth,
          radius,
          angle,
          thickness,
          direction,
          face_ref: selectedTopology.id,
          base_feature_id: baseSolid.id,
          occt_shape_hash: result.shapeHash,
        },
      });

      setSelectedId(featId);
      setActiveTab('SHEET_METALS');
      setHint(`${toolLabel} forming tool applied: ${width}×${height}×${depth}mm`);
      pushToast(`${toolLabel} forming tool created`, 'info');
      handleRebuild();
    } catch (err: any) {
      pushToast(`Forming tool error: ${err.message || 'Unknown error'}`, 'error');
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

  /** Unfold: selectively flatten specified bends. */
  const handleUnfold = useCallback(async (bendIds?: string[]) => {
    const sheetMetalFeatures = features.filter(
      (f: any) => f.type === 'EDGE_FLANGE' || f.type === 'MITER_FLANGE' || f.type === 'HEM'
    );

    if (sheetMetalFeatures.length === 0) {
      pushToast('No sheet metal bends to unfold. Create Edge Flange, Miter Flange, or Hem first.', 'warning');
      return;
    }

    try {
      const client = HeavyEngineClient.getInstance();
      const allFeatures = features.map((f: any) => ({
        id: f.id,
        type: f.type,
        parameters: f.parameters || {},
      }));

      const result = await client.createUnfold({
        features: allFeatures,
        bend_ids: bendIds,
        k_factor: 0.44,
        thickness: 1.0,
      });

      if (!result.success) {
        pushToast(`Unfold failed: ${result.error || 'Backend error'}`, 'error');
        return;
      }

      const featId = `feat_${uuidv4()}`;
      addFeature({
        id: featId,
        type: 'UNFOLD',
        name: `Unfold ${features.filter((f: any) => f.type === 'UNFOLD').length + 1}`,
        parameters: {
          occt_shape_hash: result.shapeHash,
          bend_ids: bendIds || [],
          k_factor: 0.44,
          thickness: 1.0,
        },
      });

      setSelectedId(featId);
      setActiveTab('SHEET_METALS');
      setHint('Unfold: selectively flattened bends. The unfolded plate appears above the folded body.');
      pushToast('Unfold: selective flattening applied.', 'info');
      handleRebuild();
    } catch (err: any) {
      pushToast(`Unfold error: ${err.message || 'Unknown error'}`, 'error');
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

  /** Fold: re-fold previously unfolded bends. */
  const handleFold = useCallback(async (bendIds: string[]) => {
    const sheetMetalFeatures = features.filter(
      (f: any) => f.type === 'EDGE_FLANGE' || f.type === 'MITER_FLANGE' || f.type === 'HEM'
    );

    if (sheetMetalFeatures.length === 0) {
      pushToast('No sheet metal bends to fold.', 'warning');
      return;
    }

    if (bendIds.length === 0) {
      pushToast('Select bends to re-fold.', 'warning');
      return;
    }

    try {
      const client = HeavyEngineClient.getInstance();
      const allFeatures = features.map((f: any) => ({
        id: f.id,
        type: f.type,
        parameters: f.parameters || {},
      }));

      const result = await client.createFold({
        features: allFeatures,
        bend_ids: bendIds,
        k_factor: 0.44,
        thickness: 1.0,
      });

      if (!result.success) {
        pushToast(`Fold failed: ${result.error || 'Backend error'}`, 'error');
        return;
      }

      const featId = `feat_${uuidv4()}`;
      addFeature({
        id: featId,
        type: 'FOLD',
        name: `Fold ${features.filter((f: any) => f.type === 'FOLD').length + 1}`,
        parameters: {
          occt_shape_hash: result.shapeHash,
          bend_ids: bendIds,
          k_factor: 0.44,
          thickness: 1.0,
        },
      });

      setSelectedId(featId);
      setActiveTab('SHEET_METALS');
      setHint('Fold: previously unfolded bends have been re-folded.');
      pushToast('Fold: re-fold selected bends.', 'info');
      handleRebuild();
    } catch (err: any) {
      pushToast(`Fold error: ${err.message || 'Unknown error'}`, 'error');
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
    handleCreateFormingTool,
    handleUnfold,
    handleFold,
  };
};
