'use client';

import { useEffect, useCallback } from 'react';
import { useCadStore } from '../store/useCadStore';
import { onFileOpen, onSaveRequest, onNewFile, appAPI, fileAPI } from '../../electron/renderer';

export const useAppIntegrations = (
  loadCadData: (content: string, path: string) => void,
  handleSaveProject: () => void,
  handlePrintToPDF: () => void
) => {
  const {
    isSketchMode,
    setSketchTool,
    setSketchNewChain,
    setSketchNodes,
    setSketchEdges,
    setSketchConstraints,
    setSelectedEntityIds,
    setShortcutBox,
    setPendingFeatureCommand,
    setSelectedTopology,
    setHint,
    sketchNodes,
    sketchEdges,
    sketchConstraints,
    selectedEntityIds,
  } = useCadStore();

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
  }, [loadCadData, handleSaveProject]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (!isSketchMode) return;
      if (document.activeElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

      const key = e.key.toLowerCase();
      if (key === 'l') {
        setSketchTool('SELECT');
      } else if (key === 'a') {
        setSketchTool('ARC');
      } else if (e.key === 'Escape') {
        setSketchNewChain(true);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedEntityIds.length > 0) {
          e.preventDefault();
          const nextNodes = { ...sketchNodes };
          const nextEdges = { ...sketchEdges };
          const nextConstraints = { ...sketchConstraints };
          
          const nodesToDelete = new Set<string>();
          const edgesToDelete = new Set<string>();
          const constraintsToDelete = new Set<string>();

          selectedEntityIds.forEach(id => {
            if (nextNodes[id]) nodesToDelete.add(id);
            if (nextEdges[id]) edgesToDelete.add(id);
            if (nextConstraints[id]) constraintsToDelete.add(id);
          });

          Object.values(nextEdges).forEach((edge: any) => {
            if (edge.nodeIds.some((nid: string) => nodesToDelete.has(nid))) edgesToDelete.add(edge.id);
          });

          Object.values(nextConstraints).forEach((c: any) => {
            if (c.nodeIds?.some((nid: string) => nodesToDelete.has(nid))) constraintsToDelete.add(c.id);
            if (c.edgeIds?.some((eid: string) => edgesToDelete.has(eid))) constraintsToDelete.add(c.id);
          });

          nodesToDelete.forEach(id => delete nextNodes[id]);
          edgesToDelete.forEach(id => delete nextEdges[id]);
          constraintsToDelete.forEach(id => delete nextConstraints[id]);

          setSketchNodes(nextNodes);
          setSketchEdges(nextEdges);
          setSketchConstraints(nextConstraints);
          setSelectedEntityIds([]);
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      (window as any)._lastClientX = e.clientX;
      (window as any)._lastClientY = e.clientY;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && useCadStore.getState().pendingFeatureCommand) {
        if (document.activeElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
        e.preventDefault();
        setPendingFeatureCommand(null);
        setSelectedTopology(null);
        setHint('Ready');
        return;
      }
      if (e.key.toLowerCase() === 's') {
        if (document.activeElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
        e.preventDefault();
        setShortcutBox({
          visible: true,
          x: (window as any)._lastClientX || window.innerWidth / 2,
          y: (window as any)._lastClientY || window.innerHeight / 2
        });
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    isSketchMode, setSketchTool, setSketchNewChain, selectedEntityIds, 
    sketchNodes, sketchEdges, sketchConstraints, setSketchNodes, 
    setSketchEdges, setSketchConstraints, setSelectedEntityIds,
    setShortcutBox, setPendingFeatureCommand, setSelectedTopology, setHint
  ]);
};
