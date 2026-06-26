# Task Plan: Sprint 2026-06-25 — P1 Gap Closure + P2 Foundation

## Status: Planned

## Goal
關閉剩餘 2 個 P1 差距 (Unfold/Fold, Annotations/GD&T)，並推進 3 個高價值 P2 項目與 1 個技術債修復，將總體成熟度從 65% 提升至 ~72%。

---

## Sprint Tasks

### Task 1: Unfold / Fold (鈑金手動展開/摺疊) — ✅ P1 — 已完成 2026-06-25

**State before:** Backend functions `generate_unfold()`/`generate_fold()` already existed in geometry_service.py (lines 5847-5884). API routes `/unfold` and `/fold` already existed in geometry.py (lines 483-523). Missing: frontend wiring.

**What was done:**
- [x] Verified: backend endpoints exist (`POST /unfold`, `POST /fold`) with `UnfoldRequest`/`FoldRequest` models
- [x] Added `createUnfold()` and `createFold()` to `HeavyEngineClient.ts`
- [x] Added `handleUnfold` and `handleFold` to `sheet-metal-builders.ts`
- [x] Added `handleUnfold`/`handleFold` to `useFeatureBuilders` return (`index.ts`)
- [x] Wired `handleUnfold`/`handleFold` props through `page.tsx` → `RibbonController.tsx`
- [x] Replaced stub buttons (previously called `handleCreateFlatPattern` + toast) with dedicated handlers
- [x] `tsc --noEmit`: zero new errors ✅
- [x] Backend tests: 100 passed, 2 skipped ✅

### Task 2: Annotations / GD&T (工程圖註記) — ✅ P1 — 已完成 2026-06-26

**What was done:**
- [x] Subtask A: Annotation 型別定義 (`DatumFeature`, `GeometricTolerance`, `DrawingAnnotation`) + store slices (addAnnotation, updateAnnotationPosition, removeAnnotation)
- [x] Subtask B: Datum Feature UI (三角符號 + 文字標籤 SVG 渲染, header 按鈕)
- [x] Subtask C: GD&T 特徵控制框 UI (多格矩形 + 公差值 + 基準參考 SVG 渲染)
- [x] Subtask D: SVG 渲染 + 拖曳定位 (AnnotationLayer 內建 DnDGroup 支援滑鼠拖曳)
- [x] 註記資料保存在 drawing store 中，切換視圖後保持 (annotations 陣列在 DrawingSheetData 中)
- [x] `tsc --noEmit`: 零錯誤 ✅
- [x] `npx jest`: 80 passed ✅

**Not yet implemented (future):**
- PDF 匯出包含註記 (需額外實作)
- 點擊選取註記位置 (目前使用預設位置)
- 編輯已存在註記的內容

### Task 3: Sketch Fillet / Chamfer (草圖圓角/倒角) — ✅ P2 — 已完成 2026-06-26

**Acceptance Criteria:**
- [x] 草圖圓角功能: 選取 2 條相交線 → 產生圓弧半徑 r 連接
- [x] 草圖倒角功能: 選取 2 條相交線 → 產生斜角 (角度+距離)
- [x] SKETCH 工具欄出現 Fillet 和 Chamfer 按鈕
- [x] 支援 SKETCH 模式下選取線段後套用
- [x] `tsc --noEmit` 無新錯誤

- [x] Subtask A: 前端幾何 — `computeFillet()`/`computeChamfer()` 2D 向量計算 (sketch-fillet-chamfer.ts)
- [x] Subtask B: FilletToolHandler + ChamferToolHandler (2-phase edge selection) + Ribbon UI 按鈕
- [x] Subtask C: `applyFillet`/`applyChamfer` store actions (saveSnapshot undo support, edge trimming, arc/chamfer edge creation)
- [x] 單元測試 9 項 (垂直/平行/銳角/零長度/零半徑 fillet + 垂直/平行/斜角長度/零距離 chamfer)

### Task 4: Crop View / Auxiliary View (工程圖裁剪/輔助視圖) — ✅ P2 — 已完成 2026-06-26

**What was done:**
- [x] CROP/AUXILIARY 型別加入 `DrawingSheetViewData` union + `cropBoundary` field (`types.ts`)
- [x] `cropView`/`createAuxiliaryView` actions in `drawing-state.ts`
- [x] SVG clipPath 裁剪渲染 + auxiliary view 輔助邊緣渲染 + UI 按鈕 overlay (`DrawingSheet.tsx`)
- [x] Crop/Auxiliary 按鈕在各 view header 渲染
- [x] `tsc --noEmit`: 零錯誤 ✅
- [x] `npx jest`: 89 passed ✅

### Task 5: 前端測試基礎設施修復 — ✅ P2 (Tech Debt) — 已完成 2026-06-26

**State before:** Jest 已安裝並正常運作 (76 tests)，但缺少 `test:frontend` script、無元件渲染測試、gap report 錯誤描述為 vitest/playwright 衝突。

**What was done:**
- [x] 診斷：實際使用 Jest 而非 vitest，且無衝突 (Jest `**/__tests__/**` vs Playwright `tests/e2e/`)
- [x] 安裝 `@testing-library/react` + `@testing-library/jest-dom` + `jest-environment-jsdom`
- [x] 新增 `test:frontend` script (`jest`) + `test` script (frontend + backend 合併)
- [x] 撰寫 SheetFormatSelector 元件測試 (4 tests: render, dropdown, highlight, onChange)
- [x] 前端測試總數：**80 passed** (原 76 + 新 4)
- [x] `tsc --noEmit`: 零錯誤 ✅
- [x] 更新 gap-report.md：Testing 30%→35%，移除 vitest/playwright 風險

### Task 6: Bend Table (鈑金彎曲表格) — ✅ P2 — 已完成 2026-06-26

**What was done:**
- [x] 後端 `POST /api/v1/geometry/bend_table` — 從 features 推導 bend 表格 (角度、半徑、方向、K-Factor)
- [x] 前端 BendTablePanel 浮動面板 (表格顯示 + K-Factor 編輯 input)
- [x] 前端 `updateBendTableKFactor` store action + `bendTableData`/`showBendTable` state
- [x] Sheet Metal 工具欄「Bend Table」按鈕 (RibbonController) + `BendTablePanel` 渲染 (DrawingSheet)
- [x] `tsc --noEmit`: 零錯誤 ✅
- [x] `npx jest`: 89 passed ✅

---

## Gap Scoring After This Sprint (Projected)

| Domain | Current | Target | Δ |
|:---|---:|---:|---:|
| Sheet Metal (鈑金) | 85% | 90% | +5% |
| Drawing (工程圖) | 50% | 60% | +10% |
| Sketch (草圖) | 85% | 88% | +3% |
| Testing | 30% | 35% | +5% |
| **Overall** | **65%** | **~72%** | **+7%** |

## Errors Encountered
| Error | Attempt | Resolution |
|---|---|---|
| (none yet) | | |
