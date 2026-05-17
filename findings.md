# 3D-Builder Findings

## Handover Summary

- Project goal: evolve 3D-Builder into a SolidWorks-like feature-based parametric CAD app.
- Current stack: Next.js frontend with Zustand store and Three renderer; FastAPI/PythonOCC backend.
- Completed state includes blank canvas startup, sketch tools, relation tracking, smart dimensions, and relation persistence on extrudes.
- Next Task 1: double-click a solid feature in FeatureManager to load its stored sketch points, relations, and plane into sketch mode.
- Important Task 1 behavior: exiting/extruding after re-editing must update the existing feature ID rather than append a new feature.
- Next Task 2: advanced multi-entity sketch relations; defer until Task 1 completes and verifies.

## Repository State

- Current branch: `main` tracking `origin/main`.
- Dirty files already present before this session: `DEV_LOG.md`, `src/app/globals.css`, `src/app/page.tsx`, `src/renderer/DatumPlanes.tsx`, `src/renderer/SketchPreview.tsx`, `src/renderer/Viewport.tsx`, `src/store/useCadStore.ts`.
- Untracked before planning: `handover_resume_guide.md`.
- Project scripts: `npm run dev`, `npm run build`, `npm run lint`.
- Dependency baseline: Next.js `16.2.6`, React `19.2.4`, Zustand `5.0.13`, Three `0.184.0`.
- `AGENTS.md` warns that this Next.js version has breaking changes and requires reading the relevant local guide under `node_modules/next/dist/docs/` before code edits.

## Next.js Local Docs Read

- `01-app/01-getting-started/03-layouts-and-pages.md`: `app/page.tsx` is the route UI for `/`; route files default to Server Components unless marked otherwise.
- `01-app/01-getting-started/05-server-and-client-components.md`: Client Components are required for event handlers, state/hooks, effects, browser APIs, and custom hooks. Current `src/app/page.tsx` correctly starts with `'use client'` because it uses React hooks, Zustand, event handlers, and localStorage-backed state.

## Source Findings

- `useCadStore.ts` currently stores `features`, `sketchPoints`, `sketchRelations`, `isSketchMode`, `activePlane`, `selectedId`, and setters. It has `updateFeatureParams(id, params)` for parametric updates but no explicit sketch edit target state yet.
- `page.tsx` currently creates a new `EXTRUDE` in `handleExitAndExtrude`, filters out `CENTER_LINE`, copies `sketchRelations` into `parameters.relations`, then clears sketch state.
- FeatureManager history tree maps `features` and currently only selects a feature on click; feature deletion stops propagation.
- Existing dirty diff already added SolidWorks visual styling, active sketch relations, smart dimensions, and relation display in PropertyManager. Treat this as prior work and preserve it.
- Backend `geometry_service.py` rebuilds `EXTRUDE` directly from `parameters.points`, `plane`, `depth`, origin, and operation. Updating an existing feature's `parameters.points` should rebuild the same feature without backend changes.
- Implementation decision: add transient `editingFeatureId` to Zustand. Do not include it in `partialize`, so refreshes do not reopen a stale sketch edit session.
- `DatumPlanes.tsx` previously auto-created an extrude when the line tool closed a loop. That bypassed `page.tsx` and would have broken edit-in-place. It now closes the sketch points only; final creation/update goes through `handleExitAndExtrude`.

## Verification Findings

- `npm run build` passes under Next.js 16.2.6 after escalated execution for `.next` write access.
- Browser check on `http://localhost:3000/`: created a sketch, extruded it into `Custom Extrude 1`, double-clicked that history-tree feature, confirmed sketch mode reopened with original points and `Update Feature`, then clicked update.
- Browser check confirmed no duplicate `Custom Extrude 2` appeared; the model returned to non-sketch PropertyManager with one `Custom Extrude 1`.
- Full `npm run lint` is not clean. `.miniforge/**` is now ignored, and remaining lint failures are first-party debt such as broad `any` usage, `prefer-const`, unused values, and `react-hooks/set-state-in-effect`.
- `handover_resume_guide.md` was rewritten to v1.9.0 as a clean continuation document.
- `DEV_LOG.md` was updated with the v1.9.0 PDCA entry.

## Open Questions

- Address first-party lint debt in a separate PDCA iteration so `npm run lint` can become a useful gate.
- Task 2 remains open: advanced multi-entity sketch relations.
