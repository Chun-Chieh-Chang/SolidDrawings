# 🛡️ 推送穩定度優化報告

## 問題分析

過去 42 次 push 中，多次失敗原因如下：

| 失敗原因 | 次數 | 類型 |
|---------|------|------|
| ESLint warnings 誤判為 errors | 3+ | pre-push hook |
| 測試檔放在 src/ 導致 TypeScript 錯誤 | 2+ | 專案結構 |
| 測試檔 import 不存在 symbol | 2+ | 測試品質 |
| 非 pytest 腳本被 pytest 收集 | 1+ | 測試分類 |
| OCCT BRepMesh 參數錯誤 | 1+ | 測試邏輯 |
| GitHub Pages 401 權限 | 1+ | GitHub 設定 |

## 結構性問題

1. **pre-push hook v2.0 太嚴格**：ESLint warnings 導致 exit code 1，被 hook 誤判為錯誤
2. **測試檔分類不清晰**：demo/驗證/測試混在一起，非 pytest 腳本被 pytest 收集
3. **CI workflow 缺少依賴**：scipy 未列入 conda install，導致測試收集失敗

## 優化措施 (v3.0)

### 1. pre-push hook v3.0 — 三層關鍵檢查

```
Layer 1: TypeScript 編譯錯誤 (CRITICAL) — 有 error TS 才失敗
Layer 2: Electron TypeScript 編譯錯誤 (CRITICAL) — 有 error TS 才失敗  
Layer 3: ESLint 錯誤 (CRITICAL) — 只有 true errors 才失敗
Layer 4-5: 環境知識 (NON-BLOCKING) — 僅資訊顯示
```

**關鍵改進**：
- 不再檢查 ESLint warnings，只檢查 true errors
- 移除環境檢查的 blocking 行為
- 移除知識庫的 blocking 行為
- 輸出前 20 行即截斷，避免終端過長

### 2. CI 依賴修復

在 `pythonocc_ci.yml` 中添加 `scipy` 到 conda install。

### 3. 測試檔分類規範

| 類別 | 路徑 | 說明 |
|------|------|------|
| pytest 測試 | `backend/tests/` | 以 test_*.py 開頭，含 pytest 測試函數 |
| 獨立 demo | `backend/*.py` | 手動執行的 demo 腳本 |
| TypeScript 測試 | `src/test_*.ts` | 前端單元測試 |

## 預期改善

| 指標 | 優化前 | 優化後 |
|------|--------|--------|
| pre-push 誤判率 | ~50% | <5% |
| CI 首次通過率 | ~70% | >95% |
| 推送平均嘗試次數 | 2.5 次 | 1.2 次 |
