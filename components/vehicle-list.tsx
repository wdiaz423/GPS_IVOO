'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { MapPin, Battery, Gauge, AlertCircle } from 'lucide-react'
import type { Vehicle, Telemetry } from '@/lib/types'

interface VehicleListProps {
  vehicles: Vehicle[]
  selectedVehicleId?: string
  onSelectVehicle: (vehicleId: string) => void
  telemetry?: Record<string, Telemetry>
}

export function VehicleList({
  vehicles,
  selectedVehicleId,
  onSelectVehicle,
  telemetry,
}: VehicleListProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400 border-green-500'
      case 'idle':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500'
      case 'offline':
        return 'bg-red-500/20 text-red-400 border-red-500'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500'
    }
  }

  return (
    <div className="w-full h-full overflow-y-auto bg-card border-l border-border">
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4 text-foreground">Vehículos</h2>
        <div className="space-y-2">
          {vehicles.map((vehicle) => {
            const isSelected = selectedVehicleId === vehicle.id
            const telemetryData = telemetry?.[vehicle.id]

            return (
              <div
                key={vehicle.id}
                onClick={() => onSelectVehicle(vehicle.id)}
                className={`p-3 rounded-lg cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-primary/20 border border-primary'
                    : 'bg-background border border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-foreground">{vehicle.name}</p>
                    <p className="text-xs text-muted-foreground">{vehicle.license_plate}</p>
                  </div>
                  <Badge
                    variant={vehicle.status === 'active' ? 'accent' : 'secondary'}
                    className={getStatusColor(vehicle.status)}
                  >
                    {vehicle.status}
                  </Badge>
                </div>

                {telemetryData && (
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Gauge className="w-4 h-4" />
                      <span>{telemetryData.speed.toFixed(1)} km/h</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Battery className="w-4 h-4" />
                      <span>{telemetryData.fuel_level.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{telemetryData.temperature.toFixed(1)}°C</span>
                    </div>
                  </div>
                )}

                {vehicle.status === 'offline' && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-destructive">
                    <AlertCircle className="w-4 h-4" />
                    <span>Sin conexión</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
