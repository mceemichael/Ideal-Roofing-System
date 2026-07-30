# Which document do I need?

Five documents, each with one job. Start here if you're not sure.

| I want to… | Read |
|---|---|
| Follow the migration step by step, from zero | **`START-HERE.md`** |
| Understand the plan, the cutover and the rollback | **`MIGRATION-PLAN.md`** |
| Run the code, find a file, look up an env var | **`README.md`** |
| Know why something was built the way it was | **`HANDOFF.md`** |
| — | **`CLAUDE.md`** — you don't read this; Claude Code does |

---

## What each one is

**`START-HERE.md`** — the beginner's walkthrough. Eight sessions, every command written out, every "what should happen" described. Assumes no terminal experience. This is the one to actually follow.

**`MIGRATION-PLAN.md`** — the strategy. Why rankings get lost and how each cause is handled, the full URL inventory, the phased plan, the cutover runbook, the 90-day monitoring schedule, and the rollback procedure. Read once before starting, then again the week of cutover.

**`README.md`** — the technical reference. Commands, environment variables, project layout, and the load-bearing constraints. For when you know what you want and need the specifics.

**`HANDOFF.md`** — the decision log. What was decided and why, what was verified and what wasn't, and what's still open. Read this when a piece of code looks odd and you want to know whether it's deliberate.

**`CLAUDE.md`** — instructions for Claude Code. It loads automatically at the start of every terminal session. Alongside it, `.claude/rules/` holds four topic files that load only when Claude touches matching files:

```
.claude/rules/
  seo.md                 loads for src/app/**, seo.ts, redirects.js, next.config.mjs
  sanity.md              loads for sanity/**
  components.md          loads for src/components/**
  migration-scripts.md   loads for scripts/**
```

Splitting them this way keeps the always-loaded file short, which is what makes Claude actually follow it.

---

## Reading order, first time through

1. `MIGRATION-PLAN.md` §0 — the three things that break migrations. Ten minutes, and it's the part that matters most.
2. `START-HERE.md` — Session 1, then work forward.
3. `HANDOFF.md` §6 — the open items, so you know what's waiting.

Everything else, look up when you need it.

---

## Keeping these current

They will drift. Two habits keep that manageable:

- When Claude Code makes the same mistake twice, add a line to `CLAUDE.md` — or ask it to. That's exactly what the file is for.
- When you finish something from `HANDOFF.md` §6, tick it off there. That section is the project's actual to-do list.
