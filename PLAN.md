
# 3D-Builder × SOLIDWORKS 2010 操作規範對標實施計畫

> **基準版本**: SOLIDWORKS 2010 Chinese Edition
> **計畫日期**: 2026-06-14
> **目標**: 使 3D-Builder 的操作單元與交互邏輯完全吻合 SOLIDWORKS 2010

## 摘要

本計畫將 3D-Builder 的 UI/UX 層完全重構為與 SOLIDWORKS 2010 一致的交互規範。共分為 **6 個階段**，涵蓋 Top Menu、CommandManager、PropertyManager、滑鼠交互、狀態列、Task Pane 六大核心領域，並補齊功能缺口。

## 六階段實施計畫

### Phase 1: Top Menu + 快捷鍵系統重構
- 重構 `src/ui/TopMenu.tsx` 為 SW 2010 的 10 選單結構（File/Edit/View/Insert/Features/Modifiers/Assembly/Tools/Window/Help）
- 新建 `src/utils/keyboard-shortcuts.ts` 集中管理所有快捷鍵映射
- 實現完整快捷鍵（Ctrl+N/O/S/Z/Y/C/V/Delete/F2/F8/F10/Esc/Space/Tab 等）

### Phase 2: CommandManager + Ribbon 重構
- 重構 `src/ui/RibbonBar/RibbonController.tsx` 為 SW 2010 風格的 11 個分頁（Standard/Sketch/Features/Surfaces/SheetMetal/Weldments/Annotations/DimXpert/Motion/Scheduling/SimulationXpress）
- 每個分頁的工具按 SW 2010 的分组方式重組
- 工具按鈕添加 SW 風格的圖標和工具提示

### Phase 3: PropertyManager 重構
- 重構 `PartFeaturePropertyManager.tsx` 和 `SketchPropertyManager.tsx` 為 SW 2010 風格的左側面板布局
- 實現 Rollouts 的可折疊/展開功能
- 實現 SelectionBoxes 的選擇交互
- 添加 Callouts（特徵引出選項）支持
- 添加即時 preview 功能

### Phase 4: 滑鼠交互 + S-Key 重構
- 新建 `src/utils/s-key.tsx` 環形選單組件
- 新建 `src/utils/mouse-gestures.ts` 手勢識別器
- 重構 `ContextMenu.tsx` 為 SW 2010 風格
- 在 `useSelectionLogic.ts` 中添加 Shift/Ctrl 多重選擇支持

### Phase 5: 狀態列 + Task Pane 重構
- 重構 `StatusBar.tsx` 為 SW 2010 風格的雙欄布局（定義狀態顏色指示器、坐標格式）
- 新建 `src/ui/TaskPane/TaskPane.tsx` 右側 Task Pane
- 實現 4 個標籤頁：SolidWorks 資源/設計庫/標準/注釋師

### Phase 6: 功能補齊
- 新建 `src/ui/SheetMetal/` — Flat Pattern、Bend Allowance、Forming Tools
- 新建 `src/ui/Tolerancing/` — DimXpert、TolAnalyst
- 新建 `src/ui/Weldments/` — Structural Members、Cut Lists、Weldment Features

## 測試計畫

### 交互邏輯測試
- Top Menu 完整性：逐項比對 SW 2010 選單
- 快捷鍵功能：使用 SW 2010 快捷鍵列表逐項測試
- S-Key：按 S 鍵彈出環形選單並執行命令
- PropertyManager：創建特徵並觀察 PropertyManager 布局與驗證
- 滑鼠交互：測試各種滑鼠操作
- 狀態列：切換不同模式觀察狀態列顯示

### 功能完整性測試
- Sketch/Feature/Assembly/Drawing 創建測試
- Sheet Metal/Tolerancing/Weldments 功能驗證

## 假設

1. UI 框架：現有 React + TypeScript + Tailwind CSS
2. 圖形渲染：現有 Three.js + React Three Fiber
3. 物理引擎：現有 Rapier3D
4. CAD 核心：現有 Python + OpenCASCADE 後端
5. 狀態管理：現有 Zustand
6. 優先中文介面，英文介面後續階段

## 風險與緩解

- RibbonController.tsx 過大 (80KB) → 階段二拆分為子組件
- PropertyManager 重構工作量大 → 優先核心功能，進階功能分階段
- S-Key 實現複雜度 → 使用現有環形選單庫作為基礎
- Task Pane 內容豐富 → 先框架後內容逐步填充

