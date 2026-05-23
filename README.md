# 3D Builder (Powered by SkillsBuilder)

3D Builder 是一個基於 Web 的新世代參數化 3D CAD 建模工具，旨在提供工業級的草圖約束引擎與三維幾何構建能力，並透過 Electron 封裝成本地端應用程式。

本專案底層採用了 **Graph-driven Development (圖論驅動)** 架構，並具備即時響應的 **Position-Based Dynamics (PBD)** 約束求解器。開發過程全程受到 [SkillsBuilder](https://github.com/Chun-Chieh-Chang) 智慧開發系統的護航，遵循嚴格的 PDCA 循環與防迴歸確效紀律。

---

## 🎯 核心功能 (Core Features)

### 1. Graph-based 2D 草圖引擎 (Sketcher)
- 拋棄傳統的依賴陣列，改用原生的圖論結構 (`SketchNode` 與 `SketchEdge`)。
- 內建 **PBD (Position-Based Dynamics) 約束求解器**，支援即時的水平、垂直、共點、等長、相切、同心、角度等約束條件解算，畫面零延遲回饋。
- **草圖狀態視覺化**：根據約束定義程度自動變色（完全定義=黑色，欠定義=藍色，衝突=紅色）。

### 2. 工業級三維特徵建模 (3D Modeling)
- **面上起草 (Sketch on Face)**：支援在任意實體表面建立局部坐標系 (LCS) 並進行二次特徵繪製。
- **參數化特徵鏈**：完全對標 SolidWorks 的特徵樹邏輯，包含 **退回控制棒 (Rollback Bar)** 與歷史回溯編輯。
- **動態預覽 (Live Rebuild)**：參數修改具備 150ms 防抖的動態即時預覽功能。
- **特徵陣列**：支援線性與環形特徵陣列複製。

### 3. 極致的使用者介面 (SolidWorks-aligned UI/UX)
- **前景視圖工具欄 (Heads-up Toolbar)**：提供常用的顯示樣式與視角切換。
- **S-Key 快捷工具箱**：模式感知的快速選單，大幅提升建模效率。
- **毛玻璃效果 (Glassmorphism)**：現代感十足的參數面板與屬性管理器。

### 4. IPC 與後端幾何內核 (Electron + PythonOCC)
- **Backend**: 基於 OpenCASCADE (pythonOCC) 提供工業級的 3D 布林運算、質量屬性分析（體積、重心、慣性矩）。
- **工業格式導出**：支援 STEP, IGES, STL 以及 A4 向量工程圖 PDF 輸出。

---

## 🚀 快速開始 (Quick Start)

### 環境初始化
本專案整合了自動化開發環境，請在首次執行前執行：
```powershell
powershell .\INSTALL.ps1
```
這將自動同步技能庫、配置 Git Hooks 並檢查 Python 環境。

### 開發指令
```bash
npm install
npm run dev
```

### 型別檢查與防禦
專案已啟用 Git pre-commit hook，所有代碼必須通過以下檢查才能提交：
```bash
npx tsc --noEmit
```

---

## 📜 文件索引 (Documentation)
- [開發日誌 (DEV_LOG.md)](DEV_LOG.md) - 詳細記錄 RCA/CAPA 診斷與 Phase 進度。
- [續寫與交接指南 (handover_resume_guide.md)](handover_resume_guide.md) - 下一位開發者/AI 的必讀導引。
- [功能藍圖 (SOLIDWORKS_FEATURE_ROADMAP.md)](docs/architecture/SOLIDWORKS_FEATURE_ROADMAP.md) - 長期功能開發路線圖。
