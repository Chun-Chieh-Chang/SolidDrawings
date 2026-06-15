# SolidWorks 2010 中文使用說明手冊 — 來源映射 (Source Map)

> 本文檔將 SolidWorks 2010 中文使用說明手冊的章節結構映射為可執行的開發 backlog。
> 建立者：開發 Agent
> 最後更新：2026-06-15
> 基準來源：[SolidWorks 2010 中文使用說明手冊](https://help.solidworks.com/2010/chinese/SolidWorks/help_list.htm?id=0)

## 映射規則

- 每個手冊章節都必須有對應的開發功能 ID。
- 每個功能 ID 格式：`SW2010-{area}-{seq}`。
- 功能區域代碼：
  - `APP`：應用程式框架
  - `UI`：主要 UI
  - `SK`：草圖 Sketch
  - `FEAT`：特徵 Features
  - `PART`：零件 Part
  - `ASM`：組合件 Assembly
  - `DRW`：工程圖 Drawing
  - `VIEW`：視圖與顯示
  - `SEL`：選取與互動
  - `ERR`：錯誤與狀態

## 章節索引

### 1. 應用程式框架 (APP)

| ID | 章節標題 | URL | 功能描述 | 關聯 UI | 互動類型 |
|----|---------|-----|---------|---------|---------|
| SW2010-APP-001 | 新增零件文件 | /app/new-part | 建立新的零件文件 | 檔案 > 新增、新文件按鈕 | 命令 |
| SW2010-APP-002 | 新增組合件文件 | /app/new-assembly | 建立新的組合件文件 | 檔案 > 新增、新組合件按鈕 | 命令 |
| SW2010-APP-003 | 新增工程圖文件 | /app/new-drawing | 建立新的工程圖文件 | 檔案 > 新增、新工程圖按鈕 | 命令 |
| SW2010-APP-004 | 開啟文件 | /app/open | 開啟已有的零件、組合件或工程圖文件 | 檔案 > 開啟 | 命令 |
| SW2010-APP-005 | 儲存文件 | /app/save | 儲存目前文件 | 檔案 > 儲存、儲存按鈕 | 命令 |
| SW2010-APP-006 | 另存新檔 | /app/save-as | 以不同名稱或格式儲存文件 | 檔案 > 另存新檔 | 命令 |
| SW2010-APP-007 | 最近使用文件 | /app/recent-files | 顯示最近使用的文件清單 | 檔案 > 最近使用 | 導航 |
| SW2010-APP-008 | 文件視窗管理 | /app/window-management | 排列、切換文件視窗 | 視窗選單 | 命令 |

### 2. 主要 UI (UI)

| ID | 章節標題 | URL | 功能描述 | 關聯 UI | 互動類型 |
|----|---------|-----|---------|---------|---------|
| SW2010-UI-001 | 主選單列 | /ui/menu-bar | 檔案、編輯、檢視、插入等選單 | 主選單列 | 導航 |
| SW2010-UI-002 | CommandManager | /ui/commandmanager | 功能分頁的工具列 | CommandManager 分頁 | 工具列 |
| SW2010-UI-003 | FeatureManager 設計樹 | /ui/feature-tree | 顯示特徵、配置、參考幾何的樹狀結構 | 左側面板 | 樹狀結構 |
| SW2010-UI-004 | PropertyManager | /ui/propertymanager | 屬性管理器面板（對話框式參數設定） | 左側或浮動面板 | 對話框 |
| SW2010-UI-005 | ConfigurationManager | /ui/configuration-manager | 配置管理（新增、編輯、切換配置） | ConfigurationManager 面板 | 對話框 |
| SW2010-UI-006 | Task Pane | /ui/task-pane | 任務窗格（設計中心、內容庫、檔案視覽器） | 右側面板 | 面板 |
| SW2010-UI-007 | Heads-up 檢視工具列 | /ui/heads-up-toolbar | 視圖控制工具列（前、後、左、右、上、下、等距） | 3D 視圖上方 | 工具列 |
| SW2010-UI-008 | 狀態列 | /ui/status-bar | 顯示目前狀態、選取資訊、提示 | 視窗底部 | 狀態顯示 |
| SW2010-UI-009 | 右鍵選單 | /ui/context-menu | 右鍵快顯選單（依上下文變化） | 右鍵點擊 | 快顯選單 |
| SW2010-UI-010 | 快捷鍵 | /ui/shortcuts | 常用操作的鍵盤快捷鍵 | 鍵盤 | 快捷鍵 |

### 3. 草圖 Sketch (SK)

| ID | 章節標題 | URL | 功能描述 | 關聯 UI | 互動類型 |
|----|---------|-----|---------|---------|---------|
| SW2010-SK-001 | 選擇草圖平面 | /sketch/plane-select | 選擇基準面或平面作為草圖繪製平面 | FeatureManager、3D 視圖 | 選取 |
| SW2010-SK-002 | 直線 | /sketch/line | 繪製直線段 | CommandManager > 草圖圖元 | 繪圖 |
| SW2010-SK-003 | 矩形 | /sketch/rectangle | 繪製矩形（中心到角、角到角） | CommandManager > 草圖圖元 | 繪圖 |
| SW2010-SK-004 | 圓 | /sketch/circle | 繪製圓（中心半徑、兩點、三分鐘） | CommandManager > 草圖圖元 | 繪圖 |
| SW2010-SK-005 | 圓弧 | /sketch/arc | 繪製圓弧（切線弧、順暢順弧） | CommandManager > 草圖圖元 | 繪圖 |
| SW2010-SK-006 | 多邊形 | /sketch/polygon | 繪製正多邊形 | CommandManager > 草圖圖元 | 繪圖 |
| SW2010-SK-007 | 樣條曲線 | /sketch/spline | 繪製自由形式樣條曲線 | CommandManager > 草圖圖元 | 繪圖 |
| SW2010-SK-008 | 智慧尺寸 | /sketch/smart-dimension | 標註尺寸（線性、徑向、角度） | CommandManager > 尺寸 | 標註 |
| SW2010-SK-009 | 水平關係 | /sketch/rel-horizontal | 設定圖元為水平 | 選取 + 智慧關係 | 關係 |
| SW2010-SK-010 | 垂直關係 | /sketch/rel-vertical | 設定圖元為垂直 | 選取 + 智慧關係 | 關係 |
| SW2010-SK-011 | 共線關係 | /sketch/rel-colinear | 設定圖元共線 | 選取 + 智慧關係 | 關係 |
| SW2010-SK-012 | 相切關係 | /sketch/rel-tangent | 設定圖元相切 | 選取 + 智慧關係 | 關係 |
| SW2010-SK-013 | 同心關係 | /sketch/rel-concentric | 設定圓弧/圓同心 | 選取 + 智慧關係 | 關係 |
| SW2010-SK-014 | 點在线上關係 | /sketch/rel-point-on-line | 設定點在线上 | 選取 + 智慧關係 | 關係 |
| SW2010-SK-015 | 中點關係 | /sketch/rel-midpoint | 設定圖元中點到另一圖元 | 選取 + 智慧關係 | 關係 |
| SW2010-SK-016 | 固定關係 | /sketch/rel-fixed | 固定圖元位置 | 選取 + 智慧關係 | 關係 |
| SW2010-SK-017 | 修剪實體 | /sketch/trim | 修剪超出或不足的圖元 | CommandManager > 草圖工具 | 編輯 |
| SW2010-SK-018 | 延伸實體 | /sketch/extend | 延伸圖元到目標 | CommandManager > 草圖工具 | 編輯 |
| SW2010-SK-019 | 鏡射實體 | /sketch/mirror-entity | 鏡射草圖圖元 | CommandManager > 草圖工具 | 編輯 |
| SW2010-SK-020 | 偏移實體 | /sketch/offet-entity | 偏移草圖圖元 | CommandManager > 草圖工具 | 編輯 |
| SW2010-SK-021 | 草圖狀態顯示 | /sketch/state | 完全定義、欠定義、過定義 | 狀態列、FeatureManager | 狀態顯示 |

### 4. 特徵 Features (FEAT)

| ID | 章節標題 | URL | 功能描述 | 關聯 UI | 互動類型 |
|----|---------|-----|---------|---------|---------|
| SW2010-FEAT-001 | 基座拉伸 | /feat/extrude-boss | 拉伸草圖作為實體基座 | CommandManager > 特徵 | 命令 |
| SW2010-FEAT-002 | 切割拉伸 | /feat/extrude-cut | 拉伸草圖切除材料 | CommandManager > 特徵 | 命令 |
| SW2010-FEAT-003 | 基座旋轉 | /feat/revolve-boss | 旋轉草圖作為實體基座 | CommandManager > 特徵 | 命令 |
| SW2010-FEAT-004 | 切割旋轉 | /feat/revolve-cut | 旋轉草圖切除材料 | CommandManager > 特徵 | 命令 |
| SW2010-FEAT-005 | 圓角 | /feat/fillet | 添加圓角邊緣 | CommandManager > 特徵 | 命令 |
| SW2010-FEAT-006 | 斜角 | /feat/chamfer | 添加斜角邊緣 | CommandManager > 特徵 | 命令 |
| SW2010-FEAT-007 | 抽殼 | /feat/shell | 薄壁抽殼 | CommandManager > 特徵 | 命令 |
| SW2010-FEAT-008 | 拔模 | /feat/draft | 添加拔模斜度 | CommandManager > 特徵 | 命令 |
| SW2010-FEAT-009 | 圓形陣列 | /feat/circular-pattern | 沿圓周陣列特徵 | CommandManager > 特徵 | 命令 |
| SW2010-FEAT-010 | 線性陣列 | /feat/linear-pattern | 沿直線陣列特徵 | CommandManager > 特徵 | 命令 |
| SW2010-FEAT-011 | 鏡射特徵 | /feat/mirror-feature | 鏡射特徵 | CommandManager > 特徵 | 命令 |
| SW2010-FEAT-012 | 孔精靈 | /feat/hole-wizard | 創建標準孔 | CommandManager > 特徵 | 命令 |
| SW2010-FEAT-013 | 基準面 | /feat/reference-plane | 創建額外的基準面 | 插入 > 參考幾何 | 參考 |
| SW2010-FEAT-014 | 基準軸 | /feat/reference-axis | 創建額外的基準軸 | 插入 > 參考幾何 | 參考 |
| SW2010-FEAT-015 | 基準點 | /feat/reference-point | 創建額外的基準點 | 插入 > 參考幾何 | 參考 |
| SW2010-FEAT-016 |  coordinate system | /feat/reference-coord | 創建坐標系 | 插入 > 參考幾何 | 參考 |
| SW2010-FEAT-017 | 掃描 | /feat/sweep | 沿路徑掃描剖面 | CommandManager > 特徵 | 命令 |
| SW2010-FEAT-018 | 包覆 | /feat/decal | 將圖像貼到表面 | CommandManager > 特徵 | 命令 |
| SW2010-FEAT-019 | 異型孔向导 | /feat/hole-profile | 使用異型孔庫創建孔 | CommandManager > 特徵 | 命令 |

### 5. 零件 Part (PART)

| ID | 章節標題 | URL | 功能描述 | 關聯 UI | 互動類型 |
|----|---------|-----|---------|---------|---------|
| SW2010-PART-001 | 材質 | /part/material | 設定零件材質屬性 | 工具 > 材質 | 屬性 |
| SW2010-PART-002 | 質量屬性 | /part/mass-properties | 計算質量、體積、表面積等 | 工具 > 質量屬性 | 對話框 |
| SW2010-PART-003 | 方程式 | /part/equations | 使用方程式驅動尺寸 | 工具 > 方程式 | 對話框 |
| SW2010-PART-004 | 配置 | /part/configurations | 管理零件的多個配置 | ConfigurationManager | 對話框 |
| SW2010-PART-005 | 設計表 | /part/design-table | 使用 Excel 設計表驅動配置 | 插入 > 設計表 | 對話框 |

### 6. 組合件 Assembly (ASM)

| ID | 章節標題 | URL | 功能描述 | 關聯 UI | 互動類型 |
|----|---------|-----|---------|---------|---------|
| SW2010-ASM-001 | 插入零組件 | /asm/insert-component | 將零件插入組合件中 | 插入 > 零組件 | 命令 |
| SW2010-ASM-002 | 標準配合 | /asm/mate-standard | 添加同心、重合等標準配合 | 配合命令 | 命令 |
| SW2010-ASM-003 | 角度配合 | /asm/mate-angle | 添加角度配合 | 配合命令 | 命令 |
| SW2010-ASM-004 | 距離配合 | /asm/mate-distance | 添加距離配合 | 配合命令 | 命令 |
| SW2010-ASM-005 | 鎖定的距離/角度 | /asm/mate-locked | 鎖定距離或角度 | 配合命令 | 命令 |
| SW2010-ASM-006 | 對齊/同向 | /asm/mate-align | 選擇對齊或同向 | 配合命令 | 命令 |
| SW2010-ASM-007 | 移動/旋轉零組件 | /asm/move-rotate | 手動移動或旋轉零組件 | 編輯 > 移動/旋轉 | 命令 |
| SW2010-ASM-008 | 爆炸視圖 | /asm/explode | 創建爆炸視圖 | 爆炸視圖命令 | 命令 |
| SW2010-ASM-009 | 干涉檢查 | /asm/interference-check | 檢查零組件之間的干涉 | 工具 > 干涉檢查 | 對話框 |
| SW2010-ASM-010 | 組合件樹狀結構 | /asm/assembly-tree | 組合件中的 FeatureManager 樹 | FeatureManager | 樹狀結構 |
| SW2010-ASM-011 | 自動工程圖 | /asm/auto-drawing | 從組合件建立工程圖 | 檔案 > 新增工程圖 | 命令 |

### 7. 工程圖 Drawing (DRW)

| ID | 章節標題 | URL | 功能描述 | 關聯 UI | 互動類型 |
|----|---------|-----|---------|---------|---------|
| SW2010-DRW-001 | 標準視圖 | /drw/standard-views | 創建前視、右視、上視等標準視圖 | 標準視圖工具列 | 命令 |
| SW2010-DRW-002 | 投影視圖 | /drw/aligned-view | 創建投影視圖 | 投影視圖工具 | 命令 |
| SW2010-DRW-003 | 輔助視圖 | /drw/auxiliary-view | 創建輔助視圖 | 輔助視圖工具 | 命令 |
| SW2010-DRW-004 | 剖面視圖 | /drw/section-view | 創建剖面視圖 | 剖面視圖工具 | 命令 |
| SW2010-DRW-005 | 詳細視圖 | /drw/detail-view | 創建詳細視圖 | 詳細視圖工具 | 命令 |
| SW2010-DRW-006 | 斷裂視圖 | /drw/broken-out-view | 創建斷裂視圖 | 斷裂視圖工具 | 命令 |
| SW2010-DRW-007 | 線性尺寸 | /drw/linear-dim | 標註線性尺寸 | 智慧尺寸工具 | 標註 |
| SW2010-DRW-008 | 徑向尺寸 | /drw/diametric-dim | 標註徑向/直徑尺寸 | 智慧尺寸工具 | 標註 |
| SW2010-DRW-009 | 角度尺寸 | /drw/angular-dim | 標註角度尺寸 | 智慧尺寸工具 | 標註 |
| SW2010-DRW-010 | 註解 | /drw/annotation | 添加文字註解 | 註解工具列 | 命令 |
| SW2010-DRW-011 | 中心線 | /drw/centerline | 添加中心線 | 中心線工具 | 命令 |
| SW2010-DRW-012 | 表面粗糙度 | /drw/surface-finish | 添加表面粗糙度符號 | 表面粗糙度工具 | 命令 |
| SW2010-DRW-013 | 焊接符號 | /drw/weld-symbol | 添加焊接符號 | 焊接符號工具 | 命令 |
| SW2010-DRW-014 | 基準目標 | /drw/target | 添加基準目標符號 | 基準目標工具 | 命令 |
| SW2010-DRW-015 | 塊 | /drw/block | 創建和使用塊 | 插入 > 塊 | 命令 |
| SW2010-DRW-016 | 表格 | /drw/table | 添加 BOM 表或其他表格 | 插入 > 表格 | 命令 |
| SW2010-DRW-017 | 圖紙格式 | /drw/sheet-format | 設置圖紙大小和格式 | 格式工具列 | 命令 |
| SW2010-DRW-018 | 圖紙屬性 | /drw/sheet-properties | 設置圖紙屬性 | 屬性面板 | 對話框 |

### 8. 視圖與顯示 (VIEW)

| ID | 章節標題 | URL | 功能描述 | 關聯 UI | 互動類型 |
|----|---------|-----|---------|---------|---------|
| SW2010-VIEW-001 | 旋轉視圖 | /view/rotate | 旋轉 3D 視圖 | 滑鼠滾輪 + 拖曳、Heads-up | 互動 |
| SW2010-VIEW-002 | 平移視圖 | /view/pan | 平移視圖 | 滑鼠中鍵拖曳、Heads-up | 互動 |
| SW2010-VIEW-003 | 縮放視圖 | /view/zoom | 縮放視圖 | 滑鼠滾輪、Heads-up | 互動 |
| SW2010-VIEW-004 | 標準視角 | /view/standard-views | 前視、右視、上視、等距等 | Heads-up、檢視方向面板 | 命令 |
| SW2010-VIEW-005 | 顯示樣式 | /view/display-style | 線框、著色、帶邊緣著色等 | Heads-up 顯示樣式 | 命令 |
| SW2010-VIEW-006 | 隱藏實體 | /view/hide | 隱藏選取的實體或圖元 | 右鍵選單、Heads-up | 命令 |
| SW2010-VIEW-007 | 顯示隱藏實體 | /view/show-hidden | 重新顯示隱藏的實體 | 檢視 > 顯示隱藏 | 命令 |
| SW2010-VIEW-008 | 隱藏/顯示樹狀節點 | /view/tree-hide | 在樹狀結構中隱藏節點 | FeatureManager 右鍵 | 命令 |
| SW2010-VIEW-009 | 剖切視圖 | /view/slice | 使用剖切視圖查看內部 | Heads-up 剖切 | 命令 |
| SW2010-VIEW-010 | 顯示/隱藏項目 | /view/toggle | 顯示/隱藏各個 UI 元素 | 檢視選單 | 命令 |

### 9. 選取與互動 (SEL)

| ID | 章節標題 | URL | 功能描述 | 關聯 UI | 互動類型 |
|----|---------|-----|---------|---------|---------|
| SW2010-SEL-001 | 單選 | /sel/single | 選取單一圖元 | 滑鼠左鍵點擊 | 選取 |
| SW2010-SEL-002 | 多選 | /sel/multi | 按住 Ctrl 選取多個圖元 | Ctrl + 點擊 | 選取 |
| SW2010-SEL-003 | 框選 | /sel/box-select | 拖曳方框選取範圍內的圖元 | 拖曳 | 選取 |
| SW2010-SEL-004 | 預選高亮 | /sel/preview-highlight | 游標懸停時高亮顯示圖元 | 游標移動 | 預覽 |
| SW2010-SEL-005 | 選取過濾器 | /sel/filter | 過濾可選取的圖元類型 | 選取過濾器下拉選單 | 過濾 |
| SW2010-SEL-006 | 選取列錶 | /sel/selection-list | 查看和管理目前的選取列錶 | 選取管理器 | 列錶 |
| SW2010-SEL-007 | 滑鼠手势 | /sel/gestures | 滑鼠右鍵手勢選單 | 右鍵按住拖曳 | 手势 |

### 10. 錯誤與狀態 (ERR)

| ID | 章節標題 | URL | 功能描述 | 關聯 UI | 互動類型 |
|----|---------|-----|---------|---------|---------|
| SW2010-ERR-001 | 無效操作提示 | /err/invalid-action | 當操作無效時顯示提示 | 訊息方塊 | 提示 |
| SW2010-ERR-002 | 重建錯誤 | /err/rebuild-error | 特徵重建失敗時的錯誤 | FeatureManager 錯誤圖示 | 錯誤 |
| SW2010-ERR-003 | Feature Rollback | /err/rollback | 在特徵樹中回滾到指定特徵 | FeatureManager 拖曳 | 操作 |
| SW2010-ERR-004 | 抑制/解除抑制 | /err/suppress | 暫時停用/恢復特徵 | FeatureManager 右鍵 | 命令 |
| SW2010-ERR-005 | 復原/重做 | /err/undo-redo | 撤銷/重做操作 | 編輯 > 復原/重做 | 命令 |
| SW2010-ERR-006 | 草圖求解錯誤 | /err/sketch-solver | 草圖無法求解時的錯誤提示 | 狀態列、訊息方塊 | 錯誤 |
| SW2010-ERR-007 | 過定義提示 | /err/over-defined | 提示草圖過定義 | 狀態列、草圖圖元顏色 | 狀態 |
| SW2010-ERR-008 | 欠定義提示 | /err/under-defined | 提示草圖欠定義 | 狀態列、草圖圖元顏色 | 狀態 |

## 統計

- 總功能數：94
- 應用程式框架：8
- 主要 UI：10
- 草圖：21
- 特徵：19
- 零件：5
- 組合件：11
- 工程圖：18
- 視圖與顯示：10
- 選取與互動：7
- 錯誤與狀態：8

## 版本歷史

| 版本 | 日期 | 變更 | 作者 |
|------|------|------|------|
| 1.0 | 2026-06-15 | 初始版本 | 開發 Agent |
