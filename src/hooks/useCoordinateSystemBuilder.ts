'use client';

import { useCallback } from 'react';
import { useCadStore, type CADFeature } from '../store/useCadStore';
import { v4 as uuidv4 } from 'uuid';

export type CoordinateSystemType = 'planes' | 'axes' | 'points';

export interface CoordinateSystemParams {
  type: CoordinateSystemType;
  selections: string[];
  offsets?: { x: number; y: number; z: number };
  origin?: [number, number, number];
  xAxis?: [number, number, number];
  yAxis?: [number, number, number];
}

export const useCoordinateSystemBuilder = (handleRebuild: () => void) => {
  const {
    features,
    addFeature,
    setSelectedId,
    setPendingFeatureCommand,
    setActivePropertyManager,
    setHint,
    pushToast,
    referencePlanes,
    referenceAxes,
    referencePoints,
    setActivePlane,
    setActiveFaceOrigin,
    setActiveFaceNormal,
    setActiveFaceId,
    triggerCameraNormal,
    setSelectedTopology,
  } = useCadStore();

  const handleBuildCoordinateSystem = useCallback((params: CoordinateSystemParams) => {
    const { type, selections, offsets, origin, xAxis, yAxis } = params;

    if (type === 'planes' && selections.length < 3) {
      pushToast('需要選取 3 個平面來建立坐標系。', 'warning');
      return;
    }
    if (type === 'axes' && selections.length < 2) {
      pushToast('需要選取 2 個軸來建立坐標系。', 'warning');
      return;
    }
    if (type === 'points' && selections.length < 3) {
      pushToast('需要選取 3 個點來建立坐標系。', 'warning');
      return;
    }

    const existingParams: Record<string, any> = {
      type,
      selections,
      refs: selections.map((id, idx) => ({ id, index: idx, type: 'COORDINATE_SYSTEM_REF' })),
    };

    if (offsets) {
      existingParams.offsets = offsets;
    }
    if (origin) {
      existingParams.origin = origin;
    }
    if (xAxis) {
      existingParams.xAxis = xAxis;
    }
    if (yAxis) {
      existingParams.yAxis = yAxis;
    }

    const featId = `feat_${uuidv4()}`;
    addFeature({
      id: featId,
      type: 'REFERENCE_COORDINATE_SYSTEM',
      name: `Coordinate System ${features.filter(f => f.type === 'REFERENCE_COORDINATE_SYSTEM').length + 1}`,
      parameters: existingParams,
    });

    setSelectedId(featId);
    setActivePropertyManager({
      featureId: featId,
      type: 'REFERENCE_COORDINATE_SYSTEM',
    });
    setHint('Coordinate system created. Configure in PropertyManager.');
    setPendingFeatureCommand(null);
    setTimeout(handleRebuild, 50);
    pushToast('Coordinate system created.', 'info');
  }, [features, addFeature, setSelectedId, setActivePropertyManager, setHint, setPendingFeatureCommand, pushToast, handleRebuild]);

  const handleCreateFromPlanes = useCallback(() => {
    setActivePropertyManager({
      type: 'COORDINATE_SYSTEM',
      creationMode: 'planes',
    });
    setPendingFeatureCommand('COORDINATE_SYSTEM' as any);
    setHint('Step 1: Select 3 planes or faces to define the coordinate system.');
  }, [setActivePropertyManager, setPendingFeatureCommand, setHint]);

  const handleCreateFromAxes = useCallback(() => {
    setActivePropertyManager({
      type: 'COORDINATE_SYSTEM',
      creationMode: 'axes',
    });
    setPendingFeatureCommand('COORDINATE_SYSTEM' as any);
    setHint('Step 1: Select 2 axes to define the coordinate system.');
  }, [setActivePropertyManager, setPendingFeatureCommand, setHint]);

  const handleCreateFromPoints = useCallback(() => {
    setActivePropertyManager({
      type: 'COORDINATE_SYSTEM',
      creationMode: 'points',
    });
    setPendingFeatureCommand('COORDINATE_SYSTEM' as any);
    setHint('Step 1: Select 3 points to define the coordinate system.');
  }, [setActivePropertyManager, setPendingFeatureCommand, setHint]);

  const handleCreateFromOrigin = useCallback(() => {
    setActivePropertyManager({
      type: 'COORDINATE_SYSTEM',
      creationMode: 'origin',
    });
    setPendingFeatureCommand('COORDINATE_SYSTEM' as any);
    setHint('Define origin point for the coordinate system.');
  }, [setActivePropertyManager, setPendingFeatureCommand, setHint]);

  return {
    handleBuildCoordinateSystem,
    handleCreateFromPlanes,
    handleCreateFromAxes,
    handleCreateFromPoints,
    handleCreateFromOrigin,
  };
};
