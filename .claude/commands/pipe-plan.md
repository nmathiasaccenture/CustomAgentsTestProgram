---
description: Pipeline Stage 1/6 — plan files, interfaces, and data models with architect-agent.
argument-hint: <feature description>
---

You are running **Stage 1 of 6** in the feature pipeline (see `PIPELINE.md`).

Use the **architect-agent** subagent to plan this feature:

> $ARGUMENTS

The subagent should produce its standard output: files needed, interfaces, data models, dependencies, and step order. If the request is ambiguous, the subagent will pause and ask 2–3 clarifying questions before planning — wait for the developer to answer before continuing.

After the plan is delivered, append this gate block to your response:

---
**Gate (Stage 1/6 — Plan):**
- [ ] Files, interfaces, and data models look right
- [ ] Step order is sensible
- [ ] No missing dependencies

Reply "approved" to advance, or describe revisions. Next: `/pipe-build`
