# Task Plan: Sprint CFG-1 (Configuration Manager)

## Goal
Implement the Configuration Manager module to allow users to create, switch, and manage multiple part variants (Configurations). Each configuration can have its own feature suppression states and parameter overrides.

## Phases

### Phase 1: State Engine Refinement
- [ ] Audit `src/store/useCadStore.ts` for existing configuration state (`configurations`, `activeConfigurationId`).
- [ ] Implement `applyConfiguration(configId)` logic to update the current `features` state based on the stored overrides and suppression maps.
- Status: `not_started`

### Phase 2: Configuration Manager UI
- [ ] Develop `src/ui/ConfigurationManagerPanel.tsx`.
- [ ] Implement UI for adding new configurations (cloning from current).
- [ ] Implement double-click to activate a configuration.
- [ ] Add visual indicators for the active configuration.
- Status: `not_started`

### Phase 3: Property Manager Integration
- [ ] Update `PartFeaturePropertyManager.tsx` to handle parameter changes when multiple configurations exist.
- [ ] Option: "This Configuration", "All Configurations", or "Specified Configurations" (Mirroring SolidWorks behavior). For MVP, we will focus on "This Configuration" overrides.
- Status: `not_started`

### Phase 4: Validation & Baseline Update
- [ ] Verify that switching configurations correctly rebuilds the 3D model.
- [ ] Update `gap-checklist.md`, `PROJECT_ROADMAP.md`, and `DEV_LOG.md`.
- Status: `not_started`
