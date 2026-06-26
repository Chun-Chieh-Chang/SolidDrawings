# 🗺️ 3D-Builder 開發路線圖（即時更新）

> **最後更新**: 2026-06-26 20:51
> **自動產生自**: `skills/dev/living-roadmap/scripts/update_roadmap.py`
> **基準**: SOLIDWORKS 2010 Chinese Edition

---

## 📊 現況儀表板

| 指標 | 數值 |
|:---|---:|
| 總體成熟度（活躍領域） | **~72%** |
| SCS (UI/UX 相容性) | **100%** |
| TypeScript 編譯 | ✅ |
| 後端測試 (pytest) | **104** passed / 104 total |
| 前端測試 (Jest) | **89** passed / 89 total |

### 領域成熟度

| 領域 | 分數 | 狀態 |
|:---|:---:|:---:|
| **公差 (Tolerancing)** | 0% `█░░░░░░░░░░░░░░░░░░░` | ⚪ 未開始 |
| **焊接 (Weldments)** | 0% `█░░░░░░░░░░░░░░░░░░░` | ⚪ 未開始 |
| **測試覆蓋率** | 40% `████████░░░░░░░░░░░░` | 🔴 持續改善 |
| **組件 (Assembly)** | 50% `██████████░░░░░░░░░░` | 🟡 基礎架構 |
| **曲面 (Surfacing)** | 55% `███████████░░░░░░░░░` | 🟡 部分完成 |
| **檔案互通性** | 60% `████████████░░░░░░░░` | 🟡 基礎 STEP/STL |
| **工程圖 (Drawing)** | 72% `██████████████░░░░░░` | 🟡 中等差距 |
| **特徵引擎 (3D Part)** | 85% `█████████████████░░░` | 🟡 小幅差距 |
| **鈑金 (Sheet Metal)** | 90% `██████████████████░░` | 🟢 小幅差距 |
| **草圖工具** | 95% `███████████████████░` | 🟢 接近完全 |
| **UI/UX 相容性 (SCS)** | 100% `████████████████████` | 🟢 完全對齊 |

---

## 🎯 領域詳細狀態

### 🟢 草圖工具 — 95%

#### ✅ 已實作

- 基本圖元：Line, Rectangle (Corner/Center), Circle, Arc (3-Point), Spline, Polygon
- 草圖工具：Trim, Extend, Mirror, Linear Pattern, Circular Pattern
- 智慧標註 (Smart Dimension)
- 幾何約束系統 (ConstraintSolver.ts)
- Convert Entities, Offset Entities
- 草圖平面選擇 (FRONT/TOP/RIGHT/FACE)
- 草圖網格與鎖點 (Inference Lines, Coincident/H/V Badges)
- Sketch Fillet / Chamfer**
- 3D Sketch**

#### ❌ 尚未實作

- Ellipse / Partial Ellipse
- Parabola / Conic
- Spline 編輯 (Control Polygon)
- Offset on Surface
- Sketch Picture

---

### 🟡 特徵引擎 — 85%

#### ✅ 已實作

- Extrude (Boss/Cut/Surface)
- Revolve (Boss/Cut)
- Sweep (Guide/Circular/Thin/Cut/Twist)
- Loft (Multiple Profiles/Guides/Cut)
- Helical Sweep
- Fillet (Constant/Variable/Face)
- Chamfer
- Shell
- Rib
- Draft
- Dome
- Pattern (Linear/Circular/Fill)
- Mirror
- Hole Wizard
- Thicken
- Reference Plane/Axis/Point/CSYS
- Split** (分割)
- Combine** (結合)

#### ❌ 尚未實作

- Wrap** (包覆)
- Scale** (比例縮放)
- Move/Copy Body
- Intersect** (交集)
- Deform** (變形)
- Indent** (壓凹)

---

### 🟡 鈑金 — 85%

#### ✅ 已實作

- Base Flange (薄板基底)
- Base Flange Tab** (基底凸緣)
- Edge Flange
- Miter Flange
- Hem (Closed/Open/Teardrop)
- Flat Pattern (K-Factor BA)
- Bend Allowance UI Panel
- Forming Tools (Louver/Lance/Bridge/Dimple/Cutout)
- Bend Allowance Utility (公式)

#### ❌ 尚未實作

- Swept Flange** (掃出凸緣)
- Jog** (蹺曲)
- Sketch Bend** (草圖彎曲)
- Cross Break** (條狀壓型)
- Venting** (通風口)
- Tab & Slot** (凸片與凹槽)
- Sheet Metal Gusset** (鈑金加強板)
- Bend Table** (彎曲表格)
- Rip** (裂口)

---

### 🟡 曲面 — 55%

#### ✅ 已實作

- Surface Extrude (曲面伸長)
- Surface Revolve (曲面旋轉)
- Surface Loft (曲面疊層拉伸)
- Offset Surface (曲面偏移)
- Knit Surface (曲面縫織)
- Surface Cut (曲面除料)
- Boundary Surface** (邊界曲面)
- Trim Surface** (修剪曲面)

#### ❌ 尚未實作

- Filled Surface** (填補曲面)
- Planar Surface** (平面曲面)
- Extend Surface** (延伸曲面)
- Untrim Surface** (取消修剪)
- Replace Face** (取代面)
- Delete Face** (刪除面)
- Move/Delete Face
- Surface Flatten** (曲面扁平)
- Ruled Surface** (直紋曲面)

---

### 🟡 組件 — 50%

#### ✅ 已實作

- 組件樹 (AssemblyTreePanel)
- Mate 面板 (MatePanel)
- 插入元件 (Insert Component)
- 爆炸視圖 (Exploded View)
- 干涉檢查 (Interference Detection)
- 組裝約束求解器 (assembly_solver)
- Profile Center Mate**
- Symmetric Mate**
- Width Mate**
- Sub-assemblies CRUD**

#### ❌ 尚未實作

- Smart Mates** (智慧結合)
- Assembly Features** (組件特徵)
- Pattern Component** (元件陣列)
- Mirror Component** (鏡射元件)
- Replace Component** (取代元件)
- Component Properties** (元件屬性)
- Collision Detection** (碰撞偵測)
- Dynamic Clearance** (動態間隙)

---

### 🟡 工程圖 — 72%

#### ✅ 已實作

- DrawingSheet 基本框架 (拖拉、縮放)
- 匯出 PDF (PrintToPDF)
- 基本圖紙設定 (Sheet Format Selector)
- 三視圖投影 (FRONT/TOP/RIGHT + ISO)
- 標題欄 (Title Block) + BOM 表
- BOM 多階層樹狀表**
- 尺寸標註互動 (Smart Dimensions with inline editing)
- 中心標記 (Center Marks) + 零件號球 (Balloons)
- 剖面視圖** (Section View)
- 局部放大圖** (Detail View)

#### ❌ 尚未實作

- 輔助視圖** (Auxiliary View)
- 斷裂視圖** (Broken-out Section)
- 裁剪視圖** (Crop View)
- 註記** (Annotations / GD&T)
- 圖框/標題欄自訂** (Sheet Format Editor)
- BOM 多階層** (Multi-level BOM)
- 零件號球自動編號** (Auto Balloon)

---

## 🧪 測試覆蓋率

| 項目 | 本次 | 備註 |
|:---|---:|:---|
| pytest | 104/104 | 後端 API + 特徵 + 繪圖測試 |
| Jest | 89/89 | 前端 utility + 元件測試 |
| tsc --noEmit | ✅ PASS | TypeScript 編譯檢查 |

### 測試涵蓋模組

- 測試涵蓋模組: geometry_service, features, surfacing, sheet_metal, drawing API, split/combine, section_view, components

---

## 🔌 API 端點庫存

共 29 個端點：

**/analyze/** (1 個)
- `/analyze_topology` — 拓撲分析

**/box/** (1 個)
- `/box` — 基本幾何

**/check/** (1 個)
- `/check_interferences` — 干涉檢查

**/convert/** (1 個)
- `/convert_entities` — 草圖工具

**/cylinder/** (1 個)
- `/cylinder` — 基本幾何

**/detect/** (1 個)
- `/detect_interference` — 干涉偵測

**/edge/** (1 個)
- `/edge_flange` — 鈑金特徵

**/export/** (3 個)
- `/export, /export/step` — 檔案匯出
- `/export_assembly/step` — 組件 STEP 匯出

**/flat/** (1 個)
- `/flat_pattern` — 展開圖

**/forming/** (1 個)
- `/forming_tool` — 成形工具

**/hem/** (1 個)
- `/hem` — 鈑金特徵

**/intersection/** (1 個)
- `/intersection_curve` — 相交曲線

**/mass/** (1 個)
- `/mass_properties` — 質量屬性

**/miter/** (1 個)
- `/miter_flange` — 鈑金特徵

**/offset/** (1 個)
- `/offset_entities` — 草圖工具

**/project/** (2 個)
- `/project, /project_assembly` — 2D 投影

**/rebuild/** (1 個)
- `/rebuild` — 特徵樹重建

**/ref/** (4 個)
- `/ref_plane, /ref_axis, /ref_point, /ref_coordinate_system` — 參考幾何

**/register/** (1 個)
- `/register_component` — 元件註冊

**/solve/** (2 個)
- `/solve_sketch, /solve_assembly` — 求解器

**/sphere/** (1 個)
- `/sphere` — 基本幾何

**/upload/** (1 個)
- `/upload_step` — STEP 檔案上傳

---

## ⚠️ 架構風險

| 風險 | 嚴重度 | 緩解狀態 |
|:---|:---:|:---|
| `geometry_service.py` ~5500 行 (已拆分 surfacing.py + sheet_metal.py + features.py) | 🟡 | 持續模組化拆分 |
| `RibbonController.tsx` ✅ **已拆分 | 🟢 | 已拆分為 8 個 Tab 子組件 + coordinator |
| 缺少統一錯誤處理層 | 🟡 | 新增 ErrorBoundary 全域 |
| OCC 依賴侷限 (僅有部分測試以 HAS_OCC=False 覆蓋) | 🟡 | 持續增加 mock tests |
| wiki/ 目錄為空 | 🟢 | 已記錄待補 |

---

## 🎯 優先級行動

| 優先級 | 狀態 |
|:---|---:|
| P0 (Critical) | 全部 ✅ |
| P1 (High) | 全部 ✅ |
| P2 (Medium) | 全部 ✅ |
| P3 (Low) | Backlog |

### 📋 目前 Sprint 任務

#### ⏳ [P2] Smart Mates (智慧結合)

- **領域**: Assembly (currently 50%)
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

#### ⏳ [P2] DimXpert (尺寸專家)

- **領域**: Drawing (currently 72%)
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

#### ⏳ [P2] 統一錯誤處理層

- **領域**: Infrastructure (Tech Debt)
- **狀態**: pending
- **估計工時**: 3-4h
- **目標**: 建立全端一致的錯誤處理架構，取代目前散落各處的 try/catch
- **驗收標準**:
  - [ ] 前端: 統一 ErrorBoundary 元件包裹所有頁面區塊
  - [ ] 前端: API 呼叫錯誤集中顯示 Toast 通知
  - [ ] 後端: 全域 Exception Handler 統一錯誤回應格式
  - [ ] 後端: 錯誤回應格式為 `{error: string, code: string, details?: any}`
  - [ ] 前後端: 網路逾時 (30s) 有專屬錯誤提示

#### ⏳ [P3] Freeform Surface (自由形態曲面)

- **領域**: Surfacing (currently 55%)
- **狀態**: pending
- **驗收標準**:
  - [ ] 支援拖曳控制點編輯曲面形態
  - [ ] 曲面與其他幾何 (boundary, trim surface) 可縫織
  - [ ] 自由形態曲面可作為特徵的終止面

#### ⏳ [P3] Venting (通風口)

- **領域**: Sheet Metal (currently 85%)
- **狀態**: pending
- **驗收標準**:
  - [ ] 在鈑金面上建立通風散熱孔特徵
  - [ ] 支援邊界/筋條/翼片/百葉窗等子元件
  - [ ] 通風口面積自動計算

#### ⏳ [P3] E2E 測試骨架 (Playwright)

- **領域**: Testing (currently 40%)
- **狀態**: pending
- **驗收標準**:
  - [ ] Playwright 設定就緒 (已有骨架)
  - [ ] 至少 3 條核心流程 E2E 測試 (建模 → 編輯 → 匯出)
  - [ ] E2E 測試納入 CI 流程

### P3 Backlog

- [ ] 曲面進階功能 (Freeform, Ruled, Flatten)
- [ ] 工程圖進階 (Sheet Format Editor, Auto Balloon)
- [ ] 鈑金進階 (Venting, Cross Break, Tab & Slot)
- [ ] 測試覆蓋率提升 (frontend vitest 修復)

---

## ✅ 近期完成里程碑

| 項目 | 日期 | 類別 |
|:---|---:|:---|
| **Pydantic .dict() deprecation fix** | 2026-06-25 | 維護 |
| **features.py 提取** (geometry_service 減負)** | 2026-06-25 | 重構 |
| **Rib 特徵實裝** | 2026-06-25 | 新功能 |
| **Split/Combine 布林運算** | 2026-06-25 | 新功能 |
| **Base Flange Tab** (鈑金)** | 2026-06-25 | 新功能 |
| **Boundary Surface / Trim Surface** | 2026-06-25 | 新功能 |
| **Profile Center/Symmetric/Width Mates** | 2026-06-25 | 新功能 |
| **Section View 全端** | 2026-06-25 | 新功能 |
| **Detail View 前端** | 2026-06-25 | 新功能 |
| **測試擴充 0→96** | 2026-06-25 | 測試 |
| **MECE 文檔清理** (~3000 行清除)** | 2026-06-25 | 維護 |
| **Sketch Fillet / Chamfer** (草圖圓角/倒角)** | 2026-06-26 | 新功能 |
| **Annotations / GD&T** (工程圖註記)** | 2026-06-26 | 新功能 |
| **Crop View / Auxiliary View** (工程圖裁剪/輔助視圖)** | 2026-06-26 | 新功能 |
| **Bend Table** (鈑金彎曲表格)** | 2026-06-26 | 新功能 |
| **RibbonController 拆分** (~1489→~197 行, 8 tab 子組件)** | 2026-06-26 | 重構 |
| **Surface Cut 修正** (MakeHalfSpace→finite box + Common)** | 2026-06-26 | Bug 修復 |
| **Sub-assemblies CRUD** (遞迴子組件管理)** | 2026-06-26 | 新功能 |
| **3D Sketch 模式** (state/tool/UI 平面選擇器)** | 2026-06-26 | 新功能 |
| **BOM 多階層樹狀表** (遞迴 BomEntry + BomTable)** | 2026-06-26 | 新功能 |

---

## 🔧 技術債

| 項目 | 狀態 |
|:---|---:|
| `tsc --noEmit` | ✅ 零錯誤 |
| ESLint | ⚠️ 僅 warnings |
| Python 語法 | ✅ 編譯通過 |
| FeatureManagerPanel.tsx | ⚠️ 1000+ 行 |
| RibbonController.tsx | ✅ **已拆分** ~197 行 |
| `geometry_service.py` | ⚠️ ~5500 行 |
| `features.py` | ✅ 354 行新模組 |
| 重複的 HOLE/HOLE_WIZARD | ⚠️ 未解決 |
| MECE 文檔結構 | ✅ 已清理 |

---

*此文件由 `living-roadmap` 技能自動維護。執行下列指令以更新：*

```bash
python skills/dev/living-roadmap/scripts/update_roadmap.py
```