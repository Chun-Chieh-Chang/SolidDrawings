# Task Plan - SW2000 Industrial Parity (Phases 92-100)

## Goal
Transform 3D-Builder from a functional prototype into a 1:1 SolidWorks 2000 industrial-grade modeling software. This includes professionalizing the UI (PropertyManager 2.0), completing the feature set (Sweep, Loft, Draft), and ensuring high engineering robustness (TNS 2.0).

## Phases
| Phase | Title | Status | Description |
|-------|-------|--------|-------------|
| 92 | PropertyManager 2.0 | complete | Rollout-based wizard UI for features |
| 93 | Reference Geometry | complete | Standard industrial reference planes and axes |
| 94 | Sweep & Loft | complete | Advanced geometry construction |
| 95 | TNS 2.0 (Persistence) | complete | Robust topological naming system |
| 96 | Engineering Drawing | complete | Automatic BOM and professional annotations |
| 97 | Configuration Manager | complete | Part variations and feature suppression |
| 98 | Equations & Variables | complete | Parametric formulas and global variables |
| 99 | Mechanical Mates | complete | Gear, Screw, and dynamic assembly constraints |
| 100 | Final Polish & Toolbox | complete | Standard library and SW2000 aesthetic finish |
| 101 | Industrial Reinforcements | complete | Integrated Draft, Advanced Surfacing, and Surfaces Tab |
| 118 | UI 模組化與交接基準點建立 | complete | 拆解 `page.tsx` 冗餘邏輯，建立 v1.1 交接文檔與開發日誌 |
| 119 | Project Cleanup & MECE | complete | 移除冗餘腳本、資產與中間產物，歸檔架構文件，建立 v1.1 乾淨基準點 |
| 120 | SkillsBuilder: Exercise 6 | complete | 解析影片 6XyeGEqHrjI 並透過 Hybrid Verification 完成建模驗證 |
| 121 | SkillsBuilder: Exercise 1 | complete | 解析影片 FqK9rs50upg 並完成帶有角度約束之幾何驗證 |
| 122 | SkillsBuilder: CADable Ex 5 | complete | 解析影片 soEP5_cBqMI 並完成替代方案 (Sketch Fillet -> 3D Fillet) 驗證 |
| 123 | SkillsBuilder: Beginner Tutorial | complete | 解析影片 cWWP_-QRdkg，驗證基礎約束與等效旋轉特徵 |
| 124 | SkillsBuilder: Exercise 11 | complete | 解析影片 -LL3eSTyWe8，驗證圓柱特徵、同心約束與環狀陣列 |
| 125 | SkillsBuilder: Plummer Block Base | complete | 解析影片 mOU5bb50pgs，驗證相切約束與多重輪廓擠出 |

## Phase 101 Details: Industrial Reinforcements
- [x] Backend: Refine integrated **Draft logic** in Extrude using OpenCASCADE history (`prism_tool.Generated`).
- [x] Backend: Implement **Surface Offset** (`BRepOffsetAPI_MakeOffsetShape`) for complex surface creation.
- [x] Backend: Implement **Surface Knit** (`BRepBuilderAPI_Sewing`) to merge open shells into manifold bodies.
- [x] UI: Add a dedicated **SURFACING** tab to the RibbonBar with professional industrial icons.
- [x] UI: Integrate **Draft Rollout** and **Surface Mode** toggle into the Extrude PropertyManager.
- [x] UI: Implement specialized PropertyManager UI for Surface Offset and Knit features.
- [x] Stability: Verified that drafted extrusions and offset surfaces rebuild correctly under TNS 2.0.

## Phase 100 Details: Final Polish & Toolbox
- [x] Implement **Design Library** panel in the right-side task pane.
- [x] Create **Standard Fastener Generators** (ISO Metric Bolts, Nuts) that automatically generate geometry based on size (M3, M4, M5, etc.).
- [x] UI: Standardize all icons to a high-contrast industrial style (using custom SVG sets).
- [x] UI: Implement **PropertyManager Tabs** (General, Custom) for better parameter organization.
- [x] UI: Final polish of the **Feature Tree** (Icons for each feature type, suppression visuals).
- [x] Performance: Final audit of `usePartRebuild` and `AssemblySolver` for high-complexity models.
- [x] Documentation: Final update of `README.md` and `HANDOVER_RESUME_GUIDE.md` for 1.0 release.

## Phase 99 Details: Mechanical Mates
- [x] Backend: Update `solve_assembly_mates` in `assembly_solver.py` to support coupling constraints.
- [x] Implement **Gear Mate** logic: coupling rotational angles of two components around their respective axes.
- [x] Implement **Screw Mate** logic: coupling rotational angle of one component to the translation of another.
- [x] UI: Update `MatePanel.tsx` to include "Mechanical Mates" category.
- [x] UI: Add inputs for **Gear Ratio** and **Screw Pitch** in the MatePanel.
- [x] Verify functional machine motion (e.g., turning a gear rotates the connected gear) in the assembly environment.

## Phase 118 Details: UI 模組化與交接基準點建立
- [x] Plan: 拆解 `page.tsx` 冗餘邏輯，建立 v1.1 交接文檔與開發日誌。
- [x] Do: 
  - 實作 `FeatureManagerPanel.tsx` 模組化。
  - 更新 `handover_resume_guide.md` 與 `DEV_LOG.md`。
  - 清理冗餘狀態與代碼。
- [x] Check: `npx tsc --noEmit` 通過。
- [x] Act: 準備推送至 Github。

---

## Current Status
- [x] Phase 92-101: SW2000 Industrial Parity
- [x] Phase 111-117: Stability & Reality Audit
- [x] Phase 118: UI Modularization & Baseline
- [x] Phase 119: Project Cleanup & MECE
- [x] Phase 120: SkillsBuilder: Exercise 6
- [x] Phase 121: SkillsBuilder: Exercise 1
- [x] Phase 122: SkillsBuilder: CADable Ex 5
- [x] Phase 123: SkillsBuilder: Beginner Tutorial
- [x] Phase 124: SkillsBuilder: Exercise 11
- [x] Phase 125: SkillsBuilder: Plummer Block Base

## Current Phase
All high-priority SolidWorks alignment and structural cleanup phases completed. Exercise 6 verification successful. v1.1 established.
