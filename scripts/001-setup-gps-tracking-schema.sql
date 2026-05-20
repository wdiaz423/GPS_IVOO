-- GPS Vehicle Tracking App - Schema Setup

-- Users table (owners, fleet managers, drivers)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'fleet_manager', 'driver', 'viewer')),
  phone VARCHAR(20),
  company_name VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  make VARCHAR(100),
  model VARCHAR(100),
  year INT,
  license_plate VARCHAR(50),
  vin VARCHAR(50),
  color VARCHAR(50),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- GPS Devices table (trackers, OBD devices, etc.)
CREATE TABLE IF NOT EXISTS gps_devices (
  id SERIAL PRIMARY KEY,
  vehicle_id INT NOT NULL,
  device_name VARCHAR(255) NOT NULL,
  device_type VARCHAR(50) NOT NULL CHECK (device_type IN ('airtag', 'obd', 'telematics', 'custom')),
  device_id VARCHAR(255) NOT NULL UNIQUE,
  api_key VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'disconnected')),
  battery_level INT,
  last_ping TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

-- Vehicle Locations table (time-series data, partitioned for performance)
CREATE TABLE IF NOT EXISTS vehicle_locations (
  id SERIAL PRIMARY KEY,
  vehicle_id INT NOT NULL,
  latitude NUMERIC(10, 8) NOT NULL,
  longitude NUMERIC(11, 8) NOT NULL,
  altitude NUMERIC(10, 2),
  accuracy_meters INT,
  heading NUMERIC(6, 2),
  speed_kmh NUMERIC(6, 2),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

-- Vehicle Telemetry table
CREATE TABLE IF NOT EXISTS vehicle_telemetry (
  id SERIAL PRIMARY KEY,
  vehicle_id INT NOT NULL,
  speed_kmh NUMERIC(6, 2),
  rpm INT,
  fuel_level_percent INT,
  engine_temp_celsius NUMERIC(5, 2),
  mileage_km INT,
  battery_voltage NUMERIC(5, 2),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

-- Geofences table
CREATE TABLE IF NOT EXISTS geofences (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  latitude NUMERIC(10, 8) NOT NULL,
  longitude NUMERIC(11, 8) NOT NULL,
  radius_meters INT NOT NULL,
  fence_type VARCHAR(50) DEFAULT 'circular' CHECK (fence_type IN ('circular', 'polygon')),
  alert_on_entry BOOLEAN DEFAULT true,
  alert_on_exit BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Geofence Violations table
CREATE TABLE IF NOT EXISTS geofence_violations (
  id SERIAL PRIMARY KEY,
  geofence_id INT NOT NULL,
  vehicle_id INT NOT NULL,
  violation_type VARCHAR(50) NOT NULL CHECK (violation_type IN ('entry', 'exit')),
  latitude NUMERIC(10, 8),
  longitude NUMERIC(11, 8),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (geofence_id) REFERENCES geofences(id) ON DELETE CASCADE,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id SERIAL PRIMARY KEY,
  vehicle_id INT NOT NULL,
  user_id INT NOT NULL,
  alert_type VARCHAR(100) NOT NULL CHECK (alert_type IN ('geofence_entry', 'geofence_exit', 'speeding', 'harsh_acceleration', 'harsh_braking', 'engine_error', 'low_fuel')),
  message TEXT NOT NULL,
  severity VARCHAR(50) DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Notifications table (for push notifications and emails)
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  alert_id INT,
  notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN ('push', 'email', 'sms')),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  sent_at TIMESTAMPTZ,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (alert_id) REFERENCES alerts(id) ON DELETE SET NULL
);

-- Vehicle Access table (for multi-user support)
CREATE TABLE IF NOT EXISTS vehicle_access (
  id SERIAL PRIMARY KEY,
  vehicle_id INT NOT NULL,
  user_id INT NOT NULL,
  access_level VARCHAR(50) NOT NULL CHECK (access_level IN ('owner', 'manager', 'driver', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(vehicle_id, user_id)
);

-- Session table for authentication
CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_gps_devices_vehicle_id ON gps_devices(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_locations_vehicle_id_created ON vehicle_locations(vehicle_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vehicle_locations_created ON vehicle_locations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vehicle_telemetry_vehicle_id ON vehicle_telemetry(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_geofences_user_id ON geofences(user_id);
CREATE INDEX IF NOT EXISTS idx_geofence_violations_geofence_id ON geofence_violations(geofence_id);
CREATE INDEX IF NOT EXISTS idx_alerts_vehicle_id ON alerts(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_is_read ON alerts(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_vehicle_access_user_id ON vehicle_access(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
