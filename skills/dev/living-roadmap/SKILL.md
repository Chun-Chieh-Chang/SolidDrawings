---
name: living-roadmap
description: >
  Maintains an auto-updating `docs/DEVELOPMENT_ROADMAP.md` that aggregates
  project maturity scores, test counts, SCS (UI/UX) score, TypeScript status,
  completed milestones, and remaining P2/P3 backlog — pulling from
  gap-analysis-report.md, check_sw_gaps.py, pytest, Jest, and tsc --noEmit.
  Trigger when the user asks for "roadmap", "進度", "開發地圖", "gap analysis",
  "current status", "progress report", "what's left", "how far along",
  or after completing any significant development work. Use it any time the user
  asks about overall project state — this is the canonical way to answer "where
  are we" questions. Do NOT rely on stale knowledge — run the script to get live
  data. Also auto-trigger after any sprint/task completion to keep the roadmap fresh.
---

# Living Roadmap — 自動化開發路線圖

## 為什麼需要這個技能

在大型專案中，進度資訊分散在多個地方：
- `gap-analysis-report.md` 有領域分數
- `check_sw_gaps.py` 有 SCS 分數
- 測試結果散落在終端機輸出中
- `docs/04_DEVELOPMENT/ROADMAP.md` 是靜態的且過時

這個技能將所有來源彙整為**一個即時更新的真相來源**：`docs/DEVELOPMENT_ROADMAP.md`。

## 觸發時機

| 情境 | 動作 |
|:---|---:|
| 用戶問「目前進度」、「做完了嗎」、「還差什麼」 | **執行完整更新** → 回答 + 顯示儀表板 |
| 完成一個 sprint / 一個 task 之後 | **執行完整更新** → roadmap 自動反映新進度 |
| 用戶問「測試狀況」、「tsc 過了嗎」 | **執行完整更新** → 測試數字自動更新 |
| 用戶問「下一個要做什麼」 | 執行更新後查看 P2/P3 backlog |
| 用戶問「最近完成了什麼」 | 執行更新後查看里程碑清單 |

## 工作流程

### 快速更新（標準用法）

```bash
python skills/dev/living-roadmap/scripts/update_roadmap.py
```

這個指令會：
1. 解析 `gap-analysis-report.md` → 提取領域分數、里程碑、P2 待辦
2. 執行 SCS 掃描器 → 取得 UI/UX 相容性分數
3. 執行 `pytest` → 取得後端測試數量
4. 執行 `npx jest` → 取得前端測試數量
5. 執行 `npx tsc --noEmit` → 確認 TypeScript 編譯狀態
6. 合併所有資料 → 輸出 `docs/DEVELOPMENT_ROADMAP.md`

### 完整更新（含手動審閱）

當你需要在更新 roadmap 的同時**同步更新 gap analysis**：

```bash
# Step 1: 更新 gap analysis（如果需要）
python skills/dev/solidworks-gap-analyzer/scripts/check_sw_gaps.py

# Step 2: 手動更新 gap-analysis-report.md 中的分數和里程碑
# （如果完成了新功能）

# Step 3: 執行 roadmap 更新
python skills/dev/living-roadmap/scripts/update_roadmap.py

# Step 4: 審閱輸出
# 確認 docs/DEVELOPMENT_ROADMAP.md 的內容正確
```

### 自動化整合（hook）

將以下內容加入 pre-commit hook 或 post-task 腳本，讓 roadmap 自動保持最新：

```bash
# .hooks/post-task
python skills/dev/living-roadmap/scripts/update_roadmap.py
```

或者在 `package.json` 中加入 npm script：

```json
{
  "scripts": {
    "roadmap": "python skills/dev/living-roadmap/scripts/update_roadmap.py"
  }
}
```

## 輸出文件結構

`docs/DEVELOPMENT_ROADMAP.md` 的自動生成結構：

```
# 🗺️ 3D-Builder 開發路線圖（即時更新）

## 📊 現況儀表板
- 總體成熟度（活躍領域平均值，排除刻意擱置的 0% 領域）
- SCS (UI/UX 相容性)
- TypeScript 編譯狀態（✅ 或 ❌ + 錯誤數）
- 後端/前端測試數量
- 領域成熟度表格（附 ASCII 進度條）

## 🎯 領域詳細狀態
- 每個主要領域的 ✅ 已實作 / ❌ 尚未實作 細項清單
- 自動從 gap-analysis-report.md 的 sections 2-7 提取

## 🧪 測試覆蓋率
- pytest / Jest / tsc 詳細數字
- 測試涵蓋模組

## 🔌 API 端點庫存
- 從 gap-analysis-report.md section 10 自動提取
- 依 prefix 分組顯示

## ⚠️ 架構風險
- 從 gap-analysis-report.md section 12 自動提取

## 🎯 優先級行動
- P0/P1/P2/P3 概覽

## 📋 目前 Sprint 任務
- 從 sprint-backlog.md 解析每個任務的驗收標準
- 每個任務顯示：領域、狀態、工時、目標、驗收標準 checkbox 清單
- 任務完成後自動反映（更改 sprint-backlog.md 狀態後重新執行腳本）

## ✅ 近期完成里程碑
- 從 gap-analysis-report.md section 13 自動提取

## 🔧 技術債
- 從 gap-analysis-report.md section 9 自動提取
```

## Sprint 任務管理（新增功能）

### sprint-backlog.md 格式

專案根目錄的 `sprint-backlog.md` 是任務追蹤的真相來源。每個任務的格式如下：

```markdown
### [P2] Smart Mates (智慧結合)
- **領域**: Assembly (currently 50%)
- **優先級**: P2 (Medium)
- **狀態**: pending    ← 可設為 pending / in_progress / done
- **依賴**: Sub-assemblies CRUD ✅ (已完成)
- **估計工時**: 4-6h
- **目標**: 使用者可拖曳元件幾何參考直接建立結合
- **驗收標準**:
  - [ ] 使用者選取一個 face/edge/axis 作為 mate reference
  - [ ] 拖曳到另一元件時自動推斷 mate 類型
```

### 任務完成流程

當你完成一個任務後：

1. **更新 sprint-backlog.md**：
   - 將該任務的 `- **狀態**:` 改為 `done`
   - 將對應的驗收標準 `[ ]` 改為 `[x]`
   - 如果任務在 "Active Tasks" 下完成，將其移至 "Completed Tasks" 區塊

2. **更新 gap-analysis-report.md**：
   - 提高對應領域的分數
   - 在 section 13 加入里程碑
   - 更新 P2/P3 清單

3. **執行 roadmap 更新**：
   ```bash
   python skills/dev/living-roadmap/scripts/update_roadmap.py
   ```
   - sprint 任務章節會自動反映最新狀態
   - 完成的任務不再顯示在 Active Tasks 中

### 自動化更新機制

`update_roadmap.py` 在每次執行時會：

1. 讀取 `sprint-backlog.md` 的 Active Tasks
2. 解析每個任務的領域、狀態、驗收標準
3. 過濾掉 `status: done` 的任務（僅顯示進行中任務）
4. 在 roadmap 中產出「目前 Sprint 任務」章節
5. 同時掃描 Completed Tasks 區塊記錄已完成的項目

### 檢查清單（任務完成前）

一個任務真正完成前，應確認：

- [ ] `sprint-backlog.md` 中該任務的驗收標準全部打勾
- [ ] `sprint-backlog.md` 中該任務的 `狀態` 設為 `done`
- [ ] `gap-analysis-report.md` 中對應領域分數已更新
- [ ] `gap-analysis-report.md` 中 milestones 已加入
- [ ] `python skills/dev/living-roadmap/scripts/update_roadmap.py` 執行成功
- [ ] `docs/DEVELOPMENT_ROADMAP.md` 中的任務不再出現於 Active Tasks

## 資料來源對照

| Roadmap 欄位 | 來源 |
|:---|---|
| 領域分數 | `gap-analysis-report.md` 評分總覽表 |
| SCS 分數 | `check_sw_gaps.py` 輸出 |
| pytest 數量 | `pytest -x --tb=line -q` 即時執行 |
| Jest 數量 | `npx jest --passWithNoTests` 即時執行 |
| tsc 狀態 | `npx tsc --noEmit` 即時執行 |
| 里程碑 | `gap-analysis-report.md` section 13 |
| P2 待辦 | `gap-analysis-report.md` section 11 |
| 整體成熟度 | 自動計算：所有領域分數的平均值 |

## 維護事項

### 何時需要手動更新 gap-analysis-report.md

腳本會自動讀取測試數字和 SCS，但以下項目需要手動維護在 `gap-analysis-report.md` 中：

1. **領域分數** — 完成一個主要功能後，調整對應領域的分數
2. **里程碑** — 完成功能後加入 section 13
3. **P2/P3 清單** — 功能完成後標記為 ✅

### 將 roadmap 內容納入對話

當你觸發這個技能後：
1. 執行 `update_roadmap.py`
2. 讀取 `docs/DEVELOPMENT_ROADMAP.md`
3. 摘要呈現給用戶：
   - 總體成熟度
   - 上次更新以來的變化
   - 測試狀態
   - 下一個 P2 項目

### 疑難排解

**測試無法執行：**
- pytest 需要 `backend/.venv` 虛擬環境
- Jest 需要 `node_modules` 安裝完成
- 如果測試無法執行，腳本會略過該項目，roadmap 仍會生成

**SCS 掃描器失敗：**
- 確認 `check_sw_gaps.py` 的檔案路徑正確
- 確認 Viewport.tsx、ContextMenu.tsx、DatumPlanes.tsx 存在

**gap-analysis-report.md 不存在或格式錯誤：**
- 腳本會使用預設值，不影響測試數字和 tsc 狀態

## 與其他技能的關係

- **solidworks-gap-analyzer**: 提供 SCS 分數和詳細的相容性檢查
- **gap-planner / gap-executor**: 從 gap-analysis-report.md 產生衝刺計畫
- 本技能將上述所有資料彙整為一目了然的儀表板

## 輸出範例（節錄）

```
# 🗺️ 3D-Builder 開發路線圖（即時更新）

> **最後更新**: 2026-06-26 20:30
> **自動產生自**: skills/dev/living-roadmap/scripts/update_roadmap.py

## 📊 現況儀表板

| 指標 | 數值 |
|:---|---:|
| 總體成熟度 | **~73%** |
| SCS (UI/UX 相容性) | **100%** |
| TypeScript 編譯 | ✅ |
| 後端測試 (pytest) | **104** passed / 104 total |
| 前端測試 (Jest) | **89** passed / 89 total |

### 領域成熟度
| 領域 | 分數 | 狀態 |
|:---|:---:|:---:|
| **草圖工具** | 95% ████████████████████░ | 🟢 接近完全 |
| **特徵引擎** | 85% █████████████████░░░░░ | 🟡 小幅差距 |
```

## 自動觸發設定

為了讓 roadmap 在每次完成開發工作後自動更新，請執行以下步驟：

### 1. npm script（建議）

```bash
# 將指令加入 package.json
npm pkg set scripts.roadmap="python skills/dev/living-roadmap/scripts/update_roadmap.py"
```

之後可以隨時執行 `npm run roadmap` 來更新。

### 2. post-task hook

建立 `.hooks/post-task`：

```bash
#!/bin/bash
# 在每次 task/sprint 完成後自動更新 roadmap
python skills/dev/living-roadmap/scripts/update_roadmap.py
```

### 3. 手動觸發（無需任何設定）

只要執行：
```bash
python skills/dev/living-roadmap/scripts/update_roadmap.py
```

## 技能內部運作

當這個技能被觸發時，你的工作流程是：

1. **判斷觸發原因**：
   - 用戶直接問進度 → 執行腳本 → 讀取輸出 → 回答
   - 剛完成開發工作 → 執行腳本 → 確認無異常 → （可選）通知用戶

2. **執行腳本**：`python skills/dev/living-roadmap/scripts/update_roadmap.py`

3. **讀取結果**：`docs/DEVELOPMENT_ROADMAP.md`

4. **摘要呈現**：提取關鍵變化點呈現給用戶

5. **如果腳本失敗**：檢查各資料來源是否可用，逐項回報
