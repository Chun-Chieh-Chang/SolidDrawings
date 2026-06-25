# 3D-Builder 持續改進執行計畫 (Continuous Improvement Execution Plan)

> **戰略基準**：基於 《SOLIDWORKS 2010 全面性操作對齊與功能缺口審計報告》。
> **目標**：針對未達 100% 的 2010 年核心 MVP 項目，制定具體、可執行的技術路徑與迭代計畫 (PDCA)。

---

## 🟢 核心對齊區段持續優化 (80% - 99%)
*此區段目標是「達到 2010 年代工業軟體的完美穩定度」，補齊邊界條件。*

### 1. 使用者介面 (當前 95%) -> 目標 100%
*   **缺口**：缺乏手勢操作 (Mouse Gestures)。
*   **執行計畫 (Sprint UI-1)**：
    *   **P (Plan)**：設計 `GestureRing.tsx` 元件。
    *   **D (Do)**：在 `Viewport.tsx` 實作滑鼠右鍵拖曳的軌跡判定 (捕捉 8 個方位的 Vector 方向)。將方向映射至最常用的指令（如：上=標註，下=矩形，左=直線，右=圓）。

### 2. 零件和特徵 (當前 85%) -> 目標 100%
*   **缺口**：缺乏抽殼 (Shell)、拔模 (Draft)、肋 (Rib) 與疊層拉伸進階控制。
*   **執行計畫 (Sprint FEAT-1)**：
    *   **P**：查閱 OpenCASCADE `BRepOffsetAPI_MakeThickSolid` 與 `BRepOffsetAPI_DraftAngle` API。
    *   **D**：在 `geometry_service.py` 封裝 Draft 與 Shell 邏輯，處理多面選擇 (Faces to Remove / Neutral Plane)。

---

## 🔴 致命缺口區段建設計畫 (0% - 29%)
*此區段是阻礙本專案成為「真正 CAD」的最大瓶頸。以 2010 為基準，我們必須優先攻克以下三座高牆。*

### 3. 尺寸細目與工程圖 (當前 10%) -> 目標 80% (工業可用)
*   **優先級**：🔥🔥🔥 (最高)
*   **執行計畫 (Sprint DRAW-1 to DRAW-3)**：
    *   **P (Phase 1)**：後端實作 `HLRBRep` (Hidden Line Removal)。給定一個 3D Shape 與視角 (Top/Front/Right)，輸出 2D 向量線段 (可見線與隱藏線)。
    *   **D (Phase 2)**：前端開發 `DrawingSheet.tsx` (全新的 2D SVG 畫布環境)。接收後端的向量資料並繪製。
    *   **D (Phase 3)**：實作 `Smart Dimension` 標註工具，允許在 2D 視圖上標註尺寸，並雙向連結至 3D 模型的參數。
    *   **C**：匯出工業標準的 DXF 圖紙。

### 4. 模型組態 / Design Table (當前 0%) -> 目標 80%
*   **優先級**：🔥🔥
*   **執行計畫 (Sprint CFG-1)**：
    *   **P**：在 Zustand Store 的 `CadState` 中，將 `features` 陣列重構為支援多版本的樹狀結構 (`configurations` dictionary)。
    *   **D**：實作 ConfigurationManager 側邊欄。允許切換組態時，套用不同的參數覆蓋表 (Parameter Overrides) 或特徵抑制狀態 (Suppression State)。
    *   **A**：支援匯入 CSV 作為 Design Table 驅動模型變體。

### 5. 組合件與動態連桿 (當前 40%) -> 目標 80%
*   **優先級**：🔥🔥
*   **執行計畫 (Sprint ASM-1)**：
    *   **P**：評估前端引入 `rapier3d` (Rust/WASM 物理引擎) 的可行性。
    *   **D**：將 `geometry_service` 計算出的 Collision Mesh 餵給物理引擎。將現有的 Mate (同心、重合) 轉換為物理引擎的 Joints (如 Hinge, Slider)。
    *   **C**：實作「拖曳以模擬 (Drag to Animate)」，允許使用者動態驗證機構連桿。

### 6. 鈑金 (Sheet Metal) (當前 0%) -> 目標 60% (MVP)
*   **優先級**：🔥
*   **執行計畫 (Sprint SMT-1)**：
    *   **D**：實作 `Base Flange` (基材法蘭) 特徵。實作 K-Factor (中性軸係數) 計算邏輯。
    *   **C**：能將簡單的 L 型鈑金件切換為 Flat Pattern (平坦圖樣)。

---

## 執行與追蹤機制 (基於 05_GOVERNANCE 協定)
1.  **強制定錨**：所有 Sprint 啟動前需初始化 `task_plan.md`。
2.  **SCS 驗收門檻**：每個 Sprint 結束時，必須更新 `gap-checklist.md` 並重新計算 SCS 分數 (對標 2010 基準)。
3.  **雙週 PDCA 循環**：由 Agent 抽取 Sprint 進行 [分析] -> [實作] -> [確效] -> [交付] 的閉環開發。