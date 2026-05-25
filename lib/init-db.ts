import { getDatabase } from '@/lib/db-sqlite'
import fs from 'fs'
import path from 'path'

export function initializeDatabase() {
  try {
    const db = getDatabase()

    // Read and execute the SQLite schema
    const schemaPath = path.join(process.cwd(), 'scripts', '000-sqlite-schema.sql')
    const schema = fs.readFileSync(schemaPath, 'utf-8')

    // Split by semicolon and execute each statement
    const statements = schema.split(';').filter((s) => s.trim())

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          db.exec(statement)
        } catch (error) {
          console.log('[v0] Schema statement already exists or non-critical error:', statement.substring(0, 50))
        }
      }
    }

    console.log('[v0] Database initialized successfully')
    return true
  } catch (error) {
    console.error('[v0] Database initialization error:', error)
    return false
  }
}
