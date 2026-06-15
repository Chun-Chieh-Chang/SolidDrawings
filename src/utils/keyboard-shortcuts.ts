// SOLIDWORKS 2010 Compatible Keyboard Shortcuts
// Full mapping: SW 2010 shortcuts to 3D-Builder actions

import { useCadStore } from '../store/useCadStore';

export interface ShortcutDef {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

export const SHORTCUTS: ShortcutDef[] = [
  // ═══ File Operations ═══
  { key: 'N', ctrl: true, action: () => { const h = (window as any).__handleFileNew; if (h) h(); }, description: 'New Document' },
  { key: 'O', ctrl: true, action: () => { const h = (window as any).__handleFileOpen; if (h) h(); }, description: 'Open Document' },
  { key: 'S', ctrl: true, action: () => { const h = (window as any).__handleFileSave; if (h) h(); }, description: 'Save' },
  { key: 'S', ctrl: true, shift: true, action: () => { const h = (window as any).__handleFileSaveAs; if (h) h(); }, description: 'Save As' },
  { key: 'E', ctrl: true, action: () => { const h = (window as any).__handleExport; if (h) h(); }, description: 'Export' },

  // ═══ Edit Operations ═══
  { key: 'Z', ctrl: true, action: () => {
    const store = useCadStore.getState();
    if (store.undoStack && store.undoStack.length > 0) {
      const prev = store.undoStack.pop()!;
      if (store.redoStack) store.redoStack.push(store.snapshot);
      useCadStore.setState(prev);
    }
  }, description: 'Undo' },
  { key: 'Y', ctrl: true, action: () => {
    const store = useCadStore.getState();
    if (store.redoStack && store.redoStack.length > 0) {
      const next = store.redoStack.pop()!;
      if (store.undoStack) store.undoStack.push(store.snapshot);
      useCadStore.setState(next);
    }
  }, description: 'Redo' },
  { key: 'X', ctrl: true, action: () => { useCadStore.getState().pushToast('Cut not implemented.', 'info'); }, description: 'Cut' },
  { key: 'C', ctrl: true, action: () => { useCadStore.getState().pushToast('Copy not implemented.', 'info'); }, description: 'Copy' },
  { key: 'V', ctrl: true, action: () => { useCadStore.getState().pushToast('Paste not implemented.', 'info'); }, description: 'Paste' },
  { key: 'Delete', action: () => {
    const store = useCadStore.getState();
    if (store.selectedId && store.removeFeature) {
      store.removeFeature(store.selectedId);
      const rebuild = (window as any).__handleRebuild;
      if (rebuild) setTimeout(rebuild, 10);
    }
  }, description: 'Delete Selected' },

  // ═══ Selection ═══
  { key: 'A', ctrl: true, action: () => {
    const store = useCadStore.getState();
    store.pushToast('Select All not implemented.', 'info');
  }, description: 'Select All' },
  { key: 'Escape', action: () => {
    const store = useCadStore.getState();
    store.setSketchMode(false);
    store.setSketchTool('SELECT');
    store.setPendingFeatureCommand(null);
    store.setSelectedTopology(null);
    store.setContextMenu(null);
  }, description: 'Cancel Current Command' },
  { key: 'Space', action: () => {
    const h = (window as any).__handleFileSave;
    if (h) h();
  }, description: 'Quick Save' },
  { key: 'Tab', action: () => {
    const store = useCadStore.getState();
    store.pushToast('Cycle Selections not implemented.', 'info');
  }, description: 'Cycle Selections' },

  // ═══ View / Navigation ═══
  { key: 'F10', action: () => {
    const store = useCadStore.getState();
    if (store.controls) {
      store.controls.object.position.set(150, 150, 150);
      store.controls.target.set(0, 0, 0);
      store.controls.update();
    }
  }, description: 'Toggle Isometric View' },
  { key: 'F', action: () => {
    const store = useCadStore.getState();
    if (store.controls) {
      store.controls.reset();
      store.controls.object.position.set(150, 150, 150);
      store.controls.target.set(0, 0, 0);
      store.controls.update();
    }
  }, description: 'Zoom to Fit' },
  { key: 'F8', action: () => {
    const store = useCadStore.getState();
    store.pushToast('Toggle Angle not implemented.', 'info');
  }, description: 'Toggle Angle View' },

  // ═══ Feature / Sketch ═══
  { key: 'F2', action: () => {
    const store = useCadStore.getState();
    store.pushToast('Edit Selected not implemented.', 'info');
  }, description: 'Edit Selected Feature' },
  { key: 'M', action: () => {
    const store = useCadStore.getState();
    store.setMeasurementMode('DISTANCE');
    store.setMeasurementPoints([]);
    store.setMeasurementResults(null);
  }, description: 'Measure Tool' },

  // ═══ Help ═══
  { key: 'F1', action: () => {
    useCadStore.getState().pushToast('SOLIDWORKS Help not implemented.', 'info');
  }, description: 'Open Help' },
];

export function setupKeyboardShortcuts() {
  const handleKeyDown = (e: KeyboardEvent) => {
    const matched = SHORTCUTS.find(s => {
      return s.key === e.key.toUpperCase() &&
        (!!s.ctrl === e.ctrlKey) &&
        (!!s.shift === e.shiftKey) &&
        (!!s.alt === e.altKey);
    });

    if (matched) {
      e.preventDefault();
      matched.action();
    }
  };

  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}
