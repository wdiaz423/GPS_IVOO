'use client'

import { useEffect, useRef } from 'react'
import GoogleMapReact from 'google-map-react'
import { MapPin } from 'lucide-react'

interface VehicleMarkerProps {
  lat: number
  lng: number
  vehicle: any
}

function VehicleMarker({ vehicle }: VehicleMarkerProps) {
  return (
    <div className="flex items-center justify-center">
      <div className="relative">
        <div className="absolute inset-0 animate-pulse bg-primary/50 rounded-full"></div>
        <div className="relative w-8 h-8 bg-primary rounded-full border-2 border-white flex items-center justify-center shadow-lg">
          <MapPin className="w-4 h-4 text-white" />
        </div>
      </div>
    </div>
  )
}

interface VehicleMapProps {
  vehicle: any
  locations: any[]
  telemetry: any
}

export default function VehicleMap({ vehicle, locations, telemetry }: VehicleMapProps) {
  const mapRef = useRef<any>(null)

  if (!locations || locations.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-background/50">
        <div className="text-center">
          <p className="text-muted-foreground">Waiting for GPS data...</p>
        </div>
      </div>
    )
  }

  const currentLocation = locations[0]
  const defaultCenter = {
    lat: parseFloat(currentLocation.latitude),
    lng: parseFloat(currentLocation.longitude),
  }

  // Build route points from all locations
  const pathCoordinates = locations.map((loc: any) => ({
    lat: parseFloat(loc.latitude),
    lng: parseFloat(loc.longitude),
  }))

  const handleApiLoaded = (map: any) => {
    if (pathCoordinates.length > 1) {
      const bounds = new (window as any).google.maps.LatLngBounds()

      pathCoordinates.forEach((coord: any) => {
        bounds.extend({
          lat: coord.lat,
          lng: coord.lng,
        })
      })

      map.fitBounds(bounds)
    }
  }

  return (
    <GoogleMapReact
      bootstrapURLKeys={{
        key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
      }}
      defaultCenter={defaultCenter}
      defaultZoom={13}
      onGoogleApiLoaded={({ map }) => handleApiLoaded(map)}
      yesIWantToUseGoogleMapsSynchronously
      options={{
        styles: [
          {
            elementType: 'geometry',
            stylers: [{ color: '#1a1f3a' }],
          },
          {
            elementType: 'labels.text.stroke',
            stylers: [{ color: '#1a1f3a' }],
          },
          {
            elementType: 'labels.text.fill',
            stylers: [{ color: '#9ca3af' }],
          },
          {
            featureType: 'road',
            elementType: 'geometry',
            stylers: [{ color: '#2d3748' }],
          },
          {
            featureType: 'water',
            elementType: 'geometry',
            stylers: [{ color: '#0f1419' }],
          },
        ],
      }}
    >
      <VehicleMarker
        lat={defaultCenter.lat}
        lng={defaultCenter.lng}
        vehicle={vehicle}
      />
    </GoogleMapReact>
  )
}
