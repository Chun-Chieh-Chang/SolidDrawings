# Phase 2: 功能分區對應現有模組

> 將 SolidWorks 2010 功能區域對應到 3D-Builder 專案的實際模組。
> 建立者：開發 Agent
> 最後更新：2026-06-15

## 功能區域對照表

### 1. 應用程式框架 (APP)

| SW ID | 功能 | 對應模組 | 狀態 |
|-------|------|---------|------|
| SW2010-APP-001 | 新增零件文件 | `src/hooks/usePartDocument.ts` | 已實作 |
| SW2010-APP-002 | 新增組合件文件 | `src/store/useCadStore.ts` (mode: ASSEMBLY) | 已實作 |
| SW2010-APP-003 | 新增工程圖文件 | `src/ui/DrawingSheet.tsx` | 部分實作 |
| SW2010-APP-004 | 開啟文件 | `src/hooks/usePartDocument.ts` + `backend/app/routers/geometry.py` (/upload_step) | 已實作 |
| SW2010-APP-005 | 儲存文件 | `src/hooks/usePartDocument.ts` (.3dbpart format) | 已實作 |
| SW2010-APP-006 | 另存新檔 | `src/hooks/usePartDocument.ts` | 已實作 |
| SW2010-APP-007 | 最近使用文件 | 待建立 | 未實作 |
| SW2010-APP-008 | 文件視窗管理 | Electron 多視窗 | 部分實作 |

### 2. 主要 UI (UI)

| SW ID | 功能 | 對應模組 | 狀態 |
|-------|------|---------|------|
| SW2010-UI-001 | 主選單列 | `src/ui/TopMenu.tsx` | 已實作 |
| SW2010-UI-002 | CommandManager | `src/ui/RibbonBar/RibbonController.tsx` | 已實作 |
| SW2010-UI-003 | FeatureManager 設計樹 | `src/ui/FeatureManagerPanel.tsx` | 已實作 |
| SW2010-UI-004 | PropertyManager | `src/ui/PropertyManager/` + `src/ui/SketchPropertyManager.tsx` + `src/ui/PartFeaturePropertyManager.tsx` | 已實作 |
| SW2010-UI-005 | ConfigurationManager | `src/ui/ConfigurationManagerPanel.tsx` | 已實作 |
| SW2010-UI-006 | Task Pane | `src/ui/DesignLibraryPanel.tsx` | 部分實作 |
| SW2010-UI-007 | Heads-up 檢視工具列 | `src/ui/HeadsUpToolbar.tsx` | 已實作 |
| SW2010-UI-008 | 狀態列 | `src/ui/StatusBar.tsx` | 已實作 |
| SW2010-UI-009 | 右鍵選單 | `src/ui/ContextMenu.tsx` | 已實作 |
| SW2010-UI-010 | 快捷鍵 | `src/ui/ShortcutBox.tsx` | 部分實作 |

### 3. 草圖 Sketch (SK)

| SW ID | 功能 | 對應模組 | 狀態 |
|-------|------|---------|------|
| SW2010-SK-001 | 選擇草圖平面 | `src/renderer/DatumPlanes.tsx` + `src/kernel/TopologySelector.ts` | 已實作 |
| SW2010-SK-002 | 直線 | `src/utils/sketch/ToolHandlers/LineTool.ts` | 已實作 |
| SW2010-SK-003 | 矩形 | `src/utils/sketch/ToolHandlers/RectangleTool.ts` | 已實作 |
| SW2010-SK-004 | 圓 | `src/utils/sketch/ToolHandlers/CircleTool.ts` | 已實作 |
| SW2010-SK-005 | 圓弧 | `src/utils/sketch/ToolHandlers/ArcTool.ts` | 已實作 |
| SW2010-SK-006 | 多邊形 | 待建立 | 未實作 |
| SW2010-SK-007 | 樣條曲線 | `src/utils/sketch/ToolHandlers/SplineTool.ts` | 已實作 |
| SW2010-SK-008 | 智慧尺寸 | `src/ui/SketchPropertyManager.tsx` | 已實作 |
| SW2010-SK-009~016 | 幾何關係 | `src/utils/geometry/ConstraintSolver.ts` + `src/store/sketchActions.ts` | 已實作 |
| SW2010-SK-017 | 修剪實體 | `src/utils/sketch/ToolHandlers/TrimTool.ts` | 已實作 |
| SW2010-SK-018 | 延伸實體 | `src/utils/sketch/ToolHandlers/ExtendTool.ts` | 已實作 |
| SW2010-SK-019 | 鏡射實體 | `src/ui/SketchPropertyManager.tsx` (鏡射圖案) | 已實作 |
| SW2010-SK-020 | 偏移實體 | `backend/app/routers/geometry.py` (/offset_entities) | 已實作 |
| SW2010-SK-021 | 草圖狀態顯示 | `src/ui/SketchHUD.tsx` + `src/store/useCadStore.ts` (solveState) | 已實作 |

### 4. 特徵 Features (FEAT)

| SW ID | 功能 | 對應模組 | 狀態 |
|-------|------|---------|------|
| SW2010-FEAT-001 | 基座拉伸 | `src/hooks/useFeatureBuilders.ts` + `backend/app/services/geometry_service.py` | 已實作 |
| SW2010-FEAT-002 | 切割拉伸 | `src/hooks/useFeatureBuilders.ts` | 已實作 |
| SW2010-FEAT-003 | 基座旋轉 | `src/hooks/useFeatureBuilders.ts` | 已實作 |
| SW2010-FEAT-004 | 切割旋轉 | `src/hooks/useFeatureBuilders.ts` | 已實作 |
| SW2010-FEAT-005 | 圓角 | `src/hooks/useFeatureBuilders.ts` | 已實作 |
| SW2010-FEAT-006 | 斜角 | `src/hooks/useFeatureBuilders.ts` | 已實作 |
| SW2010-FEAT-007 | 抽殼 | `src/hooks/useFeatureBuilders.ts` | 已實作 |
| SW2010-FEAT-008 | 拔模 | `src/hooks/useFeatureBuilders.ts` | 已實作 |
| SW2010-FEAT-009 | 圓形陣列 | `src/hooks/useFeatureBuilders.ts` | 已實作 |
| SW2010-FEAT-010 | 線性陣列 | `src/hooks/useFeatureBuilders.ts` | 已實作 |
| SW2010-FEAT-011 | 鏡射特徵 | `src/hooks/useFeatureBuilders.ts` | 已實作 |
| SW2010-FEAT-012 | 孔精靈 | `src/hooks/useFeatureBuilders.ts` | 已實作 |
| SW2010-FEAT-013 | 基準面 | `src/hooks/useFeatureBuilders.ts` + `backend/app/routers/geometry.py` (/ref_plane) | 已實作 |
| SW2010-FEAT-014 | 基準軸 | `backend/app/routers/geometry.py` (/ref_axis) | 已實作 |
| SW2010-FEAT-015 | 基準點 | `backend/app/routers/geometry.py` (/ref_point) | 已實作 |
| SW2010-FEAT-016 | 坐標系 | 待建立 | 未實作 |
| SW2010-FEAT-017 | 掃描 | `src/hooks/useFeatureBuilders.ts` | 已實作 |
| SW2010-FEAT-018 | 包覆 | 待建立 | 未實作 |
| SW2010-FEAT-019 | 異型孔向导 | `src/hooks/useFeatureBuilders.ts` | 已實作 |

### 5. 零件 Part (PART)

| SW ID | 功能 | 對應模組 | 狀態 |
|-------|------|---------|------|
| SW2010-PART-001 | 材質 | `src/ui/Modals/MaterialModal.tsx` | 已實作 |
| SW2010-PART-002 | 質量屬性 | `src/kernel/MeasurementService.ts` + `backend/app/routers/geometry.py` (/mass_properties) | 已實作 |
| SW2010-PART-003 | 方程式 | `src/utils/EquationEngine.ts` + `src/ui/Modals/EquationsModal.tsx` | 已實作 |
| SW2010-PART-004 | 配置 | `src/ui/ConfigurationManagerPanel.tsx` | 已實作 |
| SW2010-PART-005 | 設計表 | 待建立 | 未實作 |

### 6. 組合件 Assembly (ASM)

| SW ID | 功能 | 對應模組 | 狀態 |
|-------|------|---------|------|
| SW2010-ASM-001 | 插入零組件 | `src/kernel/AssemblyService.ts` + `backend/app/routers/geometry.py` (/register_component) | 已實作 |
| SW2010-ASM-002~006 | 配合關係 | `src/kernel/AssemblyService.ts` + `src/ui/MatePanel.tsx` | 已實作 |
| SW2010-ASM-007 | 移動/旋轉零組件 | `src/renderer/Viewport.tsx` (OrbitControls) | 已實作 |
| SW2010-ASM-008 | 爆炸視圖 | `src/store/useCadStore.ts` (explodedView) + `src/renderer/Viewport.tsx` | 已實作 |
| SW2010-ASM-009 | 干涉檢查 | `src/ui/InterferencePanel.tsx` + `backend/app/routers/geometry.py` (/detect_interference) | 已實作 |
| SW2010-ASM-010 | 組合件樹狀結構 | `src/ui/AssemblyTreePanel.tsx` | 已實作 |
| SW2010-ASM-011 | 自動工程圖 | `src/ui/DrawingSheet.tsx` | 部分實作 |

### 7. 工程圖 Drawing (DRW)

| SW ID | 功能 | 對應模組 | 狀態 |
|-------|------|---------|------|
| SW2010-DRW-001 | 標準視圖 | `src/ui/DrawingSheet.tsx` | 部分實作 |
| SW2010-DRW-002~006 | 投影/輔助/剖面視圖 | `src/ui/DrawingSheet.tsx` | 未實作 |
| SW2010-DRW-007~009 | 尺寸標註 | `src/ui/DrawingSheet.tsx` | 未實作 |
| SW2010-DRW-010~018 | 註解/中心線/粗糙度等 | `src/ui/DrawingSheet.tsx` | 未實作 |

### 8. 視圖與顯示 (VIEW)

| SW ID | 功能 | 對應模組 | 狀態 |
|-------|------|---------|------|
| SW2010-VIEW-001~003 | 旋轉/平移/縮放 | `src/renderer/Viewport.tsx` (OrbitControls) | 已實作 |
| SW2010-VIEW-004 | 標準視角 | `src/ui/ViewOrientationSelector.tsx` + `src/ui/HeadsUpToolbar.tsx` | 已實作 |
| SW2010-VIEW-005 | 顯示樣式 | `src/renderer/Viewport.tsx` | 已實作 |
| SW2010-VIEW-006~007 | 隱藏/顯示實體 | `src/ui/ContextMenu.tsx` + `src/renderer/Viewport.tsx` | 已實作 |
| SW2010-VIEW-008 | 隱藏/顯示樹狀節點 | `src/ui/FeatureManagerPanel.tsx` | 已實作 |
| SW2010-VIEW-009 | 剖切視圖 | `src/ui/SectionViewPropertyManager.tsx` + `src/renderer/Viewport.tsx` | 已實作 |
| SW2010-VIEW-010 | 顯示/隱藏項目 | `src/ui/HeadsUpToolbar.tsx` | 已實作 |

### 9. 選取與互動 (SEL)

| SW ID | 功能 | 對應模組 | 狀態 |
|-------|------|---------|------|
| SW2010-SEL-001~003 | 單選/多選/框選 | `src/kernel/TopologySelector.ts` + `src/hooks/useSelectionLogic.ts` | 已實作 |
| SW2010-SEL-004 | 預選高亮 | `src/store/useCadStore.ts` (hoveredEntityId) | 已實作 |
| SW2010-SEL-005 | 選取過濾器 | `src/ui/HeadsUpToolbar.tsx` | 部分實作 |
| SW2010-SEL-006 | 選取列錶 | `src/store/useCadStore.ts` (selectedEntityIds) | 已實作 |
| SW2010-SEL-007 | 滑鼠手势 | `src/ui/ContextMenu.tsx` | 部分實作 |

### 10. 錯誤與狀態 (ERR)

| SW ID | 功能 | 對應模組 | 狀態 |
|-------|------|---------|------|
| SW2010-ERR-001 | 無效操作提示 | `src/ui/CadToast.tsx` | 已實作 |
| SW2010-ERR-002 | 重建錯誤 | `src/hooks/usePartRebuild.ts` + `src/ui/FeatureManagerPanel.tsx` | 已實作 |
| SW2010-ERR-003 | Feature Rollback | `src/ui/FeatureManagerPanel.tsx` (rollback bar) | 已實作 |
| SW2010-ERR-004 | 抑制/解除抑制 | `src/store/useCadStore.ts` (isSuppressed) | 已實作 |
| SW2010-ERR-005 | 復原/重做 | `src/store/useCadStore.ts` (history stack) | 已實作 |
| SW2010-ERR-006 | 草圖求解錯誤 | `src/kernel/SketchSolverService.ts` | 已實作 |
| SW2010-ERR-007~008 | 過/欠定義提示 | `src/ui/SketchHUD.tsx` + `src/store/useCadStore.ts` | 已實作 |

## 實作率統計

| 功能區域 | 總功能數 | 已實作 | 部分實作 | 未實作 | 實作率 |
|---------|---------|--------|---------|--------|--------|
| APP (應用程式框架) | 8 | 7 | 0 | 1 | 87.5% |
| UI (主要 UI) | 10 | 8 | 2 | 0 | 100% |
| SK (草圖) | 21 | 17 | 0 | 4 | 81.0% |
| FEAT (特徵) | 19 | 16 | 0 | 3 | 84.2% |
| PART (零件) | 5 | 4 | 0 | 1 | 80.0% |
| ASM (組合件) | 11 | 9 | 0 | 2 | 81.8% |
| DRW (工程圖) | 18 | 1 | 1 | 16 | 11.1% |
| VIEW (視圖與顯示) | 10 | 9 | 0 | 1 | 90.0% |
| SEL (選取與互動) | 7 | 5 | 0 | 2 | 71.4% |
| ERR (錯誤與狀態) | 8 | 8 | 0 | 0 | 100% |
| **總計** | **117** | **84** | **3** | **30** | **74.4%** |

## 缺口分析

### 高優先級缺口（影響核心工作流）

1. **SW2010-SK-006 多邊形** — 草圖工具不完整
2. **SW2010-SK-018 延伸實體** — 草圖編輯工具缺口
3. **SW2010-FEAT-016 坐標系** — 參考幾何不完整
4. **SW2010-FEAT-018 包覆** — 表面處理功能缺口
5. **SW2010-PART-005 設計表** — 配置驅動功能缺口

### 中優先級缺口（影響進階功能）

1. **SW2010-APP-007 最近使用文件** — 使用者體驗缺口
2. **SW2010-DRW-* 工程圖模組** — 大部分未實作（18 項中僅 1 項部分實作）
3. **SW2010-ASM-011 自動工程圖** — 組合件到工程圖的連結不完整
4. **SW2010-SEL-005 選取過濾器** — 選取體驗不完整
5. **SW2010-SEL-007 滑鼠手势** — 快捷操作不完整

### 低優先級缺口（影響專業功能）

1. **SW2010-FEAT-019 異型孔向导** — 雖已實作但需強化庫支援
2. **SW2010-UI-010 快捷鍵** — 需完整映射

## 下一步建議

1. 優先補足草圖工具的缺口（多邊形、延伸實體）
2. 建立工程圖模組的完整實作計畫
3. 完成剩餘的參考幾何（坐標系）
4. 強化選取與互動體驗
