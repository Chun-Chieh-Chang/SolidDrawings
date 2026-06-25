---
name: gap-autoloop
description: >
  Use when you need to run the continuous autonomous development loop (daemon mode).
  This orchestrator cycles: gap-planner -> gap-executor -> gap-planner -> ... until all P0/P1
  gaps in gap-analysis-report.md are closed or the loop is explicitly stopped.
  Trigger when the user says "start autonomous dev loop", "autonomous development loop", "start
  the daemon", "run continuous development", or wants the system to autonomously work
  through gaps without manual intervention. Also useful as a CI/CD-style background process
  that keeps closing gaps until the project reaches 100% maturity.
---

# Gap Auto-Loop Daemon (Continuous Autonomous Development)

## Purpose

Run an uninterrupted planner → executor → planner cycle that autonomously advances the project toward 100% gap closure. This is the "background daemon" that turns the gap-driven development system into a self-propelling engine.

## Loop Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   gap-autoloop daemon                            │
│                                                                  │
│   ┌──────────────┐     ┌──────────────┐     ┌───────────────┐   │
│   │ gap-planner  │────>│ gap-executor │────>│ Check gaps    │   │
│   │ (SKILL.md)   │     │ (SKILL.md)   │     │ remain?       │   │
│   └──────────────┘     └──────────────┘     └───────┬───────┘   │
│                                                      │           │
│                                   ┌──────────────────┘           │
│                                   ▼                              │
│                          ┌────────────────┐                      │
│                          │ Yes → loop back │                     │
│                          │ No → DONE      │                      │
│                          └────────────────┘                      │
└─────────────────────────────────────────────────────────────────┘
```

## Daemon Mode Initialization

### Step 0: Pre-flight Checks

Before entering the loop, verify the system is ready:

1. **Read gap-analysis-report.md** — check if it exists and has content.
2. **Read task_plan.md** — if a task_plan.md exists with IN_PROGRESS status, check if it was partially executed.
   - If partially done: resume from gap-executor (skip planning).
   - If completed: proceed to re-plan.
3. **Verify build tools available**:
   - `node --version` (should be 18+)
   - `python --version` (should be 3.10-3.12)
   - `git status` (working tree should be clean, or stash changes)
4. **Set environment marker**: Export `GAP_AUTOLOOP=1` so sub-skills know they're running in daemon mode.
5. **Log start**: Append to `progress.md`:
   ```markdown
   ## YYYY-MM-DD HH:MM — gap-autoloop daemon STARTED
   Initial scores: [copy from gap-analysis-report.md score table]
   ```

### Step 1: Plan → Invoke gap-planner

Dispatch the gap-planner skill to generate the next sprint plan:

```
Invoke: skill(name="gap-planner")
```

If gap-planner fails or produces an empty plan (no actionable gaps):
- Check gap-analysis-report.md for any remaining P0/P1 items.
- If truly none → report completion and EXIT the loop.
- If gap-planner got confused → read its output, fix the blocker, retry once.

After gap-planner succeeds:
- Read `task_plan.md` to confirm 3-7 tasks were created.
- **Validate that EVERY task has explicit, verifiable acceptance criteria defined.** If any task lacks acceptance criteria → FAIL the plan. Log: "Task [N] missing acceptance criteria — planner did not follow specification." Then re-invoke gap-planner with a clear directive: "Re-plan — each task MUST include acceptance criteria."
- Log to `progress.md`: `Planned N tasks for sprint [focus].`

### Step 2: Execute → Invoke gap-executor

Dispatch the gap-executor skill to execute all tasks:

```
Invoke: skill(name="gap-executor")
```

Monitor execution:
- If a task gets BLOCKED → read the blocker, decide: fix and re-dispatch, or skip and move on?
- If 3+ consecutive tasks fail → STOP the loop, report to user.
- If executor completes all tasks successfully → proceed to Step 3.

After gap-executor finishes:
- Read `gap-analysis-report.md` to get updated scores.
- Read `task_plan.md` to confirm all tasks completed.
- Log to `progress.md`: `Executed N tasks. New scores: [summary].`

### Step 3: Assess → Check Completion Criteria

Read `gap-analysis-report.md` Section 11 (優先級行動建議):

```
Count remaining P0 items:  [N]
Count remaining P1 items:  [N]
Count remaining P2 items:  [N]
Score improvements this cycle: [list]
```

**Completion check function:**
```
IF remaining P0 == 0 AND remaining P1 == 0:
    → "All P0/P1 gaps closed. Project maturity threshold reached."
    → EXIT loop normally
ELSE:
    → Continue to Step 4
```

### Step 4: Loop → Go to Step 1

Proceed to Step 1 for the next iteration. Do NOT pause between iterations.

### Loop Termination

The daemon terminates when ONE of these conditions is met:

| Condition | Action |
|:---|---:|
| **All P0/P1 gaps closed** | Normal exit — log success to progress.md |
| **3 consecutive task failures** | Emergency stop — log failures, preserve state |
| **task_plan.md is empty/planner produces nothing** | No gaps to work on — normal exit |
| **User explicitly stops** (`/stop-continuation` or user interrupt) | Graceful stop — log current state |

### Emergency Stop

If 3 consecutive tasks fail:

1. **DO NOT** delete or clean any files. Preserve state for debugging.
2. **Append to progress.md**:
   ```markdown
   ## YYYY-MM-DD HH:MM — gap-autoloop EMERGENCY STOP
   Failed tasks:
   - Task X: [error]
   - Task Y: [error]
   - Task Z: [error]
   
   Last good state: commit [hash]
   Scores at stop: [summary]
   ```
3. **Report to user**: Which tasks failed, why, and what state the project is in.

## Self-Verification

- [ ] Loops correctly: planner → executor → check → planner...
- [ ] Detects when all P0/P1 gaps are closed and exits
- [ ] Handles task failure gracefully (logs + continues to next task)
- [ ] Preserves state on emergency stop
- [ ] Does not modify gap-analysis-report.md directly (only via executor)
- [ ] Logs all actions to progress.md

## Anti-Patterns

- **Don't skip the check step**: Always read the gap report after each cycle. Scores might have changed in unexpected ways.
- **Don't plan a new sprint if executor hasn't finished**: Let the executor complete all current tasks before re-planning.
- **Don't ignore user directives**: If a domain is marked "postponed per user", skip it even if gaps remain.
- **Don't run without logging**: Every action must be recorded in progress.md. Otherwise debugging is impossible.
- **Don't modify source code directly**: The daemon only orchestrates. Code changes go through planner → executor.
- **Don't loop faster than one cycle per user session**: The daemon runs turn-by-turn, not in real-time. Each cycle is one complete planner+executor run.
- **Don't create infinite loops**: Always check for the termination conditions. If you find yourself cycling without progress, STOP and report.
- **Don't approve a plan that lacks acceptance criteria**: The planner must produce acceptance criteria for every task. If it doesn't, reject the plan and demand re-planning. Executing tasks without acceptance criteria is the single most dangerous anti-pattern — it replaces objective verification with subjective "looks done."

## State Diagram

```
 IDLE → PREFLIGHT → PLANNING → EXECUTING → ASSESSING → PLANNING → ... → DONE
                                                                        → EMERGENCY_STOP
```
