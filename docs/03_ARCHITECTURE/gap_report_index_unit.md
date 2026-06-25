# 功能缺口審計報告 (Gap Report) - Video: Index Unit Intelligence

## 1. 影片背景與技術指標
- **影片主題**：Index Unit (分度單元) 建模與智能覆蓋 (Intelligence Overrides)。
- **核心技術目標**：
    - 使用 **Center Rectangle** 與 **Mid Plane** 建立對稱基礎。
    - 透過 **Convert Entities** 建立動態草圖連結。
    - 使用 **Smart Dimension** 與 **Equation Engine** 進行參數化控制（支援跨單位輸入，如 `1in + 5mm`）。
    - 實作 **Pattern (Circular/Linear)** 的等間距配置。
    - 使用 **Hole Wizard** 建立標準孔位。

## 2. 系統現狀 vs. 影片要求 (交叉比對)

| 技術指標 | 當前系統狀態 (Geometry Service / UI) | 缺口偵測 (Gap) | 優先級 |
| :--- | :--- | :--- | :--- |
| **單位智能 (Unit Intelligence)** | 已有 `EquationEngine` 支援 `mm, cm, m, in, inch`。 | `PartFeaturePropertyManager` 中的 `ParamInput` 未統一使用 `EquationEngine` 進行即時評價（目前僅部分支援）。 | **高** |
| **對稱建模 (Symmetry)** | 支援 `Center Rectangle` 與 `Mid Plane`。 | 系統在重建時對對稱約束的穩定性有待加強（Fragility Scan 顯示之弱點）。 | 中 |
| **動態草圖連結** | 支援 `Convert Entities`。 | 無明顯缺口。 | 低 |
| **進階陣列 (2D Pattern)** | 支援 `LINEAR` 與 `CIRCULAR` 陣列。 | 2D 矩陣陣列（Direction 2）的 UI 交互較為複雜，且在 Backend 需要優化 nested loop 邏輯。 | 中 |
| **孔位精靈 (Hole Wizard)** | 已有預設值 (M3-M8)。 | 缺失特定的切除演算法與孔位預覽（Ghosting）。 | 中 |
| **特定切除演算法** | 支援 `REVOLVED_CUT`, `SURFACE_CUT`。 | 缺失 `UP_TO_NEXT` 終止條件的精確交叉判定（Ray-Casting 判定）。 | **高** |

## 3. 核心缺失能力 (Critical Gaps)
1. **統一單位評價機制**：`ParamInput` 需要全面對齊 `EquationEngine`，確保在 3D 特徵參數輸入時亦可使用 `1in` 等運算式。
2. **Up To Next 演算法**：Backend 需要實作基於 Ray-Casting 的幾何交叉判定，以支持「拉伸至下一面」的智能終止。
3. **UI 按鈕與交互優化**：`RibbonController` 需增加更明顯的 `Up To Next` 選項。

## 4. 實作計畫建議
- **階段 A**：優化 `EquationEngine` 並整合至 `PartFeaturePropertyManager`。
- **階段 B**：實作 `Up To Next` 的幾何判定邏輯。
- **階段 C**：強化 `PATTERN` 方向 2 的穩定性。
