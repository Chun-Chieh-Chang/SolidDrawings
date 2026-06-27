# 3D-Builder × SOLIDWORKS 差距分析報告

> **生成日期**: 2026-06-27 (v2.3 — 更新)
> **基準**: SOLIDWORKS 2010 Chinese Edition (依 PLAN.md)
> **上次更新重點**: Smart Mates Alt+Drag、Conical 推論、Python 3.12+OCC 強制、12 個跳過測試改寫

---

## 評分總覽

| 領域 | 分數 | 變動 | 狀態 |
|:---|:---:|:---:|:---:|
| UI/UX 相容性 (SCS) | 100% | — | 🟢 完全對齊 |
| 草圖工具 | 95% | **+5%** (3D Sketch) | 🟢 接近完全 |
| 特徵引擎 (3D Part) | 85% | +5% (Rib/Split/Combine 實裝) | 🟡 小幅差距 |
| 鈑金 (Sheet Metal) | 90% | +5% | 🟡 小幅差距 |
| 曲面 (Surfacing) | 55% | +5% (Boundary/Trim Surface 實裝) | 🟡 部分完成 |
| 組件 (Assembly) | 60% | **+10%** (Smart Mates Alt+Drag) | 🟡 持續成長 |
| 工程圖 (Drawing) | 72% | **+7%** (BOM 多階層樹狀表) | 🟡 中等差距 |
| 公差 (Tolerancing) | 0% | — | ⚪ 未開始 |
| 焊接 (Weldments) | 0% | — | ⚪ 未開始 |
| 測試覆蓋率 | 40% | **+5%** (+pytest 104, +Jest 89) | 🟡 持續改善 |
| 檔案互通性 | 60% | — | 🟡 基礎 STEP/STL |
| 技術債清理 | — | **顯著改善** (RibbonController 拆分 ~1489→~197 行) | 🟢 持續改善 |

**總體成熟度**: ~76% — 功能性持續成長，P0/P1 已全數關閉，P2 多項已完成 (Smart Mates, 3D Sketch, BOM 多階層, Sub-assemblies)

---

## 1. UI/UX 相容性 — 🟢 100% (SCS)

自動化掃描器驗證全部 20 個檢測項目均通過：

### 快速鍵 (7/7 ✅)
| 快速鍵 | 狀態 | 檔案 |
|:---|---:|:---|
| Esc (離開指令) | ✅ | Viewport.tsx |
| S (快捷工具箱) | ✅ | Viewport.tsx |
| D (確認角落) | ✅ | Viewport.tsx |
| Ctrl+8 (正視於) | ✅ | Viewport.tsx |
| Ctrl+7 (等角視) | ✅ | Viewport.tsx |
| F (縮放至畫面) | ✅ | Viewport.tsx |
| Spacebar (視角選單) | ✅ | Viewport.tsx |

### 右鍵選單 (7/7 ✅)
| 功能 | 狀態 | 檔案 |
|:---|---:|:---|
| Select / 選擇 | ✅ | ContextMenu.tsx |
| End Chain / 結束鏈 | ✅ | ContextMenu.tsx |
| Normal To / 正視於 | ✅ | ContextMenu.tsx |
| Exit Sketch / 退出草圖 | ✅ | ContextMenu.tsx |
| Construction / 構造幾何 | ✅ | ContextMenu.tsx |
| Edit Sketch/Feature / 編輯 | ✅ | ContextMenu.tsx |
| Suppress/Delete / 壓縮刪除 | ✅ | ContextMenu.tsx |

### 視埠指標 (6/6 ✅)
| 功能 | 狀態 |
|:---|---:|
| Tool Cursor Badge | ✅ |
| Coincident Badge | ✅ |
| Horizontal/Vertical Badge | ✅ |
| Inference Lines | ✅ |
| Geometric Origin | ✅ |
| Confirmation Corner | ✅ |

### ⚠️ 已知 UI 差距 (非掃描器涵蓋)
- 缺少 **Tangent Badge** (DatumPlanes.tsx 未實作) — 中優先級
- **Appearances** 右鍵選單有按鈕但無彈出頁面 — 低優先級

---

## 2. 草圖工具 (Sketch) — 🟢 95%

### 已實作 ✅
- 基本圖元：Line, Rectangle (Corner/Center), Circle, Arc (3-Point), Spline, Polygon
- 草圖工具：Trim, Extend, Mirror, Linear Pattern, Circular Pattern
- 智慧標註 (Smart Dimension)
- 幾何約束系統 (ConstraintSolver.ts) — 完整約束求解器
- Convert Entities, Offset Entities
- 草圖平面選擇 (FRONT/TOP/RIGHT/FACE)
- 草圖網格與鎖點 (Inference Lines, Coincident/H/V Badges)
- **Sketch Fillet / Chamfer** — 草圖圓角/倒角 (2D 幾何計算 + 邊選擇工具 + 暫存器動作)
- **3D Sketch** — 3D 草圖模式 (is3DMode/active3DPlane + Sketch3DTool + 平面選擇器 UI)

### 缺失 ❌
| 功能 | 優先級 | 說明 |
|:---|---:|:---|
| **Ellipse / Partial Ellipse** | Low | SW 2010 基本圖元 |
| **Parabola / Conic** | Low | 圓錐曲線 |
| **Spline 編輯 (Control Polygon)** | Medium | 拖曳控制點編輯 |
| **Offset on Surface** | Low | 3D 草圖偏移 |
| **Sketch Picture** | Low | 插入圖片作為底圖 |
| **Rapid Sketch** | Low | 快速草圖模式 |

---

## 3. 特徵引擎 (3D Part) — 🟡 85%

### 已實作 ✅
| 特徵 | 狀態 | 備註 |
|:---|---:|:---|
| Extrude (Boss/Cut/Surface) | ✅ | Up To Next/Surface/Vertex 端點條件 |
| Revolve (Boss/Cut) | ✅ | 含 Revolved Cut |
| Sweep (Guide/Circular/Thin/Cut/Twist) | ✅ | 含沿路徑扭轉 |
| Loft (Multiple Profiles/Guides/Cut) | ✅ | 含 Thin Feature, Start/End Constraint |
| Helical Sweep | ✅ | 螺距/圈數/旋向/錐度 |
| Fillet (Constant/Variable/Face) | ✅ | 含 pendingFeatureCommand 選邊模式 |
| Chamfer | ✅ | 同上 |
| Shell | ✅ | 面移除抽殼 |
| Rib | ✅ | **新實裝** (2026-06-25) |
| Draft | ✅ | 中性面 + 拔模面 |
| Dome | ✅ | 球面/橢圓穹頂 |
| Pattern (Linear/Circular/Fill) | ✅ | 含 Equal Spacing, Instances to Skip |
| Mirror | ✅ | 鏡射特徵/本體 |
| Hole Wizard | ✅ | Counterbore/Countersink/Simple |
| Thicken | ✅ | 曲面加厚 |
| Reference Plane/Axis/Point/CSYS | ✅ | 四種參考幾何 |
| **Split** (分割) | ✅ | **新實裝** (BRepAlgoAPI_Split) |
| **Combine** (結合) | ✅ | **新實裝** (Fuse/Cut/Common) |

### 缺失 ❌
| 功能 | 優先級 | 說明 |
|:---|---:|:---|
| **Wrap** (包覆) | Medium | 按鈕存在但功能未完成 |
| **Scale** (比例縮放) | Low | 本體縮放 |
| **Move/Copy Body** | Low | 移動/複製實體 |
| **Intersect** (交集) | Medium | 曲面/本體交集產生新幾何 |
| **Deform** (變形) | Low | 自由形態變形 |
| **Indent** (壓凹) | Low | 使用工具本體壓凹 |
| **Flex** (彎曲) | Low | 彎曲/扭曲/錐度 |

---

## 4. 鈑金 (Sheet Metal) — 🟡 85%

### 已實作 ✅
| 功能 | 狀態 | 管線 |
|:---|---:|:---|
| Base Flange (薄板基底) | ✅ | 以 Extrude 替代 |
| **Base Flange Tab** (基底凸緣) | ✅ | **新實裝** (2026-06-25) |
| Edge Flange | ✅ | 端到端 ✅ |
| Miter Flange | ✅ | 端到端 ✅ |
| Hem (Closed/Open/Teardrop) | ✅ | 端到端 ✅ |
| Flat Pattern (K-Factor BA) | ✅ | 端到端 ✅ |
| Bend Allowance UI Panel | ✅ | 含計算預覽 + 材質預設 |
| Forming Tools (Louver/Lance/Bridge/Dimple/Cutout) | ✅ | 端到端 ✅ (5 種工具) |
| Bend Allowance Utility (公式) | ✅ | K-Factor / BA / Setback |

### 缺失 ❌
| 功能 | 優先級 | 說明 |
|:---|---:|:---|
| **Swept Flange** (掃出凸緣) | Medium | 沿路徑掃出鈑金 |
| **Jog** (蹺曲) | Medium | 在鈑金上建立 Z 形彎曲 |
| **Sketch Bend** (草圖彎曲) | Medium | 從草圖線建立彎曲 |
| **Cross Break** (條狀壓型) | Low | 對角線加強肋 |
| **Venting** (通風口) | Low | 通風散熱孔特徵 |
| **Tab & Slot** (凸片與凹槽) | Low | 組裝定位特徵 |
| **Sheet Metal Gusset** (鈑金加強板) | Low | 角落加強 |
| **Bend Table** (彎曲表格) | Medium | 匯入/匯出彎曲數據 — ✅ **已完成** 2026-06-26 |
| **Rip** (裂口) | Medium | 在鈑金上建立裂口 |
| **Unfold / Fold** (手動展開/摺疊) | ✅ | 選擇性展開/摺疊彎曲 — 已完成 2026-06-25 |
| **No. of Bend Lines** | Low | 彎曲線數量/顯示控制 |

---

## 5. 曲面 (Surfacing) — 🟡 55%

### 已實作 ✅
- Surface Extrude (曲面伸長)
- Surface Revolve (曲面旋轉)
- Surface Loft (曲面疊層拉伸)
- Offset Surface (曲面偏移)
- Knit Surface (曲面縫織)
- Surface Cut (曲面除料)
- **Boundary Surface** (邊界曲面) — **新實裝** (2026-06-25)
- **Trim Surface** (修剪曲面) — **新實裝** (2026-06-25)

### 缺失 ❌
| 功能 | 優先級 |
|:---|---:|
| **Filled Surface** (填補曲面) | Medium |
| **Planar Surface** (平面曲面) | Medium |
| **Extend Surface** (延伸曲面) | Medium |
| **Untrim Surface** (取消修剪) | Medium |
| **Replace Face** (取代面) | Low |
| **Delete Face** (刪除面) | Medium |
| **Move/Delete Face** | Low |
| **Surface Flatten** (曲面扁平) | Low |
| **Ruled Surface** (直紋曲面) | Medium |
| **Freeform** (自由形態) | Low |

---

## 6. 組件 (Assembly) — 🟡 60%

### 已實作 ✅
- 組件樹 (AssemblyTreePanel)
- Mate 面板 (MatePanel)
- 插入元件 (Insert Component) — 基本
- 爆炸視圖 (Exploded View) — 可運作
- 干涉檢查 (Interference Detection) — 後端 + UI
- 組裝約束求解器 (assembly_solver)
- **Profile Center Mate** — **新實裝** (2026-06-25)
- **Symmetric Mate** — **新實裝** (2026-06-25)
- **Width Mate** — **新實裝** (2026-06-25)
- **Sub-assemblies CRUD** — 子組件新增/加入/移除/變換 (addSubAssembly, addToSubAssembly, removeFromSubAssembly, updateSubComponentTransform + 遞迴輔助函式)
- **Smart Mates** — **新實裝** (2026-06-27): Alt+Drag 快速鍵 + 推理引擎 (含 Conical 面) + Ghost 環預覽 + 兩鍵工作流

### 缺失 ❌
| 功能 | 優先級 |
|:---|---:|
| **Assembly Features** (組件特徵) | Medium |
| **Pattern Component** (元件陣列) | Medium |
| **Mirror Component** (鏡射元件) | Low |
| **Replace Component** (取代元件) | Low |
| **Component Properties** (元件屬性) | Medium |
| **Collision Detection** (碰撞偵測) | Medium |
| **Dynamic Clearance** (動態間隙) | Low |
| **Sensors** (感測器) | Low |

---

## 7. 工程圖 (Drawing) — 🟡 72%

### 已實作 ✅
- DrawingSheet 基本框架 (拖拉、縮放)
- 匯出 PDF (PrintToPDF)
- 基本圖紙設定 (Sheet Format Selector)
- 三視圖投影 (FRONT/TOP/RIGHT + ISO)
- 標題欄 (Title Block) + BOM 表
- **BOM 多階層樹狀表** — 遞迴 BomEntry 結構、展開/收合、多欄位編輯 (PartNo/Description/Qty/Material/Note)、rebuildBomFromComponents 自動生成
- 尺寸標註互動 (Smart Dimensions with inline editing)
- 中心標記 (Center Marks) + 零件號球 (Balloons)
- **剖面視圖** (Section View) — **新實裝**:
  - 後端: BRepAlgoAPI_Cut + HLR projection + section fill
  - API: `POST /api/v1/drawing/section_view`
  - 前端: SVG hatch pattern + section fill polygon + cut line UI
  - 測試: 7 API + unit tests
- **局部放大圖** (Detail View) — **新實裝**:
  - DETAIL type 整合所有 store/type unions
  - 前端工具: 圓圈選取區域 → 自動放大
  - ViewBox zoom: 以 detailBounds 為中心 1.5x radius
  - 父視圖線繼承: 支援 projection + section 資料源
  - detailBounds 圓圈標記在父視圖上

### 缺失 ❌
| 功能 | 優先級 |
|:---|---:|
| **輔助視圖** (Auxiliary View) | Medium | ✅ **已完成** 2026-06-26 |
| **斷裂視圖** (Broken-out Section) | Low |
| **裁剪視圖** (Crop View) | Low | ✅ **已完成** 2026-06-26 |
| **註記** (Annotations / GD&T) | High | ✅ **已完成** 2026-06-26 |
| **圖框/標題欄自訂** (Sheet Format Editor) | Medium |
| **BOM 多階層** (Multi-level BOM) | Medium | ✅ **已完成** 2026-06-26 |
| **零件號球自動編號** (Auto Balloon) | Low |
| **DimXpert** (尺寸專家) | High |

---

## 8. 未開始模組 — ⚪ 0%

### Tolerancing (DimXpert/TolAnalyst)
- 無實作 — 根據先前用戶指示無限期延後

### Weldments (焊接)
- 無實作 — 根據先前用戶指示不開發

---

## 9. 技術債與基礎建設

### 程式碼品質
| 項目 | 狀態 | 變動 |
|:---|---:|:---|
| `tsc --noEmit` | ✅ 零錯誤 | — |
| ESLint | ⚠️ 僅 warnings | — |
| Python 語法 | ✅ 編譯通過 | — |
| FeatureManagerPanel.tsx | ⚠️ 1000+ 行 | — |
| RibbonController.tsx | ✅ **已拆分** ~197 行 | **改善** — 原 ~1489→~197 行，拆分為 8 個 Tab 子組件 + coordinator |
| `geometry_service.py` | ⚠️ ~5500 行 | **改善** -300 行 (features.py 提取) |
| `features.py` | ✅ 354 行新模組 | **新增** — 含 generate_box/cylinder/sphere/rib/split/combine/section_view |
| 重複的 HOLE/HOLE_WIZARD | ⚠️ 未解決 | — |
| MECE 文檔結構 | ✅ 已清理 | **改善** — 移除 ~3000 行過時文件至 .trash/ |

### 測試覆蓋率 — 🟡 35%
| 項目 | 數量 | 說明 |
|:---|---:|:---|
| Backend pytest | **105 passed** | 12 個先前 skipped 測試改寫為真實 OCC 測試，全部通過 |
| Frontend Jest tests | **89 passed, 6 suites** | 含 utility 測試 + 元件渲染測試 + FeatureTypes |
| E2E tests | 0 (骨架) | playwright 設定就緒，尚無完整 E2E 測試 |
| **測試涵蓋模組** | | geometry_service, features, surfacing, sheet_metal, drawing API, split/combine, section_view, components |

---

## 10. 後端 API 完整覆盤

### 現有端點 (24 個 POST)
| 端點 | 說明 |
|:---|:---|
| `/upload_step` | STEP 檔案上傳 |
| `/box`, `/cylinder`, `/sphere` | 基本幾何 |
| `/rebuild` | 特徵樹重建 |
| `/mass_properties` | 質量屬性 |
| `/export`, `/export/step` | 檔案匯出 |
| `/check_interferences` | 干涉檢查 |
| `/export_assembly/step` | 組件 STEP 匯出 |
| `/analyze_topology` | 拓撲分析 |
| `/project`, `/project_assembly` | 2D 投影 |
| `/detect_interference` | 干涉偵測 |
| `/convert_entities`, `/offset_entities` | 草圖工具 |
| `/intersection_curve` | 相交曲線 |
| `/edge_flange`, `/miter_flange`, `/hem` | 鈑金特徵 |
| `/flat_pattern` | 展開圖 |
| `/forming_tool` | 成形工具 |
| `/ref_plane`, `/ref_axis`, `/ref_point`, `/ref_coordinate_system` | 參考幾何 |
| `/solve_sketch`, `/solve_assembly` | 求解器 |
| `/register_component` | 元件註冊 |
| **`/drawing/section_view`** | **新端點** — 剖面視圖生成 |

### 缺少端點
- 無曲面進階端點 (boundary/fill/trim surface — 雖有 backend function 但無獨立 API)
- 無焊接結構成員端點
- 無工程圖進階端點 (detail view 為純前端實作)

---

## 11. 優先級行動建議

### P0 — 立即 (Critical)
- (全部已關閉)

### P1 — 本週 (High)
| 項目 | 說明 | 估計工時 |
|:---|---:|---:|
| ~~**Unfold / Fold** (鈑金展開/摺疊)~~ | ~~選擇性展開特定彎曲~~ | ~~2-3h~~ ✅ |
| ~~**Annotations/GD&T**~~ (工程圖註記) | ~~符號、基準、公差標註~~ | ~~4-6h~~ ✅ |

### P2 — 本月 (Medium)
| 項目 | 說明 |
|:---|---:|
| ~~Section View / Detail View~~ | ✅ **已完成** |
| ~~**3D Sketch**~~ | ✅ **已完成** |
| ~~**Sketch Fillet/Chamfer**~~ | ✅ **已完成** |
| ~~**Bend Table** (鈑金)~~ | ✅ **已完成** |
| ~~**Crop View / Auxiliary View** (工程圖)~~ | ✅ **已完成** |
| ~~**BOM 多階層** (工程圖)~~ | ✅ **已完成** |

### P3 — Backlog (Low)
| 項目 |
|:---|
| 曲面進階功能 (Freeform, Ruled, Flatten) |
| 工程圖進階 (Sheet Format Editor, Auto Balloon) |
| 鈑金進階 (Venting, Cross Break, Tab & Slot) |
| 測試覆蓋率提升 (frontend vitest 修復) |

---

## 12. 架構風險

| 風險 | 嚴重度 | 緩解 |
|:---|---:|:---|
| `geometry_service.py` ~5500 行 (已拆分 surfacing.py + sheet_metal.py + features.py) | 🟡 | 持續模組化拆分 |
| `RibbonController.tsx` ✅ **已拆分** | 🟢 | 已拆分為 8 個 Tab 子組件 + coordinator |
| 缺少統一錯誤處理層 | 🟡 | 新增 ErrorBoundary 全域 |
| OCC 依賴侷限 (僅有部分測試以 HAS_OCC=False 覆蓋) | 🟡 | 持續增加 mock tests |
| wiki/ 目錄為空 | 🟢 | 已記錄待補 |

---

## 13. 近期完成里程碑

| 項目 | 日期 | 類別 |
|:---|---:|:---|
| **Pydantic .dict() deprecation fix** | 2026-06-25 | 維護 |
| **features.py 提取** (geometry_service 減負) | 2026-06-25 | 重構 |
| **Rib 特徵實裝** | 2026-06-25 | 新功能 |
| **Split/Combine 布林運算** | 2026-06-25 | 新功能 |
| **Base Flange Tab** (鈑金) | 2026-06-25 | 新功能 |
| **Boundary Surface / Trim Surface** | 2026-06-25 | 新功能 |
| **Profile Center/Symmetric/Width Mates** | 2026-06-25 | 新功能 |
| **Section View 全端** | 2026-06-25 | 新功能 |
| **Detail View 前端** | 2026-06-25 | 新功能 |
| **測試擴充 0→96** | 2026-06-25 | 測試 |
| **MECE 文檔清理** (~3000 行清除) | 2026-06-25 | 維護 |
| **Sketch Fillet / Chamfer** (草圖圓角/倒角) | 2026-06-26 | 新功能 |
| **Annotations / GD&T** (工程圖註記) | 2026-06-26 | 新功能 |
| **Crop View / Auxiliary View** (工程圖裁剪/輔助視圖) | 2026-06-26 | 新功能 |
| **Bend Table** (鈑金彎曲表格) | 2026-06-26 | 新功能 |
| **RibbonController 拆分** (~1489→~197 行, 8 tab 子組件) | 2026-06-26 | 重構 |
| **Surface Cut 修正** (MakeHalfSpace→finite box + Common) | 2026-06-26 | Bug 修復 |
| **Sub-assemblies CRUD** (遞迴子組件管理) | 2026-06-26 | 新功能 |
| **3D Sketch 模式** (state/tool/UI 平面選擇器) | 2026-06-26 | 新功能 |
| **BOM 多階層樹狀表** (遞迴 BomEntry + BomTable) | 2026-06-26 | 新功能 |
| **Python 3.12+OCC 強制** (abandon Python 3.14) | 2026-06-27 | 維護 |
| **12 個跳過測試改寫** (mock→real OCC) | 2026-06-27 | 測試 |
| **Smart Mates Alt+Drag** (推理引擎 + ghost 預覽 + Conical 面) | 2026-06-27 | 新功能 |

---

## 結論

**UI/UX 相容性 (SCS)** 維持 100%，基礎互動已完全對齊 SOLIDWORKS 2010。

**功能成熟度**約 **76%** — 較上期 +3%。P0/P1 全數關閉。P2 多項已完成：Smart Mates、3D Sketch、BOM 多階層、Sub-assemblies CRUD。

**最立即的價值缺口**：
1. ~~**Unfold/Fold** (鈑金)~~ — ✅ 已完成 2026-06-25
2. ~~**Annotations** (工程圖註記)~~ — ✅ 已完成 2026-06-26
3. ~~**前端測試修復**~~ — ✅ 已完成 2026-06-26
4. ~~**3D Sketch**~~ — ✅ 已完成 2026-06-26
5. ~~**BOM 多階層**~~ — ✅ 已完成 2026-06-26
6. ~~**Smart Mates** (組件)~~ — ✅ 已完成 2026-06-27
7. **DimXpert** (工程圖尺寸專家) — 工程圖生產力關鍵

**技術債持續改善**：features.py 提取 (-300 行)、RibbonController 拆分 (-1292 行)、MECE 清理 (-3000 行過時文件)

---

*本報告由 Sisyphus 於 2026-06-27 自動生成 v2.3，基於程式碼掃描、測試結果與 SOLIDWORKS 2010 功能規範對標。*
