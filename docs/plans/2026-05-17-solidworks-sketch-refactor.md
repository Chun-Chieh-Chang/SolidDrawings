# 2026-05-17 SolidWorks 草圖環境重構計畫

## 1. Objective
以 SolidWorks 專業標準重構草圖繪製環境，確保符合工業級 CAD 軟體的使用者體驗和功能完整性。

## 2. SolidWorks 草圖環境標準

### 2.1 核心組件
1. **CommandManager 草圖標籤** - 草圖工具列
2. **Active Sketch Editor** - 草圖屬性編輯面板
3. **草圖 HUD** - 視口中央 Heads-Up Display
4. **幾何約束面板** - 一鍵拘束工具
5. **智慧尺寸面板** - 參數化尺寸驅動

### 2.2 草圖工具
- 直線段 (Line)
- 三點圓弧 (Arc)
- 中心圓 (Circle)
- 邊角矩形 (Rectangle)
- 構造中心線 (Centerline)
- 智慧尺寸 (Smart Dimension)

### 2.3 幾何約束
- 水平 (Horizontal)
- 垂直 (Vertical)
- 重合原點 (Coincident)
- 等長 (Equal)
- 相切 (Tangent)
- 固定鎖定 (Fixed)

### 2.4 草圖生命週期
1. 點擊基準面 → 啟動草圖模式
2. 繪製輪廓 → 實時預覽
3. 閉合輪廓 → 驗證完整性
4. 離開草圖 → 拉伸特徵

## 3. PDCA Cycle Implementation

### [Plan] Phase 4.1: 草圖 HUD 重構 - **COMPLETE**
**Goal**: 實作 SolidWorks 風格的 Heads-Up Display

**Design Approach**:
- 視口中央懸浮 HUD
- 顯示草圖狀態、工具、節點計數
- 快捷指令按鈕 (離開/捨棄)

**Implementation Tasks**:
1. [x] Create `src/renderer/SketchHUD.tsx` - HUD component
2. [x] Add grid snap toggle
3. [x] Add quick exit/discard buttons
4. [ ] Integrate into main viewport in `page.tsx` (Pending)

**Verification**:
- [x] HUD appears when sketch mode active
- [x] All controls functional
- [ ] TypeScript compilation passes (Exit Code 0)
- [ ] Integration into viewport (Pending)

### [Plan] Phase 4.2: 草圖屬性編輯面板重構
**Goal**: 對標 SolidWorks PropertyManager 草圖面板

**Design Approach**:
- 左側側邊欄草圖屬性面板
- 動態顯示點位座標
- 支援 U/V 參數編輯
- 顯示幾何約束狀態

**Implementation Tasks**:
1. Update `DatumPlanes.tsx` - 草圖屬性面板
2. Add dynamic point coordinate display
3. Add constraint status display
4. Implement smart dimension panel

**Verification**:
- Point coordinates display correctly
- Constraints show complete definition status
- No TypeScript errors

### [Plan] Phase 4.3: 草圖生命週期優化
**Goal**: 完善草圖繪製到特徵長出的完整流程

**Design Approach**:
- 自動閉合輪廓驗證
- 草圖重入支援
- 特徵參數持久化

**Implementation Tasks**:
1. Implement auto-loop closure
2. Add sketch re-entry support
3. Ensure feature parameters persistence

**Verification**:
- Sketch loop closes correctly
- Feature can be re-edited
- Parameters persist across sessions

## 4. Immediate Next Steps

### Day 1: 草圖 HUD
1. Implement `SketchHUD.tsx`
2. Add grid snap toggle
3. Add quick exit/discard buttons

### Day 2: 草圖屬性面板
1. Update `DatumPlanes.tsx`
2. Add dynamic point coordinate display
3. Add constraint status display

### Day 3: 草圖生命週期
1. Implement auto-loop closure
2. Add sketch re-entry support
3. Ensure feature parameters persistence

## 5. Success Criteria
- [ ]草圖 HUD 顯示正確
- [ ]草圖屬性面板對標 SolidWorks
- [ ]草圖生命週期完整
- [ ]零 TypeScript 錯誤
- [ ]所有變更記錄在 DEV_LOG.md

## 6. References
- SolidWorks 2024 草圖使用者手冊
- [OCCT Sketch Documentation](https://dev.opencascade.org/doc/overview/html)
