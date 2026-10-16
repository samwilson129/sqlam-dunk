'use client'

import * as duckdb from '@duckdb/duckdb-wasm'

const bundles = duckdb.getJsDelivrBundles()
let databasePromise: Promise<duckdb.AsyncDuckDB> | null = null

async function createDatabase() {
  const bundle = await duckdb.selectBundle(bundles)
  const workerResponse = await fetch(bundle.mainWorker!)
  if (!workerResponse.ok) throw new Error(`Could not initialize DuckDB worker (${workerResponse.status})`)
  const workerUrl = URL.createObjectURL(await workerResponse.blob())
  const worker = new Worker(workerUrl)
  const logger = new duckdb.ConsoleLogger()
  const db = new duckdb.AsyncDuckDB(logger, worker)
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker)
  const connection = await db.connect()
  const files = ['games', 'teams', 'players', 'player_game_stats']
  for (const table of files) {
    const response = await fetch(`/data/${table}.csv`)
    if (!response.ok) throw new Error(`Could not load ${table}.csv (${response.status})`)
    await db.registerFileText(`${table}.csv`, await response.text())
  }
  await connection.query(`
    CREATE TABLE games AS SELECT CAST(game_id AS VARCHAR) AS game_id, game_date FROM read_csv_auto('games.csv', header=true, all_varchar=true);
    CREATE TABLE teams AS SELECT CAST(team_id AS VARCHAR) AS team_id, team_abbreviation, team_name FROM read_csv_auto('teams.csv', header=true, all_varchar=true);
    CREATE TABLE players AS SELECT CAST(player_id AS VARCHAR) AS player_id, first_name, last_name FROM read_csv_auto('players.csv', header=true, all_varchar=true);
    CREATE TABLE player_game_stats AS SELECT
      CAST(game_id AS VARCHAR) AS game_id, CAST(player_id AS VARCHAR) AS player_id, CAST(team_id AS VARCHAR) AS team_id,
      * EXCLUDE (game_id, player_id, team_id)
      FROM read_csv_auto('player_game_stats.csv', header=true);
  `)
  const counts = await Promise.all(files.map(async (table) => Number((await connection.query(`SELECT COUNT(*) AS count FROM ${table}`)).get(0)?.count ?? 0)))
  const expected = [7, 2, 28, 182]
  if (counts.some((count, index) => count !== expected[index])) throw new Error(`Dataset validation failed. Detected ${counts.join(', ')} rows; expected 7, 2, 28, 182.`)
  return db
}

export function getDatabase() {
  if (typeof window === 'undefined') return Promise.reject(new Error('DuckDB is browser-only.'))
  if (!databasePromise) databasePromise = createDatabase()
  return databasePromise
}

export async function runSql(sql: string, allowedThroughGame = 7) {
  const normalizedSql = sql.toLowerCase()
  if (allowedThroughGame < 7) {
    const futureGameIds = Array.from({ length: 7 - allowedThroughGame }, (_, index) => String(allowedThroughGame + index + 1).padStart(2, '0')).map((suffix) => `00415004${suffix}`)
    if (futureGameIds.some((gameId) => normalizedSql.includes(gameId))) throw new Error(`This case only has evidence through Game ${allowedThroughGame}. Later game records unlock as the investigation advances.`)
    if (normalizedSql.includes('player_game_stats')) {
      const gameIdFilters = Array.from(normalizedSql.matchAll(/game_id\s*=\s*'([^']+)'/g), (match) => match[1])
      const filtersGameEvidence = gameIdFilters.length > 0 || normalizedSql.includes('game_id in') || normalizedSql.includes("like '00415004%'")
      const requestsAllGames = normalizedSql.includes("like '00415004%'") || normalizedSql.includes('game_id in')
      if (!filtersGameEvidence || (requestsAllGames && allowedThroughGame < 7)) throw new Error(`Player-game evidence is scoped to the latest unlocked game. Filter by game_id before querying it.`)
    }
  }
  const db = await getDatabase()
  const connection = await db.connect()
  try {
    const result = await connection.query(sql)
    const columns = result.schema.fields.map((field) => field.name)
    const rows = result.toArray().map((row) => Object.fromEntries(columns.map((column, index) => [column, Array.isArray(row) ? row[index] : (row as Record<string, unknown>)[column] ?? (row as Record<number, unknown>)[index] ?? Object.values(row as object)[index]])))
    return { columns, rows }
  } finally {
    await connection.close()
  }
}

export const datasetCounts = { games: 7, teams: 2, players: 28, player_game_stats: 182 }
