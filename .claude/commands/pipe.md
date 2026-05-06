---
description: Show the feature pipeline stages and commands.
---

Print the feature pipeline matrix from `PIPELINE.md`:

| # | Stage  | Subagent         | Command         | Gate |
|---|--------|------------------|-----------------|------|
| 1 | Plan   | architect-agent  | `/pipe-plan`    | Plan accepted |
| 2 | Build  | reference-coder  | `/pipe-build`   | Code compiles, lint clean |
| 3 | Test   | test-agent       | `/pipe-test`    | All tests pass |
| 4 | Review | review-agent     | `/pipe-review`  | No Critical Issues |
| 5 | Fix    | reference-coder  | `/pipe-fix`     | Issues fixed, tests pass |
| 6 | Docs   | docs-agent       | `/pipe-docs`    | Docs updated |

Then ask the developer which stage they want to start at, or remind them they can begin with `/pipe-plan <feature description>`.
