# SQLAM Dunk — User Guide

SQLAM Dunk is an interactive SQL learning game set during the 2016 NBA Finals. You play as a junior analyst reconstructing the Cavaliers–Warriors Finals from the box score, one real SQL query at a time.

## 1. Accounts

- **Play as a guest** to look around without signing up.
- **Sign up** with an email and password to create a profile.
- **Log in and log out** whenever you like.
- **Come back later** and your saved progress is waiting (logged-in accounts only).
- Each account keeps its own XP, coins, rank, solved challenges, hint usage, and query journal.
- Switching accounts loads only that user's progress — nobody sees anyone else's case file.

## 2. SQL investigation

1. Start **Case 001 — "The 3–1 Comeback."**
2. Pick the next unlocked challenge (challenges open one at a time, in order).
3. Read the manager's briefing, the SQL objective, and the tables you can use.
4. Use the starter query or write your own SQL.
5. Run the query against the embedded basketball dataset (games, teams, players, player_game_stats).
6. Look at the returned rows, compare them to the expected output, and refine.
7. Submit when your result matches the challenge requirements.

Hit **Run query** (or `Ctrl`/`Cmd` + `Enter`) to execute.

## 3. Progression

- Challenges unlock sequentially — finish one, the next opens.
- Finishing all three challenges in a game unlocks the next game.
- Solved challenges stay marked complete.
- Logging out does not erase saved account progress.
- Logging in as another user loads that user's independent progression.

## 4. Rewards

- Solving a challenge correctly awards XP and coins.
- Later, harder challenge bands pay out more coins than early ones.
- XP goes toward your rank: **Data Explorer** under 750 XP, **Performance Analyst** at 750+.
- You can't claim the same completion reward twice by replaying a challenge.
- Coins belong to individual accounts and can't be shared between players.

## 5. Hints

| Hint | What it gives you | Cost |
|---|---|---|
| Hint 1 | A concept nudge | Free |
| Hint 2 | Query structure | 25 coins |
| Hint 3 | Fill-in-the-blanks outline | 60 coins |

- The first hint for every challenge is free.
- Additional hints cost coins, and the price goes up with each level.
- Paid hints require you to be logged in.
- Hint usage is tracked per account. One player's purchases don't affect another's balance.

## 6. A typical session

1. Log in or create an account.
2. Open the investigation case.
3. Choose the next unlocked challenge.
4. Write and run SQL.
5. Use the free hint if you're stuck, or buy a more detailed one.
6. Submit the correct result.
7. Earn XP and coins.
8. Come back later and pick up right where you left off.

## 7. Guest mode

Guest mode is for trying the game without an account.

- Guest progress is saved to this device only (browser localStorage).
- It is **not restored after a page reload** — this is a known limitation.
- Guests don't earn or keep XP, coins, hint purchases, or unlocks once the session ends.
- To save and resume progress across sessions, create an account and stay signed in while you play.

## 8. The seven games (what you'll learn)

1. **The Statement** — selecting columns, filtering rows
2. **The Blowout** — combining conditions, sorting, top-N results
3. **The Stand** — counting, summing, averaging
4. **The Brink** — grouping, filtering groups, scoring bands
5. **Elimination Night** — joining tables, team totals, finding missing records
6. **Force a Seventh** — common table expressions, comparing games, series averages
7. **The Comeback Complete** — rankings, running totals, final series reconstruction

## 9. Honest note on guest progress

The guest banner says progress "is saved on this device." It is — but only within the current browser session. If you reload the page, guest progress won't come back. This is deliberate for now. If you want your case file to survive a reload, sign up and log in.

## 10. Support

SQLAM Dunk is an independent educational project and is not affiliated with the NBA or its teams. Historical basketball data is used for educational analysis.
