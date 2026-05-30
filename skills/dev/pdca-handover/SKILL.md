# PDCA Handover Protocol (專案 DNA 與交接紀律)

> **Skill Type:** Process / Workflow Enforcer
> **Target:** System Orchestration, Session Resumption, Task Completion, SolidWorks Parity Auditing

## Description
此技能為 3D-Builder 專案的最高行動準則與「專案 DNA」。它定義了任何 AI Agent 接手開發時的標準啟動流程 (Session Start)、開發迴圈 (Strict PDCA)，以及任務結束與環境清理 (End-of-day / MECE) 的完整生命週期。

任何新會話、新任務，或準備提交代碼前，都**必須**觸發並遵循此流程。

## 📜 執行紀律 (Execution Protocol)

### 1. 啟動與接手 (Session Resume)
當開啟新對話或接手開發時，強制執行以下步驟：
- 必須主動讀取 `handover_resume_guide.md` 與 `DEV_LOG.md` (特別是最新日誌)，以建立完整的 Context。
- 根據文件確認當前的里程碑進度與下一個待辦事項 (Next Actions)。

### 2. 嚴格的 PDCA 迴圈 (Strict PDCA Cycle)
每一次的代碼開發或修訂，都必須貫徹此防迴歸迴圈：
- **[P] Plan (計畫)**：動作前，必須確認目標已經清晰擬定。
- **[D] Do (執行)**：進行代碼開發或系統修訂。
- **[C] Check (查核)**：回頭比對「實際結果」與「原始計畫(P)」是否一致 (例如：執行 `npx tsc --noEmit`、運行測試、確認無 Error)。
- **[A] Act (處置/RCA & CAPA)**：
  - 若查核不符合：必須執行結構化的 **RCA (Root Cause Analysis)** 與 **CAPA (Corrective and Preventive Actions)**，記錄於 `DEV_LOG.md`。
  - **遞迴驗證**：若執行 CAPA 後查核仍失敗，代表 RCA/CAPA 無效。必須**重新分析、再次查核**，不斷循環往復，**直到結果與計畫完全達成一致為止**，絕不妥協。

### 3. SolidWorks 對標稽核 (Parity Benchmarking)
在規劃新任務或檢視開發進度時，必須主動引入「SolidWorks 視角」：
- **UI/UX 邏輯**：操作介面與使用邏輯是否已經完全對標 SolidWorks？有無任何缺件？
- **全端連通性**：前端介面與後端 B-Rep 幾何引擎是否都有打通？
- **特徵覆蓋率**：SolidWorks 所有的基礎交互、草圖工具，及 3D 特徵建構功能，本專案是否都已具備？若有落差，應將其排入開發計畫。

### 4. 任務終結與環境清理 (End-of-Day / MECE Cleanup)
在完成一個大階段或準備結束當日工作時，必須執行：
- **MECE 整理 (Mutually Exclusive, Collectively Exhaustive)**：識別並清除過時、冗餘或無效的檔案。確保架構清晰無重複。
- **交接更新**：每完成一個任務，必須建立或更新續寫文檔 (`handover_resume_guide.md`) 與開發文檔 (`DEV_LOG.md`)，讓別的帳號或工具在讀取該文檔後能夠無縫接手開發。
- **基準點建立**：確保 TypeScript 檢查無誤、系統可運行，並建立 Git 提交 (Commit)，準備推送至 Github 倉庫，作為本專案階段性的終結。