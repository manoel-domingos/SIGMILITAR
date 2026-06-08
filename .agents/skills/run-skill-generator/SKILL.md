---
name: run-skill-generator
description: >
  Dual-purpose: (1) generate new SIGMILITAR skills following project conventions,
  and (2) execute any task while filtering the approach through SIGMILITAR's
  core methodology principles (BD-first, multi-tenant by school_id, no redundant
  comments, minimal edits). Use when user says "/run-skill-generator",
  "criar skill", "gerar skill", or wants to enforce project methodology on a task.
---

## Modes

Two modes, auto-detected from invocation:

- **Generator mode** — user wants to create a new skill. Prompt with: name,
  one-line description, trigger phrases, when to skip. Write `SKILL.md` to
  `.agents/skills/<name>/`. Use this same file structure.

- **Runner mode** — user wants to execute a task. Apply the four principles
  below to every design decision and code suggestion.

## Core Methodology (always applied in Runner mode)

### 1. BD-first (Postgres/Supabase over frontend)

Default: solve business logic in the database. Frontend is a thin renderer.

- Row-Level Security (RLS) for authorization, not `if (user.role === ...)` checks
- Triggers/functions for derived data (e.g. point calculations, audit trails)
- Views for aggregations and joins that UI consumes
- Generated columns for computed fields

Only push to frontend when: pure UI state, animations, presentation-only formatting.

Before suggesting frontend logic, ask: "can this be a Postgres policy/view/trigger?"

### 2. Multi-tenant by `school_id`

Every read, write, and policy considers the active tenant:

- Selects: `bySchool(query)` helper or `.eq('school_id', activeSchoolId)`
- Inserts: `school_id` always populated from `activeSchoolContextRef.current`
- RLS: policies always include `school_id = current_setting('app.school_id')`
- DRE override: `school_id IS NULL` or `'DRE'` for admin_global

Never write a query that could leak data across schools. Verify with
`bySchool` pattern in `lib/store.tsx`.

### 3. No redundant comments

- Code is self-explanatory through naming
- Comments only when the WHY is non-obvious (workarounds, hidden constraints)
- Never narrate WHAT the code does, what task it was added for, or who calls it
- Remove existing redundant comments when editing surrounding code

### 4. Minimal edits

- No refactors outside the requested scope
- No "while I'm here" cleanups unrelated to the task
- No new abstractions for hypothetical future use
- Three similar lines beat one premature helper
- Don't add error handling for impossible cases (trust framework guarantees)
- Don't touch files unrelated to the change

## Generator Mode — Output Format

When generating a new skill, produce:

```
.agents/skills/<skill-name>/
└── SKILL.md
```

`SKILL.md` frontmatter must include:
- `name`: kebab-case, matches folder
- `description`: 2-3 sentences, includes WHEN to use it (trigger phrases)

Body sections (adapt to skill purpose):
- Purpose / Mode
- Rules or Algorithm
- Examples (before/after if applicable)
- Boundaries (when to skip / when to defer)

## Runner Mode — Decision Loop

For every code change suggestion:

1. Can this live in Postgres? If yes → propose SQL migration first
2. Does every query filter by `school_id`? If not → fix before submitting
3. Are comments adding info not in code? If not → delete them
4. Is this edit scoped to the user's request? If not → cut the extras

If a suggestion violates a principle, flag it explicitly and offer the
compliant alternative.

## Boundaries

- Don't enforce BD-first on pure presentation tasks (animations, layout)
- Don't add `school_id` to global tables (e.g. `rules` is shared)
- Skip if user explicitly says "frontend-only fix" or "quick prototype"
