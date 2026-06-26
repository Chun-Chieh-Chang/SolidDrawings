import { v4 as uuidv4 } from 'uuid';
import type { DrawingSheetData, DrawingSheetViewData, DrawingAnnotation, CropBoundary, AuxiliaryEdge, ViewType, BomEntry, CADComponent } from './types';

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
  addViewToSheet: (viewType: ViewType, sheetId?: string, parentViewId?: string) => void;
  removeViewFromSheet: (sheetId: string, viewId: string) => void;
  updateViewTitle: (sheetId: string, viewId: string, title: string) => void;
  toggleViewDimensions: (sheetId: string, viewId: string) => void;
  addAnnotation: (sheetId: string, annotation: DrawingAnnotation) => void;
  updateAnnotationPosition: (sheetId: string, annotationId: string, x: number, y: number) => void;
  removeAnnotation: (sheetId: string, annotationId: string) => void;
  cropView: (sheetId: string, viewId: string, boundary: CropBoundary) => void;
  createAuxiliaryView: (sheetId: string, parentViewId: string, edge: AuxiliaryEdge) => void;
  // ── BOM ──────────────────────────────────────────────────────
  bomEntries: BomEntry[];
  setBomEntries: (entries: BomEntry[]) => void;
  addBomEntry: (entry: BomEntry) => void;
  removeBomEntry: (id: string) => void;
  updateBomEntry: (id: string, updates: Partial<BomEntry>) => void;
  rebuildBomFromComponents: (components: CADComponent[]) => void;
};

export const createDrawingState = (set: any, get: any) => ({
  drawingSheets: [
    {
      id: 'sheet-1',
      name: 'Sheet 1',
      sheetSize: 'A4',
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

  addViewToSheet: (viewType: ViewType, sheetId?: string, parentViewId?: string) =>
    set((state: any) => {
      const id = `view-${Date.now()}`;
      const scales = ['1:1', '1:2', '1:5', '2:1', '5:1'];
      const scale = scales[Math.floor(Math.random() * scales.length)];
      const titleMap: Record<string, string> = { FRONT: 'Front View', TOP: 'Top View', RIGHT: 'Right View', ISO: 'Isometric View', SECTION: 'Section View', DETAIL: 'Detail View', CROP: 'Crop View', AUXILIARY: 'Auxiliary View' };
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

  // ── Annotation CRUD ─────────────────────────────────────────────

  addAnnotation: (sheetId: string, annotation: DrawingAnnotation) =>
    set((state: any) => ({
      drawingSheets: state.drawingSheets.map((s: DrawingSheetData) => {
        if (s.id !== sheetId) return s;
        const annotations = s.annotations ?? [];
        return { ...s, annotations: [...annotations, annotation] };
      }),
    })),

  updateAnnotationPosition: (sheetId: string, annotationId: string, x: number, y: number) =>
    set((state: any) => ({
      drawingSheets: state.drawingSheets.map((s: DrawingSheetData) => {
        if (s.id !== sheetId) return s;
        const annotations = (s.annotations ?? []).map((a: DrawingAnnotation) =>
          a.id === annotationId ? { ...a, x, y } : a
        );
        return { ...s, annotations };
      }),
    })),

  removeAnnotation: (sheetId: string, annotationId: string) =>
    set((state: any) => ({
      drawingSheets: state.drawingSheets.map((s: DrawingSheetData) => {
        if (s.id !== sheetId) return s;
        return { ...s, annotations: (s.annotations ?? []).filter((a: DrawingAnnotation) => a.id !== annotationId) };
      }),
    })),

  // ── Crop View ────────────────────────────────────────────────────
  cropView: (sheetId: string, viewId: string, boundary: CropBoundary) =>
    set((state: any) => ({
      drawingSheets: state.drawingSheets.map((s: DrawingSheetData) =>
        s.id !== sheetId ? s : {
          ...s,
          views: s.views.map((v: DrawingSheetViewData) =>
            v.id !== viewId ? v : {
              ...v,
              type: 'CROP' as const,
              title: v.title.includes('(Cropped)') ? v.title : v.title + ' (Cropped)',
              cropBoundary: boundary,
            }
          ),
        }
      ),
    })),

  // ── Auxiliary View ──────────────────────────────────────────────
  createAuxiliaryView: (sheetId: string, parentViewId: string, edge: AuxiliaryEdge) =>
    set((state: any) => {
      const id = `view-aux-${Date.now()}`;
      const scales = ['1:1', '1:2', '1:5', '2:1', '5:1'];
      const scale = scales[Math.floor(Math.random() * scales.length)];

      // Compute projection direction from edge normal
      const dx = edge.x2 - edge.x1;
      const dy = edge.y2 - edge.y1;
      const len = Math.sqrt(dx * dx + dy * dy);
      const nx = len > 0 ? -dy / len : 0; // perpendicular
      const ny = len > 0 ? dx / len : 0;

      // Find the parent view and place the auxiliary view offset from it
      const parentSheet = state.drawingSheets.find((s: DrawingSheetData) => s.id === sheetId);
      const parentView = parentSheet?.views.find((v: DrawingSheetViewData) => v.id === parentViewId);
      const offset = 120;
      const pos = parentView
        ? { x: parentView.position.x + parentView.position.w + offset, y: parentView.position.y, w: 400, h: 300 }
        : { x: 0, y: 0, w: 400, h: 300 };

      const newView: DrawingSheetViewData = {
        id,
        type: 'AUXILIARY',
        title: `Auxiliary View (${scale})`,
        position: pos,
        scale,
        showDimensions: true,
        parentViewId,
        auxiliaryEdge: edge,
      };

      return {
        drawingSheets: state.drawingSheets.map((s: DrawingSheetData) => {
          if (s.id !== sheetId) return s;
          return { ...s, views: [...s.views, newView] };
        }),
      };
    }),

  // ── BOM ──────────────────────────────────────────────────────────
  bomEntries: [] as BomEntry[],
  setBomEntries: (bomEntries: BomEntry[]) => set({ bomEntries }),

  addBomEntry: (entry: BomEntry) => {
    get().saveSnapshot();
    set((state: any) => ({ bomEntries: [...state.bomEntries, entry] }));
  },

  removeBomEntry: (id: string) => {
    get().saveSnapshot();
    set((state: any) => ({
      bomEntries: state.bomEntries.filter((e: BomEntry) => e.id !== id),
    }));
  },

  updateBomEntry: (id: string, updates: Partial<BomEntry>) => {
    get().saveSnapshot();
    set((state: any) => ({
      bomEntries: state.bomEntries.map((e: BomEntry) =>
        e.id === id ? { ...e, ...updates } : e
      ),
    }));
  },

  rebuildBomFromComponents: (components: CADComponent[]) => {
    const entries: BomEntry[] = [];
    let itemNo = 0;

    function walk(list: CADComponent[], parentId?: string, level: number = 0) {
      for (const comp of list) {
        itemNo++;
        const entry: BomEntry = {
          id: uuidv4(),
          itemNo,
          partNo: comp.partId || comp.id,
          description: comp.instanceName,
          qty: comp.isSubAssembly ? 1 : 1,
          material: '',
          note: '',
          level,
          parentId,
          componentId: comp.id,
          isSubAssembly: comp.isSubAssembly,
          children: [],
        };
        entries.push(entry);
        if (comp.children && comp.children.length > 0) {
          walk(comp.children, entry.id, level + 1);
        }
      }
    }

    walk(components);
    set({ bomEntries: entries });
  },
});
