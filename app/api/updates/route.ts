import { query } from '@/lib/db'
import { verifySession } from '@/lib/auth-middleware'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const user = await verifySession(request)

    if (!user) {
      return new Response('Unauthorized', { status: 401 })
    }

    // Create SSE stream for real-time updates
    const encoder = new TextEncoder()
    let isOpen = true

    const stream = new ReadableStream({
      async start(controller) {
        // Send initial connection message
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'connection', connected: true })}\n\n`)
        )

        // Poll for location updates every 5 seconds
        const interval = setInterval(async () => {
          if (!isOpen) {
            clearInterval(interval)
            return
          }

          try {
            // Get user's vehicles
            const vehiclesResult = await query(
              'SELECT id FROM vehicles WHERE owner_id = $1 OR fleet_id IN (SELECT fleet_id FROM fleet_members WHERE user_id = $1)',
              [user.id]
            )

            const vehicleIds = vehiclesResult.rows.map((v: any) => v.id)

            if (vehicleIds.length > 0) {
              // Get latest locations
              const locationsResult = await query(
                'SELECT * FROM vehicle_locations WHERE vehicle_id = ANY($1) AND created_at > NOW() - INTERVAL \'10 seconds\' ORDER BY created_at DESC',
                [vehicleIds]
              )

              if (locationsResult.rows.length > 0) {
                locationsResult.rows.forEach((location: any) => {
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({ type: 'location_update', data: location })}\n\n`
                    )
                  )
                })
              }
            }
          } catch (error) {
            console.error('[v0] Error fetching updates:', error)
          }
        }, 5000)

        // Cleanup on close
        const cleanup = () => {
          isOpen = false
          clearInterval(interval)
          controller.close()
        }

        request.signal.addEventListener('abort', cleanup)
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('[v0] SSE error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}
