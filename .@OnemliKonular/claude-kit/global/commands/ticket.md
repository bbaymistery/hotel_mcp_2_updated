---
description: Turn a one-line request into a small, verifiable ticket file in tickets/
argument-hint: "<short description of the task>"
allowed-tools: Read, Write, Glob, Grep
---

Create a ticket for: $ARGUMENTS

1. Look at `tickets/` to find the next number (NNN, zero-padded). Use `tickets/TEMPLATE.md` if it exists.
2. Read just enough of the codebase to name the real files, functions and test locations involved.
3. Write `tickets/NNN-<kebab-slug>.md`. Keep it small enough that one agent can finish it in one session
   (about 1–3 files of production code plus tests). If it is bigger, split it into several tickets and say so.
4. Acceptance criteria must be testable (Given / When / Then), and each one must name the test file that will prove it.
5. Do not implement anything. Print the ticket path(s) and a one-line summary of each.
