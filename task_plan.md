# Task Plan: Sprint DRAW-3 (Engineering Drawing Dimensions & BOM)

## Goal
Finalize the Documentation Phase (Phase 2) by implementing interactive Smart Dimensions and an automatic Bill of Materials (BOM) table on the `DrawingSheet.tsx` SVG canvas.

## Phases

### Phase 1: Architecture & Planning
- [x] Read `src/ui/DrawingSheet.tsx` to understand the current SVG rendering flow and coordinate space.
- [x] Define the `DrawingDimension` state structure.
- Status: `complete`

### Phase 2: Implement Interactive Dimensioning
- [x] Add `isDimensionMode` toggle state (using `smartDimensionActive` from `useCadStore`).
- [x] Implement `onClick` handler on the SVG lines to capture endpoints and un-project the scale.
- [x] Calculate dimension value (distance based on model scale).
- [x] Render manual dimension lines (extension lines, arrows, text) on the SVG canvas with interactive points.
- Status: `complete`

### Phase 3: Implement BOM Table
- [x] Retrieve assembly components from `useCadStore`.
- [x] Auto-generate a structured SVG/HTML table at the bottom-right corner of the drawing sheet (above the Title Block).
- Status: `complete` (Confirmed existing implementation and refined auto-generation logic)

### Phase 4: Validation
- [x] Update `gap-checklist.md`, `PROJECT_ROADMAP.md`, and `DEV_LOG.md`.
- Status: `complete`
