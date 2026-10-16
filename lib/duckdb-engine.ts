'use client'

import * as duckdb from '@duckdb/duckdb-wasm'
import { arrowToResult, datasetCountSql, datasetCounts, datasetSetupSql, datasetTables, guardQuery, lockdownSql, searchPathSql, type QueryResult } from './campaign-sql'

const bundles = duckdb.getJsDelivrBundles()
let databasePromise: Promise<duckdb.AsyncDuckDB> | null = null

async function createDatabase() {
  const bundle = await duckdb.selectBundle(bundles)
  const workerResponse = await fetch(bundle.mainWorker!)
  if (!workerResponse.ok) throw new Error(`Could not initialize DuckDB worker (${workerResponse.status})`)
  const workerUrl = URL.createObjectURL(await workerResponse.blob())
  const worker = new Worker(workerUrl)
  const logger = new duckdb.ConsoleLogger(duckdb.LogLevel.WARNING)
  const db = new duckdb.AsyncDuckDB(logger, worker)
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker)
  await db.open({ query: { castBigIntToDouble: true, castDecimalToDouble: true } })
  const connection = await db.connect()
  try {
    for (const table of datasetTables) {
      const response = await fetch(`/data/${table}.csv`)
      if (!response.ok) throw new Error(`Could not load ${table}.csv (${response.status})`)
      await db.registerFileText(`${table}.csv`, await response.text())
    }
    await connection.query(datasetSetupSql())
    const counts = arrowToResult(await connection.query(datasetCountSql)).rows[0] ?? {}
    const detected = datasetTables.map((table) => Number(counts[table] ?? 0))
    const expected = datasetTables.map((table) => datasetCounts[table])
    if (detected.some((count, index) => count !== expected[index])) throw new Error(`Dataset validation failed. Detected ${detected.join(', ')} rows; expected ${expected.join(', ')}.`)
    await db.dropFiles()
    for (const statement of lockdownSql) {
      try { await connection.query(statement) } catch (error) { console.warn('DuckDB lockdown setting failed', statement, error) }
    }
  } finally {
    await connection.close()
  }
  return db
}

export function getDatabase() {
  if (typeof window === 'undefined') return Promise.reject(new Error('DuckDB is browser-only.'))
  if (!databasePromise) databasePromise = createDatabase().catch((error) => { databasePromise = null; throw error })
  return databasePromise
}

export async function runSql(sql: string, allowedThroughGame = 7): Promise<QueryResult> {
  guardQuery(sql)
  const db = await getDatabase()
  const connection = await db.connect()
  try {
    await connection.query(searchPathSql(allowedThroughGame))
    return arrowToResult(await connection.query(sql))
  } finally {
    await connection.close()
  }
}

export { datasetCounts }
