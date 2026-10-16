# SQLAM Dunk

SQLAM Dunk is an interactive SQL learning game built around the 2016 NBA Finals. Players investigate historical basketball data, write SQL queries, validate evidence, unlock challenges, earn XP and coins, and purchase progressively more detailed hints.

The project is a Next.js 16 App Router application with a browser-local DuckDB analytics engine and Supabase email/password authentication.

## 1. Product Summary

The application turns a SQL curriculum into a game-like investigation workflow:

1. A player opens Case 001, “The 3–1 Comeback.”
2. The player selects a chronological challenge.
3. The UI provides a prompt, starter query, available tables, concepts, and expected output metadata.
4. The player runs SQL against the embedded NBA dataset.
5. The query is guarded, scoped to the currently unlocked game, executed in DuckDB-WASM, and evaluated against the challenge contract.
6. A correct answer unlocks the next challenge and rewards XP and coins.
7. The first hint is free; later hint levels cost increasing amounts of coins.
8. Authenticated progress is associated with the signed-in Supabase user.

## 2. Architecture at a Glance

```text
Browser
  |
  | Next.js App Router + React client components
  v
app/page.tsx
  |
  +--> Home landing page
  |      +--> AuthPanel
  |      +--> CaseWorkspace
  |
  +--> CaseWorkspace
         |
         +--> campaign-data.ts / case-001-data.ts
         |      Challenge definitions and curriculum metadata
         |
         +--> campaign-sql.ts
         |      Query guard, SQL scope, expected result helpers
         |
         +--> duckdb-engine.ts
         |      DuckDB-WASM initialization and query execution
         |
         +--> Supabase browser client
                Authentication and per-user progress metadata

Static CSV data
  public/data/*.csv
         |
         v
DuckDB-WASM tables
  games, players, teams, player_game_stats
```

## 3. High-Level Design (HLD)

### 3.1 Presentation Layer

The presentation layer is composed of React components rendered by the Next.js App Router:

- `app/page.tsx` is the application entry point.
- The landing page introduces the product, roadmap, curriculum, and featured case.
- `components/auth-panel.tsx` owns the login, sign-up, session listener, and sign-out UI.
- `components/case-workspace.tsx` owns the investigation experience, including challenge navigation, SQL editing, query execution, hints, progress, rewards, and completion states.

The page maintains the top-level user and screen state:

```text
investigating = false -> Home
investigating = true  -> CaseWorkspace
user = null           -> guest mode
user != null          -> authenticated mode
```

### 3.2 Authentication and Identity

Supabase Auth provides email/password authentication. The browser client:

- Creates a Supabase client using `@supabase/ssr`.
- Calls `auth.getUser()` on mount to restore the current session.
- Subscribes to `auth.onAuthStateChange()` so login and logout immediately update the UI.
- Uses `signInWithPassword()` for login.
- Uses `signUp()` with the configured callback URL for registration.
- Uses `signOut()` to clear the session.

The authenticated user is represented in the UI by a small identity object:

```ts
type AuthUser = {
  id: string
  email?: string
}
```

The user ID is the ownership boundary. A user's progress must never be read from or written to another user's identity.

### 3.3 Analytics Execution Layer

SQL runs in the browser through DuckDB-WASM rather than through a remote SQL API.

At startup, the engine:

1. Selects a DuckDB-WASM bundle.
2. Creates a worker and initializes DuckDB.
3. Downloads the CSV datasets from `/public/data`.
4. Registers the files with DuckDB.
5. Creates the relational tables using the setup SQL.
6. Validates row counts against expected dataset counts.
7. Applies lockdown/search-path settings where supported.
8. Reuses the initialized database through a singleton promise.

This makes query execution fast, private to the current browser session, and suitable for an educational sandbox.

### 3.4 Curriculum and Progression Layer

Challenges are defined as data rather than hard-coded individually in the UI. Each challenge contains concepts such as:

- Prompt and learning objective
- Starter query
- Expected columns and row count
- Correct solution
- Required SQL concepts
- Hint levels
- Maximum historical game available to the query
- Explanation shown after success

The workspace calculates availability from solved challenge IDs:

```text
Challenge 1 is available initially.
Challenge N is available when Challenge N - 1 is solved.
A chapter is complete when all of its challenges are solved.
The next chapter becomes available after chapter completion.
```

### 3.5 Reward and Hint Economy

The reward schedule increases by challenge band:

- Challenges 1–3: 50 coins each
- Challenges 4–6: 75 coins each
- Challenges 7–9: 100 coins each
- Challenges 10+: 125 coins each

XP is derived from progression and is monotonic for a user. Re-solving a challenge does not award duplicate coins.

Hint costs increase by level:

- Hint 1: free
- Hint 2: 25 coins
- Hint 3: 60 coins

The model is intentionally simple for a learning game: users earn currency by solving challenges, then spend it to reduce friction when stuck.

## 4. Low-Level Design (LLD)

### 4.1 `app/page.tsx`

Responsibilities:

- Defines the landing page and marketing content.
- Stores whether the user is in the investigation workspace.
- Stores the current authenticated user.
- Passes `user` and `onUser` to `AuthPanel`.
- Passes `user` and `onExit` to `CaseWorkspace`.

Important design choice: the page does not own SQL state or progress calculations. Those concerns stay inside the workspace component.

### 4.2 `components/auth-panel.tsx`

Responsibilities:

- Displays login/sign-up modal.
- Validates basic browser form requirements (`email`, minimum password length).
- Reports generic authentication failures to the user.
- Restores existing sessions.
- Propagates auth state changes to the parent page.
- Signs users out.

Main state:

```text
supabase: browser client or null
open: whether the modal is visible
mode: login | signup
email: form email
password: form password
message: user-facing status
busy: submit state
```

The Supabase redirect URL is selected from `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL`, with a browser-origin callback fallback.

### 4.3 `components/case-workspace.tsx`

Responsibilities:

- Tracks active challenge.
- Executes SQL.
- Displays result tables.
- Loads authenticated progress.
- Persists challenge attempts and solved state.
- Awards XP and coins.
- Charges for hints.
- Unlocks chapters and challenges.
- Shows completion and feedback states.

Core state:

```ts
type Career = {
  xp: number
  completed: boolean
  currency: number
  hintsUsed: number
  queriesRun: number
}

type JournalEntry = {
  challenge: number
  query: string
  at: string
}
```

The workspace resets its transient state when the authenticated user changes. It then loads that user's saved progress if available.

### 4.4 SQL Execution Flow

```text
User clicks Run SQL
  |
  v
runSql(query, allowedThroughGame)
  |
  +--> guardQuery(query)
  |      Reject unsafe or unsupported SQL
  |
  +--> getDatabase()
  |      Initialize or reuse DuckDB-WASM
  |
  +--> searchPathSql(allowedThroughGame)
  |      Restrict visible historical data
  |
  +--> DuckDB connection.query(query)
  |
  +--> Arrow result conversion
  v
QueryResult
  |
  v
Evaluate against challenge expected output
```

A challenge is only considered solved when the returned result satisfies the challenge's structural and semantic requirements. A query returning data is not automatically correct.

### 4.5 Persistence Flow

Authenticated progress is stored in the signed-in Supabase user's metadata under:

```text
sqlam_dunk_progress = {
  solved: number[],
  journal: JournalEntry[],
  career: Career
}
```

The application also keeps a local browser fallback for guest progress and immediate UI continuity. Guest progress is device-local and is not credited with XP or coins until the player authenticates.

When authenticated:

```text
Successful login
  -> getUser()
  -> read sqlam_dunk_progress
  -> hydrate workspace state

Successful query/hint/reset
  -> update local state
  -> update local fallback storage
  -> update Supabase user progress metadata

Logout
  -> Supabase session ends
  -> parent user becomes null
  -> workspace resets to guest state
```

### 4.6 Query Safety

The SQL layer uses several controls:

- A query guard rejects unsupported or dangerous statements.
- Queries are executed in a browser-local analytical database.
- The visible data scope is restricted according to the challenge's `allowedThroughGame` value.
- Future-game references are detected and reported as invalid evidence.
- The database is initialized from validated CSV files.
- Connections are closed after each query.

This is appropriate for an educational client-side sandbox. It should not be treated as a secure environment for secrets or authoritative financial state because users control their browser.

## 5. Project Structure

```text
.
├── app/
│   ├── globals.css              Global Tailwind/CSS styles
│   ├── layout.tsx               Root layout, metadata, fonts, analytics
│   └── page.tsx                 Landing page and top-level screen state
├── components/
│   ├── auth-panel.tsx           Supabase login, sign-up, session, logout
│   ├── case-workspace.tsx       SQL investigation workspace
│   └── ui/button.tsx            Shared UI button primitive
├── lib/
│   ├── campaign-data.ts         Campaign exports and chapter helpers
│   ├── campaign-sql.ts          Query guard, setup SQL, evaluation helpers
│   ├── case-001-data.ts         Case 001 challenges, metadata, solutions
│   ├── duckdb-engine.ts         DuckDB-WASM lifecycle and query runner
│   ├── supabase-browser.ts      Browser Supabase client factory
│   └── utils.ts                 Shared class-name utility
├── public/
│   └── data/
│       ├── games.csv
│       ├── player_game_stats.csv
│       ├── players.csv
│       └── teams.csv
├── audit/
│   ├── challenge-solutions.json Curriculum answer audit data
│   └── curriculum-audit.json    Curriculum validation data
├── scripts/
│   └── test-campaign.ts         Automated campaign/data checks
├── next.config.mjs              Next.js configuration
├── package.json                 Scripts and dependencies
└── pnpm-lock.yaml               Reproducible dependency lockfile
```

## 6. Data Model

The analytical dataset is relational and contains four primary tables:

```text
teams
  team identity and labels

players
  player identity and team-related attributes

games
  game number, date, teams, score, and game metadata

player_game_stats
  player-level statistics for a player in a specific game
```

The application joins these tables to support questions about scoring, rebounds, assists, shooting, player performance, and game-level outcomes.

The learner does not directly modify the dataset. Queries are read-only analytical operations against the imported CSV data.

## 7. Runtime and Deployment

The project is a Next.js application and can be hosted on platforms that support Next.js static/client execution and the required environment variables. The currently referenced hosted deployment is:

```text
https://c9bddcc3.sqlam-dunk.pages.dev
```

Required public configuration:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL
```

The Supabase publishable/anonymous key is safe for browser use when database policies are correctly configured. Never expose a Supabase service-role key in client code or `NEXT_PUBLIC_*` variables.

## 8. Security and Data-Isolation Notes

The identity boundary is the Supabase authenticated user ID. For production-grade user data isolation, progress should be stored in a dedicated table such as:

```sql
create table public.player_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  solved integer[] not null default '{}',
  journal jsonb not null default '[]',
  xp integer not null default 0,
  coins integer not null default 0,
  hints_used integer not null default 0,
  updated_at timestamptz not null default now()
);
```

That table should have RLS policies of the form:

```sql
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id)
```

The client-side DuckDB dataset is intentionally shared as read-only curriculum content. Player-specific values such as solved challenges, XP, coins, and hint usage must be scoped by `user_id` and must not be treated as trusted client input.

For a hardened production economy, reward and hint mutations should move to server-side transactions or security-invoker RPCs, use an immutable reward ledger, reject duplicate rewards, and validate all increments server-side. The current implementation is suitable for an educational prototype but browser state can always be modified by a determined user.

## 9. Key Trade-offs

### Browser-local DuckDB instead of a remote query service

Advantages:

- No query latency to a backend.
- No database hosting required for curriculum data.
- Keeps educational queries isolated to the learner's browser.
- Easy to reset and deterministic for demonstrations.

Trade-offs:

- The dataset is public and downloadable.
- CPU and memory are limited by the browser.
- Query execution is not authoritative for anti-cheat purposes.

### Supabase user metadata for progress

Advantages:

- Minimal schema and implementation overhead.
- Progress follows the account across devices.
- Works naturally with Supabase Auth.

Trade-offs:

- JSON metadata is less queryable than a normalized table.
- Server-side reward validation is limited.
- A dedicated progress table is preferable as the number of cases and analytics features grows.

### React client state for the workspace

Advantages:

- Fast interaction and simple challenge transitions.
- No server round trip for every query.
- Clear separation between curriculum data and UI state.

Trade-offs:

- State is reset when the browser session or authenticated identity changes.
- Persistence must be carefully synchronized.
- Client-side state is not a security boundary.

## 10. Testing Strategy

Run the campaign validation script:

```bash
pnpm test
```

Run a production build:

```bash
pnpm build
```

Manual acceptance checks:

1. Create a new account.
2. Confirm the email if the Supabase project requires confirmation.
3. Log in and verify the email appears in the navigation.
4. Solve a challenge and verify XP/coins change.
5. Log out and verify authenticated progress is no longer displayed as the active user's career.
6. Log in as a second account and verify the second account has independent progress.
7. Verify hint 1 is free.
8. Verify hint 2 and hint 3 require coins and charge the correct increasing cost.
9. Verify locked challenges remain unavailable until their prerequisites are solved.
10. Refresh the page and verify the authenticated user's progress is restored.

## 11. Interview Discussion Guide

### Why Next.js?

Next.js provides the application shell, routing conventions, metadata support, and a production-ready React runtime. The current user experience is primarily client-interactive, which makes client components appropriate for the game workspace.

### Why DuckDB-WASM?

DuckDB provides a real SQL engine rather than a hand-written query simulator. WASM allows it to run in the browser, making the educational experience responsive and reducing backend infrastructure for static curriculum data.

### How is progression enforced?

Progression is derived from solved challenge IDs. A challenge is available only if it is the first challenge or its predecessor has been solved. Chapter completion is computed from the chapter's challenge ID list.

### How would you scale this product?

I would separate curriculum data from player state, add a database-backed `player_progress` table with RLS, move reward mutations behind server-side transactions, add a normalized query-attempt ledger, and introduce a case catalog with versioned challenge definitions. I would also add automated browser tests for authentication, isolation, hint purchases, and logout behavior.

### What is the most important security caveat?

Anything executed in the browser is user-controlled. DuckDB query results and client-side reward state are therefore not authoritative. Authentication and RLS protect account data, but authoritative XP, coin grants, and purchases need server-side validation if the economy has real value.

## 12. Future Improvements

- Dedicated `player_progress` and `query_attempts` tables with RLS.
- Server-side reward transactions and an immutable coin ledger.
- Rate limiting for authentication and reward endpoints.
- Automated Playwright/agent-browser end-to-end tests.
- More cases and a versioned case registry.
- Server-side challenge evaluation for competitive or credentialed learning modes.
- Accessibility audit for keyboard navigation, focus management, and screen-reader announcements.
- Offline dataset caching with explicit cache invalidation.
- Observability for query failures, auth failures, and progress synchronization conflicts.

## 13. Local Development

Install dependencies:

```bash
pnpm install
```

Start the development server:

```bash
pnpm dev
```

The application uses the Next.js development server and expects Supabase public environment variables to be available in the project environment.

## 14. Summary

SQLAM Dunk is structured as a client-first SQL learning application with three major systems:

1. A Next.js/React presentation and game state layer.
2. A browser-local DuckDB-WASM analytical execution layer.
3. A Supabase identity and progress persistence layer.

The architecture favors fast, deterministic educational interactions while keeping the curriculum data simple and inspectable. The next architectural step for production hardening is moving player progress and reward mutations into a dedicated RLS-protected database model with server-side validation.

---

## License and Attribution

SQLAM Dunk is an independent educational project and is not affiliated with the NBA or its teams. Historical basketball data is used for educational analysis.
