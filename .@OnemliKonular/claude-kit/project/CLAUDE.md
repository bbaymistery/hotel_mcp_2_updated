# hotel-booking-mcp — project rules

Global rules (spec → test → code, verify, git) come from `~/.claude/CLAUDE.md`. This file adds project specifics only.

## Stack
- Backend: Node + TypeScript (ESM), Express 5, Prisma 7 on PostgreSQL (Neon), zod, MCP SDK (`@modelcontextprotocol/sdk`)
- Frontend: `client/`, React 19 + Vite 6
- Tests: Vitest (`tests/unit`, `tests/integration`, `tests/api`, `tests/mcp`)

## Commands
| Task | Command |
|---|---|
| Typecheck (backend) | `npx tsc --noEmit` |
| Typecheck (client) | `npx tsc --noEmit -p client` |
| All tests | `npm test` |
| One test file | `npx vitest run tests/unit/<file>.test.ts` |
| API dev server | `npm run start:dev` |
| Client dev | `npm run dev:client` |
| MCP server (stdio) | `npm run build && npm run start:mcp` |

## Layout
- `src/api/routes/*.router.ts`: HTTP routes, thin; delegate to services
- `src/services/*.service.ts`: business logic (availability, booking, webhook, chat)
- `src/models/`: data access; `src/schemas/`: zod input schemas
- `src/tools/*.tool.ts`: MCP tools (`check-availability`, `book-room`)
- `src/webhooks/`: webhook sending and the simulated receiver
- Specs: `openspec/` (OpenSpec) and `docs/hotel-booking-spec.md`; tickets: `tickets/`

## Project rules
- Money is integer minor units; use `src/utils/money.ts`, never floats.
- Dates are validated by `src/schemas/date.schema.ts`; check-out must be after check-in; no overlapping bookings for one room.
- Every new route or MCP tool validates input with a zod schema in `src/schemas/` and has a test in `tests/api` or `tests/mcp`.
- Errors go through `src/errors/app-error.ts` and the error-handler middleware; never leak stack traces to clients.
- Do not modify `prisma/migrations/` by hand; create a new migration.
- `.env` holds secrets (DB URL, Gemini key). Never print, commit or copy it into code.
