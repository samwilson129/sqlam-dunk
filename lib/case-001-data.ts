export type CaseChallenge = {
  id: number
  eyebrow: string
  title: string
  lesson: string
  prompt: string
  starterQuery: string
  hint: string
  evidenceTitle: string
  evidence: string
  source: string
}

export const case001Meta = {
  id: '001',
  title: 'The 3–1 Comeback',
  subtitle: 'Reconstructing the 2016 NBA Finals, one query at a time.',
  teams: 'Cleveland Cavaliers vs. Golden State Warriors',
  dates: 'June 2–19, 2016',
}

export const case001Challenges: CaseChallenge[] = [
  {
    id: 1,
    eyebrow: 'SELECT / WHERE',
    title: 'Find the series window',
    lesson: 'Start by narrowing the games table to the seven Finals games.',
    prompt: 'Return every game in the 2016 Finals in date order. The investigation begins with the shape of the series itself.',
    starterQuery: "SELECT game_id, game_date\nFROM games\nWHERE game_id LIKE '00415004%'\nORDER BY game_date;",
    hint: 'The Finals game IDs share the 00415004 prefix.',
    evidenceTitle: 'Seven games. One impossible margin.',
    evidence: 'The series ran from June 2 through June 19, 2016, across seven games.',
    source: 'games.csv',
  },
  {
    id: 2,
    eyebrow: 'ORDER BY / GROUP BY',
    title: 'Put the nights in sequence',
    lesson: 'Group the player-game rows by game, then order the results chronologically.',
    prompt: 'Use the player_game_stats table to count distinct players who appeared in each game. Which nights required the deepest rotation?',
    starterQuery: 'SELECT game_id, COUNT(DISTINCT player_id) AS players\nFROM player_game_stats\nGROUP BY game_id\nORDER BY game_id;',
    hint: 'COUNT(DISTINCT player_id) keeps each player from being counted twice.',
    evidenceTitle: 'The series demanded seven different chapters.',
    evidence: 'The supplied player-game records contain a row for each player appearance in each Finals game.',
    source: 'player_game_stats.csv',
  },
  {
    id: 3,
    eyebrow: 'AGGREGATIONS',
    title: 'Measure the pressure',
    lesson: 'Summarize scoring and shooting instead of reading one box score at a time.',
    prompt: 'Aggregate points by player across the series. Sort descending to surface the scorers who shaped the comeback.',
    starterQuery: 'SELECT player_id, SUM(points) AS total_points\nFROM player_game_stats\nGROUP BY player_id\nORDER BY total_points DESC;',
    hint: 'SUM(points) creates a series total. Join to players later when you need names.',
    evidenceTitle: 'The scoring burden was shared.',
    evidence: 'The supplied records show LeBron James and Kyrie Irving among Cleveland’s highest-scoring series contributors.',
    source: 'player_game_stats.csv + players.csv',
  },
  {
    id: 4,
    eyebrow: 'JOINS',
    title: 'Name the evidence',
    lesson: 'IDs are useful to databases. Names make the evidence legible.',
    prompt: 'Join player_game_stats to players and teams. Return the player, team, game, and points for the series.',
    starterQuery: 'SELECT p.first_name, p.last_name, t.team_name, s.game_id, s.points\nFROM player_game_stats s\nJOIN players p ON p.player_id = s.player_id\nJOIN teams t ON t.team_id = s.team_id;',
    hint: 'player_id connects the stats to players; team_id connects them to teams.',
    evidenceTitle: 'The cast is now visible.',
    evidence: 'The dataset identifies Cleveland as team 1610612739 and Golden State as team 1610612744.',
    source: 'players.csv + teams.csv + player_game_stats.csv',
  },
  {
    id: 5,
    eyebrow: 'CASE WHEN',
    title: 'Classify the nights',
    lesson: 'Turn raw plus-minus values into a readable signal.',
    prompt: 'Label each player-game row as positive, negative, or even based on plus_minus.',
    starterQuery: "SELECT game_id, player_id, plus_minus,\n  CASE\n    WHEN plus_minus > 0 THEN 'positive'\n    WHEN plus_minus < 0 THEN 'negative'\n    ELSE 'even'\n  END AS impact\nFROM player_game_stats;",
    hint: 'CASE WHEN lets you translate a numeric threshold into a category.',
    evidenceTitle: 'Impact was not evenly distributed.',
    evidence: 'The supplied data includes both positive and negative plus-minus performances within the same Finals game.',
    source: 'player_game_stats.csv',
  },
  {
    id: 6,
    eyebrow: 'CTEs / WINDOW FUNCTIONS',
    title: 'Write the case report',
    lesson: 'Rank every game and compare each result with the previous one.',
    prompt: 'Use a CTE and a window function to rank players by total series points. This is the final pass from raw evidence to narrative.',
    starterQuery: 'WITH totals AS (\n  SELECT player_id, SUM(points) AS total_points\n  FROM player_game_stats\n  GROUP BY player_id\n)\nSELECT player_id, total_points,\n  RANK() OVER (ORDER BY total_points DESC) AS scoring_rank\nFROM totals;',
    hint: 'Build the aggregate in the CTE, then rank its rows in the outer query.',
    evidenceTitle: 'The comeback has a query trail.',
    evidence: 'Cleveland won the 2016 NBA Finals after trailing Golden State 3–1, becoming the first team to overcome that deficit in an NBA Finals series.',
    source: 'Dataset scope + historical record',
  },
]

export const case001Tables = [
  { name: 'games', rows: 7, description: 'Finals game IDs and dates' },
  { name: 'teams', rows: 2, description: 'Cleveland and Golden State' },
  { name: 'players', rows: 29, description: 'Players appearing in the supplied series data' },
  { name: 'player_game_stats', rows: 200, description: 'Box score and plus-minus records' },
]

export const case001Report = [
  'The supplied dataset covers all seven games of the 2016 NBA Finals, from June 2 through June 19, 2016.',
  'The series record and the historical result establish the arc: Cleveland recovered from a 3–1 deficit to defeat Golden State and win the championship.',
  'The query trail moves from filtering the series to aggregating player production, naming the cast with joins, classifying impact, and ranking the final evidence.',
]
