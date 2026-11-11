# SQLAM Dunk — Implementation Documentation

Complete implementation reference, from low-level engine internals up through high-level product design and tech stack.

## 1. Tech stack

| Layer | Tool | Role |
|---|---|---|
| Framework | Next.js 16 (App Router) | Pages, routing, metadata, static export |
| Runtime | React 19 | UI components |
| Styling | Tailwind CSS v4 | Utility-first CSS |
| SQL engine | DuckDB-WASM (`@duckdb/duckdb-wasm`) | Browser-local analytical SQL, no backend |
| Auth | Supabase (`@supabase/ssr`, `@supabase/supabase-js`) | Email/password auth + progress metadata |
| Analytics | `@vercel/analytics` | Page-view analytics (production only) |
| Package manager | pnpm | Dependency management |
| Build | Next.js `output: 'export'` | Static HTML export for Cloudflare Pages |
| Language | TypeScript | Type safety across the codebase |

## 2. High-level architecture

```
Browser
  └─ Next.js App Router + React client components
      ├─ app/page.tsx           Landing page + top-level screen state
      ├─ components/auth-panel.tsx  Supabase login/sign-up/session/sign-out
      └─ components/case-workspace.tsx  SQL investigation workspace
          ├─ lib/case-001-data.ts    21 challenges + chapter metadata
          ├─ lib/campaign-data.ts    Chapter re-exports
          ├─ lib/campaign-sql.ts     Query guard, setup SQL, evaluation
          ├─ lib/duckdb-engine.ts    DuckDB-WASM lifecycle + query runner
          └─ lib/supabase-browser.ts Browser Supabase client factory

Static CSV data → public/data/*.csv  (games, teams, players, player_game_stats)
                ↓
          DuckDB-WASM tables (schema-scoped views per game)
```

Top-level screen state lives in `app/page.tsx`:

```
investigating = false  → Home (landing)
investigating = true   → CaseWorkspace
user = null            → guest mode
user != null           → authenticated mode
```

## 3. Low-level: DuckDB-WASM engine (`lib/duckdb-engine.ts`)

- `getDatabase()` initializes DuckDB once as a singleton promise and reuses it.
- Startup sequence:
  1. Selects a DuckDB-WASM bundle from jsDelivr.
  2. Spawns a Web Worker and instantiates DuckDB.
  3. Fetches the four CSVs from `/data/{table}.csv` and registers them as file text.
  4. Runs `datasetSetupSql()` which creates an `evidence_vault` schema with real tables, plus one `scope_gN` schema per game (1–7) containing read-only views filtered to `game_id <= current game`.
  5. Validates row counts against `datasetCounts` (`games: 7`, `teams: 2`, `players: 28`, `player_game_stats: 182`).
  6. Drops the CSV files and applies lockdown settings (`enable_external_access = false`, `lock_configuration = true`).
- `runSql(sql, allowedThroughGame = 7)`:
  1. Runs `guardQuery(sql)` to reject unsafe SQL.
  2. Sets `search_path` to the appropriate `scope_gN` schema so future games are invisible.
  3. Executes the query and converts the Arrow result to `{ columns, rows }`.
  4. Closes the connection.

## 4. Low-level: Query guard & evaluation (`lib/campaign-sql.ts`)

### Query safety (`guardQuery`)
- Strips comments and string literals, then splits on `;`.
- Rejects multiple statements (one query at a time).
- Requires the query to start with `SELECT` or `WITH`.
- Blocks write keywords: `INSERT`, `UPDATE`, `DELETE`, `CREATE`, `DROP`, `ALTER`, `ATTACH`, `COPY`, `EXPORT`, `IMPORT`, `INSTALL`, `LOAD`, `PRAGMA`, `SET`, `RESET`, `CALL`, `USE`, `CHECKPOINT`, `VACUUM`, `TRUNCATE`, `MERGE`, `PREPARE`, `EXECUTE`.
- Blocks file/dynamic functions: `read_\w+`, `query_table`, `parquet_*`, `getvariable`, `getenv`, etc.
- Blocks references to `evidence_vault` and `scope_g\d` internal schemas.

### Evaluation (`evaluateAttempt`)
Runs the user's query and the reference solution, then compares via `compareResults`:
- Exact column match (no missing, no extra).
- Exact row count match.
- Value match using normalized comparison (numbers to 6 decimals, dates trimmed, NULL handling).
- Sort order check when `expectedOutput.sortBy` is defined.
- Required concept check via regex patterns (`WHERE`, `JOIN`, `GROUP BY`, `HAVING`, `CASE`, `WITH`, `RANK`, `LAG`, `RUNNING SUM`, etc.).

A query returning the right data but not using the required concept is rejected with a teaching message.

### Data scoping
Each challenge has `allowedThroughGame` (1–7). The search path restricts visible tables to `scope_g{allowedThroughGame}`, so a Game 3 query cannot see Game 4+ data. Future-game references are detected via `mentionedFutureGame` and reported as invalid evidence.

## 5. Curriculum data (`lib/case-001-data.ts`)

**21 challenges across 7 chapters (games), 3 per game:**

| Game | Chapter | Concepts |
|---|---|---|
| Game 1 | The Statement | SELECT, FROM, Specific columns, Simple WHERE |
| Game 2 | The Blowout | WHERE + AND, ORDER BY, ORDER BY + LIMIT |
| Game 3 | The Stand | COUNT, SUM, AVG + ROUND |
| Game 4 | The Brink | GROUP BY, HAVING, CASE |
| Game 5 | Elimination Night | INNER JOIN, LEFT JOIN, Multi-table queries |
| Game 6 | Force a Seventh | CTEs, Comparisons, Benchmarks |
| Game 7 | The Comeback Complete | RANK, LAG, Running SUM, Capstone |

Each challenge defines: title, briefing, objective, task, learning objective, starter query, 3 hint levels, explanation, expected output (columns, row count, optional sort), required concepts, solution SQL, and `allowedThroughGame`.

Progression rule: challenge N unlocks when challenge N−1 is solved. A chapter (game) is complete when all 3 challenges are solved, unlocking the next game.

## 6. Reward & hint economy (`components/case-workspace.tsx`)

**Coins by challenge band:**
- Challenges 1–3: 50 coins
- Challenges 4–6: 75 coins
- Challenges 7–9: 100 coins
- Challenges 10+: 125 coins

**XP:** 150 per solved challenge, plus a 100-point bonus for completing all 21. Re-solving does not pay out again.

**Rank:** Data Explorer under 750 XP; Performance Analyst at 750+.

**Hints:**
- Hint 1 (concept nudge): free
- Hint 2 (query structure): 25 coins
- Hint 3 (fill-in-the-blanks outline): 60 coins

Paid hints require authentication. Hint usage and coin balance are tracked per account.

## 7. Authentication & persistence (`components/auth-panel.tsx`, `components/case-workspace.tsx`)

Supabase browser client created via `createBrowserClient`. On mount:
- `auth.getUser()` restores the current session.
- `auth.onAuthStateChange()` propagates login/logout to the parent page.

Authenticated progress is stored in `user_metadata.sqlam_dunk_progress` on the signed-in Supabase user:

```json
{
  "solved": [1, 2, 3],
  "journal": [{ "challenge": 0, "query": "...", "at": "..." }],
  "career": { "xp": 450, "completed": false, "currency": 150, "hintsUsed": 1, "queriesRun": 5 }
}
```

On login, the workspace hydrates solved challenges, journal, and career from metadata. On solve/hint/reset, it writes back to both `localStorage` (immediate UI continuity) and Supabase (cross-device persistence).

Guest mode writes to `localStorage` only (`sqlam-dunk-case-001-progress`, `sqlam-dunk-career`). Guest progress is **not restored after a reload** — a known, deliberate limitation.

The `AuthUser` identity is `{ id, email? }`. The user ID is the ownership boundary; one user's progress must never be read from or written to another user's identity.

## 8. State flow (SQL execution)

```
User clicks Run SQL (or Ctrl/Cmd + Enter)
  │
  ▼
execute()
  ├─ guardQuery(query)              → reject unsafe SQL
  ├─ getDatabase()                  → singleton DuckDB-WASM
  ├─ searchPathSql(allowedThroughGame) → scope to current game
  ├─ DuckDB connection.query(query) → Arrow result
  ├─ arrowToResult()                → { columns, rows }
  ├─ evaluateAttempt()              → compare vs expected + required concepts
  │   ├─ ok  → mark solved, award XP/coins, persist, unlock next
  │   └─ not ok → show retry feedback (wrong columns, count, values, order, or missing concept)
  │
  ▼
Update UI (result table, feedback, journal, progress bar)
```

Connections are opened and closed per query. The database itself is a long-lived singleton.

## 9. Security model

- **Identity boundary:** Supabase authenticated user ID.
- **Client-side state is not authoritative:** DuckDB results and client XP/coin state are user-controlled in the browser.
- **Dataset is public read-only curriculum content.** Player-specific values (solved, XP, coins) live in Supabase user metadata scoped by `user_id`.
- **Hardening path (not yet implemented):** dedicated `player_progress` table with RLS (`auth.uid() = user_id`), server-side reward transactions, immutable coin ledger, and normalized query-attempt ledger.

See `README.md` security notes for the recommended production schema and RLS policies.

## 10. Testing

`scripts/test-campaign.ts` runs in Node with the DuckDB blocking bundle:
- Loads CSVs, runs setup, validates counts.
- Executes all 21 challenge solutions and checks columns, rows, values, sort, concepts, near-miss rejection, future-game leak prevention.
- Verifies blocked queries are rejected and allowed queries pass.
- Writes `audit/curriculum-audit.json` and `audit/challenge-solutions.json`.

Run: `pnpm test` → expect `Challenges: 21/21 passed`.

## 11. Deployment target

Static export hosted on Cloudflare Pages:

```
https://sqlam-dunk.pages.dev
```

Required build-time env vars (set in Cloudflare Pages → Variables and Secrets, both Production and Preview):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL`

Build command: `pnpm build`; output directory: `out`.
