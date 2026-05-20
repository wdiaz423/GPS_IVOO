import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'

export async function GET(req: NextRequest) {
  const user = await requireAuth(req)
  if (user instanceof NextResponse) return user

  try {
    const result = await query(
      `SELECT v.* FROM vehicles v
       WHERE v.user_id = $1 OR v.id IN (
         SELECT vehicle_id FROM vehicle_access WHERE user_id = $1
       )
       ORDER BY v.created_at DESC`,
      [user.id]
    )

    return NextResponse.json({ vehicles: result.rows })
  } catch (error) {
    console.error('[v0] Get vehicles error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch vehicles' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  const user = await requireAuth(req)
  if (user instanceof NextResponse) return user

  try {
    const { name, make, model, year, license_plate, vin, color } = await req.json()

    if (!name) {
      return NextResponse.json(
        { error: 'Vehicle name is required' },
        { status: 400 }
      )
    }

    const result = await query(
      `INSERT INTO vehicles (user_id, name, make, model, year, license_plate, vin, color)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [user.id, name, make, model, year, license_plate, vin, color]
    )

    const vehicle = result.rows[0]

    // Add owner access
    await query(
      `INSERT INTO vehicle_access (vehicle_id, user_id, access_level)
       VALUES ($1, $2, 'owner')`,
      [vehicle.id, user.id]
    )

    return NextResponse.json({ vehicle }, { status: 201 })
  } catch (error) {
    console.error('[v0] Create vehicle error:', error)
    return NextResponse.json(
      { error: 'Failed to create vehicle' },
      { status: 500 }
    )
  }
}
