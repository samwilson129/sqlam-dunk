# SQLAM Dunk

SQLAM Dunk is an interactive SQL learning game built around the 2016 NBA Finals. You play as a junior analyst reconstructing the Cavaliers–Warriors Finals from the box score, one SQL query at a time.

The app is a Next.js 16 App Router site. SQL runs in your browser through DuckDB-WASM (no backend query service), and progress can be saved to a Supabase account.

## What it is

You open **Case 001 — "The 3–1 Comeback."** It covers all seven games of the 2016 Finals in chronological order. There are **21 challenges** (three per game), and each one teaches a specific SQL concept:

- Game 1: SELECT, FROM, WHERE
- Game 2: WHERE + AND, ORDER BY, ORDER BY + LIMIT
- Game 3: COUNT, SUM, AVG + ROUND
- Game 4: GROUP BY, GROUP BY + HAVING, CASE + GROUP BY
- Game 5: INNER JOIN, JOIN + GROUP BY, LEFT JOIN + IS NULL
- Game 6: CTEs, CTE comparison, CTE + JOIN + AVG
- Game 7: RANK, LAG + running SUM, capstone (CTEs + conditional aggregation)

For every challenge you get a manager briefing, a starter query, the tables and columns you can use, expected output metadata, and up to three hints. Write SQL, run it against the embedded dataset, and if the result matches the challenge contract the challenge unlocks and you earn XP and coins.

## Recently changed

These are the most recent fixes and additions (committed, not yet pushed at the time of writing):

- **Hero artwork captions fixed.** LeBron James and Kyrie Irving pixel art were swapped on the landing page. LeBron is now the red/wine jersey (#23) and Kyrie is the gold one, each under the right caption.
- **"Price" line removed.** The landing dateline used to read "Vol. 001 · The Finals Desk · Price." It now reads "Vol. 001 · The Finals Desk."
- **Data-driven masthead counts.** The "7 games · 4 tables" line is computed from the dataset rather than hard-coded.
- **Kyrie's card now reads "No. 2"** (matching his Cavaliers number).
- **Test reports added.** `test_reports/iteration_2.json` records a regression retest: 8 checks passed, 0 failed, 2 flaky (viewport/visibility timing races that passed on immediate rerun — not bugs). The two user fixes above re-passed, and no regressions were found.

## How it works

### The data

Four read-only tables are loaded from CSV files under `public/data/` into a browser-local DuckDB database:

| Table | Rows | What it holds |
|---|---|---|
| `games` | 7 | Finals game IDs and dates |
| `teams` | 2 | Cleveland Cavaliers and Golden State Warriors |
| `players` | 28 | Player directory for both rosters |
| `player_game_stats` | 182 | Box-score and plus-minus records |

Queries are read-only. The engine guards against `INSERT`, `UPDATE`, `DELETE`, `DROP`, `ATTACH`, `COPY`, `PRAGMA`, and similar, and each challenge is scoped so you can only see games up to the current one.

### Running a query

1. Pick the next available challenge (challenges unlock sequentially).
2. Read the briefing and objective, look at the evidence board (which tables are in scope and how many rows).
3. Type SQL in the console and hit **Run query** (or `Ctrl`/`Cmd` + `Enter`).
4. Your result is compared to the expected output — columns, row count, values, and sort order all matter.
5. If it matches, the challenge is marked solved and you move on.

### Progression and rewards

- Challenge 1 is open from the start; challenge N unlocks when N−1 is solved.
- A chapter (game) is complete when all three of its challenges are solved, which unlocks the next game.
- Coins by challenge band: 50 (1–3), 75 (4–6), 100 (7–9), 125 (10+). Re-solving does not pay out again.
- XP is 150 per solved challenge, plus a 100-point bonus when you finish all 21.
- Rank: "Data Explorer" under 750 XP, "Performance Analyst" at 750+.

### Hints

- Hint 1 (concept nudge): free.
- Hint 2 (query structure): 25 coins.
- Hint 3 (fill-in-the-blanks outline): 60 coins.
- The first hint is always free; paid hints require you to be logged in.

### Accounts and progress

Supabase handles email/password authentication. When you log in:

- Your progress (`solved`, `journal`, `career`) is read from `user_metadata.sqlam_dunk_progress` on the signed-in user.
- Solving challenges, using hints, and resetting write back to that same metadata.
- Logging out resets the workspace to guest state.

Guest mode works without an account. Progress is written to `localStorage` on this device, but — and this is a known, deliberate limitation — it is **not loaded back after a reload**. To keep progress across sessions, create an account and stay signed in.

## Project layout

```
.
├── app/
│   ├── globals.css          Global styles (Tailwind v4)
│   ├── layout.tsx           Root layout, metadata, fonts, analytics
│   └── page.tsx             Landing page + top-level screen state
├── components/
│   ├── auth-panel.tsx       Supabase login / sign-up / session / sign-out
│   ├── case-workspace.tsx   SQL investigation workspace (game loop)
│   └── ui/button.tsx        Shared button primitive
├── lib/
│   ├── campaign-data.ts     Campaign re-exports (chapters, challenges)
│   ├── campaign-sql.ts      Query guard, setup SQL, evaluation, scoring
│   ├── case-001-data.ts     Case 001: chapters, all 21 challenges, solutions
│   ├── duckdb-engine.ts     DuckDB-WASM lifecycle + query runner
│   ├── supabase-browser.ts  Browser Supabase client factory
│   └── utils.ts             Class-name helper (cn)
├── public/
│   ├── data/                games.csv, teams.csv, players.csv, player_game_stats.csv
│   └── gifs/                Chapter and reaction GIFs
├── audit/
│   ├── challenge-solutions.json  Exported challenge metadata + solutions
│   └── curriculum-audit.json     Last test-run results (21/21 passed)
├── scripts/
│   └── test-campaign.ts     Automated campaign/data validation (pnpm test)
├── test_reports/            Browser test reports (iteration_2.json committed)
├── .env.example             Required Supabase env vars
├── next.config.mjs          Next.js configuration
├── package.json             Scripts and dependencies
├── pnpm-lock.yaml           Reproducible lockfile
└── tsconfig.json            TypeScript config
```

Files that used to live here but have been removed: `components/home-page.tsx`, `lib/game-tapes.ts`, `memory/SPEC.md`, and `design_guidelines.json`.

## The curriculum at a glance

**Game 1 — The Statement (June 2, 2016)**
1. The Opening Brief — SELECT / FROM (teams)
2. The Player Directory — SELECT / FROM (players)
3. The Plus-Minus Pulse — WHERE >= (Game 1, +20 plus-minus)

**Game 2 — The Blowout (June 5, 2016)**
4. Kyrie's Game 2 Line — WHERE + AND (exact player + game)
5. The Scoring Cut — ORDER BY DESC (>= 17 points, Game 2)
6. The Three-Point Barrage — ORDER BY + LIMIT (top 3 three-pointers)

**Game 3 — The Stand (June 8, 2016)**
7. The Rebounding Stand — COUNT (* >= 10 rebounds)
8. The Combined Score — SUM (all Game 3 points)
9. Average Points Among Scorers — AVG + ROUND (points > 0)

**Game 4 — The Brink (June 10, 2016)**
10. The Team Scoreboard — GROUP BY + SUM (team points)
11. Who Cleared Twenty? — GROUP BY + HAVING (>= 20 per player)
12. Classifying the Scoring Lines — CASE + GROUP BY (scoring bands)

**Game 5 — Elimination Night (June 13, 2016)**
13. Put Names to the Numbers — INNER JOIN (top 5 scorers with names)
14. The Team Response — JOIN + GROUP BY (Game 5 final score)
15. The Missing Records — LEFT JOIN + IS NULL (players absent from Game 5)

**Game 6 — Force a Seventh (June 16, 2016)**
16. The Game 6 Glass Scoreboard — CTE + GROUP BY (team rebounds)
17. The Change From Game 5 to Game 6 — chained CTEs (rebound change)
18. Above the Series Average — CTE + JOIN + AVG (Games 1–6 benchmark)

**Game 7 — The Comeback Complete (June 19, 2016)**
19. The Series Scoring Leaders — RANK (top 5 series scorers)
20. The Final Shift — LAG + running SUM (Game 7 vs Game 6)
21. The Final Reconstruction — CTEs + conditional aggregation (series summary)

## Running it locally

Install dependencies:

```bash
pnpm install
```

Start the dev server:

```bash
pnpm dev
```

Run the campaign validation script (checks all 21 challenges against verified data):

```bash
pnpm test
```

Build a production export:

```bash
pnpm build
```

You need Supabase public environment variables available for authentication to work (see Deployment). Without them the app still runs locally, but the auth panel reports that authentication is unavailable.

## Deployment

The site is exported as a static Next.js build and hosted on Cloudflare Pages:

```
https://sqlam-dunk.pages.dev
```

Required build-time environment variables (set these in Cloudflare Pages → Variables and Secrets, for both Production and Preview, then redeploy):

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key
# NEXT_PUBLIC_SUPABASE_ANON_KEY=   # legacy alternative to the publishable key
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=https://sqlam-dunk.pages.dev/auth/callback
```

The publishable/anon key is safe for browser use when Supabase policies are configured correctly. Never put a service-role or secret key in `NEXT_PUBLIC_*` variables or client code.

## Security and honesty notes

This is an educational client-side sandbox. A few things to keep in mind:

- Anything running in the browser is user-controlled. DuckDB results and client-side XP/coin state are **not authoritative**.
- The dataset is public and downloadable; treat it as curriculum content, not secrets.
- Progress is stored in Supabase user metadata. For a production economy, move rewards and progress into a dedicated RLS-protected `player_progress` table and validate mutations server-side.
- Do not trust client-side reward state if coins or XP ever carry real value.

## Looking ahead

- Guest progress restore (or change the banner so it doesn't promise persistence across reloads).
- Case-closed animation (stamp + paper rustle) when a challenge is solved.
- Shareable front page: download a newspaper-style report of your finished case (rank, XP, solved games).
- Dedicated `player_progress` / `query_attempts` tables with RLS.
- Automated browser end-to-end tests (Playwright or similar).

---

SQLAM Dunk is an independent educational project and is not affiliated with the NBA or its teams. Historical basketball data is used for educational analysis.
