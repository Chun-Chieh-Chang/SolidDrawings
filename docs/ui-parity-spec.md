# UI Parity Specification — SolidWorks 2010 vs 3D-Builder

> 本文檔規格化所有 UI 元素，確保 3D-Builder 的介面行為與 SolidWorks 2010 中文使用說明手冊對齊。
> 建立者：開發 Agent
> 最後更新：2026-06-15

## 規格化規則

每個 UI 元素必須記錄：
- 名稱
- 所在位置
- 顯示條件
- 啟用條件
- 禁用條件
- hover 狀態
- active 狀態
- 錯誤狀態
- 快捷鍵
- 右鍵選單
- 對應功能 ID

---

## 1. 主選單 (Menu Bar)

### 1.1 檔案選單

| 項目 | 名稱 | 位置 | 顯示條件 | 啟用條件 | 禁用條件 | hover | active | 錯誤 | 快捷鍵 | 右鍵選單 | SW ID |
|------|------|------|---------|---------|---------|-------|--------|------|--------|---------|-------|
| 新增 | 檔案 > 新增 | 主選單列 | 應用程式啟動 | 應用程式啟動 | — | bg-[#005B9A] text-white | bg-[#004A7C] text-white | — | Ctrl+N | 無 | SW2010-APP-001~003 |
| 開啟 | 檔案 > 開啟 | 主選單列 | 應用程式啟動 | 應用程式啟動 | — | bg-[#005B9A] text-white | bg-[#004A7C] text-white | — | Ctrl+O | 無 | SW2010-APP-004 |
| 儲存 | 檔案 > 儲存 | 主選單列 | 有開啟的文件 | 有開啟的文件 | 無文件 | bg-[#005B9A] text-white | bg-[#004A7C] text-white | — | Ctrl+S | 無 | SW2010-APP-005 |
| 另存新檔 | 檔案 > 另存新檔 | 主選單列 | 有開啟的文件 | 有開啟的文件 | 無文件 | bg-[#005B9A] text-white | bg-[#004A7C] text-white | — | — | 無 | SW2010-APP-006 |
| 匯出 | 檔案 > 匯出 | 主選單列 | 有開啟的文件 | 有開啟的文件 | 無文件 | bg-[#005B9A] text-white | bg-[#004A7C] text-white | — | Ctrl+E | 無 | — |
| 最近使用 | 檔案 > 最近使用 | 主選單列 | 有開啟過文件 | 有最近文件紀錄 | 無紀錄 | bg-[#005B9A] text-white | bg-[#004A7C] text-white | 紀錄空時顯示提示 | — | 無 | SW2010-APP-007 |
| 關閉 | 檔案 > 關閉 | 主選單列 | 有開啟的文件 | 有開啟的文件 | 無文件 | bg-[#005B9A] text-white | bg-[#004A7C] text-white | — | — | 無 | — |

### 1.2 編輯選單

| 項目 | 名稱 | 位置 | 顯示條件 | 啟用條件 | 禁用條件 | hover | active | 錯誤 | 快捷鍵 | 右鍵選單 | SW ID |
|------|------|------|---------|---------|---------|-------|--------|------|--------|---------|-------|
| 復原 | 編輯 > 復原 | 主選單列 | 有可復原的操作 | 有可復原的操作 | 復原佇列為空 | bg-[#005B9A] text-white | bg-[#004A7C] text-white | — | Ctrl+Z | 無 | SW2010-ERR-005 |
| 重做 | 編輯 > 重做 | 主選單列 | 有可重做的操作 | 有可重做的操作 | 重做佇列為空 | bg-[#005B9A] text-white | bg-[#004A7C] text-white | — | Ctrl+Y | 無 | SW2010-ERR-005 |
| 刪除 | 編輯 > 刪除 | 主選單列 | 有選取的圖元 | 有選取的圖元 | 無選取 | bg-[#005B9A] text-white | bg-[#004A7C] text-white | — | Del | 有 | SW2010-SEL-001 |

### 1.3 檢視選單

| 項目 | 名稱 | 位置 | 顯示條件 | 啟用條件 | 禁用條件 | hover | active | 錯誤 | 快捷鍵 | 右鍵選單 | SW ID |
|------|------|------|---------|---------|---------|-------|--------|------|--------|---------|-------|
| 顯示/隱藏項目 | 檢視 > 顯示/隱藏 | 主選單列 | 應用程式啟動 | 應用程式啟動 | — | bg-[#005B9A] text-white | bg-[#004A7C] text-white | — | — | 無 | SW2010-VIEW-010 |
| 顯示隱藏實體 | 檢視 > 顯示隱藏 | 主選單列 | 有隱藏的實體 | 有隱藏的實體 | 無隱藏實體 | bg-[#005B9A] text-white | bg-[#004A7C] text-white | — | — | 無 | SW2010-VIEW-007 |

### 1.4 插入選單

| 項目 | 名稱 | 位置 | 顯示條件 | 啟用條件 | 禁用條件 | hover | active | 錯誤 | 快捷鍵 | 右鍵選單 | SW ID |
|------|------|------|---------|---------|---------|-------|--------|------|--------|---------|-------|
| 參考幾何 | 插入 > 參考幾何 | 主選單列 | 有開啟的文件 | 有開啟的文件 | 無文件 | bg-[#005B9A] text-white | bg-[#004A7C] text-white | — | — | 無 | SW2010-FEAT-013~016 |
| 零組件 | 插入 > 零組件 | 主選單列 | 在組合件模式中 | 在組合件模式中 | 非組合件模式 | bg-[#005B9A] text-white | bg-[#004A7C] text-white | — | — | 無 | SW2010-ASM-001 |
| 設計表 | 插入 > 設計表 | 主選單列 | 有零件文件 | 有零件文件 | 無零件 | bg-[#005B9A] text-white | bg-[#004A7C] text-white | — | — | 無 | SW2010-PART-005 |
| 塊 | 插入 > 塊 | 主選單列 | 在工程圖模式中 | 在工程圖模式中 | 非工程圖模式 | bg-[#005B9A] text-white | bg-[#004A7C] text-white | — | — | 無 | SW2010-DRW-015 |
| 表格 | 插入 > 表格 | 主選單列 | 在工程圖模式中 | 在工程圖模式中 | 非工程圖模式 | bg-[#005B9A] text-white | bg-[#004A7C] text-white | — | — | 無 | SW2010-DRW-016 |

### 1.5 工具選單

| 項目 | 名稱 | 位置 | 顯示條件 | 啟用條件 | 禁用條件 | hover | active | 錯誤 | 快捷鍵 | 右鍵選單 | SW ID |
|------|------|------|---------|---------|---------|-------|--------|------|--------|---------|-------|
| 材質 | 工具 > 材質 | 主選單列 | 有零件文件 | 有零件文件 | 無零件 | bg-[#005B9A] text-white | bg-[#004A7C] text-white | — | — | 無 | SW2010-PART-001 |
| 質量屬性 | 工具 > 質量屬性 | 主選單列 | 有零件文件 | 有零件文件 | 無零件 | bg-[#005B9A] text-white | bg-[#004A7C] text-white | — | — | 無 | SW2010-PART-002 |
| 方程式 | 工具 > 方程式 | 主選單列 | 有零件文件 | 有零件文件 | 無零件 | bg-[#005B9A] text-white | bg-[#004A7C] text-white | — | — | 無 | SW2010-PART-003 |
| 干涉檢查 | 工具 > 干涉檢查 | 主選單列 | 在組合件中 | 在組合件中且 >= 2 零件 | 零件數 < 2 | bg-[#005B9A] text-white | bg-[#004A7C] text-white | — | — | 無 | SW2010-ASM-009 |

### 1.6 視窗選單

| 項目 | 名稱 | 位置 | 顯示條件 | 啟用條件 | 禁用條件 | hover | active | 錯誤 | 快捷鍵 | 右鍵選單 | SW ID |
|------|------|------|---------|---------|---------|-------|--------|------|--------|---------|-------|
| 排列視窗 | 視窗 > 排列 | 主選單列 | 有多個文件開啟 | 有多個文件開啟 | 單一文件 | bg-[#005B9A] text-white | bg-[#004A7C] text-white | — | — | 無 | SW2010-APP-008 |

---

## 2. CommandManager (Ribbon 工具列)

### 2.1 FEATURES 分頁

| 按鈕 | 功能 | 顯示條件 | 啟用條件 | 禁用條件 | hover | active | 錯誤 | 快捷鍵 | 右鍵選單 | SW ID |
|------|------|---------|---------|---------|-------|--------|------|--------|---------|-------|
| 基座拉伸 | Extrude Boss | 零件模式 | 有有效草圖 | 無草圖或草圖未閉合 | bg-slate-100 border-[#A0A0A0] | bg-white border-[#A0A0A0] shadow-inner | toast 提示 | — | 無 | SW2010-FEAT-001 |
| 切割拉伸 | Extrude Cut | 零件模式 | 有有效草圖 | 無草圖 | bg-slate-100 border-[#A0A0A0] | bg-white border-[#A0A0A0] shadow-inner | toast 提示 | — | 無 | SW2010-FEAT-002 |
| 基座旋轉 | Revolve Boss | 零件模式 | 有有效草圖和旋轉軸 | 無草圖 | bg-slate-100 border-[#A0A0A0] | bg-white border-[#A0A0A0] shadow-inner | toast 提示 | — | 無 | SW2010-FEAT-003 |
| 切割旋轉 | Revolve Cut | 零件模式 | 有有效草圖 | 無草圖 | bg-slate-100 border-[#A0A0A0] | bg-white border-[#A0A0A0] shadow-inner | toast 提示 | — | 無 | SW2010-FEAT-004 |
| 掃描 | Sweep | 零件模式 | 有路徑和剖面草圖 | 缺少路徑或剖面 | bg-slate-100 border-[#A0A0A0] | bg-white border-[#A0A0A0] shadow-inner | toast 提示 | — | 無 | SW2010-FEAT-017 |
| 圓角 | Fillet | 有實體 | 有實體 | 無實體可圓角 | bg-slate-100 border-[#A0A0A0] | bg-white border-[#A0A0A0] shadow-inner | toast 提示 | 無 | SW2010-FEAT-005 |
| 斜角 | Chamfer | 有實體 | 有實體 | 無實體 | bg-slate-100 border-[#A0A0A0] | bg-white border-[#A0A0A0] shadow-inner | toast 提示 | 無 | SW2010-FEAT-006 |
| 抽殼 | Shell | 有實體 | 有實體 | 無實體 | bg-slate-100 border-[#A0A0A0] | bg-white border-[#A0A0A0] shadow-inner | toast 提示 | 無 | SW2010-FEAT-007 |
| 拔模 | Draft | 有實體 | 有實體 | 無實體 | bg-slate-100 border-[#A0A0A0] | bg-white border-[#A0A0A0] shadow-inner | toast 提示 | 無 | SW2010-FEAT-008 |
| 線性陣列 | Linear Pattern | 有特徵 | 有特徵 | 無特徵 | bg-slate-100 border-[#A0A0A0] | bg-white border-[#A0A0A0] shadow-inner | toast 提示 | 無 | SW2010-FEAT-010 |
| 圓形陣列 | Circular Pattern | 有特徵 | 有特徵 | 無特徵 | bg-slate-100 border-[#A0A0A0] | bg-white border-[#A0A0A0] shadow-inner | toast 提示 | 無 | SW2010-FEAT-009 |
| 鏡射特徵 | Mirror Feature | 有特徵 | 有特徵 | 無特徵 | bg-slate-100 border-[#A0A0A0] | bg-white border-[#A0A0A0] shadow-inner | toast 提示 | 無 | SW2010-FEAT-011 |
| 孔精靈 | Hole Wizard | 有表面 | 有表面 | 無表面 | bg-slate-100 border-[#A0A0A0] | bg-white border-[#A0A0A0] shadow-inner | toast 提示 | 無 | SW2010-FEAT-012 |
| 基準面 | Reference Plane | 有開啟的文件 | 有開啟的文件 | 無文件 | bg-slate-100 border-[#A0A0A0] | bg-white border-[#A0A0A0] shadow-inner | — | 無 | SW2010-FEAT-013 |
| 基準軸 | Reference Axis | 有開啟的文件 | 有開啟的文件 | 無文件 | bg-slate-100 border-[#A0A0A0] | bg-white border-[#A0A0A0] shadow-inner | — | 無 | SW2010-FEAT-014 |

### 2.2 SKETCH 分頁

| 按鈕 | 功能 | 顯示條件 | 啟用條件 | 禁用條件 | hover | active | 錯誤 | 快捷鍵 | 右鍵選單 | SW ID |
|------|------|---------|---------|---------|-------|--------|------|--------|---------|-------|
| 直線 | Line | 在草圖模式中 | 在草圖模式中 | 非草圖模式 | bg-slate-100 border-[#A0A0A0] | bg-white border-[#A0A0A0] shadow-inner | — | — | 無 | SW2010-SK-002 |
| 矩形 | Rectangle | 在草圖模式中 | 在草圖模式中 | 非草圖模式 | bg-slate-100 border-[#A0A0A0] | bg-white border-[#A0A0A0] shadow-inner | — | — | 無 | SW2010-SK-003 |
| 圓 | Circle | 在草圖模式中 | 在草圖模式中 | 非草圖模式 | bg-slate-100 border-[#A0A0A0] | bg-white border-[#A0A0A0] shadow-inner | — | — | 無 | SW2010-SK-004 |
| 圓弧 | Arc | 在草圖模式中 | 在草圖模式中 | 非草圖模式 | bg-slate-100 border-[#A0A0A0] | bg-white border-[#A0A0A0] shadow-inner | — | — | 無 | SW2010-SK-005 |
| 樣條曲線 | Spline | 在草圖模式中 | 在草圖模式中 | 非草圖模式 | bg-slate-100 border-[#A0A0A0] | bg-white border-[#A0A0A0] shadow-inner | — | — | 無 | SW2010-SK-007 |
| 智慧尺寸 | Smart Dimension | 在草圖模式中 | 在草圖模式中 | 非草圖模式 | bg-slate-100 border-[#A0A0A0] | bg-white border-[#A0A0A0] shadow-inner | — | — | 無 | SW2010-SK-008 |
| 修剪實體 | Trim | 在草圖模式中 | 在草圖模式中 | 非草圖模式 | bg-slate-100 border-[#A0A0A0] | bg-white border-[#A0A0A0] shadow-inner | — | — | 無 | SW2010-SK-017 |
| 鏡射實體 | Mirror Entity | 在草圖模式中 | 有選取圖元 | 無選取 | bg-slate-100 border-[#A0A0A0] | bg-white border-[#A0A0A0] shadow-inner | — | — | 無 | SW2010-SK-019 |
| 偏移實體 | Offset Entity | 在草圖模式中 | 有選取圖元 | 無選取 | bg-slate-100 border-[#A0A0A0] | bg-white border-[#A0A0A0] shadow-inner | — | — | 無 | SW2010-SK-020 |
| 退出並拉伸 | Exit & Extrude | 在草圖模式中 | 有閉合輪廓 | 無閉合輪廓 | bg-slate-100 border-[#A0A0A0] | bg-white border-[#A0A0A0] shadow-inner | toast 提示 | — | SW2010-FEAT-001 |

### 2.3 ASSEMBLY 分頁

| 按鈕 | 功能 | 顯示條件 | 啟用條件 | 禁用條件 | hover | active | 錯誤 | 快捷鍵 | 右鍵選單 | SW ID |
|------|------|---------|---------|---------|-------|--------|------|--------|---------|-------|
| 插入零組件 | Insert Component | 組合件模式 | 組合件模式 | 非組合件模式 | bg-slate-100 border-[#A0A0A0] | bg-white border-[#A0A0A0] shadow-inner | — | — | 無 | SW2010-ASM-001 |
| 配合 | Mate | 組合件模式 | 組合件模式且有選取 | 選取 < 2 | bg-slate-100 border-[#A0A0A0] | bg-white border-[#A0A0A0] shadow-inner | — | — | 無 | SW2010-ASM-002 |

### 2.4 EVALUATE 分頁

| 按鈕 | 功能 | 顯示條件 | 啟用條件 | 禁用條件 | hover | active | 錯誤 | 快捷鍵 | 右鍵選單 | SW ID |
|------|------|---------|---------|---------|-------|--------|------|--------|---------|-------|
| 測量 | Measure | 有開啟的文件 | 有開啟的文件 | 無文件 | bg-slate-100 border-[#A0A0A0] | bg-white border-[#A0A0A0] shadow-inner | — | — | 無 | SW2010-PART-002 |
| 剖切視圖 | Section View | 有開啟的 3D 文件 | 有開啟的 3D 文件 | 無 3D 文件 | bg-slate-100 border-[#A0A0A0] | bg-white border-[#A0A0A0] shadow-inner | — | — | 無 | SW2010-VIEW-009 |
| 干涉檢查 | Interference Detection | 組合件模式 | 組合件模式且 >= 2 零件 | 零件數 < 2 | bg-slate-100 border-[#A0A0A0] | bg-white border-[#A0A0A0] shadow-inner | toast 提示 | — | SW2010-ASM-009 |
| 質量屬性 | Mass Properties | 有零件 | 有零件 | 無零件 | bg-slate-100 border-[#A0A0A0] | bg-white border-[#A0A0A0] shadow-inner | — | — | 無 | SW2010-PART-002 |
| 方程式 | Equations | 有零件 | 有零件 | 無零件 | bg-slate-100 border-[#A0A0A0] | bg-white border-[#A0A0A0] shadow-inner | — | — | 無 | SW2010-PART-003 |

---

## 3. PropertyManager 面板規格

### 3.1 Sketch Property Manager

| 欄位 | 類型 | 預設值 | 驗證規則 | 顯示條件 | SW ID |
|------|------|--------|---------|---------|-------|
| 定義狀態 | Badge | — | 藍色=欠定義, 紅色=過定義, 深綠=完全定義 | 在草圖模式中 | SW2010-SK-021 |
| 智慧關係 | Dropdown | — | 選擇關係類型 | 有選取圖元 | SW2010-SK-009~016 |
| 鏡射軸線 | SelectionBox | — | 必須選取中心線 | 點擊鏡射按鈕 | SW2010-SK-019 |
| 線性陣列方向 | SelectionBox | — | 必須選取參考 | 點擊線性陣列按鈕 | SW2010-SK-020 |
| 陣列數量 | Number Input | 2 | >= 2, <= 10000 | 陣列設定展開時 | SW2010-SK-020 |
| 陣列間距 | Number Input | 10.0 mm | > 0 | 線性陣列設定展開時 | SW2010-SK-020 |
| 陣列角度 | Number Input | 360° | 0 < angle <= 360 | 圓形陣列設定展開時 | SW2010-SK-020 |
| 自動定義 | Button | — | — | 欠定義狀態時 | SW2010-SK-021 |

### 3.2 Part Feature Property Manager

| 欄位 | 類型 | 預設值 | 驗證規則 | 顯示條件 | SW ID |
|------|------|--------|---------|---------|-------|
| 方向 1 深度 | ParamInput | 25.0 mm | > 0 | Extrude/Revolve 展開時 | SW2010-FEAT-001~004 |
| 方向 2 深度 | ParamInput | 25.0 mm | > 0 | 雙向拉伸時 | SW2010-FEAT-001~004 |
| 拔模角度 | ParamInput | 0° | — | 拔模選項展開時 | SW2010-FEAT-008 |
| 圓角半徑 | ParamInput | 1.0 mm | > 0 | Fillet 展開時 | SW2010-FEAT-005 |
| 選取邊線 | SelectionBox | — | 至少選取 1 條邊 | Fillet/Chamfer 展開時 | SW2010-FEAT-005~006 |
| 殼體厚度 | ParamInput | 1.0 mm | > 0 | Shell 展開時 | SW2010-FEAT-007 |
| 陣列方向 | SelectionBox | — | 必須選取參考 | Pattern 展開時 | SW2010-FEAT-009~010 |
| 孔類型 | Dropdown | Simple | — | Hole Wizard 展開時 | SW2010-FEAT-012 |
| 孔規格 | Dropdown | M3×0.5 | — | Hole Wizard 展開時 | SW2010-FEAT-012 |
| OK 按鈕 | Button | — | — | 所有 PropertyManager | — |
| Cancel 按鈕 | Button | — | — | 所有 PropertyManager | — |

### 3.3 Mate Property Manager

| 欄位 | 類型 | 預設值 | 驗證規則 | 顯示條件 | SW ID |
|------|------|--------|---------|---------|-------|
| 對齊方式 | Radio Group | 對齊 | — | 所有配合 | SW2010-ASM-006 |
| 距離偏移 | ParamInput | 0.0 mm | — | 距離配合時 | SW2010-ASM-004 |
| 角度偏移 | ParamInput | 0° | — | 角度配合時 | SW2010-ASM-003 |
| 齒輪比 | Number Input | 1 | > 0 | 齒輪配合時 | SW2010-ASM-002 |
| 螺距 | ParamInput | 1.0 mm | > 0 | 螺紋配合時 | SW2010-ASM-002 |
| 選取 1 | SelectionBox | — | 必須選取 1 個圖元 | 配合命令啟動時 | SW2010-ASM-002 |
| 選取 2 | SelectionBox | — | 必須選取 1 個圖元 | 配合命令啟動時 | SW2010-ASM-002 |

### 3.4 Section View Property Manager

| 欄位 | 類型 | 預設值 | 驗證規則 | 顯示條件 | SW ID |
|------|------|--------|---------|---------|-------|
| 剖切平面 | Button Group | FRONT | — | 剖切視圖激活時 | SW2010-VIEW-009 |
| 偏移量 | Slider + Input | 0.0 mm | -100 ~ +100 | 剖切視圖激活時 | SW2010-VIEW-009 |
| 翻轉方向 | Checkbox | false | — | 剖切視圖激活時 | SW2010-VIEW-009 |

### 3.5 Configuration Manager Panel

| 欄位 | 類型 | 預設值 | 驗證規則 | 顯示條件 | SW ID |
|------|------|--------|---------|---------|-------|
| 配置名稱 | Text Input | — | 唯一, 不可為空 | 新增配置時 | SW2010-PART-004 |
| 預設配置 | Label | 'default' | 不可刪除 | 配置列表 | SW2010-PART-004 |
| 特徵抑制 | Checkbox Grid | — | — | 配置選中時 | SW2010-PART-004 |

---

## 4. FeatureManager Design Tree 規格

| 節點類型 | 圖示 | 可展開 | 右鍵選單 | 雙擊行為 | 拖曳 | SW ID |
|---------|------|--------|---------|---------|------|-------|
| 零件名稱 | 📄 | 是 | 編輯名稱, 抑制, 刪除 | 進入編輯 | 否 | SW2010-UI-003 |
| 配置節點 | ⚙️ | 是 | 新增, 刪除, 設為預設 | — | 否 | SW2010-UI-005 |
| 參考幾何節點 | 📐 | 是 | 新增參考 | — | 否 | SW2010-FEAT-013~016 |
| 草圖節點 | ✏️ | 是 | 編輯草圖, 顯示/隱藏, 刪除 | 進入草圖模式 | 否 | SW2010-SK-001 |
| 特徵節點 | 🔧 | 否 | 編輯特徵, 抑制, 刪除, 正常化 | 進入編輯 | 是 (重排序) | SW2010-FEAT-* |
| 基準面 | ▯ | 否 | 刪除 | — | 否 | SW2010-FEAT-013 |
| 基準軸 | ┃ | 否 | 刪除 | — | 否 | SW2010-FEAT-014 |
| 基準點 | · | 否 | 刪除 | — | 否 | SW2010-FEAT-015 |
| Rollback 欄 | 🟢 | — | — | 拖曳位置決定重建點 | 是 | SW2010-ERR-003 |

---

## 5. Heads-up View Toolbar 規格

| 按鈕 | 功能 | 位置 | 顯示條件 | 啟用條件 | 快捷鍵 | SW ID |
|------|------|------|---------|---------|--------|-------|
| 前視 | Set front view | 工具列左側 | 3D 視圖 | 有開啟的 3D 文件 | F | SW2010-VIEW-004 |
| 上視 | Set top view | 工具列左側 | 3D 視圖 | 有開啟的 3D 文件 | T | SW2010-VIEW-004 |
| 右視 | Set right view | 工具列左側 | 3D 視圖 | 有開啟的 3D 文件 | R | SW2010-VIEW-004 |
| 等距 | Set isometric | 工具列左側 | 3D 視圖 | 有開啟的 3D 文件 | I | SW2010-VIEW-004 |
| 縮放到適中 | Zoom to Fit | 工具列右側 | 3D 視圖 | 有開啟的 3D 文件 | — | SW2010-VIEW-003 |
| 顯示樣式 | Cycle display style | 工具列右側 | 3D 視圖 | 有開啟的 3D 文件 | — | SW2010-VIEW-005 |
| 剖切視圖 | Toggle section view | 工具列右側 | 3D 視圖 | 有開啟的 3D 文件 | — | SW2010-VIEW-009 |
| 隱藏/顯示項目 | Toggle visibility | 工具列右側 | 3D 視圖 | 有開啟的 3D 文件 | — | SW2010-VIEW-010 |

---

## 6. 狀態列 (Status Bar) 規格

| 區域 | 顯示內容 | 更新時機 | 格式 | SW ID |
|------|---------|---------|------|-------|
| 左側提示 | 目前操作提示 / 狀態 | 選取變化、模式切換 | 文字 | SW2010-UI-008 |
| 草圖定義狀態 | Empty / Under Defined / Fully Defined / Over Defined | 草圖變化時 | 彩色 Badge | SW2010-SK-021 |
| 座標顯示 (3D) | X: 0.000 Y: 0.000 Z: 0.000 | 滑鼠移動時 | 3 位小數 | SW2010-UI-008 |
| 座標顯示 (Sketch) | U: 0.000 V: 0.000 | 滑鼠移動時 | 3 位小數 | SW2010-UI-008 |
| 單位系統 | MMGS (毫米、克、秒) | 永不改變 | 文字 | SW2010-UI-008 |
| 大組件模式警告 | ⚠️ Large Assembly Mode | 零件數 > 閾值 | 橘色 Badge | — |

---

## 7. 右鍵選單 (Context Menu) 規格

### 7.1 3D 模式右鍵選單

| 項目 | 功能 | 啟用條件 | 快捷鍵顯示 | SW ID |
|------|------|---------|-----------|-------|
| 編輯特徵 | 打開 PropertyManager 編輯 | 選取特徵 | — | SW2010-ERR-002 |
| 抑制 | 暫時停用特徵 | 選取特徵 | — | SW2010-ERR-004 |
| 解除抑制 | 恢復特徵 | 選取抑制的特徵 | — | SW2010-ERR-004 |
| 正常化 | Camera Normal To | 有表面選取 | — | — |
| 刪除 | 刪除選取項目 | 有可刪除項目 | Del | SW2010-ERR-001 |
| 外觀 | 打開材質選擇器 | 有表面/實體選取 | — | SW2010-PART-001 |
| 縮小到選取 | Zoom to Selection | 有選取 | — | SW2010-SEL-001 |

### 7.2 草圖模式右鍵選單

| 項目 | 功能 | 啟用條件 | 快捷鍵顯示 | SW ID |
|------|------|---------|-----------|-------|
| 選取工具 | 切換回選取模式 | 在草圖模式中 | Esc | SW2010-SEL-001 |
| 結束鏈結 | End Chain | 正在繪製鏈結時 | — | — |
| 構造幾何 | 切換為構造線 | 有選取圖元 | — | — |
| 正常化 | Camera Normal To | 有表面選取 | — | SW2010-SK-001 |
| 退出草圖 | Exit Sketch | 在草圖模式中 | — | SW2010-SK-001 |

---

## 8. 快捷鍵總覽

| 快捷鍵 | 功能 | 作用域 | 實作狀態 | SW ID |
|--------|------|--------|---------|-------|
| Ctrl+N | 新增文件 | 全域 | 僅顯示 | SW2010-APP-001~003 |
| Ctrl+O | 開啟文件 | 全域 | 僅顯示 | SW2010-APP-004 |
| Ctrl+S | 儲存文件 | 全域 | 僅顯示 | SW2010-APP-005 |
| Ctrl+E | 匯出文件 | 全域 | 僅顯示 | — |
| Ctrl+Z | 復原 | 全域 | 已實作 | SW2010-ERR-005 |
| Ctrl+Y | 重做 | 全域 | 已實作 | SW2010-ERR-005 |
| Del | 刪除選取 | 全域 | 已實作 | SW2010-SEL-001 |
| Esc | 取消/退出 | 全域 | 已實作 | SW2010-SEL-001 |
| F | 前視 | 3D 視圖 | 僅顯示 | SW2010-VIEW-004 |
| T | 上視 | 3D 視圖 | 僅顯示 | SW2010-VIEW-004 |
| R | 右視 | 3D 視圖 | 僅顯示 | SW2010-VIEW-004 |
| I | 等距 | 3D 視圖 | 僅顯示 | SW2010-VIEW-004 |
| N | 法線視角 | 3D 視圖 | 僅顯示 | SW2010-VIEW-004 |
| D | 移動確認角落 | 草圖模式 | 已實作 | — |

---

## 9. UI 元素完整性檢查

| UI 類別 | SolidWorks 2010 要求 | 3D-Builder 現況 | 缺口 |
|---------|---------------------|----------------|------|
| 主選單列 | 完整 7 個選單 | TopMenu.tsx 實作 | 最近使用文件未實作 |
| CommandManager | 6 個分頁 | RibbonController 實作 5 個分頁 | SURFACING 分頁需強化 |
| FeatureManager | 完整樹狀結構 | FeatureManagerPanel.tsx | 需加強節點圖示一致性 |
| PropertyManager | 動態面板 | 多個 PM 組件 | 設計表 (SW2010-PART-005) 未實作 |
| ConfigurationManager | 配置管理 | ConfigurationManagerPanel.tsx | 已實作 |
| Task Pane | 設計中心/內容庫 | DesignLibraryPanel.tsx | 僅部分實作 |
| Heads-up Toolbar | 完整工具列 | HeadsUpToolbar.tsx | 已實作 |
| 狀態列 | 完整狀態顯示 | StatusBar.tsx | 已實作 |
| 右鍵選單 | 上下文敏感 | ContextMenu.tsx | 已實作 |
| 快捷鍵 | 完整映射 | ShortcutBox.tsx + TopMenu | 多數僅顯示未綁定 |

---

## 版本歷史

| 版本 | 日期 | 變更 | 作者 |
|------|------|------|------|
| 1.0 | 2026-06-15 | 初始版本 | 開發 Agent |
