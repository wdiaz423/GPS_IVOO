import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'

export async function GET(req: NextRequest) {
  const user = await requireAuth(req)
  if (user instanceof NextResponse) return user

  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get('limit') || '50')

  try {
    const result = await query(
      `SELECT * FROM alerts
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [user.id, limit]
    )

    return NextResponse.json({ alerts: result.rows })
  } catch (error) {
    console.error('[v0] Get alerts error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const { vehicle_id, user_id, alert_type, message, severity } = await req.json()

    if (!vehicle_id || !user_id || !alert_type || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const result = await query(
      `INSERT INTO alerts (vehicle_id, user_id, alert_type, message, severity)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [vehicle_id, user_id, alert_type, message, severity || 'info']
    )

    return NextResponse.json({ alert: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('[v0] Create alert error:', error)
    return NextResponse.json(
      { error: 'Failed to create alert' },
      { status: 500 }
    )
  }
}
