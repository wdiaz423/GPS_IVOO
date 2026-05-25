import { NextResponse } from 'next/server'
import { initializeDatabase } from '@/lib/init-db'

export async function GET() {
  try {
    console.log('[v0] Setup API called - initializing database')
    const success = initializeDatabase()

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Database initialized successfully',
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          message: 'Database initialization failed',
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('[v0] Setup error:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
