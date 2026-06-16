'use client';

import { useCallback } from 'react';
import { useCadStore } from '../../store/useCadStore';
import { v4 as uuidv4 } from 'uuid';
import { HeavyEngineClient } from '../../kernel/HeavyEngineClient';
import { extractAllPaths } from '../../utils/geometry/GraphAdapter';

export interface ConvertEntitiesParams {
  topology: any;
  plane: string;
  faceOrigin?: [number, number, number];
  faceNormal?: [number, number, number];
}

export interface OffsetEntitiesParams {
  distance: number;
  plane: string;
  faceOrigin?: [number, number, number];
  faceNormal?: [number, number, number];
}

export const useEntityBuilders = () => {
  const {
    activePlane,
    activeFaceOrigin,
    activeFaceNormal,
    sketchNodes,
    sketchEdges,
    selectedTopology,
    features,
    setSelectedTopology,
    setSketchNodes,
    setSketchEdges,
    pushToast,
  } = useCadStore();

  const handleConvertEntities = useCallback(async () => {
    if (!activePlane || !selectedTopology) {
      pushToast('Please select a face or edge to convert.', 'warning');
      return;
    }
    try {
      const client = HeavyEngineClient.getInstance();
      const points = await client.convertEntities(
        features,
        selectedTopology,
        activePlane,
        activeFaceOrigin || undefined,
        activeFaceNormal || undefined
      );
      if (points && points.length > 0) {
        const nextNodes = { ...sketchNodes };
        const nextEdges = { ...sketchEdges };
        for (let i = 0; i < points.length; i++) {
          const loop = points[i];
          if (!loop || loop.length < 2) continue;
          let firstNodeId = null;
          let prevNodeId = null;
          for (let j = 0; j < loop.length; j++) {
            const pt = loop[j];
            const nId = uuidv4();
            nextNodes[nId] = { id: nId, x: pt[0], y: pt[1], isFixed: true };
            if (j === 0) firstNodeId = nId;
            if (prevNodeId) {
              const eId = uuidv4();
              nextEdges[eId] = { id: eId, type: 'LINE', nodeIds: [prevNodeId, nId] };
            }
            prevNodeId = nId;
          }
          if (firstNodeId && prevNodeId && loop.length >= 3) {
            const eId = uuidv4();
            nextEdges[eId] = { id: eId, type: 'LINE', nodeIds: [prevNodeId, firstNodeId] };
          }
        }
        setSketchNodes(nextNodes);
        setSketchEdges(nextEdges);
        pushToast('Entities converted successfully.', 'info');
        setSelectedTopology(null);
      }
    } catch (err) {
      pushToast('Failed to convert entities.', 'error');
    }
  }, [
    activePlane, selectedTopology, features, activeFaceOrigin, activeFaceNormal,
    sketchNodes, sketchEdges, setSketchNodes, setSketchEdges, setSelectedTopology, pushToast,
  ]);

  const handleOffsetEntities = useCallback(async () => {
    if (!activePlane) {
      pushToast('Sketch plane is not active.', 'warning');
      return;
    }
    const paths = extractAllPaths(sketchNodes, sketchEdges);
    if (paths.length === 0) {
      pushToast('Please sketch some geometry to offset.', 'warning');
      return;
    }
    try {
      const client = HeavyEngineClient.getInstance();
      const offsetDistance = parseFloat(prompt('Offset distance (mm):', '10') || '0');
      if (!offsetDistance || isNaN(offsetDistance) || offsetDistance === 0) return;

      const points = await client.offsetEntities(
        paths,
        offsetDistance,
        activePlane,
        activeFaceOrigin || undefined,
        activeFaceNormal || undefined
      );

      if (points && points.length > 0) {
        const nextNodes = { ...sketchNodes };
        const nextEdges = { ...sketchEdges };
        for (let i = 0; i < points.length; i++) {
          const loop = points[i];
          if (!loop || loop.length < 2) continue;
          let firstNodeId = null;
          let prevNodeId = null;
          for (let j = 0; j < loop.length; j++) {
            const pt = loop[j];
            const nId = uuidv4();
            nextNodes[nId] = { id: nId, x: pt[0], y: pt[1], isFixed: false };
            if (j === 0) firstNodeId = nId;
            if (prevNodeId) {
              const eId = uuidv4();
              nextEdges[eId] = { id: eId, type: 'LINE', nodeIds: [prevNodeId, nId] };
            }
            prevNodeId = nId;
          }
          if (firstNodeId && prevNodeId && loop.length >= 3) {
            const eId = uuidv4();
            nextEdges[eId] = { id: eId, type: 'LINE', nodeIds: [prevNodeId, firstNodeId] };
          }
        }
        setSketchNodes(nextNodes);
        setSketchEdges(nextEdges);
        pushToast(`Entities offset by ${offsetDistance}mm.`, 'info');
      }
    } catch (err) {
      pushToast('Failed to offset entities.', 'error');
    }
  }, [
    activePlane, sketchNodes, sketchEdges, activeFaceOrigin, activeFaceNormal,
    setSketchNodes, setSketchEdges, pushToast,
  ]);

  return { handleConvertEntities, handleOffsetEntities };
};
