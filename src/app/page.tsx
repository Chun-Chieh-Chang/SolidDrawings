'use client';



import React, { useEffect, useState, useCallback, useMemo, Fragment, useRef } from 'react';

import Viewport from '@/renderer/Viewport';

import OcctShape, { type MeshData } from '@/renderer/OcctShape';

import { useCadStore, type CADFeature } from '@/store/useCadStore';

import { HeavyEngineClient } from '@/kernel/HeavyEngineClient';

import { MeasurementService } from '@/kernel/MeasurementService';

import { MeasurementPanel } from '@/ui/MeasurementPanel';

import { SketchHUD } from '@/renderer/SketchHUD';

import { onFileOpen, onSaveRequest, onNewFile, appAPI, fileAPI } from '../../electron/renderer';

import { MatePanel } from '@/ui/MatePanel';

import { DrawingSheet } from '@/ui/DrawingSheet';

import { SketchPropertyManager } from '@/ui/SketchPropertyManager';

import { v4 as uuidv4 } from 'uuid';

import { extractClosedLoop, extractAllClosedLoops } from '@/utils/geometry/GraphAdapter';

import { analyzeSketchDefinitions } from '@/utils/geometry/ConstraintSolver';

import { HeadsUpToolbar } from '@/ui/HeadsUpToolbar';

import { StatusBar } from '@/ui/StatusBar';

import { ShortcutBox } from '@/ui/ShortcutBox';

import { ContextMenu } from '@/ui/ContextMenu';

import { usePartDocument } from '@/hooks/usePartDocument';

import { usePartRebuild } from '@/hooks/usePartRebuild';

import { FeatureManagerPanel } from '@/ui/FeatureManagerPanel';

import { PartFeaturePropertyManager } from '@/ui/PartFeaturePropertyManager';



const isSketchPlane = (plane: unknown): plane is 'FRONT' | 'TOP' | 'RIGHT' | 'FACE' => (

  plane === 'FRONT' || plane === 'TOP' || plane === 'RIGHT' || plane === 'FACE'

);



const cloneSketchPoints = (points: unknown[]) => (

  points.map((pt) => Array.isArray(pt) ? [...pt] : pt)

);



export interface SketchEntity {

  id: string;

  type: 'LINE' | 'CENTER_LINE' | 'CIRCLE' | 'RECTANGLE';

  name: string;

  pointIndices: number[];

  center?: [number, number];

  radius?: number;

}



export default function Home() {

  const client = HeavyEngineClient.getInstance();

  // Electron Native Integration

  useEffect(() => {

    if (typeof window === 'undefined' || !window.electronAPI) return;



    const unsubs = [

      onFileOpen(async (path) => {

        const result = await fileAPI.read(path);

        if (result.success && result.content) {

          loadCadData(result.content, path);

        }

      }),

      onSaveRequest(async () => {

        handleSaveProject();

      }),

      onNewFile(() => {

        if (confirm('Create new project? All unsaved changes will be lost.')) {

          useCadStore.setState({ 

            features: [], 

            projectName: 'New Project',

            meshData: [],

            selectedId: null,

            components: [],

            mates: []

          });

          appAPI.notify('New Project', 'Workspace cleared');

        }

      })

    ];



    return () => unsubs.forEach(unsub => unsub());

  }, []);


    // Continuous Heartbeat to force connection recovery
    useEffect(() => {
      const check = async () => {
        const client = HeavyEngineClient.getInstance();
        try {
          const isAlive = await client.checkHealth();
          setEngineStatus(isAlive ? 'CONNECTED' : 'DISCONNECTED');
        } catch (e) {
          setEngineStatus('DISCONNECTED');
        }
      };
      const timer = setInterval(check, 2000);
      check();
      return () => clearInterval(timer);
    }, []);

  const { mode, setMode,

    projectName, setProjectName,

    drawingScale, setDrawingScale,

    drawnBy, setDrawnBy,

    approvedBy, setApprovedBy,

    features,

    addFeature,

    removeFeature,

    removeFeatures,

    updateFeatureParams,

    editingFeatureId,

    setEditingFeatureId,

    rollbackIndex,

    setRollbackIndex,

    selectedId,

    setSelectedId,

    selectedSubNodeType, setSelectedSubNodeType,

    visibleSketches, toggleSketchVisibility,

    meshData, setMeshData,

    isSketchMode, smartDimensionActive, setSmartDimensionActive, setSketchMode,

    activePlane, setActivePlane,

    sketchTool, setSketchTool,

    gridSnap, setGridSnap,

    measurementMode, setMeasurementMode,

    measurementPoints, setMeasurementPoints,

    measurementResults, setMeasurementResults,

    mateSelection, setMateSelection,

    addComponent, components, setComponents,

    setContextMenu,

    shortcutBox, setShortcutBox,

    sketchNewChain, setSketchNewChain,

    selectedEntityIds, setSelectedEntityIds,

    selectedTopology, setSelectedTopology,

    activeFaceOrigin, setActiveFaceOrigin,

    activeFaceNormal, setActiveFaceNormal,

    activeFaceId, setActiveFaceId,

    triggerCameraNormal,

    sketchNodes, setSketchNodes, sketchEdges, setSketchEdges, sketchConstraints, setSketchConstraints,

    hint, setHint,

    pendingFeatureCommand, setPendingFeatureCommand,

    defaultFilletRadius, defaultChamferDistance } = useCadStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportStep = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const client = HeavyEngineClient.getInstance();
      const result = await client.uploadStepFile(file);
      if (result && result.filepath) {
        addFeature({
          id: `dumb_${Date.now()}`,
          name: file.name,
          type: 'DUMB_SOLID',
          parameters: {
            filepath: result.filepath,
            x: 0,
            y: 0,
            z: 0
          }
        });
        handleRebuild();
      }
    } catch (err) {
      console.error('[Import] Failed to import STEP:', err);
      alert('Failed to import STEP file.');
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Hint Logic Update

  useEffect(() => {

    if (isSketchMode) {

      switch (sketchTool) {

        case 'LINE': setHint('Sketch Mode (Line)'); break;

        case 'CENTER_LINE': setHint('Sketch Mode (Centerline)'); break;

        case 'CIRCLE': setHint('Sketch Mode (Circle)'); break;

        case 'RECTANGLE': setHint('Sketch Mode (Rectangle)'); break;

        case 'ARC': setHint('Sketch Mode (3-Point Arc)'); break;

        case 'MIDPOINT_LINE': setHint('Sketch Mode (Midpoint Line)'); break;

        default: setHint('Sketch Mode');

      }

    } else if (measurementMode !== 'NONE') {

      setHint(` (${measurementMode})`);

    } else if (pendingFeatureCommand === 'FILLET') {

      setHint('Select edge for Fillet (Esc to cancel)');

    } else if (pendingFeatureCommand === 'CHAMFER') {

      setHint('Select edge for Chamfer (Esc to cancel)');

    } else if (selectedTopology?.type === 'FACE') {

      setHint('Selected');

    } else if (selectedId) {

      setHint(`Selected: ${features.find(f => f.id === selectedId)?.name || ''}`);

    } else {

      setHint('PartMode:');

    }

  }, [isSketchMode, sketchTool, measurementMode, selectedTopology, selectedId, features, pendingFeatureCommand, setHint]);



  // Legacy stubs to prevent TS errors in dead code

  const sketchPoints: any[] = [];

  const setSketchPoints = (pts: any) => {};

  const sketchRelations: any[] = [];

  const setSketchRelations = (rels: any) => {};



  const measurementService = useMemo(() => new MeasurementService(), []);

  const handleStartPlaneSketch = useCallback(
    (plane: 'FRONT' | 'TOP' | 'RIGHT') => {
      setEditingFeatureId(null);
      setSketchPoints([]);
      setSketchRelations([]);
      setActivePlane(plane);
      setSketchMode(true);
      setSketchTool('SELECT');
      setContextMenu(null);
    },
    [setEditingFeatureId, setActivePlane, setSketchMode, setSketchTool, setContextMenu],
  );

  const handlePlaneContextMenu = useCallback(
    (e: React.MouseEvent, plane: string) => {
      setContextMenu({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        type: 'BACKGROUND',
        data: { plane },
      });
    },
    [setContextMenu],
  );



  // Listen to selectedTopology changes in Measurement Mode

  useEffect(() => {

    const clickedTopo = useCadStore.getState().selectedTopology;

    if (isSketchMode || measurementMode === 'NONE' || !clickedTopo) return;



    const prevPoints = useCadStore.getState().measurementPoints || [];

    if (prevPoints.some((p: any) => p.id === clickedTopo.id)) {

      useCadStore.getState().setSelectedTopology(null);

      return;

    }



    let nextPts = [...prevPoints];

    

    if (measurementMode === 'DISTANCE') {

      if (nextPts.length >= 2) nextPts = [clickedTopo];

      else nextPts.push(clickedTopo);

    } else if (measurementMode === 'ANGLE') {

      if (clickedTopo.type !== 'EDGE') {

        useCadStore.getState().setSelectedTopology(null);

        return;

      }

      if (nextPts.length >= 2) nextPts = [clickedTopo];

      else nextPts.push(clickedTopo);

    } else if (measurementMode === 'AREA') {

      if (clickedTopo.type !== 'FACE') {

        useCadStore.getState().setSelectedTopology(null);

        return;

      }

      nextPts = [clickedTopo];

    } else if (measurementMode === 'VOLUME') {

      nextPts = [clickedTopo];

    }



    setMeasurementPoints(nextPts);



    // Calculate results immediately

    if (measurementMode === 'DISTANCE' && nextPts.length === 2) {

      const val = measurementService.calculateDistance(

        nextPts[0].coordinates,

        nextPts[1].coordinates

      );

      setMeasurementResults({

        mode: 'DISTANCE',

        value: val,

        unit: 'mm',

        details: ` D = ${val.toFixed(3)} mm`

      });

    } else if (measurementMode === 'ANGLE' && nextPts.length === 2) {

      const edgeA = nextPts[0].edgeData;

      const edgeB = nextPts[1].edgeData;

      if (edgeA && edgeB) {

        const val = measurementService.calculateEdgeAngle(

          edgeA.start, edgeA.end,

          edgeB.start, edgeB.end

        );

        setMeasurementResults({

          mode: 'ANGLE',

          value: val,

          unit: '',

          details: ` = ${val.toFixed(2)}`

        });

      }

    } else if (measurementMode === 'AREA' && nextPts.length === 1) {

      let areaVal = 100.0;

      const currentFeat = features.find(f => f.id === selectedId);

      if (currentFeat) {

        const params = currentFeat.parameters;

        if (currentFeat.type === 'BOX') {

          areaVal = (params.width ?? 10) * (params.height ?? 10);

        } else if (currentFeat.type === 'CYLINDER') {

          areaVal = Math.PI * (params.radius ?? 5) * (params.radius ?? 5);

        }

      }

      setMeasurementResults({

        mode: 'AREA',

        value: areaVal,

        unit: 'mm',

        details: ` = ${areaVal.toFixed(3)} mm`

      });

    } else if (measurementMode === 'VOLUME' && nextPts.length === 1) {

      let volVal = 1000.0;

      const currentFeat = features.find(f => f.id === selectedId);

      if (currentFeat) {

        const params = currentFeat.parameters;

        if (currentFeat.type === 'BOX') {

          volVal = (params.width ?? 10) * (params.height ?? 10) * (params.depth ?? 10);

        } else if (currentFeat.type === 'CYLINDER') {

          volVal = Math.PI * (params.radius ?? 5) * (params.radius ?? 5) * (params.height ?? 10);

        } else if (currentFeat.type === 'SPHERE') {

          volVal = (4/3) * Math.PI * Math.pow(params.radius ?? 5, 3);

        } else if (currentFeat.type === 'EXTRUDE') {

          volVal = 3000.0;

        }

      }

      setMeasurementResults({

        mode: 'VOLUME',

        value: volVal,

        unit: 'mm',

        details: ` = ${volVal.toFixed(3)} mm`

      });

    }



    useCadStore.getState().setSelectedTopology(null);

  }, [measurementMode, isSketchMode, measurementService, features, selectedId, setMeasurementPoints, setMeasurementResults]);





  const [loading, setLoading] = useState(false);
  

  const [engineStatus, setEngineStatus] = useState<'CONNECTED' | 'DISCONNECTED'>('DISCONNECTED');

  const { handleRebuild, resetRebuildCache, abortRebuild } = usePartRebuild(
    features,
    setMeshData,
    setLoading,
    setEngineStatus,
  );

  const appliedEdgeFeatureRef = useRef<string | null>(null);

  const { loadCadData: loadPartDocument, handleSaveProject } = usePartDocument(features);

  const [activeTab, setActiveTab] = useState<'FEATURES' | 'SKETCH' | 'EVALUATE' | 'ASSEMBLY' | 'DRAWING'>('FEATURES');

  const [massProps, setMassProps] = useState<{

    volume: number;

    surface_area: number;

    center_of_mass: number[];

    inertia_matrix: number[][];

  } | null>(null);

  const [showMassPropsModal, setShowMassPropsModal] = useState(false);

  const [showTranslatorModal, setShowTranslatorModal] = useState(false);

  




  // Dynamic LocalStorage self-cleanup of legacy mockup features

  useEffect(() => {

    if (features.some(f => f.id === 'feat_1')) {

      useCadStore.setState({ features: [], selectedId: null });

      setMeshData([]);

    }

  }, [features, setMeshData]);



  // Global Keyboard Shortcuts for Sketch Mode (L to draw Line, A to draw Arc, Esc to finish chain)

  useEffect(() => {

    const handleGlobalKeyDown = (e: KeyboardEvent) => {

      if (!isSketchMode) return;

      

      // Prevent stealing focus from input fields

      if (document.activeElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {

        return;

      }



      const key = e.key.toLowerCase();

      if (key === 'l') {

        setSketchTool('SELECT');

      } else if (key === 'a') {

        setSketchTool('ARC');

      } else if (e.key === 'Escape') {

        // Esc ends current continuous polyline segment, but doesn't exit the tool

        let newPts = [...sketchPoints];

        if (newPts.length > 0) {

          const last = newPts[newPts.length - 1];

          if (last[2] && (last[2].includes('MIDPOINT_CENTER') || last[2].includes('CIRCLE_CENTER') || last[2].includes('RECT_CORNER'))) {

            newPts.pop(); // Remove dangling center helper

          }

        }

        setSketchPoints(newPts);

        setSketchNewChain(true);

      } else if (e.key === 'Delete' || e.key === 'Backspace') {

        const state = useCadStore.getState();

        const selectedIds = state.selectedEntityIds || [];

        

        if (selectedIds.length > 0) {

          e.preventDefault();

          const nextNodes = { ...state.sketchNodes };

          const nextEdges = { ...state.sketchEdges };

          const nextConstraints = { ...state.sketchConstraints };

          

          const nodesToDelete = new Set();

          const edgesToDelete = new Set();

          const constraintsToDelete = new Set();



          selectedIds.forEach(id => {

            if (nextNodes[id]) nodesToDelete.add(id);

            if (nextEdges[id]) edgesToDelete.add(id);

            if (nextConstraints[id]) constraintsToDelete.add(id);

          });



          Object.values(nextEdges).forEach((edge: any) => {

            if (edge.nodeIds.some((nid: string) => nodesToDelete.has(nid))) {

              edgesToDelete.add(edge.id);

            }

          });



          Object.values(nextConstraints).forEach((c: any) => {

            if (c.nodeIds?.some((nid: string) => nodesToDelete.has(nid))) constraintsToDelete.add(c.id);

            if (c.edgeIds?.some((eid: string) => edgesToDelete.has(eid))) constraintsToDelete.add(c.id);

          });



          nodesToDelete.forEach((id: any) => delete nextNodes[id]);

          edgesToDelete.forEach((id: any) => delete nextEdges[id]);

          constraintsToDelete.forEach((id: any) => delete nextConstraints[id]);



          state.setSketchNodes(nextNodes);

          state.setSketchEdges(nextEdges);

          state.setSketchConstraints(nextConstraints);

          state.setSelectedEntityIds([]);

        }

      }

    };

    window.addEventListener('keydown', handleGlobalKeyDown);

    return () => window.removeEventListener('keydown', handleGlobalKeyDown);

  }, [isSketchMode, setSketchTool, setSketchNewChain]);



  // Global Keyboard Shortcuts (S for Shortcut Box)

  useEffect(() => {

    const handleSKey = (e: KeyboardEvent) => {

      if (e.key.toLowerCase() === 's') {

        if (document.activeElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {

          return;

        }

        e.preventDefault();

        // Use last mouse position from store or center of screen if not available

        const { mousePos } = useCadStore.getState();

        // Since we need screen coordinates, we'll use the event if available, 

        // but since this is a global listener, we might need to track clientX/Y

      }

    };



    const handleMouseMove = (e: MouseEvent) => {

      (window as any)._lastClientX = e.clientX;

      (window as any)._lastClientY = e.clientY;

    };



    const handleKeyDown = (e: KeyboardEvent) => {

      if (e.key === 'Escape' && useCadStore.getState().pendingFeatureCommand) {

        if (document.activeElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {

          return;

        }

        e.preventDefault();

        setPendingFeatureCommand(null);

        setSelectedTopology(null);

        appliedEdgeFeatureRef.current = null;

        setHint('Ready');

        return;

      }

      if (e.key.toLowerCase() === 's') {

        if (document.activeElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {

          return;

        }

        e.preventDefault();

        setShortcutBox({

          visible: true,

          x: (window as any)._lastClientX || window.innerWidth / 2,

          y: (window as any)._lastClientY || window.innerHeight / 2

        });

      }

    };



    window.addEventListener('mousemove', handleMouseMove);

    window.addEventListener('keydown', handleKeyDown);

    return () => {

      window.removeEventListener('mousemove', handleMouseMove);

      window.removeEventListener('keydown', handleKeyDown);

    };

  }, [setShortcutBox, setPendingFeatureCommand, setSelectedTopology, setHint]);



  const selectedFeature = useMemo(() => features.find(f => f.id === selectedId), [features, selectedId]);

  const solidSketchPointCount = useMemo(

    () => sketchPoints.filter(pt => !pt[2] || !pt[2].includes('CENTER_LINE')).length,

    [sketchPoints]

  );



  const hasConflict = useMemo(() => {

    if (!isSketchMode) return false;

    const report = analyzeSketchDefinitions(sketchNodes, sketchEdges, sketchConstraints);

    return report.hasConflict;

  }, [isSketchMode, sketchNodes, sketchEdges, sketchConstraints]);



  const entities = useMemo(() => {

    const list: SketchEntity[] = [];

    

    // Convert sketchEdges to SketchEntity list

    Object.values(sketchEdges).forEach((edge) => {

      const nodeA = sketchNodes[edge.nodeIds[0]];

      const nodeB = sketchNodes[edge.nodeIds[1]];

      if (!nodeA || !nodeB) return;



      if (edge.type === 'CIRCLE') {

        list.push({

          id: edge.id,

          type: 'CIRCLE',

          name: ` C${list.filter(e => e.type === 'CIRCLE').length + 1}`,

          pointIndices: [], // Indices are legacy

          center: [nodeA.x, nodeA.y],

          radius: Math.hypot(nodeA.x - nodeB.x, nodeA.y - nodeB.y)

        });

      } else {

        list.push({

          id: edge.id,

          type: edge.type === 'CENTER_LINE' ? 'CENTER_LINE' : 'LINE',

          name: `${edge.type === 'CENTER_LINE' ? 'CL' : 'L'}${list.filter(e => e.type === (edge.type === 'CENTER_LINE' ? 'CENTER_LINE' : 'LINE')).length + 1}`,

          pointIndices: [] // Legacy

        });

      }

    });



    return list;

  }, [sketchNodes, sketchEdges]);



  // Listen to selectedTopology changes in Assembly/Mate Mode

  useEffect(() => {

    const clickedTopo = useCadStore.getState().selectedTopology;

    if (isSketchMode || activeTab !== 'ASSEMBLY' || !clickedTopo) return;



    const prevSelection = useCadStore.getState().mateSelection || [];

    if (prevSelection.some((p: any) => p.id === clickedTopo.id)) {

      useCadStore.getState().setSelectedTopology(null);

      return;

    }



    const mateEntity = {
      id: clickedTopo.id,
      type: clickedTopo.type,
      componentId: 'root',
      coordinates: clickedTopo.coordinates,
      normal: clickedTopo.normal,
    };

    let nextSelection = [...prevSelection];

    if (nextSelection.length >= 2) nextSelection = [mateEntity];

    else nextSelection.push(mateEntity);



    setMateSelection(nextSelection);

    useCadStore.getState().setSelectedTopology(null);

  }, [activeTab, isSketchMode, setMateSelection]);



  // Fillet / Chamfer: pick edge after ribbon command

  useEffect(() => {

    const cmd = pendingFeatureCommand;

    const topo = selectedTopology;

    if (isSketchMode || !cmd || !topo || topo.type !== 'EDGE') return;

    const start = topo.edgeData?.start;

    const end = topo.edgeData?.end;

    if (!start || !end) return;

    if (topo.id && appliedEdgeFeatureRef.current === topo.id) return;

    appliedEdgeFeatureRef.current = topo.id ?? `edge_${Date.now()}`;



    const featureId = `feat_${Date.now()}`;

    if (cmd === 'FILLET') {

      addFeature({

        id: featureId,

        type: 'FILLET',

        name: `Fillet ${features.length + 1}`,

        parameters: {

          radius: defaultFilletRadius,

          edge_start: start,

          edge_end: end,

          signature: topo.signature,

          operation: 'ADD',

        },

      });

    } else {

      addFeature({

        id: featureId,

        type: 'CHAMFER',

        name: `Chamfer ${features.length + 1}`,

        parameters: {

          distance: defaultChamferDistance,

          edge_start: start,

          edge_end: end,

          signature: topo.signature,

          operation: 'ADD',

        },

      });

    }



    setPendingFeatureCommand(null);

    setSelectedTopology(null);

    setSelectedId(featureId);

    setHint('Ready');

    setTimeout(handleRebuild, 50);

  }, [

    pendingFeatureCommand,

    selectedTopology,

    isSketchMode,

    features.length,

    defaultFilletRadius,

    defaultChamferDistance,

    addFeature,

    setPendingFeatureCommand,

    setSelectedTopology,

    setSelectedId,

    setHint,

    handleRebuild,

  ]);



  // The new "Assembly-Aware" Rebuild Logic with History Rollback ()

  const handleInsertComponent = () => {

    const id = `comp_${Date.now()}`;

    const newComp = {

      id,

      partId: 'current',

      instanceName: `Component ${components.length + 1}`,

      transform: {

        position: [components.length * 50, 0, 0] as [number, number, number],

        rotation: [0, 0, 0] as [number, number, number]

      },

      visible: true

    };

    addComponent(newComp);

  };



  const handleOpen = async () => {

    const result = await fileAPI.open();

    if (result) {

      const readResult = await fileAPI.read(result.path);

      if (readResult.success && readResult.content) {

        loadCadData(readResult.content, result.path);

      }

    }

  };



  const handleSave = async () => {

    handleSaveProject();

  };



  useEffect(() => {

    const timer = setTimeout(() => {

      handleRebuild();

    }, 150); // Debounce rebuilds for smoother live preview

    return () => clearTimeout(timer);

  }, [handleRebuild]);



  const onParamChange = (key: string, value: string) => {

    if (!selectedId) return;



    // Industrial Parameter Handling: String-based parameters (Booleans, Planes, Types)

    const stringParams = ['operation', 'plane', 'type', 'target_feature_id', 'pattern_type', 'axis'];



    if (stringParams.includes(key)) {

      updateFeatureParams(selectedId, { [key]: value });

      // Trigger immediate rebuild for non-numeric params that change topology

      setTimeout(handleRebuild, 0);

      return;

    }



    const num = parseFloat(value);

    if (isNaN(num)) return;

    updateFeatureParams(selectedId, { [key]: num });

    // Numeric params are debounced by the handleRebuild useEffect

  };





  const addNewFeature = (type: 'EXTRUDE' | 'BOX' | 'CYLINDER' | 'SPHERE' | 'PATTERN', operation: 'ADD' | 'CUT' = 'ADD') => {

    const id = `feat_${Date.now()}`;

    const names = {

      EXTRUDE: operation === 'ADD' ? '-' : '-',

      BOX: '',

      CYLINDER: '',

      SPHERE: '',

      PATTERN: ''

    };

    const defaultParams = {

      EXTRUDE: { width: 10, height: 10, depth: 10, x: 0, y: 0, z: 0, operation: operation, plane: 'FRONT' },

      BOX: { width: 10, height: 10, depth: 10, x: 0, y: 0, z: 0 },

      CYLINDER: { radius: 5, height: 10, x: 0, y: 0, z: 0 },

      SPHERE: { radius: 5, x: 0, y: 0, z: 0 },

      PATTERN: {

        target_feature_id: features.find(f => f.type === 'EXTRUDE' || f.type === 'BOX' || f.type === 'CYLINDER' || f.type === 'SPHERE' || f.type === 'REVOLVE')?.id ?? '',

        pattern_type: 'CIRCULAR',

        axis: 'Y',

        count: 4,

        spacing: 90.0

      }

    };



    addFeature({

      id,

      type,

      name: `${names[type]} ${features.length + 1}`,

      parameters: defaultParams[type]

    });

    setSelectedId(id);

  };



  const loadCadData = useCallback(
    async (content: string, filePath: string) => {
      const pathLower = filePath.toLowerCase();
      if (pathLower.endsWith('.sldprt') || pathLower.endsWith('.sldasm')) {
        setShowTranslatorModal(true);
        return;
      }
      resetRebuildCache();
      await loadPartDocument(content, filePath, () => setTimeout(handleRebuild, 50));
    },
    [handleRebuild, loadPartDocument, resetRebuildCache],
  );



  const handleExportCad = async (format: 'STEP' | 'IGES' | 'STL') => {

    if (typeof window === 'undefined' || !window.electronAPI) {

      alert(' Electron ');

      return;

    }



    // We pass empty string just to open the save dialog and get the path

    const result = await window.electronAPI.file.save('');

    if (result && result.success && result.path) {

      setLoading(true);

      try {

        const success = await client.exportCadFile(features, format, result.path);

        if (success) {

          appAPI.notify('', ` ${format} : ${result.path}`);

        } else {

          alert(` ${format}  3D `);

        }

      } catch (err) {

        console.error(`[Export] ${format} failed:`, err);

        alert(`: ${err}`);

      } finally {

        setLoading(false);

      }

    }

  };



  const handleCalculateMassProperties = async () => {

    setLoading(true);

    try {

      const results = await client.calculateMassProperties(features);

      if (results) {

        setMassProps(results);

        setShowMassPropsModal(true);

      }

    } catch (err) {

      console.error('[API] Mass properties failed:', err);

      alert(' 3D ');

    } finally {

      setLoading(false);

    }

  };



  const resetSketchSession = useCallback(() => {

    setSketchNodes({});

    setSketchEdges({});

    setSketchConstraints({});

    setSketchPoints([]);

    setSketchRelations([]);

    setSketchMode(false);

    setActivePlane(null);

    setEditingFeatureId(null);

    setSmartDimensionActive(false);

    setSelectedEntityIds([]);

    setActiveFaceOrigin(null);

    setActiveFaceNormal(null);

    setActiveFaceId(null);

  }, [setSketchNodes, setSketchEdges, setSketchConstraints, setSketchPoints, setSketchRelations, setSketchMode, setActivePlane, setEditingFeatureId, setSelectedEntityIds, setActiveFaceOrigin, setActiveFaceNormal, setActiveFaceId]);

  const handleEditFeatureSketch = useCallback((f: CADFeature) => {
    setEditingFeatureId(f.id);
    setSketchNodes(f.parameters.sketchNodes || {});
    setSketchEdges(f.parameters.sketchEdges || {});
    setSketchConstraints(f.parameters.sketchConstraints || {});
    setSketchRelations(f.parameters.relations || []);
    setActivePlane(f.parameters.plane);
    if (f.parameters.plane === 'FACE') {
      setActiveFaceOrigin(f.parameters.faceOrigin);
      setActiveFaceNormal(f.parameters.faceNormal);
      setActiveFaceId(f.parameters.faceId);
    }
    setSketchMode(true);
    setSketchTool('SELECT');
    setActiveTab('SKETCH');
  }, [setEditingFeatureId, setSketchNodes, setSketchEdges, setSketchConstraints, setSketchRelations, setActivePlane, setActiveFaceOrigin, setActiveFaceNormal, setActiveFaceId, setSketchMode, setSketchTool, setActiveTab]);

  const handleExitAndExtrude = useCallback((operationOverride?: 'ADD' | 'CUT') => {
    // Connection Warning (Non-blocking attempt)
    if (engineStatus === 'DISCONNECTED') {
      console.warn('Attempting construction while kernel reports DISCONNECTED...');
    }

    const solidLoops = extractAllClosedLoops(sketchNodes, sketchEdges);
    
    // 2. Profile Validation Guard
    if (solidLoops.length === 0 || solidLoops[0].length < 3) {
      alert('Invalid Sketch Profile: No closed loop found.\nPlease ensure your sketch forms a single closed boundary without self-intersections.');
      return;
    }

    if (!activePlane) return;



    const existingFeature = editingFeatureId ? features.find(f => f.id === editingFeatureId) : null;

    const existingParams = existingFeature?.parameters ?? {};

    const nextParams = {

      ...existingParams,

      points: solidLoops,

      sketchNodes: { ...sketchNodes },

      sketchEdges: { ...sketchEdges },

      sketchConstraints: { ...sketchConstraints },

      depth: existingParams.depth ?? 10,

      x: existingParams.x ?? 0,

      y: existingParams.y ?? 0,

      z: existingParams.z ?? 0,

      operation: operationOverride ?? existingParams.operation ?? 'ADD',

      plane: activePlane,

      relations: [...sketchRelations],

      ...(activePlane === 'FACE' ? {

        faceOrigin: activeFaceOrigin,

        faceNormal: activeFaceNormal,

        faceId: activeFaceId

      } : {})

    };



    let featureId = editingFeatureId;

    if (featureId && existingFeature) {

      updateFeatureParams(featureId, nextParams);

    } else {

      featureId = `feat_${Date.now()}`;

      addFeature({

        id: featureId,

        type: 'EXTRUDE',

        name: `Custom Extrude ${features.length + 1}`,

        parameters: nextParams

      });

    }



    resetSketchSession();

    setRollbackIndex(null); // Clear rollback on exit

    setSelectedId(featureId);



    setTimeout(handleRebuild, 50);

  }, [sketchNodes, sketchEdges, activePlane, editingFeatureId, features, sketchRelations, updateFeatureParams, addFeature, resetSketchSession, setSelectedId, handleRebuild, activeFaceOrigin, activeFaceNormal, activeFaceId, sketchConstraints]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__handleRebuild = handleRebuild;
      (window as any).__handleExtrude = handleExitAndExtrude;
    }
  }, [handleRebuild, handleExitAndExtrude]);



  const handleRevolveFromSketch = useCallback(() => {

    const solidLoops = extractAllClosedLoops(sketchNodes, sketchEdges);

    if (solidLoops.length === 0 || solidLoops[0].length < 3) {

      alert('Invalid Sketch Profile: No closed loop found.\nDraw a closed profile before Revolve Boss.');

      return;

    }

    if (!activePlane) return;



    const existingFeature = editingFeatureId ? features.find(f => f.id === editingFeatureId) : null;

    const existingParams = existingFeature?.parameters ?? {};

    const nextParams = {

      ...existingParams,

      points: solidLoops,

      sketchNodes: { ...sketchNodes },

      sketchEdges: { ...sketchEdges },

      sketchConstraints: { ...sketchConstraints },

      angle: existingParams.angle ?? 360,

      x: existingParams.x ?? 0,

      y: existingParams.y ?? 0,

      z: existingParams.z ?? 0,

      operation: existingParams.operation ?? 'ADD',

      plane: activePlane,

      relations: [...sketchRelations],

      ...(activePlane === 'FACE' ? {

        faceOrigin: activeFaceOrigin,

        faceNormal: activeFaceNormal,

        faceId: activeFaceId

      } : {})

    };



    let featureId = editingFeatureId;

    if (featureId && existingFeature) {

      useCadStore.setState((s) => ({

        features: s.features.map((f) =>

          f.id === featureId ? { ...f, type: 'REVOLVE', parameters: nextParams } : f

        ),

      }));

    } else {

      featureId = `feat_${Date.now()}`;

      addFeature({

        id: featureId,

        type: 'REVOLVE',

        name: `Revolve ${features.length + 1}`,

        parameters: nextParams,

      });

    }



    resetSketchSession();

    setRollbackIndex(null);

    setSelectedId(featureId);

    setTimeout(handleRebuild, 50);

  }, [

    sketchNodes,

    sketchEdges,

    sketchConstraints,

    activePlane,

    editingFeatureId,

    features,

    sketchRelations,

    updateFeatureParams,

    addFeature,

    resetSketchSession,

    setSelectedId,

    handleRebuild,

    activeFaceOrigin,

    activeFaceNormal,

    activeFaceId,

  ]);



  const applyHorizontalConstraint = useCallback(() => {

    if (sketchPoints.length < 2) return;

    const newPts = [...sketchPoints];

    for (let i = 0; i < newPts.length - 1; i++) {

      const dy = Math.abs(newPts[i][1] - newPts[i + 1][1]);

      if (dy > 0 && dy < 4.5) {

        newPts[i + 1][1] = newPts[i][1];

      }

    }

    if (newPts.length > 3) {

      const start = newPts[0];

      const end = newPts[newPts.length - 1];

      if (Math.hypot(start[0] - end[0], start[1] - end[1]) < 0.1) {

        const dy = Math.abs(start[1] - newPts[newPts.length - 2][1]);

        if (dy > 0 && dy < 4.5) {

          newPts[newPts.length - 2][1] = start[1];

        }

      }

    }

    setSketchPoints(newPts);

    const newRel = `水平 (Horizontal ${sketchRelations.filter(r => r.includes('')).length + 1})`;

    setSketchRelations([...sketchRelations, newRel]);

  }, [ sketchRelations, setSketchRelations]);



  const applyVerticalConstraint = useCallback(() => {

    if (sketchPoints.length < 2) return;

    const newPts = [...sketchPoints];

    for (let i = 0; i < newPts.length - 1; i++) {

      const dx = Math.abs(newPts[i][0] - newPts[i + 1][0]);

      if (dx > 0 && dx < 4.5) {

        newPts[i + 1][0] = newPts[i][0];

      }

    }

    if (newPts.length > 3) {

      const start = newPts[0];

      const end = newPts[newPts.length - 1];

      if (Math.hypot(start[0] - end[0], start[1] - end[1]) < 0.1) {

        const dx = Math.abs(start[0] - newPts[newPts.length - 2][0]);

        if (dx > 0 && dx < 4.5) {

          newPts[newPts.length - 2][0] = start[0];

        }

      }

    }

    setSketchPoints(newPts);

    const newRel = `Perpendicular (Vertical ${sketchRelations.filter(r => r.includes('Perpendicular')).length + 1})`;

    setSketchRelations([...sketchRelations, newRel]);

  }, [ sketchRelations, setSketchRelations]);



  const applyCoincidentToOrigin = useCallback(() => {

    if (sketchPoints.length === 0) return;

    const du = sketchPoints[0][0];

    const dv = sketchPoints[0][1];

    const newPts = sketchPoints.map(pt => [

      pt[0] - du,

      pt[1] - dv,

      pt[2]

    ]);

    setSketchPoints(newPts);

    const newRel = `Coincident (Coincident ${sketchRelations.filter(r => r.includes('Coincident')).length + 1})`;

    setSketchRelations([...sketchRelations, newRel]);

  }, [ sketchRelations, setSketchRelations]);



  const applyEqualSidesConstraint = useCallback(() => {

    if (sketchPoints.length < 4) return;

    const newPts = [...sketchPoints];

    const u1 = newPts[0][0];

    const v1 = newPts[0][1];

    const u2 = newPts[2][0];

    const v2 = newPts[2][1];



    const w = Math.abs(u2 - u1);

    const directionSign = v2 >= v1 ? 1 : -1;

    const newV2 = v1 + w * directionSign;



    newPts[1] = [u2, v1, newPts[1][2]];

    newPts[2] = [u2, newV2, newPts[2][2]];

    newPts[3] = [u1, newV2, newPts[3][2]];

    if (newPts[4]) {

      newPts[4] = [u1, v1, newPts[4][2]];

    }

    setSketchPoints(newPts);

    const newRel = ` (Equal ${sketchRelations.filter(r => r.includes('')).length + 1})`;

    setSketchRelations([...sketchRelations, newRel]);

  }, [ sketchRelations, setSketchRelations]);



  const applySmoothArcConstraint = useCallback(() => {

    const newPts = [...sketchPoints];

    for (let i = 0; i < newPts.length - 2; i++) {

      if (newPts[i + 1] && newPts[i + 1][2] === 'ARC_CONTROL') {

        const p_start = newPts[i];

        const p_end = newPts[i + 2];

        const mid_u = (p_start[0] + p_end[0]) / 2;

        const mid_v = (p_start[1] + p_end[1]) / 2;

        const du = p_end[0] - p_start[0];

        const dv = p_end[1] - p_start[1];

        const length = Math.hypot(du, dv);

        if (length > 0.1) {

          const perp_u = -dv / length;

          const perp_v = du / length;

          newPts[i + 1] = [

            mid_u + perp_u * (length * 0.25),

            mid_v + perp_v * (length * 0.25),

            'ARC_CONTROL'

          ];

        }

      }

    }

    setSketchPoints(newPts);

    const newRel = `Tangent (Tangent ${sketchRelations.filter(r => r.includes('Tangent')).length + 1})`;

    setSketchRelations([...sketchRelations, newRel]);

  }, [ sketchRelations, setSketchRelations]);



  const applyFixConstraint = useCallback(() => {

    const newPts = sketchPoints.map(pt => [

      Math.round(pt[0]),

      Math.round(pt[1]),

      pt[2]

    ]);

    setSketchPoints(newPts);

    const newRel = ` (Fixed ${sketchRelations.filter(r => r.includes('')).length + 1})`;

    setSketchRelations([...sketchRelations, newRel]);

  }, [ sketchRelations, setSketchRelations]);



  const handleScaleSegment = useCallback((index: number, newLen: number) => {

    if (sketchPoints.length < 2) return;

    const newPts = [...sketchPoints];

    const i = index;

    const nextIdx = (i + 1) % newPts.length;



    const p1 = newPts[i];

    const p2 = newPts[nextIdx];



    const du = p2[0] - p1[0];

    const dv = p2[1] - p1[1];

    const currentLen = Math.hypot(du, dv);



    if (currentLen > 0.1) {

      const scale = newLen / currentLen;

      const newU = p1[0] + du * scale;

      const newV = p1[1] + dv * scale;



      const deltaU = newU - p2[0];

      const deltaV = newV - p2[1];



      // Shift all subsequent points so the loop shape maintains relative dimensions!

      for (let j = nextIdx; j < newPts.length; j++) {

        newPts[j] = [newPts[j][0] + deltaU, newPts[j][1] + deltaV, newPts[j][2]];

      }



      // If closed loop, make sure the last point matches the first point coordinate if they were coincident

      if (newPts.length > 3) {

        const start = newPts[0];

        const end = newPts[newPts.length - 1];

        if (Math.hypot(start[0] - end[0], start[1] - end[1]) < 1.0) {

          newPts[newPts.length - 1] = [start[0], start[1], end[2]];

        }

      }

      setSketchPoints(newPts);



      const newRel = `尺寸定量 (Dim ${sketchRelations.filter(r => r.includes('')).length + 1})`;

      setSketchRelations([...sketchRelations, newRel]);

    }

  }, [ sketchRelations, setSketchRelations]);



  const applyParallelRelation = useCallback((entA: SketchEntity, entB: SketchEntity) => {

    const newPts = [...sketchPoints];

    const ptsA = entA.pointIndices.map(idx => newPts[idx]);

    const ptsB = entB.pointIndices.map(idx => newPts[idx]);

    if (ptsA.length < 2 || ptsB.length < 2) return;

    const angleA = Math.atan2(ptsA[1][1] - ptsA[0][1], ptsA[1][0] - ptsA[0][0]);

    const midB_u = (ptsB[0][0] + ptsB[1][0]) / 2;

    const midB_v = (ptsB[0][1] + ptsB[1][1]) / 2;

    const lenB = Math.hypot(ptsB[1][0] - ptsB[0][0], ptsB[1][1] - ptsB[0][1]);

    const dx = Math.cos(angleA) * (lenB / 2);

    const dy = Math.sin(angleA) * (lenB / 2);

    newPts[entB.pointIndices[0]] = [midB_u - dx, midB_v - dy, newPts[entB.pointIndices[0]][2]];

    newPts[entB.pointIndices[1]] = [midB_u + dx, midB_v + dy, newPts[entB.pointIndices[1]][2]];

    setSketchPoints(newPts);

    const newRel = `Parallel (Parallel: ${entA.name} ∥ ${entB.name})`;

    setSketchRelations([...sketchRelations, newRel]);

    setSelectedEntityIds([]);

  }, [ setSelectedEntityIds]);



  const applyConcentricRelation = useCallback((entA: SketchEntity, entB: SketchEntity) => {

    if (!entA.center || !entB.center) return;

    const newPts = [...sketchPoints];

    const deltaU = entA.center[0] - entB.center[0];

    const deltaV = entA.center[1] - entB.center[1];

    entB.pointIndices.forEach(idx => {

      newPts[idx] = [newPts[idx][0] + deltaU, newPts[idx][1] + deltaV, newPts[idx][2]];

    });

    setSketchPoints(newPts);

    const newRel = `Concentric (Concentric: ${entA.name}  ${entB.name})`;

    setSketchRelations([...sketchRelations, newRel]);

    setSelectedEntityIds([]);

  }, [ setSelectedEntityIds]);



  const applyTangentRelation = useCallback((lineEnt: SketchEntity, circleEnt: SketchEntity) => {

    if (!circleEnt.center || circleEnt.radius === undefined) return;

    const newPts = [...sketchPoints];

    const p1 = newPts[lineEnt.pointIndices[0]];

    const p2 = newPts[lineEnt.pointIndices[1]];

    const cU = circleEnt.center[0];

    const cV = circleEnt.center[1];

    const R = circleEnt.radius;

    const du = p2[0] - p1[0];

    const dv = p2[1] - p1[1];

    const len = Math.hypot(du, dv);

    if (len < 0.1) return;

    const nu = -dv / len;

    const nv = du / len;

    const dist = nu * (cU - p1[0]) + nv * (cV - p1[1]);

    const shift = R - Math.abs(dist);

    const direction = dist >= 0 ? 1 : -1;

    const shiftU = -nu * shift * direction;

    const shiftV = -nv * shift * direction;

    newPts[lineEnt.pointIndices[0]] = [p1[0] + shiftU, p1[1] + shiftV, p1[2]];

    newPts[lineEnt.pointIndices[1]] = [p2[0] + shiftU, p2[1] + shiftV, p2[2]];

    setSketchPoints(newPts);

    const newRel = `Tangent (Tangent: ${lineEnt.name}  ${circleEnt.name})`;

    setSketchRelations([...sketchRelations, newRel]);

    setSelectedEntityIds([]);

  }, [ setSelectedEntityIds]);



  const applyMirrorSketch = useCallback(() => {

    const selectedEntities = entities.filter(ent => selectedEntityIds.includes(ent.id));

    const centerline = selectedEntities.find(ent => ent.type === 'CENTER_LINE');

    if (!centerline) return;



    const targets = selectedEntities.filter(ent => ent.id !== centerline.id);

    if (targets.length === 0) return;



    const cp1 = sketchPoints[centerline.pointIndices[0]];

    const cp2 = sketchPoints[centerline.pointIndices[1]];

    if (!cp1 || !cp2) return;



    const a = cp2[1] - cp1[1];

    const b = -(cp2[0] - cp1[0]);

    const c = cp2[0] * cp1[1] - cp2[1] * cp1[0];

    const denom = a * a + b * b;

    if (denom < 1e-6) return;



    const newPts = [...sketchPoints];



    targets.forEach(target => {

      target.pointIndices.forEach((ptIdx, loopIdx) => {

        const pt = sketchPoints[ptIdx];

        const u = pt[0];

        const v = pt[1];

        const d = (a * u + b * v + c) / denom;

        const mirU = u - 2 * a * d;

        const mirV = v - 2 * b * d;



        // Extract original tag without any starting 'START' to avoid duplicate starts,

        // and then append 'START' for the first point of the mirrored entity.

        let origTag = pt[2] || '';

        origTag = origTag.split(',').filter((t: string) => t !== 'START').join(',');

        

        let tag = origTag;

        if (loopIdx === 0) {

          tag = tag ? 'START,' + tag : 'START';

        }



        newPts.push([mirU, mirV, tag]);

      });

    });



    setSketchPoints(newPts);

    const newRel = ` (Mirror: ${targets.map(t => t.name).join(', ')}   ${centerline.name})`;

    setSketchRelations([...sketchRelations, newRel]);

    setSelectedEntityIds([]);

  }, [entities, selectedEntityIds, setSelectedEntityIds]);



  const handlePrintToPDF = useCallback(async () => {

    try {

      const result = await fileAPI.printToPdf();

      if (result.success && result.path) {

        appAPI.notify('PDF  ', `:
${result.path}`);

      } else if (result.error && result.error !== 'Cancelled') {

        alert(`PDF : ${result.error}`);

      }

    } catch (e) {

      console.error(e);

      alert('PDF ');

    }

  }, []);



  return (

    <main className="flex flex-col h-screen w-screen overflow-hidden bg-background text-primary-text font-sans">

      {/* 1. SolidWorks Desktop Titlebar */}

      <header className="h-[32px] w-full bg-[#F5F5F5] border-b border-[#A0A0A0] flex items-center justify-between px-3 select-none z-50 shrink-0" style={{ background: "linear-gradient(to bottom, #FFFFFF 0%, #E8E8E8 100%)" }}>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-[14px] font-black tracking-tighter text-[#000000]">
            <div className="w-6 h-6 bg-[#005B9A] rounded-sm flex items-center justify-center text-white text-[11px] shadow-sm font-sans">3D</div>
            3D-Builder Pro
          </div>
          <nav className="flex items-center gap-4 text-[12px] text-[#404040] font-semibold">
            {["File", "Edit", "View", "Insert", "Tools", "Help"].map(m => (
              <span key={m} className="hover:text-[#005B9A] cursor-pointer transition-colors px-1 uppercase tracking-wider">{m}</span>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-[11px] text-[#404040] font-medium bg-[#FFFFFF] px-4 py-1 rounded-sm border border-[#A0A0A0] shadow-inner">
            Part 1.3DBPART * <span className="text-[#005B9A] font-bold">[{activePlane || "No Active Plane"}]</span>
          </div>
          <div className="flex items-center gap-3 text-[12px]">
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${engineStatus === "CONNECTED" ? "bg-[#28a745]" : "bg-[#dc3545]"} shadow-sm`} />
              <span className="text-[#404040] font-bold uppercase tracking-widest text-[10px]">Kernel: <span className={engineStatus === "CONNECTED" ? "text-[#28a745]" : "text-[#dc3545]"}>{engineStatus}</span></span>
            </div>
          </div>
        </div>
      </header>



      
      {/* 2. SolidWorks CommandManager (Ribbon Bar) */}
      <div className="h-[110px] w-full bg-[#E8E8E8] border-b border-[#A0A0A0] flex flex-col z-20 shrink-0 select-none">
        {/* Ribbon Tabs */}
        <div className="flex px-2 border-b border-[#A0A0A0] bg-[#D6DADC]">
          <button
            onClick={() => { setActiveTab('FEATURES'); setMeasurementMode('NONE'); setMeasurementPoints([]); setMeasurementResults(null); } }
            className={`px-6 py-1.5 text-[11px] font-black transition-all border-b-[3px] uppercase ${activeTab === "FEATURES" ? "border-[#005B9A] text-[#005B9A] bg-white shadow-sm" : "border-transparent text-slate-600 hover:bg-white/50"}` }
          >FEATURES</button>
          <button
            onClick={() => {
              setActiveTab('SKETCH'); 
              setMeasurementMode('NONE'); 
              setMeasurementPoints([]); 
              setMeasurementResults(null);
              
              if (!isSketchMode) { 
                setEditingFeatureId(null); 
                setSketchPoints([]); 
                setSketchRelations([]);      
                
                // Smart Plane Selection:
                // 1. Priority: Currently selected topology face
                if (selectedTopology?.type === 'FACE' && selectedTopology.coordinates && selectedTopology.normal) {
                  setActiveFaceOrigin(selectedTopology.coordinates); 
                  setActiveFaceNormal(selectedTopology.normal);
                  setActiveFaceId(selectedTopology.id || `face_${Date.now()}`); 
                  setActivePlane('FACE'); 
                  triggerCameraNormal();
                } 
                // 2. Secondary: A plane already selected via FeatureTree or Viewport (activePlane might be set)
                else if (activePlane) {
                  triggerCameraNormal();
                }
                // 3. Fallback: Default to FRONT
                else {
                  setActivePlane('FRONT');
                  triggerCameraNormal();
                }
                
                setSketchMode(true); 
                setSketchTool('SELECT');
              }
            } }
            className={`px-6 py-1.5 text-[11px] font-black transition-all border-b-[3px] uppercase ${activeTab === "SKETCH" ? "border-[#005B9A] text-[#005B9A] bg-white shadow-sm" : "border-transparent text-slate-600 hover:bg-white/50"}` }
          >SKETCH</button>
          <button
            onClick={() => { setActiveTab('EVALUATE'); setMeasurementMode('NONE'); } }
            className={`px-6 py-1.5 text-[11px] font-black transition-all border-b-[3px] uppercase ${activeTab === "EVALUATE" ? "border-[#005B9A] text-[#005B9A] bg-white shadow-sm" : "border-transparent text-slate-600 hover:bg-white/50"}` }
          >EVALUATE</button>
        </div>

        {/* Ribbon Content Panels */}
        <div className="flex-1 flex items-center px-6 py-2 gap-2 overflow-x-auto overflow-y-hidden bg-surface"> 
          {activeTab === 'FEATURES' ? (
            <div className="flex items-center gap-2 h-full animate-in fade-in slide-in-from-left-2 duration-300">
              <button onClick={() => { if (solidSketchPointCount >= 3) handleExitAndExtrude(); else { setSketchMode(true); setSketchTool('SELECT'); } }} className="flex flex-col items-center justify-center gap-0.5 px-3 h-[78px] min-w-[75px] transition-all border border-transparent hover:bg-white hover:border-[#A0A0A0] active:bg-slate-100 group" title="Extruded Boss/Base">
                <div className="w-10 h-10 flex items-center justify-center text-[#005B9A] transition-transform group-hover:scale-110">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                </div>
                <span className="text-[10px] font-bold text-slate-800 leading-none uppercase">Extrude</span>
              </button>
              <button onClick={() => { if (solidSketchPointCount >= 3) handleExitAndExtrude('CUT'); else { setSketchMode(true); setSketchTool('SELECT'); } }} className="flex flex-col items-center justify-center gap-0.5 px-3 h-[78px] min-w-[75px] transition-all border border-transparent hover:bg-white hover:border-[#A0A0A0] active:bg-slate-100 group" title="Extruded Cut">
                <div className="w-10 h-10 flex items-center justify-center text-red-600 transition-transform group-hover:scale-110">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M12 22V12"/><path d="M3 8l9 4 9-4"/></svg>
                </div>
                <span className="text-[10px] font-bold text-slate-800 leading-none uppercase">Cut</span>
              </button>
              <div className="w-[1px] h-10 bg-border/50 mx-2" />
              <button
                onClick={() => {
                  const loops = extractAllClosedLoops(sketchNodes, sketchEdges);
                  if (isSketchMode && loops.length > 0 && loops[0].length >= 3) handleRevolveFromSketch();
                  else { setSketchMode(true); setSketchTool('SELECT'); setHint('Draw closed profile, then Revolved Boss/Base'); }
                }}
                className={`flex flex-col items-center justify-center gap-0.5 px-3 h-[78px] min-w-[75px] transition-all border ${pendingFeatureCommand ? 'border-transparent' : 'border-transparent hover:bg-white hover:border-[#A0A0A0]'} active:bg-slate-100 group`}
                title="Revolve Boss/Base"
              >
                <div className="w-10 h-10 flex items-center justify-center text-[#005B9A] transition-transform group-hover:scale-110">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v4"/><path d="m16.2 7.8 2.9-2.9"/><path d="M18 12h4"/><path d="m16.2 16.2 2.9 2.9"/><path d="M12 18v4"/><path d="m7.8 16.2-2.9 2.9"/><path d="M2 12h4"/><path d="m7.8 7.8-2.9-2.9"/><circle cx="12" cy="12" r="3"/></svg>
                </div>
                <span className="text-[10px] font-bold text-slate-800 leading-none uppercase">Revolve</span>
              </button>
              <button
                onClick={() => { appliedEdgeFeatureRef.current = null; setActiveTab('FEATURES'); setPendingFeatureCommand('FILLET'); setSelectedTopology(null); }}
                className={`flex flex-col items-center justify-center gap-0.5 px-3 h-[78px] min-w-[75px] transition-all border ${pendingFeatureCommand === 'FILLET' ? 'border-[#005B9A] bg-white shadow-sm' : 'border-transparent hover:bg-white hover:border-[#A0A0A0]'} active:bg-slate-100 group`}
                title="Fillet"
              >
                <div className="w-10 h-10 flex items-center justify-center text-[#005B9A] transition-transform group-hover:scale-110">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 20h16"/><path d="M4 4v16"/><path d="M4 12c4 0 8-4 8-8"/></svg>
                </div>
                <span className="text-[10px] font-bold text-slate-800 leading-none uppercase">Fillet</span>
              </button>
              <button
                onClick={() => { appliedEdgeFeatureRef.current = null; setActiveTab('FEATURES'); setPendingFeatureCommand('CHAMFER'); setSelectedTopology(null); }}
                className={`flex flex-col items-center justify-center gap-0.5 px-3 h-[78px] min-w-[75px] transition-all border ${pendingFeatureCommand === 'CHAMFER' ? 'bg-white border-[#A0A0A0] shadow-inner' : 'border-transparent hover:bg-white hover:border-[#A0A0A0]'} active:bg-slate-100 group`}
                title="Chamfer"
              >
                <div className={`w-10 h-10 flex items-center justify-center transition-transform ${pendingFeatureCommand === 'CHAMFER' ? 'text-[#005B9A] scale-110' : 'text-slate-600 group-hover:scale-110'}`}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 20V4"/><path d="M4 20 16 4"/></svg>
                </div>
                <span className="text-[10px] font-bold text-slate-800 leading-none uppercase">Chamfer</span>
              </button>
            </div>
          ) : activeTab === 'SKETCH' ? (
            <div className="flex items-center gap-2 h-full animate-in fade-in slide-in-from-left-2 duration-300">
              <button onClick={resetSketchSession} className="flex flex-col items-center justify-center gap-0.5 px-3 h-[78px] min-w-[75px] transition-all border border-transparent hover:bg-white hover:border-[#A0A0A0] active:bg-slate-100 group" title="Exit Sketch">
                <div className="w-10 h-10 flex items-center justify-center text-emerald-600 transition-transform group-hover:scale-110">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                </div>
                <span className="text-[10px] font-bold text-slate-800 leading-none uppercase">Exit</span>
              </button>
              <div className="w-[1px] h-10 bg-border/50 mx-2" />
              <button onClick={() => setSmartDimensionActive(!smartDimensionActive)} className={`flex flex-col items-center justify-center gap-0.5 px-3 h-[78px] min-w-[75px] transition-all border ${smartDimensionActive ? 'bg-white border-[#A0A0A0] shadow-inner' : 'border-transparent hover:bg-white hover:border-[#A0A0A0]'} active:bg-slate-100 group`} title="Smart Dimension">
                <div className={`w-10 h-10 flex items-center justify-center transition-transform ${smartDimensionActive ? 'text-[#005B9A] scale-110' : 'text-slate-600 group-hover:scale-110'}`}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m18 8 3 3-3 3"/><path d="m6 8-3 3 3 3"/><path d="M2 11h20"/><path d="M2 4v14"/><path d="M22 4v14"/></svg>
                </div>
                <span className="text-[10px] font-bold text-slate-800 leading-none uppercase">Smart Dim</span>
              </button>
            </div>
          ) : activeTab === 'EVALUATE' ? (
            <div className="flex items-center gap-2 h-full animate-in fade-in slide-in-from-left-2 duration-300">
              <button onClick={() => setMeasurementMode(measurementMode === 'NONE' ? 'DISTANCE' : 'NONE')} className={`flex flex-col items-center justify-center gap-0.5 px-3 h-[78px] min-w-[75px] transition-all border ${measurementMode !== 'NONE' ? 'bg-white border-[#A0A0A0] shadow-inner' : 'border-transparent hover:bg-white hover:border-[#A0A0A0]'} active:bg-slate-100 group`} title="Measure">
                <div className={`w-10 h-10 flex items-center justify-center transition-transform ${measurementMode !== 'NONE' ? 'text-indigo-600 scale-110' : 'text-slate-600 group-hover:scale-110'}`}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21.3 15.3l-5-5L19 7.7l-2-2L14.7 8l-5-5-1.4 1.4 1 1-1.5 1.5-1-1L5.4 7.3l1 1-1.5 1.5-1-1-1.4 1.4 5 5-2.3 2.3 2 2 2.3-2.3 5 5 1.4-1.4-1-1 1.5-1.5 1 1 1.4-1.4-1-1 1.5-1.5 1 1z"/></svg>
                </div>
                <span className="text-[10px] font-bold text-slate-800 leading-none uppercase">Measure</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Kernel Offline Warning Banner */}
      {engineStatus === 'DISCONNECTED' && (
        <div className="bg-red-600 text-white text-[11px] font-black py-1 px-4 flex items-center justify-center gap-4 animate-pulse z-[100]">
          <span>⚠️ GEOMETRY KERNEL OFFLINE</span>
          <button 
            onClick={async () => {
              const client = HeavyEngineClient.getInstance();
              const alive = await client.checkHealth();
              setEngineStatus(alive ? 'CONNECTED' : 'DISCONNECTED');
            }}
            className="px-2 py-0.5 bg-white text-red-600 rounded text-[9px] font-black hover:bg-slate-100"
          >RETRY CONNECTION</button>
        </div>
      )}


      {/* 3. Main Workspace Area */}

      <div className="flex-1 flex w-full overflow-hidden relative">

        {/* Left Sidebars: FeatureManager & PropertyManager */}

        <aside className="w-[300px] h-full bg-[#F5F6F9] border-r border-slate-300 flex flex-col z-10 shrink-0">
          {/* SolidWorks Tab Header */}
          <div className="h-[32px] w-full bg-[#E8E8E8] flex items-center border-b border-slate-300">
            {["Tree", "Properties", "Configs"].map((tab, idx) => (
              <div key={tab} className={`flex-1 h-full flex items-center justify-center text-[10px] font-bold uppercase tracking-tighter cursor-pointer border-r border-slate-300 ${idx === (isSketchMode ? 1 : 0) ? 'bg-white text-[#005B9A] border-b-2 border-b-[#005B9A]' : 'text-slate-500 hover:bg-slate-100'}`}>
                {tab}
              </div>
            ))}
          </div>
          <div className="flex-grow flex flex-col overflow-hidden">
            {isSketchMode ? (
              /* Active Sketch Editor Panel */
              <div className="flex-grow flex flex-col overflow-hidden">
                 <SketchPropertyManager />
              </div>
            ) : activeTab === 'ASSEMBLY' ? (

              <MatePanel />

            ) : measurementMode !== 'NONE' ? (

              <MeasurementPanel />

            ) : (

              <FeatureManagerPanel
                features={features}
                rollbackIndex={rollbackIndex}
                setRollbackIndex={setRollbackIndex}
                activePlane={activePlane}
                setActivePlane={setActivePlane}
                selectedId={selectedId}
                setSelectedId={setSelectedId}
                selectedSubNodeType={selectedSubNodeType}
                setSelectedSubNodeType={setSelectedSubNodeType}
                editingFeatureId={editingFeatureId}
                visibleSketches={visibleSketches}
                toggleSketchVisibility={toggleSketchVisibility}
                removeFeature={removeFeature}
                removeFeatures={removeFeatures}
                onRebuild={handleRebuild}
                onEditFeatureSketch={handleEditFeatureSketch}
                onStartPlaneSketch={handleStartPlaneSketch}
                onPlaneContextMenu={handlePlaneContextMenu}
              />

            )}

          {/*  (Face Selection) */}

          {!isSketchMode && selectedTopology?.type === 'FACE' && measurementMode === 'NONE' && (

            <div className="h-[250px] w-full border-t border-border bg-surface flex flex-col p-3 z-10 shrink-0 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]"> <div className="text-[14px] uppercase tracking-wider text-secondary-text mb-2 font-bold flex justify-between items-center border-b border-border/40 pb-1"> <span className="flex items-center gap-1"> </span> <span className="text-[13px] bg-indigo-600/10 text-indigo-600 px-1.5 rounded uppercase font-mono">Face Selected</span> </div> <div className="flex-1 overflow-y-auto space-y-2.5 pr-1"> <div className="bg-surface p-2.5 rounded border border-border shadow-sm space-y-2 text-[14px]"> <div className="flex justify-between items-center"> <span className="text-secondary-text font-medium"> (Center)</span> <span className="font-mono text-primary-text text-[13px]">

                      {selectedTopology.coordinates ? `[${selectedTopology.coordinates.map((c: number) => c.toFixed(1)).join(', ')}]` : 'N/A'}

                    </span> </div> <div className="flex justify-between items-center"> <span className="text-secondary-text font-medium"> (Normal)</span> <span className="font-mono text-primary-text text-[13px]">

                      {selectedTopology.normal ? `[${selectedTopology.normal.map((n: number) => n.toFixed(2)).join(', ')}]` : 'N/A'}

                    </span> </div>

                  {selectedTopology.id && (

                    <div className="flex justify-between items-center"> <span className="text-secondary-text font-medium"> ID</span> <span className="font-mono text-primary-text text-xs bg-slate-100 px-1 rounded truncate max-w-[120px]" title={selectedTopology.id}>

                        {selectedTopology.id}

                      </span> </div>

                  )}

                </div> <button

                  onClick={() => {

                    if (!selectedTopology.coordinates || !selectedTopology.normal) return;

                    setActiveFaceOrigin(selectedTopology.coordinates);

                    setActiveFaceNormal(selectedTopology.normal);

                    setActiveFaceId(selectedTopology.id || `face_${Date.now()}`);

                    setActivePlane('FACE');

                    setSketchPoints([]);

                    setSketchRelations([]);

                    setSketchMode(true);

                    setSketchTool('SELECT');

                    setEditingFeatureId(null);

                    triggerCameraNormal();

                  }}

                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm text-[14px]"

                >

                  <span> </span> <span> (Sketch on Face)</span> </button> </div> </div>

          )}



          {/* PropertyManager */}
          {!isSketchMode && selectedFeature && selectedSubNodeType !== 'SKETCH' && measurementMode === 'NONE' && (!selectedTopology || selectedTopology.type !== 'FACE') && (
            <PartFeaturePropertyManager
              selectedFeature={selectedFeature}
              features={features}
              onParamChange={onParamChange}
              onEditSketch={handleEditFeatureSketch}
              onSelectFeature={setSelectedId}
            />
          )}

          {/* Sketch Properties Manager () */}

          {!isSketchMode && selectedSubNodeType === 'SKETCH' && selectedFeature && measurementMode === 'NONE' && (

            <div className="h-[250px] w-full border-t border-border bg-[#FDF2F8] flex flex-col p-3 z-10 shrink-0 shadow-[0_-2px_10px_rgba(219,39,119,0.05)]"> <div className="text-[14px] uppercase tracking-wider text-pink-600 mb-2 font-bold flex justify-between items-center border-b border-pink-200 pb-1"> <span className="flex items-center gap-1.5"> </span> <span className="text-[13px] bg-pink-100 text-pink-600 px-1.5 rounded uppercase font-mono">Sketch Node</span> </div> <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 text-[14px]"> <div className="bg-surface p-2.5 rounded border border-pink-200 shadow-sm space-y-2"> <div className="flex justify-between items-center"> <span className="text-secondary-text font-medium"> </span> <span className="font-bold text-primary-text font-mono">

                      {selectedFeature.name.replace('-', '').replace('-', '')}

                    </span> </div> <div className="flex justify-between items-center"> <span className="text-secondary-text font-medium">Reference Plane</span> <span className="font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded font-mono">

                      {selectedFeature.parameters.plane || 'FRONT'}

                    </span> </div> <div className="flex justify-between items-center"> <span className="text-secondary-text font-medium"> </span> <span className="font-bold text-primary-text font-mono">

                      {Array.isArray(selectedFeature.parameters.points) ? selectedFeature.parameters.points.length : 0}

                    </span> </div> <div className="flex justify-between items-center"> <span className="text-secondary-text font-medium"> </span> <span className="font-semibold text-primary font-mono bg-blue-50 border border-blue-100 px-1 rounded">

                      {selectedFeature.name}

                    </span> </div> </div> <button

                  onClick={() => handleEditFeatureSketch(selectedFeature)}

                  className="w-full py-2 bg-pink-600 hover:bg-pink-700 active:bg-pink-800 text-white rounded font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm text-[14px] hover:shadow-pink-200"

                >

                  <span> </span> <span> (Edit Sketch)</span> </button> </div> </div>

          )}



          {/* Measurement PropertyManager () */}

          {!isSketchMode && measurementMode !== 'NONE' && (

            <div className="h-[210px] w-full border-t border-border bg-surface flex flex-col p-3 z-10 shrink-0"> <div className="text-[14px] uppercase tracking-wider text-indigo-600 mb-2 font-bold flex justify-between items-center border-b border-border/40 pb-1"> <span>  (Measure Manager)</span> <button

                  onClick={() => {

                    setMeasurementPoints([]);

                    setMeasurementResults(null);

                  }}

                  className="text-error text-[13px] font-bold hover:underline"

                >

                  

                </button> </div> <div className="flex-1 overflow-y-auto space-y-2.5 pr-1"> <div className="bg-surface p-2.5 rounded-sm border border-border shadow-sm"> <div className="text-[13px] text-indigo-700 font-bold uppercase mb-1.5 border-b border-border/30 pb-0.5 flex justify-between items-center"> <span>: {measurementMode}</span> <span className="text-[12px] text-indigo-600 font-bold bg-indigo-50 px-1 rounded font-mono">

                      : {measurementPoints.length} 

                    </span> </div> <div className="space-y-1">

                    {measurementPoints.length === 0 ? (

                      <div className="text-[13px] text-slate-400 py-4 text-center leading-tight">

                         3D 

                      </div>

                    ) : (

                      <div className="space-y-1.5 max-h-[70px] overflow-y-auto">

                        {measurementPoints.map((pt, pIdx) => (

                          <div key={pIdx} className="flex items-center gap-1.5 text-[13px] text-slate-700 bg-slate-50 p-1.5 rounded border border-slate-200 font-mono"> <span className="text-indigo-500 font-bold">M{pIdx+1}:</span> <span className="font-semibold">{pt.type}</span> <span className="text-slate-400 ml-auto">

                              [{pt.coordinates.map((n: number) => n.toFixed(1)).join(', ')}]

                            </span> </div>

                        ))}

                      </div>

                    )}

                  </div> </div>



                {measurementResults && (

                  <div className="bg-[#4F46E5]/10 p-2.5 rounded-sm border border-[#4F46E5]/20 shadow-sm flex flex-col items-center justify-center py-3"> <span className="text-[13px] text-[#4F46E5] uppercase font-bold tracking-widest mb-1"> </span> <div className="text-base font-black text-slate-900 font-mono leading-none flex items-baseline gap-1"> <span>{(measurementResults.value ?? 0).toFixed(3)}</span> <span className="text-[14px] text-indigo-600 font-bold">{measurementResults.unit}</span> </div>

                    {measurementResults.details && (

                      <span className="text-[13px] text-slate-400 font-mono mt-1 w-full text-center truncate">

                        {measurementResults.details}

                      </span>

                    )}

                  </div>

                )}

              </div> </div>

          )}

          </div>

        </aside>



        {/* Right Area: Viewport (Graphics Area) */}

        <section className="flex-grow h-full relative" onContextMenu={(e) => e.preventDefault()}>

          <HeadsUpToolbar /> <ShortcutBox /> <ContextMenu />



          {isSketchMode && hasConflict && (

            <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-red-500/90 border border-red-400 text-white px-5 py-3 rounded-full shadow-sm flex items-center gap-2.5 z-[999] w-[85%] max-w-[500px] pointer-events-none backdrop-blur-md"> <span className="text-xl"> </span> <div className="flex flex-col"> <span className="text-[12px] font-extrabold uppercase tracking-wider leading-none"> (Over-Constrained Conflict)</span> <span className="text-[11px] font-bold mt-1 text-red-50"> </span> </div> </div>

          )}



          {activeTab === 'DRAWING' ? (

            <DrawingSheet />

          ) : (

            <Viewport>

              {activeTab === 'ASSEMBLY' && components.length > 0 ? (

              components.map((comp) => (

                meshData.map((mesh: { data: MeshData }, idx: number) => (

                  <OcctShape 

                    key={`${comp.id}_${idx}`} 

                    data={mesh.data} 

                    position={comp.transform.position}

                    rotation={comp.transform.rotation}

                  />

                ))

              ))

            ) : meshData && meshData.length > 0 ? (

              meshData.map((mesh: { data: MeshData }, idx: number) => (

                <OcctShape key={idx} data={mesh.data} />

              ))

            ) : (

              <mesh> <sphereGeometry args={[1, 32, 32]} /> <meshStandardMaterial color="#94A3B8" wireframe opacity={0.4} transparent /> </mesh>

            )}

          </Viewport>

          )}



          {/* Floating Sketch Viewport HUD */}

          <SketchHUD onReset={resetSketchSession} onExit={handleExitAndExtrude} />



          {/* Rebuild Progress & Abort Overlay */}
          {loading && (
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[1000] p-4 animate-fade-in">
              <div className="w-[380px] bg-slate-900/90 border border-slate-700/60 rounded-2xl p-6 shadow-2xl flex flex-col gap-4 text-slate-100 relative overflow-hidden backdrop-blur-xl items-center">
                <div className="absolute -top-12 -left-12 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="flex flex-col items-center gap-3 z-10 w-full">
                  <div className="w-10 h-10 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin" />
                  <span className="text-[14px] font-bold text-slate-200 tracking-wide">重建幾何中... (Rebuilding Geometry)</span>
                  <p className="text-[12px] text-slate-400 text-center mb-2">正在計算特徵樹與邊界表示法 (B-Rep)。若計算時間過長，您可以中斷操作。</p>
                  <button
                    onClick={() => abortRebuild()}
                    className="w-full py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 hover:text-red-300 rounded font-bold transition-all text-[13px] shadow-inner"
                  >
                    取消 (Abort)
                  </button>
                </div>
              </div>
            </div>
          )}



          {/*   (Mass Properties Modal) */}

          {showMassPropsModal && massProps && (

            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[1000] p-4 animate-fade-in"> <div className="w-[520px] bg-slate-900/90 border border-slate-700/60 rounded-3xl p-6 shadow-sm flex flex-col gap-5 text-slate-100 relative overflow-hidden backdrop-blur-xl">

                {/* Glowing neon background highlights */}

                <div className="absolute -top-12 -left-12 w-32 h-32 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" /> <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />



                {/* Header */}

                <div className="flex justify-between items-center border-b border-slate-800 pb-3 z-10"> <div className="flex items-center gap-2"> <span className="text-xl"> </span> <span className="text-[16px] font-extrabold tracking-wider uppercase text-amber-400 font-sans">Mass Properties</span> </div> <button

                    onClick={() => setShowMassPropsModal(false)}

                    className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"

                  >

                    

                  </button> </div>



                {/* Physical metrics list */}

                <div className="space-y-3 z-10 font-sans"> <div className="bg-slate-950/50 rounded border border-slate-800/80 p-3.5 flex justify-between items-center shadow-inner"> <div className="flex flex-col"> <span className="text-[13px] text-slate-400 font-bold uppercase tracking-wider">Volume</span> <span className="text-[12px] text-secondary-text mt-0.5"> 3D B-Rep </span> </div> <span className="text-base font-black font-mono text-emerald-400">

                      {massProps.volume.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })} <span className="text-[12px] font-bold text-secondary-text">mm</span> </span> </div> <div className="bg-slate-950/50 rounded border border-slate-800/80 p-3.5 flex justify-between items-center shadow-inner"> <div className="flex flex-col"> <span className="text-[13px] text-slate-400 font-bold uppercase tracking-wider">Surface Area</span> <span className="text-[12px] text-secondary-text mt-0.5">Surface Area</span> </div> <span className="text-base font-black font-mono text-indigo-400">

                      {massProps.surface_area.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })} <span className="text-[12px] font-bold text-secondary-text">mm</span> </span> </div> <div className="bg-slate-950/50 rounded border border-slate-800/80 p-3.5 flex flex-col gap-2 shadow-inner"> <div className="flex justify-between items-center"> <span className="text-[13px] text-slate-400 font-bold uppercase tracking-wider"> (Center of Mass)</span> <span className="text-[11px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-mono font-bold">X, Y, Z Coords</span> </div> <div className="grid grid-cols-3 gap-2.5 mt-1">

                      {['X', 'Y', 'Z'].map((axis, aIdx) => (

                        <div key={axis} className="bg-slate-900 border border-slate-800 rounded-sm p-2 flex flex-col items-center shadow-sm"> <span className="text-[12px] font-extrabold text-secondary-text">{axis}-</span> <span className="text-[14px] font-black font-mono text-slate-100 mt-0.5">

                            {massProps.center_of_mass[aIdx].toFixed(3)} <span className="text-[10px] text-secondary-text font-bold">mm</span> </span> </div>

                      ))}

                    </div> </div>



                  {/* Moment of inertia tensor */}

                  <div className="bg-slate-950/50 rounded border border-slate-800/80 p-3.5 flex flex-col gap-2 shadow-inner"> <span className="text-[13px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800 pb-1.5 flex justify-between items-center"> <span> (Inertia Tensor)</span> <span className="text-[10px] text-secondary-text font-mono">gmm (Density = 1.0)</span> </span> <div className="grid grid-cols-3 gap-1.5 mt-1 font-mono text-[12px] bg-slate-900/50 p-2.5 rounded-sm border border-slate-800/40">

                      {massProps.inertia_matrix.map((row, rIdx) => 

                        row.map((val, cIdx) => (

                          <div key={`${rIdx}-${cIdx}`} className="text-right p-1 font-semibold text-slate-300">

                            {val.toLocaleString(undefined, { maximumFractionDigits: 1 })}

                          </div>

                        ))

                      )}

                    </div> </div> </div>



                {/* Footer Controls */}

                <button

                  onClick={() => {

                    const text = `: ${massProps.volume.toFixed(3)} mm
: ${massProps.surface_area.toFixed(3)} mm
: [${massProps.center_of_mass.map(c => c.toFixed(3)).join(', ')}]
:
${massProps.inertia_matrix.map(r => r.map(v => v.toFixed(1)).join('\t')).join('\n')}`;

                    navigator.clipboard.writeText(text);

                    appAPI.notify('', '');

                  }}

                  className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:from-amber-700 active:to-amber-800 text-slate-950 font-extrabold rounded transition-all shadow-lg flex items-center justify-center gap-1.5 text-[14px] cursor-pointer"

                >

                  <span> </span> <span> (Copy Report)</span> </button> </div> </div>

          )}



          {/*  SolidWorks  (SolidWorks Translator Dialog) */}

          {showTranslatorModal && (

            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[1000] p-4 animate-fade-in"> <div className="w-[460px] bg-slate-900/90 border border-slate-700/60 rounded-3xl p-6 shadow-sm flex flex-col gap-4 text-slate-100 relative overflow-hidden backdrop-blur-xl"> <div className="absolute -top-12 -left-12 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />



                {/* Header */}

                <div className="flex justify-between items-center border-b border-slate-800 pb-3 z-10"> <div className="flex items-center gap-2"> <span className="text-xl"> </span> <span className="text-[16px] font-extrabold tracking-wider uppercase text-blue-400 font-sans">SolidWorks </span> </div> <button

                    onClick={() => setShowTranslatorModal(false)}

                    className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"

                  >

                    

                  </button> </div>



                {/* Guidance Content */}

                <div className="space-y-3.5 z-10 leading-relaxed text-[13px] text-slate-300 font-sans"> <p className="text-slate-200 font-bold border-l-4 border-blue-500 pl-2">

                     SolidWorks Part (.sldprt / .sldasm)

                  </p> <p>

                     SolidWorks 

                  </p> <div className="bg-slate-950/60 p-3.5 rounded border border-slate-800/80 space-y-2"> <span className="text-[13px] font-bold text-slate-100 flex items-center gap-1.5"> <span> </span> <span> </span> </span> <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-400"> <li> SolidWorks </li> <li> <span className="text-slate-200"> (Save As...)</span></li> <li> <span className="text-slate-200 font-mono">STEP (.step / .stp)</span> <span className="text-slate-200 font-mono">IGES (.iges)</span></li> <li> 3D-Builder </li> </ol> </div> </div>



                {/* Actions */}

                <div className="flex gap-3 mt-2 z-10 font-sans"> <button

                    onClick={() => setShowTranslatorModal(false)}

                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-sm font-bold transition-all text-center text-slate-300 text-[13px] cursor-pointer"

                  >

                    

                  </button> <button

                    onClick={async () => {

                      setShowTranslatorModal(false);

                      handleOpen();

                    }}

                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-sm font-bold transition-all shadow-md text-center text-[13px] cursor-pointer"

                  >

                    

                  </button> </div> </div> </div>

          )}

        </section> </div> <StatusBar /> </main>

  );

}

