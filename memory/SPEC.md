# SQLAM Dunk Living Spec

## Product
SQLAM Dunk is a browser-local SQL learning game built around the 2016 NBA Finals. Players investigate Case 001, write read-only SQL against the bundled DuckDB-WASM dataset, validate evidence, unlock 21 chronological challenges, and earn XP and coins.

## Data and flows
- The landing page introduces Case 001, the learning path, historical player assets, and the locked roadmap.
- The investigation workspace keeps the existing DuckDB query guard, challenge evaluator, game scoping, expected outputs, rewards, hint economy, query journal, and completion flow intact.
- Guest progress is stored locally; authenticated progress is synchronized to Supabase user metadata when Supabase public configuration is available.
- The first hint is free; later hints cost 25 and 60 coins. Solving challenges unlocks the next challenge and game.

## Auth and roles
Supabase email/password auth is optional in guest mode. There are no separate application roles; a signed-in user's Supabase ID owns their saved progress.

## Frontend direction
Printed sports-newspaper / zine art direction ("The SQLAM Dunk Gazette"): cream newsprint with SVG grain, ink-black double rules, riso red (#e0412a), Cavs gold (#f2b632), wine and court blue spot colours. Fonts via next/font: Anton (display), Instrument Serif (editorial italics), Archivo (body), IBM Plex Mono (labels/code). Theme colour tokens live in app/globals.css (`ink`, `paper`, `paper2`, `sheet`, `riso`, `gold`, `wine`, `court`, `smoke`); do not name a token `card` (collides with shadcn).
- Landing (components/home-page.tsx): masthead, chapter ticker, lead story with taped pixel-art photos, case-file card, player trading cards, film strip of the seven game-tape GIFs, analyst memo with manager/Maya polaroids, ticket-stub roadmap.
- Workspace (components/case-workspace.tsx): press-pass career card, 21-square progress strip, scorebook challenge nav, memo briefing, game-tape photo, evidence board, dark terminal SQL console, box-score result table, scouting-note hints, lined journal, "extra edition" game-complete screen.
- Game-tape GIF map: lib/game-tapes.ts (game 1 = /gifs/curry-icon.gif, game 5 = /gifs/lebron-icon (2).gif — identical copies of the gif dump originals).
Visual changes must not alter the SQL, progression, persistence, or authentication logic (the CaseWorkspace state/handler block is unchanged).
