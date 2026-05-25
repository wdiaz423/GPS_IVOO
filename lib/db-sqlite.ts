import Database from 'better-sqlite3'
import path from 'path'

let db: Database.Database | null = null

export function getDatabase() {
  if (!db) {
    const dbPath = path.join(process.cwd(), 'data', 'app.db')
    db = new Database(dbPath)
    db.pragma('journal_mode = WAL')
  }
  return db
}

export function query(sql: string, params?: any[]) {
  const database = getDatabase()
  try {
    const stmt = database.prepare(sql)
    if (params) {
      return stmt.all(...params)
    }
    return stmt.all()
  } catch (error) {
    console.error('[v0] Database query error:', error)
    throw error
  }
}

export function queryOne(sql: string, params?: any[]) {
  const database = getDatabase()
  try {
    const stmt = database.prepare(sql)
    if (params) {
      return stmt.get(...params)
    }
    return stmt.get()
  } catch (error) {
    console.error('[v0] Database query error:', error)
    throw error
  }
}

export function execute(sql: string, params?: any[]) {
  const database = getDatabase()
  try {
    const stmt = database.prepare(sql)
    if (params) {
      return stmt.run(...params)
    }
    return stmt.run()
  } catch (error) {
    console.error('[v0] Database execute error:', error)
    throw error
  }
}

export function transaction<T>(fn: () => T): T {
  const database = getDatabase()
  return database.transaction(fn)()
}
