'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react'
import type { Alert as AlertType } from '@/lib/types'

interface AlertsDisplayProps {
  alerts: AlertType[]
  maxItems?: number
}

export function AlertsDisplay({ alerts, maxItems = 5 }: AlertsDisplayProps) {
  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-destructive" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />
    }
  }

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-destructive/50 bg-destructive/10'
      case 'warning':
        return 'border-yellow-500/50 bg-yellow-500/10'
      case 'info':
        return 'border-blue-500/50 bg-blue-500/10'
      default:
        return 'border-green-500/50 bg-green-500/10'
    }
  }

  const recentAlerts = alerts.slice(0, maxItems)

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-foreground">Alertas recientes</h3>
      {recentAlerts.length === 0 ? (
        <div className="text-xs text-muted-foreground p-3 rounded border border-border">
          No hay alertas
        </div>
      ) : (
        recentAlerts.map((alert) => (
          <Alert key={alert.id} className={getAlertColor(alert.severity)}>
            <div className="flex items-start gap-2">
              {getAlertIcon(alert.severity)}
              <div className="flex-1">
                <AlertTitle className="text-sm">{alert.title}</AlertTitle>
                <AlertDescription className="text-xs mt-1">{alert.message}</AlertDescription>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    {alert.vehicle_id}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(alert.created_at).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          </Alert>
        ))
      )}
    </div>
  )
}
