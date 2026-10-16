export type SortKey = { column: string; direction: 'asc' | 'desc' }
export type QueryResult = { columns: string[]; rows: Record<string, unknown>[] }
export type ExpectedOutput = { columns: string[]; rows: number; sortBy?: SortKey[] }
export type Verdict = { ok: true } | { ok: false; reason: string }

export const datasetTables = ['games', 'teams', 'players', 'player_game_stats'] as const
export const datasetCounts = { games: 7, teams: 2, players: 28, player_game_stats: 182 }
export const finalGame = 7

const vaultSchema = 'evidence_vault'
export const scopeSchema = (throughGame: number) => `scope_g${throughGame}`
export const gameIdFor = (game: number) => `004150040${game}`

export function datasetSetupSql() {
  const scopes = Array.from({ length: finalGame }, (_, index) => {
    const game = index + 1
    const schema = scopeSchema(game)
    const lastGameId = gameIdFor(game)
    return `
    CREATE SCHEMA ${schema};
    CREATE VIEW ${schema}.games AS SELECT * FROM ${vaultSchema}.games WHERE game_id <= '${lastGameId}';
    CREATE VIEW ${schema}.teams AS SELECT * FROM ${vaultSchema}.teams;
    CREATE VIEW ${schema}.players AS SELECT * FROM ${vaultSchema}.players;
    CREATE VIEW ${schema}.player_game_stats AS SELECT * FROM ${vaultSchema}.player_game_stats WHERE game_id <= '${lastGameId}';`
  }).join('\n')
  return `
    CREATE SCHEMA ${vaultSchema};
    CREATE TABLE ${vaultSchema}.games AS SELECT CAST(game_id AS VARCHAR) AS game_id, game_date FROM read_csv_auto('games.csv', header=true, all_varchar=true);
    CREATE TABLE ${vaultSchema}.teams AS SELECT CAST(team_id AS VARCHAR) AS team_id, team_abbreviation, team_name FROM read_csv_auto('teams.csv', header=true, all_varchar=true);
    CREATE TABLE ${vaultSchema}.players AS SELECT CAST(player_id AS VARCHAR) AS player_id, first_name, last_name FROM read_csv_auto('players.csv', header=true, all_varchar=true);
    CREATE TABLE ${vaultSchema}.player_game_stats AS SELECT
      CAST(game_id AS VARCHAR) AS game_id, CAST(player_id AS VARCHAR) AS player_id, CAST(team_id AS VARCHAR) AS team_id,
      * EXCLUDE (game_id, player_id, team_id)
      FROM read_csv_auto('player_game_stats.csv', header=true, types={'game_id': 'VARCHAR', 'player_id': 'VARCHAR', 'team_id': 'VARCHAR'});
    ${scopes}
  `
}

export const datasetCountSql = `SELECT ${datasetTables.map((table) => `(SELECT COUNT(*) FROM ${vaultSchema}.${table}) AS ${table}`).join(', ')}`
export const scopedCountSql = `SELECT ${datasetTables.map((table) => `(SELECT COUNT(*) FROM ${table}) AS ${table}`).join(', ')}`
export const searchPathSql = (throughGame: number) => `SET search_path = '${scopeSchema(clampGame(throughGame))}'`
export const lockdownSql = ['SET enable_external_access = false', 'SET lock_configuration = true']

function clampGame(game: number) {
  return Number.isInteger(game) ? Math.min(finalGame, Math.max(1, game)) : finalGame
}

export function stripSql(sql: string) {
  let output = ''
  let index = 0
  while (index < sql.length) {
    const char = sql[index]
    const next = sql[index + 1]
    if (char === '-' && next === '-') {
      while (index < sql.length && sql[index] !== '\n') index++
      output += ' '
    } else if (char === '/' && next === '*') {
      const end = sql.indexOf('*/', index + 2)
      index = end === -1 ? sql.length : end + 2
      output += ' '
    } else if (char === "'") {
      index++
      while (index < sql.length) {
        if (sql[index] === "'" && sql[index + 1] === "'") index += 2
        else if (sql[index] === "'") break
        else index++
      }
      index++
      output += "''"
    } else if (char === '$' && next === '$') {
      const end = sql.indexOf('$$', index + 2)
      index = end === -1 ? sql.length : end + 2
      output += "''"
    } else {
      output += char
      index++
    }
  }
  return output
}

const writeKeywords = /\b(INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|ATTACH|DETACH|COPY|EXPORT|IMPORT|INSTALL|LOAD|PRAGMA|SET|RESET|CALL|USE|CHECKPOINT|VACUUM|TRUNCATE|MERGE|PREPARE|EXECUTE)\b/i
const blockedFunctions = /\b(query|query_table|read_\w+|glob|sniff_csv|parquet_\w+|getvariable|getenv)\s*\(/i
const internalNames = new RegExp(`${vaultSchema}|scope_g\\d`, 'i')

export class QueryRejectedError extends Error {}

export function guardQuery(sql: string) {
  const stripped = stripSql(sql)
  const statements = stripped.split(';').map((part) => part.trim())
  if (!statements[0]) throw new QueryRejectedError('Write a SELECT query before running. Comments on their own are not a query.')
  if (statements.slice(1).some(Boolean)) throw new QueryRejectedError('Run one query at a time. Remove everything after the first semicolon.')
  if (!/^\(*\s*(SELECT|WITH|FROM)\b/i.test(statements[0])) {
    const firstWord = statements[0].match(/^[(\s]*([A-Za-z_]+)/)?.[1] ?? statements[0].slice(0, 12)
    if (writeKeywords.test(firstWord)) throw new QueryRejectedError(`The case file is read-only. "${firstWord.toUpperCase()}" statements are not allowed; start your query with SELECT or WITH.`)
    throw new QueryRejectedError(`Queries must start with SELECT or WITH, but this one starts with "${firstWord}". Check the spelling of the first keyword.`)
  }
  if (writeKeywords.test(statements[0])) throw new QueryRejectedError(`The case file is read-only. "${statements[0].match(writeKeywords)?.[1].toUpperCase()}" statements are not allowed.`)
  if (blockedFunctions.test(statements[0])) throw new QueryRejectedError('File and dynamic table functions are disabled. Query the case tables directly: games, teams, players and player_game_stats.')
  if (internalNames.test(sql)) throw new QueryRejectedError('That table is not part of the case file. Query games, teams, players and player_game_stats directly.')
}

export function mentionedFutureGame(sql: string, throughGame: number) {
  const ids = Array.from(sql.matchAll(/00415004(0[1-7])/g), (match) => Number(match[1]))
  const future = ids.filter((game) => game > throughGame)
  return future.length ? Math.min(...future) : null
}

type ArrowLike = { schema: { fields: { name: string }[] }; toArray(): unknown[] }

export function arrowToResult(table: ArrowLike): QueryResult {
  const columns = table.schema.fields.map((field) => field.name)
  const rows = table.toArray().map((row) => {
    const record = (row && typeof (row as { toJSON?: () => unknown }).toJSON === 'function' ? (row as { toJSON: () => Record<string, unknown> }).toJSON() : row) as Record<string, unknown>
    return Object.fromEntries(columns.map((column) => [column, toPlainValue(record[column])]))
  })
  return { columns, rows }
}

function toPlainValue(value: unknown): unknown {
  if (typeof value === 'bigint') return Number(value)
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return value
}

export function normalizeValue(value: unknown) {
  if (value === null || value === undefined) return 'NULL'
  if (typeof value === 'bigint') return `NUMBER:${Number(value).toFixed(6)}`
  if (typeof value === 'number' || (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value)))) return `NUMBER:${Number(value).toFixed(6)}`
  return `TEXT:${String(value).trim()}`
}

function columnLookup(result: QueryResult) {
  return new Map(result.columns.map((column) => [column.toLowerCase(), column]))
}

function compareForSort(left: unknown, right: unknown) {
  if (left === right) return 0
  if (left === null || left === undefined) return 1
  if (right === null || right === undefined) return -1
  if (typeof left === 'number' && typeof right === 'number') return left - right
  const a = String(left)
  const b = String(right)
  return a < b ? -1 : a > b ? 1 : 0
}

export function formatSort(sortBy: SortKey[]) {
  return sortBy.map((key) => `${key.column} ${key.direction.toUpperCase()}`).join(', ')
}

export function compareResults(actual: QueryResult, expected: QueryResult, spec: ExpectedOutput): Verdict {
  const actualColumns = columnLookup(actual)
  const expectedColumns = spec.columns.map((column) => column.toLowerCase())
  const missing = spec.columns.filter((column) => !actualColumns.has(column.toLowerCase()))
  const extra = actual.columns.filter((column) => !expectedColumns.includes(column.toLowerCase()))
  if (missing.length) return { ok: false, reason: `Missing column${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}. Name result columns exactly as listed in the task (use AS to rename a calculated column).` }
  if (extra.length) return { ok: false, reason: `Remove the extra column${extra.length > 1 ? 's' : ''}: ${extra.join(', ')}. The task asks for exactly: ${spec.columns.join(', ')}.` }
  if (actual.rows.length !== expected.rows.length) return { ok: false, reason: `Your query returned ${actual.rows.length} row${actual.rows.length === 1 ? '' : 's'}; this assignment expects ${expected.rows.length}. Check your filters${spec.sortBy ? ', LIMIT' : ''} and grouping.` }
  const expectedLookup = columnLookup(expected)
  const key = (row: Record<string, unknown>, lookup: Map<string, string>) => expectedColumns.map((column) => normalizeValue(row[lookup.get(column) ?? column])).join('\u001f')
  const counts = new Map<string, number>()
  expected.rows.forEach((row) => { const rowKey = key(row, expectedLookup); counts.set(rowKey, (counts.get(rowKey) ?? 0) + 1) })
  for (const row of actual.rows) {
    const rowKey = key(row, actualColumns)
    const remaining = counts.get(rowKey) ?? 0
    if (remaining === 0) return { ok: false, reason: 'The columns and row count are right, but some values do not match the evidence. Re-check your conditions, calculations and labels.' }
    counts.set(rowKey, remaining - 1)
  }
  if (spec.sortBy?.length) {
    for (let index = 1; index < actual.rows.length; index++) {
      for (const sortKey of spec.sortBy) {
        const column = actualColumns.get(sortKey.column.toLowerCase()) ?? sortKey.column
        const difference = compareForSort(actual.rows[index - 1][column], actual.rows[index][column])
        const signed = sortKey.direction === 'desc' ? -difference : difference
        if (signed < 0) break
        if (signed > 0) return { ok: false, reason: `The rows are right, but not in the requested order. Sort by ${formatSort(spec.sortBy)}.` }
      }
    }
  }
  return { ok: true }
}

export const conceptPatterns = {
  WHERE: /\bWHERE\b/i,
  'ORDER BY': /\bORDER\s+BY\b/i,
  LIMIT: /\bLIMIT\b/i,
  COUNT: /\bCOUNT\s*\(/i,
  SUM: /\bSUM\s*\(/i,
  AVG: /\bAVG\s*\(/i,
  ROUND: /\bROUND\s*\(/i,
  'GROUP BY': /\bGROUP\s+BY\b/i,
  HAVING: /\bHAVING\b/i,
  CASE: /\bCASE\b/i,
  JOIN: /\bJOIN\b/i,
  'LEFT JOIN': /\bLEFT\s+(OUTER\s+)?JOIN\b/i,
  'IS NULL': /\bIS\s+NULL\b/i,
  WITH: /\bWITH\b/i,
  RANK: /\bRANK\s*\(\s*\)\s*OVER\b/i,
  LAG: /\bLAG\s*\(/i,
  'RUNNING SUM': /\bSUM\s*\([^;]*?\)\s*OVER\s*\(/i,
} as const

export type ConceptKey = keyof typeof conceptPatterns

export function missingConcepts(sql: string, required: readonly ConceptKey[]) {
  const stripped = stripSql(sql)
  return required.filter((concept) => !conceptPatterns[concept].test(stripped))
}

export function evaluateAttempt(sql: string, actual: QueryResult, expected: QueryResult, spec: ExpectedOutput, required: readonly ConceptKey[] = []): Verdict {
  const verdict = compareResults(actual, expected, spec)
  if (!verdict.ok) return verdict
  const missing = missingConcepts(sql, required)
  if (missing.length) return { ok: false, reason: `Your result matches, but this challenge practises ${missing.join(' and ')}. Rewrite the query using ${missing.length > 1 ? 'them' : 'it'} to log the evidence.` }
  return { ok: true }
}
