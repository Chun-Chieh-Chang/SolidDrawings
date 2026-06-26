# Sprint Backlog

> 最後更新: 2026-06-26
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

### [P2] Smart Mates (智慧結合)
- **領域**: Assembly (currently 50%)
- **優先級**: P2 (Medium)
- **狀態**: pending
- **依賴**: Sub-assemblies CRUD ✅ (已完成)
- **估計工時**: 4-6h
- **目標**: 使用者可拖曳元件幾何參考直接建立結合，無需開啟 Mate Panel
- **驗收標準**:
  - [ ] 使用者選取一個 face/edge/axis 作為 mate reference
  - [ ] 拖曳到另一元件的對應參考時系統自動推斷 mate 類型
  - [ ] 推斷期間顯示即時預覽 (Coincident/Concentric/Tangent)
  - [ ] 放開滑鼠後 Mate 無需經過 Mate Panel 即建立完成
  - [ ] 支援 Edge, Face, Axis, Point, Plane 五種參考類型
  - [ ] 無效配對 (如兩個點無法同心) 顯示視覺回饋

### [P2] DimXpert (尺寸專家)
- **領域**: Drawing (currently 72%)
- **優先級**: P2 (Medium)
- **狀態**: pending
- **依賴**: BOM 多階層 ✅ (已完成), Annotations/GD&T ✅ (已完成)
- **估計工時**: 6-8h
- **目標**: 自動辨識特徵並產生尺寸標註，提升工程圖生產力
- **驗收標準**:
  - [ ] 自動辨識拉伸、旋轉、孔等基本特徵
  - [ ] 為辨識的特徵產生 +/- 公差尺寸
  - [ ] 支援基準符號 (Datum Feature) 標註
  - [ ] 支援幾何公差符號 (True Position, Flatness, etc.)
  - [ ] 公差值可手動編輯覆寫
  - [ ] DimXpert 面板顯示所有已標註特徵清單

### [P2] 統一錯誤處理層
- **領域**: Infrastructure (Tech Debt)
- **優先級**: P2 (Medium)
- **狀態**: pending
- **估計工時**: 3-4h
- **目標**: 建立全端一致的錯誤處理架構，取代目前散落各處的 try/catch
- **驗收標準**:
  - [ ] 前端: 統一 ErrorBoundary 元件包裹所有頁面區塊
  - [ ] 前端: API 呼叫錯誤集中顯示 Toast 通知
  - [ ] 後端: 全域 Exception Handler 統一錯誤回應格式
  - [ ] 後端: 錯誤回應格式為 `{error: string, code: string, details?: any}`
  - [ ] 前後端: 網路逾時 (30s) 有專屬錯誤提示

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
