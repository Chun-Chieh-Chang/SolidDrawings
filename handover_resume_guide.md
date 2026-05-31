# 3D-Builder CAD — 開發交接指南 (Handover Resume Guide)

> 📅 最後更新：2026-05-31  
> 🏆 **版本狀態**: v1.0 (Industrial Professional Release)  
> ✅ TypeScript 確效: `npx tsc --noEmit` 零錯誤通過  
> 🏁 **基準對標**: SolidWorks 2000 Parity 達成

---

## 🗂️ 專案概覽

**3D-Builder** 是一個運行於瀏覽器的工業級 CAD 應用程式，實現了 1:1 的 SolidWorks 經典建模體驗。

- **前端**: Next.js 15 + React Three Fiber (3D) + Zustand (狀態) + Tailwind 4
- **後端**: Python FastAPI + PythonOCC (OpenCASCADE B-Rep 幾何核)
- **核心架構**: 瘦客戶端 (UI/UX/變數求解) + 重引擎 (幾何重建/TNS/配合求解)

---

## 🏗️ 關鍵工程子系統

### 1. 拓撲持久化 (TNS 2.0)
- **原理**: 透過 `BRepAlgoAPI_History` 在重建過程中追蹤面、邊的演化。
- **持久化標籤**: `EXTRUDE1_TOP`, `EDGE_42_GEN` 等。
- **位置**: `backend/app/services/geometry_service.py` 中的 `TopologicalLinker`。

### 2. 參數化公式引擎 (Equations)
- **語法**: 支援以 `=` 開頭的算式，如 `=WIDTH/2 + 5`。
- **求解器**: `src/utils/EquationEngine.ts` 處理拓撲排序與算式解析。
- **整合**: 在 `usePartRebuild.ts` 執行幾何重建前，會自動將公式轉換為絕對數值。

### 3. 組態管理 (Configurations)
- **能力**: 支援 Feature Suppression (特徵壓縮) 與參數覆蓋。
- **介面**: 側邊欄 "Configs" 分頁。

---

## 📊 目前完成的功能 (Phase 1–100)

| 子系統 | 關鍵功能 | 狀態 |
|-------|------|------|
| **草圖** | 約束求解器、樣條曲線、投影、偏移 | ✅ 1.0 標準 |
| **特徵** | 伸長、旋轉、掃掠、疊層拉伸 (含引導線) | ✅ 1.0 標準 |
| **修飾** | 圓角、倒角、薄殼、孔精靈 (ISO 預設) | ✅ 1.0 標準 |
| **配合** | 標準配合 + 機械配合 (齒輪、螺桿) | ✅ 1.0 標準 |
| **工程圖** | 8 區圖框、自動 BOM、質量分析標題欄 | ✅ 1.0 標準 |
| **庫** | 設計庫 (Toolbox) - 自動生成標準螺栓螺帽 | ✅ 1.0 標準 |
| **圖元語義** | 支援 CIRCLE, RECTANGLE, ARC 原生語義與 3D 法線 | ✅ 1.0 強化 (Ph102-105) |
| **魯棒驗證** | 完成草圖到實體再到切除、圓角的端到端自動化測試與 UI 防呆 | ✅ 1.0 強化 (Ph102-105) |

---

## 🛡️ 開發紀律 (Agent Guardrails)

1. **PDCA 循環**: 修改代碼前必須更新 `task_plan.md`，完成後執行 `npx tsc --noEmit`。
2. **TNS 保護**: 新增特徵時，務必在後端 `build_feature_shape_in_isolation` 加入歷史追蹤。
3. **高信號日誌**: 所有 Bug 必須在 `DEV_LOG.md` 留下 RCA (根因) 與 CAPA (矯正預防)。

---

## 🚀 未來研發建議 (Post-1.0)

1. **[性能] 支援多線程重建**: 利用 Python `multiprocessing` 加速複雜特徵鏈計算。
2. **[視覺] PBR 物理渲染**: 強化 `RENDER` 分頁的環境光遮蔽 (AO) 與即時陰影。
3. **[交互] 智慧標註**: 實現 3D 模型中的 PMI (產品製造資訊) 標註。

---

## 🚦 開發接續指引 (Resume Protocol)

任何新接手的 Agent 或開發者，請嚴格遵守以下 SOP 恢復開發狀態：

### 1. 狀態還原 (State Restoration)
- 確保 Node.js 與 Python 虛擬環境就緒。
- 若需修改底層幾何鏈路 (Geometry Service)，**強制要求** 在執行前跑通 E2E 測試：
  ```bash
  cd backend
  PYTHONPATH="." python ../tests/regression/e2e_workflow_sim.py
  ```
  *(註: 若無 PythonOCC 環境，該測試應優雅降級為 Mesh Mock 模式且不拋出 500 錯誤。)*

### 2. 下一步開發重點 (Next Objectives)
目前草圖建構與基礎實體特徵 (Extrude, Revolve, Sweep, Loft) 已達工業級魯棒性。下一步的突破口為：
- **[A] 複雜曲面邊界條件**：強化 `Boundary Surface` 與 `Knit Surface` 在不連續拓撲下的接縫處理。
- **[B] 裝配體動力學**：優化 `MotionStudyPanel.tsx`，解決複雜齒輪鏈在拖曳時的 PBD 約束求解延遲 (Lag)。
- **[C] UI/UX 細節**：將 `RibbonController.tsx` 中過多的硬編碼 (Hardcoded) 條件，重構為基於 Store 的動態許可權控制 (Command Pattern)。

**3D-Builder 已準備好進入生產環境使用。**
