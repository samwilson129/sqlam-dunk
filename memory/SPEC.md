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
The frontend uses a court-noir editorial and pixel-arcade dossier treatment: Barlow Condensed display type, DM Sans body copy, JetBrains Mono code labels, warm amber/orange accents, tactile offset shadows, scanline texture, and the existing pixel-art GIF/image assets. Visual changes must not alter the SQL, progression, persistence, or authentication logic.