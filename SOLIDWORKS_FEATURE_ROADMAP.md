# SOLIDWORKS_FEATURE_ROADMAP.md - 3D-Builder 開發藍圖

> **身分聲明**：本專案由「資深全端 CAD 架構師」主導，對標 SolidWorks 工業標準，採用 OpenCASCADE (OCCT) 核心，嚴格執行 PDCA 循環。

---

## 📅 開發階段規劃 (Phased Development Roadmap)

### Phase 1: B-Rep 內核與參數化管道 (已完成/加固)
- [x] **重型引擎轉向**：建立 FastAPI + PythonOCC (OCCT) 伺服器端架構。
- [x] **拓撲內核實作**：放棄幾何體 API，改為基於 Edge/Wire/Face/Solid 的拓撲構造邏輯。
- [x] **布林運算序列**：實作長出 (Join) 與除料 (Cut) 的歷史樹運算。
- [x] **基礎 UI**：建立 Glass Order 風格介面與實時渲染視口。

### Phase 2: 草圖引擎與平面系統 (當前任務)
- [ ] **基準面系統 (Datum Planes)**：實作 Front (XY), Top (XZ), Right (YZ) 三大預設基準面。
- [ ] **2D 幾何約束雛形**：實作 Line, Circle, Arc 的參數化定義。
- [ ] **封閉區域識別**：自動將草圖實體轉化為可拉伸的 `TopoDS_Wire`。
- [ ] **動態法線拉伸**：支援沿著基準面法線方向進行長出/除料。

### Phase 3: 拓撲選取與面基草圖 (Topology & Face Sketching)
- [ ] **拾取系統 (Picking System)**：實作視口中點選「面 (Face)」或「邊 (Edge)」的功能。
- [ ] **面上草圖 (Sketch on Face)**：動態建立基於所選平面的局部座標系 (Local Coordinate System)。
- [ ] **拓撲命名保存 (Persistent Naming)**：解決特徵變更後，下游參照面 ID 丟失的問題（CAD 開發最難點）。

### Phase 4: 高階幾何特徵 (Advanced Features)
- [ ] **倒角與圓角 (Fillet/Chamfer)**：基於選取邊緣的拓撲修正。
- [ ] **旋轉長出 (Revolve)**：定義旋轉軸與旋轉角度的特徵運算。
- [ ] **薄殼化 (Shelling)**：實作等距偏移實體運算。

### Phase 5: 組合件與約束 (Assembly & Mates)
- [ ] **多零件環境**：支援在同一個視口中加載多個獨立 Part。
- [ ] **配合約束 (Mates)**：實作重合、平行、同軸等幾何約束（利用 OCCT 變換矩陣）。

### Phase 6: 工程確效與分析 (Validation & Analysis)
- [ ] **質量屬性**：計算體積、重心 (Center of Gravity)、慣性矩。
- [ ] **干涉檢查**：自動識別組合件中的碰撞區域。
- [ ] **匯出支援**：正式支援 STEP, IGES, STL 工業格式輸出。

---

## 🛠️ PDCA 執行規範 (Execution Protocol)

1.  **Plan (計畫)**：每次行動前，必須在 `DEV_LOG.md` 記錄預計修改的「拓撲邏輯」與「副作用評估」。
2.  **Do (執行)**：代碼修改必須保持原子性，嚴禁大面積破壞性覆蓋。
3.  **Check (檢查)**：
    -   **後端**：通過 `python -m pytest` 或測試腳本驗證幾何正確性。
    -   **前端**：確保 Console 零錯誤，視口渲染無破洞。
4.  **Act (矯正/歸檔)**：更新開發日誌，若有幻覺或邏輯錯誤，必須進行 RCA 分析。

---

## 📐 設計美學原則 (Design Aesthetics)
- **Glass Order 系統**：背景深邃 (#0F172A)，卡片通透。
- **工業精密感**：數據輸入框需支援 0.001 級別精度。
- **動態回饋**：特徵運算時需有 B-Rep Recomputing 的動畫提示。
