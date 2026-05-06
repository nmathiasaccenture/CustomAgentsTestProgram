---
description: Pipeline Stage 6/6 — update documentation with docs-agent.
argument-hint: <feature name or scope>
---

You are running **Stage 6 of 6** in the feature pipeline.

Use the **docs-agent** subagent to update documentation for:

> $ARGUMENTS

The subagent should update README sections, API docs, or inline comments to cover the new feature, intended usage, and any configuration. It will not change application code.

Append this gate block to your response:

---
**Gate (Stage 6/6 — Docs):**
- [ ] README reflects the new feature
- [ ] Usage examples included
- [ ] Configuration documented (if any)

Pipeline complete — open a PR.
