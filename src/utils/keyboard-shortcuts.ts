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
  { key: 'N', ctrl: true, command: 'file.new', description: '新增文件', enabledWhen: () => true, category: 'FILE' },
  { key: 'O', ctrl: true, command: 'file.open', description: '開啟文件', enabledWhen: () => true, category: 'FILE' },
  { key: 'S', ctrl: true, command: 'file.save', description: '儲存文件', enabledWhen: () => true, category: 'FILE' },
  { key: 'S', ctrl: true, shift: true, command: 'file.save_as', description: '另存新檔', enabledWhen: () => true, category: 'FILE' },
  { key: 'E', ctrl: true, command: 'file.export', description: '匯出', enabledWhen: () => true, category: 'FILE' },
  { key: 'P', ctrl: true, command: 'file.print', description: '列印', enabledWhen: () => true, category: 'FILE' },
  { key: 'Close', command: 'file.close', description: '關閉文件', enabledWhen: () => true, category: 'FILE' },

  // ── Edit ──────────────────────────────────────────────
  { key: 'Z', ctrl: true, command: 'edit.undo', description: '復原', enabledWhen: (s: any) => s?.history?.past?.length > 0, category: 'EDIT' },
  { key: 'Y', ctrl: true, command: 'edit.redo', description: '重做', enabledWhen: (s: any) => s?.history?.future?.length > 0, category: 'EDIT' },
  { key: 'Delete', command: 'edit.delete', description: '刪除', enabledWhen: (s: any) => !!s?.selectedId, category: 'EDIT' },
  { key: 'X', ctrl: true, command: 'edit.cut', description: '剪下', enabledWhen: () => true, category: 'EDIT' },
  { key: 'C', ctrl: true, command: 'edit.copy', description: '複製', enabledWhen: () => true, category: 'EDIT' },
  { key: 'V', ctrl: true, command: 'edit.paste', description: '貼上', enabledWhen: () => true, category: 'EDIT' },
  { key: 'A', ctrl: true, command: 'edit.select_all', description: '全選', enabledWhen: () => true, category: 'EDIT' },
  { key: 'F', ctrl: true, shift: true, command: 'edit.find', description: '尋找', enabledWhen: () => true, category: 'EDIT' },

  // ── View ──────────────────────────────────────────────
  { key: 'Tab', command: 'view.standard_front', description: '前視圖', enabledWhen: () => true, category: 'VIEW' },
  { key: 'Tab', shift: true, command: 'view.standard_top', description: '上視圖', enabledWhen: () => true, category: 'VIEW' },
  { key: '1', command: 'view.standard_right', description: '右視圖', enabledWhen: () => true, category: 'VIEW' },
  { key: '2', command: 'view.standard_left', description: '左視圖', enabledWhen: () => true, category: 'VIEW' },
  { key: '3', command: 'view.standard_back', description: '後視圖', enabledWhen: () => true, category: 'VIEW' },
  { key: '4', command: 'view.standard_bottom', description: '底視圖', enabledWhen: () => true, category: 'VIEW' },
  { key: '5', command: 'view.standard_iso', description: '等測視圖', enabledWhen: () => true, category: 'VIEW' },
  { key: 'I', ctrl: true, command: 'view.fit_to_window', description: '縮放到窗口', enabledWhen: () => true, category: 'VIEW' },
  { key: 'R', ctrl: true, command: 'view.rebuild', description: '重建模型', enabledWhen: () => true, category: 'VIEW' },
  { key: 'H', command: 'view.hide_selected', description: '隱藏選取', enabledWhen: () => true, category: 'VIEW' },
  { key: 'U', command: 'view.show_hidden', description: '顯示隱藏項目', enabledWhen: () => true, category: 'VIEW' },
  { key: 'B', ctrl: true, command: 'view.toggle_background', description: '切換背景', enabledWhen: () => true, category: 'VIEW' },
  { key: 'D', ctrl: true, shift: true, command: 'view.display_style', description: '顯示樣式', enabledWhen: () => true, category: 'VIEW' },
  { key: 'F3', command: 'view.toggle_edges', description: '切換邊線顯示', enabledWhen: () => true, category: 'VIEW' },
  { key: 'F5', command: 'view.fullscreen', description: '全螢幕', enabledWhen: () => true, category: 'VIEW' },

  // ── Select ────────────────────────────────────────────
  { key: 'A', ctrl: true, command: 'select.all', description: '全選', enabledWhen: () => true, category: 'SELECT' },
  { key: 'A', ctrl: true, shift: true, command: 'select.none', description: '取消選取', enabledWhen: () => true, category: 'SELECT' },
  { key: 'L', ctrl: true, command: 'select.last', description: '選取最後', enabledWhen: () => true, category: 'SELECT' },
  { key: 'F', ctrl: true, command: 'select.feature', description: '選取特徵', enabledWhen: () => true, category: 'SELECT' },
  { key: 'F', ctrl: true, shift: true, command: 'select.face', description: '選取面', enabledWhen: () => true, category: 'SELECT' },
  { key: 'E', ctrl: true, shift: true, command: 'select.edge', description: '選取邊線', enabledWhen: () => true, category: 'SELECT' },
  { key: 'N', ctrl: true, shift: true, command: 'select.vertex', description: '選取頂點', enabledWhen: () => true, category: 'SELECT' },
  { key: 'Escape', command: 'select.clear', description: '清除選取', enabledWhen: () => true, category: 'SELECT' },

  // ── Sketch ────────────────────────────────────────────
  { key: 'S', ctrl: true, command: 'sketch.save', description: '儲存草圖', enabledWhen: (s: any) => s?.isSketchMode, category: 'SKETCH' },
  { key: 'Enter', command: 'sketch.exit', description: '退出草圖', enabledWhen: (s: any) => s?.isSketchMode, category: 'SKETCH' },
  { key: 'X', command: 'sketch.trim', description: '修剪實體', enabledWhen: (s: any) => s?.isSketchMode, category: 'SKETCH' },
  { key: 'E', command: 'sketch.extend', description: '延伸實體', enabledWhen: (s: any) => s?.isSketchMode, category: 'SKETCH' },
  { key: 'O', command: 'sketch.offset', description: '偏移實體', enabledWhen: (s: any) => s?.isSketchMode, category: 'SKETCH' },
  { key: 'M', command: 'sketch.mirror', description: '鏡射實體', enabledWhen: (s: any) => s?.isSketchMode, category: 'SKETCH' },
  { key: 'L', command: 'sketch.line', description: '直線', enabledWhen: (s: any) => s?.isSketchMode, category: 'SKETCH' },
  { key: 'C', command: 'sketch.circle', description: '圓', enabledWhen: (s: any) => s?.isSketchMode, category: 'SKETCH' },
  { key: 'R', command: 'sketch.rectangle', description: '矩形', enabledWhen: (s: any) => s?.isSketchMode, category: 'SKETCH' },
  { key: 'A', command: 'sketch.arc', description: '圓弧', enabledWhen: (s: any) => s?.isSketchMode, category: 'SKETCH' },
  { key: 'D', command: 'sketch.dimension', description: '智慧尺寸', enabledWhen: (s: any) => s?.isSketchMode, category: 'SKETCH' },
  { key: 'T', command: 'sketch.text', description: '文字', enabledWhen: (s: any) => s?.isSketchMode, category: 'SKETCH' },
  { key: 'Space', command: 'sketch.construction_line', description: '構造線', enabledWhen: (s: any) => s?.isSketchMode, category: 'SKETCH' },

  // ── Feature ───────────────────────────────────────────
  { key: 'E', ctrl: true, shift: true, command: 'feature.extrude', description: '拉伸凸台/基座', enabledWhen: (s: any) => s?.isSketchMode, category: 'FEATURE' },
  { key: 'V', ctrl: true, shift: true, command: 'feature.revolve', description: '旋轉凸台/基座', enabledWhen: (s: any) => s?.isSketchMode, category: 'FEATURE' },
  { key: 'F', command: 'feature.fillet', description: '圓角', enabledWhen: (s: any) => !s?.isSketchMode, category: 'FEATURE' },
  { key: 'C', command: 'feature.chamfer', description: '斜角', enabledWhen: (s: any) => !s?.isSketchMode, category: 'FEATURE' },
  { key: 'H', command: 'feature.shell', description: '抽殼', enabledWhen: (s: any) => !s?.isSketchMode, category: 'FEATURE' },
  { key: 'D', command: 'feature.draft', description: '拔模', enabledWhen: (s: any) => !s?.isSketchMode, category: 'FEATURE' },
  { key: 'P', command: 'feature.pattern_linear', description: '線性陣列', enabledWhen: (s: any) => !s?.isSketchMode, category: 'FEATURE' },
  { key: 'U', command: 'feature.pattern_circular', description: '圓形陣列', enabledWhen: (s: any) => !s?.isSketchMode, category: 'FEATURE' },
  { key: 'J', command: 'feature.mirror', description: '鏡射特徵', enabledWhen: (s: any) => !s?.isSketchMode, category: 'FEATURE' },
  { key: 'W', command: 'feature.hole_wizard', description: '異型孔向导', enabledWhen: (s: any) => !s?.isSketchMode, category: 'FEATURE' },
  { key: 'K', command: 'feature.sweep', description: '掃描', enabledWhen: (s: any) => !s?.isSketchMode, category: 'FEATURE' },
  { key: 'L', ctrl: true, command: 'feature.loft', description: '放樣', enabledWhen: (s: any) => !s?.isSketchMode, category: 'FEATURE' },
  { key: 'G', command: 'feature.reference_plane', description: '基準面', enabledWhen: () => true, category: 'FEATURE' },
  { key: 'Q', command: 'feature.reference_axis', description: '基準軸', enabledWhen: () => true, category: 'FEATURE' },
  { key: 'Y', command: 'feature.reference_point', description: '基準點', enabledWhen: () => true, category: 'FEATURE' },

  // ── Assembly ──────────────────────────────────────────
  { key: 'I', ctrl: true, command: 'asm.insert_component', description: '插入零組件', enabledWhen: (s: any) => s?.activeTab === 'ASSEMBLY', category: 'ASSEMBLY' },
  { key: 'M', ctrl: true, command: 'asm.mate', description: '配合', enabledWhen: (s: any) => s?.activeTab === 'ASSEMBLY', category: 'ASSEMBLY' },
  { key: 'X', ctrl: true, command: 'asm.explode', description: '爆炸視圖', enabledWhen: (s: any) => s?.activeTab === 'ASSEMBLY', category: 'ASSEMBLY' },
  { key: 'T', ctrl: true, command: 'asm.interference', description: '干涉檢查', enabledWhen: (s: any) => s?.activeTab === 'ASSEMBLY', category: 'ASSEMBLY' },

  // ── Drawing ───────────────────────────────────────────
  { key: 'V', command: 'drw.standard_views', description: '標準視圖', enabledWhen: (s: any) => s?.activeTab === 'DRAWING', category: 'DRAWING' },
  { key: 'S', command: 'drw.section_view', description: '剖面視圖', enabledWhen: (s: any) => s?.activeTab === 'DRAWING', category: 'DRAWING' },
  { key: 'X', command: 'drw.detail_view', description: '詳細視圖', enabledWhen: (s: any) => s?.activeTab === 'DRAWING', category: 'DRAWING' },
  { key: 'Z', command: 'drw.dimension', description: '尺寸標註', enabledWhen: (s: any) => s?.activeTab === 'DRAWING', category: 'DRAWING' },

  // ── System ────────────────────────────────────────────
  { key: 'F2', command: 'system.rename', description: '重新命名', enabledWhen: () => true, category: 'SYSTEM' },
  { key: 'F4', command: 'system.properties', description: '屬性', enabledWhen: () => true, category: 'SYSTEM' },
  { key: 'F8', command: 'system.grid_toggle', description: '切換網格', enabledWhen: () => true, category: 'SYSTEM' },
  { key: 'F9', command: 'system.snap_toggle', description: '切換捕捉', enabledWhen: () => true, category: 'SYSTEM' },
  { key: 'F1', command: 'system.help', description: '說明', enabledWhen: () => true, category: 'SYSTEM' },
  { key: 'F11', command: 'system.measure', description: '測量', enabledWhen: () => true, category: 'SYSTEM' },
  { key: 'F12', command: 'system.mass_properties', description: '質量屬性', enabledWhen: () => true, category: 'SYSTEM' },
  { key: 'ScrollLock', command: 'system.pause', description: '暫停/繼續', enabledWhen: () => true, category: 'SYSTEM' },
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
