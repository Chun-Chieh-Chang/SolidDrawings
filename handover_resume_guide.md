# SolidWorks Replicant CAD Continuation & Handover Guide (v1.9.0)

Last updated: 2026-05-17

This document is the handover anchor for the `3D-Builder` project. Read it first when resuming development so another account, model, or tool can continue without relying on hidden chat context.

## Project Goal

Build `3D-Builder` into a SolidWorks-like feature-based parametric CAD tool:

- SolidWorks desktop UX: CommandManager ribbon, FeatureManager design tree, PropertyManager, cool gray desktop palette.
- Zero-orphan principle: no primary toolbar placeholder or padlocked commands unless the command works.
- Persistent sketch relations and smart dimensions bound to extruded features.
- Feature history that can reopen and edit sketches instead of creating one-way geometry.

## Stack

- Frontend: Next.js `16.2.6`, React `19.2.4`, Zustand, React Three Fiber, Three.js.
- Main UI: `src/app/page.tsx`
- Renderer: `src/renderer/Viewport.tsx`, `src/renderer/DatumPlanes.tsx`, `src/renderer/SketchPreview.tsx`
- Store: `src/store/useCadStore.ts`
- Backend: FastAPI + PythonOCC, with geometry rebuild in `backend/app/services/geometry_service.py`
- Frontend dev URL observed in this session: `http://localhost:3000/`
- Backend docs when running: `http://localhost:8000/docs`

Important repo rule: `AGENTS.md` says this is not the familiar Next.js. Before code edits, read relevant docs under `node_modules/next/dist/docs/`. For this session, the App Router pages and Server/Client Components docs were read.

## Current Completed State

### v1.8.0 Prior State

- Clean canvas startup purges legacy mock features.
- Sketch tools include line, arc, centerline, center circle, and corner rectangle.
- Centerlines are tagged as `CENTER_LINE`, rendered dashed, and excluded from solid extrusion.
- Sketch constraints and smart dimensions are tracked in `sketchRelations`.
- Extrudes persist relations under `feature.parameters.relations`.
- PropertyManager displays bound relations with a fully-defined style badge.

### v1.9.0 Completed In This Session

Task 1 from the previous handover is complete: double-clicking an existing extruded feature reopens its sketch and updates the same feature on exit.

Files changed for this workflow:

- `src/store/useCadStore.ts`
  - Added transient `editingFeatureId` and `setEditingFeatureId`.
  - `removeFeature` clears `editingFeatureId` when deleting the feature being edited.
  - `editingFeatureId` is intentionally not persisted in `partialize`.

- `src/app/page.tsx`
  - Added `handleEditFeatureSketch(feature)`.
  - FeatureManager history rows now support `onDoubleClick` for editable `EXTRUDE` features with stored points.
  - Existing feature sketch points, relations, and plane are loaded into sketch mode.
  - `handleExitAndExtrude()` now updates the existing feature when `editingFeatureId` is set; otherwise it creates a new `Custom Extrude`.
  - HUD button label changes to `Update Feature` during edit-in-place.
  - Solid-point counting ignores `CENTER_LINE`, so construction geometry does not unlock extrusion by itself.

- `src/renderer/DatumPlanes.tsx`
  - Closing a line sketch no longer auto-creates an extrude directly from the renderer.
  - It now closes the sketch loop only; final create/update flows through `page.tsx` so edit-in-place works.

- `eslint.config.mjs`
  - Added `.miniforge/**` to eslint global ignores so bundled Python/Conda package JavaScript is not linted as project source.

## Verification

- `npm run build`
  - Passed under Next.js `16.2.6`.
  - First sandboxed attempt failed with `EPERM` on `.next/trace-build`; re-running with approved escalation passed.

- Browser verification on `http://localhost:3000/`
  - Entered sketch mode.
  - Created a 3-point sketch and extruded it.
  - Confirmed `Custom Extrude 1` appeared in FeatureManager and PropertyManager.
  - Double-clicked `Custom Extrude 1`.
  - Confirmed sketch mode reopened with original points and the HUD showed `Update Feature`.
  - Clicked `Update Feature`.
  - Confirmed the app returned to non-sketch mode with only `Custom Extrude 1`; no `Custom Extrude 2` duplicate was appended.

- `npm run lint`
  - Still fails on first-party lint debt after ignoring `.miniforge`.
  - Current remaining categories: existing broad `any` usage in store/kernel/renderer, `prefer-const` in `Viewport.tsx`, unused values in `page.tsx`/`DatumPlanes.tsx`, and `react-hooks/set-state-in-effect` for the rebuild effect.

## Known Issues / Risks

- Backend may be disconnected in the UI until FastAPI is started. The front-end feature edit flow still updates Zustand, but B-Rep mesh rebuild needs the backend.
- `CADFeature.parameters` and `sketchPoints` are still loosely typed. A future typing pass should introduce `SketchPoint`, `ExtrudeParameters`, and typed mesh rebuild results.
- The renderer still owns some sketch drawing concerns. Keep final feature mutation centralized in `page.tsx` or a future command layer.
- Full lint is not green yet; do not confuse this with build failure. Build passes.

## Next PDCA Iteration

Recommended next task: Task 2 from the previous handover, advanced multi-entity sketch relations.

Plan:

1. Inspect sketch entity representation and decide how to select entities, not just points.
2. Add multi-selection state for sketch entities.
3. Implement line-line parallel and circle-circle concentric as the first two relation solvers.
4. Persist these relations into `feature.parameters.relations`.
5. Verify with build and browser interaction.

Before Task 2, consider a small cleanup PDCA:

- Add real types for `SketchPoint`, `CADFeature.parameters`, and mesh data.
- Resolve first-party lint debt enough that `npm run lint` can become a useful gate.

## Run Commands

Frontend:

```powershell
npm run dev
npm run build
npm run lint
```

Backend:

```powershell
cd backend
python -m uvicorn app.main:app --reload --port 8000
```

## Continuation Rule

When remaining working capacity is near 10%, update this file and `DEV_LOG.md` before stopping. Include:

- What changed.
- What was verified.
- What failed or remains risky.
- Exact next steps.
