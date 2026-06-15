# SolidWorks 2010 Alignment Charter

> 本文檔定義 3D-Builder 專案與 SolidWorks 2010 中文使用說明手冊的對齊規則。
> 建立者：開發 Agent
> 最後更新：2026-06-15
> 基準來源：[SolidWorks 2010 中文使用說明手冊](https://help.solidworks.com/2010/chinese/SolidWorks/help_list.htm?id=0)

## 1. 完成度定義

### 1.1 「100% 完成度」定義

本專案的「100% 完成度」定義為：

> 公開使用手冊中可識別的功能、UI 元素、命令入口、狀態、互動流程皆有對應實作或明確標記為不適用，並通過自動或人工驗收。

本計畫不宣稱複製 SolidWorks 專有核心或商業級 CAD 幾何內核完全等同，但要求做到手冊導向的功能覆蓋與介面行為對齊。

### 1.2 完成度公式

```
completion = verified_features / total_applicable_features * 100
```

其中：
- `verified_features`：狀態為 `verified` 的功能數量
- `total_applicable_features`：狀態不為 `out_of_scope_with_reason` 的功能總數

`out_of_scope_with_reason` 項目不計入分母，但必須由人工審核通過。

## 2. 功能狀態定義

每個功能在 `solidworks-2010-feature-matrix.csv` 中的狀態必須為以下之一：

| 狀態 | 定義 | 說明 |
|------|------|------|
| `not_started` | 尚未開始 | 功能尚未被規劃或實作 |
| `designed` | 已設計 | 已定義 UI 入口、命令 ID、互動流程，但尚未實作 |
| `implemented` | 已實作 | 程式碼已實作，但尚未測試 |
| `tested` | 已測試 | 已通過單元測試，但尚未驗收 |
| `verified` | 已驗收 | 已通過自動或人工驗收，對應手冊功能 |
| `out_of_scope_with_reason` | 不適用 | 明確標記原因，需人工審核 |

### 2.1 狀態遷移規則

```
not_started → designed → implemented → tested → verified
                                              ↓
                                    out_of_scope_with_reason（任何階段可轉入）
```

- 每個狀態遷移必須有對應的驗證動作。
- Agent 不能用「已大致完成」作為結案條件。
- 只有 `verified` 狀態計入完成度計算。

## 3. 追蹤規則

### 3.1 功能追蹤 ID

- 每個手冊功能都必須有唯一的追蹤 ID。
- ID 格式：`SW2010-{area}-{seq}`，例如 `SW2010-SK-001`。
- 功能區域代碼：
  - `APP`：應用程式框架
  - `UI`：主要 UI
  - `SK`：草圖 Sketch
  - `FEAT`：特徵 Features
  - `PART`：零件 Part
  - `ASM`：組合件 Assembly
  - `DRW`：工程圖 Drawing
  - `VIEW`：視圖與顯示
  - `SEL`：選取與互動
  - `ERR`：錯誤與狀態

### 3.2 每個功能必須記錄

- 功能名稱
- 關聯 UI 元素
- 互動步驟
- 命令名稱
- 對話框欄位
- 鍵盤/滑鼠操作
- 前置條件
- 預期結果
- 手冊 URL 引用（manualRef）

### 3.3 每個 UI 命令都必須有

- 入口位置
- 啟用條件
- 禁用條件
- 結果狀態

### 3.4 每個互動流程都必須有

- 至少一個驗收案例

### 3.5 無法實作的項目

- 必須列出原因
- 必須提供替代方案（如有）
- 狀態設為 `out_of_scope_with_reason`
- 必須由人工審核通過

## 4. 驗收標準

### 4.1 文件層面

- [ ] 存在完成度公式（第 1.2 節）
- [ ] 所有狀態值定義清楚（第 2 節）
- [ ] Agent 不能用「已大致完成」作為結案條件（第 2.1 節）

### 4.2 功能層面

- [ ] 每個手冊章節都有對應記錄
- [ ] 每個功能至少有一個 ID
- [ ] 每個 ID 都能追溯回原始手冊 URL
- [ ] 每個功能至少有一個驗收案例

### 4.3 最終 100% 驗收條件

專案只有在以下條件全部成立時，才可標記為 100%：

1. feature-matrix 中所有 applicable 功能 status = verified
2. 每個 verified 功能都有 manualRef
3. 每個 verified 功能都有至少一個自動或人工驗收紀錄
4. 每個 UI entrypoint 都能觸發 command 或正確 disabled
5. Undo/Redo、錯誤狀態、選取狀態、文件儲存重載通過測試
6. coverage report 無 uncovered / untested / undocumented 項目
7. 人工審核 out_of_scope_with_reason 清單

## 5. Agent 執行規則

本計畫的開發 Agent 必須遵守以下規則：

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

## 6. 文件清單

本計畫要求產出的文件：

| 文件 | 路徑 | 負責 Phase |
|------|------|-----------|
| Alignment Charter | `docs/solidworks-2010-alignment-charter.md` | Phase 0 |
| Source Map | `docs/solidworks-2010-source-map.md` | Phase 1 |
| Feature Matrix | `docs/solidworks-2010-feature-matrix.csv` | Phase 1 |
| UI Parity Spec | `docs/ui-parity-spec.md` | Phase 3 |
| Interaction Test Plan | `docs/interaction-test-plan.md` | Phase 4 |
| Coverage Report | `reports/coverage-solidworks-2010.md` | Phase 9 |

## 7. 版本歷史

| 版本 | 日期 | 變更 | 作者 |
|------|------|------|------|
| 1.0 | 2026-06-15 | 初始版本 | 開發 Agent |
