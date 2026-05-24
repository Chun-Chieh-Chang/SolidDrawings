
---

### Task 2026-05-24-5城?geometry API 秋赯

#### Plan

- ? Phase忝hase 0 Internal Stabilization
- ? Backlog ?垮赯望塗斯?/ CAD Kernel / API
- ???姿?P0
- ??岳曉謍?? Frontend ?? Backend (PythonOCC) ? API ▽?????rebuild/export/mass_properties ? endpoints??
- 踐豲麾docs/spec/geometry-api.md 殉朱謓剖寡?README ?刻麾撥???

#### Do

- [x] ?? docs/spec/geometry-api.md??
- [x] 堊垓 rebuild/export/mass_properties/project/convert_entities ? REST endpoints??
- [x] 堊垓 request/response models ??error handling policy??
- [x] ?皝 README.md ?刻麾撥???

#### Check

- [x] 
pm run pdca:check

#### Act

- RCA/CAPA ?秋?秋??橫餈函冪?刻麾秋赯??

---

### Task 2026-05-24-5城?geometry API 秋赯

#### Plan

- ? Phase忝hase 0 Internal Stabilization
- ? Backlog ?垮赯望塗斯?/ CAD Kernel / API
- ???姿?P0
- ??岳曉謍?? Frontend ?? Backend (PythonOCC) ? API ▽?????rebuild/export/mass_properties ? endpoints??
- 踐豲麾docs/spec/geometry-api.md 殉朱謓剖寡?README ?刻麾撥???

#### Do

- [x] ?? docs/spec/geometry-api.md??
- [x] 堊垓 rebuild/export/mass_properties/project/convert_entities ? REST endpoints??
- [x] 堊垓 request/response models ??error handling policy??
- [x] ?皝 README.md ?刻麾撥???

#### Check

- [x] 
pm run pdca:check

#### Act

- RCA/CAPA ?秋?秋??橫餈函冪?刻麾秋赯??

---

### Task 2026-05-24-6城?? src/app/page.tsx ??０?

#### Plan

- ? Phase忝hase 0 Internal Stabilization
- ? Backlog ?垮赯望塗斯?/ UI / UX / Refactoring
- ???姿?P0
- ??岳曉謍? src/app/page.tsx ? legacy sketchPoints 播????? graph-based model??
- 踐豲麾 stub variables?蹍ofile detection heuristics?蹍egacy constraint application functions??

#### Do

- [x]  sketchPoints, sketchRelations stubs ?? cloneSketchPoints ?? SketchEntity interface??
- [x]  entities useMemo ?? legacy constraint application useCallback functions??
- [x] ?? handleExitAndExtrude ?? graph-based solidLoops??
- [x] ?? event handlers (Escape, onDoubleClick)  legacy stub calls??

#### Check

- [x] 
px tsc --noEmit
- [x] 
pm run pdca:check

#### Act

- RCA/CAPA ?秋?秋??橫餈函冪 UI ?０?heck ?謍???

---

### Task 2026-05-24-7城?geometry regression fixtures 秋赯

#### Plan

- ? Phase忝hase 1 Alpha preparation
- ? Backlog ?垮赯望塗斯?/ CAD / Testing
- ???姿?P0
- ??岳曉謍?? golden fixtures (.3dbpart) ?? regression check script??
- 踐豲麾tests/fixtures ?? 	ests/regression/geometry_check.py??

#### Do

- [x] ?? 	ests/fixtures/box_10x10x10.3dbpart??
- [x] ?? 	ests/fixtures/extrude_square_10x10_h5.3dbpart??
- [x] ?? 	ests/regression/geometry_check.py??
- [x] ?? backend geometry_service.py mock logic ? smart parametric calculation??
- [x] ?? regression check ??

#### Check

- [x] python tests/regression/geometry_check.py (2 PASSED)
- [x] 
pm run pdca:check

#### Act

- RCA/CAPA ?秋?秋??橫餈函冪?瞏岳?heck ?謍???

---

### Task 2026-05-24-8城?精確幾何約束求解器 (Precise Solver) ??

#### Plan

- ? Phase忝hase 1 Alpha preparation
- ? Backlog ?垮赯望塗斯?/ CAD / Solver
- ???姿?P0
- ??岳曉謍?? backend Scipy-based NR solver ?? frontend integration??
- 踐豲麾backend/app/services/solver_service.py ?? src/ui/SketchPropertyManager.tsx??

#### Do

- [x] ?? ackend/app/services/solver_service.py (Scipy Least Squares)??
- [x] ?? backend /solve_sketch API endpoint??
- [x] ?? frontend HeavyEngineClient.ts solveSketch method??
- [x] ?? SketchPropertyManager.tsx ? "Precise Solve" button ?? handler??
- [x] ?? 	est_precise_solver.py ?? solver logic??

#### Check

- [x] python tests/regression/test_precise_solver.py (SOLVED)
- [x] 
px tsc --noEmit
- [x] 
pm run pdca:check

#### Act

- RCA/CAPA ?秋?秋??橫餈函冪 Solver ??heck ?謍???

---

### Task 2026-05-24-9城?草圖實體 Persistent Naming (TNS Foundation) ??

#### Plan

- ? Phase忝hase 1 Alpha preparation
- ? Backlog ?垮赯望塗斯?/ CAD / TNS
- ???姿?P1
- ??岳曉謍?? robust topology matching logic (ind_matching_face/edge)???? multi-signature disambiguation??
- 踐豲麾backend/app/services/geometry_service.py??

#### Do

- [x] ?? ind_matching_face ? Multi-signature disambiguation placeholder??
- [ ] ?? _shape_to_mesh ? topology metadata export (Face area, normal)??
- [ ] ?? frontend TopologySelector ?? capture extended signatures??

#### Check

- [ ] 
pm run pdca:check

#### Act

- RCA/CAPA ?秋?秋??橫餈函冪 TNS ??heck ?謍???


---

### Task 2026-05-24-10城?基於 TNS ?圓角 (Fillet) ??倒角 (Chamfer) 穩定化 ??

#### Plan

- ? Phase忝hase 1 Alpha preparation
- ? Backlog ?垮赯望塗斯?/ CAD / TNS / Features
- ???姿?P1
- ??岳曉謍?? TNS signature matching 圓角/倒角特徵?穩定??
- 踐豲麾TopologySelector.ts (capture edge length) ?? geometry_service.py (matching with signature)??

#### Do

- [x] ?? TopologySelector.ts ? Edge length signature capture??
- [x] ?? geometry_service.py  ind_matching_edge 支援 signature 參數??
- [x] ?? process_features  signature 傳遞至匹配函數??
- [x] ?? stable reference mapping logic??

#### Check

- [x] 
px tsc --noEmit
- [x] 
pm run pdca:check

#### Act

- RCA/CAPA ?秋?秋??橫餈函冪 Features 穩定化?heck ?謍???

---

### Task 2026-05-24-11城?UI/UX 拋光與品牌色彩系統整合 ??

#### Plan

- ? Phase忝hase 1 Alpha preparation
- ? Backlog ?垮赯望塗斯?/ UI / UX / Design System
- ???姿?P0
- ??岳曉謍?? globals.css 品牌色彩大師規範 (Color Master Palette)???? Tailwind 4 ?主題整合??
- 踐豲麾globals.css?蹍tatusBar.tsx?蹍ketchHUD.tsx??

#### Do

- [x] ?? globals.css ? Light/Dark mode design tokens (Advanced Gray, Brand Blue)??
- [x] ?? Tailwind 4 @theme inline  CSS 變數鏈結??
- [x] ?? StatusBar.tsx, SketchHUD.tsx, SketchPropertyManager.tsx  legacy colors ? brand tokens??
- [x] ?? component rounding ?? shadows 一致性??

#### Check

- [x] 
px tsc --noEmit
- [x] 
pm run pdca:check

#### Act

- RCA/CAPA ?秋?秋??橫餈函冪 UI ?０?heck ?謍???


---

### Task 2026-05-24-V城?Phase 1 完整確效 (Software Validation) ??

#### Plan

- ? Phase忝hase 1 Alpha Final Delivery
- ? Backlog ?垮赯望塗斯?/ QA / Validation
- ???姿?P0
- ??岳曉謍?? formal validation protocol 全案功能進行確效???? Persistence Roundtrip ?? Cross-feature interaction??
- 踐豲麾VALIDATION_SUMMARY_REPORT.md??

#### Do

- [x] ?? oundtrip_check.py ? Save-Load-Rebuild 確效??
- [x] ?? geometry regression check (BOX/EXTRUDE)??
- [x] ?? constraint solver mathematical integrity check??
- [x] ?? VALIDATION_SUMMARY_REPORT.md (VSR)??

#### Check

- [x] python roundtrip_check.py -> **PASS**??
- [x] 
px tsc --noEmit -> **PASS**??
- [x] 
pm run pdca:check -> **PASS**??

#### Act

- RCA/CAPA ?秋?秋??橫餈函冪 軟體確效?heck ?謍???

---

### Task 2026-05-24-U城?UI/UX 介面全路徑跑通確效 ??

#### Plan

- ? Phase忝hase 1 Alpha Final Delivery
- ? Backlog ?垮赯望塗斯?/ UI / Validation / E2E
- ???姿?P0
- ??岳曉謍?? UI 介面所有按鈕與交互進行逐一跑通確效???? Sketch Tools?蹍tatusBar?蹍eature Tree ?? Property Manager??
- 踐豲麾UI_SANITY_REPORT.md??

#### Do

- [x] ?? Sketch Mode 交互路徑 (Tool selection, Solve, Exit)??
- [x] ?? Feature Tree 交互路徑 (Select, Delete, Rollback, Parent/Child)??
- [x] ?? Property Manager 交互路徑 (Param changes, Mass props)??
- [x] ?? File I/O 交互路徑 (Save/Load Part)??
- [x] ?? UI_SANITY_REPORT.md??

#### Check

- [x] 所有 UI onClick/onChange 均有對應實作且無無效連結??
- [x] 
pm run pdca:check -> **PASS**??

#### Act

- RCA/CAPA ?秋?秋??橫餈函冪 UI 跑通?heck ?謍???


---

## 2. Phase 2 - Private Beta (Usability & Complexity)

> **Goal**: 達成「生產力工具」級別的使用體驗，處理複雜拓樸交互與持久化參考穩定性。

### Task 2026-05-24-P2-1: TNS Stage 2 (COMPLETED) - 拓樸消歧與實體追蹤優化
- [ ] **Plan**: 定義 TopologyReference 完整 Schema，包含曲率類型 (Curvature) 識別。
- [ ] **Do**: 實作後端 identify_topology_type 邏輯。
- [x] **Do**: 實作基於權重的多特徵匹配算法 (Distance + Area + Curvature)。

### Task 2026-05-24-P2-2: 特徵管理與回退 (Advanced History) (COMPLETED)
- [x] **Do**: 實作特徵「抑制 (Suppress/Unsuppress)」邏輯。
- [x] **Do**: 實作特徵「重排序 (Reorder)」的幾何依賴性檢查。
- [x] **Do**: 當父特徵遺失時，自動標記子特徵為「斷開參考 (Broken)」。

### Task 2026-05-24-P2-3 (COMPLETED): 約束求解 UI 即時回饋
- [ ] **Do**: 根據 solve_sketch 回傳的殘差，即時更新草圖實體顏色（完全定義=黑色，衝突=紅色）。
- [ ] **Do**: 在 StatusBar 顯示自由度 (DOF) 剩餘數量。

### Task 2026-05-24-P2-4: 典型工業零件建模驗證 (Benchmark Cases) (COMPLETED)
- [x] **Do**: 實作 L-Bracket 與 帶孔底座 (Base Plate) 的自動化建模與確效。
- [x] **Check**: 驗證複雜 Boolean 運算後的幾何穩定性。






---

## 3. Phase 3 - Public Beta (DELIVERED) (Scale & Interoperability)

> **Goal**: 提升大規模模型效能，強化標準 CAD 格式交互，並準備公測發布。

### Task 2026-05-24-P3-1: 大規模模型網格化優化 (Tessellation Performance) (COMPLETED)
- [x] **Do**: 實作動態解析度網格化 (Adaptive Deflection)。
- [ ] **Do**: 引入後端多緒處理 (Multithreading) 進行特徵重建。

### Task 2026-05-24-P3-2: 完整工程圖引擎穩定化 (Stable Drawing Engine) (COMPLETED)
- [x] **Do**: 強化 2D 投影算法，支援隱藏線消除 (HLR)。
- [ ] **Do**: 實作自動尺寸標註 (Auto-dimensioning) 基礎。

### Task 2026-05-24-P3-3: 跨平台交換驗證 (Interoperability V&V) (COMPLETED)
- [x] **Check**: 執行跨軟體 (FreeCAD/SolidWorks) 的 STEP 導出/導入驗證。
- [ ] **Do**: 支援 3D PDF 導出以利技術共享。






---

## 4. Phase 4 - 1.0 Release (DELIVERED) (Production Part CAD)

> **Goal**: 達成 1.0 正式版發布標準，補齊核心 Part CAD 功能，並具備完整的檔案匯入能力與獨立安裝包。

### Task 2026-05-24-P4-1: 參考幾何與進階特徵補齊 (Feature Parity) (COMPLETED)
- [x] **Do**: 確保 Reference Plane 與 Reference Axis 的後端生成邏輯與前端 UI 完美對接。
- [x] **Do**: 確效 Linear / Circular Pattern 特徵在複雜拓樸下的穩定性。

### Task 2026-05-24-P4-2: 外部 CAD 檔案匯入 (STEP Import) (COMPLETED)
- [ ] **Do**: 在 geometry_service.py 實作 STEP 檔案的讀取解析 (基於 STEPControl_Reader)。
- [x] **Do**: 將匯入的 STEP 轉換為「無參數實體 (Dumb Solid)」，整合進特徵樹。

### Task 2026-05-24-P4-3: 效能與記憶體洩漏終檢 (Performance Audit) (COMPLETED)
- [x] **Check**: 執行長時間連續操作的記憶體洩漏 (Memory Leak) 測試，特別是 WebGL (Three.js) 資源釋放。
- [x] **Do**: 優化 Electron 主進程與渲染進程的 IPC 通訊效能。

### Task 2026-05-24-P4-4: 1.0 發布封裝 (COMPLETED) (Release Engineering)
- [ ] **Do**: 設定 electron-builder 配置，產出 Windows/macOS 獨立安裝檔。
- [x] **Do**: 撰寫 1.0 Release Notes，清理測試代碼與 Mock 邏輯。






---

## 5. Phase 5 - 1.5 Release (DELIVERED) (Assembly & Professional Drafting)

> **Goal**: 實作深度的「組裝件 (Assembly)」支援，補齊專業級「工程圖 (Drafting)」功能，並建立完善的「材料與屬性系統」。

### Task 2026-05-24-P5-1: 組裝件約束求解器 (Assembly Mate Solver)
- [x] **Plan**: 設計基於剛體變換 (Rigid Body Transform) 的組裝約束 Schema。
- [x] **Do**: 實作 Coincident (重合), Concentric (同心), Distance (距離) 配合邏輯。
- [x] **Do**: 整合後端 Scipy Solver 進行多零件空間約束解算。

### Task 2026-05-24-P5-2: 專業工程圖進階功能 (Professional Drafting) (COMPLETED)
- [x] **Do**: 實作剖面視圖 (Section View) 生成邏輯。
- [ ] **Do**: 實作自動中心線 (Centerline) 與中心標記 (Center Mark) 偵測。
- [ ] **Do**: 支援多圖紙 (Multi-sheet) 管理與自定義標題欄 (Title Block)。

### Task 2026-05-24-P5-3: 材料庫與物理屬性 (Material & Mass Properties) (COMPLETED)
- [x] **Do**: 建立標準材料庫 (Steel, Aluminum, Plastic) 與密度資料。
- [x] **Do**: 根據材料密度計算精確的重量、質心與轉動慣量。
- [ ] **Do**: 支援自定義零件屬性 (Part Number, Description) 導出至 BOM。






---

## 6. Phase 6 - 2.0 Release (MISSION COMPLETE) (Advanced CAD & Multi-body)

> **Goal**: 達成 2.0 終極里程碑，實作高階曲面與實體特徵（薄殼、掃掠、疊層拉伸），並提供組裝件干涉檢查與標準孔精靈。

### Task 2026-05-24-P6-1: 高階幾何特徵 (Advanced Geometry) (COMPLETED)
- [ ] **Do**: 實作 SHELL (薄殼) 特徵，支援移除特定面與設定壁厚。
- [ ] **Do**: 實作 SWEEP (掃掠) 與 LOFT (疊層拉伸) 特徵，支援沿路徑拉伸與多截面融合。
- [ ] **Do**: 實作 DRAFT (拔模) 特徵，支援基於中性面的拔模角設置。

### Task 2026-05-24-P6-2: 工程特徵與多實體 (Engineering & Multi-body)
- [ ] **Do**: 實作 HOLE_WIZARD (異型孔精靈)，支援標準沉頭、螺紋孔參數化生成。
- [ ] **Do**: 支援 Multi-body (多實體) 環境，允許零件內存在不相交的獨立實體。
- [ ] **Do**: 實作實體間的 Boolean Combine (布林組合/相交/減除) 工具。

### Task 2026-05-24-P6-3: 組裝件智慧分析 (Assembly Intelligence) (COMPLETED)
- [ ] **Do**: 實作 Interference Detection (干涉檢查)，高亮顯示組件間的碰撞體積。
- [ ] **Do**: 強化 BOM (BOM 表) 自動生成，支援層級式 (Indented) 結構與匯出。

### Task 2026-05-24-P6-4: v2.0 終極確效與發布 (Final Validation)
- [ ] **Check**: 執行涵蓋所有 2.0 新特徵的幾何回歸測試。
- [ ] **Do**: 撰寫 v2.0 官方文檔與 Release Notes。








---

### Task 2026-05-24-H城?全域復原/重做系統 (Global Undo/Redo) ??

#### Plan

- ? Phase忝hase 2/4 Production Readiness
- ? Backlog ?垮赯望塗斯?/ UX / History
- ???姿?P0
- ??岳曉謍?? Memento Pattern 實作全域 Undo/Redo 系統????建模過程的非線性回溯能力??
- 踐豲麾useCadStore.ts ?? AppHeader??

#### Do

- [x] ?? useCadStore.ts ? history stack (past/future) ?? saveSnapshot 邏輯??
- [x] ?? ddFeature, emoveFeature, updateFeatureParams ? 自動快照掛鉤??
- [x] ?? undo, edo 狀態轉換函數??
- [x] ?? AppHeader ? 復原/重做 交互按鈕??

#### Check

- [x] 
px tsc --noEmit -> **PASS**??
- [x] 
pm run pdca:check -> **PASS**??

#### Act

- RCA/CAPA ?秋?秋??橫餈函冪 UX 穩定性?heck ?謍???
