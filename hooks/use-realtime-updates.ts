'use client'

import { useEffect, useState, useRef } from 'react'
import type { VehicleLocation } from '@/lib/types'

interface RealtimeMessage {
  type: 'location_update' | 'telemetry_update' | 'alert' | 'connection'
  data: any
}

export function useRealtimeUpdates() {
  const [locations, setLocations] = useState<Record<string, VehicleLocation>>({})
  const [connected, setConnected] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    try {
      const eventSource = new EventSource('/api/updates')

      eventSource.addEventListener('open', () => {
        console.log('[v0] SSE connected')
        setConnected(true)
      })

      eventSource.addEventListener('message', (event) => {
        try {
          const message: RealtimeMessage = JSON.parse(event.data)

          if (message.type === 'location_update') {
            setLocations((prev) => ({
              ...prev,
              [message.data.vehicle_id]: message.data,
            }))
          }
        } catch (err) {
          console.error('[v0] Failed to parse SSE message:', err)
        }
      })

      eventSource.addEventListener('error', () => {
        console.error('[v0] SSE error')
        setConnected(false)
        eventSource.close()
      })

      eventSourceRef.current = eventSource

      return () => {
        eventSource.close()
      }
    } catch (err) {
      console.error('[v0] Failed to connect SSE:', err)
    }
  }, [])

  return { locations, connected }
}
