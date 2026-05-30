# Phase 44: Sketch & Sweep/Loft Polish

優化在 Phase 43 建立的 Sweep/Loft 功能，特別是針對 3D 坐標轉換的準確度，以及 Sweep 路徑對平滑 B-Spline 的支援。

## User Review Required

請確認以下優化項目是否符合您的預期，或者您有其他想優先處理的項目。

## Proposed Changes

### 1. Robust 3D Coordinate Conversion (精確坐標轉換)
#### [MODIFY] [page.tsx](file:///c:/Users/3kids/Downloads/3D-Builder/src/app/page.tsx)
- 更新 `sketchFeatureTo3DPoints` 函式。
- 目前針對 `FACE` 平面，前端使用的 Up 向量計算是近似法。將改為使用與後端 `geometry_service.py` 完全相同的嚴格幾何邏輯：從 Face Normal 出發，判斷若 nx, ny 極小則使用 (1,0,0)，否則以 (-ny, nx, 0) 作為 X 軸。確保前端轉換的 3D 點與後端建立的面坐標系 100% 吻合。

### 2. Sweep Path Supports B-Spline (掃掠路徑支援平滑曲線)
#### [MODIFY] [geometry_service.py](file:///c:/Users/3kids/Downloads/3D-Builder/backend/app/services/geometry_service.py)
- 目前 `SWEEP` 的 `path_points` 是使用簡單的迴圈與直線段 (`BRepBuilderAPI_MakeEdge`) 建構，不支援含有 `SPLINE_CONTROL` 標籤的點。
- 將改為直接呼叫共用的 `_build_wire_from_points(path_points)`，讓 Sweep 路徑能自動支援平滑的 B-Spline 曲線。

### 3. Sketch Nodes UI (草圖節點介面優化)
#### [MODIFY] [FeatureManagerPanel.tsx](file:///c:/Users/3kids/Downloads/3D-Builder/src/ui/FeatureManagerPanel.tsx)
- 在左側 Feature Tree 中，針對獨立的 `SKETCH` 特徵，除了現有的「隱藏/顯示」按鈕外，加入一個明確的「✏️ 編輯草圖」快速按鈕，讓操作更直覺 (雖然目前已支援雙擊編輯)。

## Verification Plan

### Manual Verification
1. 建立一個傾斜面 (FACE) 上的草圖，繪製圖形後轉為 Sweep 的斷面，確認是否精確對齊傾斜面法線。
2. 建立一條包含 Spline 的草圖作為 Sweep 路徑，確認 Build Sweep 後能產生平滑彎曲的管狀實體。
3. 觀察 Feature Tree，點擊 SKETCH 節點的編輯按鈕確認能否順利進入草圖模式。
