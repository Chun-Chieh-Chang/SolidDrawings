import type { DrawingSheetData, DrawingSheetViewData } from './types';

export type DrawingSlice = {
  drawingSheets: DrawingSheetData[];
  activeSheetId: string;
  setDrawingSheets: (sheets: DrawingSheetData[]) => void;
  addDrawingSheet: (name: string) => void;
  deleteDrawingSheet: (id: string) => void;
  renameDrawingSheet: (id: string, name: string) => void;
  setActiveSheet: (id: string) => void;
  updateViewPosition: (sheetId: string, viewId: string, position: { x: number; y: number; w: number; h: number }) => void;
  updateViewScale: (sheetId: string, viewId: string, scale: string) => void;
  addViewToSheet: (viewType: 'FRONT' | 'TOP' | 'RIGHT' | 'ISO' | 'SECTION', sheetId?: string, parentViewId?: string) => void;
  removeViewFromSheet: (sheetId: string, viewId: string) => void;
  updateViewTitle: (sheetId: string, viewId: string, title: string) => void;
  toggleViewDimensions: (sheetId: string, viewId: string) => void;
};

export const createDrawingState = (set: any, get: any) => ({
  drawingSheets: [
    {
      id: 'sheet-1',
      name: 'Sheet 1',
      views: [
        { id: 'view-front', type: 'FRONT', title: 'Front Elevation (1:1)', position: { x: 0, y: 0, w: 500, h: 350 }, scale: '1:1', showDimensions: true },
        { id: 'view-top', type: 'TOP', title: 'Top Plan (1:1)', position: { x: 520, y: 0, w: 500, h: 350 }, scale: '1:1', showDimensions: true },
        { id: 'view-right', type: 'RIGHT', title: 'Right Profile (1:1)', position: { x: 0, y: 370, w: 500, h: 350 }, scale: '1:1', showDimensions: true },
        { id: 'view-iso', type: 'ISO', title: 'Isometric View', position: { x: 520, y: 370, w: 500, h: 350 }, scale: '1:1', showDimensions: false },
      ],
    },
  ] as DrawingSheetData[],
  activeSheetId: 'sheet-1' as string,

  setDrawingSheets: (drawingSheets: DrawingSheetData[]) => set({ drawingSheets }),

  addDrawingSheet: (name: string) =>
    set((state: any) => {
      const id = `sheet-${Date.now()}`;
      return {
        drawingSheets: [...state.drawingSheets, { id, name, views: [] }],
        activeSheetId: id,
      };
    }),

  deleteDrawingSheet: (id: string) =>
    set((state: any) => {
      if (state.drawingSheets.length <= 1) return state;
      const remaining = state.drawingSheets.filter((s: DrawingSheetData) => s.id !== id);
      return {
        drawingSheets: remaining,
        activeSheetId: state.activeSheetId === id ? remaining[0].id : state.activeSheetId,
      };
    }),

  renameDrawingSheet: (id: string, name: string) =>
    set((state: any) => ({
      drawingSheets: state.drawingSheets.map((s: DrawingSheetData) => (s.id === id ? { ...s, name } : s)),
    })),

  setActiveSheet: (id: string) => set({ activeSheetId: id }),

  updateViewPosition: (sheetId: string, viewId: string, position: { x: number; y: number; w: number; h: number }) =>
    set((state: any) => ({
      drawingSheets: state.drawingSheets.map((s: DrawingSheetData) =>
        s.id === sheetId ? { ...s, views: s.views.map((v: DrawingSheetViewData) => (v.id === viewId ? { ...v, position } : v)) } : s
      ),
    })),

  updateViewScale: (sheetId: string, viewId: string, scale: string) =>
    set((state: any) => ({
      drawingSheets: state.drawingSheets.map((s: DrawingSheetData) =>
        s.id === sheetId
          ? { ...s, views: s.views.map((v: DrawingSheetViewData) => (v.id === viewId ? { ...v, scale, title: v.title.replace(/\(\d+:\d+\)/, `(${scale})`) } : v)) }
          : s
      ),
    })),

  addViewToSheet: (viewType: 'FRONT' | 'TOP' | 'RIGHT' | 'ISO' | 'SECTION', sheetId?: string, parentViewId?: string) =>
    set((state: any) => {
      const id = `view-${Date.now()}`;
      const scales = ['1:1', '1:2', '1:5', '2:1', '5:1'];
      const scale = scales[Math.floor(Math.random() * scales.length)];
      const titleMap: Record<string, string> = { FRONT: 'Front View', TOP: 'Top View', RIGHT: 'Right View', ISO: 'Isometric View', SECTION: 'Section View' };
      const colWidth = 500;
      const rowHeight = 350;
      const gap = 20;
      const col = state.drawingSheets.find((s: DrawingSheetData) => s.id === sheetId)?.views.length || 0;
      const c = col % 2;
      const r = Math.floor(col / 2);
      const newView: DrawingSheetViewData = {
        id,
        type: viewType,
        title: titleMap[viewType] + ' (' + scale + ')',
        position: { x: c * (colWidth + gap), y: r * (rowHeight + gap), w: colWidth, h: rowHeight },
        scale,
        showDimensions: viewType !== 'ISO',
        parentViewId,
      };
      return {
        drawingSheets: state.drawingSheets.map((s: DrawingSheetData) => {
          if (s.id !== sheetId) return s;
          return { ...s, views: [...s.views, newView] };
        }),
      };
    }),

  removeViewFromSheet: (sheetId: string, viewId: string) =>
    set((state: any) => ({
      drawingSheets: state.drawingSheets.map((s: DrawingSheetData) =>
        s.id === sheetId ? { ...s, views: s.views.filter((v: DrawingSheetViewData) => v.id !== viewId) } : s
      ),
    })),

  updateViewTitle: (sheetId: string, viewId: string, title: string) =>
    set((state: any) => ({
      drawingSheets: state.drawingSheets.map((s: DrawingSheetData) =>
        s.id === sheetId ? { ...s, views: s.views.map((v: DrawingSheetViewData) => (v.id === viewId ? { ...v, title } : v)) } : s
      ),
    })),

  toggleViewDimensions: (sheetId: string, viewId: string) =>
    set((state: any) => ({
      drawingSheets: state.drawingSheets.map((s: DrawingSheetData) =>
        s.id === sheetId ? { ...s, views: s.views.map((v: DrawingSheetViewData) => (v.id === viewId ? { ...v, showDimensions: !v.showDimensions } : v)) } : s
      ),
    })),
});
