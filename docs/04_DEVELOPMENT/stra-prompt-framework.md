# StraTA Prompt Engineering Framework

This document defines the StraTA (Strategic Thinking in Language Models) prompt engineering framework
for the 3D-Builder project. Based on research showing that strategic planning improves AI code generation
quality and reduces context dilution in long conversations.

## Core Principles

1. **Strategy-First**: Always define a global strategy before implementation
2. **Verification Conditions**: Every strategy must include verifiable conditions
3. **Closed-Loop Refinement**: Audit results must feed back to implementation
4. **Single-Step Execution**: Execute one atomic change at a time

## Framework Phases

### Phase 1: Strategist (軍師) - Planning

**Purpose**: Define the global strategy before any code changes

**Template**:
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

**Rules**:
- Strategy must be FIXED TEXT (no placeholders)
- Must define key naming conventions, patterns, or standards
- Must identify what to IGNORE (out of scope)
- Must include at least 3 verification conditions

### Phase 2: Soldier (士兵) - Execution

**Purpose**: Execute the strategy step-by-step

**Template**:
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

**Rules**:
- Execute ONE file change per step
- Reference the strategy anchor in every step
- Stop after each step for confirmation
- If step fails, report error and request guidance

### Phase 3: Auditor (審計員) - Self-Review

**Purpose**: Verify implementation against strategy

**Template**:
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

**Rules**:
- Check against SPECIFIC strategy clauses, not vague principles
- Report line numbers for any issues
- Must include PASS/FAIL verdict
- If FAIL, suggest specific fix

## Anti-Loop Protocol

To prevent infinite execution loops:

1. **Max 3 retries**: If same error occurs 3 times, switch strategy or escalate
2. **Progress check**: Every 5 steps, verify measurable progress
3. **Stop condition**: If no advancement after 2 retries, report to human
4. **Error analysis**: Always analyze error cause before retrying

## Integration with Existing Workflow

### When to Use StraTA

**REQUIRED for**:
- Multi-module changes (>2 files)
- Architecture decisions
- New feature implementation
- Complex refactoring

**OPTIONAL for**:
- Single file fixes
- Typo corrections
- Simple configuration changes

### When NOT to Use StraTA

- Quick debugging sessions
- One-line fixes
- When time budget < 15 minutes

## Example Usage

### Scenario: Adding a new feature

**User**: "Implement Smart Mates feature"

**AI (Strategist)**:
```xml
<strategy>
## Task: Implement Smart Mates drag-and-drop mate creation

## Scope:
- INCLUDED: Store state, inference engine, 3D overlay, UI toggle
- EXCLUDED: Backend mate solving, legacy mate panel changes

## Strategy:
1. Add smartMateActive/smartMateSource to assembly-state store
2. Create SmartMateInference utility for mate type determination
3. Implement SmartMateOverlay for 3D viewport interaction
4. Add toggle button to AssemblyTab

## Verification Conditions:
- [ ] tsc --noEmit passes with 0 errors
- [ ] SmartMateOverlay intercepts clicks when smartMateActive=true
- [ ] inferSmartMate() returns correct MateType for face+face, edge+edge, etc.

## Constraints:
- Must not modify existing mateSelection flow
- Must use existing TopologySelector for raycasting
- Must follow react-hooks/immutability rule (use store.dispatch, not setState in effects)
</strategy>
```

**AI (Soldier - Step 1)**:
```xml
<execution>
## Current Step: 1 of 4
## Strategy Anchor: [paste strategy]

## Current Context:
- File: src/store/assembly-state.ts
- Need to add: smartMateActive, smartMateSource, setters

## Action:
Add Smart Mates state to AssemblySlice interface and implementation

## Code Changes:
- File: src/store/assembly-state.ts
- Changes: Added smartMateActive (boolean), smartMateSource (SelectedTopology | null),
  setSmartMateActive, setSmartMateSource to both interface and createAssemblyState
</execution>
```

**AI (Auditor)**:
```xml
<audit>
## Review Target:
- Strategy: Smart Mates Step 1
- Implementation: assembly-state.ts changes

## Compliance Check:
- [x] Follows strategy step 1
- [x] Meets verification condition (tsc check pending)
- [x] No unnecessary code added

## Issues Found:
None

## Verdict: PASS
</audit>
```

## Best Practices

1. **Always start with Strategist** for complex tasks
2. **Keep strategy concise** (1 page max)
3. **Make verification conditions testable** (not "looks good")
4. **Audit every step**, not just the final result
5. **Feed audit results back** to Soldier for correction
6. **Anchor to strategy** in every execution step

## Common Pitfalls

- ❌ Vague strategies without verification conditions
- ❌ Executing multiple steps before auditing
- ❌ Ignoring audit failures
- ❌ Losing strategy anchor in long conversations
- ❌ Not stopping when loop detected

## References

- StraTA Paper: "Strategic Thinking in Language Models"
- Related: Chain-of-Thought, Tree-of-Thoughts, Self-Consistency
