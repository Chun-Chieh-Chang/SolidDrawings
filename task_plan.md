# Task Plan: Sprint 2026-08-16 — Tool-Calling 3D 工程繪圖工具引擎級整合

## Status: Planned

## Goal
整合 Tool-Calling 註冊庫「3D工程繪圖」分類中的 3 個工具（OpenSCAD、CADAM text-to-CAD、FreeCAD）進入 3D-Builder 的 3D 建模管線：

1. **OpenSCAD 引擎整合**：後端呼叫 OpenSCAD headless CLI 編譯 `.scad` → STL → OCCT shape，成為新特徵類型 `OPENSCAD`，與原生草圖-特徵建模共存於同一 B-Rep 特徵樹。
2. **CADAM text-to-CAD 流程**：後端 LLM（OpenRouter）將自然語言需求轉為 OpenSCAD 程式碼，前端面板一鍵生成 → 預覽 → 插入文件。
3. **FreeCAD 引擎整合**：以 FreeCAD Python API 提供 STEP/IGES/DXF 轉換與 TechDraw 2D 工程圖輸出（可選、優雅降級）。
4. **管線重構**：匯入/生成幾何（`IMPORTED_STL`、`OPENSCAD`）與原生草圖-特徵建模無縫共存 — 同一特徵樹、同一 rebuild 流程、同一視埠渲染、可匯出 STEP。

> 排除 scroll-world（3D landing page 生成器，非工程繪圖工具）。
> 基準：Tool-Calling registry/tools.json 分類「3D工程繪圖」4 工具中取 3 個。

---

## 前置條件 (Prerequisite 0)

### Task 0.1: 修復 backend 虛擬環境
- [x] 現況：`backend/.venv` 的 uv trampoline 失敗（`uv trampoline failed to spawn Python child process`）
- [x] 以 `uv venv .venv` 重建，`uv pip install -r requirements.txt`，pythonocc-core 以 conda-forge 安裝（Python 3.10-3.12）
- [x] 驗證：`uv run --directory backend python -c "import OCC; print('OK')"` + `GET /api/v1/health` 回 200

### Task 0.2: 安裝 OpenSCAD CLI
- [x] `winget install OpenSCAD.OpenSCAD`（或 choco），確認 `openscad --version`（✅ 已安裝於 `C:\Program Files\OpenSCAD\openscad.exe`，`find_openscad()` 可發現）
- [x] 後端支援 `OPENSCAD_PATH` 環境變數覆寫，找不到 binary 時優雅降級（503 + 安裝指引）

---

## Milestone 1: 後端 OpenSCAD 引擎

### Task 1.1: `backend/app/services/openscad_service.py`（新檔）
- [x] `find_openscad()`：PATH → 常見安裝路徑 → `OPENSCAD_PATH` env
- [x] `compile_scad(scad_code, out_stl_path)`：寫暫存 `.scad` → subprocess 執行 `openscad -o out.stl in.scad`（timeout 30s、擷取 stderr）
- [x] `import_stl_to_shape(stl_path)`：`StlAPI_Reader` → TopoDS_Shape（ShapeFix 清理）
- [x] `shape_to_mesh(shape)`：複用 geometry_service 的 mesh 產生邏輯（避免重複實作，以 import 方式共用）

### Task 1.2: geometry_service 新增特徵類型
- [x] `OPENSCAD`：`build_feature_shape_in_isolation` + `build_shape_only` + `process_features` 三處分派鏈加入分支 — parameters `{scad_code}` → compile → import → shape
- [x] `IMPORTED_STL`：鏡像 `DUMB_SOLID` 模式 — parameters `{filepath}` → import_stl_to_shape（含平移參數 x/y/z）
- [x] 驗證：`OPENSCAD` 特徵可與 `EXTRUDE` 等原生特徵在同一鏈條 fuse（BRepAlgoAPI_Fuse）

### Task 1.3: API 路由（routers/geometry.py 或新 openscad.py）
- [x] `POST /openscad/compile` `{scad_code}` → `{success, mesh, stl_path, error}`
- [x] `POST /upload_stl`（UploadFile）→ `{filepath}`（鏡像 upload_step）
- [x] `POST /openscad/import_preview` `{filepath}` → `{success, mesh, error}`（STL 匯入預覽）
- [x] main.py 註冊路由

### Task 1.4: 後端測試（tests/test_openscad_service.py）
- [x] openscad_service 單元測試（binary 不存在時 `pytest.mark.skipif` 跳過）
- [x] OPENSCAD/IMPORTED_STL 特徵鏈條測試（有 binary 才跑，`@pytest.mark.occ` 風格）
- [x] 無 OpenSCAD 時 compile API 回 503 的測試（mock find_openscad 回 None）

---

## Milestone 2: 後端 text-to-CAD（CADAM 流程）

### Task 2.1: `backend/app/services/text_to_cad_service.py`（新檔）
- [x] `generate_openscad_code(prompt, model)`：呼叫 OpenRouter API（`OPENROUTER_API_KEY` env）
- [x] System prompt 強制輸出「僅 OpenSCAD 程式碼」（無 markdown fence、無解釋），附 OpenSCAD 語法要點（units mm、CSG 操作）
- [x] 錯誤處理：API key 缺失/網路失敗/回應非程式碼 → 明確錯誤訊息；回應清理（剝離 ```scad fence）
- [x] 支援 `TEXT_TO_CAD_MODEL` env 指定模型（預設 openrouter 上的便宜程式碼模型）

### Task 2.2: API 路由
- [x] `POST /text-to-cad/generate` `{prompt}` → `{scad_code, model, error}`
- [x] main.py 註冊

### Task 2.3: 後端測試（tests/test_text_to_cad_service.py）
- [x] 以 httpx MockTransport 模擬 LLM 回應（成功 / fence 包裹 / 失敗）
- [x] API key 缺失時錯誤訊息測試

---

## Milestone 3: 前端管線共存 + OpenSCAD 面板

### Task 3.1: HeavyEngineClient 擴充
- [x] `compileOpenScad(scadCode)` → POST /openscad/compile
- [x] `generateTextToCad(prompt)` → POST /text-to-cad/generate
- [x] `uploadStlFile(file)` → POST /upload_stl
- [x] `importStlPreview(filepath)` → POST /openscad/import_preview

### Task 3.2: OpenSCAD 面板（`src/ui/OpenScadPanel/OpenScadPanel.tsx`）
- [x] Tab 1「文字轉 CAD」：prompt 輸入 → [生成] → 可編輯的 OpenSCAD 程式碼 → [預覽] → [插入文件]
- [x] Tab 2「OpenSCAD 腳本」：程式碼編輯器（monospace textarea）→ [編譯預覽] → [插入文件]
- [x] Tab 3「STL 匯入」：檔案上傳 → 預覽 → [插入文件]
- [x] 預覽：3D mesh 預覽視窗（Three.js，複用 MeshData/OcctShape 渲染邏輯）
- [x] [插入文件] → `addFeature({type:'OPENSCAD'|'IMPORTED_STL', parameters})` → 觸發既有 rebuild 流程

### Task 3.3: 功能樹與屬性面板整合
- [x] FeatureManagerPanel：OPENSCAD/IMPORTED_STL 特徵顯示（名稱/圖示/可選中刪除）
- [x] PartFeaturePropertyManager：編輯 OPENSCAD 特徵 → 開啟面板（腳本可再編輯 → updateFeatureParams → rebuild）
- [x] Ribbon：FEATURES 分頁加入「OpenSCAD」按鈕開啟面板（遵循 RibbonController 既有模式）

### Task 3.4: 前端驗證
- [x] `npm run typecheck` 零新錯誤
- [x] `npm run lint` 通過
- [x] 既有測試無回歸

---

## Milestone 4: FreeCAD 引擎整合（⏸️ 延後 — 另行 sprint）

> ⚠️ FreeCAD 依賴重（conda 安裝 ~1-2GB、Python 3.10-3.12 限制）。經使用者確認，**本 sprint 延後**，不影響 M1-M3 交付。以下保留為未來 sprint 的任務定義：

### Task 4.1: `backend/app/services/freecad_service.py`（新檔）
- [ ] 惰性 import FreeCAD Python API（`import FreeCAD`），不存在時回 503 + 安裝指引
- [ ] `convert_format(src_path, dst_format)`：STEP/IGES/DXF 轉換（Import/Export 模組）
- [ ] `generate_techdraw_2d(shape_path, views)`：TechDraw 產生 2D 工程圖（SVG/DXF 輸出）

### Task 4.2: API 路由
- [ ] `POST /freecad/convert`、`POST /freecad/techdraw`
- [ ] 驗證：無 FreeCAD 環境回 503（測試 mock）

> ⚠️ FreeCAD 依賴重（conda 安裝 ~1-2GB、Python 3.10-3.12 限制）。若本 sprint 不納入，此里程碑延後，不影響 M1-M3 交付。

---

## Milestone 5: 驗證與 PDCA

### Task 5.1: 全量驗證
- [x] 後端：`uv run --directory backend pytest backend/tests`（含新增測試）全綠 — 141 passed, 1 skipped（`test_surface_cut.py` 既有 pythonocc binding 問題，與本 sprint 無關；OpenSCAD 相關 19 測試含真實 binary 全數通過）
- [x] 前端：`npm run typecheck` + `npm run lint`（僅剩既有 tests/e2e/helpers 未追蹤檔案錯誤與既有 warnings）
- [x] E2E 冒煙：Playwright 開啟面板 → 輸入簡單 scad（`cube([10,10,10])`）→ 編譯預覽 → 插入 → 視埠顯示方塊（✅ `tests/e2e/openscad-smoke.spec.ts` 2 passed，含 Text-to-CAD tab 驗證）

### Task 5.2: PDCA 文件
- [x] DEV_LOG.md 記錄本 sprint（含 RCA/CAPA 格式）
- [x] task_plan.md 更新完成狀態
- [x] docs/productization/PRODUCTIZATION_PLAN.md 若有受影響段落同步更新
- [x] `npm run pdca:check` 通過

---

## 風險與緩解

| 風險 | 緩解 |
|:---|:---|
| OpenSCAD 安裝失敗/無權限 | winget 失敗改用 choco/portable zip；後端優雅降級 503 |
| pythonocc-core 環境重建失敗 | 依 SETUP.md 流程（uv + conda-forge）；若仍失敗，先以 mock 測試推進 |
| LLM 生成非法 OpenSCAD 程式碼 | 編譯失敗時回傳 openscad stderr；面板顯示錯誤並允許手動編輯 |
| STL 網格品質差（非流形） | StlAPI_Reader + ShapeFix；預覽標示警告 |
| FreeCAD 依賴過重 | 標記可選，優雅降級，可延後 |

## 對照：Tool-Calling 註冊庫 4 工具處置

| 工具 | 處置 | 落地形式 |
|:---|:---|:---|
| OpenSCAD | ✅ 引擎級整合 | 後端 CLI + `OPENSCAD` 特徵類型 |
| CADAM | ✅ 流程整合 | text-to-CAD（LLM→OpenSCAD→STL→文件） |
| FreeCAD | ⚠️ 可選引擎整合 | FreeCAD Python API（轉換 + TechDraw） |
| scroll-world | ❌ 排除 | 非工程繪圖工具 |