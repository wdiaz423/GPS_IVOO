import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { vehicle_id, latitude, longitude, altitude, accuracy_meters, heading, speed_kmh } = await req.json()

    if (!vehicle_id || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify vehicle exists
    const vehicleResult = await query(
      'SELECT id FROM vehicles WHERE id = $1',
      [vehicle_id]
    )

    if (vehicleResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Vehicle not found' },
        { status: 404 }
      )
    }

    // Insert location
    const result = await query(
      `INSERT INTO vehicle_locations (vehicle_id, latitude, longitude, altitude, accuracy_meters, heading, speed_kmh)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [vehicle_id, latitude, longitude, altitude, accuracy_meters, heading, speed_kmh]
    )

    return NextResponse.json({ location: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('[v0] Update location error:', error)
    return NextResponse.json(
      { error: 'Failed to update location' },
      { status: 500 }
    )
  }
}
