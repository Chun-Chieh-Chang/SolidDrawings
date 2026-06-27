---
name: gap-executor
description: >
  Use when you need to execute planned development tasks and update the gap analysis report.
  Reads task_plan.md, dispatches implementation sub-agents for each pending task using
  subagent-driven-development, verifies completion via build/test, then surgically updates
  gap-analysis-report.md with new scores and status badges. Also triggered when task_plan.md
  has pending tasks and the user says "execute sprint", "run gap executor", or after the
  gap-planner has generated a new plan. Call this AFTER gap-planner has produced task_plan.md.
---

# Gap Executor Sub-Agent

## Purpose

Execute tasks from `task_plan.md` one by one using sub-agent dispatch, then update `gap-analysis-report.md` with accurate completion scores. This closes the loop between planning and delivery.

## Input / Output

| | Path | Format |
|:---|:---|:---|
| **Input** | `task_plan.md` | Markdown with task checklist, phases |
| **Input** | `gap-analysis-report.md` | Current gap scores (for baseline) |
| **Output** | `gap-analysis-report.md` | Updated scores and status badges |
| **Output** | `DEV_LOG.md` | Appended with implementation log |
| **Context** | `progress.md` | Updated with execution results |

## Flow

### Phase 0: Pre-flight Check

1. Read `task_plan.md`.
2. Count pending vs completed tasks.
3. **Validate acceptance criteria**: For each pending task, verify the task has explicit, verifiable acceptance criteria defined. If any task lacks acceptance criteria → STOP, report to planner/gap-autoloop: "Task [N] missing acceptance criteria — cannot execute." Do NOT proceed to execute tasks without acceptance criteria.
4. Verify the build system is available:
   - Run `npm run typecheck` — record pre-existing errors.
   - Run `python -c "import sys; print(sys.version)"` — verify Python available.
5. If no pending tasks → report "All tasks completed" and EXIT.

### Phase 1: Execute Each Pending Task

For each pending task in `task_plan.md` (work through them **sequentially**, one at a time):

#### Step 1a: Task Analysis
Read the task description and identify:
- **Acceptance Criteria** (from task_plan.md) — these are the explicit contract for completion. Read them verbatim. Every criterion must be verifiably satisfied before the task can be marked done.
- Files to create/modify (frontend/backend)
- Gap report section this task affects
- Specific score target (e.g., Surfacing: 30% → 45%)

**If task_plan.md is missing acceptance criteria for this task → STOP. Do not implement. Report back:** "Task [N] has no acceptance criteria defined. Needs re-planning with explicit criteria before execution."

#### Step 1b: Dispatch Implementation Sub-agent

Use `task()` with `category="deep"` (for complex multi-file work) or `category="quick"` (for simple changes) to dispatch an implementation sub-agent.

The implementation prompt MUST include:

```
TASK: [exact task description from task_plan.md]
EXPECTED OUTCOME: [concrete deliverable]
ACCEPTANCE CRITERIA:
- [criterion 1 from task_plan.md — verbatim]
- [criterion 2 from task_plan.md — verbatim]
- [criterion 3 from task_plan.md — verbatim]
REQUIRED TOOLS: Read, Edit, Write, Bash, Glob, Grep
MUST DO:
- One feature at a time, no scope creep
- Follow existing codebase patterns
- Run tsc --noEmit after changes
- Fix all TypeScript errors introduced
- Satisfy ALL acceptance criteria listed above before declaring done
MUST NOT DO:
- Refactor unrelated code
- Add dependencies not listed in package.json
- Suppress type errors with any/ts-ignore
- Modify gap-analysis-report.md (this is handled by the executor)
- Declare task complete without verifying every acceptance criterion
CONTEXT:
- Project: 3D-Builder, React+TypeScript frontend, Python+FastAPI backend
- Base path: C:\Users\3kids\Downloads\3D-Builder
- See gap-analysis-report.md section [X] for the gap being closed
```

#### Step 1c: Verify Implementation Against Acceptance Criteria

After the sub-agent reports completion, verification is TWO-layer:

**Layer 1 — Acceptance Criteria Verification (MANDATORY, highest priority):**
Go through EVERY acceptance criterion defined for this task in task_plan.md. For each criterion:
- **Functional criteria**: Manually verify the behavior (e.g., call the API endpoint, check the UI renders, inspect the output).
- **Build criteria**: Run the stated verification command (e.g., `tsc --noEmit`, `python -m py_compile`).
- **Quality criteria**: Inspect the diff — does the implementation meet SOLIDWORKS 2010 professional standards? No shortcuts, no stubs, no "TODO: implement later."

Each criterion must be checked off explicitly. If any criterion FAILS:
→ The task is NOT complete. Dispatch a fix sub-agent via `task(task_id="ses_...", prompt="Acceptance criterion failed: [criterion]. Fix.")`

**Layer 2 — Build Verification:**
1. Run `npm run typecheck` — confirm no NEW errors (pre-existing jest/playwright errors are OK).
2. If backend changes: verify Python syntax with `python -m py_compile <file>`.
3. Check the diff: `git diff --stat` — confirm changes are scoped to the task.
4. If any build verification fails → dispatch a fix sub-agent.

**Rule: A task is only complete when ALL acceptance criteria pass AND all build checks pass.** No exceptions.

#### Step 1d: Update task_plan.md

- Mark the task as completed: `[ ]` → `[x]`.
- Add error resolution notes if any.

### Phase 2: Update Gap Analysis Report

After ALL tasks in the sprint are completed, surgically update `gap-analysis-report.md`:

#### Step 2a: Update Score Table

Use `edit()` to update the **評分總覽** table. For each domain that was targeted:

```markdown
# Example: changing Surfacing from 30% to 45%
old: | 曲面 (Surfacing) | 30% | 🔴 大量缺乏 |
new: | 曲面 (Surfacing) | 45% | 🟡 部分完成 |
```

Score status mapping:
| Range | Badge |
|:---|---:|
| 100% | 🟢 完全對齊 |
| 70-99% | 🟡 小幅差距 |
| 40-69% | 🟡 部分完成 |
| 1-39% | 🔴 大量缺乏 |
| 0% | ⚪ 未開始 |

#### Step 2b: Update Domain Sections

For each domain section that has improvements:
- Change ❌ (missing) items to ✅ (completed) where implemented.
- Add "(已完成 YYYY-MM-DD)" after newly completed items.
- If entire section score changes, update the section header badge.

#### Step 2c: Update Priority Section

In Section 11 (優先級行動建議):
- Change completed P0/P1 items from numbered list to `~~strikethrough~~`.
- Move the item text to a note: "✅ [item] — completed YYYY-MM-DD"

#### Step 2d: Update Overall Maturity

Recalculate and update **總體成熟度**:
- Average score across all non-excluded domains.
- Round to nearest 5%.

#### Step 2e: Update Report Date

Change `**生成日期**: YYYY-MM-DD` to current date.

### Phase 3: Post-Execution

1. **Append to `DEV_LOG.md`**: Add a brief entry under the current date:
   ```markdown
   ## YYYY-MM-DD gap-executor sprint: [focus]
   
   Executed N tasks from task_plan.md:
   - [task 1 title] ✅
   - [task 2 title] ✅ (with fixes)
   - [task 3 title] ✅
   
   **Score updates:**
   - [domain]: X% → Y%
   
   **Files changed:** [file count]
   **Verification:** typecheck clean / N known pre-existing errors
   ```

2. **Update `progress.md`**: Log completion.

3. **Update `task_plan.md`**: Set status to `## Status: Completed — YYYY-MM-DD`.

### Phase 4: Trigger Re-Planning (if gap-autoloop is active)

If the environment variable `GAP_AUTOLOOP=1` is set, OR if this skill was invoked by gap-autoloop:
- After all tasks are done, invoke gap-planner to generate the next sprint plan.
- Signal to the caller: "All planned tasks completed. Ready for re-plan."

## Verification Before Completion

- [ ] All tasks in task_plan.md are marked [x] or legitimately skipped
- [ ] **Every task's acceptance criteria were verified — each criterion explicitly checked and passed**
- [ ] gap-analysis-report.md score table reflects actual progress
- [ ] Section 11 completed items are ~~strikethrough~~ or noted
- [ ] No new TypeScript/ESLint errors introduced
- [ ] No modification to files outside task scope
- [ ] DEV_LOG.md has execution entry
- [ ] progress.md is updated

## Anti-Patterns

- **Don't skip verification**: Every task MUST run typecheck/build before being marked complete.
- **Don't batch multiple tasks into one sub-agent**: One sub-agent per task. Parallel tasks = parallel sub-agents.
- **Don't update gap report optimistically**: Only update scores AFTER code is written AND verified.
- **Don't re-run the full gap planner**: The executor only updates scores. Re-planning is the planner's job.
- **Don't ignore sub-agent failures**: If a sub-agent returns BLOCKED, read the context, fix the blocker, re-dispatch. Do not skip the task.
- **Don't delete completed task_plan.md**: Archive it by setting status to "Completed". Future planners may reference it.
- **Don't declare a task complete without verifying EVERY acceptance criterion**: Build passing is not enough — each functional criterion must be confirmed. A task with unmet acceptance criteria is incomplete, regardless of typecheck status.
- **Don't modify acceptance criteria during execution**: Acceptance criteria are set during planning and are immutable during execution. If a criterion is discovered to be wrong, stop execution, re-plan the task with corrected criteria, then resume. Never "adjust the goalposts" to make a partial implementation pass.
