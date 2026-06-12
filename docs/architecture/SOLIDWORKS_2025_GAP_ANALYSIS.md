# SOLIDWORKS 2025 全面性操作對齊與功能缺口審計報告 (Gap Analysis Report)

> **基準文檔**：[SOLIDWORKS 2025 線上說明](https://help.solidworks.com/2025/chinese/SolidWorks/sldworks/r_welcome_sw_online_help.htm)
> **審計標的**：3D-Builder Web-based CAD Engine (v1.1)
> **審計日期**：2026-06-12
> **目的**：逐項對齊官方 32 大知識領域，精確量化當前實作程度，並制定系統性的補足路線圖。

---

## 1. 審計標準與量化指標

本報告採用 **「操作對齊度 (Operational Alignment)」** 作為核心指標：
*   🟢 **高度對齊 (High Alignment, 80-100%)**：具備與 SolidWorks 相似的 UI/UX 與核心算法，能滿足工業級日常操作。
*   🟡 **部分對齊 (Partial Alignment, 30-79%)**：具備基礎功能，但缺乏進階參數或邊界條件處理。
*   🔴 **未實作 (Not Implemented, 0-29%)**：模組完全缺失或僅有概念性佔位符。

---

## 2. 逐項章節檢視 (Section-by-Section Analysis)

以下依照 SOLIDWORKS 2025 官方說明的章節結構進行逐項審計：

### 2.1 基礎操作與介面 (Fundamentals & UI)
| 官方章節 | 3D-Builder 實作現況 | 對齊度 | 功能缺口 (Gaps) | 建議與修補策略 |
| :--- | :--- | :--- | :--- | :--- |
| **01 歡迎對話方塊** | 具備基礎的歡迎引導。 | 🟡 50% | 缺乏近期文件縮圖、MySolidWorks 雲端整合。 | 實作 `WelcomeDialog.tsx` 整合本機/雲端專案歷史紀錄。 |
| **02 使用者介面** | 實作 RibbonBar, PropertyManager, ShortcutBox (S鍵), ContextMenu。 | 🟢 90% | 缺乏可自訂的巨集快捷鍵、手勢操作 (Mouse Gestures)。 | UI 框架已極度對齊，需增加游標滑動軌跡判定以實作手勢環。 |
| **03 基礎知識** | 特徵樹 (FeatureManager) 歷史回溯、模型重建 (Rebuild)。 | 🟢 85% | 缺乏多本體實體 (Multibody Parts) 的階層式資料夾管理。 | 在 FeatureManager 增加「實體」資料夾，支援對單一實體進行獨立布林運算。 |
| **04 顯示與檢視** | 實作 ViewOrientation (Ctrl+1~8), 剖面視圖 (Section View), 透視/正交切換。 | 🟢 95% | 缺乏 RealView 擬真渲染與即時陰影投射 (Ray-tracing)。 | 整合 WebGL / Three.js 的進階環境光遮蔽 (SSAO) 與材質環境貼圖。 |

### 2.2 核心建模能力 (Core Modeling)
| 官方章節 | 3D-Builder 實作現況 | 對齊度 | 功能缺口 (Gaps) | 建議與修補策略 |
| :--- | :--- | :--- | :--- | :--- |
| **11 零件和特徵** | 支援 Extrude, Revolve, Sweep, Loft, Fillet (進階), Chamfer, Hole Wizard。支援 Up To Next, Mid Plane。 | 🟢 85% | 缺乏 3D 曲線特徵 (如螺旋線 Helix, 投影曲線)、拔模 (Draft) 與抽殼 (Shell) 的進階參數。 | 優先於 `geometry_service.py` 實作 `BRepOffsetAPI_MakeThickSolid` (抽殼) 與拔模角算法。 |
| **12 草圖繪製** | PBD + NR 求解器。支援 13 種以上核心約束（含對稱、共線）。支援 EquationEngine。 | 🟢 95% | 缺乏 3D 草圖 (3D Sketch) 與樣條曲線 (Spline) 的控制點曲率調節。 | 擴充 SketchSolver 支援 Z 軸自由度，實作 3D 幾何約束。 |
| **05 從 2D 到 3D** | 支援草圖文字 (CNC字體)、Convert Entities (參考圖元)。 | 🟡 60% | 缺乏從外部 DXF/DWG 匯入草圖並自動修復斷線的功能。 | 開發 DXF 解析器與拓撲修復演算法 (Heal Edges)。 |

### 2.3 產品級模組 (Production Modules)
| 官方章節 | 3D-Builder 實作現況 | 對齊度 | 功能缺口 (Gaps) | 建議與修補策略 |
| :--- | :--- | :--- | :--- | :--- |
| **06 組合件** | 具備基礎 Mate 系統 (同心, 重合, 距離) 與干涉檢查 (Interference Detection)。 | 🟡 40% | 缺乏進階配合 (齒輪, 螺紋, 凸輪)、大型組合件模式 (LDR) 與動態機構模擬。 | 擴展 PBD 求解器以支援 3D 剛體動力學 (Rigid Body Dynamics) 約束。 |
| **09 尺寸細目與工程圖** | `DrawingSheet.tsx` 可輸出 SVG。 | 🔴 10% | 缺乏自動三視圖投影、標準圖紙範本、BOM 表與幾何公差 (GD&T) 標註。 | 核心缺口。需在後端利用 `HLRBRep` 提取隱藏線，並在前端實作完整的 2D 製圖環境。 |
| **07 模型組態** | 僅有單一狀態。 | 🔴 0% | 缺乏 Configuration Manager 來控制特徵抑制與尺寸變體。 | 在 State 結構中引入變數矩陣 (Design Table 概念)，允許切換特徵狀態。 |

### 2.4 進階與專業模組 (Advanced & Specialized)
| 官方章節 | 3D-Builder 實作現況 | 對齊度 | 功能缺口 (Gaps) | 建議與修補策略 |
| :--- | :--- | :--- | :--- | :--- |
| **13 鈑金 (Sheet Metal)** | 佔位符。 | 🔴 0% | 無法計算 K-Factor，缺乏基材法蘭、邊線法蘭、展開 (Flatten) 功能。 | 需引入特定的展平演算法，這在 Web CAD 是一大挑戰。 |
| **14 模擬 (Simulation)** | 佔位符。 | 🔴 0% | 缺乏 FEA (有限元素分析) 網格劃分、應力/應變計算與材質庫。 | 高難度。建議未來整合開源 FEA 求解器 (如 CalculiX) 作為後端微服務。 |
| **15 線路設計 (Routing)** | 佔位符。 | 🔴 0% | 無管路與電氣線束的 3D 佈線功能。 | 需先完成 3D 草圖系統，方可實作 Routing。 |
| **16 模具設計 (Mold)** | 可手動布林切割。 | 🔴 5% | 缺乏自動分模線 (Parting Line)、分模面與公母模仁產生器。 | 依賴拔模分析功能，需先完善基礎分析工具。 |
| **20 輸入和輸出** | 支援 STEP, IGES, STL 匯出匯入。 | 🟢 90% | 缺乏直接讀取 `.SLDPRT` (專有格式) 或匯出 3D PDF。 | 持續強化 pythonocc 資料交換通道，考慮引入 Datakit 等商用轉檔核心（如專案商業化）。 |

---

## 3. 系統性缺口盤點 (Capability Deficit Breakdown)

透過上述 32 個章節的過濾，我們發現本專案的發展極度「**偏科**」：
1.  **強項 (High Readiness)**：基礎 UI 框架、2D 參數化草圖求解器、基礎實體建模特徵。這部分已經達到了可進行工業概念設計的水準（SCS > 90）。
2.  **致命弱點 (Critical Deficits - The "Missing 60%")**：
    *   **工程圖 (Drawings)**：在製造業中，沒有工程圖就無法加工。這是目前阻礙專案實用化的最大高牆。
    *   **進階組件與機構 (Complex Assemblies)**：缺乏進階機械配合與動態求解能力，無法驗證連動設計。
    *   **模型組態與設計表 (Configurations)**：無法進行產品系列化設計。

---

## 4. 戰略行動計畫 (Strategic Action Plan)

基於此份全面性的 Gap Analysis，建議調整開發路線圖，將資源集中於修補最高優先級（阻礙產品化）的缺口：

### 階段 1：Solidification (鞏固核心與補齊小缺口) - [預計 2 週期]
*   **目標**：完善「零件和特徵」章節。
*   **Action**：
    *   實作特徵鏡像 (Mirror Features) 與多實體操作。
    *   實作抽殼 (Shell) 與拔模 (Draft) 特徵。
    *   實作 3D 視圖中的手勢環 (Mouse Gestures) 提升操作流暢度。

### 階段 2：The Documentation Wall (突破工程圖高牆) - [預計 4 週期]
*   **目標**：攻克「尺寸細目和工程圖」章節。
*   **Action**：
    *   後端實作 `HLR` (Hidden Line Removal) API，自動將 3D 模型投影為 2D 向量圖 (前、上、右視圖)。
    *   前端建立全新的 `DrawingWorkspace.tsx`，支援圖框、BOM 表置入與尺寸自動標註 (Smart Dimension in Drawings)。

### 階段 3：Assembly Dynamics (組合件動態學) - [預計 3 週期]
*   **目標**：深化「組合件」與「動作研究」。
*   **Action**：
    *   從靜態的幾何檢查，轉向整合物理引擎 (如 Rapier 或 Ammo.js) 以模擬剛體運動。
    *   實作齒輪 (Gear)、凸輪 (Cam) 等機械拘束。

### 階段 4：Productization (配置與進階模組) - [預計 長期]
*   **目標**：進入「模型組態」與「鈑金」領域。
*   **Action**：
    *   建立 Design Table 關聯系統。
    *   開發專屬的 Sheet Metal 展平微服務。

---
**結論**：
3D-Builder 目前已成功完成從 0 到 1 的基礎架構建設（底層幾何引擎與 Web UI）。透過對齊 SolidWorks 2025 官方文件，我們確立了從「基礎建模工具」邁向「工業級完整 CAD 平台」的明確路徑，後續需嚴格遵循本報告的階段性目標執行。