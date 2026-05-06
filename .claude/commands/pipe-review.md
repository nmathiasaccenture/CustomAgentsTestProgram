---
description: Pipeline Stage 4/6 — review the implementation and tests with review-agent.
argument-hint: <files, PR, or scope to review>
---

You are running **Stage 4 of 6** in the feature pipeline.

Use the **review-agent** subagent to review:

> $ARGUMENTS

The subagent should produce its standard structure: Overall Assessment, Critical Issues, Suggestions, Questions for the author, and Praise. Since the target is provided here, it should proceed without asking clarifying questions.

Append this gate block to your response:

---
**Gate (Stage 4/6 — Review):**
- [ ] No Critical Issues, OR a list of fixes is captured for Stage 5
- [ ] Author has answered any open Questions
- [ ] Suggestions triaged (apply now / defer)

If clean → `/pipe-docs`
If fixes are needed → `/pipe-fix`
