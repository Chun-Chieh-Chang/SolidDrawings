# 3D Builder - Handover & Resume Guide

## 1. 專案當前狀態 (Current Project State)
**[2026-05-23] PBD Constraint Solver 與 Graph-based Model 重構完成**

本專案剛完成核心架構的重大轉換，已拋棄舊版基於單一陣列的 `sketchPoints` 繪圖邏輯，全面升級為 **Graph-based (圖論)** 的草圖核心，並具備 PBD (Position-Based Dynamics) 約束求解器。

### 核心模組與架構分配
- **狀態管理 (`src/store/useCadStore.ts`)**:
  - `sketchNodes`: `Record<string, SketchNode>` (頂點，包含 `isFixed` 狀態)
  - `sketchEdges`: `Record<string, SketchEdge>` (邊線，由兩個節點 ID 構成)
  - `sketchConstraints`: `Record<string, SketchConstraint>` (圖形約束條件)
  - `selectedEntityIds`: `string[]` (用戶當前點選的物件，包含節點與邊線 ID)
- **視覺渲染與 Hit-Testing (`src/renderer/SketchPreview.tsx`)**:
  - 負責讀取 `sketchNodes` 與 `sketchEdges` 並繪製於 SVG/Canvas 上。
  - 已實作點擊 (Hit-Testing) 偵測：節點直接透過距離判定；邊線則有隱形的加粗 Hitbox (`strokeWidth={15}`) 方便用戶點選。點選結果會寫入 `selectedEntityIds`。
- **動態約束與 UI 面板 (`src/ui/SketchPropertyManager.tsx`)**:
  - 這是最新的左側參數面板，採用「Sea Salt Blue」毛玻璃 (Glassmorphism) 設計。
  - 會根據 `selectedEntityIds` 顯示當前選取的物件屬性，並提供相應的約束按鈕 (水平、垂直、共點、等長等)。
  - 操作約束按鈕會直接連動 `src/utils/geometry/ConstraintSolver.ts`，由 PBD 演算法重新計算所有受影響的節點座標後，寫回 Zustand，形成**零延遲的畫面閉環**。

## 2. 開發地雷與紀律 (Technical Debt & Rules)
- **`page.tsx` 的 Legacy Stubs**:
  - 由於之前 `page.tsx` 存在上千行的舊版繪圖控制邏輯 (與 `sketchPoints` 強耦合)，我們為了遵循「零錯誤 (0 Type Errors)」與「最小破壞原則」，採用了 Legacy Stubs。
  - 在 `page.tsx` 中，我們移除了對 `useCadStore` 中 `sketchPoints` 的解構，改為注入 `const sketchPoints: any[] = []; const setSketchPoints = (pts: any) => {};`。這讓舊版的 `useEffect` 不會報錯，但同時不具備任何副作用。後續若需清理 `page.tsx`，請直接安全刪除那些不會被觸發的 `useEffect`。
- **嚴格型別檢查**:
  - 任何改動推送到遠端前，**必須**能通過 `npx tsc --noEmit`。嚴禁出現 "Any" 或 "Property does not exist" 等錯誤。

## 3. 下一步開發建議 (Next Action Items)
接手本專案的工程師或 AI 代理，請依據使用者的需求，優先考慮以下兩個擴展方向：

1. **後端 OCCT 幾何引擎對接 (3D Generation)**
   - 目前我們在前端已經可以產生完美的 2D Graph (Nodes/Edges)。
   - **目標**: 需要將 `sketchNodes` 與 `sketchEdges` 解析成封閉迴圈 (Closed Loops)，透過 `window.electron.appAPI.generate3D(...)` IPC 傳送給 Python OCCT 後端。
   - **挑戰**: 需實作「尋找最小循環 (Minimum Cycle Basis)」的圖論演算法，以正確識別草圖內的封閉面，進而進行擠出 (Extrude)。

2. **擴充 PBD 約束求解器 (Solver Expansion)**
   - `src/utils/geometry/ConstraintSolver.ts` 目前支援 `COINCIDENT`, `HORIZONTAL`, `VERTICAL`, `EQUAL_LENGTH`。
   - **目標**: 實作更多約束類型，如：
     - 固定角度 (Angle)
     - 固定距離 (Distance)
     - 圓形/相切 (Tangent, Concentric - 需先擴充 `SketchEdge` 支援弧線型別 ARC)
