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
