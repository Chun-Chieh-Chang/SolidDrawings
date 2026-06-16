'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useCadStore } from '../store/useCadStore';
import { KEYBOARD_SHORTCUTS } from '../utils/keyboard-shortcuts';
import { fileAPI } from '../../electron/renderer';

export const useKeyboardShortcuts = () => {
  const storeRef = useRef(useCadStore.getState());

  useEffect(() => {
    const unsubscribe = useCadStore.subscribe((state) => {
      storeRef.current = state;
    });
    return unsubscribe;
  }, []);

  const executeCommand = useCallback((command: string) => {
    const state = storeRef.current;
    const {
      undo, redo, saveSnapshot, features, selectedId, removeFeature, setSelectedId,
      setSelectedTopology, setEditingFeatureId, setSmartDimensionActive,
      setSketchNodes, setSketchEdges, setSketchConstraints, setPendingFeatureCommand,
      setActiveConfiguration, addConfiguration, setShowExportModal,
      setInterferenceActive, setViewOrientationSelectorVisible, setActivePlane,
      setSketchTool, setMeasurementMode, measurementMode, triggerCameraNormal,
      viewportDisplayMode, setViewportDisplayMode, setMode, setActiveTab,
      setProjectName, gridSnap, setGridSnap,
    } = state;

    switch (command) {
      // ── File ────────────────────────────────────────────
      case 'file.new':
        saveSnapshot();
        setSketchNodes({});
        setSketchEdges({});
        setSketchConstraints({});
        setMode('PART');
        setActiveTab('FEATURES');
        setMeasurementMode('NONE');
        setPendingFeatureCommand(null);
        setSelectedId(null);
        setSelectedTopology(null);
        setEditingFeatureId(null);
        setSmartDimensionActive(false);
        setInterferenceActive(false);
        setViewOrientationSelectorVisible(false);
        (window as any).__resetSketchSession?.();
        break;

      case 'file.open':
        fileAPI.open().then((r: any) => {
          if (r) {
            fileAPI.read(r.path).then((res: any) => {
              if (res.success && res.content) {
                const event = new CustomEvent('3db-load-cad-data', { detail: { content: res.content, path: r.path } });
                window.dispatchEvent(event);
              }
            });
          }
        });
        break;

      case 'file.save': {
        const event = new CustomEvent('3db-save-project', { detail: {} });
        window.dispatchEvent(event);
        break;
      }

      case 'file.save_as': {
        const event = new CustomEvent('3db-save-project-as', { detail: {} });
        window.dispatchEvent(event);
        break;
      }

      case 'file.export':
        setShowExportModal(true);
        break;

      case 'file.print':
        const eventPrint = new CustomEvent('3db-print-pdf', { detail: {} });
        window.dispatchEvent(eventPrint);
        break;

      case 'file.close':
        break;

      // ── Edit ────────────────────────────────────────────
      case 'edit.undo':
        undo();
        break;

      case 'edit.redo':
        redo();
        break;

      case 'edit.delete': {
        if (selectedId) {
          saveSnapshot();
          removeFeature(selectedId);
          setSelectedId(null);
        }
        break;
      }

      case 'edit.cut':
      case 'edit.copy':
      case 'edit.paste':
        break;

      case 'edit.select_all':
        break;

      case 'edit.find':
        break;

      // ── View ────────────────────────────────────────────
      case 'view.standard_front':
        triggerCameraNormal();
        setActivePlane('FRONT');
        break;

      case 'view.standard_top':
        triggerCameraNormal();
        setActivePlane('TOP');
        break;

      case 'view.standard_right':
        triggerCameraNormal();
        setActivePlane('RIGHT');
        break;

      case 'view.standard_left':
        setViewOrientationSelectorVisible(true);
        break;

      case 'view.standard_back':
        setViewOrientationSelectorVisible(true);
        break;

      case 'view.standard_bottom':
        setViewOrientationSelectorVisible(true);
        break;

      case 'view.standard_iso':
        setViewOrientationSelectorVisible(true);
        break;

      case 'view.fit_to_window':
        setViewOrientationSelectorVisible(true);
        break;

      case 'view.rebuild': {
        const eventRebuild = new CustomEvent('3db-rebuild', { detail: {} });
        window.dispatchEvent(eventRebuild);
        break;
      }

      case 'view.hide_selected':
        break;

      case 'view.show_hidden':
        break;

      case 'view.toggle_background':
        break;

      case 'view.display_style': {
        const modes: Array<'SHADED' | 'SHADED_EDGES' | 'WIREFRAME'> = ['SHADED', 'SHADED_EDGES', 'WIREFRAME'];
        const current = viewportDisplayMode;
        const nextIndex = (modes.indexOf(current) + 1) % modes.length;
        setViewportDisplayMode(modes[nextIndex]);
        break;
      }

      case 'view.toggle_edges':
        break;

      case 'view.fullscreen':
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          document.documentElement.requestFullscreen().catch(() => {});
        }
        break;

      // ── Select ────────────────────────────────────────────
      case 'select.all':
        break;

      case 'select.none':
        setSelectedId(null);
        setSelectedTopology(null);
        break;

      case 'select.last':
        break;

      case 'select.feature':
        break;

      case 'select.face':
        break;

      case 'select.edge':
        break;

      case 'select.vertex':
        break;

      case 'select.clear':
        setSelectedId(null);
        setSelectedTopology(null);
        break;

      // ── Sketch ────────────────────────────────────────────
      case 'sketch.save':
        (window as any).__handleSaveSketchOnly?.();
        break;

      case 'sketch.exit':
        (window as any).__handleExitAndExtrude?.();
        break;

      case 'sketch.trim':
        break;

      case 'sketch.extend':
        break;

      case 'sketch.offset':
        (window as any).__handleOffsetEntities?.();
        break;

      case 'sketch.mirror':
        break;

      case 'sketch.line':
        setSketchTool('LINE');
        break;

      case 'sketch.circle':
        setSketchTool('CIRCLE');
        break;

      case 'sketch.rectangle':
        setSketchTool('RECTANGLE');
        break;

      case 'sketch.arc':
        setSketchTool('ARC');
        break;

      case 'sketch.dimension':
        setSmartDimensionActive(true);
        break;

      case 'sketch.text':
        break;

      case 'sketch.construction_line':
        break;

      // ── Feature ───────────────────────────────────────────
      case 'feature.extrude':
        (window as any).__handleExitAndExtrude?.();
        break;

      case 'feature.revolve':
        (window as any).__handleRevolveFromSketch?.();
        break;

      case 'feature.fillet':
        if (features.length > 0) {
          setPendingFeatureCommand('FILLET');
        }
        break;

      case 'feature.chamfer':
        if (features.length > 0) {
          setPendingFeatureCommand('CHAMFER');
        }
        break;

      case 'feature.shell':
        if (features.length > 0) {
          setPendingFeatureCommand('SHELL');
        }
        break;

      case 'feature.draft':
        if (features.length > 0) {
          setPendingFeatureCommand('DRAFT');
        }
        break;

      case 'feature.pattern_linear':
        if (features.length > 0) {
          setPendingFeatureCommand('PATTERN');
        }
        break;

      case 'feature.pattern_circular':
        if (features.length > 0) {
          setPendingFeatureCommand('PATTERN');
        }
        break;

      case 'feature.mirror':
        break;

      case 'feature.hole_wizard':
        if (features.length > 0) {
          setPendingFeatureCommand('HOLE_WIZARD');
        }
        break;

      case 'feature.sweep':
        break;

      case 'feature.loft':
        break;

      case 'feature.reference_plane':
        setPendingFeatureCommand('REFERENCE_PLANE');
        break;

      case 'feature.reference_axis':
        break;

      case 'feature.reference_point':
        setPendingFeatureCommand('REFERENCE_POINT');
        break;

      // ── Assembly ──────────────────────────────────────────
      case 'asm.insert_component':
        break;

      case 'asm.mate':
        break;

      case 'asm.explode':
        setViewOrientationSelectorVisible(true);
        break;

      case 'asm.interference':
        setInterferenceActive(true);
        break;

      // ── Drawing ───────────────────────────────────────────
      case 'drw.standard_views':
        break;

      case 'drw.section_view':
        break;

      case 'drw.detail_view':
        break;

      case 'drw.dimension':
        break;

      // ── System ────────────────────────────────────────────
      case 'system.rename':
        const name = prompt('Rename project:', state.projectName);
        if (name) setProjectName(name);
        break;

      case 'system.properties':
        break;

      case 'system.grid_toggle':
        break;

      case 'system.snap_toggle':
        setGridSnap(!gridSnap);
        break;

      case 'system.help':
        break;

      case 'system.measure':
        setMeasurementMode(measurementMode === 'DISTANCE' ? 'NONE' : 'DISTANCE');
        break;

      case 'system.mass_properties':
        break;

      case 'system.pause':
        break;

      default:
        break;
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const state = storeRef.current;

      for (const shortcut of KEYBOARD_SHORTCUTS) {
        const keyMatch = e.key === shortcut.key || (shortcut.key === 'Space' && e.code === 'Space');
        const ctrlMatch = shortcut.ctrl ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey;
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
        const altMatch = shortcut.alt ? e.altKey : !e.altKey;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          if (shortcut.enabledWhen && !shortcut.enabledWhen(state)) {
            continue;
          }
          e.preventDefault();
          e.stopPropagation();
          executeCommand(shortcut.command);
          return;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [executeCommand]);

  return { executeCommand };
};
