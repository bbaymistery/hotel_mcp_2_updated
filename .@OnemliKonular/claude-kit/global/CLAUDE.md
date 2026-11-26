# Global working rules (all projects)

Talk to me in Turkish. Code, comments, commit messages and spec files stay in English.

## Workflow: spec → test → code
1. **Spec first.** For any feature or behavior change, write or update the spec before code:
   - If the repo has `openspec/`, use the OpenSpec proposal flow.
   - Otherwise write `docs/specs/<feature>.md`: goal, scope / non-goals, API or data changes, acceptance criteria, edge cases.
   - Stop and wait for my approval of the spec. Small bug fixes and pure refactors may skip this step; say that you are skipping it.
2. **Test first.** Write a failing test that encodes an acceptance criterion, run it, and show it fails for the right reason.
3. **Then code.** Make the smallest change that turns the test green. No speculative features.
4. **Verify.** Run typecheck, lint (if configured) and tests yourself. Never claim "done" or "fixed" without command output that proves it.

## Tickets
- Work from a ticket (`tickets/NNN-*.md`) when one exists. Stay inside its scope; list anything out of scope under "Follow-ups" instead of doing it.
- One ticket = one branch / worktree = one focused diff.

## Code quality
- Follow existing patterns in the repo before inventing new ones.
- Validate input at boundaries (zod or the project's equivalent). Never trust webhook or API payloads.
- No secrets in code, logs or commits. Read config from env.
- Edit files with the Edit/Write tools, not sed/echo, so the project's hooks see the change.

## Git
- Never commit, push, merge or rewrite history unless I ask.
- Never skip hooks (`--no-verify`) or disable tests to get green.
- Conventional commits: `feat:`, `fix:`, `test:`, `refactor:`, `docs:`, `chore:`.

## When done, report
- What changed (files), which acceptance criteria are covered by which tests
- Verification output (pass/fail counts)
- Risks, assumptions, follow-ups
