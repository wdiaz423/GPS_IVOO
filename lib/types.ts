// User types
export interface User {
  id: number
  email: string
  password_hash: string
  full_name: string
  role: 'owner' | 'fleet_manager' | 'driver' | 'viewer'
  phone?: string
  company_name?: string
  created_at: string
  updated_at: string
}

// Vehicle types
export interface Vehicle {
  id: number
  user_id: number
  name: string
  make?: string
  model?: string
  year?: number
  license_plate?: string
  vin?: string
  color?: string
  status: 'active' | 'inactive' | 'maintenance'
  created_at: string
  updated_at: string
}

// GPS Device types
export interface GPSDevice {
  id: number
  vehicle_id: number
  device_name: string
  device_type: 'airtag' | 'obd' | 'telematics' | 'custom'
  device_id: string
  api_key?: string
  status: 'active' | 'inactive' | 'disconnected'
  battery_level?: number
  last_ping?: string
  created_at: string
  updated_at: string
}

// Location types
export interface VehicleLocation {
  id: number
  vehicle_id: number
  latitude: number
  longitude: number
  altitude?: number
  accuracy_meters?: number
  heading?: number
  speed_kmh?: number
  created_at: string
}

// Telemetry types
export interface VehicleTelemetry {
  id: number
  vehicle_id: number
  speed_kmh?: number
  rpm?: number
  fuel_level_percent?: number
  engine_temp_celsius?: number
  mileage_km?: number
  battery_voltage?: number
  created_at: string
}

// Geofence types
export interface Geofence {
  id: number
  user_id: number
  name: string
  latitude: number
  longitude: number
  radius_meters: number
  fence_type: 'circular' | 'polygon'
  alert_on_entry: boolean
  alert_on_exit: boolean
  created_at: string
  updated_at: string
}

// Alert types
export interface Alert {
  id: number
  vehicle_id: number
  user_id: number
  alert_type: 'geofence_entry' | 'geofence_exit' | 'speeding' | 'harsh_acceleration' | 'harsh_braking' | 'engine_error' | 'low_fuel'
  message: string
  severity: 'info' | 'warning' | 'critical'
  is_read: boolean
  created_at: string
}

// Notification types
export interface Notification {
  id: number
  user_id: number
  alert_id?: number
  notification_type: 'push' | 'email' | 'sms'
  status: 'pending' | 'sent' | 'failed'
  error_message?: string
  created_at: string
  sent_at?: string
}

// Session types
export interface Session {
  id: number
  user_id: number
  token_hash: string
  expires_at: string
  created_at: string
}
