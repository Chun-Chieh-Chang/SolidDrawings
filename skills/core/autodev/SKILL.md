---
name: autodev
description: >
  MAGIC COMMAND - Full auto dev loop via gap-planner -> gap-executor -> gap-autoloop.
  Trigger with "autodev", "magic", "run the loop", "start autonomous dev", "start the daemon",
  or any request to autonomously close all P0/P1 development gaps.
---

# Autodev - Magic Command for Full Auto Dev Loop

## One Command

Just say:

> **"autodev, start full auto dev"**

Or in any conversation:

> **"magic"** / **"run the loop"** / **"start autonomous dev"**

This skill takes over and orchestrates all three sub-agents to complete the development cycle.

---

## What It Does

When you invoke the magic command, this system automatically runs:

```
                          autodev

  Step 1 --- Read gap-analysis-report.md
       |    Analyze all P0/P1/P2 gaps and current scores
       v
  Step 2 --- Call gap-planner
       |    Produce task_plan.md (5-7 MECE tasks)
       v
  Step 3 --- Call gap-executor
       |    Execute each task one by one, dispatch implementation sub-agents
       |    Each task done -> verify build
       |    All done -> update gap-analysis-report.md scores
       v
  Step 4 --- Check if P0/P1 gaps remain
       |    Yes -> back to Step 2 (re-plan)
       |    No  -> Done! Report results
```

## Usage Examples

### Full Start
**You:** autodev, start full auto dev

**System:** Scanning gap-analysis-report.md...
Found 3 P0 gaps, 5 P1 gaps.
Calling gap-planner to generate sprint plan...

### Scoped Start
**You:** autodev, focus on surfacing and drawing gaps

**System:** Scope limited to: Surfacing + Drawing.
Calling gap-planner to plan only these domains...

### Check Status
**You:** autodev status

**System:** Current Autodev status:
- Sprint 2 of estimated 5 sprints
- Completed: Surfacing 30% -> 55%, Drawing 15% -> 40%
- In progress: Assembly Advanced Mates (P0)
- Remaining P0: 1, P1: 3

---

## How It Works

### Sub-agents Used

| Sub-agent | Location | Responsibility |
|:---|:---|:---|
| gap-planner | skills/dev/gap-planner/SKILL.md | Read gap report -> Generate sprint plan |
| gap-executor | skills/dev/gap-executor/SKILL.md | Execute tasks -> Update gap report scores |
| gap-autoloop | skills/dev/gap-autoloop/SKILL.md | Background loop daemon |

### Lifecycle

1. **Start**: You invoke the command -> Read gap-analysis-report.md
2. **Plan**: gap-planner produces task_plan.md — **EVERY task MUST include explicit, verifiable acceptance criteria defined at the highest standard**
3. **Validate**: gap-autoloop checks that ALL tasks in the plan have acceptance criteria — rejects the plan if any are missing
4. **Execute**: gap-executor completes each task — **verification is against acceptance criteria, not just build pass**
5. **Update**: gap-analysis-report.md scores are updated
6. **Loop**: If P0/P1 gaps remain -> back to step 2
7. **Done**: All P0/P1 closed -> output final report

### Termination Conditions

| Scenario | Action |
|:---|---:|
| All P0/P1 closed | Normal completion, output results report |
| 3 consecutive task failures | Emergency stop, preserve state |
| User enters /stop-continuation | Graceful stop, log current progress |

---

## Technical Note

This magic command is a SKILL.md registered via OpenCode's skill system.
When triggered, it loads the three sub-agent skills in sequence to complete the entire dev cycle.

No additional installation needed. No daemon process needed. No config files needed.

Just one sentence.
