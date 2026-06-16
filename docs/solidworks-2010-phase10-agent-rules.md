# SolidWorks 2010 Alignment — Agent 執行規則

> 基準：`solidworks-2010-alignment-plan.md` Phase 10
> 創建日期：2026-06-15
> 狀態：**ACTIVE**

---

## 1. 角色定義

你是本專案的 SolidWorks 2010 Alignment Agent。專案目標是依據 SolidWorks 2010 中文使用說明手冊建立功能與 UI 對齊版本。

---

## 2. 核心執行規則

### 2.1 功能追蹤紀律

1. **不得直接宣稱完成**，必須更新 `docs/solidworks-2010-feature-matrix.csv`。
2. 每新增一個功能，必須補上：
   - `manualRef` — 手冊章節或 URL 引用
   - `command id` — 內部命令 ID（如 `CMD-SK-001`）
   - `UI entrypoint` — UI 入口位置（如 `Ribbon > Sketch > Line`）
   - `test id` — 對應測試檔案與測試用例 ID
   - `acceptance criteria` — 驗收標準（可測量的行為描述）
3. 每修改 UI，必須更新 `docs/ui-parity-spec.md`。
4. 每實作 command，必須支援 `enabledWhen`、`execute`、`undo`/`redo` 或明確標記原因。
5. 每次完成任務後，執行測試並重新生成 coverage report。
6. 若發現手冊功能未收錄，先補 `source-map` 與 `feature-matrix`，再實作。
7. 不允許以「近似完成」結案；只能以 `verified` 狀態計入完成度。

### 2.2 完成度計算公式

```
completion = verified_features / total_applicable_features * 100
```

- `out_of_scope_with_reason` 不計入分母，但必須由人工審核通過。
- 任何功能沒有測試時，完成度不能到 100%。
- 任何功能沒有手冊來源時，不能標為 `verified`。

### 2.3 狀態定義

| 狀態 | 說明 |
|------|------|
| `not_started` | 尚未開始 |
| `designed` | 已設計（有規格文件） |
| `implemented` | 已實作（有程式碼） |
| `tested` | 已測試（有測試覆蓋） |
| `verified` | 已驗證（通過所有驗收標準） |
| `out_of_scope_with_reason` | 超出範圍（需註明原因） |

---

## 3. 測試紀律

### 3.1 前端測試（Jest）

```bash
# 執行所有前端測試
npx jest

# 執行特定測試檔案
npx jest src/utils/__tests__/EquationEngine.test.ts

# 產生覆蓋率報告
npx jest --coverage
```

測試檔案位置：`src/**/__tests__/*.test.ts`

### 3.2 後端測試（pytest）

```bash
# 執行所有後端測試
uv run --directory backend pytest backend/tests

# 執行特定測試
uv run --directory backend pytest backend/tests/test_phase8_critical.py
```

測試檔案位置：`backend/tests/*.py`

### 3.3 端到端測試（Playwright）

```bash
# 啟動開發伺服器
npm run dev

# 執行 E2E 測試
npm run test:e2e

# UI 模式
npm run test:e2e:ui
```

測試檔案位置：`tests/e2e/*.spec.ts`

---

## 4. 覆蓋率報告生成

```bash
# 生成完整的 SolidWorks 2010 完成度報告
python scripts/generate-solidworks-coverage-report.py
```

報告位置：`reports/coverage-solidworks-2010.md`

報告包含：
- 總覽（總數、實作數、驗證數、完成度）
- 測試基礎設施統計
- 各功能區域完成度
- 未完成功能清單
- 缺失引用分析
- 缺口分析

---

## 5. 最終 100% 驗收條件

專案只有在以下條件全部成立時，才可標記為 100%：

1. `feature-matrix` 中所有 applicable 功能 status = `verified`
2. 每個 verified 功能都有 `manualRef`
3. 每個 verified 功能都有至少一個自動或人工驗收紀錄
4. 每個 UI entrypoint 都能觸發 command 或正確 disabled
5. Undo/Redo、錯誤狀態、選取狀態、文件儲存重載通過測試
6. Coverage report 無 uncovered / untested / undocumented 項目
7. 人工審核 `out_of_scope_with_reason` 清單

---

## 6. 開發流程範例

### 新增一個草圖功能（例如：螺旋線 Spline）

```
1. 更新 feature-matrix.csv：
   - id: SW2010-SK-022
   - status: designed → implemented → tested → verified
   - manualRef: https://help.solidworks.com/...
   - command id: CMD-SK-022
   - ui entrypoint: Ribbon > Sketch > Spline
   - test id: TEST-SK-022

2. 實作程式碼：
   - src/utils/sketch/ToolHandlers/SplineTool.ts
   - src/ui/RibbonBar/RibbonController.tsx（按鈕）
   - src/ui/PartFeaturePropertyManager.tsx（參數面板）

3. 更新 ui-parity-spec.md：
   - 記錄 Spline 工具的 UI 行為

4. 撰寫測試：
   - src/utils/__tests__/SplineTool.test.ts
   - 測試：繪製、編輯、刪除、約束

5. 執行測試：
   - npx jest SplineTool.test.ts

6. 更新 coverage report：
   - python scripts/generate-solidworks-coverage-report.py

7. 標記為 verified：
   - 確認所有 acceptance criteria 通過
   - 更新 CSV status = verified
```

---

## 7. 常見陷阱與預防

| 陷阱 | 預防措施 |
|------|---------|
| 直接修改 store 而不經過 command | 所有狀態變更必須走 command pipeline |
| 忘記更新 feature-matrix | 完成功能後立即更新 CSV |
| 測試只覆蓋 happy path | 必須包含錯誤輸入、邊界條件 |
| UI 變更未記錄在 ui-parity-spec | 每次 UI 修改同步更新規格 |
| 忽略 manualRef 引用 | 每個 verified 功能都必須有手冊來源 |

---

## 8. 版本歷史

| 版本 | 日期 | 變更 | 作者 |
|------|------|------|------|
| 1.0 | 2026-06-15 | 初始版本 — Agent 執行規則 | 開發 Agent |
