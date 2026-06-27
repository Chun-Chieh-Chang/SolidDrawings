# UI Completion Plan: Remaining Phases + SW2010 Gap Closure

## Goal
Complete the SW2010 UI alignment by finishing remaining plan phases, adding panel collapse/expand, quick navigation, and fixing any other gaps.

## Phases

### P6: Status Bar Overhaul
- Move `engineStatus` from page.tsx local state → store
- Add `units` to store ('MMGS' | 'IPS')
- Rewrite StatusBar.tsx: height 22px, SW2010 layout (sketch status, units quick-switch, grid snap, kernel dot)
- Flat background #E8E8E8, 1px top border #D0D0D0, 10px font

### P7: Visual Theme — SW2010 Flat Colors
- Update globals.css: remove gradients, shadows; flat SW palette
- Remove gradient backgrounds from TopMenu, StatusBar, RibbonController, panel headers
- Remove all drop-shadows from chrome elements
- Flat 1px borders (#D0D0D0) everywhere

### P8: Panel Collapse/Expand
- **Left sidebar**: Add collapse toggle button at far-right of tab strip
  - Expanded: 280px panel (as now)
  - Collapsed: Only icon strip visible (~28px)
- **Right task pane**: Add collapse/expand button (currently just ✕ close)

### P9: Quick Jump/Navigation
- Alt+1 → FeatureManager tab
- Alt+2 → PropertyManager tab  
- Alt+3 → ConfigurationManager tab
- Alt+4 → DimXpertManager tab
- Alt+0 → Toggle left panel collapse
- Add keyboard event listener in page.tsx

### P10: Polish & Validation
- npm run build passes
- Verify all visual components render correctly
- Lint/style check on changed files
