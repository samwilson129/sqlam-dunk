export type ExpectedOutput = {
  columns: string[]
  rows?: number
  sorting?: string
  preview?: string[][]
}

export type CaseChallenge = {
  id: number
  eyebrow: string
  title: string
  lesson: string
  prompt: string
  why: string
  starterQuery: string
  hint: string
  syntaxHint?: string
  structureHint: string
  expectedOutput: ExpectedOutput
  evidenceTitle: string
  evidence: string
  source: string
  basketballContext?: string
  basketballSignificance?: string
}

export const case001Meta = {
  id: '001',
  title: 'The 3–1 Comeback',
  subtitle: 'Reconstructing the 2016 NBA Finals, one query at a time.',
  teams: 'Cleveland Cavaliers vs. Golden State Warriors',
  dates: 'June 2–19, 2016',
}

const finals = "game_id LIKE '00415004%'"

export const case001Challenges: CaseChallenge[] = [
  { id: 1, eyebrow: 'SELECT / WHERE / ORDER BY', title: 'The 3–1 Deficit', lesson: 'Reconstruct the game-by-game chronology before interpreting the comeback.', prompt: 'Return the seven 2016 Finals games in date order. Include game_id and game_date.', why: 'A defensible case starts with the exact sequence of events, not a headline.', starterQuery: `SELECT game_id, game_date\nFROM games\nWHERE ${finals}\nORDER BY game_date;`, hint: 'The Finals game IDs share the 00415004 prefix.', structureHint: 'Select the two requested columns, filter games with LIKE, then sort by game_date.', expectedOutput: { columns: ['game_id', 'game_date'], rows: 7, sorting: 'game_date ascending', preview: [['0041500401', '2016-06-02'], ['0041500407', '2016-06-19']] }, evidenceTitle: 'Seven games. One impossible margin.', evidence: 'The series ran from June 2 through June 19, 2016, and Cleveland trailed 3–1 after Game 4.', source: 'games.csv + NBA historical record' },
  { id: 2, eyebrow: 'GROUP BY / JOIN / AGGREGATE', title: 'The Scoring Swing', lesson: 'Turn player-game records into team scores and winning margins.', prompt: 'Aggregate points by team for each Finals game. Return one row per game with both team totals and the margin, in game order.', why: 'The scoreline shows where the series shifted and which games were decisive.', starterQuery: `WITH scores AS (\n  SELECT game_id, team_id, SUM(points) AS points\n  FROM player_game_stats\n  WHERE ${finals}\n  GROUP BY game_id, team_id\n)\nSELECT game_id,\n  MAX(CASE WHEN team_id = '1610612739' THEN points END) AS cleveland_points,\n  MAX(CASE WHEN team_id = '1610612744' THEN points END) AS golden_state_points,\n  ABS(MAX(points) - MIN(points)) AS margin\nFROM scores\nGROUP BY game_id\nORDER BY game_id;`, hint: 'Aggregate by game_id and team_id first, then pivot the two team totals with CASE.', structureHint: 'Use a CTE for team totals. The outer query should return seven grouped game rows.', expectedOutput: { columns: ['game_id', 'cleveland_points', 'golden_state_points', 'margin'], rows: 7, sorting: 'game_id ascending', preview: [['0041500401', '89', '104', '15'], ['0041500407', '93', '89', '4']] }, evidenceTitle: 'The margin narrows to four.', evidence: 'Cleveland lost the first two games, then Game 3, before winning Games 5–7; the deciding game finished 93–89.', source: 'player_game_stats.csv + teams.csv' },
  { id: 3, eyebrow: 'SUM / ORDER BY / JOIN', title: 'The Stars Under Pressure', lesson: 'Compare the leading scorers across the seven-game series.', prompt: 'Return each player’s total Finals points with their name and team. Sort from highest to lowest total_points.', why: 'The comeback was a team result, but the scoring leaders identify who carried the pressure.', starterQuery: `SELECT p.first_name, p.last_name, t.team_name, SUM(s.points) AS total_points\nFROM player_game_stats s\nJOIN players p ON p.player_id = s.player_id\nJOIN teams t ON t.team_id = s.team_id\nWHERE ${finals}\nGROUP BY p.first_name, p.last_name, t.team_name\nORDER BY total_points DESC;`, hint: 'Join names before grouping, then SUM points across all seven games.', structureHint: 'Every selected non-aggregate column belongs in GROUP BY; sort the aggregate descending.', expectedOutput: { columns: ['first_name', 'last_name', 'team_name', 'total_points'], sorting: 'total_points descending', preview: [['LeBron', 'James', 'Cleveland Cavaliers', '...',], ['Kyrie', 'Irving', 'Cleveland Cavaliers', '...']] }, evidenceTitle: 'The scoring burden is visible.', evidence: 'LeBron James and Kyrie Irving are the two Cleveland scoring leaders in the supplied Finals records.', source: 'player_game_stats.csv + players.csv + teams.csv' },
  { id: 4, eyebrow: 'WHERE / GROUP BY / ORDER BY', title: 'The Night It Ended', lesson: 'Isolate Game 7 and compare individual performances under the final pressure.', prompt: 'Return every Game 7 player performance with names, team, points, assists, rebounds, and plus_minus. Sort points descending.', why: 'The final report needs the actual individual performances from the deciding night.', starterQuery: `SELECT p.first_name, p.last_name, t.team_name, s.points, s.assists, s.total_rebounds, s.plus_minus\nFROM player_game_stats s\nJOIN players p ON p.player_id = s.player_id\nJOIN teams t ON t.team_id = s.team_id\nWHERE s.game_id = '0041500407'\nORDER BY s.points DESC;`, hint: 'Game 7 is the Finals game ending in 07.', structureHint: 'Filter one game after joining readable names; order the box-score rows by points.', expectedOutput: { columns: ['first_name', 'last_name', 'team_name', 'points', 'assists', 'total_rebounds', 'plus_minus'], rows: 26, sorting: 'points descending; ties remain in dataset order', preview: [['first_name', 'last_name', 'team_name', 'points', 'assists', 'total_rebounds', 'plus_minus'], ['Draymond', 'Green', 'Golden State Warriors', '32', '9', '15', '-1.0'], ['LeBron', 'James', 'Cleveland Cavaliers', '27', '11', '11', '4.0'], ['Kyrie', 'Irving', 'Cleveland Cavaliers', '26', '1', '6', '10.0'], ['Stephen', 'Curry', 'Golden State Warriors', '17', '2', '5', '-3.0'], ['Klay', 'Thompson', 'Golden State Warriors', '14', '2', '2', '-11.0'], ['JR', 'Smith', 'Cleveland Cavaliers', '12', '2', '4', '7.0'], ['Harrison', 'Barnes', 'Golden State Warriors', '10', '1', '2', '-6.0'], ['Kevin', 'Love', 'Cleveland Cavaliers', '9', '3', '14', '19.0'], ['Tristan', 'Thompson', 'Cleveland Cavaliers', '9', '0', '3', '2.0'], ['Shaun', 'Livingston', 'Golden State Warriors', '8', '2', '1', '8.0'], ['Iman', 'Shumpert', 'Cleveland Cavaliers', '6', '0', '1', '-9.0'], ['Andre', 'Iguodala', 'Golden State Warriors', '4', '4', '9', '3.0'], ['Leandro', 'Barbosa', 'Golden State Warriors', '3', '0', '0', '5.0'], ['Richard', 'Jefferson', 'Cleveland Cavaliers', '2', '0', '9', '-8.0'], ['Mo', 'Williams', 'Cleveland Cavaliers', '2', '0', '0', '-5.0'], ['Anderson', 'Varejao', 'Golden State Warriors', '1', '1', '0', '-9.0'], ['Channing', 'Frye', 'Cleveland Cavaliers', '0', '0', '0', '0.0'], ['Brandon', 'Rush', 'Golden State Warriors', '0', '0', '0', '0.0'], ['Marreese', 'Speights', 'Golden State Warriors', '0', '0', '4', '3.0'], ['Timofey', 'Mozgov', 'Cleveland Cavaliers', '0', '0', '0', '0.0'], ['Festus', 'Ezeli', 'Golden State Warriors', '0', '1', '1', '-9.0'], ['Matthew', 'Dellavedova', 'Cleveland Cavaliers', '0', '0', '0', '0.0'], ['Ian', 'Clark', 'Golden State Warriors', '0', '0', '0', '0.0'], ['James Michael', 'McAdoo', 'Golden State Warriors', '0', '0', '0', '0.0'], ['Dahntay', 'Jones', 'Cleveland Cavaliers', '0', '0', '0', '0.0'], ['James', 'Jones', 'Cleveland Cavaliers', '0', '0', '0', '0.0']] }, evidenceTitle: 'The final night has a box score.', evidence: 'Game 7 ended 93–89. The result lets you inspect the deciding performances rather than relying on a summary.', source: 'player_game_stats.csv + players.csv + teams.csv' },
  { id: 5, eyebrow: 'CTE / WINDOW FUNCTION', title: 'Reconstruct the Series', lesson: 'Calculate cumulative series wins and deliver the final report.', prompt: 'Build a game-level winner table, then calculate cumulative Cleveland and Golden State wins in chronological order.', why: 'The cumulative record answers the central mystery: how did Cleveland turn 3–1 into a championship?', starterQuery: `WITH scores AS (\n  SELECT game_id, team_id, SUM(points) AS points\n  FROM player_game_stats\n  WHERE ${finals}\n  GROUP BY game_id, team_id\n), winners AS (\n  SELECT game_id, CASE WHEN MAX(CASE WHEN team_id = '1610612739' THEN points END) > MAX(CASE WHEN team_id = '1610612744' THEN points END) THEN 'Cleveland Cavaliers' ELSE 'Golden State Warriors' END AS winner\n  FROM scores GROUP BY game_id\n)\nSELECT game_id, winner,\n  SUM(CASE WHEN winner = 'Cleveland Cavaliers' THEN 1 ELSE 0 END) OVER (ORDER BY game_id) AS cleveland_series_wins,\n  SUM(CASE WHEN winner = 'Golden State Warriors' THEN 1 ELSE 0 END) OVER (ORDER BY game_id) AS golden_state_series_wins\nFROM winners ORDER BY game_id;`, hint: 'First compute one winner per game. Then use running SUM window functions over game_id.', structureHint: 'Use two CTEs: team scores, then winners. The final SELECT must contain seven chronological rows.', expectedOutput: { columns: ['game_id', 'winner', 'cleveland_series_wins', 'golden_state_series_wins'], rows: 7, sorting: 'game_id ascending; running wins increase after each game' }, evidenceTitle: 'The 3–1 comeback is proven.', evidence: 'Cleveland won Games 5, 6, and 7 to defeat Golden State 4–3, becoming the first team to overcome a 3–1 deficit in an NBA Finals.', source: 'player_game_stats.csv + NBA historical record' },
]

export const case001Tables = [
  { name: 'games', rows: 7, description: '2016 Finals game IDs and dates' },
  { name: 'teams', rows: 2, description: 'Cleveland and Golden State' },
  { name: 'players', rows: 28, description: 'Players appearing in the supplied series data' },
  { name: 'player_game_stats', rows: 182, description: 'Box score and plus-minus records' },
]

export const case001Report = [
  'The supplied dataset covers all seven games of the 2016 NBA Finals, from June 2 through June 19, 2016.',
  'Game-level scores establish the arc: Cleveland recovered from a 3–1 deficit to defeat Golden State 4–3.',
  'The individual Game 7 box score and cumulative win table connect the historical result to reproducible evidence.',
]

export const campaignActs = [
  { title: 'Act I — Reading the Evidence', level: 'Beginner', topics: ['SELECT and FROM', 'WHERE, LIKE and IN', 'ORDER BY, LIMIT and DISTINCT'], cases: ['001', '002', '003'], description: 'Reconstruct the 2016 Finals chronology from individual records before summarizing the series.', playable: ['001'] },
  { title: 'Act II — Finding the Pattern', level: 'Beginner to intermediate', topics: ['COUNT, SUM, AVG, MIN and MAX', 'GROUP BY and HAVING', 'CASE WHEN and conditional aggregation'], cases: ['004', '005', '006'], description: 'Compare scoring, margins and series-wide player production using verified Finals records.', playable: ['004', '005', '006'] },
  { title: 'Act III — Connecting the Evidence', level: 'Intermediate', topics: ['INNER JOIN and LEFT JOIN', 'Keys and multi-table joins', 'Subqueries and CTEs'], cases: ['007', '008', '009'], description: 'Connect players, teams and games to investigate the decisive evidence without inventing context.', playable: ['007', '008', '009'] },
  { title: 'Act IV — Reconstructing the Series', level: 'Advanced', topics: ['Window functions', 'ROW_NUMBER, RANK and DENSE_RANK', 'LAG, LEAD and running totals'], cases: ['010', '011', '012'], description: 'Assemble cumulative standings and final historical reports once the required datasets are available.', playable: ['010', '011', '012'] },
]

export const campaignCases = Array.from({ length: 15 }, (_, index) => ({ id: String(index + 1).padStart(3, '0'), title: index === 0 ? case001Meta.title : campaignActs.flatMap((act) => act.cases).includes(String(index + 1).padStart(3, '0')) ? 'Campaign investigation' : 'Coming soon', status: index < 15 ? 'playable' : 'locked' }))

export const case001ValidationQueries = [
  `SELECT game_id, game_date FROM games WHERE ${finals} ORDER BY game_date`,
  `SELECT game_id, SUM(points) AS total FROM player_game_stats WHERE ${finals} GROUP BY game_id`,
]
