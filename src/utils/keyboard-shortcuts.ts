export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  command: string;
  description: string;
  enabledWhen?: (store: any) => boolean;
  category: 'FILE' | 'EDIT' | 'VIEW' | 'SELECT' | 'SKETCH' | 'FEATURE' | 'ASSEMBLY' | 'DRAWING' | 'SYSTEM';
}

export const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  // ── File ──────────────────────────────────────────────
  { key: 'N', ctrl: true, command: 'file.new', description: 'New Document', enabledWhen: () => true, category: 'FILE' },
  { key: 'O', ctrl: true, command: 'file.open', description: 'Open Document', enabledWhen: () => true, category: 'FILE' },
  { key: 'S', ctrl: true, command: 'file.save', description: 'Save Document', enabledWhen: () => true, category: 'FILE' },
  { key: 'S', ctrl: true, shift: true, command: 'file.save_as', description: 'Save As', enabledWhen: () => true, category: 'FILE' },
  { key: 'E', ctrl: true, command: 'file.export', description: 'Export', enabledWhen: () => true, category: 'FILE' },
  { key: 'P', ctrl: true, command: 'file.print', description: 'Print', enabledWhen: () => true, category: 'FILE' },
  { key: 'Close', command: 'file.close', description: 'Close Document', enabledWhen: () => true, category: 'FILE' },

  // ── Edit ──────────────────────────────────────────────
  { key: 'Z', ctrl: true, command: 'edit.undo', description: 'Undo', enabledWhen: (s: any) => s?.history?.past?.length > 0, category: 'EDIT' },
  { key: 'Y', ctrl: true, command: 'edit.redo', description: 'Redo', enabledWhen: (s: any) => s?.history?.future?.length > 0, category: 'EDIT' },
  { key: 'Delete', command: 'edit.delete', description: 'Delete', enabledWhen: (s: any) => !!s?.selectedId, category: 'EDIT' },
  { key: 'X', ctrl: true, command: 'edit.cut', description: 'Cut', enabledWhen: () => true, category: 'EDIT' },
  { key: 'C', ctrl: true, command: 'edit.copy', description: 'Copy', enabledWhen: () => true, category: 'EDIT' },
  { key: 'V', ctrl: true, command: 'edit.paste', description: 'Paste', enabledWhen: () => true, category: 'EDIT' },
  { key: 'A', ctrl: true, command: 'edit.select_all', description: 'Select All', enabledWhen: () => true, category: 'EDIT' },
  { key: 'F', ctrl: true, shift: true, command: 'edit.find', description: 'Find', enabledWhen: () => true, category: 'EDIT' },

  // ── View ──────────────────────────────────────────────
  { key: 'Tab', command: 'view.standard_front', description: 'Front View', enabledWhen: () => true, category: 'VIEW' },
  { key: 'Tab', shift: true, command: 'view.standard_top', description: 'Top View', enabledWhen: () => true, category: 'VIEW' },
  { key: '1', command: 'view.standard_right', description: 'Right View', enabledWhen: () => true, category: 'VIEW' },
  { key: '2', command: 'view.standard_left', description: 'Left View', enabledWhen: () => true, category: 'VIEW' },
  { key: '3', command: 'view.standard_back', description: 'Back View', enabledWhen: () => true, category: 'VIEW' },
  { key: '4', command: 'view.standard_bottom', description: 'Bottom View', enabledWhen: () => true, category: 'VIEW' },
  { key: '5', command: 'view.standard_iso', description: 'Iso View', enabledWhen: () => true, category: 'VIEW' },
  { key: 'I', ctrl: true, command: 'view.fit_to_window', description: 'Fit to Window', enabledWhen: () => true, category: 'VIEW' },
  { key: 'R', ctrl: true, command: 'view.rebuild', description: 'Rebuild Model', enabledWhen: () => true, category: 'VIEW' },
  { key: 'H', command: 'view.hide_selected', description: 'Hide Selected', enabledWhen: () => true, category: 'VIEW' },
  { key: 'U', command: 'view.show_hidden', description: 'Show Hidden', enabledWhen: () => true, category: 'VIEW' },
  { key: 'B', ctrl: true, command: 'view.toggle_background', description: 'Toggle Background', enabledWhen: () => true, category: 'VIEW' },
  { key: 'D', ctrl: true, shift: true, command: 'view.display_style', description: 'Display Style', enabledWhen: () => true, category: 'VIEW' },
  { key: 'F3', command: 'view.toggle_edges', description: 'Toggle Edges', enabledWhen: () => true, category: 'VIEW' },
  { key: 'F5', command: 'view.fullscreen', description: 'Fullscreen', enabledWhen: () => true, category: 'VIEW' },

  // ── Select ────────────────────────────────────────────
  { key: 'A', ctrl: true, command: 'select.all', description: 'Select All', enabledWhen: () => true, category: 'SELECT' },
  { key: 'A', ctrl: true, shift: true, command: 'select.none', description: 'Deselect All', enabledWhen: () => true, category: 'SELECT' },
  { key: 'L', ctrl: true, command: 'select.last', description: 'Select Last', enabledWhen: () => true, category: 'SELECT' },
  { key: 'F', ctrl: true, command: 'select.feature', description: 'Select Feature', enabledWhen: () => true, category: 'SELECT' },
  { key: 'F', ctrl: true, shift: true, command: 'select.face', description: 'Select Face', enabledWhen: () => true, category: 'SELECT' },
  { key: 'E', ctrl: true, shift: true, command: 'select.edge', description: 'Select Edge', enabledWhen: () => true, category: 'SELECT' },
  { key: 'N', ctrl: true, shift: true, command: 'select.vertex', description: 'Select Vertex', enabledWhen: () => true, category: 'SELECT' },
  { key: 'Escape', command: 'select.clear', description: 'Clear Selection', enabledWhen: () => true, category: 'SELECT' },

  // ── Sketch ────────────────────────────────────────────
  { key: 'S', ctrl: true, command: 'sketch.save', description: 'Save Sketch', enabledWhen: (s: any) => s?.isSketchMode, category: 'SKETCH' },
  { key: 'Enter', command: 'sketch.exit', description: 'Exit Sketch', enabledWhen: (s: any) => s?.isSketchMode, category: 'SKETCH' },
  { key: 'X', command: 'sketch.trim', description: 'Trim Entity', enabledWhen: (s: any) => s?.isSketchMode, category: 'SKETCH' },
  { key: 'E', command: 'sketch.extend', description: 'Extend Entity', enabledWhen: (s: any) => s?.isSketchMode, category: 'SKETCH' },
  { key: 'O', command: 'sketch.offset', description: 'Offset Entity', enabledWhen: (s: any) => s?.isSketchMode, category: 'SKETCH' },
  { key: 'M', command: 'sketch.mirror', description: 'Mirror Entity', enabledWhen: (s: any) => s?.isSketchMode, category: 'SKETCH' },
  { key: 'L', command: 'sketch.line', description: 'Line', enabledWhen: (s: any) => s?.isSketchMode, category: 'SKETCH' },
  { key: 'C', command: 'sketch.circle', description: 'Circle', enabledWhen: (s: any) => s?.isSketchMode, category: 'SKETCH' },
  { key: 'R', command: 'sketch.rectangle', description: 'Rectangle', enabledWhen: (s: any) => s?.isSketchMode, category: 'SKETCH' },
  { key: 'A', command: 'sketch.arc', description: 'Arc', enabledWhen: (s: any) => s?.isSketchMode, category: 'SKETCH' },
  { key: 'D', command: 'sketch.dimension', description: 'Smart Dimension', enabledWhen: (s: any) => s?.isSketchMode, category: 'SKETCH' },
  { key: 'T', command: 'sketch.text', description: 'Text', enabledWhen: (s: any) => s?.isSketchMode, category: 'SKETCH' },
  { key: 'Space', command: 'sketch.construction_line', description: 'Construction Line', enabledWhen: (s: any) => s?.isSketchMode, category: 'SKETCH' },

  // ── Feature ───────────────────────────────────────────
  { key: 'E', ctrl: true, shift: true, command: 'feature.extrude', description: 'Extruded Boss/Base', enabledWhen: (s: any) => s?.isSketchMode, category: 'FEATURE' },
  { key: 'V', ctrl: true, shift: true, command: 'feature.revolve', description: 'Revolved Boss/Base', enabledWhen: (s: any) => s?.isSketchMode, category: 'FEATURE' },
  { key: 'F', command: 'feature.fillet', description: 'Fillet', enabledWhen: (s: any) => !s?.isSketchMode, category: 'FEATURE' },
  { key: 'C', command: 'feature.chamfer', description: 'Chamfer', enabledWhen: (s: any) => !s?.isSketchMode, category: 'FEATURE' },
  { key: 'H', command: 'feature.shell', description: 'Shell', enabledWhen: (s: any) => !s?.isSketchMode, category: 'FEATURE' },
  { key: 'D', command: 'feature.draft', description: 'Draft', enabledWhen: (s: any) => !s?.isSketchMode, category: 'FEATURE' },
  { key: 'P', command: 'feature.pattern_linear', description: 'Linear Pattern', enabledWhen: (s: any) => !s?.isSketchMode, category: 'FEATURE' },
  { key: 'U', command: 'feature.pattern_circular', description: 'Circular Pattern', enabledWhen: (s: any) => !s?.isSketchMode, category: 'FEATURE' },
  { key: 'J', command: 'feature.mirror', description: 'Mirror Feature', enabledWhen: (s: any) => !s?.isSketchMode, category: 'FEATURE' },
  { key: 'W', command: 'feature.hole_wizard', description: 'Hole Wizard', enabledWhen: (s: any) => !s?.isSketchMode, category: 'FEATURE' },
  { key: 'K', command: 'feature.sweep', description: 'Sweep', enabledWhen: (s: any) => !s?.isSketchMode, category: 'FEATURE' },
  { key: 'L', ctrl: true, command: 'feature.loft', description: 'Loft', enabledWhen: (s: any) => !s?.isSketchMode, category: 'FEATURE' },
  { key: 'G', command: 'feature.reference_plane', description: 'Reference Plane', enabledWhen: () => true, category: 'FEATURE' },
  { key: 'Q', command: 'feature.reference_axis', description: 'Reference Axis', enabledWhen: () => true, category: 'FEATURE' },
  { key: 'Y', command: 'feature.reference_point', description: 'Reference Point', enabledWhen: () => true, category: 'FEATURE' },

  // ── Assembly ──────────────────────────────────────────
  { key: 'I', ctrl: true, command: 'asm.insert_component', description: 'Insert Component', enabledWhen: (s: any) => s?.activeTab === 'ASSEMBLY', category: 'ASSEMBLY' },
  { key: 'M', ctrl: true, command: 'asm.mate', description: 'Mate', enabledWhen: (s: any) => s?.activeTab === 'ASSEMBLY', category: 'ASSEMBLY' },
  { key: 'X', ctrl: true, command: 'asm.explode', description: 'Exploded View', enabledWhen: (s: any) => s?.activeTab === 'ASSEMBLY', category: 'ASSEMBLY' },
  { key: 'T', ctrl: true, command: 'asm.interference', description: 'Interference Check', enabledWhen: (s: any) => s?.activeTab === 'ASSEMBLY', category: 'ASSEMBLY' },

  // ── Drawing ───────────────────────────────────────────
  { key: 'V', command: 'drw.standard_views', description: 'Standard Views', enabledWhen: (s: any) => s?.activeTab === 'DRAWING', category: 'DRAWING' },
  { key: 'S', command: 'drw.section_view', description: 'Section View', enabledWhen: (s: any) => s?.activeTab === 'DRAWING', category: 'DRAWING' },
  { key: 'X', command: 'drw.detail_view', description: 'Detail View', enabledWhen: (s: any) => s?.activeTab === 'DRAWING', category: 'DRAWING' },
  { key: 'Z', command: 'drw.dimension', description: 'Dimension', enabledWhen: (s: any) => s?.activeTab === 'DRAWING', category: 'DRAWING' },

  // ── System ────────────────────────────────────────────
  { key: 'F2', command: 'system.rename', description: 'Rename', enabledWhen: () => true, category: 'SYSTEM' },
  { key: 'F4', command: 'system.properties', description: 'Properties', enabledWhen: () => true, category: 'SYSTEM' },
  { key: 'F8', command: 'system.grid_toggle', description: 'Toggle Grid', enabledWhen: () => true, category: 'SYSTEM' },
  { key: 'F9', command: 'system.snap_toggle', description: 'Toggle Snap', enabledWhen: () => true, category: 'SYSTEM' },
  { key: 'F1', command: 'system.help', description: 'Help', enabledWhen: () => true, category: 'SYSTEM' },
  { key: 'F11', command: 'system.measure', description: 'Measure', enabledWhen: () => true, category: 'SYSTEM' },
  { key: 'F12', command: 'system.mass_properties', description: 'Mass Properties', enabledWhen: () => true, category: 'SYSTEM' },
  { key: 'ScrollLock', command: 'system.pause', description: 'Pause/Resume', enabledWhen: () => true, category: 'SYSTEM' },
];

export const SHORTCUT_CATEGORIES: Record<string, { label: string; order: number }> = {
  FILE: { label: 'File', order: 0 },
  EDIT: { label: 'Edit', order: 1 },
  VIEW: { label: 'View', order: 2 },
  SELECT: { label: 'Select', order: 3 },
  SKETCH: { label: 'Sketch', order: 4 },
  FEATURE: { label: 'Feature', order: 5 },
  ASSEMBLY: { label: 'Assembly', order: 6 },
  DRAWING: { label: 'Drawing', order: 7 },
  SYSTEM: { label: 'System', order: 8 },
};

export function formatKeyCombo(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];
  if (shortcut.ctrl) parts.push('Ctrl');
  if (shortcut.shift) parts.push('Shift');
  if (shortcut.alt) parts.push('Alt');
  if (shortcut.key === 'Space') parts.push('Space');
  else if (shortcut.key === 'Escape') parts.push('Esc');
  else if (shortcut.key === 'Delete') parts.push('Del');
  else if (shortcut.key === 'Close') parts.push('Close');
  else parts.push(shortcut.key);
  return parts.join(' + ');
}

export function groupShortcutsByCategory(shortcuts: KeyboardShortcut[]): Record<string, KeyboardShortcut[]> {
  const groups: Record<string, KeyboardShortcut[]> = {};
  for (const sc of shortcuts) {
    const cat = sc.category || 'SYSTEM';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(sc);
  }
  return groups;
}
