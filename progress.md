## Session: 2026-06-25 (Bend Allowance UI + Forming Tools)
- **Bend Allowance Panel** (`src/ui/SheetMetal/BendAllowancePanel.tsx`):
  - Dedicated PropertyManager-style panel with allowance type selector (K-Factor/Bend Allowance/Bend Deduction)
  - K-factor slider with material presets (Steel/Aluminum/Stainless/Copper/Brass)
  - Bend radius, thickness, angle inputs
  - Relief type (Rectangular/Tear/Obround/None) + Auto Relief + dimensions
  - Live calculation preview showing BA, Setback, Total Flat Length + formula
  - Integrated into SheetMetalPanel when Bend Allowance/K-Factor tools selected
- **Forming Tools** — 5 tool types, full end-to-end pipeline:
  - Backend (`geometry_service.py`): `generate_forming_tool()` dispatches to `_make_louver`, `_make_lance`, `_make_bridge`, `_make_dimple`, `_make_drawn_cutout` — each creates parametric OCCT geometry, cached in `_FORMING_TOOL_SHAPE_CACHE`
  - Backend API (`geometry.py`): `FormingToolRequest` + `POST /forming_tool`
  - Rebuild pipeline: `FORMING_TOOL` case with cache lookup + fallback box + fuse
  - Frontend: `createFormingTool()` in HeavyEngineClient, `handleCreateFormingTool()` in sheet-metal-builders
  - Ribbon: 5 forming tool buttons (Louver, Lance, Bridge, Dimple, Drawn Cutout) in SHEET_METALS tab
  - Props wired through `index.ts` + `page.tsx`
- Ribbon: Bend Allowance button now live (switches to SHEET_METALS tab), BA Calc replaced by forming tools
- `tsc --noEmit`: zero new errors (only pre-existing playwright/jest)
- Python syntax check: geometry_service.py + router both compile clean

## Session: 2026-06-24 (Cleanup + MEC Consolidation + Git Baseline)
- MECE cleanup: removed `diagnose.py`, `diagnose2.py`, `sync.ffs_db`, root `nul`, plugin `nul` files
- Updated `.gitignore`: added `nul`, `vendor/`, `.omo/`, `playwright-report/`, `.opencode/`
- Updated `handover_resume_guide.md` — comprehensive state doc for handoff
- Appended `DEV_LOG.md` with complete Phase 6 entries (Edge Flange, Miter Flange, Hem, Flat Pattern, codebase-memory)
- Updated `progress.md` with current session
- Deleted stale `master` branch (redundant with `main`)
- All changes committed as cleanup baseline
- Pushed to GitHub

## Session: 2026-06-23 (STABLE-3 Closure + Sheet Metal Phase 6)
[Previous session content preserved below]

### Edge Flange
- Real OCCT L-profile sweep geometry via BRepFill_PipeShell
- Full pipeline: Ribbon → handler → HeavyEngineClient → API → geometry_service → cache → rebuild

### Miter Flange
- 2 L-profile segments at 90°, fused
- Same end-to-end pipeline

### Hem
- CLOSED/OPEN/TEARDROP 180° fold types
- GC_MakeArcOfCircle → BRepPrimAPI_MakePrism

### Flat Pattern
- Parametric unfold via K-factor BA formula
- Planar plate on XY plane at z=25

### Codebase-Memory
- MCP server installed and configured (UI on localhost:9749)
