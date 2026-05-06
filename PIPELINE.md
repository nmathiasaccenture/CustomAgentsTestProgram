# Feature Pipeline

A 6-stage workflow for taking a feature from idea to merged PR using the agents in this repo. Works with both **Claude Code** and **GitHub Copilot**.

The developer drives. Each stage has a **gate** that must pass before advancing.

## Stage matrix

| # | Stage | Subagent | Claude command | Copilot agent | Gate |
|---|-------|----------|----------------|---------------|------|
| 1 | Plan   | architect-agent  | `/pipe-plan`   | architect-agent  | Plan accepted by developer |
| 2 | Build  | reference-coder  | `/pipe-build`  | reference-coder  | Code compiles, lint clean |
| 3 | Test   | test-agent       | `/pipe-test`   | test-agent       | All tests pass |
| 4 | Review | review-agent     | `/pipe-review` | review-agent     | No Critical Issues (or fixes captured) |
| 5 | Fix    | reference-coder  | `/pipe-fix`    | reference-coder  | Critical Issues addressed, tests still pass |
| 6 | Docs   | docs-agent       | `/pipe-docs`   | docs-agent       | README/API docs reflect new feature |

## How to run

- **Claude Code** — type `/pipe` to see the stages, then run `/pipe-plan <feature>` to start. Each command runs the right subagent and prints the gate at the end.
- **GitHub Copilot** — open Copilot Chat, pick the agent from the dropdown, paste the prompt template from the stage below.

## Configuration (optional)

The `/pipe-build`, `/pipe-test`, and `/pipe-fix` commands auto-detect your project's build/test commands from common config files (`package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`). If detection picks the wrong thing — non-standard scripts like `pnpm`, `make`, `poetry run`, or a monorepo layout — create `.claude/pipeline.json` to override:

```json
{
  "build": ["pnpm lint", "pnpm build"],
  "test": ["pnpm test"]
}
```

- `build` — array of commands run by `/pipe-build`. Run in order; the gate fails on the first non-zero exit.
- `test` — array of commands run by `/pipe-test` and `/pipe-fix`. Same failure semantics.

A starter file is at [.claude/pipeline.example.json](.claude/pipeline.example.json) — copy it to `.claude/pipeline.json` in your project and edit.

---

## Stage 1 — Plan

**Subagent:** architect-agent
**Goal:** files needed, interfaces, data models, dependencies, step order

**Claude Code:**
```
/pipe-plan add discount codes to checkout
```

**Copilot (select architect-agent):**
```
Plan a discount code system. Cover files needed, interfaces, data models, dependencies, and recommended step order.
```

**Gate to advance:**
- [ ] Files, interfaces, and data models look right
- [ ] Step order is sensible
- [ ] No missing dependencies

→ Continue to Stage 2

---

## Stage 2 — Build

**Subagent:** reference-coder
**Goal:** implement the plan with full docstrings and examples

**Claude Code:**
```
/pipe-build implement the discount code plan from stage 1
```

**Copilot (select reference-coder):**
```
Build the discount code system using the plan from architect-agent. Add full documentation and 2–3 input/output examples per function.
```

**Gate to advance:**
- [ ] Code compiles / lint passes
- [ ] Implementation matches the plan
- [ ] Every function has a docstring

→ Continue to Stage 3

---

## Stage 3 — Test

**Subagent:** test-agent
**Goal:** unit tests covering normal paths, edge cases, and errors

**Claude Code:**
```
/pipe-test src/services/DiscountService.ts
```

**Copilot (select test-agent):**
```
Write unit tests for the discount code system. Cover valid codes, expired codes, invalid codes, and edge cases. Match the project's existing test framework.
```

**Gate to advance:**
- [ ] Tests cover normal paths
- [ ] Edge cases and error conditions covered
- [ ] All tests pass

→ Continue to Stage 4

---

## Stage 4 — Review

**Subagent:** review-agent
**Goal:** find bugs, clarity issues, security/perf problems

**Claude Code:**
```
/pipe-review src/services/DiscountService.ts
```

**Copilot (select review-agent):**
```
Review the discount code implementation and tests for bugs, edge cases, clarity, maintainability, security, and performance. Use the standard review structure.
```

**Gate to advance:**
- [ ] No Critical Issues, OR a list of fixes is captured for Stage 5
- [ ] Author has answered any open Questions
- [ ] Suggestions triaged (apply now / defer)

→ If clean: skip to Stage 6
→ If fixes needed: continue to Stage 5

---

## Stage 5 — Fix

**Subagent:** reference-coder
**Goal:** apply review feedback, keep docs in sync

**Claude Code:**
```
/pipe-fix apply the critical issues from the review
```

**Copilot (select reference-coder):**
```
Fix the issues found by review-agent. Keep documentation and examples updated. Then re-run the tests.
```

**Gate to advance:**
- [ ] All Critical Issues addressed
- [ ] Tests still pass
- [ ] Re-review clean (loop back to `/pipe-review` if unsure)

→ Continue to Stage 6

---

## Stage 6 — Docs

**Subagent:** docs-agent
**Goal:** update README, API docs, configuration notes

**Claude Code:**
```
/pipe-docs discount code feature
```

**Copilot (select docs-agent):**
```
Update the README to describe the new discount code feature, how to use it, and any configuration details.
```

**Gate to advance:**
- [ ] README reflects new feature
- [ ] Usage examples included
- [ ] Configuration documented (if any)

→ Pipeline complete — open a PR. The repo's [PR template](.github/pull_request_template.md) auto-populates with a pipeline checklist; tick each gate that actually passed.
