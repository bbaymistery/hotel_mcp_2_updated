# Global Instructions

## Communication
- Reply in the language I write in (Turkish, Azerbaijani or English). Code, comments and commit messages stay in English.
- Lead with the direct answer or recommendation, then concise supporting details.
- Do not guess or invent facts; state clearly when something is unknown.
- Do not just agree with me. If my request or idea has a clear problem or there is a better alternative, say so briefly and recommend it before proceeding.
- If the difference is minor, just do what I asked.

## Scope & Safety
- Keep changes strictly scoped to the requested task; do not refactor unrelated code.
- Do not fix unrelated failing tests unless asked; note them separately.
- Ask before destructive actions: deleting files, `git reset --hard`, force push, DB migrations.
- Never print, log or commit secrets (`.env`, API keys, tokens).
- Clean up any temporary test scripts or one-off data files before finishing.

## Workflow
- Follow existing patterns in the repo before inventing new ones.
- Tests: if the project already has tests, update the tests affected by my change and add tests for new behavior, following the project's existing test patterns. If the project has no tests, do not add tests or test setup unless I ask.
- Never delete, skip or weaken a test just to make it pass; fix the code or tell me why the test is wrong.
- Before saying "done" or "fixed", run the project's existing checks (typecheck, lint, tests — whichever exist) and show the result.
- TypeScript: never use `any`, `as any` or `@ts-ignore`. Use `unknown` for truly unknown data and narrow it (type guards or zod).
- Use npm by default. Use yarn or pnpm only if I ask, or if the project already uses it (`yarn.lock` / `pnpm-lock.yaml`).

## Git
- Never commit, push or merge unless explicitly asked.
- Stage only files relevant to the task. Never use `--no-verify`.