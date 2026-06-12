# Execution Assurance Protocol (執行防偏離協定)

> **目的**：確保 3D-Builder 專案在執行長期的《持續改進執行計畫 (Continuous Improvement Plan)》時，Agent 不會因為深陷技術細節而偏離大方向，保證每一個 Sprint 都能確實落地並轉換為實際的系統能力。

為了解決「在開發細節中迷失方向 (Rabbit Hole)」的問題，本專案導入以下五重防護機制：

## 1. 磁碟級記憶定錨 (planning-with-files 技能)
這是防偏離的最核心機制。大腦（Context Window）是短期的，磁碟才是長期的。
- **規則**：在啟動任何跨越 3 個步驟以上的 Sprint 前，Agent **必須**調用 `planning-with-files` 技能，初始化 `task_plan.md`、`findings.md` 與 `progress.md`。
- **強制回看**：在面臨重大架構決策或切換任務階段時，Agent 必須先使用 `read_file` 讀取 `task_plan.md`，將當前的注意力強制定錨回最初設定的 Sprint 目標上，防止盲目改寫無關的程式碼。

## 2. 三次失敗強制重啟機制 (The 3-Strike Error Protocol)
技術細節的迷失通常發生在「反覆嘗試修復同一個 Bug 卻無效」的無窮迴圈中。
- **Attempt 1**：精準修復 (Targeted Fix)。
- **Attempt 2**：更換解法 (Alternative Approach) —— 絕對禁止重複完全一樣的失敗動作。
- **Attempt 3 (Strike 3)**：**強制退回策略層 (Broader Rethink)**。如果連續失敗三次，Agent 必須停止修改程式碼，將錯誤記錄到 `task_plan.md`，並向 User (人類) 報告，或者考慮採用 Workaround (替代方案) 以保證整體進度的推進，而不是死磕單一節點。

## 3. 量化進度門禁 (SCS Checklist)
沒有量化指標，就無法確認進度。
- **規則**：每一個 Sprint 的產出，最終都必須反映在 `gap-checklist.md` 中 **SolidWorks Compatibility Score (SCS)** 的分數提升上。
- **防偏離**：如果 Agent 花了數個小時優化了某段代碼，但無法在 UI 操作上重現出對應的 SolidWorks 基準功能，則該工作視為「偏離目標」，不予計分。工作永遠以「能被使用者感知到的功能」為導向。

## 4. 模組化委派 (Sub-agent Delegation)
維持主控節點 (Main Orchestrator) 的清醒。
- **規則**：當面臨需要大量重複性修改 (例如：全域更換某個變數名稱) 或深度且不確定的源碼追蹤時，主控 Agent 必須利用 `invoke_agent` 將任務委派給 `generalist` 或 `codebase_investigator` 子代理。
- **防偏離**：這確保了主控 Agent 的 Context History 不會被海量的終端機輸出或試錯日誌給淹沒，從而始終保持對 Roadmap 全局的掌握。

## 5. 交接點防護 (Handover Protection)
- **規則**：每天的開發結束，或遭遇重大阻礙需暫停時，必須強制執行 `python tools/save_checkpoint.py`。
- **防偏離**：這會產出 `handover_resume_guide.md`，將當前的狀態「快照」下來。即使對話重置或隔天重啟，Agent 只要讀取這份文件，就能立刻無縫接軌昨天的最後進度，而不會從頭亂逛。
