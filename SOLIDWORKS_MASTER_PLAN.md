# SOLIDWORKS_MASTER_PLAN.md - 3D-Builder 終極對標計畫

> **文件角色**：本文件是 3D-Builder 的唯一歸一化計畫 (Master Plan)。所有開發 (Do) 必須對標本文件，查核 (Check) 必須以此為準，偏差則必須執行 RCA/CAPA (Act)。
> **核心目標**：打造一個 SolidWorks 級別的 3D 建模軟體，實現引擎、邏輯、交互、數據流與前後端通連的完美復刻。

---

## 1. 引擎對標：幾何內核與約束系統 (Kernel & Solver)
*目標：實現與 SolidWorks 同等級的真 B-Rep 幾何運算與精確約束求解。*

- **B-Rep 內核 (OpenCASCADE)**：
    - 拋棄 Mesh-only 偽幾何，全面採用 `TopoDS_Shape` 進行運算。
    - 支援精確的幾何實體、曲面、邊緣與頂點。
- **草圖求解器 (Constraint Solver)**：
    - **PBD Preview**：用於拖拽時的即時視覺回饋 (60 FPS)。
    - **Precise Solver**：滑鼠釋放後進行 Newton-Raphson 迭代求解，確保微米級精度。
    - **狀態感知**：完美復刻「完全定義 (黑)」、「欠定義 (藍)」、「衝突 (紅)」的視覺邏輯。
- **拓撲命名 (Topological Naming)**：
    - 實作幾何特徵簽名 (Geometric Signature) 演算法，解決模型重建後的面/邊 ID 丟失問題 (Face ID tracking)。

## 2. 邏輯與數據流對標：參數化特徵鏈 (Parametric Feature Chain)
*目標：數據流必須嚴格遵循「歷史紀錄 ➔ 參數重建 ➔ 拓撲繼承」的 SolidWorks 邏輯。*

- **全參數化數據結構**：
    - 每一特徵 (Feature) 必須封裝其原始草圖、平面定義、數值參數。
    - 存檔格式：原生 [`.3dbpart`](docs/spec/part-file-format.md) (JSON)，具備版本化 Schema。
- **設計樹 (FeatureManager)**：
    - **退回控制棒 (Rollback Bar)**：支援拖拽回溯歷史，編輯時自動隱藏後續特徵。
    - **父子關係追蹤**：刪除父特徵時自動提示或連帶刪除子特徵 (Parent-Child Dependency)。
- **動態重建 (Live Rebuild)**：
    - 150ms 防抖動態重建，修改數值時視埠即時預覽 3D 變化。

## 3. 介面交互對標：專業 CAD 工作流 (Professional UX)
*目標：交互方式與視覺細節必須讓 SolidWorks 老手「零學習成本」上手。*

- **前景視圖工具欄 (Heads-up Toolbar)**：
    - 視角旋轉、剖面、顯示模式 (Shaded with Edges)、正對面 (Normal To)。
- **S-Key 快捷選單**：
    - 模式感知 (Mode-aware)：草圖模式顯示繪圖工具，零件模式顯示特徵工具。
- **屬性管理器 (PropertyManager)**：
    - 左側面板動態顯示特徵參數，支援數值輸入、複選框與實體選取列表。
- **空間標註 (Callouts)**：
    - 視埠內直接雙擊尺寸標籤進行即時驅動。

## 4. 前後端通連對標：高效幾何管道 (Geometry Pipeline)
*目標：實現 Electron、Next.js 與 Python 幾何服務的無縫同步。*

- **IPC 通訊協議**：
    - 基於 FastAPI 的微服務，透過二進位或 JSON 指令傳遞特徵樹。
- **非同步重建佇列**：
    - 避免 UI 阻塞，大模型重建時顯示進度條，並支援 Abort 操作。
- **髒標記檢查 (Dirty Flagging)**：
    - 僅對受影響的特徵分支進行後端重構，優化通訊帶寬與運算耗時。

---

## 📅 版本里程碑 (Version Milestones)

| 階段 | 代號 | 目標 |
|---|---|---|
| **Phase 0** | **Stabilization** | 清理 Legacy `sketchPoints`，確立 `.3dbpart` 與 PDCA 治理。 |
| **Phase 1** | **Alpha** | 穩定實現「草圖 ➔ 擠出 ➔ 除料 ➔ 圓角」MVP 鏈路。 |
| **Phase 2** | **Private Beta** | 實作拓撲命名與 Rollback Bar，具備複雜零件編輯能力。 |
| **Phase 3** | **Public Beta** | 組立件配合 (Mates) 與 2D 工程圖 PDF 匯出。 |
| **Phase 4** | **1.0 Final** | 工業級穩定性，支援 STEP/IGES 高品質匯入匯出。 |

---

## 🚦 PDCA 查核門禁 (Release Gates)
- [ ] **npx tsc --noEmit**：全域型別安全。
- [ ] **npm run pdca:check**：文件與治理規範一致。
- [ ] **Golden Test**：標準零件 (如 L-Bracket) 體積與幾何 100% 匹配。
