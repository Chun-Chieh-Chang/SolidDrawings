# Task Plan: Sprint CFG-2 (Design Table UI)

## Goal
Implement a "Design Table" UI that allows users to view and batch-edit parameters and suppression states across all configurations in a single grid interface.

## Phases

### Phase 1: Data Aggregation Engine
- [ ] Implement a utility to extract a unique set of all overridden parameters and features across all existing configurations.
- [ ] Define the table schema: Rows = Configurations, Columns = Features/Parameters.
- Status: `not_started`

### Phase 2: Design Table Component
- [ ] Develop `src/ui/Modals/DesignTableModal.tsx`.
- [ ] Implement a sticky-header grid using standard HTML tables with Tailwind styling.
- [ ] Implement editable cells that push updates back to the `useCadStore`'s `configurations` state.
- Status: `not_started`

### Phase 3: Integration & UX
- [ ] Add a "Design Table" button to `ConfigurationManagerPanel.tsx`.
- [ ] Add a "Sync to Model" button to apply batch changes.
- Status: `not_started`

### Phase 4: Validation & Baseline Update
- [ ] Verify that editing a cell in the Design Table correctly updates the specific configuration's state.
- [ ] Update `gap-checklist.md`, `PROJECT_ROADMAP.md`, and `DEV_LOG.md`.
- Status: `not_started`
