---
description: Pipeline Stage 2/6 — implement the plan using reference-coder.
argument-hint: <what to build, or reference to the stage 1 plan>
---

You are running **Stage 2 of 6** in the feature pipeline.

Use the **reference-coder** subagent to implement based on the Stage 1 plan:

> $ARGUMENTS

The subagent will follow its workflow: restate understanding, give 2–3 input/output examples, write the code with full docstrings, and suggest one improvement. If a concrete plan or spec is already in context, it should proceed without asking; otherwise it will pause and ask 1–3 clarifying questions.

After implementation, **automatically run the project's build and lint commands** with the Bash tool to verify the code compiles cleanly. Pick the commands in this priority order:

1. **`.claude/pipeline.json`** — if this file exists and has a `build` array, run each command in order. Stop on the first non-zero exit. State that you sourced commands from `pipeline.json`.
2. **Auto-detect** — otherwise, detect from files at the repo root:
   - `package.json` → run `npm run build` if a "build" script exists (otherwise `npx tsc --noEmit` for TypeScript projects), then `npm run lint` if a "lint" script exists.
   - `pyproject.toml` or `setup.py` → run `ruff check .` (or `flake8 .` if ruff isn't configured), then `mypy .` if a type checker is configured.
   - `Cargo.toml` → run `cargo build` and `cargo clippy`.
   - `go.mod` → run `go build ./...` and `go vet ./...`.
3. **Ask** — if neither a config nor a recognized project type is found, ask the developer which command to run.

Report the exit code and any errors clearly. The build gate only passes if every command exited 0.

Append this gate block to your response, ticking the boxes you actually verified:

---
**Gate (Stage 2/6 — Build):**
- [ ] Build command exited 0
- [ ] Lint command exited 0
- [ ] Implementation matches the plan
- [ ] Every function has a docstring

Next: `/pipe-test`
