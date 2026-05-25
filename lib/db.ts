import { getDatabase, queryOne as sqliteQueryOne, query as sqliteQuery, execute, transaction } from './db-sqlite'

// For development with SQLite
// If using Aurora PostgreSQL in production, replace with pg Pool

function convertSql(sql: string): string {
  return sql
    .replace(/\$(\d+)/g, '?') // Replace $1, $2 with ?
    .replace(/SERIAL/g, 'INTEGER') // SERIAL -> INTEGER
    .replace(/TIMESTAMPTZ/g, 'DATETIME') // TIMESTAMPTZ -> DATETIME
    .replace(/DEFAULT CURRENT_TIMESTAMP/g, "DEFAULT CURRENT_TIMESTAMP DEFAULT (datetime('now'))") // Handle timestamps
}

export function query(sql: string, params?: any[]) {
  const sqliteSql = convertSql(sql)
  return sqliteQuery(sqliteSql, params)
}

export function queryOne(sql: string, params?: any[]) {
  const sqliteSql = convertSql(sql)
  return sqliteQueryOne(sqliteSql, params)
}

export function exec(sql: string, params?: any[]) {
  const sqliteSql = convertSql(sql)
  return execute(sqliteSql, params)
}

export { transaction }

