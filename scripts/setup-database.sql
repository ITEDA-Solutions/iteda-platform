-- Smart Dry Monitor Database Setup Script
-- Run this script in your local PostgreSQL database

-- Create database (run this as superuser)
-- CREATE DATABASE smart_dry_monitor;

-- Connect to the database and run the following:

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for user roles
CREATE TYPE app_role AS ENUM ('super_admin', 'admin', 'regional_manager', 'field_technician');

-- Create enum for dryer status
CREATE TYPE dryer_status AS ENUM ('active', 'idle', 'offline', 'maintenance', 'decommissioned');

-- Create enum for alert severity
CREATE TYPE alert_severity AS ENUM ('critical', 'warning', 'info');

-- Create enum for alert status
CREATE TYPE alert_status AS ENUM ('active', 'acknowledged', 'resolved', 'dismissed');

-- Create users table (for local authentication)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL, -- hashed password
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create user_roles table
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  region TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Create regions table
CREATE TABLE regions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create dryer_owners table
CREATE TABLE dryer_owners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  farm_business_name TEXT,
  id_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create presets table
CREATE TABLE presets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  preset_id TEXT NOT NULL UNIQUE, -- Format: PRESET-###
  crop_type TEXT NOT NULL,
  region TEXT NOT NULL,
  target_temp_c INTEGER NOT NULL,
  target_humidity_pct INTEGER NOT NULL,
  fan_speed_rpm INTEGER NOT NULL,
  duration_hours DECIMAL(4, 2) NOT NULL,
  min_temp_threshold INTEGER,
  max_temp_threshold INTEGER,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create dryers table
CREATE TABLE dryers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dryer_id TEXT NOT NULL UNIQUE, -- Format: DRY-YYYY-###
  serial_number TEXT NOT NULL UNIQUE,
  status dryer_status NOT NULL DEFAULT 'idle',
  deployment_date TIMESTAMPTZ NOT NULL,
  location_latitude DECIMAL(10, 8),
  location_longitude DECIMAL(11, 8),
  location_address TEXT,
  region_id UUID REFERENCES regions(id),
  owner_id UUID REFERENCES dryer_owners(id),
  
  -- Hardware configuration
  num_temp_sensors INTEGER DEFAULT 3,
  num_humidity_sensors INTEGER DEFAULT 2,
  num_fans INTEGER DEFAULT 1,
  num_heaters INTEGER DEFAULT 1,
  solar_capacity_w INTEGER,
  battery_capacity_ah INTEGER,
  
  -- Current operational data
  current_preset_id UUID REFERENCES presets(id),
  last_communication TIMESTAMPTZ,
  total_runtime_hours DECIMAL(10, 2) DEFAULT 0,
  battery_level INTEGER, -- percentage
  battery_voltage DECIMAL(5, 2),
  signal_strength INTEGER,
  active_alerts_count INTEGER DEFAULT 0,
  
  assigned_technician_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create sensor_readings table for time-series data
CREATE TABLE sensor_readings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dryer_id UUID REFERENCES dryers(id) ON DELETE CASCADE NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Temperature readings (°C)
  chamber_temp DECIMAL(5, 2),
  ambient_temp DECIMAL(5, 2),
  heater_temp DECIMAL(5, 2),
  
  -- Humidity readings (%)
  internal_humidity DECIMAL(5, 2),
  external_humidity DECIMAL(5, 2),
  
  -- Fan data
  fan_speed_rpm INTEGER,
  fan_status BOOLEAN, -- true = ON, false = OFF
  
  -- Operational status
  heater_status BOOLEAN,
  door_status BOOLEAN, -- true = OPEN, false = CLOSED
  
  -- Power metrics
  solar_voltage DECIMAL(5, 2),
  battery_level INTEGER,
  battery_voltage DECIMAL(5, 2),
  power_consumption_w DECIMAL(7, 2),
  charging_status TEXT, -- 'charging', 'discharging', 'float'
  
  -- Preset info
  active_preset_id UUID REFERENCES presets(id),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create alerts table
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dryer_id UUID REFERENCES dryers(id) ON DELETE CASCADE NOT NULL,
  severity alert_severity NOT NULL,
  status alert_status NOT NULL DEFAULT 'active',
  type TEXT NOT NULL, -- e.g., 'high_temp', 'low_battery', 'offline'
  message TEXT NOT NULL,
  threshold_value DECIMAL(10, 2),
  current_value DECIMAL(10, 2),
  acknowledged_by UUID REFERENCES profiles(id),
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_sensor_readings_dryer_timestamp ON sensor_readings(dryer_id, timestamp DESC);
CREATE INDEX idx_sensor_readings_timestamp ON sensor_readings(timestamp DESC);
CREATE INDEX idx_alerts_dryer_status ON alerts(dryer_id, status);
CREATE INDEX idx_alerts_created ON alerts(created_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Add updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dryer_owners_updated_at BEFORE UPDATE ON dryer_owners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dryers_updated_at BEFORE UPDATE ON dryers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_presets_updated_at BEFORE UPDATE ON presets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON alerts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default regions
INSERT INTO regions (name, code) VALUES
  ('Rift Valley', 'RV'),
  ('Central', 'CT'),
  ('Coast', 'CO'),
  ('Western', 'WE'),
  ('Eastern', 'EA'),
  ('Nyanza', 'NY'),
  ('North Eastern', 'NE'),
  ('Nairobi', 'NB');

-- Insert default presets
INSERT INTO presets (preset_id, crop_type, region, target_temp_c, target_humidity_pct, fan_speed_rpm, duration_hours, min_temp_threshold, max_temp_threshold, description) VALUES
  ('PRESET-001', 'Maize', 'Rift Valley', 45, 35, 1000, 6.0, 40, 50, 'Standard maize drying for Rift Valley region'),
  ('PRESET-002', 'Maize', 'Central', 43, 38, 1000, 6.0, 38, 48, 'Maize drying optimized for Central region humidity'),
  ('PRESET-003', 'Chili', 'Rift Valley', 50, 30, 1200, 5.0, 45, 55, 'High temperature chili drying for Rift Valley'),
  ('PRESET-004', 'Chili', 'Coast', 48, 35, 1100, 5.5, 43, 53, 'Chili drying for coastal humidity conditions'),
  ('PRESET-005', 'Beans', 'Western', 40, 40, 900, 7.0, 35, 45, 'Gentle bean drying for Western region'),
  ('PRESET-006', 'Banana', 'Coast', 38, 45, 800, 8.0, 33, 43, 'Low temperature banana drying for Coast region');

-- Create a default admin user (password: 'admin123')
-- Note: In production, use a secure password and change it immediately
INSERT INTO users (email, password) VALUES 
  ('admin@smartdryers.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9u.');

-- Get the user ID and create profile
INSERT INTO profiles (id, email, full_name) 
SELECT id, email, 'System Administrator' 
FROM users WHERE email = 'admin@smartdryers.com';

-- Assign super_admin role
INSERT INTO user_roles (user_id, role) 
SELECT id, 'super_admin' 
FROM users WHERE email = 'admin@smartdryers.com';
