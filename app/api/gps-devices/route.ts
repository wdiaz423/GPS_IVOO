import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'

export async function GET(req: NextRequest) {
  const user = await requireAuth(req)
  if (user instanceof NextResponse) return user

  const { searchParams } = new URL(req.url)
  const vehicleId = searchParams.get('vehicle_id')

  try {
    let result
    if (vehicleId) {
      result = await query(
        `SELECT gd.* FROM gps_devices gd
         JOIN vehicles v ON gd.vehicle_id = v.id
         WHERE gd.vehicle_id = $1 AND (v.user_id = $2 OR v.id IN (
           SELECT vehicle_id FROM vehicle_access WHERE user_id = $2
         ))`,
        [vehicleId, user.id]
      )
    } else {
      result = await query(
        `SELECT gd.* FROM gps_devices gd
         JOIN vehicles v ON gd.vehicle_id = v.id
         WHERE v.user_id = $1 OR v.id IN (
           SELECT vehicle_id FROM vehicle_access WHERE user_id = $1
         )`,
        [user.id]
      )
    }

    return NextResponse.json({ devices: result.rows })
  } catch (error) {
    console.error('[v0] Get devices error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch devices' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  const user = await requireAuth(req)
  if (user instanceof NextResponse) return user

  try {
    const { vehicle_id, device_name, device_type, device_id, api_key } = await req.json()

    if (!vehicle_id || !device_name || !device_type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify vehicle ownership
    const vehicleResult = await query(
      'SELECT id FROM vehicles WHERE id = $1 AND user_id = $2',
      [vehicle_id, user.id]
    )

    if (vehicleResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Vehicle not found' },
        { status: 404 }
      )
    }

    const result = await query(
      `INSERT INTO gps_devices (vehicle_id, device_name, device_type, device_id, api_key)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [vehicle_id, device_name, device_type, device_id, api_key]
    )

    return NextResponse.json({ device: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('[v0] Create device error:', error)
    return NextResponse.json(
      { error: 'Failed to create device' },
      { status: 500 }
    )
  }
}
