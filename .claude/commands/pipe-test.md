---
description: Pipeline Stage 3/6 — write unit tests with test-agent.
argument-hint: <files or modules to test>
---

You are running **Stage 3 of 6** in the feature pipeline.

Use the **test-agent** subagent to write tests for:

> $ARGUMENTS

The subagent should cover normal paths, edge cases, error conditions, and boundary values, matching the project's existing test framework. If the target and framework are clear, it will proceed without asking; otherwise it will pause for 1–2 clarifying questions.

After tests are written, **automatically run the project's test command** with the Bash tool and report the result. Pick the commands in this priority order:

1. **`.claude/pipeline.json`** — if this file exists and has a `test` array, run each command in order. Stop on the first non-zero exit. State that you sourced commands from `pipeline.json`.
2. **Auto-detect** — otherwise, detect from files at the repo root:
   - `package.json` → `npm test` (or `npx jest` / `npx vitest` based on what's configured).
   - `pyproject.toml` or `setup.py` → `pytest`.
   - `Cargo.toml` → `cargo test`.
   - `go.mod` → `go test ./...`.
3. **Ask** — if neither a config nor a recognized project type is found, ask the developer which test command to run.

Report pass/fail counts and any failing tests clearly. The test gate only passes if the command exited 0 with zero failing tests.

Append this gate block to your response, ticking the boxes you actually verified:

---
**Gate (Stage 3/6 — Test):**
- [ ] Tests cover normal paths
- [ ] Edge cases and error conditions covered
- [ ] Test command exited 0 with zero failures

Next: `/pipe-review`
