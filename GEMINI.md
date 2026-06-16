@./skills/core/using-superpowers/SKILL.md
@./skills/core/using-superpowers/references/gemini-tools.md


# Token Efficiency & RTK Patterns (Global Mandate)

**所有 Agent 在此專案中必須優先遵循「高信號輸出」原則：**

1. **代碼探索：** 優先使用 `python tools/rtk_ls.py` 查看目錄結構，使用 `python tools/rtk_read.py` 查看文件簽名。禁止在未了解結構前盲目讀取全文。
2. **日誌處理：** 執行噪聲較大的命令時，必須使用重定向到文件（Tee Recovery），並僅讀取過濾後的錯誤資訊。
3. **Context 保護：** 始終思考「我是否需要這段資訊的全文？」。如果只需要簽名或結構，務必使用優化工具。
4. **交接防護機制 (Handover Protection)：** 為了避免開發中斷導致 Context 丟失，在每個主要的任務結束時、等待使用者授權時，或 PDCA 閉環完成後，Agent **必須主動執行** `python tools/save_checkpoint.py`。這會自動將當前的開發狀態（包含 Git、未解決錯誤、DEV_LOG 日誌等）寫入根目錄的 `handover_resume_guide.md`，以便任何其他工具或帳號無縫接手。

# SkillsBuilder Multi-Agent Closed-Loop PDCA (Global Rule)

... [rest of the section] ...

# Code Review Compliance — 500-Line Limit Rule (Global Rule)

**當提交程式碼時若遇到 Code Review 平台 500 行變更限制，必須執行以下流程：**

1. **審查大檔案：** 使用 `Get-ChildItem -Recurse | ForEach-Object { (Get-Content $_.FullName | Measure-Object -Line).Lines }` 找出超過 400 行的檔案。
2. **分析拆分點：** 判斷哪些邏輯可抽離為獨立子組件（Components）或 Utility 函式。拆分原則：
   - 每個子模組不超過 100 行
   - 單一職責原則（SRP）：每個檔案只做一件事
   - 保持公共 API 不變（backward-compatible re-exports）
3. **自動重構：** 將大檔案拆分為多個小檔案，組織為子目錄結構：
   - TypeScript 元件 → `src/ui/ComponentName/` 目錄（index.tsx + rollouts/）
   - TypeScript hook → `src/hooks/category/` 目錄
   - TypeScript 工具 → `src/utils/geometry/constraints/` 目錄
   - Zustand store → `src/store/slice-name.ts` 檔案
4. **驗證：** 重構後必須執行 `npx tsc --noEmit` 與 `npx jest` 確認零錯誤。
5. **分批提交：** 拆分後的變更應按依賴順序建立 Small PRs：
   - PR 順序：新功能 → Store 拆分 → 工具層拆分 → Hook 拆分 → UI 組件拆分
   - 每個 PR 附帶 `npx tsc` 和 `npx jest` 通過截圖
   - PR title 遵循 conventional commits（`feat:`, `refactor:`）

# OpenCASCADE & Backend Engineering Standards (Industrial Parity)

為了確保在 GitHub Actions CI 與工業級建模環境下的魯棒性，所有 Agent 必須遵守以下幾何引擎開發規範：

1.  **Collection API Safety (ListOfShape)**:
    *   **NO `IsNull()`**: `TopTools_ListOfShape` 在新版 pythonocc 中不再具備 `.IsNull()` 方法。禁止在清單對象上直接調用。
    *   **ListIterator Pattern**: 必須使用 `TopTools_ListIteratorOfListOfShape(list_obj)` 進行迭代。
    *   **Iteration Block**:
        ```python
        it = TopTools_ListIteratorOfListOfShape(gen_list)
        while it.More():
            shape = it.Value()
            it.Next()
            if shape and not shape.IsNull():
                # Process shape...
        ```
2.  **Global Import Scope**:
    *   所有 OpenCASCADE (`OCC`) 與 CadQuery (`OCP`) 的匯入必須位於模組最頂層。
    *   **禁止局部匯入**：嚴禁在函式內部使用 `from OCC... import`，以防止 `UnboundLocalError` 與 CI 環境衝突。
3.  **Cross-Version Compatibility (OCC/OCP)**:
    *   始終實作 `try...except` Fallback 機制（`OCC` -> `OCP` -> `Mock`）。
    *   針對 `Generated()` 與 `Modified()`，應同時相容返回「單個 Shape」與「Shape List」的情況。
4.  **Deprecated Classes**:
    *   優先使用 `BRepOffsetAPI_MakePipeShell` 替代已被移除的 `BRepFill_PipeShell`。
