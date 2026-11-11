# SQLAM Dunk — Setup & Deployment

SQLAM Dunk is a Next.js 16 static-export SQL learning game about the 2016 NBA Finals. SQL runs in the browser via DuckDB-WASM, and accounts use Supabase Auth. This guide covers getting it running locally and deploying to Cloudflare Pages.

## Prerequisites

- Node.js (18+) and [pnpm](https://pnpm.io/install)
- A Supabase project (for authentication and progress persistence)

## 1. Local setup

Clone the repo and install dependencies:

```bash
git clone https://github.com/samwilson129/sqlam-dunk.git
cd sqlam-dunk
pnpm install
```

### Environment variables

Copy the example file:

```bash
cp .env.example .env.local
```

Fill in your Supabase values:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key
# NEXT_PUBLIC_SUPABASE_ANON_KEY=   # legacy alternative
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/auth/callback
```

These are public (browser-safe) values. Never put a Supabase service-role/secret key here.

### Run the dev server

```bash
pnpm dev
```

Open `http://localhost:3000`. Without Supabase vars set, the game still works in guest mode but the auth panel reports that authentication is unavailable.

### Run the campaign tests

Validates all 21 challenges against verified data:

```bash
pnpm test
```

Expected result: `Challenges: 21/21 passed`.

### Production build

```bash
pnpm build
```

This produces a static export in `out/`, ready to deploy.

## 2. Deploy to Cloudflare Pages

SQLAM Dunk is configured with `output: 'export'` in `next.config.mjs`, so it deploys as a static site.

1. Push the repo to GitHub.
2. In Cloudflare Pages, create a new site and connect the `samwilson129/sqlam-dunk` repository.
3. Build settings:
   - Build command: `pnpm build`
   - Build output directory: `out`
4. Add the same environment variables under **Settings → Variables and Secrets**, for both Production and Preview:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=https://sqlam-dunk.pages.dev/auth/callback
```

5. Deploy. The site will be live at `https://sqlam-dunk.pages.dev`.

## 3. Required environment variables (summary)

| Variable | Purpose | Example |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable/anon key (browser-safe) | `sb_publishable_xxx` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Legacy alternative to the publishable key | optional |
| `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` | Auth callback URL | `https://sqlam-dunk.pages.dev/auth/callback` |

The publishable key ships to the browser, which is fine when Supabase policies are configured correctly. Do not expose a service-role key.

## Project structure

```
.
├── app/                 Next.js App Router (layout, page, globals)
├── components/          React components (auth-panel, case-workspace, ui/button)
├── lib/                 Core logic (SQL engine, campaign data, guard, Supabase client)
├── public/data/         CSV datasets (games, teams, players, player_game_stats)
├── public/gifs/         Chapter and reaction GIFs
├── audit/               Exported challenge solutions + last audit report
├── scripts/test-campaign.ts   Campaign validation script (pnpm test)
├── next.config.mjs      Next.js static-export config
├── package.json         Scripts and dependencies
└── tsconfig.json        TypeScript config
```

Removed files: `components/home-page.tsx`, `lib/game-tapes.ts`, `memory/SPEC.md`, `design_guidelines.json`.
