-- Smart Dry Monitor Database Setup Script for Supabase
-- Run this script in Supabase SQL Editor: https://srwhtmefvsuzzoxhdpes.supabase.co
--
-- This script follows Supabase best practices:
-- 1. Uses auth.users for authentication (Supabase's built-in auth)
-- 2. Creates profiles table that references auth.users
-- 3. Sets up triggers to auto-create profiles on signup
-- 4. Enables Row Level Security on all tables

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- ENUMS
-- ===========================================

DO $$ BEGIN
  CREATE TYPE app_role AS ENUM ('super_admin', 'admin', 'regional_manager', 'field_technician');

EXCEPTION WHEN duplicate_object THEN null;

END $$;

DO $$ BEGIN
  CREATE TYPE dryer_status AS ENUM ('active', 'idle', 'offline', 'maintenance', 'decommissioned');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE alert_severity AS ENUM ('critical', 'warning', 'info');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE alert_status AS ENUM ('active', 'acknowledged', 'resolved', 'dismissed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ===========================================
-- PROFILES TABLE (linked to auth.users)
-- ===========================================

-- Drop old users table if it exists (we're using auth.users now)
DROP TABLE IF EXISTS public.users CASCADE;

-- Create profiles table that references Supabase's auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW (),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW ()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (email);

-- ===========================================
-- USER ROLES TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    user_id UUID REFERENCES public.profiles (id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    region TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW (),
    UNIQUE (user_id, role)
);

-- ===========================================
-- REGIONS TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS public.regions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW ()
);

-- ===========================================
-- DRYER OWNERS TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS public.dryer_owners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    farm_business_name TEXT,
    id_number TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW (),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW ()
);

-- ===========================================
-- PRESETS TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS public.presets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    preset_id TEXT NOT NULL UNIQUE,
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
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW (),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW ()
);

-- ===========================================
-- DRYERS TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS public.dryers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    dryer_id TEXT NOT NULL UNIQUE,
    serial_number TEXT NOT NULL UNIQUE,
    status dryer_status NOT NULL DEFAULT 'idle',
    deployment_date TIMESTAMPTZ NOT NULL,
    location_latitude DECIMAL(10, 8),
    location_longitude DECIMAL(11, 8),
    location_address TEXT,
    region_id UUID REFERENCES public.regions (id),
    owner_id UUID REFERENCES public.dryer_owners (id),
    num_temp_sensors INTEGER DEFAULT 3,
    num_humidity_sensors INTEGER DEFAULT 2,
    num_fans INTEGER DEFAULT 1,
    num_heaters INTEGER DEFAULT 1,
    solar_capacity_w INTEGER,
    battery_capacity_ah INTEGER,
    current_preset_id UUID REFERENCES public.presets (id),
    last_communication TIMESTAMPTZ,
    total_runtime_hours DECIMAL(10, 2) DEFAULT 0,
    battery_level INTEGER,
    battery_voltage DECIMAL(5, 2),
    signal_strength INTEGER,
    active_alerts_count INTEGER DEFAULT 0,
    assigned_technician_id UUID REFERENCES public.profiles (id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW (),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW ()
);

-- ===========================================
-- SENSOR READINGS TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS public.sensor_readings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    dryer_id UUID REFERENCES public.dryers (id) ON DELETE CASCADE NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW (),
    chamber_temp DECIMAL(5, 2),
    ambient_temp DECIMAL(5, 2),
    heater_temp DECIMAL(5, 2),
    internal_humidity DECIMAL(5, 2),
    external_humidity DECIMAL(5, 2),
    fan_speed_rpm INTEGER,
    fan_status BOOLEAN,
    heater_status BOOLEAN,
    door_status BOOLEAN,
    solar_voltage DECIMAL(5, 2),
    battery_level INTEGER,
    battery_voltage DECIMAL(5, 2),
    power_consumption_w DECIMAL(7, 2),
    charging_status TEXT,
    active_preset_id UUID REFERENCES public.presets (id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW ()
);

-- ===========================================
-- ALERTS TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    dryer_id UUID REFERENCES public.dryers (id) ON DELETE CASCADE NOT NULL,
    severity alert_severity NOT NULL,
    status alert_status NOT NULL DEFAULT 'active',
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    threshold_value DECIMAL(10, 2),
    current_value DECIMAL(10, 2),
    acknowledged_by UUID REFERENCES public.profiles (id),
    acknowledged_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW (),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW ()
);

-- ===========================================
-- INDEXES
-- ===========================================

CREATE INDEX IF NOT EXISTS idx_sensor_readings_dryer_timestamp ON public.sensor_readings (dryer_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_sensor_readings_timestamp ON public.sensor_readings (timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_alerts_dryer_status ON public.alerts (dryer_id, status);

CREATE INDEX IF NOT EXISTS idx_alerts_created ON public.alerts (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles (user_id);

-- ===========================================
-- UPDATED_AT TRIGGER FUNCTION
-- ===========================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_dryer_owners_updated_at ON public.dryer_owners;

CREATE TRIGGER update_dryer_owners_updated_at BEFORE UPDATE ON public.dryer_owners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_dryers_updated_at ON public.dryers;

CREATE TRIGGER update_dryers_updated_at BEFORE UPDATE ON public.dryers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_presets_updated_at ON public.presets;

CREATE TRIGGER update_presets_updated_at BEFORE UPDATE ON public.presets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_alerts_updated_at ON public.alerts;

CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON public.alerts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===========================================
-- AUTO-CREATE PROFILE ON SIGNUP (TRIGGER)
-- ===========================================

-- This function creates a profile when a new user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users to auto-create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===========================================
-- ROW LEVEL SECURITY (RLS)
-- ===========================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.dryer_owners ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.presets ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.dryers ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.sensor_readings ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- RLS POLICIES FOR PROFILES
-- ===========================================

-- Users can view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles FOR
SELECT USING (auth.uid () = id);

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile" ON public.profiles FOR
UPDATE USING (auth.uid () = id);

-- ===========================================
-- SECURITY DEFINER FUNCTION FOR ADMIN CHECK (bypasses RLS to avoid recursion)
-- Must be defined BEFORE RLS policies that use it
-- ===========================================

-- This function bypasses RLS to check admin status, avoiding infinite recursion
CREATE OR REPLACE FUNCTION public.is_admin_no_rls(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'super_admin')
  );
$$;

-- Admins can view all profiles (using SECURITY DEFINER function)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Admins can view all profiles" ON public.profiles FOR
SELECT USING (
        public.is_admin_no_rls (auth.uid ())
    );

-- Admins can update all profiles (using SECURITY DEFINER function)
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

CREATE POLICY "Admins can update all profiles" ON public.profiles FOR
UPDATE USING (
    public.is_admin_no_rls (auth.uid ())
);

-- ===========================================
-- RLS POLICIES FOR USER ROLES
-- ===========================================

-- Users can view their own roles
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR
SELECT USING (auth.uid () = user_id);

-- Admins can manage all roles (using SECURITY DEFINER function to avoid recursion)
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (
    public.is_admin_no_rls (auth.uid ())
);

-- ===========================================
-- RLS POLICIES FOR OTHER TABLES (Read access for authenticated users)
-- ===========================================

-- Regions: All authenticated users can read
DROP POLICY IF EXISTS "Authenticated users can read regions" ON public.regions;

CREATE POLICY "Authenticated users can read regions" ON public.regions FOR
SELECT USING (
        auth.role () = 'authenticated'
    );

-- Admins can manage regions (using SECURITY DEFINER function to avoid recursion)
DROP POLICY IF EXISTS "Admins can manage regions" ON public.regions;

CREATE POLICY "Admins can manage regions" ON public.regions FOR ALL USING (
    public.is_admin_no_rls (auth.uid ())
);

-- Presets: All authenticated users can read
DROP POLICY IF EXISTS "Authenticated users can read presets" ON public.presets;

CREATE POLICY "Authenticated users can read presets" ON public.presets FOR
SELECT USING (
        auth.role () = 'authenticated'
    );

-- Admins can manage presets (using SECURITY DEFINER function to avoid recursion)
DROP POLICY IF EXISTS "Admins can manage presets" ON public.presets;

CREATE POLICY "Admins can manage presets" ON public.presets FOR ALL USING (
    public.is_admin_no_rls (auth.uid ())
);

-- Dryer owners: All authenticated users can read
DROP POLICY IF EXISTS "Authenticated users can read dryer_owners" ON public.dryer_owners;

CREATE POLICY "Authenticated users can read dryer_owners" ON public.dryer_owners FOR
SELECT USING (
        auth.role () = 'authenticated'
    );

-- Admins can manage dryer owners (using SECURITY DEFINER function to avoid recursion)
DROP POLICY IF EXISTS "Admins can manage dryer_owners" ON public.dryer_owners;

CREATE POLICY "Admins can manage dryer_owners" ON public.dryer_owners FOR ALL USING (
    public.is_admin_no_rls (auth.uid ())
);

-- Dryers: All authenticated users can read
DROP POLICY IF EXISTS "Authenticated users can read dryers" ON public.dryers;

CREATE POLICY "Authenticated users can read dryers" ON public.dryers FOR
SELECT USING (
        auth.role () = 'authenticated'
    );

-- Admins can manage dryers (using SECURITY DEFINER function to avoid recursion)
DROP POLICY IF EXISTS "Admins can manage dryers" ON public.dryers;

CREATE POLICY "Admins can manage dryers" ON public.dryers FOR ALL USING (
    public.is_admin_no_rls (auth.uid ())
);

-- Sensor readings: All authenticated users can read
DROP POLICY IF EXISTS "Authenticated users can read sensor_readings" ON public.sensor_readings;

CREATE POLICY "Authenticated users can read sensor_readings" ON public.sensor_readings FOR
SELECT USING (
        auth.role () = 'authenticated'
    );

-- Admins and service can manage sensor readings (using SECURITY DEFINER function to avoid recursion)
DROP POLICY IF EXISTS "Admins can manage sensor_readings" ON public.sensor_readings;

CREATE POLICY "Admins can manage sensor_readings" ON public.sensor_readings FOR ALL USING (
    public.is_admin_no_rls (auth.uid ())
);

-- Alerts: All authenticated users can read
DROP POLICY IF EXISTS "Authenticated users can read alerts" ON public.alerts;

CREATE POLICY "Authenticated users can read alerts" ON public.alerts FOR
SELECT USING (
        auth.role () = 'authenticated'
    );

-- Admins can manage alerts (using SECURITY DEFINER function to avoid recursion)
DROP POLICY IF EXISTS "Admins can manage alerts" ON public.alerts;

CREATE POLICY "Admins can manage alerts" ON public.alerts FOR ALL USING (
    public.is_admin_no_rls (auth.uid ())
);

-- ===========================================
-- HELPER FUNCTIONS
-- ===========================================

-- Check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_role app_role, _user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
END;
$$;

-- Check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'super_admin')
  );
END;
$$;

-- Get current user's profile
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS public.profiles
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM public.profiles WHERE id = auth.uid();
$$;

-- ===========================================
-- SEED DATA
-- ===========================================

-- Insert default regions
INSERT INTO
    public.regions (name, code)
VALUES ('Rift Valley', 'RV'),
    ('Central', 'CT'),
    ('Coast', 'CO'),
    ('Western', 'WE'),
    ('Eastern', 'EA'),
    ('Nyanza', 'NY'),
    ('North Eastern', 'NE'),
    ('Nairobi', 'NB')
ON CONFLICT (name) DO NOTHING;

-- Insert default presets
INSERT INTO
    public.presets (
        preset_id,
        crop_type,
        region,
        target_temp_c,
        target_humidity_pct,
        fan_speed_rpm,
        duration_hours,
        min_temp_threshold,
        max_temp_threshold,
        description
    )
VALUES (
        'PRESET-001',
        'Maize',
        'Rift Valley',
        45,
        35,
        1000,
        6.0,
        40,
        50,
        'Standard maize drying for Rift Valley region'
    ),
    (
        'PRESET-002',
        'Maize',
        'Central',
        43,
        38,
        1000,
        6.0,
        38,
        48,
        'Maize drying optimized for Central region humidity'
    ),
    (
        'PRESET-003',
        'Chili',
        'Rift Valley',
        50,
        30,
        1200,
        5.0,
        45,
        55,
        'High temperature chili drying for Rift Valley'
    ),
    (
        'PRESET-004',
        'Chili',
        'Coast',
        48,
        35,
        1100,
        5.5,
        43,
        53,
        'Chili drying for coastal humidity conditions'
    ),
    (
        'PRESET-005',
        'Beans',
        'Western',
        40,
        40,
        900,
        7.0,
        35,
        45,
        'Gentle bean drying for Western region'
    ),
    (
        'PRESET-006',
        'Banana',
        'Coast',
        38,
        45,
        800,
        8.0,
        33,
        43,
        'Low temperature banana drying for Coast region'
    )
ON CONFLICT (preset_id) DO NOTHING;

-- ===========================================
-- NOTES
-- ===========================================
--
-- After running this script:
-- 1. Create your first admin user via Supabase Auth (Dashboard > Authentication > Users)
-- 2. Then run the following to make them a super_admin:
--
--    INSERT INTO public.user_roles (user_id, role)
--    SELECT id, 'super_admin' FROM public.profiles WHERE email = 'your-admin@email.com';
--
-- Or sign up through the app, then promote to admin via SQL.