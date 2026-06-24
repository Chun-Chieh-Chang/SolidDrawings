# Handover Resume Guide
**Last Saved:** 2026-06-24

> [!IMPORTANT]
> **To the next Agent/Human taking over:**
> Read this document entirely before starting work. It captures the exact workspace state.

## 1. Current Git State

```
On branch main
Last commit: fa5e461 docs: update progress tracking and task plan for Edge Flange Phase 6
```

### Uncommitted Changes
```
 M .gitignore
 M backend/app/routers/geometry.py
 M backend/app/services/geometry_service.py
 M src/app/page.tsx
 M src/hooks/features/index.ts
 M src/hooks/features/sheet-metal-builders.ts
 M src/kernel/HeavyEngineClient.ts
 M src/ui/RibbonBar/RibbonController.tsx
```

## 2. Project Architecture

### Tech Stack
- **Frontend**: React 18 + TypeScript + Three.js (R3F) + Tailwind CSS + Zustand
- **Backend**: Python 3.12 + FastAPI + OpenCASCADE (pythonocc-core 7.9.3)
- **Build**: Next.js (static export)
- **IDE**: OpenCode CLI / Claude Code compatible

### Directory Structure
```
3D-Builder/
├── backend/
│   └── app/
│       ├── routers/geometry.py       — FastAPI routes (all 3D ops)
│       └── services/geometry_service.py — OCCT kernel (5450+ lines)
├── src/
│   ├── app/page.tsx                  — Main orchestrator
│   ├── hooks/features/               — Feature builder hooks
│   │   ├── sheet-metal-builders.ts   — Edge Flange, Miter Flange, Hem, Flat Pattern
│   │   ├── extrude-builders.ts
│   │   ├── revolve-builders.ts
│   │   ├── sweep-loft-builders.ts
│   │   └── index.ts                  — Aggregates all builders
│   ├── kernel/HeavyEngineClient.ts   — HTTP client to FastAPI backend
│   ├── store/                        — Zustand stores
│   ├── ui/
│   │   ├── RibbonBar/RibbonController.tsx  — Tabbed ribbon toolbar
│   │   ├── PartFeaturePropertyManager/     — Property panels per feature
│   │   └── SheetMetal/SheetMetalPanel.tsx  — Left panel (skeleton)
│   └── utils/sheet-metal/bend-allowance.ts — K-factor / BA / setback
└── skills/                           — Agent skills (superpowers)
```

## 3. Sheet Metal Module — Current State

### Completed Features (Phase 6 — PLAN.md)
| Feature | Status | Pipeline |
|---------|--------|----------|
| Edge Flange | ✅ Done | OCCT L-profile sweep → cache → API → client → hook → button |
| Miter Flange | ✅ Done | 2× L-profile segments, 90° mitered corner, same pipeline |
| Hem | ✅ Done | Closed/Open/Teardrop types, 180° fold arc profile, same pipeline |
| Flat Pattern | ✅ Done | Parametric unfold via K-factor BA formula, planar plate output |
| Bend Allowance util | ✅ Done | `src/utils/sheet-metal/bend-allowance.ts` (BA/SETBACK/K-factor) |

### Sheet Metal Pipeline (all features follow same pattern)
```
RibbonController button
  → sheet-metal-builders.ts handler
    → HeavyEngineClient.create{Feature}()
      → POST /{feature} (FastAPI)
        → geometry_service.generate_{feature}() (OCCT)
          → shape cache (_*_SHAPE_CACHE)
          → return hash
    → addFeature({ type: '{FEATURE}', parameters: { occt_shape_hash, ... } })
    → handleRebuild()
      → POST /rebuild (sends full feature list)
        → process_features_cached()
          → build_feature_shape_in_isolation()
            → finds {FEATURE} case → looks up cache by hash → fuses with final_shape
```

### Pending (not started)
- **Bend Allowance UI** — bend table editor, custom K-factor per bend
- **Forming Tools** — lances, louvers, embosses
- **Weldments** — explicitly delayed per user directive
- **DimXpert/Tolerancing** — postponed indefinitely

## 4. Key Decisions Made

1. **Weldments not developed** — explicit user directive. Skipped entirely.
2. **DimXpert/Tolerancing postponed** — indefinite hold.
3. **Miter Flange reuses Edge Flange sweep+cache pattern** — rapid delivery.
4. **Hem uses simplified 2D profile sweep** — folded edge cross-section extruded along edge direction.
5. **Flat Pattern uses parametric unfold** — no `BRepUnfolding` available in pythonocc-core.
   Bend allowance formula: `BA = π/180 × angle × (R + K×T)`
6. **No codebase-memory-mcp reindex needed** — existing 3,620-node graph sufficient.

## 5. Critical Implementation Details

### Rebuild Pipeline (geometry_service.py ~line 2600-2740)
```
elif f_type == 'EDGE_FLANGE':  ... (cache lookup → transform → fuse)
elif f_type == 'MITER_FLANGE': ... (same pattern, mitered corner box)
elif f_type == 'HEM':          ... (same pattern, hem box)
elif f_type == 'FLAT_PATTERN': ... (generate_flat_pattern → replace final_shape)
```

### Shape Caches (all at module level in geometry_service.py)
- `_EDGE_FLANGE_SHAPE_CACHE` / `_EDGE_FLANGE_CACHE_MAX = 64`
- `_MITER_FLANGE_SHAPE_CACHE` / `_MITER_FLANGE_CACHE_MAX = 64`
- `_HEM_SHAPE_CACHE` / `_HEM_CACHE_MAX = 64`
- `_FLAT_PATTERN_SHAPE_CACHE` / `_FLAT_PATTERN_CACHE_MAX = 16`

### API Routes (geometry.py)
- `POST /edge_flange`, `POST /miter_flange`, `POST /hem`, `POST /flat_pattern`
- Standard pattern: Request model → call service → return shape_hash

### Key Files
- `backend/app/services/geometry_service.py` — **5620+ lines**, all OCCT geometry
- `backend/app/routers/geometry.py` — **626+ lines**, all FastAPI routes
- `src/kernel/HeavyEngineClient.ts` — **430+ lines**, API client
- `src/hooks/features/sheet-metal-builders.ts` — **330+ lines**, feature handlers
- `src/ui/RibbonBar/RibbonController.tsx` — **1240+ lines**, ribbon toolbar

## 6. OCCT Environment

- **pythonocc-core 7.9.3** in venv at `backend/.venv/`
- Available modules: `BRepPrimAPI`, `BRepAlgoAPI`, `BRepBuilderAPI`, `BRepFill`, `BRepOffsetAPI`, `BRepFilletAPI`, `BRepMesh`, `GC`, `Geom`, `TopExp`, `TopoDS`, `BRepAdaptor`, `ShapeAnalysis`, `ShapeFix`, `GProp`, `BRepGProp`, `BRepTools`, `BRepClass3d`, `BRepMAT2d`
- `BRepUnfolding` and `ShapeCustom` NOT available

## 7. TypeScript Build

- `tsc --noEmit` passes with only 2 pre-existing errors:
  - `playwright.config.ts`: cannot find `@playwright/test` (not installed)
  - `src/utils/__tests__/ConstraintSolver.test.ts`: cannot find jest types

## 8. How to Resume Development

1. Start with `progress.md` and `DEV_LOG.md` for session-aware context
2. Run `git status` to see working tree changes
3. Next priority per PLAN.md: **Bend Allowance UI** → **Forming Tools**
4. Backend: activate venv (`backend/.venv/Scripts/activate`)
5. Frontend: `npm run dev` (starts Next.js + proxy to backend)
6. Post-implementation: run `tsc --noEmit` to verify TypeScript

---
*Maintained manually as part of project cleanup cycle.*
