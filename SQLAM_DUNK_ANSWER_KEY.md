# SQLAM Dunk — 21-Question Answer Key

Generated from the active `approvedCurriculum` definitions in `lib/case-001-data.ts`. Expected outputs are from `audit/curriculum-audit.json`, produced by the project DuckDB audit against the bundled CSV dataset.

**Verification status:** 21 tested, 21 passed, 0 failed. Game IDs are preserved as strings. Q15 returns Ian Clark and Jordan McRae.

## Validation rules

- The reference SQL is the canonical solution currently implemented; accepted answers are checked against the challenge contract, including expected columns, row count, and result semantics.
- Player-game evidence must include an explicit `game_id` filter; future-game access is gated by `allowedThroughGame`.
- Ordering is part of the contract wherever `sorting` is listed.
- Q15 keeps the Game 5 predicate in the `LEFT JOIN ... ON` clause so unmatched players remain visible.

## Q1 — Game 1: The Opening Brief

**Question:** Before we dig into the opener, let's get our records straight. Pull up both teams in the Finals, with their abbreviations and full names. I want the board set up properly before we start digging into individual performances.
**Concept:** SELECT / FROM
**Allowed through:** Game 1

**Canonical reference SQL:**
```sql
SELECT team_id, team_abbreviation, team_name FROM teams;
```

**Expected output:**
- Columns: `team_id, team_abbreviation, team_name`
- Row count: **2**
- Values:
  - `1610612739 | CLE | Cleveland Cavaliers`
  - `1610612744 | GSW | Golden State Warriors`

**How it works:** Which table contains the team names and abbreviations? Select columns from one table; do not filter or aggregate yet.

---

## Q2 — Game 1: The Player Directory

**Question:** Good. Now let's make sure our player directory is ready before we start comparing performances. Pull the player IDs, first names, and last names for everyone in the database. We'll connect these names to their game stats later.
**Concept:** SELECT / FROM
**Allowed through:** Game 1

**Canonical reference SQL:**
```sql
SELECT player_id, first_name, last_name FROM players;
```

**Expected output:**
- Columns: `player_id, first_name, last_name`
- Row count: **28**
- Values:
  - `2210 | Richard | Jefferson`
  - `2544 | LeBron | James`
  - `2563 | Dahntay | Jones`
  - `2571 | Leandro | Barbosa`
  - `2590 | Mo | Williams`

**How it works:** The player directory is separate from the box-score table. Choose columns explicitly from players.

---

## Q3 — Game 1: The First Scoring Clues

**Question:** The opening box score is in. Before we get lost in every stat line, find the players who cleared 20 points in Game 1. Just return their player IDs and point totals for now.
**Concept:** WHERE / ORDER BY
**Allowed through:** Game 1

**Canonical reference SQL:**
```sql
SELECT player_id, points FROM player_game_stats WHERE game_id = '0041500401' AND points >= 20 ORDER BY points DESC, player_id ASC;
```

**Expected output:**
- Columns: `player_id, points`
- Row count: **3**
- Ordering: `points DESC, player_id ASC`
- Values:
  - `202681 | 26`
  - `2544 | 23`
  - `2733 | 20`

**How it works:** Combine the game ID filter with a points threshold. Use WHERE before ORDER BY; the secondary sort makes ties deterministic.

---

## Q4 — Game 2: Kyrie's Game 2 Line

**Question:** Let's check Kyrie's second-game line. We have his player ID from the directory. Pull his Game 2 record and tell me how many points he put up.
**Concept:** WHERE / AND
**Allowed through:** Game 2

**Canonical reference SQL:**
```sql
SELECT player_id, points FROM player_game_stats WHERE game_id = '0041500402' AND player_id = 202681;
```

**Expected output:**
- Columns: `player_id, points`
- Row count: **1**
- Values:
  - `202681 | 10`

**How it works:** Both the game ID and player ID must match. Combine conditions with AND.

---

## Q5 — Game 2: The Scoring Cut

**Question:** The Game 2 box score has plenty of noise. Show me every player-stat record with at least 17 points, highest total first.
**Concept:** WHERE / ORDER BY
**Allowed through:** Game 2

**Canonical reference SQL:**
```sql
SELECT player_id, points FROM player_game_stats WHERE game_id = '0041500402' AND points >= 17 ORDER BY points DESC, player_id ASC;
```

**Expected output:**
- Columns: `player_id, points`
- Row count: **4**
- Ordering: `points DESC, player_id ASC`
- Values:
  - `203110 | 28`
  - `2544 | 19`
  - `201939 | 18`
  - `202691 | 17`

**How it works:** Filter the game and scoring threshold before sorting. WHERE narrows the data; ORDER BY arranges it.

---

## Q6 — Game 2: The Top Three

**Question:** That is a useful cut. Now narrow it down to the three highest scoring records from Game 2.
**Concept:** ORDER BY / LIMIT
**Allowed through:** Game 2

**Canonical reference SQL:**
```sql
SELECT player_id, points FROM player_game_stats WHERE game_id = '0041500402' ORDER BY points DESC, player_id ASC LIMIT 3;
```

**Expected output:**
- Columns: `player_id, points`
- Row count: **3**
- Ordering: `points DESC, player_id ASC`
- Values:
  - `203110 | 28`
  - `2544 | 19`
  - `201939 | 18`

**How it works:** Sorting determines the top rows; LIMIT controls how many return. LIMIT comes after ORDER BY.

---

## Q7 — Game 3: The Twenty-Point Club

**Question:** Game 3 had some serious scoring. Count how many player-stat records reached at least 20 points.
**Concept:** COUNT
**Allowed through:** Game 3

**Canonical reference SQL:**
```sql
SELECT COUNT(*) AS records_at_20_points_or_more FROM player_game_stats WHERE game_id = '0041500403' AND points >= 20;
```

**Expected output:**
- Columns: `records_at_20_points_or_more`
- Row count: **1**
- Values:
  - `3`

**How it works:** COUNT rows after WHERE is applied. COUNT(*) returns one aggregate row.

---

## Q8 — Game 3: The Combined Score

**Question:** Let's step back from individual performances. Add up every player's points in Game 3.
**Concept:** SUM
**Allowed through:** Game 3

**Canonical reference SQL:**
```sql
SELECT SUM(points) AS combined_points FROM player_game_stats WHERE game_id = '0041500403';
```

**Expected output:**
- Columns: `combined_points`
- Row count: **1**
- Values:
  - `210`

**How it works:** Use SUM(points) with the Game 3 filter. SUM adds values from qualifying records.

---

## Q9 — Game 3: Average Points Among Scorers

**Question:** Now calculate the average points among Game 3 records with more than zero points. Leave zero-point records out.
**Concept:** AVG
**Allowed through:** Game 3

**Canonical reference SQL:**
```sql
SELECT ROUND(AVG(points), 2) AS average_points FROM player_game_stats WHERE game_id = '0041500403' AND points > 0;
```

**Expected output:**
- Columns: `average_points`
- Row count: **1**
- Values:
  - `9.55`

**How it works:** Exclude zero-point rows before AVG. Filter the input to the aggregate.

---

## Q10 — Game 4: The Team Scoreboard

**Question:** Four games in, put the team totals side by side. Sum the points for each team in Game 4 using team ID and abbreviation.
**Concept:** GROUP BY / SUM
**Allowed through:** Game 4

**Canonical reference SQL:**
```sql
SELECT team_id, team_abbreviation, SUM(points) AS team_points FROM player_game_stats JOIN teams USING (team_id) WHERE game_id = '0041500404' GROUP BY team_id, team_abbreviation ORDER BY team_id;
```

**Expected output:**
- Columns: `team_id, team_abbreviation, team_points`
- Row count: **2**
- Values:
  - `1610612739 | CLE | 97`
  - `1610612744 | GSW | 108`

**How it works:** Group Game 4 rows by team before summing. GROUP BY creates one row per team.

---

## Q11 — Game 4: Who Cleared Twenty?

**Question:** Which player-stat records crossed the 20-point mark in Game 4? Group by player ID and keep totals of at least 20.
**Concept:** GROUP BY / HAVING
**Allowed through:** Game 4

**Canonical reference SQL:**
```sql
SELECT player_id, SUM(points) AS total_points FROM player_game_stats WHERE game_id = '0041500404' GROUP BY player_id HAVING SUM(points) >= 20 ORDER BY total_points DESC, player_id ASC;
```

**Expected output:**
- Columns: `player_id, total_points`
- Row count: **4**
- Ordering: `total_points DESC, player_id ASC`
- Values:
  - `201939 | 38`
  - `202681 | 34`
  - `2544 | 25`
  - `202691 | 25`

**How it works:** WHERE filters rows; HAVING filters groups. Use HAVING after GROUP BY.

---

## Q12 — Game 4: Classifying the Scoring Lines

**Question:** Classify every Game 4 player-stat record as 20+ points, 10–19 points, or Under 10 points, then count each band.
**Concept:** CASE / GROUP BY
**Allowed through:** Game 4

**Canonical reference SQL:**
```sql
WITH categorized AS (SELECT CASE WHEN points >= 20 THEN '20+ points' WHEN points >= 10 THEN '10-19 points' ELSE 'Under 10 points' END AS scoring_band FROM player_game_stats WHERE game_id = '0041500404') SELECT scoring_band, COUNT(*) AS player_stat_records FROM categorized GROUP BY scoring_band ORDER BY CASE scoring_band WHEN '20+ points' THEN 1 WHEN '10-19 points' THEN 2 ELSE 3 END;
```

**Expected output:**
- Columns: `scoring_band, player_stat_records`
- Row count: **3**
- Values:
  - `20+ points | 4`
  - `10-19 points | 5`
  - `Under 10 points | 17`

**How it works:** CASE checks conditions in order. Categorize rows, then group the labels.

---

## Q13 — Game 5: Put Names to the Numbers

**Question:** Join the player directory to the box score and give me the five highest-scoring records from Game 5 with player name, team abbreviation, and points.
**Concept:** INNER JOIN
**Allowed through:** Game 5

**Canonical reference SQL:**
```sql
SELECT p.first_name || ' ' || p.last_name AS player_name, t.team_abbreviation, s.points FROM player_game_stats s INNER JOIN players p ON s.player_id = p.player_id INNER JOIN teams t ON s.team_id = t.team_id WHERE s.game_id = '0041500405' ORDER BY s.points DESC, player_name ASC LIMIT 5;
```

**Expected output:**
- Columns: `player_name, team_abbreviation, points`
- Row count: **5**
- Values:
  - `Kyrie Irving | CLE | 41`
  - `LeBron James | CLE | 41`
  - `Klay Thompson | GSW | 37`
  - `Stephen Curry | GSW | 25`
  - `Andre Iguodala | GSW | 15`

**How it works:** Join each table using its shared ID. INNER JOIN keeps matching player and team records.

---

## Q14 — Game 5: The Team Response

**Question:** Sum Game 5's points by team and show each team's full name and total.
**Concept:** JOIN / GROUP BY
**Allowed through:** Game 5

**Canonical reference SQL:**
```sql
SELECT t.team_name, SUM(s.points) AS team_points FROM player_game_stats s INNER JOIN teams t ON s.team_id = t.team_id WHERE s.game_id = '0041500405' GROUP BY t.team_id, t.team_name ORDER BY team_points DESC;
```

**Expected output:**
- Columns: `team_name, team_points`
- Row count: **2**
- Values:
  - `Cleveland Cavaliers | 112`
  - `Golden State Warriors | 97`

**How it works:** Join team names to stats before grouping. Group joined rows by team.

---

## Q15 — Game 5: The Missing Records

**Question:** Which players in the master directory have no player-stat row for Game 5? I want to know what the extract does not contain.
**Concept:** LEFT JOIN
**Allowed through:** Game 5

**Canonical reference SQL:**
```sql
SELECT p.first_name || ' ' || p.last_name AS player_name FROM players p LEFT JOIN player_game_stats s ON p.player_id = s.player_id AND s.game_id = '0041500405' WHERE s.player_id IS NULL ORDER BY player_name;
```

**Expected output:**
- Columns: `player_name`
- Row count: **2**
- Ordering: `player_name ASC`
- Values:
  - `Ian Clark`
  - `Jordan McRae`

**How it works:** Keep every player on the left and check for a null stats ID. LEFT JOIN finds unmatched directory records. Keep the Game 5 filter in the ON clause.

---

## Q16 — Game 6: The Game 6 Scoreboard

**Question:** Build a clean Game 6 scoreboard with one row per team, full team name, and total points.
**Concept:** CTE / GROUP BY
**Allowed through:** Game 6

**Canonical reference SQL:**
```sql
WITH team_scores AS (SELECT s.team_id, t.team_name, SUM(s.points) AS team_points FROM player_game_stats s INNER JOIN teams t ON s.team_id = t.team_id WHERE s.game_id = '0041500406' GROUP BY s.team_id, t.team_name) SELECT team_name, team_points FROM team_scores ORDER BY team_points DESC;
```

**Expected output:**
- Columns: `team_name, team_points`
- Row count: **2**
- Values:
  - `Cleveland Cavaliers | 115`
  - `Golden State Warriors | 101`

**How it works:** Calculate the grouped score inside a CTE. A CTE names the intermediate team-score result.

---

## Q17 — Game 6: The Change From Game 5 to Game 6

**Question:** Compare each team’s score in Games 5 and 6, showing both scores and the signed change.
**Concept:** CTE / COMPARISON
**Allowed through:** Game 6

**Canonical reference SQL:**
```sql
WITH team_scores AS (SELECT team_id, game_id, SUM(points) AS team_points FROM player_game_stats WHERE game_id IN ('0041500405','0041500406') GROUP BY team_id, game_id), comparison AS (SELECT team_id, MAX(CASE WHEN game_id = '0041500405' THEN team_points END) AS game5_points, MAX(CASE WHEN game_id = '0041500406' THEN team_points END) AS game6_points FROM team_scores GROUP BY team_id) SELECT t.team_abbreviation, c.game5_points, c.game6_points, c.game6_points - c.game5_points AS point_change FROM comparison c INNER JOIN teams t ON c.team_id = t.team_id ORDER BY t.team_abbreviation;
```

**Expected output:**
- Columns: `team_abbreviation, game5_points, game6_points, point_change`
- Row count: **2**
- Values:
  - `CLE | 112 | 115 | 3`
  - `GSW | 97 | 101 | 4`

**How it works:** Pivot the two game IDs into separate columns. Use CTEs for score aggregation and comparison.

---

## Q18 — Game 6: Above the Series Average

**Question:** Calculate the average points per player-stat record across Games 1–6, then show Game 6 records above it with names and team abbreviations.
**Concept:** CTE / JOIN / AVG
**Allowed through:** Game 6

**Canonical reference SQL:**
```sql
WITH series_average AS (SELECT AVG(points) AS average_points FROM player_game_stats WHERE game_id <= '0041500406') SELECT p.first_name || ' ' || p.last_name AS player_name, t.team_abbreviation, s.points FROM player_game_stats s INNER JOIN players p ON s.player_id = p.player_id INNER JOIN teams t ON s.team_id = t.team_id CROSS JOIN series_average a WHERE s.game_id = '0041500406' AND s.points > a.average_points ORDER BY s.points DESC, player_name ASC;
```

**Expected output:**
- Columns: `player_name, team_abbreviation, points`
- Row count: **8**
- Values:
  - `LeBron James | CLE | 41`
  - `Stephen Curry | GSW | 30`
  - `Klay Thompson | GSW | 25`
  - `Kyrie Irving | CLE | 23`
  - `Tristan Thompson | CLE | 15`

**How it works:** Calculate the average in a separate CTE. Compare Game 6 rows to a calculated scalar threshold.

---

## Q19 — Game 7: The Series Scoring Leaders

**Question:** Rank players by total points across the Finals and give me the top five using the player directory.
**Concept:** RANK
**Allowed through:** Game 7

**Canonical reference SQL:**
```sql
WITH player_totals AS (SELECT s.player_id, p.first_name || ' ' || p.last_name AS player_name, SUM(s.points) AS total_points FROM player_game_stats s INNER JOIN players p ON s.player_id = p.player_id GROUP BY s.player_id, p.first_name, p.last_name), ranked_players AS (SELECT player_name, total_points, RANK() OVER (ORDER BY total_points DESC) AS scoring_rank FROM player_totals) SELECT scoring_rank, player_name, total_points FROM ranked_players WHERE scoring_rank <= 5 ORDER BY scoring_rank, player_name;
```

**Expected output:**
- Columns: `scoring_rank, player_name, total_points`
- Row count: **5**
- Values:
  - `1 | LeBron James | 208`
  - `2 | Kyrie Irving | 190`
  - `3 | Stephen Curry | 158`
  - `4 | Klay Thompson | 137`
  - `5 | Draymond Green | 99`

**How it works:** Aggregate totals before applying RANK. A grouped player table feeds the ranking window.

---

## Q20 — Game 7: The Final Shift

**Question:** Compare Game 7 team scores with Game 6 and show each team’s cumulative points through Game 7.
**Concept:** LAG / RUNNING SUM
**Allowed through:** Game 7

**Canonical reference SQL:**
```sql
WITH team_game_scores AS (SELECT s.team_id, t.team_abbreviation, t.team_name, s.game_id, SUM(s.points) AS team_points FROM player_game_stats s INNER JOIN teams t ON s.team_id = t.team_id GROUP BY s.team_id, t.team_abbreviation, t.team_name, s.game_id), game_trends AS (SELECT *, LAG(team_points) OVER (PARTITION BY team_id ORDER BY game_id) AS previous_game_points, SUM(team_points) OVER (PARTITION BY team_id ORDER BY game_id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS cumulative_points FROM team_game_scores) SELECT team_abbreviation, team_name, team_points AS game7_points, previous_game_points, team_points - previous_game_points AS change_from_game6, cumulative_points FROM game_trends WHERE game_id = '0041500407' ORDER BY team_abbreviation;
```

**Expected output:**
- Columns: `team_abbreviation, team_name, game7_points, previous_game_points, change_from_game6, cumulative_points`
- Row count: **2**
- Values:
  - `CLE | Cleveland Cavaliers | 93 | 115 | -22 | 703`
  - `GSW | Golden State Warriors | 89 | 101 | -12 | 699`

**How it works:** LAG reads the previous row; SUM accumulates the ordered games. Aggregate by team and game before applying windows.

---

## Q21 — Game 7: The Final Reconstruction

**Question:** Build the final team report: total points across all seven games and number of games won by each team, deriving winners from actual game scores.
**Concept:** FINAL CAPSTONE
**Allowed through:** Game 7

**Canonical reference SQL:**
```sql
WITH team_game_scores AS (SELECT s.game_id, s.team_id, t.team_name, SUM(s.points) AS team_points FROM player_game_stats s INNER JOIN teams t ON s.team_id = t.team_id GROUP BY s.game_id, s.team_id, t.team_name), game_results AS (SELECT game_id, MAX(CASE WHEN team_id = 1610612739 THEN team_points END) AS cle_points, MAX(CASE WHEN team_id = 1610612744 THEN team_points END) AS gsw_points FROM team_game_scores GROUP BY game_id), team_summary AS (SELECT s.team_id, s.team_name, SUM(s.team_points) AS series_points, SUM(CASE WHEN s.team_id = 1610612739 AND s.team_points > r.gsw_points THEN 1 WHEN s.team_id = 1610612744 AND s.team_points > r.cle_points THEN 1 ELSE 0 END) AS games_won FROM team_game_scores s INNER JOIN game_results r ON s.game_id = r.game_id GROUP BY s.team_id, s.team_name) SELECT team_name, series_points, games_won FROM team_summary ORDER BY games_won DESC, team_name;
```

**Expected output:**
- Columns: `team_name, series_points, games_won`
- Row count: **2**
- Values:
  - `Cleveland Cavaliers | 703 | 4`
  - `Golden State Warriors | 699 | 3`

**How it works:** Calculate team scores per game, compare winners, then summarize. Use CTEs for game grain and final team grain.

---
