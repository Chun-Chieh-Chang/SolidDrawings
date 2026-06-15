# SolidWorks 2010 Alignment Development Plan

本專案目標是以 SolidWorks 2010 中文使用說明手冊作為功能、UI 元素、介面交互邏輯的開發方向與驗收標準，建立可追蹤、可驗證、可交由 OpenCode 或其他 IDE Agent 逐步執行的開發計畫。

基準來源：

- [SolidWorks 2010 中文使用說明手冊](https://help.solidworks.com/2010/chinese/SolidWorks/help_list.htm?id=0)

重要定義：本文件中的「100% 完成度」定義為「公開使用手冊中可識別的功能、UI 元素、命令入口、狀態、互動流程皆有對應實作或明確標記為不適用，並通過自動或人工驗收」。本計畫不宣稱複製 SolidWorks 專有核心或商業級 CAD 幾何內核完全等同，但要求做到手冊導向的功能覆蓋與介面行為對齊。

## 總體產出

1. `docs/solidworks-2010-source-map.md`
   - 手冊章節、URL、功能點、UI 元素、互動流程索引。

2. `docs/solidworks-2010-feature-matrix.csv`
   - 每一項功能的狀態：`not_started`、`designed`、`implemented`、`tested`、`verified`、`out_of_scope_with_reason`。

3. `docs/ui-parity-spec.md`
   - UI 元素、選單、工具列、CommandManager、FeatureManager、PropertyManager、右鍵選單、快捷鍵、對話框、狀態列等規格。

4. `docs/interaction-test-plan.md`
   - 所有互動流程的驗收腳本。

5. `tests/`
   - 單元測試、互動測試、視覺回歸測試、端到端測試。

6. `reports/coverage-solidworks-2010.md`
   - 自動生成的完成度報告，必須列出剩餘缺口。

## Phase 0: 建立基準與完成度規則

### 目標

先把「完成」定義清楚，避免 IDE Agent 只實作顯眼功能而漏掉大量 UI 狀態與邊界流程。

### 步驟

1. 建立 `docs/solidworks-2010-alignment-charter.md`。
2. 寫入以下完成度規則：
   - 每個手冊功能都必須有追蹤 ID。
   - 每個 UI 命令都必須有入口位置、啟用條件、禁用條件、結果狀態。
   - 每個互動流程都必須有至少一個驗收案例。
   - 無法實作的項目必須列出原因與替代方案。
3. 定義完成度公式：

```text
completion =
  verified_features / total_applicable_features * 100
```

4. `out_of_scope_with_reason` 不計入分母，但必須由人工審核通過。

### 驗收標準

- 存在完成度公式。
- 所有狀態值定義清楚。
- Agent 不能用「已大致完成」作為結案條件。

## Phase 1: 擷取 SolidWorks 2010 手冊結構

### 目標

將手冊變成可執行的開發 backlog。

### 步驟

1. 從手冊入口建立章節清單。
2. 對每個章節擷取：
   - 章節標題
   - URL
   - 功能名稱
   - 關聯 UI
   - 互動步驟
   - 命令名稱
   - 對話框欄位
   - 鍵盤/滑鼠操作
   - 前置條件
   - 結果
3. 輸出 `docs/solidworks-2010-source-map.md`。
4. 輸出 `docs/solidworks-2010-feature-matrix.csv`。

### 建議欄位

```csv
id,manual_section,url,feature_area,feature_name,ui_entry,interaction_type,preconditions,expected_result,status,test_id,notes
```

### 驗收標準

- 每個手冊章節都有對應記錄。
- 每個功能至少有一個 `id`。
- 每個 `id` 都能追溯回原始手冊 URL。

## Phase 2: 功能分區

### 目標

按 SolidWorks 2010 的實際工作模式拆解，不用單純技術模組拆。

### 功能區域

1. 應用程式框架
   - 新增、開啟、儲存、另存、新建文件
   - 零件、組合件、工程圖文件模式
   - 最近使用文件
   - 文件視窗管理

2. 主要 UI
   - Menu Bar
   - CommandManager
   - FeatureManager Design Tree
   - PropertyManager
   - ConfigurationManager
   - Task Pane
   - Heads-up View Toolbar
   - Status Bar
   - Context Toolbar
   - 右鍵選單

3. 草圖 Sketch
   - 線、矩形、圓、圓弧、多邊形、樣條曲線
   - 智慧尺寸
   - 幾何關係
   - 修剪、延伸、鏡射、偏移
   - 草圖狀態：完全定義、欠定義、過定義

4. 特徵 Features
   - Extrude Boss/Base
   - Extrude Cut
   - Revolve
   - Fillet
   - Chamfer
   - Shell
   - Draft
   - Pattern
   - Mirror
   - Hole Wizard
   - Reference Geometry

5. 零件 Part
   - 材質
   - 質量屬性
   - 方程式
   - 配置
   - 設計表

6. 組合件 Assembly
   - 插入零組件
   - Mate 配合
   - 移動/旋轉零組件
   - 爆炸視圖
   - 干涉檢查
   - 組合件樹狀結構

7. 工程圖 Drawing
   - 標準視圖
   - 投影視圖
   - 剖面視圖
   - 詳細視圖
   - 尺寸標註
   - 註解
   - 圖紙格式

8. 視圖與顯示
   - 旋轉、平移、縮放
   - 標準視角
   - 顯示樣式
   - 隱藏、顯示
   - 剖切視圖

9. 選取與互動
   - 單選、多選、框選
   - 預選高亮
   - 選取過濾器
   - 快捷鍵
   - 滑鼠手勢，如適用

10. 錯誤與狀態
    - 無效操作提示
    - 重建錯誤
    - Feature rollback
    - Suppress / Unsuppress
    - Undo / Redo

### 驗收標準

- 每個功能區都有 owner 檔案或模組。
- 每個功能區都有獨立測試。
- UI 功能與幾何功能分開驗收。

## Phase 3: 建立 UI 對齊規格

### 目標

先規格化 UI，再實作。避免做出「有功能但不像 SolidWorks 2010」的介面。

### 步驟

1. 建立 `docs/ui-parity-spec.md`。
2. 對每個 UI 元素記錄：
   - 名稱
   - 所在位置
   - 顯示條件
   - 啟用條件
   - 禁用條件
   - hover 狀態
   - active 狀態
   - 錯誤狀態
   - 快捷鍵
   - 右鍵選單
   - 對應功能 ID
3. 建立 UI 元素清單：
   - 主選單
   - 工具列
   - CommandManager tabs
   - FeatureManager tree nodes
   - PropertyManager panels
   - 對話框
   - 狀態列訊息
   - 快捷選單

### 驗收標準

- 每個可點擊 UI 都有功能 ID。
- 每個功能 ID 至少有一個 UI 入口。
- 每個 PropertyManager 都有欄位、預設值、驗證規則。

## Phase 4: 建立核心資料模型

### 目標

讓 UI、文件、幾何、歷史樹能一致運作。

### 建議資料模型

1. `Document`
   - `type: part | assembly | drawing`
   - `units`
   - `features`
   - `configurations`
   - `selection`
   - `history`

2. `Feature`
   - `id`
   - `type`
   - `name`
   - `parameters`
   - `parentRefs`
   - `suppressed`
   - `rollbackState`
   - `errors`

3. `Sketch`
   - `plane`
   - `entities`
   - `relations`
   - `dimensions`
   - `solveState`

4. `Assembly`
   - `components`
   - `mates`
   - `transforms`

5. `Drawing`
   - `sheets`
   - `views`
   - `annotations`
   - `dimensions`

### 驗收標準

- 所有 UI 操作只能透過 command/action 更新資料模型。
- Undo/Redo 可回放。
- 文件可序列化、反序列化。
- Feature tree 與模型狀態一致。

## Phase 5: 實作命令系統

### 目標

所有互動都走統一 command pipeline，方便測試與追蹤。

### 步驟

1. 建立 command registry。
2. 每個 command 定義：
   - `id`
   - `label`
   - `manualRef`
   - `enabledWhen`
   - `execute`
   - `undo`
   - `redo`
   - `uiEntrypoints`
   - `testIds`
3. 建立 command 執行 log。
4. 將所有工具列、選單、快捷鍵、右鍵選單接到 command registry。

### 驗收標準

- 沒有 UI 直接修改模型。
- 每個 command 可被測試直接呼叫。
- 每個 command 可追溯到手冊功能 ID。

## Phase 6: 幾何與草圖能力實作

### 目標

優先完成 SolidWorks 2010 使用者最核心的建模路徑。

### 實作順序

1. Sketch plane selection
2. Sketch entity creation
3. Selection/highlight/snapping
4. Dimensions
5. Geometric relations
6. Constraint solving
7. Extrude Boss/Base
8. Extrude Cut
9. Revolve
10. Fillet/Chamfer
11. Pattern/Mirror
12. Feature rebuild
13. Feature rollback
14. Suppress/Unsuppress

### 驗收標準

- 每個草圖工具有互動測試。
- 每個 feature 有模型狀態測試。
- 每個 feature 有 PropertyManager 測試。
- 錯誤輸入會顯示可驗證錯誤狀態。

## Phase 7: 組合件與工程圖

### 目標

完成 Part 之後再進 Assembly / Drawing，避免資料模型反覆重寫。

### Assembly 驗收項

- 插入零件
- 移動零件
- Mate 建立、編輯、刪除
- Mate 錯誤提示
- 爆炸視圖
- 干涉檢查
- FeatureManager assembly tree

### Drawing 驗收項

- 從 Part/Assembly 建立圖紙
- 插入標準視圖
- 投影視圖
- 剖面視圖
- 尺寸標註
- 註解
- 圖紙比例與格式

### 驗收標準

- Assembly 狀態能儲存與重載。
- Drawing 視圖能追蹤來源模型。
- 修改模型後 Drawing 可更新或提示過期。

## Phase 8: 視覺與互動回歸測試

### 目標

把「像不像」轉成可驗證項。

### 測試類型

1. 單元測試
   - 測資料模型、command、幾何參數。

2. 端到端測試
   - 模擬使用者從新建文件到完成零件。

3. 視覺回歸測試
   - 固定 viewport，比對：
     - 主 UI
     - 工具列狀態
     - PropertyManager
     - FeatureManager
     - 建模畫布
     - 對話框

4. 可用性測試
   - 驗證禁用按鈕、錯誤訊息、選取狀態。

### 驗收標準

- 每個功能 ID 至少對應一個測試。
- 每個主要 UI 面板至少有一張基準截圖。
- 每次 CI 產生覆蓋率報告。

## Phase 9: 完成度儀表板

### 目標

讓 OpenCode 或其他 IDE Agent 每次執行後都能知道距離 100% 還差什麼。

### 步驟

1. 建立 `scripts/generate-solidworks-coverage-report`。
2. 讀取 `feature-matrix.csv`。
3. 掃描測試結果。
4. 產出：
   - 總功能數
   - 已實作數
   - 已測試數
   - 已驗證數
   - 缺失功能
   - 無測試功能
   - 無 UI 入口功能
   - 無手冊來源功能
5. 輸出 `reports/coverage-solidworks-2010.md`。

### 驗收標準

- 報告可自動生成。
- 任何功能沒有測試時，完成度不能到 100%。
- 任何功能沒有手冊來源時，不能標為 `verified`。

## Phase 10: Agent 執行規則

可直接放進 OpenCode 或 IDE Agent 的任務指令：

```text
你是本專案的開發 Agent。專案目標是依據 SolidWorks 2010 中文使用說明手冊建立功能與 UI 對齊版本。

執行規則：
1. 不得直接宣稱完成，必須更新 feature matrix。
2. 每新增一個功能，必須補上：
   - manualRef
   - command id
   - UI entrypoint
   - test id
   - acceptance criteria
3. 每修改 UI，必須更新 ui-parity-spec。
4. 每實作 command，必須支援 enabledWhen、execute、undo/redo 或明確標記原因。
5. 每次完成任務後，執行測試並重新生成 coverage report。
6. 若發現手冊功能未收錄，先補 source-map 與 feature-matrix，再實作。
7. 不允許以「近似完成」結案；只能以 verified 狀態計入完成度。
```

## 建議里程碑

1. M1: 手冊索引與功能矩陣完成
   - 驗收：100% 章節可追溯。

2. M2: 主 UI 框架完成
   - 驗收：Menu、CommandManager、FeatureManager、PropertyManager、Status Bar 可互動。

3. M3: Part + Sketch MVP 完成
   - 驗收：能建立草圖、尺寸、Extrude、Cut、儲存重載。

4. M4: Feature parity 第一輪
   - 驗收：核心特徵皆有 PropertyManager 與測試。

5. M5: Assembly 完成
   - 驗收：插入零件、Mate、干涉檢查、爆炸視圖。

6. M6: Drawing 完成
   - 驗收：建立工程圖、視圖、尺寸、註解。

7. M7: 完整 UI/互動回歸
   - 驗收：所有功能 ID 為 `verified` 或 `out_of_scope_with_reason`。

## 最終 100% 驗收條件

專案只有在以下條件全部成立時，才可標記為 100%：

```text
1. feature-matrix 中所有 applicable 功能 status = verified
2. 每個 verified 功能都有 manualRef
3. 每個 verified 功能都有至少一個自動或人工驗收紀錄
4. 每個 UI entrypoint 都能觸發 command 或正確 disabled
5. Undo/Redo、錯誤狀態、選取狀態、文件儲存重載通過測試
6. coverage report 無 uncovered / untested / undocumented 項目
7. 人工審核 out_of_scope_with_reason 清單
```

## 執行原則

這份計畫的核心不是「一次做完 SolidWorks」，而是建立一個嚴格的可追蹤系統：每個手冊功能都變成開發單元，每個開發單元都有 UI、命令、資料模型、測試與驗收紀錄。這樣 OpenCode 或其他 IDE Agent 才有辦法真的朝 100% 推進，而不是只做出一個外觀相似的 CAD 原型。
