import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'

export async function GET(req: NextRequest) {
  const user = await requireAuth(req)
  if (user instanceof NextResponse) return user

  const { searchParams } = new URL(req.url)
  const vehicleId = searchParams.get('vehicle_id')
  const limit = parseInt(searchParams.get('limit') || '100')
  const hours = parseInt(searchParams.get('hours') || '24')

  try {
    if (!vehicleId) {
      return NextResponse.json(
        { error: 'vehicle_id is required' },
        { status: 400 }
      )
    }

    // Verify access
    const accessResult = await query(
      `SELECT v.id FROM vehicles v
       WHERE v.id = $1 AND (v.user_id = $2 OR v.id IN (
         SELECT vehicle_id FROM vehicle_access WHERE user_id = $2
       ))`,
      [vehicleId, user.id]
    )

    if (accessResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    const result = await query(
      `SELECT * FROM vehicle_locations
       WHERE vehicle_id = $1 AND created_at > NOW() - INTERVAL '1 hour' * $2
       ORDER BY created_at DESC
       LIMIT $3`,
      [vehicleId, hours, limit]
    )

    return NextResponse.json({ locations: result.rows })
  } catch (error) {
    console.error('[v0] Get location history error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch location history' },
      { status: 500 }
    )
  }
}
