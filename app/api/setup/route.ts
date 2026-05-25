import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import fs from 'fs'
import path from 'path'

export async function GET(req: NextRequest) {
  try {
    console.log('[v0] Setup API called - initializing database')
    
    // Read and execute the schema setup script
    const schemaPath = path.join(process.cwd(), 'scripts', '001-setup-gps-tracking-schema.sql')
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8')

    // Split by semicolons and execute each statement
    const statements = schemaSql.split(';').filter(stmt => stmt.trim())

    for (const statement of statements) {
      await query(statement)
    }

    // Also run the OAuth migration
    const oauthPath = path.join(process.cwd(), 'scripts', '002-add-oauth-fields.sql')
    if (fs.existsSync(oauthPath)) {
      const oauthSql = fs.readFileSync(oauthPath, 'utf-8')
      const oauthStatements = oauthSql.split(';').filter(stmt => stmt.trim())
      for (const statement of oauthStatements) {
        await query(statement)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Database schema created successfully',
      statementsExecuted: statements.length,
    })
  } catch (error) {
    console.error('[v0] Database setup error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
