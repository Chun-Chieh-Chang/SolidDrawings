# Task Plan: STABLE-3 Closure + Sheet Metal Phase 6

## Status: In Progress (2026-06-23)

## Goal
1. Close out STABLE-3 (all phases superseded by STABLE-4 cleanup)
2. Implement Sheet Metal Phase 6 from PLAN.md — Edge Flange end-to-end

---

## Phase 1: STABLE-3 Closure (SUPERSEDED BY STABLE-4)
- [x] Phase 1: Suppress Manual Wizards → **SUPERSEDED** — RobotHUD/RobotOperationService deleted in STABLE-4 (commit 6b7e908). `skipWizardIfRobotWorking` is a no-op stub in RibbonController.tsx line 76-78.
- [x] Phase 2: Kernel Error Synchronization → **SUPERSEDED** — RobotOperationService.tsx deleted. No robot architecture exists anymore.
- [x] Phase 3: Robot Script Intelligence → **SUPERSEDED** — e2e_stress_test_sim.py deleted. No stress test infrastructure remains.
- [x] Phase 4: Final Validation → **SUPERSEDED** — No robot system to validate.
- [x] Resolution: Mark all STABLE-3 phases as superseded. Document in DEV_LOG.

## Phase 2: Sheet Metal — Wire SheetMetalPanel into PropertyManager
- [x] Connect SheetMetalPanel to useCadStore setActivePropertyManager
- [x] Wire onFeatureCreate callback through PropertyManager flow
- [x] Ensure SheetMetalPanel renders alongside other property managers (via activeTab === 'SHEET_METALS' in page.tsx)

## Phase 3: Sheet Metal — Add Sheet Metal Tab to RibbonController
- [x] Add 'SHEET_METALS' tab to RibbonController activeTab union
- [x] Create Sheet Metal toolbar group with Edge Flange button
- [x] Wire button to trigger sheet metal property manager

## Phase 4: Sheet Metal — Implement Edge Flange Feature Builder
- [x] Create `src/hooks/features/sheet-metal-builders.ts` with Edge Flange handler
- [x] Edge Flange: select base edge + sketch plane → create flange profile → extrude
- [x] Register in useFeatureBuilders index

## Phase 5: Sheet Metal — Implement Backend Edge Flange Geometry
- [x] Add `generate_edge_flange()` to backend geometry_service.py
- [x] Use OpenCASCADE BRepOffsetAPI_MakeSimpleWire + BRepOffsetAPI_Sewing
- [x] Expose via geometry.py router
- [x] Real L-profile swept geometry in generate_edge_flange() (was: mock hash)
- [x] Shape cache (_EDGE_FLANGE_SHAPE_CACHE) for rebuild pipeline lookup

## Phase 6: Sheet Metal — Bend Allowance K-factor Utility
- [x] Calculate bend allowance: BA = π × (bendAngle/180) × (radius + kFactor × thickness)
- [x] Add as standalone utility function
- [x] Wire into SheetMetalPanel K-Factor rollout

## Phase 7: Verify Build + Lint Clean
- [ ] TypeScript compilation passes
- [ ] ESLint clean on changed files
- [ ] No regressions in existing features

---

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| (none yet) | | |

## Files to Create/Modify
### Create:
- `src/hooks/features/sheet-metal-builders.ts`
- `backend/app/services/sheet_metal_service.py` (or add to geometry_service.py)

### Modify:
- `src/ui/SheetMetal/SheetMetalPanel.tsx` — fix template literals, connect to store
- `src/ui/RibbonBar/RibbonController.tsx` — add Sheet Metal tab + Edge Flange button
- `src/hooks/features/index.ts` — register sheet metal builders
- `src/store/useCadStore.ts` — add sheetMetal state if needed
- `backend/app/routers/geometry.py` — add edge_flange endpoint
