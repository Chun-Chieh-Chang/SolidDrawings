# 3D-Builder v1.0 (Industrial Professional Release)

3D-Builder 是一個基於 Web 的新世代參數化 3D CAD 建模工具，提供工業級的草圖約束引擎與三維幾何構建能力，並透過 OpenCASCADE (OCCT) 內核實現 1:1 對標 **SolidWorks 2000** 的工業標準。

本專案採用 **Thin Client (Next.js) + Heavy Engine (PythonOCC)** 架構，並具備即時響應的幾何約束求解器。開發過程遵循嚴格的 PDCA 循環與防迴歸確效紀律。

---

## 🏆 1.0 版本里程碑 (Milestones)

- **PropertyManager 2.0**: 全新專業 Rollout 介面，支援巢狀摺疊與標準工業參數分組。
- **方程式與全域變數**: 內建參數化公式引擎，支援使用算式（如 `=WIDTH/2`）驅動尺寸。
- **拓撲持久化 (TNS 2.0)**: 高信號拓撲追蹤系統，確保在修改基礎尺寸後，下游的圓角 (Fillet) 與配合 (Mate) 依然穩定不丟失。
- **進階特徵建構**: 完整支援掃掠 (Sweep) 與疊層拉伸 (Loft)，具備引導曲線 (Guide Curves) 控制能力。
- **設計庫 (Design Library)**: 自動化標準件生成器，支援 ISO 規格螺栓與螺帽。
- **工程確效 (Drawing & BOM)**: 專業 8 區工程圖框、自動材料明細表 (BOM) 以及帶有重心與質量分析的標題欄。
- **機械配合 (Mechanical Mates)**: 支援齒輪 (Gear) 傳動比與螺桿 (Screw) 節距的動態運動模擬。

---

## 🎯 核心功能 (Core Features)

### 1. Graph-based 2D 草圖引擎 (Sketcher)
- 拋棄傳統的依賴陣列，改用原生的圖論結構 (`SketchNode` 與 `SketchEdge`)。
- 內建 **PBD 約束求解器**，支援即時的水平、垂直、共點、等長、相切、同心、角度等解算。
- **草圖狀態視覺化**：完全定義 (黑)、欠定義 (藍)、衝突 (紅)。

### 2. 工業級三維特徵建模 (3D Modeling)
- **面上起草 (Sketch on Face)**：支援在任意實體表面建立局部坐標系 (LCS) 並進行二次特徵繪製。
- **參數化特徵鏈**：完全對標 SolidWorks 特徵樹，包含 **退回控制棒 (Rollback Bar)** 與歷史回溯編輯。
- **組態管理 (Configurations)**：支援在同一零件檔內建立多個設計變體 (Suppress/Unsuppress)。

### 3. 使用者介面 (UI/UX)
- **S-Key 快捷工具箱**: 模式感知的快速選單。
- **右鍵上下文選單**: 快速存取編輯、正視於、隱藏與壓縮等功能。
- **Heads-up Toolbar**: 顯示樣式 (Shaded, Shaded with Edges, Wireframe) 切換。

---

## 🛠️ 技術棧 (Tech Stack)

- **Kernel**: OpenCASCADE (via Python FastAPI + pythonocc-core)
- **Frontend**: Next.js 15, Three.js, Zustand, Tailwind CSS 4
- **Performance**: 增量重建管線與大型組件輕量化代理 (Proxy Boxes) 模式。

---

## 🚀 快速開始 (Quick Start)

### 環境初始化
```powershell
powershell .\INSTALL.ps1
```

### 啟動應用
```powershell
powershell .\LAUNCH-3D-BUILDER.ps1
```
(啟動順序：1. 後端幾何引擎 8400 埠 -> 2. 前端 Dev Server -> 3. Electron 視窗)

---

## 🏁 研發基準聲明
3D-Builder 現已達成 **SolidWorks 2000 Parity**。所有核心建模、裝配與工程圖工作流均已完成工業級確效。
