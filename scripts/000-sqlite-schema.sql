-- GPS Vehicle Tracking Schema - SQLite Version

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT,
  role TEXT CHECK(role IN ('owner', 'fleet_manager', 'driver', 'viewer')) DEFAULT 'owner',
  google_id TEXT UNIQUE,
  profile_picture_url TEXT,
  provider TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  fleet_id TEXT,
  name TEXT NOT NULL,
  license_plate TEXT UNIQUE NOT NULL,
  vin TEXT UNIQUE,
  vehicle_type TEXT,
  make TEXT,
  model TEXT,
  year INTEGER,
  status TEXT CHECK(status IN ('active', 'inactive', 'maintenance', 'offline')) DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_vehicles_owner_id ON vehicles(owner_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_fleet_id ON vehicles(fleet_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);

-- GPS Devices table
CREATE TABLE IF NOT EXISTS gps_devices (
  id TEXT PRIMARY KEY,
  vehicle_id TEXT NOT NULL,
  device_type TEXT,
  device_id TEXT UNIQUE,
  model TEXT,
  last_signal_at DATETIME,
  battery_level INTEGER,
  signal_strength INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_gps_devices_vehicle_id ON gps_devices(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_gps_devices_device_id ON gps_devices(device_id);

-- Vehicle Locations table
CREATE TABLE IF NOT EXISTS vehicle_locations (
  id TEXT PRIMARY KEY,
  vehicle_id TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  altitude REAL,
  accuracy REAL,
  speed REAL,
  heading REAL,
  timestamp DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_vehicle_locations_vehicle_id ON vehicle_locations(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_locations_timestamp ON vehicle_locations(timestamp DESC);

-- Telemetry table
CREATE TABLE IF NOT EXISTS telemetry (
  id TEXT PRIMARY KEY,
  vehicle_id TEXT NOT NULL,
  speed REAL,
  rpm INTEGER,
  fuel_level REAL,
  engine_temp REAL,
  battery_voltage REAL,
  odometer REAL,
  timestamp DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_telemetry_vehicle_id ON telemetry(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_timestamp ON telemetry(timestamp DESC);

-- Geofences table
CREATE TABLE IF NOT EXISTS geofences (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  name TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  radius REAL NOT NULL,
  alert_on_enter BOOLEAN DEFAULT true,
  alert_on_exit BOOLEAN DEFAULT true,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_geofences_owner_id ON geofences(owner_id);

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id TEXT PRIMARY KEY,
  vehicle_id TEXT NOT NULL,
  geofence_id TEXT,
  alert_type TEXT CHECK(alert_type IN ('geofence_enter', 'geofence_exit', 'speeding', 'low_fuel', 'engine_temp', 'battery')) NOT NULL,
  message TEXT,
  severity TEXT CHECK(severity IN ('info', 'warning', 'critical')) DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  FOREIGN KEY (geofence_id) REFERENCES geofences(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_alerts_vehicle_id ON alerts(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_is_read ON alerts(is_read);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  alert_id TEXT,
  channel TEXT CHECK(channel IN ('email', 'push', 'sms')) NOT NULL,
  status TEXT CHECK(status IN ('pending', 'sent', 'failed')) DEFAULT 'pending',
  sent_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (alert_id) REFERENCES alerts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
