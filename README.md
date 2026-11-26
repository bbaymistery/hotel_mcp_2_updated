# Hotel Booking MCP Server & Full-Stack Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![MCP SDK](https://img.shields.io/badge/MCP%20SDK-1.6.1-orange.svg)](https://modelcontextprotocol.io/)
[![Prisma](https://img.shields.io/badge/Prisma-7.10-2D3748.svg)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/Neon-PostgreSQL-00E599.svg)](https://neon.tech/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB.svg)](https://react.dev/)
[![Gemini](https://img.shields.io/badge/Google-Gemini%202.5-8E75B2.svg)](https://ai.google.dev/)
[![Tests](https://img.shields.io/badge/Vitest-54%20passed-brightgreen.svg)](https://vitest.dev/)

A production-grade, enterprise-ready **Model Context Protocol (MCP)** server and full-stack reservation platform built with **TypeScript**, **Node.js**, **Prisma 7**, **Neon PostgreSQL** (with dual SQLite support), and the official **MCP TypeScript SDK**.

It provides AI agents (such as Claude Desktop, Cursor, Antigravity, or custom LLM bots) with deterministic, transactional tools to check availability and book hotel rooms with rock-solid guarantees against double-bookings, race conditions, and network failures.

---

## Table of Contents

- [Documentation & Architecture](#documentation--architecture)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [MCP Tools Reference](#mcp-tools-reference)
- [Core Engineering Guarantees](#core-engineering-guarantees)
- [REST API Endpoints](#rest-api-endpoints)
- [AI Chatbot Integration](#ai-chatbot-integration)
- [Frontend Client](#frontend-client)
- [MCP Client Setup (Claude Desktop / Cursor)](#mcp-client-setup-claude-desktop--cursor)
- [Quick Start & Installation](#quick-start--installation)
- [Running Tests](#running-tests)
- [Project Structure](#project-structure)
- [License](#license)

---

## Documentation & Architecture

- **[Geliştirici Rehberi (Türkçe)](docs/DEVELOPER-GUIDE-TR.md):** Proje mimarisi, veritabanı, rezervasyon akışı, outbox pattern ve backend kavramlarını açıklayan 10-15 dakikalık kapsamlı Türkçe rehber.
- **[Full Technical Specification (OpenSpec v1.2.1)](docs/hotel-booking-spec.md):** Data models, MCP tool schemas, half-open interval math, idempotency, retry policy, and testing strategy.
- **[System Architecture & Component Diagrams](docs/architecture.md):** Mermaid diagrams detailing service ownership, database transaction boundaries, and the at-least-once outbox pipeline.

---

## Key Features

- **Official MCP SDK Integration:** Implements `McpServer` with both **stdio transport** (`StdioServerTransport`) for desktop LLM agents and **remote streamable HTTP transport** (`StreamableHTTPServerTransport`) at `/mcp`.
- **Atomic Double-Booking Prevention:** Strict database transactions (PostgreSQL serializable/repeatable read with range exclusion & SQLite `BEGIN IMMEDIATE`) guarantee no two concurrent requests can reserve overlapping dates for the same room.
- **Half-Open Interval Scheduling:** Uses `[check_in, check_out)` date mathematics allowing seamless same-day turnover (Guest A checks out 2026-06-10, Guest B checks in 2026-06-10).
- **Idempotency with Canonical Payload Hashing:** Safeguards against duplicate reservations on network retries. Identical retries safely return previous booking confirmations (`is_idempotent_replay: true`), while altered payloads under the same key fail with `409 Conflict`.
- **Transactional Outbox Pattern:** Booking creation and webhook event persistence execute within the exact same ACID transaction.
- **At-Least-Once Webhook Delivery:** Automatic post-commit webhook dispatch with exponential backoff (`1s, 5s, 15s, 30s` across 5 attempts) and server startup crash recovery.
- **Type-Safe Currency Handling:** All monetary amounts are stored as integer minor units (USD cents) to eliminate floating-point calculation errors.
- **Google Gemini 2.5 AI Chatbot:** Built-in conversational booking assistant (`@google/genai`) equipped with MCP tools for real-time natural language reservations.
- **Full-Featured React 19 Frontend:** Modern SPA featuring interactive room browsing, live date-range availability search, visual booking wizard, and an AI chat assistant.
- **Extensive Test Coverage:** 15 test suites and 54 automated unit & integration tests covering concurrency, boundary conditions, outbox retries, and cross-platform REST-to-MCP synchronization.

---

## System Architecture

```mermaid
flowchart TD
    subgraph Clients["Clients & Agents"]
        Claude["Claude Desktop / Cursor<br/>(Stdio MCP Transport)"]
        WebClient["React 19 Frontend<br/>(Vite SPA)"]
        RemoteAgent["Remote MCP Client<br/>(Streamable HTTP /mcp)"]
    end

    subgraph Backend["Express 5 & MCP Server"]
        StdioMCP["MCP Stdio Server<br/>(src/index.ts)"]
        HttpAPI["Express REST API & HTTP MCP<br/>(src/api/server.ts)"]
        ChatService["Gemini AI Chat Service<br/>(src/services/gemini-chat.service.ts)"]
        BookingService["Booking Service<br/>(src/services/booking.service.ts)"]
        AvailService["Availability Service<br/>(src/services/availability.service.ts)"]
        OutboxWorker["Outbox Webhook Service<br/>(src/services/webhook.service.ts)"]
    end

    subgraph Storage["Database & Webhooks"]
        DB[("Neon PostgreSQL / SQLite<br/>(Prisma 7 ORM)")]
        WebhookReceiver["Simulated / External Webhook Receiver"]
    end

    Claude --> StdioMCP
    RemoteAgent -->|POST /mcp| HttpAPI
    WebClient -->|REST & Chat API| HttpAPI

    StdioMCP --> BookingService
    StdioMCP --> AvailService
    HttpAPI --> ChatService
    ChatService -->|MCP Tool Calls| StdioMCP
    HttpAPI --> BookingService
    HttpAPI --> AvailService

    BookingService -->|ACID Transaction| DB
    AvailService -->|Half-Open Overlap Query| DB
    OutboxWorker -->|Poll / Sweep Pending| DB
    OutboxWorker -->|At-Least-Once Retry| WebhookReceiver
```

---

## MCP Tools Reference

### 1. `check_availability`
Discovers available rooms for a given stay window and guest count.

- **Inputs (Zod validated):**
  - `check_in` (string, `YYYY-MM-DD`): Check-in date.
  - `check_out` (string, `YYYY-MM-DD`): Check-out date (must be strictly after `check_in`).
  - `guests` (integer, min 1): Number of guests.
- **Behavior:**
  - Excludes rooms in `MAINTENANCE` status.
  - Excludes rooms where `capacity < guests`.
  - Excludes rooms with overlapping confirmed bookings using half-open interval math `[check_in, check_out)`.
- **Output:** Array of available room objects with id, name, capacity, nightly rate, and total price formatted as `"$XX.XX USD"`.

### 2. `book_room`
Creates an atomic reservation for a specific room and customer.

- **Inputs (Zod validated):**
  - `room_id` (string): Target room identifier (e.g. `room_deluxe_101`).
  - `check_in` (string, `YYYY-MM-DD`): Check-in date.
  - `check_out` (string, `YYYY-MM-DD`): Check-out date.
  - `guests` (integer, min 1): Guest count.
  - `customer_name` (string, min 2 chars): Full name of the primary guest.
  - `customer_email` (string, valid email): Customer email address.
  - `idempotency_key` (optional string): Client-supplied idempotency key for safe retries.
- **Behavior:**
  - Validates room existence and operational status.
  - Re-verifies capacity and double-booking availability atomically inside an ACID transaction.
  - Performs canonical payload hashing (`SHA-256`) against existing idempotency records.
  - Creates or links the customer record.
  - Inserts a `CONFIRMED` booking record and stages an outbox event in the same transaction.
  - Triggers asynchronous post-commit webhook notification.
- **Output:** Complete booking confirmation containing `booking_id`, guest info, dates, total cost in cents and formatted USD, and `is_idempotent_replay` boolean.

---

## Core Engineering Guarantees

### 1. Half-Open Interval Overlap Formula
Room reservations adhere to the mathematical definition $[check\_in, check\_out)$:
$$\text{Overlap} \iff (\text{ExistingCheckIn} < \text{RequestedCheckOut}) \land (\text{ExistingCheckOut} > \text{RequestedCheckIn})$$
This allows consecutive bookings without artificial buffer days: check-out at 11:00 AM matches check-in at 3:00 PM on the same date.

### 2. Transactional Outbox Pattern
Direct dual-writes to both database and external HTTP webhooks are inherently fragile. To guarantee no events are lost:
1. `Booking` and `WebhookOutbox` records are inserted inside the **same database transaction**.
2. If the transaction commits, the event is guaranteed to be persisted.
3. An asynchronous worker dispatches the webhook. On failure, it reschedules with exponential backoff:
   - Attempt 1: immediate
   - Attempt 2: +1s
   - Attempt 3: +5s
   - Attempt 4: +15s
   - Attempt 5: +30s (max 5 attempts, then marks `FAILED`)
4. Upon server reboot, `recoverPendingEvents()` sweeps and dispatches any lingering events.

### 3. Canonical Payload Idempotency
When an `idempotency_key` is supplied:
- A canonical SHA-256 hash of the normalized request parameters is calculated.
- If the key exists with the **same hash**, the server returns the cached booking with `is_idempotent_replay: true`.
- If the key exists with a **different hash**, the server raises `409 IDEMPOTENCY_CONFLICT`.

---

## REST API Endpoints

The Express server (`src/api/server.ts`) exposes both REST endpoints and the remote MCP streamable transport:

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check with database connection status and server timestamp |
| `GET` | `/api/rooms` | Lists all hotel rooms and their current statuses |
| `GET` | `/api/availability` | Query params: `check_in`, `check_out`, `guests` |
| `POST` | `/api/bookings` | Creates a booking (accepts `Idempotency-Key` HTTP header) |
| `GET` | `/api/bookings/:id` | Retrieves booking details by ID |
| `POST` | `/api/chat` | AI conversation endpoint (invokes Gemini with MCP tools) |
| `ALL` | `/mcp` | Remote Streamable HTTP MCP Transport endpoint |

---

## AI Chatbot Integration

The server embeds **Google Gemini 2.5** via `@google/genai` with native Model Context Protocol tool calling.
- Users can converse naturally: *"Find me an ocean view room for 2 guests next weekend and book it under Alice Smith"*.
- The `GeminiChatService` dynamically discovers available MCP tools, routes function call requests directly to `check_availability` and `book_room`, verifies outputs, and replies with structured confirmations.

---

## Frontend Client

The `client/` directory contains a modern **React 19 + TypeScript + Vite** web interface:
- **Room Showcase:** High-resolution cards displaying amenities, capacity, and nightly rates.
- **Search & Availability:** Real-time date range picker and guest selector.
- **Booking Flow:** Instant booking confirmation with clear pricing breakdown.
- **Embedded AI Concierge:** Real-time chat drawer powered by the `/api/chat` MCP endpoint.

To run the frontend:
```bash
npm run dev:client
```
Runs at `http://localhost:5173` with automatic API proxying to `http://localhost:3001`.

---

## MCP Client Setup (Claude Desktop / Cursor)

### Claude Desktop Configuration

Add the following to your `claude_desktop_config.json` (Windows: `%APPDATA%\Claude\claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "hotel-booking": {
      "command": "node",
      "args": ["<ABSOLUTE_PATH_TO_PROJECT>/dist/src/index.js"]
    }
  }
}
```

> **Note:** The stdio server strictly redirects all logging and diagnostic output to `stderr`, keeping `stdout` reserved exclusively for clean JSON-RPC 2.0 frames.

### Remote HTTP Transport Configuration (e.g. Cursor / Antigravity / Custom Client)

Start the API server (`npm run start:api`) and point your MCP client to:
```
http://localhost:3001/mcp
```

---

## Quick Start & Installation

### 1. Prerequisites
- **Node.js**: `v20.x` or `v22.x`
- **npm**: `v10+`
- **Database**: Neon PostgreSQL connection URL (or local SQLite)

### 2. Environment Configuration
Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql://user:password@ep-sample.region.neon.tech/neondb?sslmode=require"
PORT=3001

# Optional: For Gemini AI Chatbot
GEMINI_API_KEY="your-gemini-api-key"
GEMINI_MODEL="gemini-2.5-flash"
```

### 3. Install Dependencies
```bash
npm install
npm install --prefix client
```

### 4. Database Setup & Seeding
```bash
# Push schema migrations
npm run db:migrate

# Seed sample room catalog
npm run db:seed
```

Default Seed Catalog:
- `room_deluxe_101`: Deluxe Ocean View King (capacity: 2, \$220.00/night)
- `room_queen_102`: Standard Double Queen (capacity: 4, \$160.00/night)
- `room_suite_201`: Presidential Penthouse Suite (capacity: 6, \$550.00/night)
- `room_cozy_301`: Single Urban Studio (capacity: 1, \$110.00/night)
- `room_maint_901`: Executive Suite in Maintenance (status: `MAINTENANCE`)

### 5. Running the Project

**Option A: Run Full-Stack Web App & REST API**
```bash
# Terminal 1: Start Express API & Remote MCP Server (port 3001)
npm run start:api

# Terminal 2: Start React Frontend (port 5173)
npm run dev:client
```
Visit `http://localhost:5173` in your browser.

**Option B: Run Standalone MCP Server (Stdio Transport)**
```bash
npm run build
npm start
```

---

## Running Tests

The test suite is powered by **Vitest** and includes comprehensive unit, integration, and concurrency scenarios:

```bash
npm test
```

### Test Coverage Highlights (54 tests across 15 suites):
- `tests/unit/strict-date-validation.test.ts`: ISO date parser, leap years, non-existent dates, out-of-range years (`2000-2099`).
- `tests/unit/money-calculation.test.ts`: Minor unit (cents) arithmetic, formatting, zero-drift guarantees.
- `tests/unit/hash.test.ts`: Canonical JSON stringification and SHA-256 payload reproducibility.
- `tests/integration/availability.test.ts`: Half-open overlap queries, capacity filters, maintenance exclusion.
- `tests/integration/booking-transaction.test.ts`: Atomic booking execution, customer reuse, outbox emission.
- `tests/integration/concurrency-double-booking.test.ts`: Parallel transaction race condition resolution.
- `tests/integration/idempotency.test.ts`: Replay verification and 409 conflict detection.
- `tests/integration/outbox-lifecycle.test.ts`: 5-attempt retry schedule and exponential backoff validation.
- `tests/integration/crash-recovery.test.ts`: Undelivered outbox event recovery on boot.
- `tests/integration/cross-platform.test.ts`: Proves bookings made via REST API immediately reflect in MCP queries.
- `tests/integration/chatbot-flow.test.ts`: End-to-end multi-turn conversation driving MCP tool calls to Neon PostgreSQL.
- `tests/mcp/mcp-stdio.test.ts`: Child-process stdio JSON-RPC 2.0 handshake and tool execution.

---

## Project Structure

```text
hotel-booking-mcp/
├── client/                     # React 19 + TypeScript + Vite SPA
│   ├── src/
│   │   ├── api/                # REST client & fetch utilities
│   │   ├── components/         # Room cards, date picker, chat drawer
│   │   ├── App.tsx             # Main interactive application
│   │   └── main.tsx            # React entry point
│   └── package.json
├── docs/                       # Technical architecture & specifications
│   ├── DEVELOPER-GUIDE-TR.md   # Comprehensive Turkish developer guide
│   ├── architecture.md         # Component diagrams & data flow
│   └── hotel-booking-spec.md   # OpenSpec v1.2.1 technical specification
├── prisma/                     # Database ORM
│   ├── schema.prisma           # Prisma schema (Room, Customer, Booking, Outbox)
│   └── seed.ts                 # Idempotent room catalog seed script
├── src/                        # Backend & MCP server codebase
│   ├── api/                    # Express REST API
│   │   ├── middleware/         # Error handling middleware
│   │   ├── routes/             # Rooms, bookings, availability, chat routes
│   │   ├── app.ts              # Express application factory
│   │   └── server.ts           # HTTP server bootstrap & /mcp transport
│   ├── config/                 # Environment & app configurations
│   ├── db/                     # Prisma & database connection helpers
│   ├── errors/                 # Domain-specific AppError hierarchy
│   ├── models/                 # Domain models
│   ├── schemas/                # Zod schemas for dates, rooms, bookings
│   ├── services/               # Core business services
│   │   ├── availability.service.ts
│   │   ├── booking.service.ts
│   │   ├── gemini-chat.service.ts
│   │   ├── mcp-client.service.ts
│   │   └── webhook.service.ts
│   ├── tools/                  # MCP tool definitions
│   │   ├── check-availability.tool.ts
│   │   └── book-room.tool.ts
│   ├── utils/                  # Minor currency, SHA-256 hash utilities
│   ├── index.ts                # Stdio MCP entry point
│   └── server.ts               # McpServer factory
├── tests/                      # Automated Vitest test suite
│   ├── api/                    # REST API integration tests
│   ├── integration/            # Transactions, outbox, concurrency, chatbot
│   ├── mcp/                    # Subprocess stdio JSON-RPC tests
│   └── unit/                   # Dates, money, hashing unit tests
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

---

## License

MIT License. Designed with best practices from the official Model Context Protocol (MCP) standard.
#   h o t e l _ m c p _ 2 _ u p d a t e d  
 