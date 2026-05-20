import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'

export async function GET(req: NextRequest) {
  const user = await requireAuth(req)
  if (user instanceof NextResponse) return user

  try {
    const result = await query(
      'SELECT * FROM geofences WHERE user_id = $1 ORDER BY created_at DESC',
      [user.id]
    )

    return NextResponse.json({ geofences: result.rows })
  } catch (error) {
    console.error('[v0] Get geofences error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch geofences' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  const user = await requireAuth(req)
  if (user instanceof NextResponse) return user

  try {
    const { name, latitude, longitude, radius_meters, fence_type, alert_on_entry, alert_on_exit } = await req.json()

    if (!name || latitude === undefined || longitude === undefined || !radius_meters) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const result = await query(
      `INSERT INTO geofences (user_id, name, latitude, longitude, radius_meters, fence_type, alert_on_entry, alert_on_exit)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [user.id, name, latitude, longitude, radius_meters, fence_type || 'circular', alert_on_entry !== false, alert_on_exit !== false]
    )

    return NextResponse.json({ geofence: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('[v0] Create geofence error:', error)
    return NextResponse.json(
      { error: 'Failed to create geofence' },
      { status: 500 }
    )
  }
}
