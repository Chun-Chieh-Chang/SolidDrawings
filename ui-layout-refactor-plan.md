# UI Layout Refactor: SOLIDWORKS 2010 Alignment

> **Goal**: Transform the current UI layout to match SOLIDWORKS 2010's CommandManager-based layout and interaction logic.
> **Scope**: Macro layout only — no feature logic changes, no new backend work.
> **Target files**: `TopMenu.tsx`, `page.tsx` (layout shell), `RibbonController.tsx`, status bar, left/right panels, viewport chrome.
> **Validated against**: SW2010 UI documentation (CommandManager, FeatureManager, Task Pane, Confirmation Corner, Triad)

---

## Phase 1: Top Menu Bar (含 Standard Toolbar)

### Current Problems
- Branded `3D` logo + `3D-Builder Pro` text (SW has no app branding in menu bar)
- All-caps menu labels: `FILE` `EDIT` `VIEW` `INSERT` `TOOLS` `HELP`
- Document name/status shown as badge in header (SW uses title bar)
- Kernel connection status shown as colored dot with text
- **Missing**: Standard Toolbar embedded in same row (New, Open, Save, Print, Undo, Rebuild, Select, Options)
- **Missing**: Search bar at top-right of menu bar row

### Target
- **Row 1 (single combined row, ~26-28px)**:
  - **Left**: **File Edit View Insert Tools Window Help** (normal case, Segoe UI ~12px)
  - **Center/right**: Standard Toolbar icons (small ~20×20px): New | Open | Save | Print | Undo | Rebuild | Select | Options
  - **Far right**: Search bar (magnifying glass + text field, ~180px wide)
- No logo, no app name, no gradient background
- Remove document status from top bar → move to window title bar (Electron) or status bar
- Kernel status → move to status bar bottom-right

### Notes
- SW2010 Standard Toolbar is embedded in the menu bar row, sharing the same background
- The overall row is light gray (`#E8E8E8`) with 1px bottom border (`#D0D0D0`)
- Menu items have no left padding — starts at very first pixel

### Files to Modify
| File | Changes |
|------|---------|
| `src/ui/TopMenu.tsx` | Remove logo/branding, normal-case labels, add Standard Toolbar, add Search bar, reduce height to 26px, remove kernel status badge, remove document name badge |
| `src/app/page.tsx` | Adjust layout to account for restructured top row |

---

## Phase 2: CommandManager (Ribbon)

### Current Problems
- Height: 110px (too tall; SW is ~78-82px)
- Tab labels in all caps: `SHEET METAL` `FEATURES` `SURFACES` `SKETCH` `EVALUATE` `ASSEMBLY` `DRAWING` `RENDER`
- Buttons arranged in single flat row — no grouping by workflow
- Missing: dropdown chevrons, contextual tab highlighting, "Options" gear
- **All 8 tabs shown simultaneously** — SW only shows **2 default tabs (Features, Sketch)** for part docs

### Target
- Height: ~78-82px (matches SW CommandManager)
- Normal-case tab labels with icon + text layout (SW default style)
- **Default tabs (part mode)**: **Features** → **Sketch** (only 2 tabs by default)
- Context-sensitive: part document → Features + Sketch; assembly → Assembly; drawing → Drawing
- Right-click context menu on tab bar → add/remove tabs (Surfaces, Sheet Metal, Evaluate, etc.)
- Group buttons into logical boxes with separators (e.g., Extrude/Revolve/Sweep/Loft together, Fillet/Chamfer/Draft/Shell together)
- Add tab-level dropdown chevron for tab list overflow
- SW-consistent button sizing: ~52×52px icons, smaller than current ~75×78px
- **Tab bar background**: `#DADADA` (slightly darker gray than menu bar)
- **Active tab**: `#F0F0F0` with 1px darker border bottom

### Files to Modify
| File | Changes |
|------|---------|
| `src/ui/RibbonBar/RibbonController.tsx` | Reduce height, normal-case tabs, implement context-sensitive tab defaults, add chevron |
| `src/ui/RibbonBar/tabs/*.tsx` | Reduce button sizes, add logical grouping separators |
| `src/app/page.tsx` | Adjust RibbonController sizing |

---

## Phase 3: Left Panel (FeatureManager / PropertyManager / ConfigurationManager / DimXpertManager)

### Current Problems
- Tab strip uses text labels: `TREE` `PROPERTIES` `CONFIGS`
- SW uses **icon-only** tabs at the top-left (4 small icons, no text)
- No Rollback Bar (the blue/white bar showing rebuild position)
- FeatureManager tree lacks SW's colored node icons

### Target
- Replace text tabs with icon-only tabs **(4 tabs, not 3)**:
  - **FeatureManager** (tab 1): cascading windows tree icon
  - **PropertyManager** (tab 2): page with slider icon
  - **ConfigurationManager** (tab 3): table/folder icon
  - **DimXpertManager** (tab 4): ruler/dimension icon
- Tabs are small icons at top of panel, ~20×20px, no text labels
- Active tab: lighter background with 1px border highlight
- Add Rollback Bar below the tab strip (thin blue/white gradient bar with drag handle, ~4-5px)
- Panel width: 280px (currently 300px)
- Reduce header height from 32px to ~24px
- Panel background: `#F0F0F0` (SW standard)

### Files to Modify
| File | Changes |
|------|---------|
| `src/app/page.tsx` (sidebar section) | Replace text tabs with 4 icon-only tabs, add RollbackBar, adjust width/height |
| `src/ui/FeatureManagerPanel.tsx` | Add SW-style colored node icons |
| New: `src/ui/RollbackBar.tsx` | New component (UI-only, non-functional initial pass) |

---

## Phase 4: Right Panel (Task Pane)

### Current Problems
- Single tab "Library" with button-style fastener/bearing selector
- SW has multiple task pane tabs aligned **vertically on the right edge**
- Tabs are icon-based and stacked vertically on the right edge
- Missing the vertical tab strip

### Target
- Add **vertical icon-based tab strip on the right edge** (icons stacked vertically):
  - Design Library (books icon)
  - File Explorer (folder icon)
  - Search (magnifying glass icon)
  - View Palette (image icon)
  - Appearances/Scenes (theater mask icon)
- Current Design Library content stays under its tab
- Other tabs show empty placeholder
- Tab strip width: ~28px (thin vertical strip)
- Panel content area: 260px (total 288px with tab strip)
- Panel background: `#F0F0F0`

### Files to Modify
| File | Changes |
|------|---------|
| `src/app/page.tsx` (right panel section) | Add vertical multi-tab task pane, reduce content width to 260px |
| New: `src/ui/TaskPaneTabStrip.tsx` | Vertical icon-only tab strip component |

---

## Phase 5: Viewport Chrome (含 Triad & Confirmation Corner)

### Current Problems
- Red `GEOMETRY KERNEL OFFLINE` banner takes full width (intrusive)
- Heads-Up toolbar is centered above viewport
- Missing **Confirmation Corner** (green check / red X) at top-right — critical SW UX pattern
- Missing **Triad** (XYZ axis indicator) at bottom-left
- "VIEWPORT: PERSPECTIVE" label in top-left corner

### Target
- **Heads-Up toolbar**: move to top-center of viewport, smaller buttons (~28×28px)
- **Confirmation Corner**: top-right corner of viewport
  - Passive state: grayed-out ✓ and ✗
  - Active state (during sketch/feature command): green ✓ and red ✗
  - ✓ = confirm/apply, ✗ = cancel
  - Rounded box with 1px border, ~60×24px
- **Triad**: bottom-left corner of viewport — small color-coded XYZ axis indicator
  - X=Red, Y=Green, Z=Blue
  - ~40×40px, semi-transparent, always visible
- Replace red banner with subtle kernel status icon in status bar
- Remove the "VIEWPORT: PERSPECTIVE" overlay text

### Files to Modify
| File | Changes |
|------|---------|
| `src/renderer/Viewport.tsx` | Add Confirmation Corner, add Triad, reposition Heads-Up, remove overlay text |
| `src/ui/HeadsUpToolbar.tsx` | Reduce button size, reposition to top-center |
| New: `src/ui/ConfirmationCorner.tsx` | ✓/✗ component (passive + active states) |
| New: `src/ui/Triad.tsx` | XYZ axis indicator component |
| `src/app/page.tsx` | Remove the GEOMETRY KERNEL OFFLINE banner |

---

## Phase 6: Status Bar

### Current Problems
- Shows: Part Mode, X/Y/Z coordinates, display style, units, scale
- Missing: sketch status (Fully Defined / Under Defined / Over Defined)
- Missing: Confirmation Corner mode indicator
- Missing: quick-toggle for units, grid snap

### Target
- SW2010 layout (left to right):
  - **Left**: Contextual prompt/message area (current action description)
  - **Center-left**: Sketch status (if in sketch): green "Fully Defined" / blue "Under Defined" / red "Over Defined" / yellow "Invalid"
  - **Status sections**: Part Mode, X/Y/Z coordinates, display style
  - **Right section**: Units quick-switch (mm/g/inches), Grid Snap toggle icon
  - **Far right**: Kernel status indicator (small dot only, no text)
- Reduce font to ~10px (Segoe UI)
- Height: 22px (currently 26px)
- Background: `#E8E8E8` with 1px top border

### Files to Modify
| File | Changes |
|------|---------|
| `src/ui/StatusBar.tsx` | Add sketch status, kernel status dot, grid snap toggle, units quick-switch, reduce height |
| `src/app/page.tsx` | Adjust layout for shorter status bar |

---

## Phase 7: Overall Visual Theme

### Current Problems
- White/light gray backgrounds with strong shadows
- Blue `#005B9A` accent color used in title bars (SW uses flat grays)
- Gradient backgrounds on header and footer
- Panel borders too prominent

### Target
- SW2010 color palette:
  - **Main chrome background**: `#E8E8E8` (toolbars, title bars, status bar)
  - **Panel backgrounds**: `#F0F0F0`
  - **Viewport background**: gradient `#E8F0F8` → `#FFFFFF` (light blue to white)
  - **Active tab/highlight**: `#F0F0F0` with `#D0D0D0` border
  - **Selection highlight**: `#005B9A` (keep for feature selection)
  - **Text**: `#000000` (primary), `#505050` (secondary)
  - **Borders**: 1px solid `#D0D0D0`
- Remove gradient backgrounds on chrome → flat colors
- Remove all shadows (drop-shadows, box-shadows) from chrome elements
- Use 1px solid borders instead of shadows
- SW2010 panels are flat, no rounded corners

### Files to Modify
| File | Changes |
|------|---------|
| `src/app/globals.css` | Update CSS variables for SW color palette, remove shadows |
| Multiple component files | Update inline styles to use new palette |

---

## Phase 8: Polish & Validation

### Checklist
- [ ] All menu dropdowns work after TopMenu restyle
- [ ] Standard Toolbar buttons (New, Open, Save, etc.) function correctly
- [ ] Search bar renders at top-right (non-functional OK for now)
- [ ] CommandManager shows context-sensitive default tabs (Features+Sketch for part)
- [ ] Right-click on CommandManager tab bar → add/remove tabs menu
- [ ] CommandManager tabs switch correctly with visual highlight
- [ ] Left panel has 4 icon-only tabs (FeatureManager / PropertyManager / ConfigurationManager / DimXpertManager)
- [ ] Left panel tabs switch panels correctly
- [ ] Rollback Bar renders below tab strip (non-functional OK)
- [ ] Right panel shows vertical icon tab strip
- [ ] Right panel tabs switch views correctly
- [ ] Confirmation Corner appears (gray passive state), activates during commands
- [ ] Triad (XYZ indicator) renders at bottom-left of viewport
- [ ] Status bar shows sketch status (Under/Over/Fully Defined)
- [ ] Status bar has kernel status dot at far right
- [ ] Unit quick-switch and Grid Snap toggle in status bar
- [ ] No TypeScript errors
- [ ] No backend test regressions
- [ ] Production build passes (`npm run build`)

---

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Layout changes break component positioning | High | Incremental changes per phase, test after each |
| Confirmation Corner has no backend to confirm/cancel | Medium | Wire to existing `pendingFeatureCommand` store state |
| Rollback Bar has no functional backend yet | Low | Implement as UI-only (non-functional display) for now |
| Context-sensitive CommandManager tabs require document type awareness | Medium | Start with static part-mode tabs, add context later |
| Visual theming is subjective (user may disagree on colors) | Medium | Use SW2010 reference images, ask user to validate after Phase 7 |
| Removing kernel offline banner hides connectivity issues | Low | Move to status bar — still visible but less intrusive |
