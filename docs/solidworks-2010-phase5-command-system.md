# Phase 5: 命令系統 (Command Registry) 規格

> 定義統一的命令系統，所有互動都走 Command Pipeline，方便測試與追蹤。
> 建立者：開發 Agent
> 最後更新：2026-06-15
> 基準：solidworks-2010-alignment-plan.md Phase 5

## 1. 架構概述

### 1.1 現有架構

```
UI (Ribbon/Menu/Shortcut)
  ↓
Hooks (Business Logic Layer)
  ↓
Zustand Store (State Management)
  ↓
Kernel/Backend (Geometry Engine)
```

### 1.2 目標架構

```
UI (Ribbon/Menu/Shortcut)
  ↓
Command Registry (Command Dispatch)
  ↓
Command Pipeline (enabledWhen → execute → undo/redo)
  ↓
Zustand Store (State Management)
  ↓
Kernel/Backend (Geometry Engine)
```

### 1.3 變更重點

| 層面 | 現狀 | 目標 |
|------|------|------|
| 命令註冊 | 分散在各 hooks | 集中 CommandRegistry |
| 命令觸發 | UI 直接呼叫 hooks | UI 呼叫 registry.execute(id) |
| enabledWhen | 分散在組件的 disabled prop | 統一在 Command 定義中 |
| undo/redo | 部分實作（Feature 操作有 snapshot） | 所有命令支援 undo/redo |
| 追蹤 | 無 | 每個命令有 ID + manualRef + testId |
| 測試 | 無命令層測試 | 每個命令可被測試直接呼叫 |

---

## 2. Command 介面定義

### 2.1 ICommand 介面

```typescript
interface ICommand<TParams = any, TResult = any> {
  // 基本資訊
  id: string;              // 命令唯一 ID (格式: CMD-{AREA}-{SEQ})
  label: string;           // 顯示名稱（本地化）
  manualRef: string;       // 手冊 URL 引用
  description: string;     // 命令描述
  
  // 執行條件
  enabledWhen: (state: CadState) => boolean;  // 啟用條件
  
  // 執行階段
  execute: (
    params: TParams,
    state: CadState,
    dispatch: Dispatch
  ) => Promise<TResult>;
  
  // 復原（可選，不支援復原的命令設為 null）
  undo: (
    result: TResult,
    state: CadState,
    dispatch: Dispatch
  ) => Promise<void>;
  
  // 重做（可選）
  redo: (
    result: TResult,
    state: CadState,
    dispatch: Dispatch
  ) => Promise<void>;
  
  // UI 入口
  uiEntrypoints: UIEntryPoint[];
  
  // 測試
  testIds: string[];
}
```

### 2.2 UIEntryPoint

```typescript
interface UIEntryPoint {
  type: 'MENU' | 'RIBBON' | 'CONTEXT_MENU' | 'SHORTCUT' | 'TOOLBAR';
  location: string;        // 選單路徑或工具列名稱
  shortcut?: string;       // 快捷鍵（如 "Ctrl+S"）
  icon?: string;           // 圖示名稱
}
```

### 2.3 CommandResult

```typescript
interface CommandResult {
  success: boolean;
  commandId: string;
  timestamp: string;
  data?: any;
  error?: {
    code: string;
    message: string;
    severity: 'ERROR' | 'WARNING';
  };
}
```

### 2.4 CommandLogEntry

```typescript
interface CommandLogEntry {
  id: string;              // UUID
  commandId: string;
  action: 'EXECUTE' | 'UNDO' | 'REDO';
  timestamp: string;
  params: any;
  result: CommandResult;
  stackTrace?: string;
}
```

---

## 3. Command Registry 介面

### 3.1 ICommandRegistry

```typescript
interface ICommandRegistry {
  // 註冊
  register<TParams, TResult>(command: ICommand<TParams, TResult>): void;
  
  // 查詢
  get(commandId: string): ICommand | undefined;
  getAll(): ICommand[];
  getByArea(area: string): ICommand[];
  
  // 執行
  execute<TParams, TResult>(
    commandId: string,
    params: TParams
  ): Promise<CommandResult>;
  
  // 狀態查詢
  isEnabled(commandId: string, state: CadState): boolean;
  getEnabledCommands(state: CadState): string[];
  
  // 復原/重做
  undo(commandId: string, result: any): Promise<void>;
  redo(commandId: string, result: any): Promise<void>;
  
  // 日誌
  getLog(): CommandLogEntry[];
  getLogSince(timestamp: string): CommandLogEntry[];
  clearLog(): void;
  
  // 事件
  onExecute(callback: (entry: CommandLogEntry) => void): void;
  onError(callback: (entry: CommandLogEntry) => void): void;
}
```

### 3.2 CommandRegistry 實作要點

- 使用 WeakMap 或 Map 儲存命令註冊表
- `execute()` 方法必須：
  1. 檢查 `enabledWhen`
  2. 記錄執行前狀態（用於 undo/redo）
  3. 呼叫 `execute()`
  4. 記錄 CommandLogEntry
  5. 觸發 onExecute 事件
- 所有錯誤必須被 catch 並記錄為 CommandLogEntry（action=EXECUTE, result.success=false）

---

## 4. 命令清單

### 4.1 應用程式命令 (APP)

| ID | 命令 ID | 標籤 | manualRef | enabledWhen | uiEntrypoints | testId |
|----|---------|------|-----------|-------------|---------------|--------|
| CMD-APP-001 | `NEW_PART` | 新增零件 | /app/new-part | always | MENU(File), RIBBON(Import) | TEST-CMD-APP-001 |
| CMD-APP-002 | `NEW_ASSEMBLY` | 新增組合件 | /app/new-assembly | always | MENU(File) | TEST-CMD-APP-002 |
| CMD-APP-003 | `NEW_DRAWING` | 新增工程圖 | /app/new-drawing | always | MENU(File) | TEST-CMD-APP-003 |
| CMD-APP-004 | `OPEN_FILE` | 開啟文件 | /app/open | always | MENU(File), SHORTCUT(Ctrl+O) | TEST-CMD-APP-004 |
| CMD-APP-005 | `SAVE_FILE` | 儲存文件 | /app/save | hasDocument | MENU(File), SHORTCUT(Ctrl+S) | TEST-CMD-APP-005 |
| CMD-APP-006 | `SAVE_AS_FILE` | 另存新檔 | /app/save-as | hasDocument | MENU(File) | TEST-CMD-APP-006 |
| CMD-APP-007 | `EXPORT_FILE` | 匯出 | /app/export | hasDocument | MENU(File), SHORTCUT(Ctrl+E) | TEST-CMD-APP-007 |
| CMD-APP-008 | `CLOSE_FILE` | 關閉文件 | /app/close | hasDocument | MENU(File) | TEST-CMD-APP-008 |
| CMD-APP-009 | `RECENT_FILE_OPEN` | 開啟最近文件 | /app/recent-files | hasRecentFiles | MENU(File) | TEST-CMD-APP-009 |

### 4.2 編輯命令 (EDIT)

| ID | 命令 ID | 標籤 | manualRef | enabledWhen | uiEntrypoints | testId |
|----|---------|------|-----------|-------------|---------------|--------|
| CMD-EDIT-001 | `UNDO` | 復原 | /err/undo-redo | hasUndoHistory | MENU(Edit), SHORTCUT(Ctrl+Z) | TEST-CMD-EDIT-001 |
| CMD-EDIT-002 | `REDO` | 重做 | /err/undo-redo | hasRedoHistory | MENU(Edit), SHORTCUT(Ctrl+Y) | TEST-CMD-EDIT-002 |
| CMD-EDIT-003 | `DELETE` | 刪除 | /err/invalid-action | hasSelection | MENU(Edit), CONTEXT, SHORTCUT(Del) | TEST-CMD-EDIT-003 |
| CMD-EDIT-004 | `COPY` | 複製 | — | hasSelection | MENU(Edit) | TEST-CMD-EDIT-004 |
| CMD-EDIT-005 | `PASTE` | 貼上 | — | clipboardHasData | MENU(Edit) | TEST-CMD-EDIT-005 |

### 4.3 草圖命令 (SKETCH)

| ID | 命令 ID | 標籤 | manualRef | enabledWhen | uiEntrypoints | testId |
|----|---------|------|-----------|-------------|---------------|--------|
| CMD-SK-001 | `SELECT_PLANE` | 選擇草圖平面 | /sketch/plane-select | inPartMode | RIBBON(SKETCH), FEATURE_MANAGER | TEST-CMD-SK-001 |
| CMD-SK-002 | `DRAW_LINE` | 直線 | /sketch/line | inSketchMode | RIBBON(SKETCH), SHORTCUT(L) | TEST-CMD-SK-002 |
| CMD-SK-003 | `DRAW_RECTANGLE` | 矩形 | /sketch/rectangle | inSketchMode | RIBBON(SKETCH) | TEST-CMD-SK-003 |
| CMD-SK-004 | `DRAW_CIRCLE` | 圓 | /sketch/circle | inSketchMode | RIBBON(SKETCH), SHORTCUT(C) | TEST-CMD-SK-004 |
| CMD-SK-005 | `DRAW_ARC` | 圓弧 | /sketch/arc | inSketchMode | RIBBON(SKETCH), SHORTCUT(A) | TEST-CMD-SK-005 |
| CMD-SK-006 | `DRAW_POLYGON` | 多邊形 | /sketch/polygon | inSketchMode | RIBBON(SKETCH) | TEST-CMD-SK-006 |
| CMD-SK-007 | `DRAW_SPLINE` | 樣條曲線 | /sketch/spline | inSketchMode | RIBBON(SKETCH) | TEST-CMD-SK-007 |
| CMD-SK-008 | `SMART_DIMENSION` | 智慧尺寸 | /sketch/smart-dimension | inSketchMode | RIBBON(SKETCH) | TEST-CMD-SK-008 |
| CMD-SK-009 | `CONSTRAINT_HORIZONTAL` | 水平關係 | /sketch/rel-horizontal | hasSketchSelection | RIBBON(SKETCH), CONTEXT | TEST-CMD-SK-009 |
| CMD-SK-010 | `CONSTRAINT_VERTICAL` | 垂直關係 | /sketch/rel-vertical | hasSketchSelection | RIBBON(SKETCH), CONTEXT | TEST-CMD-SK-010 |
| CMD-SK-011 | `CONSTRAINT_TANGENT` | 相切關係 | /sketch/rel-tangent | hasSketchSelection | RIBBON(SKETCH), CONTEXT | TEST-CMD-SK-011 |
| CMD-SK-012 | `CONSTRAINT_CONCENTRIC` | 同心關係 | /sketch/rel-concentric | hasSketchSelection | RIBBON(SKETCH), CONTEXT | TEST-CMD-SK-012 |
| CMD-SK-013 | `TRIM_ENTITIES` | 修剪實體 | /sketch/trim | inSketchMode | RIBBON(SKETCH) | TEST-CMD-SK-013 |
| CMD-SK-014 | `EXTEND_ENTITIES` | 延伸實體 | /sketch/extend | inSketchMode | RIBBON(SKETCH) | TEST-CMD-SK-014 |
| CMD-SK-015 | `MIRROR_ENTITIES` | 鏡射實體 | /sketch/mirror-entity | inSketchMode, hasSelection | RIBBON(SKETCH) | TEST-CMD-SK-015 |
| CMD-SK-016 | `OFFSET_ENTITIES` | 偏移實體 | /sketch/offet-entity | inSketchMode, hasSelection | RIBBON(SKETCH) | TEST-CMD-SK-016 |
| CMD-SK-017 | `CONVERT_ENTITIES` | 轉換實體 | — | inSketchMode, hasTopology | RIBBON(SKETCH) | TEST-CMD-SK-017 |
| CMD-SK-018 | `EXIT_SKETCH` | 退出草圖 | /sketch/plane-select | inSketchMode | RIBBON(SKETCH), CONTEXT | TEST-CMD-SK-018 |
| CMD-SK-019 | `EXIT_AND_EXTRUDE` | 退出並拉伸 | /feat/extrude-boss | inSketchMode, hasClosedLoop | RIBBON(FEATURES) | TEST-CMD-SK-019 |

### 4.4 特徵命令 (FEATURE)

| ID | 命令 ID | 標籤 | manualRef | enabledWhen | uiEntrypoints | testId |
|----|---------|------|-----------|-------------|---------------|--------|
| CMD-FEAT-001 | `EXTRUDE_BOSS` | 基座拉伸 | /feat/extrude-boss | hasValidProfile | RIBBON(FEATURES) | TEST-CMD-FEAT-001 |
| CMD-FEAT-002 | `EXTRUDE_CUT` | 切割拉伸 | /feat/extrude-cut | hasValidProfile | RIBBON(FEATURES) | TEST-CMD-FEAT-002 |
| CMD-FEAT-003 | `REVOLVE_BOSS` | 基座旋轉 | /feat/revolve-boss | hasValidProfileAndAxis | RIBBON(FEATURES) | TEST-CMD-FEAT-003 |
| CMD-FEAT-004 | `REVOLVE_CUT` | 切割旋轉 | /feat/revolve-cut | hasValidProfileAndAxis | RIBBON(FEATURES) | TEST-CMD-FEAT-004 |
| CMD-FEAT-005 | `SWEEP` | 掃描 | /feat/sweep | hasProfileAndPath | RIBBON(FEATURES) | TEST-CMD-FEAT-005 |
| CMD-FEAT-006 | `LOFT` | 放樣 | /feat/loft | has2PlusProfiles | RIBBON(FEATURES) | TEST-CMD-FEAT-006 |
| CMD-FEAT-007 | `FILLET` | 圓角 | /feat/fillet | hasEdgeSelection | RIBBON(FEATURES) | TEST-CMD-FEAT-007 |
| CMD-FEAT-008 | `CHAMFER` | 斜角 | /feat/chamfer | hasEdgeSelection | RIBBON(FEATURES) | TEST-CMD-FEAT-008 |
| CMD-FEAT-009 | `SHELL` | 抽殼 | /feat/shell | hasBodySelection | RIBBON(FEATURES) | TEST-CMD-FEAT-009 |
| CMD-FEAT-010 | `DRAFT` | 拔模 | /feat/draft | hasBodySelection | RIBBON(FEATURES) | TEST-CMD-FEAT-010 |
| CMD-FEAT-011 | `LINEAR_PATTERN` | 線性陣列 | /feat/linear-pattern | hasFeatureSelection | RIBBON(FEATURES) | TEST-CMD-FEAT-011 |
| CMD-FEAT-012 | `CIRCULAR_PATTERN` | 圓形陣列 | /feat/circular-pattern | hasFeatureSelection | RIBBON(FEATURES) | TEST-CMD-FEAT-012 |
| CMD-FEAT-013 | `MIRROR_FEATURE` | 鏡射特徵 | /feat/mirror-feature | hasFeatureSelection | RIBBON(FEATURES) | TEST-CMD-FEAT-013 |
| CMD-FEAT-014 | `HOLE_WIZARD` | 孔精靈 | /feat/hole-wizard | hasFaceSelection | RIBBON(FEATURES) | TEST-CMD-FEAT-014 |
| CMD-FEAT-015 | `REFERENCE_PLANE` | 基準面 | /feat/reference-plane | hasDocument | RIBBON(FEATURES) | TEST-CMD-FEAT-015 |
| CMD-FEAT-016 | `REFERENCE_AXIS` | 基準軸 | /feat/reference-axis | hasDocument | RIBBON(FEATURES) | TEST-CMD-FEAT-016 |
| CMD-FEAT-017 | `REFERENCE_POINT` | 基準點 | /feat/reference-point | hasDocument | RIBBON(FEATURES) | TEST-CMD-FEAT-017 |
| CMD-FEAT-018 | `SUPPRESS_FEATURE` | 抑制特徵 | /err/suppress | hasFeatureSelection | CONTEXT, FEATURE_MANAGER | TEST-CMD-FEAT-018 |
| CMD-FEAT-019 | `UNSUPPRESS_FEATURE` | 解除抑制 | /err/suppress | hasSuppressedSelection | CONTEXT, FEATURE_MANAGER | TEST-CMD-FEAT-019 |
| CMD-FEAT-020 | `EDIT_FEATURE` | 編輯特徵 | /err/rebuild-error | hasFeatureSelection | CONTEXT, FEATURE_MANAGER | TEST-CMD-FEAT-020 |
| CMD-FEAT-021 | `DELETE_FEATURE` | 刪除特徵 | /err/invalid-action | hasFeatureSelection | CONTEXT, SHORTCUT(Del) | TEST-CMD-FEAT-021 |
| CMD-FEAT-022 | `REBUILD` | 重建 | /err/rebuild-error | hasDirtyFlag | RIBBON(FEATURES) | TEST-CMD-FEAT-022 |

### 4.5 組合件命令 (ASSEMBLY)

| ID | 命令 ID | 標籤 | manualRef | enabledWhen | uiEntrypoints | testId |
|----|---------|------|-----------|-------------|---------------|--------|
| CMD-ASM-001 | `INSERT_COMPONENT` | 插入零組件 | /asm/insert-component | inAssemblyMode | RIBBON(ASSEMBLY), MENU(Insert) | TEST-CMD-ASM-001 |
| CMD-ASM-002 | `APPLY_MATE` | 應用配合 | /asm/mate-standard | inAssemblyMode, has2Selections | RIBBON(ASSEMBLY), MATE_PANEL | TEST-CMD-ASM-002 |
| CMD-ASM-003 | `EDIT_MATE` | 編輯配合 | /asm/mate-standard | hasMateSelection | CONTEXT | TEST-CMD-ASM-003 |
| CMD-ASM-004 | `DELETE_MATE` | 刪除配合 | /asm/mate-standard | hasMateSelection | CONTEXT | TEST-CMD-ASM-004 |
| CMD-ASM-005 | `MOVE_COMPONENT` | 移動零組件 | /asm/move-rotate | inAssemblyMode | RIBBON(ASSEMBLY) | TEST-CMD-ASM-005 |
| CMD-ASM-006 | `EXPLODE_VIEW` | 爆炸視圖 | /asm/explode | inAssemblyMode | RIBBON(ASSEMBLY) | TEST-CMD-ASM-006 |
| CMD-ASM-007 | `INTERFERENCE_CHECK` | 干涉檢查 | /asm/interference-check | inAssemblyMode, has2PlusComponents | RIBBON(EVALUATE) | TEST-CMD-ASM-007 |

### 4.6 檢視命令 (VIEW)

| ID | 命令 ID | 標籤 | manualRef | enabledWhen | uiEntrypoints | testId |
|----|---------|------|-----------|-------------|---------------|--------|
| CMD-VIEW-001 | `ZOOM_TO_FIT` | 縮放到適中 | /view/zoom | has3DView | HEADS_UP_TOOLBAR | TEST-CMD-VIEW-001 |
| CMD-VIEW-002 | `SET_FRONT_VIEW` | 前視 | /view/standard-views | has3DView | HEADS_UP_TOOLBAR, SHORTCUT(F) | TEST-CMD-VIEW-002 |
| CMD-VIEW-003 | `SET_TOP_VIEW` | 上視 | /view/standard-views | has3DView | HEADS_UP_TOOLBAR, SHORTCUT(T) | TEST-CMD-VIEW-003 |
| CMD-VIEW-004 | `SET_RIGHT_VIEW` | 右視 | /view/standard-views | has3DView | HEADS_UP_TOOLBAR, SHORTCUT(R) | TEST-CMD-VIEW-004 |
| CMD-VIEW-005 | `SET_ISOMETRIC_VIEW` | 等距 | /view/standard-views | has3DView | HEADS_UP_TOOLBAR, SHORTCUT(I) | TEST-CMD-VIEW-005 |
| CMD-VIEW-006 | `TOGGLE_SECTION_VIEW` | 剖切視圖 | /view/slice | has3DView | HEADS_UP_TOOLBAR | TEST-CMD-VIEW-006 |
| CMD-VIEW-007 | `TOGGLE_DISPLAY_STYLE` | 切換顯示樣式 | /view/display-style | has3DView | HEADS_UP_TOOLBAR | TEST-CMD-VIEW-007 |
| CMD-VIEW-008 | `HIDE_ENTITY` | 隱藏實體 | /view/hide | hasSelection | CONTEXT | TEST-CMD-VIEW-008 |
| CMD-VIEW-009 | `SHOW_HIDDEN` | 顯示隱藏 | /view/show-hidden | hasHiddenEntities | MENU(View) | TEST-CMD-VIEW-009 |
| CMD-VIEW-010 | `ZOOM_TO_SELECTION` | 縮小到選取 | /view/zoom | hasSelection | CONTEXT | TEST-CMD-VIEW-010 |

### 4.7 評估命令 (EVALUATE)

| ID | 命令 ID | 標籤 | manualRef | enabledWhen | uiEntrypoints | testId |
|----|---------|------|-----------|-------------|---------------|--------|
| CMD-EVAL-001 | `MEASURE_DISTANCE` | 測量距離 | /part/mass-properties | hasDocument | RIBBON(EVALUATE) | TEST-CMD-EVAL-001 |
| CMD-EVAL-002 | `MEASURE_ANGLE` | 測量角度 | /part/mass-properties | hasDocument | RIBBON(EVALUATE) | TEST-CMD-EVAL-002 |
| CMD-EVAL-003 | `MEASURE_AREA` | 測量面積 | /part/mass-properties | hasDocument | RIBBON(EVALUATE) | TEST-CMD-EVAL-003 |
| CMD-EVAL-004 | `MEASURE_VOLUME` | 測量體積 | /part/mass-properties | hasDocument | RIBBON(EVALUATE) | TEST-CMD-EVAL-004 |
| CMD-EVAL-005 | `SHOW_MASS_PROPERTIES` | 質量屬性 | /part/mass-properties | hasDocument | RIBBON(EVALUATE) | TEST-CMD-EVAL-005 |
| CMD-EVAL-006 | `OPEN_EQUATIONS` | 方程式 | /part/equations | hasDocument | RIBBON(EVALUATE) | TEST-CMD-EVAL-006 |

### 4.8 工具命令 (TOOL)

| ID | 命令 ID | 標籤 | manualRef | enabledWhen | uiEntrypoints | testId |
|----|---------|------|-----------|-------------|---------------|--------|
| CMD-TOOL-001 | `SET_MATERIAL` | 材質 | /part/material | hasDocument | MENU(Tools) | TEST-CMD-TOOL-001 |
| CMD-TOOL-002 | `CONFIGURATION_ADD` | 新增配置 | /part/configurations | hasDocument | RIBBON(FEATURES) | TEST-CMD-TOOL-002 |
| CMD-TOOL-003 | `CONFIGURATION_DELETE` | 刪除配置 | /part/configurations | hasMultipleConfigs | RIBBON(FEATURES) | TEST-CMD-TOOL-003 |
| CMD-TOOL-004 | `CONFIGURATION_SWITCH` | 切換配置 | /part/configurations | hasMultipleConfigs | CONFIG_MANAGER | TEST-CMD-TOOL-004 |
| CMD-TOOL-005 | `INSERT_TOOLBOX_PART` | 插入標準件 | /part/toolbox | hasDocument | DESIGN_LIBRARY | TEST-CMD-TOOL-005 |

---

## 5. 命令執行流程

### 5.1 標準執行流程

```
1. UI 觸發 (button click, menu select, shortcut)
   ↓
2. CommandRegistry.execute(commandId, params)
   ↓
3. 檢查 enabledWhen(state)
   ├─ false → 返回 { success: false, error: { code: 'DISABLED', ... } }
   └─ true → 繼續
   ↓
4. 記錄 CommandLogEntry (action: EXECUTE)
   ↓
5. 保存快照 (saveSnapshot) — 用於 undo/redo
   ↓
6. 執行 execute(params, state, dispatch)
   ├─ 成功 → 返回 CommandResult
   └─ 失敗 → 返回 { success: false, error: {...} }
   ↓
7. 更新 CommandLogEntry (result)
   ↓
8. 觸發 onExecute 事件
```

### 5.2 Undo 流程

```
1. 使用者觸發 Undo (Ctrl+Z 或 UI 按鈕)
   ↓
2. CommandRegistry.undo(commandId, lastResult)
   ↓
3. 檢查該命令是否有 undo handler
   ├─ null → 忽略
   └─ 有 → 繼續
   ↓
4. 執行 undo(result, state, dispatch)
   ↓
5. 記錄 CommandLogEntry (action: UNDO)
   ↓
6. 觸發 onExecute 事件
```

### 5.3 多步驟命令流程（如 Extrude）

```
1. 使用者點擊 "Extrude Boss" 按鈕
   ↓
2. 執行 CMD-SK-019 EXIT_AND_EXTRUDE
   ├─ enabledWhen: inSketchMode && hasClosedLoop
   ├─ execute: 提取閉合輪廓 → 設定 pendingFeatureCommand
   └─ 等待使用者在 PropertyManager 輸入參數
   ↓
3. 使用者輸入深度並確認
   ↓
4. 執行 CMD-FEAT-001 EXTRUDE_BOSS
   ├─ params: { depth: 25, direction: 'ONE_DIRECTION' }
   ├─ enabledWhen: hasValidProfile && pendingFeatureCommand === 'EXTRUDE'
   ├─ execute: addFeature(type: 'EXTRUDE', params) → saveSnapshot → markRebuildDirty
   └─ 返回 { success: true, data: { featureId: 'xxx' } }
   ↓
5. 執行 CMD-FEAT-022 REBUILD
   ├─ execute: handleRebuild()
   └─ 觸發 HeavyEngineClient.rebuild()
```

---

## 6. 現有命令系統的缺口與修復計畫

### 6.1 Undo/Redo 缺口

| 缺口 | 目前狀態 | 修復方式 |
|------|---------|---------|
| Sketch 圖元增刪 | 無 snapshot | 所有 sketchActions 呼叫 saveSnapshot |
| Convert/Offset Entities | 無 snapshot | 在 execute 前呼叫 saveSnapshot |
| 檔案開啟 | 無 snapshot | NEW_FILE 和 OPEN_FILE 前呼叫 saveSnapshot |
| Sketch 重置 | 無 snapshot | EXIT_SKETCH 前呼叫 saveSnapshot |
| Mate 選取 | 無 snapshot | 選取不觸發 snapshot（可接受，選取本身不需復原） |

### 6.2 命令追蹤缺口

| 缺口 | 修復方式 |
|------|---------|
| 無命令層日誌 | CommandRegistry 自動記錄所有執行 |
| 無 manualRef 關聯 | 每個命令定義中包含 manualRef |
| 無 testId 關聯 | 每個命令定義中包含 testIds |

### 6.3 enabledWhen 分散

| 缺口 | 修復方式 |
|------|---------|
| disabled prop 分散在各組件 | 統一從 CommandRegistry.isEnabled() 讀取 |
| 無中央命令狀態 | pendingFeatureCommand 改為由 registry 管理 |

---

## 7. 檔案結構建議

```
src/commands/
├── index.ts                    # 匯出 CommandRegistry
├── registry.ts                 # CommandRegistry 實作
├── types.ts                    # ICommand, CommandResult, etc.
├── apps/                       # 應用程式命令
│   ├── newPart.ts
│   ├── openFile.ts
│   ├── saveFile.ts
│   └── index.ts
├── edits/                      # 編輯命令
│   ├── undo.ts
│   ├── redo.ts
│   ├── delete.ts
│   └── index.ts
├── sketches/                   # 草圖命令
│   ├── drawLine.ts
│   ├── drawCircle.ts
│   ├── exitSketch.ts
│   └── index.ts
├── features/                   # 特徵命令
│   ├── extrudeBoss.ts
│   ├── fillet.ts
│   ├── suppressFeature.ts
│   └── index.ts
├── assemblies/                 # 組合件命令
│   ├── insertComponent.ts
│   ├── applyMate.ts
│   └── index.ts
├── views/                      # 檢視命令
│   ├── zoomToFit.ts
│   ├── setFrontView.ts
│   └── index.ts
├── evaluates/                  # 評估命令
│   ├── measureDistance.ts
│   ├── showMassProperties.ts
│   └── index.ts
└── tools/                      # 工具命令
    ├── setMaterial.ts
    ├── configurationAdd.ts
    └── index.ts
```

---

## 8. 驗收標準

- [ ] 沒有 UI 直接修改模型（所有變更必須透過 command）
- [ ] 每個 command 可被測試直接呼叫
- [ ] 每個 command 可追溯到手冊功能 ID（manualRef）
- [ ] 每個 command 有 enabledWhen 定義
- [ ] 每個 command 有 undo/redo 或明確標記原因
- [ ] 所有工具列、選單、快捷鍵、右鍵選單接到 command registry

---

## 版本歷史

| 版本 | 日期 | 變更 | 作者 |
|------|------|------|------|
| 1.0 | 2026-06-15 | 初始版本 | 開發 Agent |
