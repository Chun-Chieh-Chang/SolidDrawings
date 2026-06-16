# SOLIDWORKS 2010 專家知識標準與基準

> **來源**：https://help.solidworks.com/2010/chinese/SolidWorks/help_list.htm?id=0
> **戰略意義**：將專案的對齊基準從 2025 年版下調至 2010 年版。2010 年版代表了**參數化實體 CAD 的黃金時代與核心成熟期**，剔除了現代雲端、MBD 等非 MVP (Minimum Viable Product) 的龐雜功能，為 3D-Builder 提供了一個極具可行性且聚焦於「純粹工程建模」的驗證標準。

## 目錄結構 (依據 2010 Web Help)

| 序號 | 2010 章節名稱 | 核心聚焦與技術指標 | 當前 3D-Builder 狀態 |
| :--- | :--- | :--- | :--- |
| 1 | 簡介與新增功能 | 基礎指引 | ✅ 具備 |
| 2 | 使用者介面 (UI) | CommandManager, PropertyManager, FeatureManager | 🟢 高度對齊 |
| 3 | 基礎知識 | 檔案管理、重製、視圖操作、特徵歷史 | 🟢 高度對齊 |
| 4 | 從 2D 到 3D | 基礎 DXF/DWG 的概念性轉換 | 🟡 部分對齊 |
| 5 | **草圖繪製 (Sketching)** | 2D 幾何約束、尺寸驅動、複雜草圖輪廓 | 🟢 95% 對齊 |
| 6 | **零件和特徵 (Features)** | 拉伸、旋轉、掃描、疊層拉伸、圓角、抽殼、陣列 | 🟢 85% 對齊 |
| 7 | **組合件 (Assemblies)** | 同心、重合等基礎與進階配合 (Mates) | 🟡 40% 對齊 |
| 8 | **尺寸細目和工程圖 (Drawings)** | 2D 視圖投影、BOM、智慧型尺寸標註 | 🔴 10% (最缺) |
| 9 | **模型組態 (Configurations)** | 設計表、特徵抑制狀態管理 | 🔴 0% |
| 10 | 鈑金 (Sheet Metal) | 基材法蘭、展平 | 🔴 0% |
| 11 | 熔接 (Weldments) | 結構成員、角落修剪 | 🔴 0% |
| 12 | 模具設計 (Mold Design) | 分模線、公母模仁 | 🔴 5% |
| 13 | 線路設計 (Routing) | 管路與線束佈線 | 🔴 0% |
| 14 | Simulation & Motion | 基礎靜態應力分析與剛體運動 | 🔴 0% |
| 15 | 輸入/輸出 (I/O) | STEP, IGES, STL 等中繼格式交換 | 🟢 90% 對齊 |

## MVP 核心知識領域 (2010 專家級基準)

針對 3D-Builder Web CAD，我們鎖定 2010 的「**三大支柱**」作為產品化的絕對及格線：
1. **草圖與特徵 (Sketch & Features)**：必須支援穩定的幾何約束求解 (PBD/NR) 與核心布林運算。
2. **組合件 (Assemblies)**：必須支援多零件的相對定位與基礎干涉檢查。
3. **工程圖 (Drawings)**：必須能將 3D 幾何透過 HLR (隱藏線移除) 正確投影為標準 2D 圖紙。

## 開發路線圖的降維打擊

改以 2010 為基準後，專案不再需要考慮 2025 年的 RealView 光線追蹤、Cloud PDM 整合或 MBD 等龐大體系。
我們將**所有的資源集中在攻克「工程圖 (Drawings)」、「模型組態 (Configurations)」與「進階組合件 (Assemblies)」這三大核心**，這將大幅縮短專案進入「工業實用階段 (Production Ready)」的時間。