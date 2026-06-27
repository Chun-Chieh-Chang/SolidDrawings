<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:strata-prompt-framework -->
# StraTA Prompt Engineering Framework

This project uses the StraTA (Strategic Thinking in Language Models) framework for complex development tasks.
See `docs/04_DEVELOPMENT/stra-prompt-framework.md` for full documentation.

## Quick Reference

### When to Use StraTA
- **REQUIRED** for: multi-module changes (>2 files), architecture decisions, new features, complex refactoring
- **OPTIONAL** for: single file fixes, typos, simple config changes

### When NOT to Use StraTA
- Quick debugging sessions
- One-line fixes
- Time budget < 15 minutes

### Anti-Loop Protocol (MANDATORY)
1. Max 3 retries: If same error occurs 3 times → switch strategy or escalate
2. Progress check: Every 5 steps, verify measurable progress
3. Stop condition: If no advancement after 2 retries → report to human
4. Error analysis: Always analyze error cause before retrying

## Prompt Templates

### Strategist (軍師)
```xml
<strategy>
## Task: [Brief description]
## Scope:
- INCLUDED: [What this task covers]
- EXCLUDED: [What this task ignores]
## Strategy:
1. [Step 1 with rationale]
2. [Step 2 with rationale]
3. [Step 3 with rationale]
## Verification Conditions:
- [ ] [Verifiable condition 1]
- [ ] [Verifiable condition 2]
- [ ] [Verifiable condition 3]
## Constraints:
- [Constraint 1]
- [Constraint 2]
</strategy>
```

### Soldier (士兵)
```xml
<execution>
## Current Step: [Step number] of [total steps]
## Strategy Anchor:
[strategy text from Phase 1]
## Current Context:
[file paths being modified, relevant code snippets]
## Action:
[action description]
## Code Changes:
[file: path, changes: description]
</execution>
```

### Auditor (審計員)
```xml
<audit>
## Review Target:
- Strategy: [strategy reference]
- Implementation: [file:line changes]
## Compliance Check:
- [ ] Follows strategy step N
- [ ] Meets verification condition M
- [ ] No unnecessary code added
## Issues Found:
[line:reason if any issues]
## Verdict:
[PASS/FAIL with rationale]
</audit>
```
<!-- END:strata-prompt-framework -->

<!-- BEGIN:python-version-constitution -->
# Python Version Constitution (HARD RULE)

This project **REQUIRES Python 3.10-3.12 + OCC (OpenCASCADE)**. 

## Absolute Prohibitions
- **Python ≥ 3.13 is FORBIDDEN.** OCC does not support it. Any code, config, or tooling that assumes or defaults to Python ≥ 3.13 must be rejected.
- **Never install, reference, or configure Python 3.14** for any backend task.
- **Never suppress or mock OCC unavailability** — OCC is a hard dependency.

## Active Environment
- Backend `.venv` uses **Python 3.12** with OCC pre-installed.
- Always run backend commands via `backend\.venv\Scripts\python.exe` (Windows) or after activating `.venv`.
- All `pip install`, `pytest`, and backend dev commands MUST use the `.venv` Python — never the system Python.

## Enforcement
- Any test that `skip`s due to missing OCC is a **code smell**. Fix the test or fix the environment — do not paper over missing OCC.
- CI must validate OCC availability before running tests.
<!-- END:python-version-constitution -->
