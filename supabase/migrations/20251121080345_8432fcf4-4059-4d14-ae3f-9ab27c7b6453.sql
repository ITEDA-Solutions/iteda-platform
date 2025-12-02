-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'regional_manager', 'field_technician');

-- Create enum for dryer status
CREATE TYPE public.dryer_status AS ENUM ('active', 'idle', 'offline', 'maintenance', 'decommissioned');

-- Create enum for alert severity
CREATE TYPE public.alert_severity AS ENUM ('critical', 'warning', 'info');

-- Create enum for alert status
CREATE TYPE public.alert_status AS ENUM ('active', 'acknowledged', 'resolved', 'dismissed');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create user_roles table (SEPARATE from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  region TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- User roles policies
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create function to check if user is admin or super admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id 
    AND role IN ('admin', 'super_admin')
  )
$$;

-- Create regions table
CREATE TABLE public.regions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on regions
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;

-- Regions policies - all authenticated users can view
CREATE POLICY "Authenticated users can view regions"
  ON public.regions FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can manage regions
CREATE POLICY "Admins can manage regions"
  ON public.regions FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Create dryer_owners table
CREATE TABLE public.dryer_owners (
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

-- Enable RLS on dryer_owners
ALTER TABLE public.dryer_owners ENABLE ROW LEVEL SECURITY;

-- Dryer owners policies
CREATE POLICY "Authenticated users can view dryer owners"
  ON public.dryer_owners FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage dryer owners"
  ON public.dryer_owners FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Create dryers table
CREATE TABLE public.dryers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dryer_id TEXT NOT NULL UNIQUE, -- Format: DRY-YYYY-###
  serial_number TEXT NOT NULL UNIQUE,
  status dryer_status NOT NULL DEFAULT 'idle',
  deployment_date TIMESTAMPTZ NOT NULL,
  location_latitude DECIMAL(10, 8),
  location_longitude DECIMAL(11, 8),
  location_address TEXT,
  region_id UUID REFERENCES public.regions(id),
  owner_id UUID REFERENCES public.dryer_owners(id),
  
  -- Hardware configuration
  num_temp_sensors INTEGER DEFAULT 3,
  num_humidity_sensors INTEGER DEFAULT 2,
  num_fans INTEGER DEFAULT 1,
  num_heaters INTEGER DEFAULT 1,
  solar_capacity_w INTEGER,
  battery_capacity_ah INTEGER,
  
  -- Current operational data
  current_preset_id UUID,
  last_communication TIMESTAMPTZ,
  total_runtime_hours DECIMAL(10, 2) DEFAULT 0,
  battery_level INTEGER, -- percentage
  battery_voltage DECIMAL(5, 2),
  signal_strength INTEGER,
  active_alerts_count INTEGER DEFAULT 0,
  
  assigned_technician_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on dryers
ALTER TABLE public.dryers ENABLE ROW LEVEL SECURITY;

-- Dryers policies
CREATE POLICY "Authenticated users can view dryers"
  ON public.dryers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage dryers"
  ON public.dryers FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update dryers"
  ON public.dryers FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Create presets table
CREATE TABLE public.presets (
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

-- Enable RLS on presets
ALTER TABLE public.presets ENABLE ROW LEVEL SECURITY;

-- Presets policies
CREATE POLICY "Authenticated users can view active presets"
  ON public.presets FOR SELECT
  TO authenticated
  USING (is_active = true OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage presets"
  ON public.presets FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Add foreign key for current_preset_id now that presets table exists
ALTER TABLE public.dryers
ADD CONSTRAINT fk_current_preset
FOREIGN KEY (current_preset_id) REFERENCES public.presets(id);

-- Create sensor_readings table for time-series data
CREATE TABLE public.sensor_readings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dryer_id UUID REFERENCES public.dryers(id) ON DELETE CASCADE NOT NULL,
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
  active_preset_id UUID REFERENCES public.presets(id),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for fast time-series queries
CREATE INDEX idx_sensor_readings_dryer_timestamp ON public.sensor_readings(dryer_id, timestamp DESC);
CREATE INDEX idx_sensor_readings_timestamp ON public.sensor_readings(timestamp DESC);

-- Enable RLS on sensor_readings
ALTER TABLE public.sensor_readings ENABLE ROW LEVEL SECURITY;

-- Sensor readings policies
CREATE POLICY "Authenticated users can view sensor readings"
  ON public.sensor_readings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert sensor readings"
  ON public.sensor_readings FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create alerts table
CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dryer_id UUID REFERENCES public.dryers(id) ON DELETE CASCADE NOT NULL,
  severity alert_severity NOT NULL,
  status alert_status NOT NULL DEFAULT 'active',
  type TEXT NOT NULL, -- e.g., 'high_temp', 'low_battery', 'offline'
  message TEXT NOT NULL,
  threshold_value DECIMAL(10, 2),
  current_value DECIMAL(10, 2),
  acknowledged_by UUID REFERENCES public.profiles(id),
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for fast alert queries
CREATE INDEX idx_alerts_dryer_status ON public.alerts(dryer_id, status);
CREATE INDEX idx_alerts_created ON public.alerts(created_at DESC);

-- Enable RLS on alerts
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Alerts policies
CREATE POLICY "Authenticated users can view alerts"
  ON public.alerts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can create alerts"
  ON public.alerts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can acknowledge alerts"
  ON public.alerts FOR UPDATE
  TO authenticated
  USING (true);

-- Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dryer_owners_updated_at BEFORE UPDATE ON public.dryer_owners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dryers_updated_at BEFORE UPDATE ON public.dryers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_presets_updated_at BEFORE UPDATE ON public.presets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON public.alerts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default regions
INSERT INTO public.regions (name, code) VALUES
  ('Rift Valley', 'RV'),
  ('Central', 'CT'),
  ('Coast', 'CO'),
  ('Western', 'WE'),
  ('Eastern', 'EA'),
  ('Nyanza', 'NY'),
  ('North Eastern', 'NE'),
  ('Nairobi', 'NB');

-- Insert default presets
INSERT INTO public.presets (preset_id, crop_type, region, target_temp_c, target_humidity_pct, fan_speed_rpm, duration_hours, min_temp_threshold, max_temp_threshold, description) VALUES
  ('PRESET-001', 'Maize', 'Rift Valley', 45, 35, 1000, 6.0, 40, 50, 'Standard maize drying for Rift Valley region'),
  ('PRESET-002', 'Maize', 'Central', 43, 38, 1000, 6.0, 38, 48, 'Maize drying optimized for Central region humidity'),
  ('PRESET-003', 'Chili', 'Rift Valley', 50, 30, 1200, 5.0, 45, 55, 'High temperature chili drying for Rift Valley'),
  ('PRESET-004', 'Chili', 'Coast', 48, 35, 1100, 5.5, 43, 53, 'Chili drying for coastal humidity conditions'),
  ('PRESET-005', 'Beans', 'Western', 40, 40, 900, 7.0, 35, 45, 'Gentle bean drying for Western region'),
  ('PRESET-006', 'Banana', 'Coast', 38, 45, 800, 8.0, 33, 43, 'Low temperature banana drying for Coast region');