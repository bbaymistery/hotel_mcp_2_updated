# NNN — <short title>

**Type:** bug | feature | test | refactor | chore
**Spec:** openspec/changes/<id>/ or docs/specs/<file>.md (or "n/a: small fix")
**Branch / worktree:** agent/<slug>

## Goal
One or two sentences: what changes for the user or system, and why.

## Scope
- Files likely touched: `src/...`, `tests/...`
- Out of scope: ...

## Acceptance criteria (each one has a test)
- [ ] Given ..., when ..., then ... → `tests/.../x.test.ts`
- [ ] Given ..., when ..., then ... → `tests/.../x.test.ts`

## Verify
- `npx tsc --noEmit`
- `npx vitest run tests/...`

## Follow-ups
(anything found but not done)
