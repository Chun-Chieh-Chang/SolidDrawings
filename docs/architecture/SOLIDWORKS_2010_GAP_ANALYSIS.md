# SOLIDWORKS 2010 全面性操作對齊與功能缺口審計報告 (Gap Analysis Report)

> **戰略基準**：[SOLIDWORKS 2010 線上說明](https://help.solidworks.com/2010/chinese/SolidWorks/help_list.htm?id=0)
> **審計標的**：3D-Builder Web-based CAD Engine (v1.1)
> **審計日期**：2026-06-12
> **戰略調整原因**：將對齊基準從 2025 年版下調至 2010 年版，旨在剔除現代化附加功能（雲端、MBD、進階渲染等），將火力集中於「**純粹且成熟的參數化工程實體建模**」。這將建立一個更清晰、更具可行性的 MVP (最小可行性產品) 目標。

---

## 1. 審計標準與量化指標

採用 **「操作對齊度 (Operational Alignment)」**：
*   🟢 **高度對齊 (High Alignment, 80-100%)**：滿足 SolidWorks 2010 的核心操作邏輯。
*   🟡 **部分對齊 (Partial Alignment, 30-79%)**：具備基礎功能，缺乏進階參數。
*   🔴 **未實作 (Not Implemented, 0-29%)**：2010 版具備但 3D-Builder 完全缺失的模組。

---

## 2. 逐項章節檢視 (2010 版基準)

### 2.1 基礎操作與 UI (Fundamentals & UI)
| 官方章節 (2010) | 3D-Builder 實作現況 | 對齊度 | 功能缺口 (Gaps) | 修補策略 |
| :--- | :--- | :--- | :--- | :--- |
| **使用者介面** | RibbonBar (CommandManager), PropertyManager, ShortcutBox, ContextMenu 皆已實作。 | 🟢 95% | Mouse Gestures (手勢環)。 | 實作滑鼠右鍵拖曳的八向軌跡判定。 |
| **SolidWorks 基礎知識** | 特徵樹、退回控制 (Rollback)、視圖方位、顯示樣式 (實體/線架構)。 | 🟢 90% | 多本體 (Multibody) 資料夾管理。 | 在 FeatureManager 增加「實體」清單。 |

### 2.2 核心建模能力 (Core Modeling)
| 官方章節 (2010) | 3D-Builder 實作現況 | 對齊度 | 功能缺口 (Gaps) | 修補策略 |
| :--- | :--- | :--- | :--- | :--- |
| **草圖繪製** | 支援完整的約束系統 (Symmetric, Midpoint 等) 與智慧尺寸 (EquationEngine)。 | 🟢 95% | 3D 草圖 (3D Sketch)。 | 擴展 PBD 求解器至 Z 軸。 |
| **零件和特徵** | 支援 Extrude, Revolve, Fillet, Pattern (2D 矩陣與高效 Boolean)。 | 🟢 85% | 抽殼 (Shell)、拔模 (Draft)、肋 (Rib)、疊層拉伸 (Loft) 進階引導線。 | 優先實作 BRepOffsetAPI 封裝以支援薄殼與拔模。 |

### 2.3 產品製造模組 (Production Modules)
| 官方章節 (2010) | 3D-Builder 實作現況 | 對齊度 | 功能缺口 (Gaps) | 修補策略 |
| :--- | :--- | :--- | :--- | :--- |
| **組合件** | 基礎 Mate 系統 (同心, 重合) 與干涉檢查。 | 🟡 40% | 進階配合 (Gear, Cam)、自由度(DOF)動態拖曳。 | 引入剛體物理引擎進行運動學模擬。 |
| **尺寸細目和工程圖** | 具備基礎的 SVG 導出畫布。 | 🔴 10% | **最大缺口**。無標準圖紙、HLR 三視圖投影、BOM 與智慧標註。 | 核心戰役。後端實作 `HLRBRep`，前端建構 `DrawingSheet` 環境。 |
| **模型組態** | 單一狀態。 | 🔴 0% | 無 Design Table 與特徵抑制管理。 | 於 Store 實作變數矩陣與抑制狀態切換。 |
| **鈑金 / 熔接** | 無。 | 🔴 0% | 無展開算法 (Flat Pattern)、無結構成員。 | 實作基礎的 Sheet Metal 展開法蘭。 |

---

## 3. 「2010 基準」下的戰略盤點與聚焦

將基準切換至 2010 版後，專案的完成度輪廓產生了戲劇性的變化：
*   **介面與基礎草圖建模 (UI, Sketch, Basic Features)**：在 2010 年的標準下，3D-Builder 已經達到了 **90% 以上的高度對齊**。
*   **真正的技術斷層**：剝除現代附加功能後，**「工程圖 (Drawings)」、「模型組態 (Configurations)」與「動態組合件 (Assemblies)」** 成為橫亙在「玩具」與「工業用 CAD」之間最後且最硬的三座高牆。

---

## 4. 戰略行動計畫 (Revised Action Plan based on SW 2010)

這份計畫剔除了渲染與附加工具的雜訊，將 100% 的資源集中於 2010 時代的黃金核心。

### Phase 1: 鞏固參數化實體核心 (Solidification)
*   完成 **抽殼 (Shell)**、**拔模 (Draft)** 與 **肋 (Rib)** 特徵。
*   實作 **滑鼠手勢 (Mouse Gestures)** 提升操作速度。

### Phase 2: 突破工程圖高牆 (The Documentation Wall)
*   後端：實作 `HLR` API 提取 2D 向量。
*   前端：建構 2D 標註、標準圖框與 BOM 表插入系統。

### Phase 3: 多組態與產品系列化 (Configurations)
*   實作 **Design Table**，允許透過表格資料批次控制尺寸與特徵開關 (Suppression)。

### Phase 4: 動態連桿與進階配合 (Assembly Dynamics)
*   整合剛體運動學求解器，實作組合件中的拖曳模擬與齒輪連動。