import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { arrowToResult, compareResults, datasetCountSql, datasetCounts, datasetSetupSql, datasetTables, evaluateAttempt, guardQuery, lockdownSql, scopedCountSql, searchPathSql, type QueryResult } from '../lib/campaign-sql'
import { campaignChapters, case001Challenges, type CaseChallenge } from '../lib/case-001-data'

const require = createRequire(import.meta.url)
const duckdb = require('@duckdb/duckdb-wasm/dist/duckdb-node-blocking.cjs')
const root = path.resolve(__dirname, '..')
const dist = path.dirname(require.resolve('@duckdb/duckdb-wasm/dist/duckdb-node-blocking.cjs'))

type Row = (string | number)[]

const canonical: Record<number, Row[]> = {
  1: [['1610612739', 'CLE', 'Cleveland Cavaliers'], ['1610612744', 'GSW', 'Golden State Warriors']],
  3: [['202681', 26], ['2544', 23], ['2733', 20]],
  4: [['202681', 10]],
  5: [['203110', 28], ['2544', 19], ['201939', 18], ['202691', 17]],
  6: [['203110', 28], ['2544', 19], ['201939', 18]],
  7: [[3]],
  8: [[210]],
  9: [[9.55]],
  10: [['1610612739', 97], ['1610612744', 108]],
  11: [['201939', 38], ['202681', 34], ['202691', 25], ['2544', 25]],
  12: [['20+ points', 4], ['10-19 points', 5], ['Under 10 points', 17]],
  13: [['Kyrie Irving', 'CLE', 41], ['LeBron James', 'CLE', 41], ['Klay Thompson', 'GSW', 37], ['Stephen Curry', 'GSW', 25], ['Andre Iguodala', 'GSW', 15]],
  14: [['Cleveland Cavaliers', 112], ['Golden State Warriors', 97]],
  15: [['Ian Clark'], ['Jordan McRae']],
  16: [['Cleveland Cavaliers', 115], ['Golden State Warriors', 101]],
  17: [['CLE', 112, 115, 3], ['GSW', 97, 101, 4]],
  18: [['LeBron James', 'CLE', 41], ['Stephen Curry', 'GSW', 30], ['Klay Thompson', 'GSW', 25], ['Kyrie Irving', 'CLE', 23], ['Tristan Thompson', 'CLE', 15], ['JR Smith', 'CLE', 14], ['Leandro Barbosa', 'GSW', 14], ['Draymond Green', 'GSW', 8]],
  19: [[1, 'LeBron James', 208], [2, 'Kyrie Irving', 190], [3, 'Stephen Curry', 158], [4, 'Klay Thompson', 137], [5, 'Draymond Green', 99]],
  20: [['CLE', 'Cleveland Cavaliers', 93, 115, -22, 703], ['GSW', 'Golden State Warriors', 89, 101, -12, 699]],
  21: [['Cleveland Cavaliers', 703, 4], ['Golden State Warriors', 699, 3]],
}

const nearMisses: Record<number, string[]> = {
  1: ['SELECT team_id, team_name FROM teams', 'SELECT * , 1 AS extra FROM teams'],
  2: ['SELECT player_id, first_name FROM players', 'SELECT player_id, first_name, last_name FROM players LIMIT 27'],
  3: ['SELECT player_id, points FROM player_game_stats WHERE points > 20', 'SELECT player_id, points FROM player_game_stats'],
  4: ["SELECT player_id, points FROM player_game_stats WHERE player_id = '202681'", "SELECT player_id, points FROM player_game_stats WHERE game_id = '0041500401' AND player_id = '202681'"],
  5: ["SELECT player_id, points FROM player_game_stats WHERE game_id = '0041500402' AND points >= 17 ORDER BY points ASC", "SELECT player_id, points FROM player_game_stats WHERE game_id = '0041500402' AND points > 17 ORDER BY points DESC"],
  6: ["SELECT player_id, points FROM player_game_stats WHERE game_id = '0041500402' ORDER BY points DESC LIMIT 4", "SELECT player_id, points FROM player_game_stats WHERE game_id = '0041500402' LIMIT 3"],
  7: ['SELECT COUNT(*) AS records_at_20_points_or_more FROM player_game_stats WHERE points >= 20', "SELECT COUNT(*) AS total FROM player_game_stats WHERE game_id = '0041500403' AND points >= 20"],
  8: ['SELECT SUM(points) AS combined_points FROM player_game_stats', "SELECT COUNT(points) AS combined_points FROM player_game_stats WHERE game_id = '0041500403'"],
  9: ["SELECT ROUND(AVG(points), 2) AS average_points FROM player_game_stats WHERE game_id = '0041500403'", "SELECT AVG(points) AS average_points FROM player_game_stats WHERE game_id = '0041500403' AND points > 0"],
  10: ['SELECT team_id, SUM(points) AS team_points FROM player_game_stats GROUP BY team_id', "SELECT team_id, COUNT(*) AS team_points FROM player_game_stats WHERE game_id = '0041500404' GROUP BY team_id"],
  11: ["SELECT player_id, SUM(points) AS total_points FROM player_game_stats WHERE game_id = '0041500404' GROUP BY player_id HAVING SUM(points) > 25 ORDER BY total_points DESC", "SELECT player_id, SUM(points) AS total_points FROM player_game_stats WHERE game_id = '0041500404' GROUP BY player_id HAVING SUM(points) >= 20 ORDER BY total_points ASC"],
  12: ["SELECT CASE WHEN points >= 20 THEN '20+ points' WHEN points >= 10 THEN '10–19 points' ELSE 'Under 10 points' END AS scoring_band, COUNT(*) AS player_stat_records FROM player_game_stats WHERE game_id = '0041500404' GROUP BY scoring_band", "SELECT CASE WHEN points > 20 THEN '20+ points' WHEN points > 10 THEN '10-19 points' ELSE 'Under 10 points' END AS scoring_band, COUNT(*) AS player_stat_records FROM player_game_stats WHERE game_id = '0041500404' GROUP BY scoring_band"],
  13: ["SELECT p.first_name || ' ' || p.last_name AS player_name, t.team_abbreviation, s.points FROM player_game_stats s JOIN players p ON s.player_id = p.player_id JOIN teams t ON s.team_id = t.team_id WHERE s.game_id = '0041500405' ORDER BY s.points ASC LIMIT 5", "SELECT p.first_name || ' ' || p.last_name AS player_name, t.team_abbreviation, s.points FROM player_game_stats s JOIN players p ON s.player_id = p.player_id JOIN teams t ON s.team_id = t.team_id WHERE s.game_id = '0041500405' ORDER BY s.points DESC, player_name DESC LIMIT 5"],
  14: ['SELECT t.team_name, SUM(s.points) AS team_points FROM player_game_stats s JOIN teams t ON s.team_id = t.team_id GROUP BY t.team_name ORDER BY team_points DESC'],
  15: ["SELECT p.first_name || ' ' || p.last_name AS player_name FROM players p LEFT JOIN player_game_stats s ON p.player_id = s.player_id WHERE s.game_id = '0041500405' AND s.player_id IS NULL ORDER BY player_name", "SELECT p.first_name || ' ' || p.last_name AS player_name FROM players p WHERE NOT EXISTS (SELECT 1 FROM player_game_stats s WHERE s.player_id = p.player_id AND s.game_id = '0041500405') ORDER BY player_name"],
  16: ['WITH team_scores AS (SELECT t.team_name, SUM(s.points) AS team_points FROM player_game_stats s JOIN teams t ON s.team_id = t.team_id GROUP BY t.team_name) SELECT team_name, team_points FROM team_scores ORDER BY team_points DESC', "SELECT t.team_name, SUM(s.points) AS team_points FROM player_game_stats s JOIN teams t ON s.team_id = t.team_id WHERE s.game_id = '0041500406' GROUP BY t.team_name ORDER BY team_points DESC"],
  17: ["WITH c AS (SELECT team_id, SUM(CASE WHEN game_id = '0041500405' THEN points END) AS game5_points, SUM(CASE WHEN game_id = '0041500406' THEN points END) AS game6_points FROM player_game_stats GROUP BY team_id) SELECT t.team_abbreviation, game5_points, game6_points, game5_points - game6_points AS point_change FROM c JOIN teams t USING (team_id) ORDER BY t.team_abbreviation"],
  18: ["WITH a AS (SELECT AVG(points) AS average_points FROM player_game_stats WHERE points > 0) SELECT p.first_name || ' ' || p.last_name AS player_name, t.team_abbreviation, s.points FROM player_game_stats s JOIN players p ON s.player_id = p.player_id JOIN teams t ON s.team_id = t.team_id CROSS JOIN a WHERE s.game_id = '0041500406' AND s.points > a.average_points ORDER BY s.points DESC, player_name", "WITH a AS (SELECT AVG(points) AS average_points FROM player_game_stats) SELECT p.first_name || ' ' || p.last_name AS player_name, t.team_abbreviation, s.points FROM player_game_stats s JOIN players p ON s.player_id = p.player_id JOIN teams t ON s.team_id = t.team_id CROSS JOIN a WHERE s.game_id = '0041500406' AND s.points > a.average_points ORDER BY player_name"],
  19: ["WITH x AS (SELECT p.first_name || ' ' || p.last_name AS player_name, SUM(s.points) AS total_points FROM player_game_stats s JOIN players p ON s.player_id = p.player_id GROUP BY s.player_id, p.first_name, p.last_name), r AS (SELECT *, RANK() OVER (ORDER BY total_points ASC) AS scoring_rank FROM x) SELECT scoring_rank, player_name, total_points FROM r WHERE scoring_rank <= 5 ORDER BY scoring_rank", "WITH x AS (SELECT p.first_name || ' ' || p.last_name AS player_name, SUM(s.points) AS total_points FROM player_game_stats s JOIN players p ON s.player_id = p.player_id GROUP BY s.player_id, p.first_name, p.last_name) SELECT ROW_NUMBER() OVER (ORDER BY total_points DESC) AS scoring_rank, player_name, total_points FROM x ORDER BY total_points DESC LIMIT 5"],
  20: ["WITH g AS (SELECT s.team_id, t.team_abbreviation, t.team_name, s.game_id, SUM(s.points) AS team_points FROM player_game_stats s JOIN teams t ON s.team_id = t.team_id GROUP BY ALL), w AS (SELECT *, LAG(team_points) OVER (PARTITION BY team_id ORDER BY game_id) AS previous_game_points, SUM(team_points) OVER (PARTITION BY team_id ORDER BY game_id) AS cumulative_points FROM g) SELECT team_abbreviation, team_name, team_points AS game7_points, previous_game_points, previous_game_points - team_points AS change_from_game6, cumulative_points FROM w WHERE game_id = '0041500407' ORDER BY team_abbreviation"],
  21: ["WITH g AS (SELECT s.game_id, s.team_id, t.team_name, SUM(s.points) AS team_points FROM player_game_stats s JOIN teams t ON s.team_id = t.team_id GROUP BY ALL), r AS (SELECT game_id, MIN(team_points) AS losing_points FROM g GROUP BY game_id) SELECT g.team_name, SUM(team_points) AS series_points, SUM(CASE WHEN team_points = losing_points THEN 1 ELSE 0 END) AS games_won FROM g JOIN r USING (game_id) GROUP BY g.team_id, g.team_name ORDER BY games_won DESC"],
}

const blockedQueries = [
  'SELECT * FROM evidence_vault.player_game_stats',
  'SELECT * FROM scope_g7.player_game_stats',
  'SELECT * FROM "scope_g7".games',
  "SELECT * FROM query_table('scope_' || 'g7.games')",
  "SELECT * FROM query('SELECT 1')",
  "SELECT * FROM read_csv_auto('player_game_stats.csv')",
  'DROP TABLE games',
  'SELECT 1; SELECT 2',
  "SET search_path = 'evidence_vault'",
  'WITH x AS (SELECT 1) INSERT INTO games SELECT * FROM x',
  '-- only a comment',
]

const allowedQueries = ["SELECT ';' AS semicolon_in_string", '-- leading comment\nSELECT 1 AS one;', '/* block */ select 1 as one']

let failures: string[] = []
const check = (condition: unknown, message: string) => { if (!condition) failures.push(message) }

async function main() {
  const db = await duckdb.createDuckDB({ mvp: { mainModule: path.join(dist, 'duckdb-mvp.wasm'), mainWorker: path.join(dist, 'duckdb-node-mvp.worker.cjs') }, eh: { mainModule: path.join(dist, 'duckdb-eh.wasm'), mainWorker: path.join(dist, 'duckdb-node-eh.worker.cjs') } }, new duckdb.VoidLogger(), duckdb.NODE_RUNTIME)
  await db.instantiate()
  db.open({ query: { castBigIntToDouble: true, castDecimalToDouble: true } })
  const setup = db.connect()
  for (const table of datasetTables) db.registerFileText(`${table}.csv`, readFileSync(path.join(root, 'public', 'data', `${table}.csv`), 'utf8'))
  setup.query(datasetSetupSql())
  const counts = arrowToResult(setup.query(datasetCountSql)).rows[0]
  datasetTables.forEach((table) => check(counts[table] === datasetCounts[table], `dataset ${table}: expected ${datasetCounts[table]} rows, found ${counts[table]}`))
  db.dropFiles()
  lockdownSql.forEach((statement) => setup.query(statement))
  setup.close()

  const runSql = (sql: string, throughGame = 7): QueryResult => {
    guardQuery(sql)
    const connection = db.connect()
    try {
      connection.query(searchPathSql(throughGame))
      return arrowToResult(connection.query(sql))
    } finally { connection.close() }
  }
  const tryRun = (sql: string, throughGame: number) => { try { return { result: runSql(sql, throughGame) } } catch (error) { return { error: error instanceof Error ? error.message : String(error) } } }

  const ids = arrowToResult((() => { const c = db.connect(); c.query(searchPathSql(7)); const r = c.query('SELECT game_id FROM games ORDER BY game_id'); c.close(); return r })()).rows.map((row) => row.game_id)
  check(JSON.stringify(ids) === JSON.stringify(['0041500401', '0041500402', '0041500403', '0041500404', '0041500405', '0041500406', '0041500407']), `game_id values must keep leading zeros: ${ids.join(', ')}`)

  check(case001Challenges.length === 21, `expected 21 challenges, found ${case001Challenges.length}`)
  check(campaignChapters.length === 7, `expected 7 chapters, found ${campaignChapters.length}`)
  campaignChapters.forEach((chapter) => {
    check(chapter.challengeIds.length === 3, `Game ${chapter.number} must contain exactly 3 challenges`)
    chapter.challengeIds.forEach((id) => check(case001Challenges[id - 1]?.game === chapter.number && case001Challenges[id - 1]?.allowedThroughGame === chapter.number, `Q${id} must belong to and be scoped to Game ${chapter.number}`))
  })
  check(new Set(case001Challenges.map((challenge) => challenge.title)).size === 21, 'challenge titles must be distinct')
  check(new Set(case001Challenges.map((challenge) => challenge.briefing)).size === 21, 'manager briefings must be distinct')
  check(!/\bJOIN\b/i.test(case001Challenges[9].solution), 'Q10 must not use JOIN')
  check(case001Challenges.slice(0, 12).every((challenge) => !/\bJOIN\b/i.test(challenge.solution)), 'JOIN must not appear before Game 5')
  check(case001Challenges.slice(0, 15).every((challenge) => !/\bWITH\b/i.test(challenge.solution)), 'CTEs must not appear before Game 6')
  check(case001Challenges.slice(0, 18).every((challenge) => !/\bOVER\b/i.test(challenge.solution)), 'Window functions must not appear before Game 7')
  check(case001Challenges[14].objective === 'Which players in the master directory have no player-stat row for Game 5? I want to know what the extract does not contain.', 'Q15 question text must match the specification')

  for (let game = 1; game <= 7; game++) {
    const scoped = runSql(scopedCountSql, game).rows[0]
    check(scoped.games === game && scoped.player_game_stats === game * 26 && scoped.players === 28 && scoped.teams === 2, `Game ${game} scope exposes ${JSON.stringify(scoped)}`)
    const future = runSql("SELECT COUNT(*) AS n FROM player_game_stats WHERE game_id > '" + `004150040${game}` + "'", game).rows[0].n
    check(future === 0, `Game ${game} scope leaks ${future} future stat rows`)
  }

  for (const sql of blockedQueries) {
    for (const game of [1, 7]) {
      const outcome = tryRun(sql, game)
      check('error' in outcome, `query should be rejected in Game ${game}: ${sql}`)
    }
  }
  const fileProbe = (() => { const c = db.connect(); try { c.query("SELECT * FROM 'player_game_stats.csv'"); return 'readable' } catch { return 'blocked' } finally { c.close() } })()
  check(fileProbe === 'blocked', 'raw CSV files must not be readable after setup')
  for (const sql of allowedQueries) check('result' in tryRun(sql, 1), `query should be allowed: ${sql}`)

  const textLeak = (challenge: CaseChallenge) => {
    const text = [challenge.briefing, challenge.objective, challenge.task, challenge.learningObjective, challenge.hint, challenge.structureHint, challenge.syntaxHint, challenge.explanation, challenge.solution].join('\n')
    const games = Array.from(text.matchAll(/\bGames?\s+([1-7])(?:\s*(?:–|-|and|,)\s*([1-7]))*/g), (match) => match[0].match(/[1-7]/g)!.map(Number)).flat()
    const ids = Array.from(text.matchAll(/00415004(0[1-7])/g), (match) => Number(match[1]))
    return [...games, ...ids].filter((game) => game > challenge.allowedThroughGame)
  }

  const report = []
  for (const challenge of case001Challenges) {
    const checks: Record<string, boolean> = {}
    let detail = ''
    try {
      const reference = runSql(challenge.solution, challenge.allowedThroughGame)
      checks.referenceExecuted = true
      checks.columnsMatch = JSON.stringify(reference.columns) === JSON.stringify(challenge.expectedOutput.columns)
      checks.rowCountMatches = reference.rows.length === challenge.expectedOutput.rows
      const fixture = canonical[challenge.id]
      if (fixture) {
        const fixtureResult = { columns: reference.columns, rows: fixture.map((row) => Object.fromEntries(reference.columns.map((column, index) => [column, row[index]]))) }
        const values = compareResults(reference, fixtureResult, challenge.expectedOutput)
        const exactOrder = JSON.stringify(reference.rows.map((row) => reference.columns.map((column) => row[column]))) === JSON.stringify(fixture)
        checks.valuesMatchVerifiedData = values.ok && (!challenge.expectedOutput.sortBy || exactOrder)
        if (!checks.valuesMatchVerifiedData) detail += ` actual=${JSON.stringify(reference.rows)}`
      } else if (challenge.id === 2) {
        checks.valuesMatchVerifiedData = reference.rows.some((row) => row.player_id === '202681' && row.first_name === 'Kyrie' && row.last_name === 'Irving')
      }
      checks.referenceAccepted = evaluateAttempt(challenge.solution, reference, reference, challenge.expectedOutput, challenge.requiredConcepts).ok
      checks.trivialWrongRejected = !evaluateAttempt('SELECT 1 AS wrong_answer', runSql('SELECT 1 AS wrong_answer', challenge.allowedThroughGame), reference, challenge.expectedOutput, challenge.requiredConcepts).ok
      checks.nearMissesRejected = (nearMisses[challenge.id] ?? []).every((sql) => {
        const outcome = tryRun(sql, challenge.allowedThroughGame)
        if ('error' in outcome) return true
        const verdict = evaluateAttempt(sql, outcome.result!, reference, challenge.expectedOutput, challenge.requiredConcepts)
        if (verdict.ok) detail += ` accepted near miss: ${sql}`
        return !verdict.ok
      })
      if (challenge.expectedOutput.sortBy && reference.rows.length > 1) {
        const reversed = { ...reference, rows: [...reference.rows].reverse() }
        checks.wrongOrderRejected = !compareResults(reversed, reference, challenge.expectedOutput).ok
      }
      const leaks = textLeak(challenge)
      checks.noFutureGameReferences = leaks.length === 0
      if (leaks.length) detail += ` future games referenced: ${leaks.join(', ')}`
      checks.hintsDoNotRevealSolution = ![challenge.hint, challenge.structureHint, challenge.syntaxHint].some((hint) => hint.replace(/\s+/g, ' ').trim().replace(/;$/, '') === challenge.solution.replace(/;$/, '')) && challenge.syntaxHint.includes('___')
      checks.starterIsNotSolution = !challenge.starterQuery.includes(challenge.solution)
    } catch (error) {
      checks.referenceExecuted = false
      detail += ` ${error instanceof Error ? error.message : String(error)}`
    }
    const passed = Object.values(checks).every(Boolean)
    if (!passed) failures.push(`Q${challenge.id} ${challenge.title}: ${Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name).join(', ')}${detail}`)
    report.push({ id: challenge.id, game: challenge.game, title: challenge.title, status: passed ? 'passed' : 'failed', checks })
  }

  const scores = runSql("WITH t AS (SELECT game_id, team_id, SUM(points) AS pts FROM player_game_stats GROUP BY ALL) SELECT game_id, MAX(CASE WHEN team_id = '1610612739' THEN pts END) AS cle, MAX(CASE WHEN team_id = '1610612744' THEN pts END) AS gsw FROM t GROUP BY game_id ORDER BY game_id", 7)
  const expectedScores = [[89, 104], [77, 110], [120, 90], [97, 108], [112, 97], [115, 101], [93, 89]]
  check(JSON.stringify(scores.rows.map((row) => [row.cle, row.gsw])) === JSON.stringify(expectedScores), `game scores differ from verified table: ${JSON.stringify(scores.rows)}`)

  const passed = report.filter((item) => item.status === 'passed').length
  writeFileSync(path.join(root, 'audit', 'curriculum-audit.json'), JSON.stringify({ engine: 'duckdb-wasm (node blocking bundle)', tested: report.length, passed, failed: report.length - passed, failures, report }, null, 2) + '\n')
  writeFileSync(path.join(root, 'audit', 'challenge-solutions.json'), JSON.stringify(case001Challenges.map(({ id, game, title, objective, task, hint, structureHint, syntaxHint, expectedOutput, requiredConcepts, solution, allowedThroughGame }) => ({ id, game, title, objective, task, hint, structureHint, syntaxHint, expectedOutput, requiredConcepts, solution, allowedThroughGame })), null, 2) + '\n')
  console.log(`Challenges: ${passed}/${report.length} passed`)
  if (failures.length) {
    console.error(failures.map((failure) => `FAIL ${failure}`).join('\n'))
    process.exit(1)
  }
  console.log('All campaign checks passed.')
}

main().catch((error) => { console.error(error); process.exit(1) })
