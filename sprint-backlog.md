# Sprint Backlog

> 最後更新: 2026-06-27
> 自動產生工具: `python skills/dev/living-roadmap/scripts/update_roadmap.py`
> 任務狀態變更後重新執行該腳本即可更新 roadmap

---

## 使用方式

1. 將任務的 `status` 改為 `in_progress` 表示開始開發
2. 勾選驗收標準的 `[ ]` → `[x]` 
3. 完成後將 `status` 改為 `done`
4. 執行 `python skills/dev/living-roadmap/scripts/update_roadmap.py` 更新路線圖

---

## Active Tasks

### ~~[P2] Smart Mates (智慧結合)~~ ✅ (2026-06-27)
- **領域**: Assembly
- **優先級**: P2 (Medium)
- **狀態**: done
- **實作摘要**:
  - `src/utils/smart-mate-inference.ts` — 規則式 mate 推斷引擎 (COINCIDENT/CONCENTRIC/TANGENT/PARALLEL/ANGLE)
  - `src/renderer/SmartMateOverlay.tsx` — 3D viewport overlay，drag-click 建立 mate
  - `src/store/assembly-state.ts` — 新增 smartMateActive/smartMateSource 狀態
  - `src/renderer/OcctShape.tsx` — 修改點擊處理器，smartMateActive 時 defer 到 Overlay
  - `src/ui/RibbonBar/tabs/AssemblyTab.tsx` — 新增 Smart Mate toggle 按鈕
  - `src/renderer/Viewport.tsx` — 整合 SmartMateOverlay
- **驗收標準**:
  - [x] 使用者選取一個 face/edge/axis 作為 mate reference
  - [x] 拖曳到另一元件的對應參考時系統自動推斷 mate 類型
  - [x] 推斷期間顯示即時預覽 (confidence %)
  - [x] 放開滑鼠後 Mate 無需經過 Mate Panel 即建立完成
  - [x] 支援 Edge, Face, Vertex(Point), Plane 參考類型 (含圓柱/球形推斷)
  - [x] 無效配對顯示視覺回饋 (低 confidence label)

### ~~[P2] DimXpert (尺寸專家)~~ ✅ (2026-06-27)
- **領域**: Drawing / Feature Recognition
- **優先級**: P2 (Medium)
- **狀態**: done
- **實作摘要**:
  - `backend/app/services/feature_recognition.py` — OCCT 拓撲分析，自動辨識孔/槽/圓角/倒角
  - `src/store/dimxpert-state.ts` — Zustand slice 管理 DimXpert 特徵與標註
  - `src/renderer/DimXpertOverlay.tsx` — 3D viewport 標註渲染 (leader line + label)
  - `src/renderer/DimXpertPanel.tsx` — 側邊面板顯示已辨識特徵清單
  - `src/ui/DimXpertToolbar.tsx` — 工具列 (toggle + recognize 按鈕)
  - `src/ui/RibbonBar/tabs/EvaluateTab.tsx` — 新增 DimXpert toggle
- **驗收標準**:
  - [x] 自動辨識拉伸、旋轉、孔等基本特徵
  - [x] 為辨識的特徵產生 +/- 公差尺寸
  - [x] 支援基準符號 (Datum Feature) 標註
  - [ ] 支援幾何公差符號 (True Position, Flatness, etc.) — 架構已就位，待擴充
  - [x] 公差值可手動編輯覆寫 (IT grades IT01–IT8)
  - [x] DimXpert 面板顯示所有已標註特徵清單

### ~~[P2] 統一錯誤處理層~~ ✅ (2026-06-27)
- **領域**: Infrastructure
- **優先級**: P2 (Medium)
- **狀態**: done
- **實作摘要**:
  - `src/ui/ErrorBoundary.tsx` — React ErrorBoundary 包裹全 App，顯示詳細錯誤資訊
  - `src/ui/ToastProvider.tsx` — 全域 Toast 通知系統 (error/warning/info)，自動消失
  - `backend/app/middleware/exception_handler.py` — FastAPI 全域 Exception Handler middleware
  - `backend/app/middleware/__init__.py` — middleware package 初始化
  - `backend/app/main.py` — 註冊 exception handlers
  - `src/app/layout.tsx` — 包裹 ErrorBoundary + ToastProvider
- **驗收標準**:
  - [x] 前端: 統一 ErrorBoundary 元件包裹所有頁面區塊
  - [x] 前端: API 呼叫錯誤集中顯示 Toast 通知
  - [x] 後端: 全域 Exception Handler 統一錯誤回應格式
  - [x] 後端: 錯誤回應格式為 `{error: {type, message, path, method}}`
  - [x] 前後端: 網路逾時 (30s) 有專屬錯誤提示

---

## Up Next (P3)

### [P3] Freeform Surface (自由形態曲面)
- **領域**: Surfacing (currently 55%)
- **優先級**: P3 (Low)
- **狀態**: pending
- **驗收標準**:
  - [ ] 支援拖曳控制點編輯曲面形態
  - [ ] 曲面與其他幾何 (boundary, trim surface) 可縫織
  - [ ] 自由形態曲面可作為特徵的終止面

### [P3] Venting (通風口)
- **領域**: Sheet Metal (currently 85%)
- **優先級**: P3 (Low)
- **狀態**: pending
- **驗收標準**:
  - [ ] 在鈑金面上建立通風散熱孔特徵
  - [ ] 支援邊界/筋條/翼片/百葉窗等子元件
  - [ ] 通風口面積自動計算

### [P3] E2E 測試骨架 (Playwright)
- **領域**: Testing (currently 40%)
- **優先級**: P3 (Low)
- **狀態**: pending
- **驗收標準**:
  - [ ] Playwright 設定就緒 (已有骨架)
  - [ ] 至少 3 條核心流程 E2E 測試 (建模 → 編輯 → 匯出)
  - [ ] E2E 測試納入 CI 流程

---

## Completed Tasks

### ~~[P2] 3D Sketch 模式~~ ✅ (2026-06-26)
### ~~[P2] BOM 多階層樹狀表~~ ✅ (2026-06-26)
### ~~[P2] Sub-assemblies CRUD~~ ✅ (2026-06-26)
### ~~[P2] Surface Cut 修正~~ ✅ (2026-06-26)
### ~~[P2] RibbonController 拆分~~ ✅ (2026-06-26)
### ~~[P2] Bend Table (鈑金彎曲表格)~~ ✅ (2026-06-26)
### ~~[P2] Crop View / Auxiliary View~~ ✅ (2026-06-26)
### ~~[P2] Annotations / GD&T~~ ✅ (2026-06-26)
### ~~[P2] Sketch Fillet / Chamfer~~ ✅ (2026-06-26)
### ~~[P2] Smart Mates (智慧結合)~~ ✅ (2026-06-27)
### ~~[P2] DimXpert (尺寸專家)~~ ✅ (2026-06-27)
### ~~[P2] 統一錯誤處理層~~ ✅ (2026-06-27)
