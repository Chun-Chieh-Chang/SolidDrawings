# Phase 4: 核心資料模型規格

> 對齊 SolidWorks 2010 計畫要求的 5 個核心實體：Document, Feature, Sketch, Assembly, Drawing。
> 建立者：開發 Agent
> 最後更新：2026-06-15
> 基準：solidworks-2010-alignment-plan.md Phase 4

## 1. Document

### 1.1 定義

| 欄位 | 型別 | 必填 | 說明 | SW ID |
|------|------|------|------|-------|
| `id` | `string` | 是 | 文件唯一識別碼 (UUID) | — |
| `type` | `'part' \| 'assembly' \| 'drawing'` | 是 | 文件類型 | SW2010-APP-001~003 |
| `name` | `string` | 是 | 文件名稱（不含副檔名） | — |
| `path` | `string \| null` | 否 | 檔案路徑（未儲存時為 null） | — |
| `units` | `'MMGS' \| 'IPS' \| 'CGS' \| 'MKS' \| 'FPS'` | 是 | 單位系統（預設 MMGS） | SW2010-UI-008 |
| `features` | `Feature[]` | 是 | 特徵樹（part/assembly） | SW2010-UI-003 |
| `configurations` | `Configuration[]` | 是 | 配置列表 | SW2010-UI-005 |
| `materials` | `Record<string, Material>` | 是 | 材質資料庫 | SW2010-PART-001 |
| `globalVariables` | `Record<string, string>` | 是 | 全域方程式變數 | SW2010-PART-003 |
| `selection` | `SelectionSet` | 是 | 目前選取集 | SW2010-SEL-001~007 |
| `history` | `HistoryStack` | 是 | 復原/重做歷史 | SW2010-ERR-005 |
| `createdAt` | `string` (ISO) | 是 | 建立時間 | — |
| `updatedAt` | `string` (ISO) | 是 | 最後修改時間 | — |

### 1.2 驗證規則

- `type` 決定可用的 feature 類型
- `type = 'part'` 時 `features` 為 PartFeature[]
- `type = 'assembly'` 時 `components` 和 `mates` 必須存在
- `type = 'drawing'` 時 `sheets` 和 `views` 必須存在
- `units` 影響所有參數輸入的預設值和顯示格式

### 1.3 現有對應

| 規格欄位 | 現有實現 | 檔案 |
|---------|---------|------|
| `type` / `name` | `CadState.mode` / `CadState.projectName` | `useCadStore.ts` |
| `features` | `CadState.features: CADFeature[]` | `useCadStore.ts` |
| `configurations` | `CadState.configurations: CADConfiguration[]` | `useCadStore.ts` |
| `globalVariables` | `CadState.globalVariables` | `useCadStore.ts` |
| `selection` | `CadState.selectedTopology`, `selectedEntityIds` | `useCadStore.ts` |
| `history` | `CadState.history: { past, future }` | `useCadStore.ts` |
| 材質 | `CadState.partMaterial`, `MATERIAL_PRESETS` | `useCadStore.ts` |
| 序列化 | `PartFileDocument` | `part-file.ts` |

### 1.4 缺口

- 缺少統一的 `Document` 介面（目前分散在 `CadState`、`PartFileDocument`、`ParsedPartFile`）
- 缺少 `Document` 生命週期管理（新建、開啟、儲存、關閉）
- 缺少 `Document` 類型檢查（type guards）

---

## 2. Feature

### 2.1 定義

| 欄位 | 型別 | 必填 | 說明 | SW ID |
|------|------|------|------|-------|
| `id` | `string` | 是 | 特徵唯一識別碼 (UUID) | — |
| `type` | `FeatureType` | 是 | 特徵類型（見下方 union） | — |
| `name` | `string` | 是 | 特徵名稱（可編輯） | SW2010-UI-003 |
| `parameters` | `FeatureParameters` | 是 | 特徵參數（依類型變化） | — |
| `suppressed` | `boolean` | 否 | 是否抑制（預設 false） | SW2010-ERR-004 |
| `broken` | `boolean` | 否 | 是否錯誤中（預設 false） | SW2010-ERR-002 |
| `errors` | `FeatureError[]` | 否 | 重建錯誤清單 | SW2010-ERR-002 |
| `parentRefs` | `string[]` | 否 | 父特徵 ID 清單 | — |
| `childRefs` | `string[]` | 否 | 子特徵 ID 清單 | — |
| `color` | `string \| null` | 否 | 自訂顏色（十六進位） | — |
| `rollbackState` | `FeatureRollbackState` | 否 | Rollback 狀態 | SW2010-ERR-003 |
| `createdAt` | `string` (ISO) | 是 | 建立時間 | — |
| `updatedAt` | `string` (ISO) | 是 | 最後修改時間 | — |

### 2.2 FeatureType Union

```typescript
type FeatureType =
  // Extrude
  | 'EXTRUDE_BOSS' | 'EXTRUDE_CUT'
  | 'SURFACE_EXTRUDE'
  // Revolve
  | 'REVOLVE_BOSS' | 'REVOLVE_CUT'
  // Sweep/Loft
  | 'SWEEP' | 'SWEEP_LOFT' | 'HELICAL_SWEEP'
  // Fillet/Chamfer
  | 'Fillet' | 'CHAMFER'
  // Shell/Draft
  | 'SHELL' | 'DRAFT'
  // Pattern
  | 'LINEAR_PATTERN' | 'CIRCULAR_PATTERN' | 'FILL_PATTERN' | 'MIRROR_PATTERN'
  | 'MIRROR_FEATURE'
  // Reference Geometry
  | 'REFERENCE_PLANE' | 'REFERENCE_AXIS' | 'REFERENCE_POINT' | 'REFERENCE_COORDINATE'
  // Hole
  | 'HOLE_WIZARD'
  // Surface
  | 'SURFACE_KNIT' | 'SURFACE_OFFSET' | 'SURFACE_CUT' | 'SURFACE_BOUNDARY'
  | 'DOME' | 'THICKEN'
  // Special
  | 'TOOLBOX_PART' | 'DECAL' | 'DUMB_SOLID'
  // Configuration
  | 'CONFIG_CHANGE';
```

### 2.3 FeatureParameters（依類型）

| 特徵類型 | 必要參數 |
|---------|---------|
| EXTRUDE_BOSS/CUT | `depth: number`, `direction: 'ONE_DIRECTION' \| 'BOTH'`, `draftAngle?: number`, `isThin?: boolean`, `thinThickness?: number`, `profileSketchId: string` |
| REVOLVE_BOSS/CUT | `angle: number`, `axisId: string`, `profileSketchId: string` |
| SWEEP | `pathSketchId: string`, `profileSketchId: string`, `blendType?: string` |
| FILLET | `radius: number`, `topologyRefs: TopologyReference[]` |
| CHAMFER | `distance: number`, `topologyRefs: TopologyReference[]` |
| SHELL | `thickness: number`, `excludeFaces: string[]` |
| DRAFT | `angle: number`, `neutralAxisLine?: TopologyReference`, `drawDirection: [number, number, number]`, `drawOutward: boolean` |
| LINEAR_PATTERN | `direction: TopologyReference`, `count: number`, `spacing: number` |
| CIRCULAR_PATTERN | `axis: TopologyReference`, `count: number`, `angle: number` |
| REFERENCE_PLANE | `planeType: 'FRONT' \| 'TOP' \| 'RIGHT' \| 'CUSTOM'`, `offset?: number`, `refs?: TopologyReference[]` |
| HOLE_WIZARD | `size: string`, `standard: string`, `depth: number`, `topologyRefs: TopologyReference[]` |

### 2.4 FeatureError

```typescript
interface FeatureError {
  code: string;  // 'INVALID_PROFILE', 'NO_COMMON_SURFACE', 'TOO_MANY_SEGMENTS', etc.
  message: string;
  severity: 'ERROR' | 'WARNING';
  atFeatureId?: string;
}
```

### 2.5 現有對應

| 規格欄位 | 現有實現 | 檔案 |
|---------|---------|------|
| `id` / `type` / `name` / `parameters` | `CADFeature` | `useCadStore.ts` |
| `suppressed` | `CADFeature.isSuppressed` | `useCadStore.ts` |
| `broken` | `CADFeature.isBroken` | `useCadStore.ts` |
| `parentRefs` / `childRefs` | `feature-tree-relations.ts` (computed) | — |
| 序列化 | `PartFileDocument.features` | `part-file.ts` |

### 2.6 缺口

- 缺少統一的 `Feature` 介面（store 和 kernel 有兩套定義）
- 缺少 `FeatureType` union 類型（目前用 string）
- 缺少 `FeatureParameters` 結構化定義（目前用 `any`）
- 缺少 `FeatureError` 類型
- 缺少 `Feature` 型別斷言（type guards）

---

## 3. Sketch

### 3.1 定義

| 欄位 | 型別 | 必填 | 說明 | SW ID |
|------|------|------|------|-------|
| `id` | `string` | 是 | 草圖唯一識別碼 (UUID) | — |
| `name` | `string` | 是 | 草圖名稱 | SW2010-UI-003 |
| `plane` | `Plane` | 是 | 草圖平面 | SW2010-SK-001 |
| `nodes` | `Record<string, SketchNode>` | 是 | 節點圖（keyed by ID） | SW2010-SK-002~007 |
| `edges` | `Record<string, SketchEdge>` | 是 | 邊界圖 | SW2010-SK-002~007 |
| `constraints` | `Record<string, SketchConstraint>` | 是 | 約束圖 | SW2010-SK-008~021 |
| `solveState` | `SolveState` | 是 | 求解狀態 | SW2010-SK-021 |
| `isActive` | `boolean` | 是 | 是否為編輯中的草圖 | — |
| `isHidden` | `boolean` | 否 | 是否隱藏（在特徵樹中） | SW2010-VIEW-008 |

### 3.2 Plane（草圖平面）

```typescript
type Plane = 'FRONT' | 'TOP' | 'RIGHT' | 'CUSTOM' | 'FACE';
```

### 3.3 SolveState

```typescript
type SolveState = 'EMPTY' | 'UNDER_DEFINED' | 'FULLY_DEFINED' | 'OVER_DEFINED' | 'CONFLICT';
```

### 3.4 SketchNode

| 欄位 | 型別 | 說明 |
|------|------|------|
| `id` | `string` | 節點唯一識別碼 |
| `x` | `number` | X 座標（草圖平面 U 軸） |
| `y` | `number` | Y 座標（草圖平面 V 軸） |
| `isFixed` | `boolean` | 是否固定（solver 不會移動） |

### 3.5 SketchEdge

| 欄位 | 型別 | 說明 |
|------|------|------|
| `id` | `string` | 邊界唯一識別碼 |
| `type` | `'LINE' \| 'ARC' \| 'CIRCLE' \| 'CENTER_LINE' \| 'SPLINE' \| 'TEXT'` | 圖元類型 |
| `nodeIds` | `string[]` | 關聯節點 ID |
| `isConstruction` | `boolean` | 是否為構造線 |
| `parameters` | `any` | 類型專屬參數 |

### 3.6 SketchConstraint

| 欄位 | 型別 | 說明 |
|------|------|------|
| `id` | `string` | 約束唯一識別碼 |
| `type` | `ConstraintType` | 約束類型 |
| `nodeIds` | `string[]` | 關聯節點 |
| `edgeIds` | `string[]` | 關聯邊界 |
| `value` | `number \| null` | 約束值（距離、角度等） |
| `offset` | `number \| null` | 偏移量 |

### 3.7 ConstraintType Union

```typescript
type ConstraintType =
  | 'COINCIDENT' | 'HORIZONTAL' | 'VERTICAL' | 'COLLINEAR'
  | 'DISTANCE' | 'EQUAL' | 'CONCENTRIC' | 'TANGENT'
  | 'ANGLE' | 'PARALLEL' | 'PERPENDICULAR' | 'SYMMETRIC'
  | 'MIDPOINT' | 'FIX' | 'UNFIX' | 'PIERCE';
```

### 3.8 現有對應

| 規格欄位 | 現有實現 | 檔案 |
|---------|---------|------|
| `nodes` / `edges` / `constraints` | `CadState.sketchNodes/Edges/Constraints` | `useCadStore.ts` |
| `solveState` | `CadState.solverReport` | `useCadStore.ts` |
| `SketchNode/Edge/Constraint` | `useCadStore.ts` 介面 | `useCadStore.ts` |
| ConstraintSolver | `ConstraintSolver.ts` (PBD + NR) | `ConstraintSolver.ts` |
| 閉合輪廓偵測 | `GraphAdapter.extractAllClosedLoops()` | `GraphAdapter.ts` |
| 草圖驗證 | `sketch-profile-validation.ts` | `sketch-profile-validation.ts` |

### 3.9 缺口

- 缺少統一的 `Sketch` 介面（目前分散在 store 的三個 Record）
- 缺少 `SolveState` union 類型
- 缺少 `ConstraintType` union 類型
- 缺少草圖平面選擇的結構化表示
- 草圖數據在 feature `parameters` 中嵌入，缺少独立的草圖生命週期管理

---

## 4. Assembly

### 4.1 定義

| 欄位 | 型別 | 必填 | 說明 | SW ID |
|------|------|------|------|-------|
| `id` | `string` | 是 | 組合件唯一識別碼 (UUID) | — |
| `name` | `string` | 是 | 組合件名稱 | — |
| `components` | `Component[]` | 是 | 零組件列表 | SW2010-ASM-001 |
| `mates` | `Mate[]` | 是 | 配合關係列表 | SW2010-ASM-002~006 |
| `configurations` | `Configuration[]` | 是 | 配置列表 | SW2010-ASM-008 |
| `explodedView` | `ExplodedViewState` | 是 | 爆炸視圖狀態 | SW2010-ASM-008 |
| `interferenceResults` | `InterferenceResult[] \| null` | 否 | 最近一次干涉檢查結果 | SW2010-ASM-009 |

### 4.2 Component

| 欄位 | 型別 | 必填 | 說明 | SW ID |
|------|------|------|------|-------|
| `id` | `string` | 是 | 零組件唯一識別碼 | — |
| `partId` | `string` | 是 | 關聯的零件 ID | — |
| `instanceName` | `string` | 是 | 實例名稱 | SW2010-ASM-001 |
| `transform` | `Transform` | 是 | 座標變換 | SW2010-ASM-007 |
| `visible` | `boolean` | 是 | 可見性 | SW2010-VIEW-006~007 |
| `isFixed` | `boolean` | 否 | 是否固定位置 | — |
| `isLightweight` | `boolean` | 否 | 是否輕量載入 | — |
| `features` | `Feature[] \| null` | 否 | 零件特徵樹（null = 輕量模式） | — |

### 4.3 Transform

| 欄位 | 型別 | 說明 |
|------|------|------|
| `position` | `[number, number, number]` | 平移 (X, Y, Z) |
| `rotation` | `[number, number, number]` | 旋轉 (Rx, Ry, Rz) |

### 4.4 Mate

| 欄位 | 型別 | 必填 | 說明 | SW ID |
|------|------|------|------|-------|
| `id` | `string` | 是 | 配合唯一識別碼 | — |
| `name` | `string` | 是 | 配合名稱 | — |
| `type` | `MateType` | 是 | 配合類型 | SW2010-ASM-002~006 |
| `entity1` | `MateEntity` | 是 | 第一個實體 | — |
| `entity2` | `MateEntity` | 是 | 第二個實體 | — |
| `offset` | `number \| null` | 否 | 偏移量（距離配合） | SW2010-ASM-004 |
| `angle` | `number \| null` | 否 | 偏移角度（角度配合） | SW2010-ASM-003 |
| `alignment` | `'ALIGNED' \| 'ANTI_ALIGNED' \| null` | 否 | 對齊方式 | SW2010-ASM-006 |
| `ratio` | `number \| null` | 否 | 齒輪比 | SW2010-ASM-002 |
| `pitch` | `number \| null` | 否 | 螺距 | SW2010-ASM-002 |

### 4.5 MateType Union

```typescript
type MateType =
  | 'COINCIDENT' | 'PARALLEL' | 'CONCENTRIC' | 'DISTANCE'
  | 'PERPENDICULAR' | 'TANGENT' | 'ANGLE'
  | 'GEAR' | 'SCREW';
```

### 4.6 MateEntity

| 欄位 | 型別 | 說明 |
|------|------|------|
| `componentId` | `string` | 關聯零組件 ID |
| `topologyId` | `string` | 關聯拓撲 ID |
| `localOrigin` | `[number, number, number] \| null` | 局部原點 |
| `localNormal` | `[number, number, number] \| null` | 局部法線 |

### 4.7 InterferenceResult

| 欄位 | 型別 | 說明 |
|------|------|------|
| `component1Id` | `string` | 第一個零組件 ID |
| `component2Id` | `string` | 第二個零組件 ID |
| `volume` | `number` | 干涉體積 |
| `vertices` | `[number, number, number][]` | 干涉區域頂點 |

### 4.8 現有對應

| 規格欄位 | 現有實現 | 檔案 |
|---------|---------|------|
| `components` | `CadState.components: CADComponent[]` | `useCadStore.ts` |
| `mates` | `CadState.mates: CADMate[]` | `useCadStore.ts` |
| `explodedView` | `CadState.explodedView: ExplodedViewState` | `useCadStore.ts` |
| `AssemblyService` | `AssemblyService.ts` | `AssemblyService.ts` |
| Mate Solver | `assembly_solver.py` | `backend/app/services/assembly_solver.py` |

### 4.9 缺口

- 缺少統一的 `Assembly` 容器類型
- 缺少 `MateType` union 類型（目前用 string）
- 缺少 `InterferenceResult` 類型
- 缺少 `MateEntity` 結構化定義

---

## 5. Drawing

### 5.1 定義

| 欄位 | 型別 | 必填 | 說明 | SW ID |
|------|------|------|------|-------|
| `id` | `string` | 是 | 工程圖唯一識別碼 (UUID) | — |
| `name` | `string` | 是 | 工程圖名稱 | — |
| `sourceDocumentId` | `string` | 是 | 來源零件/組合件 ID | SW2010-DRW-001 |
| `sourceType` | `'part' \| 'assembly'` | 是 | 來源類型 | SW2010-DRW-001 |
| `sheets` | `Sheet[]` | 是 | 圖紙頁列表 | SW2010-DRW-017 |
| `titleBlock` | `TitleBlock` | 是 | 標題欄 | SW2010-DRW-018 |

### 5.2 Sheet

| 欄位 | 型別 | 必填 | 說明 | SW ID |
|------|------|------|------|-------|
| `id` | `string` | 是 | 圖紙頁唯一識別碼 | — |
| `name` | `string` | 是 | 圖紙頁名稱 | — |
| `format` | `SheetFormat` | 是 | 圖紙格式 | SW2010-DRW-017 |
| `scale` | `number` | 是 | 圖紙比例（預設 1） | SW2010-DRW-017 |
| `views` | `DrawingView[]` | 是 | 視圖列表 | SW2010-DRW-001~006 |
| `dimensions` | `DrawingDimension[]` | 是 | 尺寸標註 | SW2010-DRW-007~009 |
| `annotations` | `Annotation[]` | 是 | 註解列表 | SW2010-DRW-010 |

### 5.3 SheetFormat

```typescript
type SheetFormat =
  | 'A0' | 'A1' | 'A2' | 'A3' | 'A4'
  | 'TABLOID' | 'LEGAL' | 'LEDGER'
  | 'CUSTOM';
```

### 5.4 DrawingView

| 欄位 | 型別 | 必填 | 說明 | SW ID |
|------|------|------|------|-------|
| `id` | `string` | 是 | 視圖唯一識別碼 | — |
| `type` | `ViewType` | 是 | 視圖類型 | SW2010-DRW-001~006 |
| `origin` | `{ x: number, y: number }` | 是 | 在圖紙上的位置 | — |
| `rotation` | `number` | 否 | 旋轉角度（預設 0） | — |
| `scale` | `number` | 否 | 視圖比例（預設圖紙比例） | — |
| `sourceViewId` | `string \| null` | 否 | 來源 3D 視圖 ID | — |
| `parentViewId` | `string \| null` | 否 | 父視圖 ID（投影視圖） | — |

### 5.5 ViewType

```typescript
type ViewType =
  | 'FRONT' | 'RIGHT' | 'TOP' | 'BOTTOM' | 'LEFT' | 'BACK'
  | 'ISOMETRIC'
  | 'ALIGNED'     // 投影視圖
  | 'Auxiliary'   // 輔助視圖
  | 'SECTION'     // 剖面視圖
  | 'DETAIL'      // 詳細視圖
  | 'BROKEN_OUT'; // 斷裂視圖
```

### 5.6 DrawingDimension

| 欄位 | 型別 | 必填 | 說明 | SW ID |
|------|------|------|------|-------|
| `id` | `string` | 是 | 尺寸唯一識別碼 | — |
| `type` | `'LINEAR' \| 'RADIAL' \| 'DIAMETRIC' \| 'ANGULAR'` | 是 | 尺寸類型 | SW2010-DRW-007~009 |
| `value` | `number` | 是 | 數值 | — |
| `unit` | `string` | 是 | 單位 | — |
| `position` | `{ x: number, y: number }` | 是 | 尺寸線位置 | — |
| `sourceFeatureId` | `string` | 是 | 來源特徵 ID | — |

### 5.7 Annotation

| 欄位 | 型別 | 必填 | 說明 | SW ID |
|------|------|------|------|-------|
| `id` | `string` | 是 | 註解唯一識別碼 | — |
| `type` | `AnnotationType` | 是 | 註解類型 | SW2010-DRW-010~016 |
| `position` | `{ x: number, y: number }` | 是 | 位置 | — |
| `content` | `string` | 是 | 內容 | — |
| `style` | `AnnotationStyle` | 否 | 樣式 | — |

### 5.8 AnnotationType

```typescript
type AnnotationType =
  | 'TEXT' | 'CENTER_LINE' | 'SURFACE_FINISH'
  | 'WELD_SYMBOL' | 'DATUM_TARGET' | 'BALLOON'
  | 'TABLE' | 'BLOCK';
```

### 5.9 TitleBlock

| 欄位 | 型別 | 說明 |
|------|------|------|
| `projectName` | `string` | 專案名稱 |
| `drawingName` | `string` | 工程圖名稱 |
| `drawingNumber` | `string` | 圖號 |
| `scale` | `string` | 比例 |
| `sheetNumber` | `string` | 頁碼 |
| `totalSheets` | `string` | 總頁數 |
| `drawnBy` | `string` | 繪圖者 |
| `approvedBy` | `string` | 審核者 |
| `date` | `string` | 日期 |

### 5.10 現有對應

| 規格欄位 | 現有實現 | 檔案 |
|---------|---------|------|
| 基本結構 | `CadState.mode = 'DRAWING'` | `useCadStore.ts` |
| DrawingSheet 組件 | `DrawingSheet.tsx` | `DrawingSheet.tsx` |
| 投影視圖 | `HeavyEngineClient.project()` | `HeavyEngineClient.ts` |
| 尺寸編輯 | `DrawingSheet.tsx` 中的 dimension edit | `DrawingSheet.tsx` |
| 圖紙格式 | 硬編碼 A1 | `DrawingSheet.tsx` |

### 5.11 缺口

- **最大缺口**：工程圖模組幾乎未實作（18 項中僅 1 項部分實作）
- 缺少統一的 `Drawing` 容器類型
- 缺少 `Sheet`, `DrawingView`, `DrawingDimension`, `Annotation`, `TitleBlock` 等類型
- 缺少 `ViewType`, `AnnotationType` union 類型
- 缺少工程圖視圖生成邏輯（僅有 3D 投影 API）

---

## 6. 統一定義建議

### 6.1 建議的新檔案結構

```
src/types/
├── index.ts                  # 匯出所有公開類型
├── document.ts               # Document, DocumentType
├── feature.ts                # Feature, FeatureType, FeatureParameters, FeatureError
├── sketch.ts                 # Sketch, SketchNode, SketchEdge, SketchConstraint
├── assembly.ts               # Assembly, Component, Mate, MateType
├── drawing.ts                # Drawing, Sheet, DrawingView, Annotation
├── topology.ts               # TopologyReference, SelectedTopology
├── configuration.ts          # Configuration
├── material.ts               # Material, MaterialPreset
├── measurement.ts            # MeasurementResult, MeasurementMode
├── ui.ts                     # UI state types
└── errors.ts                 # AppError, ValidationError
```

### 6.2 現有類型的遷移路徑

| 現有類型 | 目標 | 行動 |
|---------|------|------|
| `CADFeature` (store) | `Feature` (in `types/feature.ts`) | 遷移欄位定義，保持 backward compat |
| `CADFeature` (kernel) | 保留為 DTO | 不更改，這是後端通訊格式 |
| `SketchNode/Edge/Constraint` | 遷移至 `types/sketch.ts` | 更新 store 中的 import |
| `CADComponent` | 遷移至 `types/assembly.ts` | 更新 store 中的 import |
| `CADMate` | 遷移至 `types/assembly.ts` | 更新 store 中的 import |
| `CadState` | 拆分多個 slice types | 建立 `DocumentState`, `AssemblyState`, `DrawingState` |
| `PartFileDocument` | 保留為序列化格式 | 與 `Document` 類型保持對齊 |

### 6.3 驗證標準

- [ ] 所有 UI 操作只能透過 command/action 更新資料模型
- [ ] Undo/Redo 可回放
- [ ] 文件可序列化、反序列化
- [ ] Feature tree 與模型狀態一致
- [ ] 每個型別都有對應的型別斷言函數

---

## 版本歷史

| 版本 | 日期 | 變更 | 作者 |
|------|------|------|------|
| 1.0 | 2026-06-15 | 初始版本 | 開發 Agent |
