# Phase 44: Sketch & Sweep/Loft Polish

## [D] Do — 實作步驟

### 1. Robust 3D Coordinate Conversion (精確坐標轉換)
- [ ] 在 `src/app/page.tsx` 中，找到 `sketchFeatureTo3DPoints` 函式。
- [ ] 將 `FACE` 平面的 X 軸與 Y 軸計算邏輯，修改為與後端 `geometry_service.py` 相同的判定方式。
- [ ] 確保轉換精度與 OCC 後端一致，避免 Sweep / Loft 產生非預期的幾何偏移。

### 2. Sweep Path Supports B-Spline (掃掠路徑支援平滑曲線)
- [ ] 在 `backend/app/services/geometry_service.py` 中，找到 `f_type == 'SWEEP'` 區塊。
- [ ] 將 `path_wire` 的建構方式從目前的手動逐點建立線段 (`BRepBuilderAPI_MakeEdge`)，改為呼叫共用的 `_build_wire_from_points(path_points)`。
- [ ] 確保修改後能支援包含 `SPLINE_CONTROL` 在內的平滑曲線。

### 3. Sketch Nodes UI (草圖節點介面優化)
- [ ] 修改 `src/ui/FeatureManagerPanel.tsx`。
- [ ] 在 `f.type === 'SKETCH'` 的特徵渲染區塊，除了既有的可見性按鈕 (👁) 外，新增「✏️」編輯按鈕。
- [ ] 點擊編輯按鈕時，觸發進入草圖模式的行為 (同雙擊事件)。

## [C] Check — 確效與驗證
- [ ] 執行 TypeScript 檢查 (`npx tsc --noEmit`) 確保前端無型別錯誤。
- [ ] 確認後端修改無語法錯誤。

## [A] Act — 矯正與優化
- [ ] 完成後更新 `DEV_LOG.md`，記錄本次 Phase 44 的修改與 RCA/CAPA。
- [ ] 更新 `HANDOVER_RESUME_GUIDE.md`。
