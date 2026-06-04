# 3D-Builder 開發交接指南 (Handover Resume Guide)

> **最後更新**：2026-06-04
> **版本**：v2.0 (完整重寫)

此文檔專為後續接手的 AI Agent 或開發者設計。閱讀完本文檔後，您應該能夠**無縫接手**所有開發工作，並避免踩到過去踩過的地雷。

---

## 1. 專案現況 (Project Overview)

| 項目 | 說明 |
|------|------|
| **核心架構** | Next.js 16 + React Three Fiber (R3F) + Zustand + PythonOCC Backend |
| **前端** | `src/` — TypeScript/TSX，使用 Tailwind CSS |
| **後端** | `backend/` — FastAPI + PythonOCC (幾何核心)，預設埠 8400 |
| **部署** | GitHub Pages via GitHub Actions (`deploy.yml`) |
| **當前目標** | 工業級 3D CAD 建模軟體網頁版，已完成草圖引擎重構 |

### 專案結構概覽
```
src/
├── app/page.tsx              # 主入口，註冊所有 window global hooks
├── store/
│   ├── useCadStore.ts        # Zustand 全局狀態 (SketchNode, SketchEdge, etc.)
│   └── sketchActions.ts      # 🔒 草圖操作的唯一合法入口 (含 GC)
├── renderer/
│   ├── DatumPlanes.tsx       # 草圖平面、滑鼠射線、預覽線渲染
│   ├── SketchPreview.tsx     # 草圖實體渲染、標註互動、端點拖拉
│   ├── Viewport.tsx          # R3F Canvas、Camera、OrbitControls
│   └── OcctShape.tsx         # 3D B-Rep 網格渲染
├── utils/sketch/
│   ├── ToolHandlers/         # 草圖工具狀態機 (Line, Circle, Rect, etc.)
│   ├── DataIntegrity.ts      # NaN 防護
│   └── ConstraintSolver.ts   # 幾何約束解算
├── hooks/
│   ├── useFeatureBuilders.ts # 草圖→3D 特徵管線 (Extrude, Revolve, etc.)
│   └── usePartRebuild.ts    # 重建觸發與後端通訊
├── kernel/
│   ├── HeavyEngineClient.ts  # 後端 API 客戶端
│   └── SketchSolverService.ts# 約束求解服務
└── ui/                       # Ribbon, Panels, Modals, etc.
```

---

## 2. 核心架構指南 (Architecture Guide)

### 2.1 狀態管理的三層架構

```
┌─────────────────────────────────────────┐
│ Layer 1: UI Components                  │
│ (RibbonController, ShortcutBox, etc.)   │
│ → 只讀取狀態，觸發 Actions              │
├─────────────────────────────────────────┤
│ Layer 2: Action Layer                   │
│ ├── sketchActions.ts (草圖拓撲操作)     │  ← 唯一合法入口
│ ├── ToolHandlers/* (繪圖狀態機)         │
│ └── useFeatureBuilders.ts (特徵管線)    │
├─────────────────────────────────────────┤
│ Layer 3: State Store                    │
│ └── useCadStore.ts (Zustand)            │
└─────────────────────────────────────────┘
```

### 2.2 `sketchActions.ts` — 草圖操作的唯一合法入口 🔒

所有牽涉草圖拓撲 (Nodes/Edges/Constraints) 的增刪改，**必須**透過此模組：

| 函數 | 用途 | GC |
|------|------|----|
| `addNode(u, v, isFixed)` | 新增節點（含 NaN 驗證） | ❌ |
| `addEdge(type, nodeIds)` | 新增線段 | ❌ |
| `addConstraint(type, edgeIds, nodeIds, value)` | 新增約束 | ❌ |
| `deleteEdges(edgeIds)` | 刪除線段 + 連帶 GC | ✅ |
| `deleteNodes(nodeIds)` | 刪除節點 + 連帶 GC | ✅ |
| `deleteEntities(entityIds)` | 通用刪除 + 連帶 GC | ✅ |
| `commitBatch(nodes, edges, constraints)` | 批量替換（如矩形一次建 4 線段） | ❌ |

**⚠️ 已知違規點**：`SketchPreview.tsx` 的 `handleEntityClick` 直接呼叫 `setSketchConstraints` 新增約束，繞過 `sketchActions`。目前因為是新增操作（不需要 GC）所以無害，但違反架構原則。

### 2.3 ToolHandlers — 繪圖工具狀態機

| 檔案 | 對應工具 | 狀態 |
|------|----------|------|
| `LineTool.ts` | LINE / CENTER_LINE | ✅ 含磁吸約束自動綁定 |
| `CircleTool.ts` | CIRCLE | ✅ 兩次點擊 (中心+半徑) |
| `RectangleTool.ts` | RECTANGLE | ✅ 自動建立 H/V 約束 |
| `ArcTool.ts` | ARC | ✅ 三次點擊 |
| `SplineTool.ts` | SPLINE | ✅ 連續控制點 |
| `TrimTool.ts` | TRIM | ✅ 透過 sketchActions.deleteEdges |
| `SelectTool.ts` | SELECT | ✅ 基礎選取 |

**關鍵設計**：所有 ToolHandler 透過 `useCadStore.setState({ lastClickedNodeId: nId })` 更新全局狀態。`DatumPlanes.tsx` 在每次 ToolHandler 呼叫後，透過 `syncLastClickedUV()` 將全局狀態同步回本地狀態。

### 2.4 DatumPlanes.tsx — 雙層狀態架構

此檔案同時持有**本地狀態 (useState)** 與**全局狀態 (Zustand)**，是「狀態同步斷裂」的高危區域。

| 本地狀態 | 用途 | 同步來源 |
|----------|------|----------|
| `lastClickedUV` | H/V 磁吸基準點 | 由 `syncLastClickedUV()` 從 store 的 `lastClickedNodeId` 同步 |
| `cursorState` | 游標位置與磁吸類型 | **永不為 null**，無磁吸時設 `{ u, v, type: null }` |
| `hasMovedAway` | 區分點擊 vs 拖曳 | 由 `syncLastClickedUV()` 重置 |
| `isDragging` | TRIM 拖曳軌跡判定 | 本地觸控事件 |

---

## 3. 已知 Bug 模式：「狀態同步斷裂」(State Synchronization Fracture)

這是本專案最常見且最危險的 Bug 類型。當重構將邏輯從 A 模組遷移到 B 模組，但 A 的本地狀態依賴沒有更新時發生。

### 識別特徵
1. 同一份數據同時存在於 `useState` (本地) 和 `useCadStore` (全局)
2. 新模組 (ToolHandler) 只更新 Store，不更新舊模組的 `useState`
3. 渲染邏輯被 `{someState && ...}` 守門，null 時整塊消失

### 掃描指令
接手後請執行以下掃描確認無新增斷裂：
```
# 掃描 ToolHandler 對 Store 的寫入
grep -rn "useCadStore.setState" src/utils/sketch/ToolHandlers/

# 掃描 DatumPlanes 的本地狀態
grep -rn "useState" src/renderer/DatumPlanes.tsx

# 掃描繞過 sketchActions 的直接寫入
grep -rn "setSketchNodes\|setSketchEdges\|setSketchConstraints" src/renderer/ src/hooks/
```

---

## 4. 草圖→3D 特徵管線 (Sketch → Feature Pipeline)

```
繪製草圖 → 提取幾何 → 座標轉換 → 儲存特徵 → 重建觸發 → 後端運算 → 渲染結果
(ToolHandlers) (CycleFinder) (uvTo3D)   (addFeature) (handleRebuild) (PythonOCC) (OcctShape)
```

### 🔴 已知管線風險 (必讀)

| 步驟 | 風險 | 嚴重性 | 說明 |
|------|------|--------|------|
| 座標轉換 | `sketchFeatureTo3DPoints` 不處理 Custom Reference Plane | 🔴 高 | `useFeatureBuilders.ts` L367-438 只處理 FRONT/TOP/RIGHT/FACE，在自定義參考平面上 Extrude 會得到 `[0,0,0]` |
| 幾何提取 | CIRCLE 在 `extractAllPaths` 中缺少控制點 | 🟡 中 | `CycleFinder.ts` L228-231 對 CIRCLE 只讀了 nodeIds[1] 但沒 push |
| 重建觸發 | `setTimeout(handleRebuild, 50)` 時序依賴 | 🟡 中 | 整個管線 14 處使用 50ms 延遲，低效能裝置上可能不夠 |
| 重建觸發 | Fingerprint 快取可能跳過必要重建 | 🟡 中 | `usePartRebuild.ts` L65 如果沒正確設定 `rebuildDirty` 會靜默跳過 |
| ID 生成 | `Date.now()` vs `uuidv4()` 不一致 | 🟢 低 | `handleExitAndExtrude` 用 `Date.now()`，`handleSaveSketchOnly` 用 `uuidv4()` |

### 跨元件通訊：Window Global Hooks

`page.tsx` 在 `useEffect` 中將函數掛載到 `window`，其他元件透過 `(window as any).__handleXxx?.()` 呼叫。**注意 Stale Closure 風險**。

已註冊的 hooks：
- `__handleRebuild` / `__handleExtrude` / `__handleRevolve`
- `__handleSaveSketchOnly` / `__handleConvertEntities` / `__handleOffsetEntities`
- `__handlePrintToPDF` / `__handleEditFeatureSketch`

---

## 5. 接手開發紀律 (Agent Directives)

### 🔴 絕對禁止
1. **禁止盲目替換代碼**：執行 `replace_file_content` 前必須先 `view_file` 確認上下文
2. **禁止在文檔中聲稱完成而實際未執行**：DEV_LOG 中寫的 CAPA 必須確實落實到代碼中
3. **禁止繞過 sketchActions 直接操作草圖拓撲**：所有增刪改必須走 `sketchActions`
4. **禁止使用 `cat`/`sed` 修改檔案**：強制使用系統原生 Tools

### 🟢 強制執行
1. **零錯誤驗證**：宣告完成前必須 `npm run build` 確認零 TypeScript Error
2. **Lint 檢查**：`npm run lint` 必須 0 Errors（Warnings 可接受）
3. **MECE 原則**：代碼模組化，不留死代碼，每個檔案有明確職責
4. **推送前確認**：`git push origin HEAD:main`（本地分支名與遠端不同）
5. **DEV_LOG 更新**：每次修復 Bug 必須記錄 RCA + CAPA

### 環境注意事項
- **Windows 環境**：PowerShell 中無 `grep`/`ls`，使用 `grep_search` tool 或 `dir` 指令
- **Git 推送**：必須使用 `git push origin HEAD:main`，不能用 `git push`
- **後端測試**：本地需要 `conda` 環境安裝 `pythonocc-core`

---

## 6. 未來開發方向 (Roadmap)

### 短期 (High Priority)
1. **修復 Custom Reference Plane 座標轉換缺口** — `sketchFeatureTo3DPoints` 加入 `referencePlanes` 處理
2. **統一 Feature ID 生成** — 全部改用 `uuidv4()`
3. **收斂 SketchPreview 的直接 setState 呼叫** — 改走 `sketchActions`

### 中期
4. **約束解算器優化** — 支援相切、平行等進階幾何約束
5. **Assembly 模式強化** — Mate 約束的解算與動態模擬
6. **Drawing Sheet 完善** — 工程圖紙的自動視圖投影

### 長期
7. **STEP/IGES 匯入匯出** — 透過 PythonOCC 後端
8. **協同編輯** — WebSocket 多人即時協作

---

## 7. 快速啟動指令 (Quick Start)

```bash
# 前端
npm install
npm run dev         # 啟動 Next.js 開發伺服器

# 後端 (需要 conda 環境)
cd backend
python -m uvicorn app.main:app --port 8400 --reload

# 驗證
npm run build       # 確認零 TypeScript Error
npm run lint        # 確認 0 Errors
```

---

*當您閱讀完此份文檔，代表您已經載入了最新的 3D-Builder 開發心智模型。請先閱讀 `DEV_LOG.md` 了解過去的 Bug 歷史，然後繼續我們未竟的工程。*
