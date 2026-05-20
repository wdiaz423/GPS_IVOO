import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAuth(req)
  if (user instanceof NextResponse) return user

  try {
    const { id } = await params
    const vehicleId = parseInt(id)

    const result = await query(
      `SELECT v.* FROM vehicles v
       WHERE v.id = $1 AND (v.user_id = $2 OR v.id IN (
         SELECT vehicle_id FROM vehicle_access WHERE user_id = $2
       ))`,
      [vehicleId, user.id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Vehicle not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ vehicle: result.rows[0] })
  } catch (error) {
    console.error('[v0] Get vehicle error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch vehicle' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAuth(req)
  if (user instanceof NextResponse) return user

  try {
    const { id } = await params
    const vehicleId = parseInt(id)
    const { name, make, model, year, license_plate, vin, color, status } = await req.json()

    // Verify ownership
    const ownerResult = await query(
      'SELECT id FROM vehicles WHERE id = $1 AND user_id = $2',
      [vehicleId, user.id]
    )

    if (ownerResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Not authorized to update this vehicle' },
        { status: 403 }
      )
    }

    const result = await query(
      `UPDATE vehicles SET name = $1, make = $2, model = $3, year = $4, license_plate = $5, vin = $6, color = $7, status = $8, updated_at = NOW()
       WHERE id = $9
       RETURNING *`,
      [name, make, model, year, license_plate, vin, color, status, vehicleId]
    )

    return NextResponse.json({ vehicle: result.rows[0] })
  } catch (error) {
    console.error('[v0] Update vehicle error:', error)
    return NextResponse.json(
      { error: 'Failed to update vehicle' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAuth(req)
  if (user instanceof NextResponse) return user

  try {
    const { id } = await params
    const vehicleId = parseInt(id)

    // Verify ownership
    const ownerResult = await query(
      'SELECT id FROM vehicles WHERE id = $1 AND user_id = $2',
      [vehicleId, user.id]
    )

    if (ownerResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Not authorized to delete this vehicle' },
        { status: 403 }
      )
    }

    await query('DELETE FROM vehicles WHERE id = $1', [vehicleId])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Delete vehicle error:', error)
    return NextResponse.json(
      { error: 'Failed to delete vehicle' },
      { status: 500 }
    )
  }
}
