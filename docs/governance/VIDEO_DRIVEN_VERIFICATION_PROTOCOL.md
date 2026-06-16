# 影片驅動互動驗證協議 (Video-Driven Interactive Verification Protocol)

## 🎯 核心目標
透過真實建模影片作為「動態指標」，讓機器人在 3D-Builder UI 中實時演示一遍。藉此識別：
1. **介面細節缺失**：哪些按鈕或狀態提示在 SW 2010 中有，而我們沒有？
2. **交互邏輯斷層**：操作流是否符合工程師直覺？
3. **穩定性邊界**：複雜建模組合下，幾何引擎是否崩潰？

## 🛠️ 執行流程 (SOP)

### 1. 影片解析 (Analysis)
- 當使用者提供網址後，Agent (SolidWorks 專家) 將提取建模的每一項特徵、拘束、與 UI 交互步驟。
- 參照 [SOLIDWORKS 2010 官方說明](https://help.solidworks.com/2010/chinese/SolidWorks/help_list.htm?id=0) 定義正確的系統行為。

### 2. 機器人演繹 (Demonstration)
- 機器人透過 **Robot HUD** 與 **Ghost Cursor** 在 UI 上實時模擬影片的操作。
- **實時視圖同步**：每一特徵生成必須立即反映在 Viewport 與 FeatureTree。

### 3. 缺口識別與修復 (Gap Repair)
- 如果演示中出現：
    - **[ERROR]**：立即查閱後端日誌，判斷是 TNS 失效還是幾何衝突，並按 PDCA 進行修正。
    - **[UI 違和]**：若操作流程比 SW 2010 繁瑣，立即優化 PropertyManager 的交互佈局。

### 4. 閉環確效 (Closure)
- 修復後，機器人必須**無干預地重新跑完一遍影片流程**，直到 100% 重現。

---

## 🚦 目前準備狀態 (Pre-flight Check)
為確保演繹不因技術債而中斷，Agent 正在執行最後兩項「落地手術」：
- [x] **TNS v2** (拓撲穩定性 - 已完成)
- [ ] **Phase 2: 全透明錯誤診斷** (進行中 - 讓演繹失敗時能說出原因)
- [ ] **Phase 3: 動態特徵預覽** (預計 - 模擬 SW 100% 交互感)
