# 3D-Builder CAD — 開發交接指南 (Handover Resume Guide)

> 📅 最後更新：2026-05-30  
> ✅ TypeScript 確效: `npx tsc --noEmit` 零錯誤通過  
> 🧩 本文件旨在讓任何工具或帳號讀取後，能無縫繼續開發工作。

---

## 🗂️ 專案概覽

**3D-Builder** 是一個運行於瀏覽器的工業級 CAD 應用程式，類似簡化版 SolidWorks。

- **前端**: Next.js 14 (App Router) + React Three Fiber (3D) + Zustand (狀態)
- **後端**: Python FastAPI + PythonOCC (OpenCASCADE B-Rep 幾何核)
- **部署**: GitHub Pages (前端 Static Export) + 使用者本地啟動 Python 後端

### 快速啟動
```bash
# 後端 (需要 Python + pythonOCC-core)
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 前端 (另開 terminal)
npm run dev
```

---

## 🏗️ 核心架構圖

```
src/
├── app/page.tsx            ← 主入口：Ribbon 按鈕、草圖邏輯、特徵觸發器
├── store/useCadStore.ts    ← Zustand 全域狀態 (features, sketchNodes, mode...)
├── renderer/
│   ├── Viewport.tsx        ← Three.js 場景、點選事件、射線檢測
│   ├── OcctShape.tsx       ← 渲染 Backend 回傳的 Mesh（面點擊→Topology選取）
│   ├── SketchPreview.tsx   ← 草圖模式下的 2D 線段預覽
│   └── DatumPlanes.tsx     ← 參考平面 (FRONT/TOP/RIGHT/FACE) 渲染與 UV↔3D 轉換
├── ui/
│   ├── PartFeaturePropertyManager.tsx  ← 特徵屬性編輯面板
│   ├── FeatureManagerPanel.tsx         ← 左側 Feature Tree ✏️ 最近修改
│   ├── SketchPropertyManager.tsx       ← 草圖工具列
│   └── AssemblyTreePanel.tsx           ← 組件樹 + Mate 面板
└── utils/geometry/
    ├── CycleFinder.ts      ← 草圖→封閉迴圈/路徑 提取器
    └── GraphAdapter.ts     ← re-export CycleFinder 公開 API

backend/app/
├── main.py                 ← FastAPI 入口
├── routers/geometry.py     ← HTTP 路由 (/build_part, /step_export, ...)
└── services/
    ├── geometry_service.py ← 核心 B-Rep 幾何引擎 (OCC 特徵建立)
    └── assembly_solver.py  ← Scipy 裝配約束求解器
```

---

## 📊 目前完成的功能 (Phases 1–45)

| Phase | 功能 | 狀態 |
|-------|------|------|
| 1–30  | 基礎草圖、擠出、旋轉、倒角、陣列、STEP 匯出... | ✅ 完成 |
| 37 | Material/Color 色彩分配 | ✅ |
| 38 | 干涉檢查視覺化 | ✅ |
| 39 | 草圖進階約束 (PARALLEL, PERPENDICULAR, CONCENTRIC) | ✅ |
| 40 | Multi-body STEP Export (XDE + 色彩 + 層級) | ✅ |
| 41 | Assembly Mates 裝配約束系統 | ✅ |
| 42 | B-Splines + Extrude as Surface + THICKEN | ✅ |
| 43 | Sweep & Loft (掃掠/疊層拉伸) + 獨立草圖特徵 | ✅ |
| 44 | Feature Tree SKETCH 節點 + FACE 平面 Up 向量修正 | ✅ |
| 45 | Variable Radius Fillet (變半徑圓角) | ✅ |
| 46 | 草圖自由度 (DOF) 計數器 | ✅ |
| 47 | Fillet/Chamfer Tangent Propagation (相切傳遞) | ✅ |
| 48 | 實體操作 (Pattern 邊緣參考, Mirror, Draft) | ✅ |
| **49** | **薄殼 (Shell) 與異型孔精靈 (Hole Wizard)** | ✅ **最新** |

---

## 🔑 Phase 49 實作細節 (最新完成)

### 新增：薄殼 (Shell) 與異型孔精靈 (Hole Wizard)
**功能描述**：大幅升級實體的進階編修能力。薄殼用於掏空實體並維持特定壁厚；異型孔精靈則允許使用者直接在模型表面點擊打出符合加工標準的孔洞。

**實作亮點**：
- **Shell (薄殼)**：實作 `BRepOffsetAPI_MakeThickSolidByJoin`，支援選取多個開口面 (`faces_to_remove_refs`)，並預設向內部偏置 `-thickness`，輕鬆完成容器設計。
- **Hole Wizard (異型孔精靈) MVP**：引入了極簡的 3D 表面點擊定位法。當使用者點選模型表面，前端會將點擊處的 `coordinates` 與表面法向量 `normal` 記錄下來。
- **孔洞刀具組合 (Tool Body)**：後端讀取法向量後將其反轉 (`-normal`) 作為鑽孔方向，依據孔洞類型 (`SIMPLE`, `COUNTERBORE`, `COUNTERSINK`) 自動產生對應的 `BRepPrimAPI_MakeCylinder` / `BRepPrimAPI_MakeCone`，若是複合孔洞則先以 `BRepAlgoAPI_Fuse` 結合成完整的刀具實體，再使用 `BRepAlgoAPI_Cut` 一次性切除。
- **法向量保護**：為避免極端點選導致法向量為零而崩潰，後端實作了 `norm_vec.Magnitude() > 1e-6` 的防禦機制。

---

## 🔑 Phase 48 實作細節

### 新增：進階實體操作 (Pattern, Mirror, Draft)
**功能描述**：大幅升級實體編修能力，新增實體鏡射、邊緣導向的線性/圓周陣列，以及塑膠射出常需的拔模角 (Draft) 功能。

**實作亮點**：
- **Edge-Driven Pattern**：原本的 Pattern 僅支援固定 X/Y/Z 軸，現在透過選取 3D Edge，由 `geometry_service.py` 提取 `BRepAdaptor_Curve` 的 D1 切線向量作為陣列或旋轉的基準軸，達到完全自訂方向。
- **Body & Feature Mirror**：實作 `BRepBuilderAPI_Transform` 與 `gp_Trsf.SetMirror`。若未指定目標特徵，會將 `final_shape` (整個 Body) 作為鏡射目標。支援平面或選取 3D Face 作為鏡射基準面。
- **Draft Angle (拔模)**：引入 `BRepOffsetAPI_DraftAngle`，分為兩階段選取 (中立面 Neutral Plane -> 拔模面 Faces to Draft)。透過中立面法向量萃取 Pull Direction，完成表面傾斜。
- **Frontend Selection Routing**：改寫 `OcctShape.tsx` 拓樸選取邏輯，根據 `pendingFeatureCommand` 動態切換選取模式 (`EDGE_ONLY` 或 `FACE_ONLY`)，並推入指定的 `refs` 陣列 (`direction_refs`, `mirror_plane_refs`, `neutral_plane_refs` 等)。

---

## 🔑 Phase 47 實作細節

### 新增：Fillet/Chamfer Tangent Propagation (相切傳遞連續邊緣)
**功能描述**：支援在倒圓角或倒角時，自動向外擴展並選取所有具備 G1 連續性 (相切) 的相鄰邊緣，減少使用者反覆點選的操作。

**實作亮點**：
- **前端支援**：在 `PartFeaturePropertyManager.tsx` 加入「相切傳遞」核取方塊，與 R1/R2 設定並列。
- **拓樸探索與向量計算 (後端)**：新增 `get_tangent_edges` 演算法。透過 `TopExp.MapShapesAndAncestors` 找出共用頂點的邊緣，並使用 `BRepAdaptor_Curve.D1` 取出端點的切線向量。利用內積判斷夾角是否為 0 或 180 度，進而確立 G1 相切關係。
- **避免重複選取崩潰**：使用 `.HashCode(2**31 - 1)` 紀錄已加入倒角工具的邊緣，避免重複注入 `BRepFilletAPI_MakeFillet` 導致 OCCT 核心崩潰。

---

## 🔑 Phase 45 實作細節

### 新增：Variable Radius Fillet (變半徑圓角)
**功能描述**：支援在 3D 實體上點選特定 Edge，產生固定半徑 (R1 = R2) 或變半徑 (R1 ≠ R2) 的圓角特徵。

**實作亮點**：
- **前端 Edge 選擇解耦**：在 `OcctShape.tsx` 中監聽 `pendingFeatureCommand`，點選 Edge 後直接寫入 `selectedFeature.parameters.refs` 中，解決了傳統 `activePropertyManager` 狀態同步的痛點。
- **UI 面板支援**：`PartFeaturePropertyManager.tsx` 新增專屬的 FILLET 面板，支援 R1, R2 輸入，並列出已選取的 Edge（支援點擊刪除）。
- **後端 B-Rep API 整合**：`geometry_service.py` 加入 `FILLET` 解析，利用 `find_matching_edge` 找到對應拓撲後，呼叫 `BRepFilletAPI_MakeFillet` 並透過判斷 R1 與 R2 差異決定是否採用變半徑 `.Add(r1, r2, edge)` 重載。

---

## 🔑 Phase 44 實作細節

### 修復 A：`sketchFeatureTo3DPoints()` FACE 平面 Up 向量精確性
**問題**：舊算法使用近似的 Gram-Schmidt 方法，在法向量接近 X 軸時 Up 向量計算有誤差，導致 Sweep/Loft 在 FACE 平面上的 3D 坐標轉換不準確。

**修復**：對齊後端 `gp_Ax2` 的算法邏輯：
1. 若法向量非常接近 Z 軸，以世界 X 軸為 Local X
2. 否則，取 `(-ny, nx, 0)` 作為 Local X 軸並正規化
3. Y 軸 = 法向量 × X 軸

**影響檔案**：`src/app/page.tsx`（`sketchFeatureTo3DPoints` 函式）

### 修復 B：Feature Tree 中 SKETCH 節點顯示與 Sweep B-Spline
**問題**：`SKETCH` 編輯不夠直覺，Sweep 路徑不支援曲線。

**修復**：
- **SKETCH UI**：`src/ui/FeatureManagerPanel.tsx` 針對 SKETCH 特徵新增「編輯 (✏️)」快速按鈕。
- **Sweep B-Spline**：`backend/app/services/geometry_service.py` 修改 `_build_wire_from_points` 以支援 Open Wire 與 3D 點陣列。SWEEP 特徵的 Path Wire 生成改呼叫該共用函式，自動獲得 `SPLINE_CONTROL` 曲線支援。

---

## 🔑 Phase 46 實作細節 (最新完成)

### 新增：Sketch DOF Counter (草圖自由度計數器)
**功能描述**：在 SketchPropertyManager 面板中顯示目前草圖的自由度 (DOF)，即時讓使用者知道草圖是「欠定義 (Under Defined)」、「完全定義 (Fully Defined)」還是「過定義 (Over Defined)」。

**實作亮點**：
- **移除後端非負限制**：在 `solver_service.py` 移除 `max(0, x)` 限制，讓多餘的約束能產生負數 DOF (代表 Over Defined)。
- **前端精確的 Nominal DOF**：在 `ConstraintSolver.ts` 中新增 `calculateDOF` 演算法，依據點的數量以及約束類型，精算出前端 Local Fallback 時的自由度數值。
- **UI 視覺化回饋**：在 `SketchPropertyManager.tsx` 加上專屬 Badge (藍色/綠色/紅色)，讓使用者一眼掌握草圖定義狀態。

---

## 🚧 下一步建議開發方向

### 優先 A：Fillet/Chamfer 的連續邊緣偵測 (Tangent Propagation)
- 在現有 Fillet/Chamfer 選擇 Edge 後，增加「相切傳遞」選項，自動將與該 Edge 相切的連續邊緣全部納入 `refs`。
- 有助於建立完整的工業級倒角功能。

### 優先 B：實體鏡射與複製排列 (Mirror & Pattern)
- 在 Feature 樹支援更完整的 Pattern (環形/線性) 編輯。
- 引入 Mirror Feature。

---

## ⚙️ 關鍵資料結構 Quick Reference

### CADFeature 結構
```typescript
interface CADFeature {
  id: string;       // 格式: "feat_<uuid>"
  type: string;     // 'EXTRUDE' | 'REVOLVE' | 'SKETCH' | 'SWEEP' | 'LOFT' | 'FILLET' | ...
  name: string;     // 顯示名稱
  parameters: any;  // 依 type 不同而異（見下表）
}
```

### 各特徵 parameters 格式
```
EXTRUDE:  { points, sketchNodes, sketchEdges, depth, plane, operation, [faceOrigin, faceNormal, faceId] }
SKETCH:   { points, sketchNodes, sketchEdges, plane, [faceOrigin, faceNormal, faceId] }
SWEEP:    { profile_id, path_id, profile_points, path_points }  ← profile_points/path_points 由 Build 後填入
LOFT:     { profile_ids: string[], profiles: number[][][] }     ← profiles 由 Build 後填入
THICKEN:  { thickness: number }
FILLET:   { radius, edge_start, edge_end, signature }
REVOLVE:  { points, angle, plane }
BOX:      { width, height, depth, x, y, z }
```

---

## 🛡️ 開發紀律 (必讀)

1. **修改前執行 `npx tsc --noEmit`**，確認型別無誤
2. **任何 Bug 必須先查 `DEV_LOG.md`** 是否有歷史 RCA 紀錄
3. **副作用防禦**: 修改 `geometry_service.py` 時，確認 `process_features` 與 `build_shape_only` 兩個函式中的 f_type 條件列表都有同步更新
4. **不猜測根因**: 遇到 Bug → 先列所有可能原因 → 找最高概率者 → 只改最小範圍
5. **推送前必須**: 本地測試通過 → 向使用者回報 → 獲得許可 → `git push`
6. **每完成一個任務**: 立即更新 `handover_resume_guide.md` 與 `DEV_LOG.md`

---

## 📁 重要檔案路徑索引

```
c:\Users\3kids\Downloads\3D-Builder\
├── DEV_LOG.md                                    ← 開發日誌 (RCA/CAPA 必填)
├── handover_resume_guide.md                      ← 本文件 (交接指南)
├── src/app/page.tsx                              ← 主邏輯
├── src/store/useCadStore.ts                      ← 全域狀態
├── src/ui/FeatureManagerPanel.tsx                ← Feature Tree UI ✏️
├── src/ui/PartFeaturePropertyManager.tsx         ← 特徵屬性面板
├── backend/app/services/geometry_service.py     ← OCC 幾何核
└── backend/app/services/assembly_solver.py      ← Scipy 裝配求解
```
- **Phase 50**: 2D Engineering Drawings (HLR). 修復了前後端之間的型別衝突，實作等角透視 (ISO) 以及 FRONT/TOP/RIGHT 投影，並成功提取 OpenCASCADE 的 Hidden Lines (隱藏線) 至前端渲染為工程圖虛線，包含工程圖框標題。
