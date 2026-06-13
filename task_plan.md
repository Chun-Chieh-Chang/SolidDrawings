# Task Plan: Sprint CFG-3 (CSV Design Table Import)

## Goal
Implement a CSV import feature for the Design Table to allow users to drive part configurations from external spreadsheets.

## Phases

### Phase 1: CSV Parser Logic
- [x] Implement a front-end CSV parser utility directly in `DesignTableModal.tsx`.
- [x] Map CSV rows to configurations and columns to feature parameters/suppression states using a header schema (FeatureName.Parameter).
- Status: `complete`

### Phase 2: Design Table UI Enhancement
- [x] Add an "Import CSV" button to `DesignTableModal.tsx`.
- [x] Add an "Export Template" button to allow users to easily see the required CSV schema.
- [x] Implement a file upload handler that triggers the parser.
- Status: `complete`

### Phase 3: Integration & Sync
- [x] Ensure imported configurations are correctly added to the `localConfigs` state (creates new configs or updates existing by name).
- [x] Verify that imported suppression and parameter data correctly maps to the internal IDs.
- Status: `complete`

### Phase 4: Validation & Phase 3 Completion
- [x] Verify CSV import correctly updates the table and then the model after syncing.
- [x] Update `gap-checklist.md`, `PROJECT_ROADMAP.md`, and `DEV_LOG.md`.
- [x] Mark Phase 3 as 100% complete.
- Status: `complete`
