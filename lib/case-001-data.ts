import type { ConceptKey, ExpectedOutput } from './campaign-sql'

export type { ExpectedOutput, SortKey } from './campaign-sql'

export type GameNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7

export type CaseChallenge = {
  id: number
  game: GameNumber
  eyebrow: string
  title: string
  briefing: string
  objective: string
  task: string
  learningObjective: string
  starterQuery: string
  hint: string
  structureHint: string
  syntaxHint: string
  explanation: string
  expectedOutput: ExpectedOutput
  requiredConcepts: ConceptKey[]
  allowedThroughGame: GameNumber
  solution: string
}

type ChallengeDefinition = Omit<CaseChallenge, 'id' | 'game' | 'allowedThroughGame' | 'starterQuery'>

export const case001Meta = { id: '001', title: 'The 3–1 Comeback', subtitle: 'Reconstructing the 2016 NBA Finals, one query at a time.', teams: 'Cleveland Cavaliers vs. Golden State Warriors', dates: 'June 2–19, 2016' }

export const campaignChapters = [
  { number: 1, game: 'Game 1', date: 'June 2, 2016', title: 'Reading the Box Score', concepts: ['SELECT', 'FROM', 'Specific columns', 'Simple WHERE'], outcome: 'Retrieve relevant information and understand how the NBA dataset is organized.', challengeIds: [1, 2, 3] },
  { number: 2, game: 'Game 2', date: 'June 5, 2016', title: 'Finding the Evidence', concepts: ['WHERE', 'AND', 'ORDER BY', 'LIMIT'], outcome: 'Isolate records, sort results, and find top performers in a game.', challengeIds: [4, 5, 6] },
  { number: 3, game: 'Game 3', date: 'June 8, 2016', title: 'Measuring Performance', concepts: ['COUNT', 'SUM', 'AVG', 'ROUND'], outcome: 'Calculate scoring totals, count records, and summarize performance.', challengeIds: [7, 8, 9] },
  { number: 4, game: 'Game 4', date: 'June 10, 2016', title: 'Seeing the Bigger Picture', concepts: ['GROUP BY', 'HAVING', 'CASE'], outcome: 'Group statistics, filter aggregate results, and classify performances.', challengeIds: [10, 11, 12] },
  { number: 5, game: 'Game 5', date: 'June 13, 2016', title: 'Connecting the Data', concepts: ['INNER JOIN', 'LEFT JOIN', 'Join keys', 'Multi-table queries'], outcome: 'Connect player, team, game, and statistical records across tables.', challengeIds: [13, 14, 15] },
  { number: 6, game: 'Game 6', date: 'June 16, 2016', title: 'Investigating the Turning Point', concepts: ['CTEs', 'Comparisons', 'Benchmarks'], outcome: 'Break complex investigations into named steps and compare games.', challengeIds: [16, 17, 18] },
  { number: 7, game: 'Game 7', date: 'June 19, 2016', title: 'The Final Analysis', concepts: ['RANK', 'LAG', 'Running SUM', 'Capstone'], outcome: 'Rank performances, compare changes, and build the final Finals report.', challengeIds: [19, 20, 21] },
] as const

const gamesByChapter: ChallengeDefinition[][] = [
  [
    {
      title: 'The Opening Brief', eyebrow: 'SELECT / FROM',
      briefing: 'Welcome to the retrospective team. Before anyone argues about the 2016 Finals, we set the board up properly. Start with the two franchises on the floor: I want their IDs, abbreviations and full names exactly as the database stores them.',
      objective: 'Which two teams does this case file cover, and how are they identified in the data?',
      task: 'Return team_id, team_abbreviation and team_name from the teams table.',
      learningObjective: 'Use SELECT to choose specific columns and FROM to name the table they come from.',
      hint: 'Everything you need lives in one table. Which table describes teams?',
      structureHint: 'SELECT lists the columns, separated by commas; FROM names the table. No filtering is needed.',
      syntaxHint: 'SELECT ___, ___, ___\nFROM ___;',
      explanation: 'Two rows come back: Cleveland Cavaliers (CLE, 1610612739) and Golden State Warriors (GSW, 1610612744). SELECT chose the three columns and FROM pointed at teams. Those team_id values are the keys the box-score table uses to say which side every stat line belongs to.',
      solution: 'SELECT team_id, team_abbreviation, team_name FROM teams;',
      expectedOutput: { columns: ['team_id', 'team_abbreviation', 'team_name'], rows: 2 }, requiredConcepts: [],
    },
    {
      title: 'The Player Directory', eyebrow: 'SELECT / FROM',
      briefing: 'Good: two teams, two IDs. Now the people. The box scores only store player IDs, so we need the master directory open next to us for the rest of the series.',
      objective: 'Who is in the player directory we will reference for the rest of the case?',
      task: 'Return player_id, first_name and last_name for every row in the players table.',
      learningObjective: 'Read a table’s structure: each row is one player, and player_id is the key other tables use to refer to them.',
      hint: 'The directory is separate from the box-score table. Which table holds names?',
      structureHint: 'Same shape as the last query: three named columns from one table, no WHERE clause.',
      syntaxHint: 'SELECT ___, first_name, ___\nFROM ___;',
      explanation: 'The directory holds 28 players across both rosters, one row per player keyed by player_id. The stats table never repeats names; it stores player_id instead. Keep a few keys handy: Kyrie Irving is 202681, LeBron James is 2544 and Stephen Curry is 201939.',
      solution: 'SELECT player_id, first_name, last_name FROM players;',
      expectedOutput: { columns: ['player_id', 'first_name', 'last_name'], rows: 28 }, requiredConcepts: [],
    },
    {
      title: 'The First Scoring Clues', eyebrow: 'SELECT / WHERE',
      briefing: 'The Game 1 box score just landed on my desk, and it is the only game in our file so far. Before you get lost in every stat line, tell me who carried the scoring. Anyone with 20 or more points goes on the whiteboard.',
      objective: 'Which players scored at least 20 points in Game 1?',
      task: 'From player_game_stats, return player_id and points for records with 20 or more points. Only Game 1 is in the case file, so a single condition is enough.',
      learningObjective: 'Use WHERE with a comparison operator (>=) to keep only the rows that meet a condition.',
      hint: 'You only need rows where points is at least 20. Which comparison operator means “at least”?',
      structureHint: 'SELECT the two columns FROM player_game_stats, then add WHERE with one condition on points.',
      syntaxHint: 'SELECT player_id, points\nFROM player_game_stats\nWHERE points ___ 20;',
      explanation: 'Three records clear the bar: Kyrie Irving (202681) with 26, LeBron James (2544) with 23 and Shaun Livingston (2733) with 20. WHERE tested every row and kept those where the condition was true, and >= includes the boundary, which is why Livingston’s 20 counts. Each row is one player’s stat line for one game.',
      solution: 'SELECT player_id, points FROM player_game_stats WHERE points >= 20;',
      expectedOutput: { columns: ['player_id', 'points'], rows: 3 }, requiredConcepts: ['WHERE'],
    },
  ],
  [
    {
      title: "Kyrie's Game 2 Line", eyebrow: 'WHERE / AND',
      briefing: 'Game 2 is in the file now, so every query has two games to sift through. Kyrie Irving led Cleveland in scoring in the opener. Pull his Game 2 line on its own; I want to see whether that scoring carried over.',
      objective: 'How many points did Kyrie Irving (player_id 202681) score in Game 2?',
      task: "Return player_id and points from player_game_stats for player_id '202681' in Game 2 (game_id '0041500402').",
      learningObjective: 'Combine two conditions with AND so a row must satisfy both. IDs are stored as text, so wrap them in quotes.',
      hint: 'Filtering on the player alone returns his row from every game in the file. What second condition pins it to Game 2?',
      structureHint: 'WHERE game_id = … AND player_id = … : both conditions must be true for a row to survive.',
      syntaxHint: "SELECT player_id, points\nFROM player_game_stats\nWHERE game_id = '___'\n  AND player_id = '___';",
      explanation: 'One row: Kyrie scored 10 points in Game 2, down from 26 in Game 1. AND narrowed the result to the single row where both the game and the player match. Without the game_id condition you would get one row per game, because player_game_stats stores one row per player per game.',
      solution: "SELECT player_id, points FROM player_game_stats WHERE game_id = '0041500402' AND player_id = '202681';",
      expectedOutput: { columns: ['player_id', 'points'], rows: 1 }, requiredConcepts: ['WHERE'],
    },
    {
      title: 'The Scoring Cut', eyebrow: 'WHERE / ORDER BY',
      briefing: 'That is a big drop for Kyrie. Let’s see who stepped up instead. Give me every Game 2 stat line with at least 17 points, with the biggest number at the top so I can read it at a glance.',
      objective: 'Which Game 2 stat lines reached 17 points, from highest to lowest?',
      task: 'Return player_id and points for Game 2 records with at least 17 points, sorted by points from highest to lowest.',
      learningObjective: 'Use ORDER BY … DESC to control the order of results instead of relying on the order rows happen to be stored in.',
      hint: 'Filter to Game 2 and the threshold first, then decide how the rows should be arranged.',
      structureHint: 'SELECT … FROM … WHERE (two conditions) ORDER BY points DESC. ORDER BY always comes after WHERE.',
      syntaxHint: "SELECT player_id, points\nFROM player_game_stats\nWHERE game_id = '0041500402' AND points >= ___\nORDER BY ___ DESC;",
      explanation: 'Four lines qualify: Draymond Green (203110) 28, LeBron James (2544) 19, Stephen Curry (201939) 18 and Klay Thompson (202691) 17. ORDER BY points DESC put the largest value first. Three of the four belong to Golden State; the scoring Cleveland got from Kyrie in Game 1 did not show up here.',
      solution: "SELECT player_id, points FROM player_game_stats WHERE game_id = '0041500402' AND points >= 17 ORDER BY points DESC, player_id ASC;",
      expectedOutput: { columns: ['player_id', 'points'], rows: 4, sortBy: [{ column: 'points', direction: 'desc' }] }, requiredConcepts: ['WHERE', 'ORDER BY'],
    },
    {
      title: 'The Top Three', eyebrow: 'ORDER BY / LIMIT',
      briefing: 'Good. The morning report only has room for three names. Rank Game 2’s stat lines by points and cut the list off after the top three.',
      objective: 'What were the three highest-scoring stat lines in Game 2?',
      task: 'Return player_id and points for the three highest-scoring Game 2 records, highest first.',
      learningObjective: 'Combine ORDER BY with LIMIT to return the top N rows. LIMIT only means “top” once the rows are sorted.',
      hint: 'No points threshold this time. Sort the Game 2 rows, then keep only as many as you need.',
      structureHint: 'WHERE game_id = … ORDER BY points DESC LIMIT 3. LIMIT is the last clause.',
      syntaxHint: "SELECT player_id, points\nFROM player_game_stats\nWHERE game_id = '0041500402'\nORDER BY points DESC\nLIMIT ___;",
      explanation: 'Draymond Green 28, LeBron James 19 and Stephen Curry 18. LIMIT 3 kept the first three rows of the sorted result; without ORDER BY, “first three” would just mean whichever rows the engine read first. Golden State won Game 2 110–77, and two of the three top lines were theirs.',
      solution: "SELECT player_id, points FROM player_game_stats WHERE game_id = '0041500402' ORDER BY points DESC, player_id ASC LIMIT 3;",
      expectedOutput: { columns: ['player_id', 'points'], rows: 3, sortBy: [{ column: 'points', direction: 'desc' }] }, requiredConcepts: ['ORDER BY', 'LIMIT'],
    },
  ],
  [
    {
      title: 'The Twenty-Point Club', eyebrow: 'COUNT',
      briefing: 'Cleveland went home down 0–2. Game 3 is in the file now, and the box score looks very different. Before we name names, I just want a number: how many stat lines reached 20 points?',
      objective: 'How many Game 3 stat records reached at least 20 points?',
      task: 'Return one value named records_at_20_points_or_more: the number of Game 3 records with 20 or more points.',
      learningObjective: 'Use COUNT(*) to summarise many rows into one number, and AS to name the result column.',
      hint: 'You are not listing rows any more; you are counting the ones that pass your filter.',
      structureHint: 'SELECT COUNT(*) AS … FROM player_game_stats WHERE (Game 3) AND (points threshold).',
      syntaxHint: "SELECT COUNT(*) AS records_at_20_points_or_more\nFROM player_game_stats\nWHERE game_id = '___' AND points >= ___;",
      explanation: 'The answer is 3. COUNT(*) collapsed every matching row into a single number. All three belong to Cavaliers: LeBron James (32), Kyrie Irving (30) and JR Smith (20), after a Game 2 in which only one Cleveland player reached even 17.',
      solution: "SELECT COUNT(*) AS records_at_20_points_or_more FROM player_game_stats WHERE game_id = '0041500403' AND points >= 20;",
      expectedOutput: { columns: ['records_at_20_points_or_more'], rows: 1 }, requiredConcepts: ['COUNT'],
    },
    {
      title: 'The Combined Score', eyebrow: 'SUM',
      briefing: 'Three Cavaliers past 20 is a story. Now step back from the individuals and add up every point scored in Game 3, both teams together. That total is our baseline for how much offence the night produced.',
      objective: 'How many total points were scored in Game 3, across both teams?',
      task: 'Return one value named combined_points: the sum of points across all Game 3 records.',
      learningObjective: 'Use SUM to add up a numeric column across the rows that pass your filter.',
      hint: 'Filter to Game 3, then add up the points column instead of counting rows.',
      structureHint: 'SELECT SUM(points) AS combined_points FROM … WHERE game_id = …',
      syntaxHint: "SELECT SUM(___) AS combined_points\nFROM player_game_stats\nWHERE game_id = '___';",
      explanation: '210 points were scored in Game 3. SUM added the points value from each of the 26 Game 3 records. COUNT tells you how many rows matched; SUM tells you how much they add up to.',
      solution: "SELECT SUM(points) AS combined_points FROM player_game_stats WHERE game_id = '0041500403';",
      expectedOutput: { columns: ['combined_points'], rows: 1 }, requiredConcepts: ['SUM'],
    },
    {
      title: 'Average Points Among Scorers', eyebrow: 'AVG / ROUND',
      briefing: 'Totals reward nights with more players on the sheet. I want a fairer per-line figure: the average among Game 3 lines that actually scored. Zero-point rows include players who barely saw the floor, so leave them out, and round to two decimals for the report.',
      objective: 'What was the average score among Game 3 records with more than zero points?',
      task: 'Return one value named average_points: the average of points for Game 3 records with points greater than 0, rounded to 2 decimal places.',
      learningObjective: 'Use AVG to calculate a mean and ROUND(value, 2) to present it; filter rows before the aggregate runs.',
      hint: 'Which rows should the average see? Exclude zero-point records in WHERE before averaging.',
      structureHint: 'SELECT ROUND(AVG(points), 2) AS average_points FROM … WHERE (Game 3) AND points > 0.',
      syntaxHint: "SELECT ROUND(AVG(___), 2) AS average_points\nFROM player_game_stats\nWHERE game_id = '0041500403' AND points ___ 0;",
      explanation: '9.55 points. 22 Game 3 records scored at least once, and their 210 points average 9.545…, which rounds to 9.55. Including the four zero-point rows would pull the average down to 8.08, so the filter decides what the average actually means.',
      solution: "SELECT ROUND(AVG(points), 2) AS average_points FROM player_game_stats WHERE game_id = '0041500403' AND points > 0;",
      expectedOutput: { columns: ['average_points'], rows: 1 }, requiredConcepts: ['AVG', 'ROUND'],
    },
  ],
  [
    {
      title: 'The Team Scoreboard', eyebrow: 'GROUP BY / SUM',
      briefing: 'Cleveland won Game 3 at home, so the series stands at 2–1. Game 4 is in, and this time I want the scoreboard by team. No joins yet: the team_id in the box score is enough for now.',
      objective: 'How many points did each team score in Game 4?',
      task: 'Return team_id and team_points (the sum of points for each team in Game 4), one row per team.',
      learningObjective: 'Use GROUP BY to split rows into groups and calculate an aggregate for each group.',
      hint: 'SUM on its own gives one total for the whole game. What would split that total by team?',
      structureHint: 'SELECT team_id, SUM(points) AS team_points FROM … WHERE (Game 4) GROUP BY team_id. Every non-aggregated column in SELECT must appear in GROUP BY.',
      syntaxHint: "SELECT team_id, SUM(points) AS team_points\nFROM player_game_stats\nWHERE game_id = '0041500404'\nGROUP BY ___;",
      explanation: 'Golden State (1610612744) scored 108 and Cleveland (1610612739) scored 97. GROUP BY team_id created one group per team and SUM ran inside each group. The win puts Golden State 3–1 up in the series.',
      solution: "SELECT team_id, SUM(points) AS team_points FROM player_game_stats WHERE game_id = '0041500404' GROUP BY team_id ORDER BY team_id;",
      expectedOutput: { columns: ['team_id', 'team_points'], rows: 2 }, requiredConcepts: ['GROUP BY', 'SUM'],
    },
    {
      title: 'Who Cleared Twenty?', eyebrow: 'GROUP BY / HAVING',
      briefing: 'Down 3–1. I need to know who was carrying the load in Game 4. Total each player’s points, keep only the players who reached 20, and list the biggest totals first.',
      objective: 'Which players totalled at least 20 points in Game 4?',
      task: 'Return player_id and total_points (the sum of points per player in Game 4), keeping only totals of 20 or more, highest total first.',
      learningObjective: 'Use HAVING to filter groups after aggregation. WHERE filters rows before grouping; HAVING filters the grouped results.',
      hint: 'The 20-point rule applies to each player’s total, not to individual rows, so it cannot go in WHERE.',
      structureHint: 'WHERE (Game 4) → GROUP BY player_id → HAVING SUM(points) >= 20 → ORDER BY total_points DESC.',
      syntaxHint: "SELECT player_id, SUM(points) AS total_points\nFROM player_game_stats\nWHERE game_id = '0041500404'\nGROUP BY player_id\nHAVING ___ >= 20\nORDER BY total_points DESC;",
      explanation: 'Four players: Stephen Curry (201939) 38, Kyrie Irving (202681) 34, and Klay Thompson (202691) and LeBron James (2544) with 25 each. With one row per player per game, each total equals that player’s Game 4 line, but HAVING is the pattern you would use for any multi-row total. Cleveland had two of the four 20-point scorers and still lost by 11.',
      solution: "SELECT player_id, SUM(points) AS total_points FROM player_game_stats WHERE game_id = '0041500404' GROUP BY player_id HAVING SUM(points) >= 20 ORDER BY total_points DESC, player_id ASC;",
      expectedOutput: { columns: ['player_id', 'total_points'], rows: 4, sortBy: [{ column: 'total_points', direction: 'desc' }] }, requiredConcepts: ['GROUP BY', 'HAVING'],
    },
    {
      title: 'Classifying the Scoring Lines', eyebrow: 'CASE / GROUP BY',
      briefing: 'Lists of stars only tell part of the story. Sort every Game 4 stat line into scoring bands and count each band. I want to see how much of each roster barely registered on the scoreboard.',
      objective: 'How were Game 4’s stat lines distributed across scoring bands?',
      task: "Label each Game 4 record '20+ points', '10-19 points' (plain hyphen) or 'Under 10 points', then return scoring_band and player_stat_records (the number of records in each band).",
      learningObjective: 'Use CASE WHEN to derive a category from a value, then GROUP BY that category to count it.',
      hint: 'CASE checks its WHEN conditions from top to bottom and stops at the first true one, so order the bands from highest to lowest.',
      structureHint: 'Put the CASE expression in SELECT with an alias, GROUP BY that alias, and COUNT(*) each group.',
      syntaxHint: "SELECT CASE WHEN points >= 20 THEN '20+ points'\n            WHEN points >= ___ THEN '10-19 points'\n            ELSE '___' END AS scoring_band,\n       COUNT(*) AS player_stat_records\nFROM player_game_stats\nWHERE game_id = '0041500404'\nGROUP BY scoring_band;",
      explanation: '4 records reached 20+, 5 landed in 10-19 and 17 were under 10. CASE turned each points value into a label and GROUP BY counted the labels. 17 of the 26 lines were under 10, including 10 zero-point records, which is why a handful of stars dominate every scoreboard query.',
      solution: "SELECT CASE WHEN points >= 20 THEN '20+ points' WHEN points >= 10 THEN '10-19 points' ELSE 'Under 10 points' END AS scoring_band, COUNT(*) AS player_stat_records FROM player_game_stats WHERE game_id = '0041500404' GROUP BY scoring_band ORDER BY MIN(points) DESC;",
      expectedOutput: { columns: ['scoring_band', 'player_stat_records'], rows: 3 }, requiredConcepts: ['CASE', 'GROUP BY'],
    },
  ],
  [
    {
      title: 'Put Names to the Numbers', eyebrow: 'INNER JOIN',
      briefing: 'Game 5 is in, back in Oakland, with Golden State one win from the title. From here on, no more ID-only reports: I want names on everything. Give me the five biggest scoring lines from Game 5 with the player’s name and team.',
      objective: 'Who had the five highest-scoring lines in Game 5?',
      task: "Join player_game_stats to players and teams. Return player_name (first_name || ' ' || last_name), team_abbreviation and points for the top five Game 5 records, ordered by points descending, then player_name ascending.",
      learningObjective: 'Use INNER JOIN on matching keys (player_id, team_id) to bring readable columns from other tables into one result.',
      hint: 'Names live in players and abbreviations live in teams. Which column does each of those tables share with player_game_stats?',
      structureHint: 'FROM player_game_stats s JOIN players p ON s.player_id = p.player_id JOIN teams t ON s.team_id = t.team_id, then WHERE, ORDER BY and LIMIT.',
      syntaxHint: "SELECT p.first_name || ' ' || p.last_name AS player_name, t.___, s.points\nFROM player_game_stats s\nINNER JOIN players p ON s.player_id = p.___\nINNER JOIN teams t ON s.team_id = t.___\nWHERE s.game_id = '0041500405'\nORDER BY s.points DESC, player_name ASC\nLIMIT 5;",
      explanation: 'Kyrie Irving and LeBron James both scored 41 for Cleveland, ahead of Klay Thompson (37), Stephen Curry (25) and Andre Iguodala (15). Each join matched a stat row to exactly one player and one team through their keys, so no row was duplicated. The secondary sort on player_name decides the order of the two 41-point lines.',
      solution: "SELECT p.first_name || ' ' || p.last_name AS player_name, t.team_abbreviation, s.points FROM player_game_stats s INNER JOIN players p ON s.player_id = p.player_id INNER JOIN teams t ON s.team_id = t.team_id WHERE s.game_id = '0041500405' ORDER BY s.points DESC, player_name ASC LIMIT 5;",
      expectedOutput: { columns: ['player_name', 'team_abbreviation', 'points'], rows: 5, sortBy: [{ column: 'points', direction: 'desc' }, { column: 'player_name', direction: 'asc' }] }, requiredConcepts: ['JOIN'],
    },
    {
      title: 'The Team Response', eyebrow: 'JOIN / GROUP BY',
      briefing: 'Two 41-point lines on the same night. Did that translate into the result? Give me the Game 5 team totals, with full team names this time rather than IDs.',
      objective: 'What was the final score of Game 5, by team name?',
      task: 'Return team_name and team_points (the sum of points per team in Game 5), highest total first.',
      learningObjective: 'Join before grouping so you can group by readable labels while still joining on the team_id key.',
      hint: 'This is the Game 4 scoreboard again, plus a join to teams for the name.',
      structureHint: 'JOIN teams ON team_id, WHERE (Game 5), GROUP BY t.team_id, t.team_name, ORDER BY team_points DESC.',
      syntaxHint: "SELECT t.team_name, SUM(s.points) AS team_points\nFROM player_game_stats s\nINNER JOIN teams t ON s.team_id = t.___\nWHERE s.game_id = '0041500405'\nGROUP BY t.team_id, t.team_name\nORDER BY team_points ___;",
      explanation: 'Cleveland Cavaliers 112, Golden State Warriors 97. Grouping by team_id as well as team_name keeps each group tied to its key, even if two teams ever shared a name. The win cuts Golden State’s series lead to 3–2.',
      solution: "SELECT t.team_name, SUM(s.points) AS team_points FROM player_game_stats s INNER JOIN teams t ON s.team_id = t.team_id WHERE s.game_id = '0041500405' GROUP BY t.team_id, t.team_name ORDER BY team_points DESC;",
      expectedOutput: { columns: ['team_name', 'team_points'], rows: 2, sortBy: [{ column: 'team_points', direction: 'desc' }] }, requiredConcepts: ['JOIN', 'GROUP BY'],
    },
    {
      title: 'The Missing Records', eyebrow: 'LEFT JOIN',
      briefing: 'Every join so far has kept only matching rows. That hides gaps in the data, and gaps matter once we start drawing conclusions. Before we build anything bigger, check the extract against the directory.',
      objective: 'Which players in the master directory have no player-stat row for Game 5? I want to know what the extract does not contain.',
      task: 'Return player_name for every player in players with no matching Game 5 row in player_game_stats, sorted alphabetically by player_name.',
      learningObjective: 'Use LEFT JOIN to keep every row from the left table, then WHERE … IS NULL to find rows with no match. The Game 5 condition belongs in the ON clause.',
      hint: 'An INNER JOIN drops exactly the players you are looking for. Which join keeps every directory row, matched or not?',
      structureHint: 'players LEFT JOIN player_game_stats ON (player_id matches AND the game is Game 5), then WHERE s.player_id IS NULL. If the Game 5 filter goes in WHERE instead, the unmatched rows are thrown away.',
      syntaxHint: "SELECT p.first_name || ' ' || p.last_name AS player_name\nFROM players p\nLEFT JOIN player_game_stats s\n  ON p.player_id = s.player_id\n  AND s.game_id = '___'\nWHERE s.___ IS NULL\nORDER BY player_name;",
      explanation: 'Ian Clark and Jordan McRae have no Game 5 stat row in this extract. LEFT JOIN kept all 28 directory rows; for players without a matching Game 5 row every player_game_stats column came back NULL, and IS NULL picked them out. Putting the game filter in WHERE would discard those NULL rows and return nothing. Report it carefully: the rows are missing from our extract, which does not by itself prove the players did not play.',
      solution: "SELECT p.first_name || ' ' || p.last_name AS player_name FROM players p LEFT JOIN player_game_stats s ON p.player_id = s.player_id AND s.game_id = '0041500405' WHERE s.player_id IS NULL ORDER BY player_name;",
      expectedOutput: { columns: ['player_name'], rows: 2, sortBy: [{ column: 'player_name', direction: 'asc' }] }, requiredConcepts: ['LEFT JOIN', 'IS NULL'],
    },
  ],
  [
    {
      title: 'The Game 6 Scoreboard', eyebrow: 'CTE / GROUP BY',
      briefing: 'Back in Cleveland for Game 6. Our queries are getting longer, so let’s start building them in named steps. Calculate the team totals in a CTE first, then read the scoreboard out of it.',
      objective: 'What was the Game 6 score, by team?',
      task: 'Using a CTE (WITH …), calculate Game 6 team totals, then return team_name and team_points, highest total first.',
      learningObjective: 'Use WITH to name an intermediate result (a common table expression) and query it like a table.',
      hint: 'Put the join-and-sum logic from Game 5 inside WITH team_scores AS ( … ), then select from team_scores.',
      structureHint: 'WITH team_scores AS (SELECT … GROUP BY …) SELECT team_name, team_points FROM team_scores ORDER BY team_points DESC;',
      syntaxHint: "WITH team_scores AS (\n  SELECT t.team_name, SUM(s.points) AS team_points\n  FROM player_game_stats s\n  INNER JOIN teams t ON s.team_id = t.team_id\n  WHERE s.game_id = '___'\n  GROUP BY t.team_id, t.team_name\n)\nSELECT ___, ___\nFROM team_scores\nORDER BY team_points DESC;",
      explanation: 'Cleveland 115, Golden State 101. The CTE produced a small named table of team totals and the final SELECT read from it, which keeps each step easy to check. The series is level at 3–3.',
      solution: "WITH team_scores AS (SELECT s.team_id, t.team_name, SUM(s.points) AS team_points FROM player_game_stats s INNER JOIN teams t ON s.team_id = t.team_id WHERE s.game_id = '0041500406' GROUP BY s.team_id, t.team_name) SELECT team_name, team_points FROM team_scores ORDER BY team_points DESC;",
      expectedOutput: { columns: ['team_name', 'team_points'], rows: 2, sortBy: [{ column: 'team_points', direction: 'desc' }] }, requiredConcepts: ['WITH'],
    },
    {
      title: 'The Change From Game 5 to Game 6', eyebrow: 'CTE / COMPARISON',
      briefing: 'Cleveland have now won two straight. I want the scoring change side by side: each team’s Game 5 total, Game 6 total and the difference. Build it in steps so we can audit each one.',
      objective: 'How did each team’s scoring change from Game 5 to Game 6?',
      task: 'Return team_abbreviation, game5_points, game6_points and point_change (game6_points - game5_points) for each team, ordered by team_abbreviation.',
      learningObjective: 'Chain CTEs: aggregate first, pivot rows into columns with conditional aggregation (MAX(CASE …)), then calculate the difference.',
      hint: 'Aggregate both games per team first, then turn each team’s two game rows into two columns.',
      structureHint: "CTE 1: team totals for game_id IN ('0041500405', '0041500406') grouped by team and game. CTE 2: MAX(CASE WHEN game_id = … THEN team_points END) for each game. Final SELECT: join teams and subtract.",
      syntaxHint: "WITH team_scores AS (\n  SELECT team_id, game_id, SUM(points) AS team_points\n  FROM player_game_stats\n  WHERE game_id IN ('0041500405', '0041500406')\n  GROUP BY team_id, game_id\n), comparison AS (\n  SELECT team_id,\n         MAX(CASE WHEN game_id = '0041500405' THEN team_points END) AS game5_points,\n         MAX(CASE WHEN game_id = '___' THEN team_points END) AS game6_points\n  FROM team_scores\n  GROUP BY team_id\n)\nSELECT t.team_abbreviation, c.game5_points, c.game6_points, ___ AS point_change\nFROM comparison c\nINNER JOIN teams t ON c.team_id = t.team_id\nORDER BY t.team_abbreviation;",
      explanation: 'Cleveland went from 112 to 115 (+3) and Golden State from 97 to 101 (+4). Golden State actually scored more than in Game 5, but Cleveland’s 115 kept them ahead; one team’s change only means something next to the other’s. The chained CTEs kept each step (totals, pivot, difference) readable and checkable.',
      solution: "WITH team_scores AS (SELECT team_id, game_id, SUM(points) AS team_points FROM player_game_stats WHERE game_id IN ('0041500405','0041500406') GROUP BY team_id, game_id), comparison AS (SELECT team_id, MAX(CASE WHEN game_id = '0041500405' THEN team_points END) AS game5_points, MAX(CASE WHEN game_id = '0041500406' THEN team_points END) AS game6_points FROM team_scores GROUP BY team_id) SELECT t.team_abbreviation, c.game5_points, c.game6_points, c.game6_points - c.game5_points AS point_change FROM comparison c INNER JOIN teams t ON c.team_id = t.team_id ORDER BY t.team_abbreviation;",
      expectedOutput: { columns: ['team_abbreviation', 'game5_points', 'game6_points', 'point_change'], rows: 2, sortBy: [{ column: 'team_abbreviation', direction: 'asc' }] }, requiredConcepts: ['WITH'],
    },
    {
      title: 'Above the Series Average', eyebrow: 'CTE / JOIN / AVG',
      briefing: 'Before the deciding game I want a benchmark. Work out the average points per stat record across Games 1–6, every record including the zeros, and show me who beat it in Game 6.',
      objective: 'Which Game 6 stat lines beat the average points per stat record across Games 1–6?',
      task: 'In a CTE, calculate the average points across all player_game_stats rows for Games 1–6 (zero-point rows included). Return player_name, team_abbreviation and points for Game 6 records above that average, ordered by points descending, then player_name ascending.',
      learningObjective: 'Calculate a single benchmark value in a CTE and compare individual rows against it, combining joins, filtering and aggregation.',
      hint: 'The benchmark is one number. Calculate it on its own first, then compare each Game 6 row to it.',
      structureHint: 'WITH series_average AS (SELECT AVG(points) …), then join players and teams, CROSS JOIN series_average, and keep Game 6 rows whose points exceed the average.',
      syntaxHint: "WITH series_average AS (\n  SELECT AVG(points) AS average_points\n  FROM player_game_stats\n  WHERE game_id <= '0041500406'\n)\nSELECT p.first_name || ' ' || p.last_name AS player_name, t.team_abbreviation, s.points\nFROM player_game_stats s\nINNER JOIN players p ON s.player_id = p.player_id\nINNER JOIN teams t ON s.team_id = t.team_id\nCROSS JOIN series_average a\nWHERE s.game_id = '___' AND s.points > ___\nORDER BY s.points DESC, player_name ASC;",
      explanation: 'The Games 1–6 average is about 7.82 points per record, and eight Game 6 lines beat it: LeBron James 41, Stephen Curry 30, Klay Thompson 25, Kyrie Irving 23, Tristan Thompson 15, JR Smith 14, Leandro Barbosa 14 and Draymond Green 8. Because the benchmark includes zero-point records, a modest 8-point line clears it. JR Smith and Leandro Barbosa tie on 14, so the player_name sort decides their order.',
      solution: "WITH series_average AS (SELECT AVG(points) AS average_points FROM player_game_stats WHERE game_id <= '0041500406') SELECT p.first_name || ' ' || p.last_name AS player_name, t.team_abbreviation, s.points FROM player_game_stats s INNER JOIN players p ON s.player_id = p.player_id INNER JOIN teams t ON s.team_id = t.team_id CROSS JOIN series_average a WHERE s.game_id = '0041500406' AND s.points > a.average_points ORDER BY s.points DESC, player_name ASC;",
      expectedOutput: { columns: ['player_name', 'team_abbreviation', 'points'], rows: 8, sortBy: [{ column: 'points', direction: 'desc' }, { column: 'player_name', direction: 'asc' }] }, requiredConcepts: ['WITH', 'JOIN'],
    },
  ],
  [
    {
      title: 'The Series Scoring Leaders', eyebrow: 'RANK',
      briefing: 'Game 7 is in, and the whole series is finally on the table. Start with the leaderboard: total points across all seven games, ranked.',
      objective: 'Who were the five leading scorers of the 2016 Finals?',
      task: 'Total each player’s points across the series in a CTE, rank the totals with RANK() (highest = 1), and return scoring_rank, player_name and total_points for ranks 1–5, ordered by scoring_rank.',
      learningObjective: 'Use the window function RANK() OVER (ORDER BY …) to rank rows without collapsing them; tied rows share a rank.',
      hint: 'Aggregate per player first. RANK is applied to the totals, not to individual games.',
      structureHint: 'CTE 1: SUM(points) per player_id with the name joined in. CTE 2: RANK() OVER (ORDER BY total_points DESC). Final SELECT: WHERE scoring_rank <= 5.',
      syntaxHint: "WITH player_totals AS (\n  SELECT s.player_id, p.first_name || ' ' || p.last_name AS player_name, SUM(s.points) AS total_points\n  FROM player_game_stats s\n  INNER JOIN players p ON s.player_id = p.player_id\n  GROUP BY s.player_id, p.first_name, p.last_name\n), ranked_players AS (\n  SELECT player_name, total_points, RANK() OVER (ORDER BY ___ DESC) AS scoring_rank\n  FROM player_totals\n)\nSELECT scoring_rank, player_name, total_points\nFROM ranked_players\nWHERE scoring_rank <= ___\nORDER BY scoring_rank;",
      explanation: 'LeBron James led with 208, followed by Kyrie Irving 190, Stephen Curry 158, Klay Thompson 137 and Draymond Green 99. RANK() numbered the ordered totals; tied totals would share a rank and the next rank would be skipped. Grouping by player_id rather than by name guarantees two different players can never be merged.',
      solution: "WITH player_totals AS (SELECT s.player_id, p.first_name || ' ' || p.last_name AS player_name, SUM(s.points) AS total_points FROM player_game_stats s INNER JOIN players p ON s.player_id = p.player_id GROUP BY s.player_id, p.first_name, p.last_name), ranked_players AS (SELECT player_name, total_points, RANK() OVER (ORDER BY total_points DESC) AS scoring_rank FROM player_totals) SELECT scoring_rank, player_name, total_points FROM ranked_players WHERE scoring_rank <= 5 ORDER BY scoring_rank, player_name;",
      expectedOutput: { columns: ['scoring_rank', 'player_name', 'total_points'], rows: 5, sortBy: [{ column: 'scoring_rank', direction: 'asc' }] }, requiredConcepts: ['RANK'],
    },
    {
      title: 'The Final Shift', eyebrow: 'LAG / RUNNING SUM',
      briefing: 'Now the deciding game itself. Compare each team’s Game 7 score with its Game 6 score, and give me the running total of series points through Game 7.',
      objective: 'How did each team’s Game 7 score compare with its previous game, and where did cumulative series points finish?',
      task: 'For each team, return team_abbreviation, team_name, game7_points, previous_game_points (using LAG), change_from_game6 (game7_points - previous_game_points) and cumulative_points (a running SUM through Game 7), ordered by team_abbreviation.',
      learningObjective: 'Use LAG to read the previous row within a partition and SUM() OVER (… ORDER BY …) to build a running total.',
      hint: 'Build team-per-game totals first; the window functions need one row per team per game to look back across.',
      structureHint: 'CTE: team totals per game. Then LAG(team_points) OVER (PARTITION BY team_id ORDER BY game_id) and SUM(team_points) OVER (PARTITION BY team_id ORDER BY game_id). Filter to Game 7 only after the windows are computed.',
      syntaxHint: "WITH team_game_scores AS (\n  SELECT s.team_id, t.team_abbreviation, t.team_name, s.game_id, SUM(s.points) AS team_points\n  FROM player_game_stats s\n  INNER JOIN teams t ON s.team_id = t.team_id\n  GROUP BY s.team_id, t.team_abbreviation, t.team_name, s.game_id\n), game_trends AS (\n  SELECT *,\n         LAG(team_points) OVER (PARTITION BY team_id ORDER BY ___) AS previous_game_points,\n         SUM(team_points) OVER (PARTITION BY team_id ORDER BY game_id) AS cumulative_points\n  FROM team_game_scores\n)\nSELECT team_abbreviation, team_name, team_points AS game7_points, previous_game_points,\n       ___ AS change_from_game6, cumulative_points\nFROM game_trends\nWHERE game_id = '0041500407'\nORDER BY team_abbreviation;",
      explanation: 'Cleveland scored 93 after 115 in Game 6 (−22) and finished on 703 series points; Golden State scored 89 after 101 (−12) for 699. LAG looked back one game inside each team’s partition, and the running SUM accumulated points game by game. The Game 7 filter has to come after the window functions: filter first and LAG would have no previous game to read.',
      solution: "WITH team_game_scores AS (SELECT s.team_id, t.team_abbreviation, t.team_name, s.game_id, SUM(s.points) AS team_points FROM player_game_stats s INNER JOIN teams t ON s.team_id = t.team_id GROUP BY s.team_id, t.team_abbreviation, t.team_name, s.game_id), game_trends AS (SELECT *, LAG(team_points) OVER (PARTITION BY team_id ORDER BY game_id) AS previous_game_points, SUM(team_points) OVER (PARTITION BY team_id ORDER BY game_id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS cumulative_points FROM team_game_scores) SELECT team_abbreviation, team_name, team_points AS game7_points, previous_game_points, team_points - previous_game_points AS change_from_game6, cumulative_points FROM game_trends WHERE game_id = '0041500407' ORDER BY team_abbreviation;",
      expectedOutput: { columns: ['team_abbreviation', 'team_name', 'game7_points', 'previous_game_points', 'change_from_game6', 'cumulative_points'], rows: 2, sortBy: [{ column: 'team_abbreviation', direction: 'asc' }] }, requiredConcepts: ['LAG', 'RUNNING SUM'],
    },
    {
      title: 'The Final Reconstruction', eyebrow: 'FINAL CAPSTONE',
      briefing: 'Last piece. Build the final series summary from the game scores themselves: total points and games won for each team. Do not hard-code the winners; derive them from the data.',
      objective: 'Over the full series, how many points did each team score and how many games did each win?',
      task: 'Using CTEs and conditional aggregation, return team_name, series_points and games_won for each team, ordered by games_won descending.',
      learningObjective: 'Combine multiple CTEs with conditional aggregation (SUM(CASE …)) to derive results such as wins from raw scores.',
      hint: 'Work in grains: team-per-game scores, then a per-game comparison to find each winner, then a per-team summary.',
      structureHint: 'CTE 1: team points per game. CTE 2: both teams’ scores side by side for each game. Final: SUM(team_points) and SUM(CASE WHEN the team outscored its opponent THEN 1 ELSE 0 END) per team.',
      syntaxHint: "WITH team_game_scores AS (\n  SELECT s.game_id, s.team_id, t.team_name, SUM(s.points) AS team_points\n  FROM player_game_stats s\n  INNER JOIN teams t ON s.team_id = t.team_id\n  GROUP BY s.game_id, s.team_id, t.team_name\n), game_results AS (\n  SELECT game_id, MAX(team_points) AS winning_points\n  FROM team_game_scores\n  GROUP BY game_id\n)\nSELECT s.team_name, SUM(s.team_points) AS series_points,\n       SUM(CASE WHEN s.team_points = ___ THEN 1 ELSE 0 END) AS games_won\nFROM team_game_scores s\nINNER JOIN game_results r ON s.game_id = r.game_id\nGROUP BY s.team_id, s.team_name\nORDER BY games_won DESC;",
      explanation: 'Cleveland Cavaliers: 703 points and 4 wins. Golden State Warriors: 699 points and 3 wins. Across seven games only four points separated the teams, and Cleveland’s wins in Games 3, 5, 6 and 7 complete the comeback from 3–1 down. Every number in this report was derived from the box score rather than typed in.',
      solution: "WITH team_game_scores AS (SELECT s.game_id, s.team_id, t.team_name, SUM(s.points) AS team_points FROM player_game_stats s INNER JOIN teams t ON s.team_id = t.team_id GROUP BY s.game_id, s.team_id, t.team_name), game_results AS (SELECT game_id, MAX(CASE WHEN team_id = '1610612739' THEN team_points END) AS cle_points, MAX(CASE WHEN team_id = '1610612744' THEN team_points END) AS gsw_points FROM team_game_scores GROUP BY game_id), team_summary AS (SELECT s.team_id, s.team_name, SUM(s.team_points) AS series_points, SUM(CASE WHEN s.team_id = '1610612739' AND s.team_points > r.gsw_points THEN 1 WHEN s.team_id = '1610612744' AND s.team_points > r.cle_points THEN 1 ELSE 0 END) AS games_won FROM team_game_scores s INNER JOIN game_results r ON s.game_id = r.game_id GROUP BY s.team_id, s.team_name) SELECT team_name, series_points, games_won FROM team_summary ORDER BY games_won DESC, team_name;",
      expectedOutput: { columns: ['team_name', 'series_points', 'games_won'], rows: 2, sortBy: [{ column: 'games_won', direction: 'desc' }] }, requiredConcepts: ['WITH', 'CASE'],
    },
  ],
]

const starterQueryFor = (game: number) => `-- Evidence available: Game${game === 1 ? ' 1' : `s 1–${game}`}\n-- Tables: games, teams, players, player_game_stats\n-- Write your query below.\n\n`

export const case001Challenges: CaseChallenge[] = gamesByChapter.flatMap((challenges, chapterIndex) => challenges.map((challenge, index) => {
  const game = (chapterIndex + 1) as GameNumber
  return { ...challenge, id: chapterIndex * 3 + index + 1, game, allowedThroughGame: game, starterQuery: starterQueryFor(game) }
}))

export const case001Tables = [{ name: 'games', rows: 7, description: '2016 Finals game IDs and dates' }, { name: 'teams', rows: 2, description: 'Cleveland and Golden State' }, { name: 'players', rows: 28, description: 'Player directory for both rosters' }, { name: 'player_game_stats', rows: 182, description: 'Box-score and plus-minus records' }]
export const case001Report = ['The supplied dataset covers all seven games of the 2016 NBA Finals.', 'Team scores are derived by summing player points at game and team grain.', 'The final dossier is reproducible from the local box-score dataset.']
export const campaignCases = [{ id: '001', title: case001Meta.title, status: 'playable' }]
export const case001ValidationQueries = case001Challenges.map((challenge) => challenge.solution)
export const allCampaignChallenges = case001Challenges
export const campaignChallengeIds = { game1: [1, 2, 3], game2: [4, 5, 6], game3: [7, 8, 9], game4: [10, 11, 12], game5: [13, 14, 15], game6: [16, 17, 18], game7: [19, 20, 21] } as const
export const finalsScopeForChallenge = (challenge: CaseChallenge) => challenge.allowedThroughGame
export const chapterForChallenge = (challenge: CaseChallenge) => campaignChapters[challenge.game - 1]
