import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { vehicle_id, speed_kmh, rpm, fuel_level_percent, engine_temp_celsius, mileage_km, battery_voltage } = await req.json()

    if (!vehicle_id) {
      return NextResponse.json(
        { error: 'vehicle_id is required' },
        { status: 400 }
      )
    }

    const result = await query(
      `INSERT INTO vehicle_telemetry (vehicle_id, speed_kmh, rpm, fuel_level_percent, engine_temp_celsius, mileage_km, battery_voltage)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [vehicle_id, speed_kmh, rpm, fuel_level_percent, engine_temp_celsius, mileage_km, battery_voltage]
    )

    return NextResponse.json({ telemetry: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('[v0] Update telemetry error:', error)
    return NextResponse.json(
      { error: 'Failed to update telemetry' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const vehicleId = searchParams.get('vehicle_id')

  try {
    if (!vehicleId) {
      return NextResponse.json(
        { error: 'vehicle_id is required' },
        { status: 400 }
      )
    }

    const result = await query(
      `SELECT * FROM vehicle_telemetry
       WHERE vehicle_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [vehicleId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ telemetry: null })
    }

    return NextResponse.json({ telemetry: result.rows[0] })
  } catch (error) {
    console.error('[v0] Get telemetry error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch telemetry' },
      { status: 500 }
    )
  }
}
