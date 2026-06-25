# Task Plan: Sprint 2026-06-25 — Close Remaining P1 + Tech Debt

## Status: Planned

## Goal
Close the last 2 P1 gaps (Split/Combine boolean ops, Base Flange Tab) and refactor the overgrown geometry_service.py. This clears all P0/P1 items and brings overall maturity from ~50% to ~60%.

---

## Sprint Tasks

### Task 1: Split / Combine Boolean Operations — P1

**Acceptance Criteria:**
- [ ] `POST /split` endpoint accepts a `{features, split_plane}` payload and returns 200 with `shape_hash`
- [ ] `POST /combine` endpoint accepts a `{features, operation: "ADD"|"SUBTRACT"|"INTERSECT", tool_feature_id}` payload and returns 200 with `shape_hash`
- [ ] `Split` and `Combine` buttons appear in the FEATURES ribbon tab (Boolean group)
- [ ] `tsc --noEmit` shows zero new errors

- [ ] Backend: Add `POST /split` and `POST /combine` endpoints to geometry.py router
- [ ] Backend: Add `generate_split()` and `generate_combine()` to geometry_service.py (leveraging OCC BRepAlgoAPI_Split/BRepAlgoAPI_Fuse/Cut/Common)
- [ ] Frontend: Add Split/Combine buttons to RibbonController FEATURES tab
- [ ] Verification: `tsc --noEmit` passes clean

### Task 2: Base Flange Tab — P1

**Acceptance Criteria:**
- [ ] `POST /base_flange_tab` returns 200 with `shape_hash` when given a closed sketch profile + thickness
- [ ] Base Flange/Tab button is the first button in the SHEET_METALS ribbon tab
- [ ] Clicking the button with a closed sketch creates a `BASE_FLANGE_TAB` feature
- [ ] `tsc --noEmit` shows zero new errors

- [ ] Backend: Add `POST /base_flange_tab` endpoint to geometry.py router
- [ ] Backend: Add `generate_base_flange_tab()` to geometry_service.py (extrudes sketch with thickness, stores seed for flat pattern)
- [ ] Backend: Add `BASE_FLANGE_TAB` type handling in rebuild pipeline
- [ ] Frontend: Add Base Flange/Tab button (first position) to SHEET_METALS tab via `addFeature()`
- [ ] TypeScript: Add `BASE_FLANGE_TAB` to `pendingFeatureCommand` type union
- [ ] Verification: `tsc --noEmit` passes clean

### Task 3: Refactor geometry_service.py — Tech Debt

**Acceptance Criteria:**
- [ ] `geometry_service.py` is split into at least 3 files: `features.py`, `sheet_metal.py`, `surfacing.py`
- [ ] Original file imports from the split files — zero import breakage
- [ ] All existing endpoints continue to work (API contract unchanged)
- [ ] `python -c "from app.services.geometry_service import generate_box"` works without error

- [ ] Analyze: Identify natural split boundaries
- [ ] Create `backend/app/services/sheet_metal.py` — move unfold/fold, flat_pattern, edge_flange, miter_flange, hem, forming_tool, base_flange_tab
- [ ] Create `backend/app/services/surfacing.py` — move boundary_surface, trim_surface, shape cache
- [ ] Create `backend/app/services/features.py` — move extrude, revolve, sweep, loft, fillet, chamfer, shell, draft, pattern, mirror, thicken, dome, rib, split, combine
- [ ] Convert `geometry_service.py` to thin re-export layer
- [ ] Verification: Python import syntax check + `tsc --noEmit`

---

## Gap Scoring After This Sprint (Projected)

| Domain | Current | Target |
|:---|---:|---:|
| Surfacing | 45% | 50% |
| Sheet Metal | 75% | 90% |
| Assembly | 35% | 40% |
| **Overall** | **~50%** | **~60%** |

## Errors Encountered
| Error | Attempt | Resolution |
|---|---|---|
| (none yet) | | |
