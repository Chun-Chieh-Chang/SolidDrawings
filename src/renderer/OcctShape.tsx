'use client';

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useCadStore } from '../store/useCadStore';
import { topologySelector, getFeatureDistance } from './Viewport';

export interface FaceMetadata {
  id: string;
  area: number;
  v_count: number;
  curvature?: string;
  index_range: [number, number];
  surface_type?: string;
  axis_origin?: [number, number, number];
  axis_direction?: [number, number, number];
  radius?: number;
}

const geometryCache = new WeakMap<MeshData, THREE.BufferGeometry>();

export interface MeshData {
  vertices: number[];
  normals: number[];
  indices: number[];
  face_metadata?: FaceMetadata[];
}

interface OcctShapeProps {
  data: MeshData;
  color?: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  componentId?: string;
}

export default function OcctShape({ 
  data, 
  color = '#60A5FA',
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  componentId
}: OcctShapeProps) {
  const {
    mode: cadMode,
    mateSelection,
    addMateSelection,
    isSketchMode,
    activePropertyManager,
    pendingFeatureCommand,
    features,
    setSelectedId,
    setSelectedSubNodeType,
    viewportDisplayMode,
    sectionView,
  } = useCadStore();

  const clippingPlanes = useMemo(() => {
    if (!sectionView.isActive) return [];
    
    const plane = sectionView.plane;
    let normal = new THREE.Vector3();
    let origNormal = new THREE.Vector3();
    
    if (plane === 'FRONT') {
      normal.set(0, 0, 1);
      origNormal.set(0, 0, 1);
    } else if (plane === 'TOP') {
      normal.set(0, 1, 0);
      origNormal.set(0, 1, 0);
    } else if (plane === 'RIGHT') {
      normal.set(1, 0, 0);
      origNormal.set(1, 0, 0);
    }
    
    const d = sectionView.flip ? -sectionView.offset : sectionView.offset;
    if (sectionView.flip) normal.negate();
    
    const p = new THREE.Plane(normal, -d);
    return [p];
  }, [sectionView]);

  const geometry = useMemo(() => {
    if (geometryCache.has(data)) {
      return geometryCache.get(data)!;
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(data.vertices, 3));
    if (data.normals && data.normals.length > 0) {
      geom.setAttribute('normal', new THREE.Float32BufferAttribute(data.normals, 3));
    }
    geom.setIndex(data.indices);
    geometryCache.set(data, geom);
    return geom;
  }, [data]);

  // We no longer dispose geometry on unmount because it may be shared via geometryCache.
  // Instead we let the browser GC it when data (the key in WeakMap) goes out of scope.
  React.useEffect(() => {
    return () => {
      // Intentionally empty: Geometry is cached.
    };
  }, []);

  const handleMeshClick = (e: any) => {
    e.stopPropagation();
    
    if (topologySelector) {
      const ndcX = e.pointer ? e.pointer.x : 0;
      const ndcY = e.pointer ? e.pointer.y : 0;
      let filterType = 'ALL';
      if (pendingFeatureCommand === 'FILLET' || pendingFeatureCommand === 'CHAMFER' || pendingFeatureCommand === 'PATTERN') {
        filterType = 'EDGE_ONLY';
      } else if (pendingFeatureCommand === 'DRAFT' || pendingFeatureCommand === 'MIRROR' || pendingFeatureCommand === 'THICKEN' || pendingFeatureCommand === 'SHELL' || pendingFeatureCommand === 'HOLE_WIZARD') {
        filterType = 'FACE_ONLY';
      } else if (activePropertyManager?.selectionFilter) {
        filterType = activePropertyManager.selectionFilter;
      }
      
      const preserve = isSketchMode || activePropertyManager !== null;
      
      const selected = topologySelector.selectAtPosition(ndcX, ndcY, preserve, filterType as any);
      console.log('[OcctShape Topology] Clicked mesh at NDC:', ndcX, ndcY, 'Selected:', selected);
      
      if (selected && cadMode === 'ASSEMBLY' && !isSketchMode) {
        // Assembly Mate Selection
        selected.componentId = componentId;
        
        // Only allow up to 2 items
        const currentState = useCadStore.getState().mateSelection;
        if (currentState.length < 2) {
            // check if not already selected
            const alreadyExists = currentState.some((sel: any) => sel.id === selected.id && sel.componentId === componentId);
            if (!alreadyExists) {
                addMateSelection(selected);
            }
        }
      } else if (selected && activePropertyManager) {
        const mgr = useCadStore.getState().activePropertyManager;
        if (mgr) {
          const alreadyExists = mgr.refs.some((r: any) => r.id === selected.id);
          if (!alreadyExists) {
            useCadStore.setState({
              activePropertyManager: {
                ...mgr,
                refs: [...mgr.refs, selected]
              }
            });
          }
        }
      } else if (selected && pendingFeatureCommand) {
        // Direct addition of selected topology (edges/faces) to the pending feature's parameters
        const state = useCadStore.getState();
        const featId = state.selectedId;
        if (featId) {
          const featIndex = state.features.findIndex(f => f.id === featId);
          if (featIndex !== -1 && state.features[featIndex].type === pendingFeatureCommand) {
            const params = state.features[featIndex].parameters;
            
            if (pendingFeatureCommand === 'DRAFT') {
              const neutralRefs = params.neutral_plane_refs || [];
              const faceRefs = params.faces_to_draft_refs || [];
              if (neutralRefs.length === 0) {
                state.updateFeatureParams(featId, { neutral_plane_refs: [selected] });
              } else {
                if (!faceRefs.some((r: any) => r.id === selected.id) && neutralRefs[0].id !== selected.id) {
                  state.updateFeatureParams(featId, { faces_to_draft_refs: [...faceRefs, selected] });
                }
              }
            } else if (pendingFeatureCommand === 'MIRROR') {
              const currentRefs = params.mirror_plane_refs || [];
              if (currentRefs.length === 0) {
                state.updateFeatureParams(featId, { mirror_plane_refs: [selected] });
              }
            } else if (pendingFeatureCommand === 'PATTERN') {
              const currentRefs = params.direction_refs || [];
              if (currentRefs.length === 0) {
                state.updateFeatureParams(featId, { direction_refs: [selected] });
              }
            } else if (pendingFeatureCommand === 'SHELL') {
              const currentRefs = params.faces_to_remove_refs || [];
              const alreadyExists = currentRefs.some((r: any) => r.id === selected.id);
              if (!alreadyExists) {
                state.updateFeatureParams(featId, { faces_to_remove_refs: [...currentRefs, selected] });
              }
            } else if (pendingFeatureCommand === 'HOLE_WIZARD') {
              // Only keep the latest one
              state.updateFeatureParams(featId, { hole_placement_refs: [selected] });
            } else {
              const currentRefs = params.refs || [];
              const alreadyExists = currentRefs.some((r: any) => r.id === selected.id);
              if (!alreadyExists) {
                state.updateFeatureParams(featId, { refs: [...currentRefs, selected] });
              }
            }
          }
        }
      } else if (!activePropertyManager && !isSketchMode) {
        // SolidWorks viewport selection & proximity mapping logic
        if (selected) {
          const clickPos = new THREE.Vector3(...selected.coordinates);
          let closestFeat = null;
          let minDistance = Infinity;
          
          for (const feat of features) {
            const dist = getFeatureDistance(feat, clickPos);
            if (dist < minDistance) {
              minDistance = dist;
              closestFeat = feat;
            }
          }
          
          if (closestFeat) {
            console.log('[OcctShape Selection] Proximity matches feature:', closestFeat.name, 'with distance:', minDistance);
            setSelectedId(closestFeat.id);
            setSelectedSubNodeType('FEATURE');
          }
        }
      }
    }
  };

  return (
    <mesh 
      geometry={geometry} 
      position={position} 
      rotation={rotation} 
      userData={{ type: 'B_REP_SHAPE', face_metadata: data.face_metadata, componentId }}
      onClick={handleMeshClick}
    >
      <meshStandardMaterial
        color={color}
        roughness={0.3}
        metalness={0.2}
        flatShading={false}
        side={THREE.DoubleSide}
        wireframe={viewportDisplayMode === 'WIREFRAME'}
        transparent={viewportDisplayMode === 'WIREFRAME' || color === 'red'}
        opacity={viewportDisplayMode === 'WIREFRAME' ? 0.85 : (color === 'red' ? 0.6 : 1)}
        clippingPlanes={clippingPlanes}
      />
      {viewportDisplayMode !== 'SHADED' && (
        <lineSegments>
          <edgesGeometry args={[geometry]} />
          <lineBasicMaterial color="#1E293B" linewidth={1} clippingPlanes={clippingPlanes} />
        </lineSegments>
      )}
    </mesh>
  );
}

