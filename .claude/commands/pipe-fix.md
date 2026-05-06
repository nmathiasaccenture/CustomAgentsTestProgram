---
description: Pipeline Stage 5/6 — apply review feedback using reference-coder.
argument-hint: <reference to review or specific issues to fix>
---

You are running **Stage 5 of 6** in the feature pipeline.

Use the **reference-coder** subagent to apply fixes from the Stage 4 review:

> $ARGUMENTS

The subagent should address each Critical Issue, keep documentation and examples in sync as code changes, and reference the original review when describing what was changed.

After fixes are in, **automatically re-run the project's test command** with the Bash tool. Use the same priority order as `/pipe-test`:

1. `.claude/pipeline.json` `test` array, if present.
2. Otherwise auto-detect (`npm test` / `pytest` / `cargo test` / `go test ./...`).
3. Otherwise ask the developer.

Confirm tests still pass and report the result.

Append this gate block to your response, ticking the boxes you actually verified:

---
**Gate (Stage 5/6 — Fix):**
- [ ] All Critical Issues addressed
- [ ] Test command exited 0 with zero failures
- [ ] Re-review is clean (loop back with `/pipe-review` if unsure)

Next: `/pipe-docs`
