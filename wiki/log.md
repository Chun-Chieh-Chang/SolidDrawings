# Project Changelog & Milestones

This log documents the chronological progress, architectural decisions, and version changes of the **3D-Builder** project.

---

## [2026-05-23] PBD Constraint Solver & Graph-based Sketch Core 重構 🚀
*   **重構核心**：徹底摒棄舊有的連續 `sketchPoints` 數組儲存，轉換為 Graph 圖論模型，透過 `sketchNodes`、`sketchEdges`、`sketchConstraints` 儲存草圖拓撲。
*   **約束求解**：引入 `ConstraintSolver.ts` 採用 PBD (Position-Based Dynamics) 迭代鬆弛算法，目前支援共點、水平、垂直、距離、等長五種約束。
*   **前端 Hit-Testing 升級**：在 `SketchPreview.tsx` 中實作邊線的寬 Hitbox 偵測（外層加粗 15px 透明邊），解決滑鼠難以拾取精細線段的痛點。
*   **SOP & 技能整合**：成功運行 `SkillsBuilder` 安裝腳本，將 global 技能與 Graphify Git Hooks 註冊進專案生命週期中，並初始化 `wiki/` 架構。

## [2026-05-23] 示範建構清除與特徵加固 ✅
*   **UI 淨化**：移除 legacy 的 `🎥 示範建構` 按鈕與對應狀態機，移除視口中無特徵時的球體佔位，維持潔淨視埠。
*   **防禦阻斷**：為 `旋轉-實體` 特徵工具加裝輸入驗證，無效或輪廓不足 3 點時會主動進行 Electron `appAPI.notify` 或 `alert` 提示，阻斷 Phantom 可樂瓶幾何生成。

## [2026-05-21] 視埠與設計樹雙向連動與草圖編輯管理器 ✅
*   **選取連動**：實作 `getFeatureDistance` 空間近鄰求解器，支援 3D Viewport 與 FeatureManager 設計樹的雙向高亮連動。
*   **嵌套子草圖**：特徵樹以 SolidWorks 風格嵌套渲染子草圖（`↳ 草圖1`），選取子草圖時視埠以經典桃紅色 (`#ec4899`) 渲染草圖線框。
*   **專屬草圖屬性管理器**：新增 `SketchPropertyManager.tsx` 用於顯示基準面、幾何點數量，並提供快捷按鈕進入編輯模式。

## [2026-05-20] 高階基準幾何與引用實體工具鏈 ✅
*   **Datum Planes 幾何**：後端 OCCT 支援三點面、偏置面及圓柱表面軸構造；前端 Zustand 管理 `referencePlanes` 與 `referenceAxes` 陣列，並以 Morandi 丁香紫 (#6366f1) 與天空藍 (#60A5FA) 半透明 Gizmo 渲染。
*   **引用實體 (Referencing)**：
    *   實作轉換實體引用 (Convert Entities) 與剖面交叉曲線 (Intersection Curve)。
    *   偏置實體引用 (Offset Entities) 調用後端 `BRepOffsetAPI_MakeOffset` 核心高精度計算，避免 JS 端計算失真。
*   **特徵陣列複製 (Patterns)**：線性 (Linear) 與環形 (Circular) 特徵複製核心上線，前後端聯動實作布林融合。
