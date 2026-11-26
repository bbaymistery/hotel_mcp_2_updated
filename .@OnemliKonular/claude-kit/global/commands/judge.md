---
description: Cross-vendor review (judge models) of the current branch: Claude code-reviewer + Codex + Gemini
argument-hint: "[base-branch, default main]"
allowed-tools: Bash, Read, Grep, Glob, Task
---

Run a multi-vendor review of the current branch. Base branch: `$ARGUMENTS` (if empty, use `main`).
Do NOT edit any files during this command.

1. Save the diff: `git diff <base>...HEAD > .claude/judge-diff.patch` and also append uncommitted changes with `git diff >> .claude/judge-diff.patch`.
   If the diff is empty, stop and say so.

2. Run these three reviews (in parallel where possible):
   a. **Claude:** use the `code-reviewer` subagent.
   b. **Codex (OpenAI),** if `codex` is on PATH:
      `codex exec --sandbox read-only "You are a strict code reviewer. Review the changes in .claude/judge-diff.patch against the ticket in tickets/ or spec in openspec/ or docs/specs/. List only concrete bugs, security issues and missing tests as: severity | file:line | finding. End with APPROVE or REQUEST CHANGES."`
   c. **Gemini (Google),** if `gemini` is on PATH:
      `cat .claude/judge-diff.patch | gemini -p "You are a strict code reviewer. Review this diff. List only concrete bugs, security issues and missing tests as: severity | file:line | finding. End with APPROVE or REQUEST CHANGES."`
   If a CLI is missing or fails, note "not run: <reason>". Never pretend it ran.

3. Merge the results into one table:
   | Finding | Claude | Codex | Gemini | Your assessment (valid / false positive + why) |
   Verify each finding against the actual code before calling it valid.

4. Final verdict: APPROVE only if no valid blocker/major findings remain. List what must be fixed before merge.
5. Delete `.claude/judge-diff.patch`.
