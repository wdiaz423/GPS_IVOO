'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin, AlertCircle, Zap, Navigation2, LogOut } from 'lucide-react'
import VehicleMap from './vehicle-map'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function Dashboard() {
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null)
  const [user, setUser] = useState<any>(null)

  // Fetch vehicles
  const { data: vehiclesData, isLoading: vehiclesLoading } = useSWR(
    user ? '/api/vehicles' : null,
    fetcher,
    { refreshInterval: 5000 } // Refresh every 5 seconds
  )

  // Fetch alerts
  const { data: alertsData } = useSWR(
    user ? '/api/alerts?limit=10' : null,
    fetcher,
    { refreshInterval: 5000 }
  )

  // Fetch locations for selected vehicle
  const { data: locationsData } = useSWR(
    selectedVehicleId ? `/api/locations/history?vehicle_id=${selectedVehicleId}&hours=24&limit=100` : null,
    fetcher,
    { refreshInterval: 10000 } // Refresh every 10 seconds
  )

  // Fetch telemetry for selected vehicle
  const { data: telemetryData } = useSWR(
    selectedVehicleId ? `/api/telemetry?vehicle_id=${selectedVehicleId}` : null,
    fetcher,
    { refreshInterval: 5000 }
  )

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const data = await response.json()
          setUser(data.user)
        } else {
          window.location.href = '/login'
        }
      } catch (error) {
        window.location.href = '/login'
      }
    }

    checkSession()
  }, [])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  if (!user) return <div className="flex items-center justify-center h-screen text-foreground">Loading...</div>

  const vehicles = vehiclesData?.vehicles || []
  const alerts = alertsData?.alerts || []
  const selectedVehicle = vehicles.find((v: any) => v.id === selectedVehicleId)
  const locations = locationsData?.locations || []
  const telemetry = telemetryData?.telemetry

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-80 border-r border-border bg-card flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <h1 className="text-2xl font-bold text-primary">Fleet Tracker</h1>
          <p className="text-sm text-muted-foreground mt-1">{user.full_name}</p>
        </div>

        {/* Vehicles List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <h2 className="font-semibold text-sm mb-4">Vehicles ({vehicles.length})</h2>
          {vehiclesLoading ? (
            <div className="text-muted-foreground text-sm">Loading vehicles...</div>
          ) : vehicles.length === 0 ? (
            <div className="text-muted-foreground text-sm">No vehicles yet</div>
          ) : (
            vehicles.map((vehicle: any) => (
              <button
                key={vehicle.id}
                onClick={() => setSelectedVehicleId(vehicle.id)}
                className={`w-full p-4 rounded-lg border transition-all text-left ${
                  selectedVehicleId === vehicle.id
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">{vehicle.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{vehicle.license_plate || 'N/A'}</p>
                  </div>
                  <Badge variant={vehicle.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                    {vehicle.status}
                  </Badge>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Recent Alerts */}
        <div className="border-t border-border p-4 space-y-3">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-destructive" />
            Recent Alerts
          </h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="text-xs text-muted-foreground">No alerts</div>
            ) : (
              alerts.slice(0, 3).map((alert: any) => (
                <div
                  key={alert.id}
                  className="p-2 rounded-lg bg-destructive/10 border border-destructive/30 text-xs"
                >
                  <p className="font-medium text-destructive">{alert.alert_type}</p>
                  <p className="text-muted-foreground text-xs">{alert.message}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Logout */}
        <div className="border-t border-border p-4">
          <Button onClick={handleLogout} variant="outline" size="sm" className="w-full">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Map */}
        <div className="flex-1 relative bg-card">
          {selectedVehicle ? (
            <VehicleMap
              vehicle={selectedVehicle}
              locations={locations}
              telemetry={telemetry}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Select a vehicle to view on map
            </div>
          )}
        </div>

        {/* Vehicle Details Panel */}
        {selectedVehicle && (
          <div className="border-t border-border bg-card p-4">
            <div className="grid grid-cols-4 gap-4">
              {/* Location */}
              <Card className="p-4 bg-background border-border">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">LOCATION</p>
                    {locations.length > 0 ? (
                      <>
                        <p className="mt-2 font-semibold">
                          {locations[0].latitude.toFixed(4)}, {locations[0].longitude.toFixed(4)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(locations[0].created_at).toLocaleTimeString()}
                        </p>
                      </>
                    ) : (
                      <p className="mt-2 text-muted-foreground">No location data</p>
                    )}
                  </div>
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
              </Card>

              {/* Speed */}
              <Card className="p-4 bg-background border-border">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">SPEED</p>
                    <p className="mt-2 font-semibold text-2xl">
                      {telemetry?.speed_kmh || locations[0]?.speed_kmh || 0}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">km/h</p>
                  </div>
                  <Navigation2 className="w-5 h-5 text-accent" />
                </div>
              </Card>

              {/* Fuel Level */}
              <Card className="p-4 bg-background border-border">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">FUEL</p>
                    <p className="mt-2 font-semibold text-2xl">
                      {telemetry?.fuel_level_percent || 0}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">of tank</p>
                  </div>
                  <Zap className="w-5 h-5 text-chart-3" />
                </div>
              </Card>

              {/* Temperature */}
              <Card className="p-4 bg-background border-border">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">ENGINE TEMP</p>
                    <p className="mt-2 font-semibold text-2xl">
                      {telemetry?.engine_temp_celsius || 0}°
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">celsius</p>
                  </div>
                  <Zap className="w-5 h-5 text-destructive" />
                </div>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
