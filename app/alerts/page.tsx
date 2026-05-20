'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { AlertsDisplay } from '@/components/alerts-display'
import { Button } from '@/components/ui/button'
import { Loader, Plus } from 'lucide-react'
import type { Alert } from '@/lib/types'

export default function AlertsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await fetch('/api/alerts')
        if (response.ok) {
          const data = await response.json()
          setAlerts(data.alerts || [])
        }
      } catch (error) {
        console.error('[v0] Error fetching alerts:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchAlerts()
      // Refresh alerts every 30 seconds
      const interval = setInterval(fetchAlerts, 30000)
      return () => clearInterval(interval)
    }
  }, [user])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-foreground">Alertas</h1>
        </div>

        {isLoading ? (
          <div className="flex justify-center">
            <Loader className="animate-spin" />
          </div>
        ) : (
          <div className="bg-card p-6 rounded-lg border border-border">
            <AlertsDisplay alerts={alerts} maxItems={alerts.length} />
          </div>
        )}
      </div>
    </div>
  )
}
