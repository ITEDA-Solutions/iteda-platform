-- Dryer Management System Migration for Supabase
-- This migration adds comprehensive dryer management features

-- Create dryer_status enum
DO $$ BEGIN
    CREATE TYPE dryer_status AS ENUM ('active', 'inactive', 'maintenance', 'offline', 'decommissioned');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create owners/farmers table
CREATE TABLE IF NOT EXISTS public.owners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    contact_phone TEXT,
    contact_email TEXT,
    address TEXT,
    farm_business_name TEXT,
    id_number TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enhanced dryers table with all required fields
CREATE TABLE IF NOT EXISTS public.dryers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Dryer Registration Fields
    dryer_id TEXT NOT NULL UNIQUE,
    serial_number TEXT NOT NULL UNIQUE,
    deployment_date TIMESTAMPTZ NOT NULL,
    
    -- Installation Location
    location_latitude DECIMAL(10, 8),
    location_longitude DECIMAL(11, 8),
    location_address TEXT,
    region_id UUID REFERENCES public.regions(id),
    
    -- Owner Information
    owner_id UUID REFERENCES public.owners(id),
    
    -- Dryer Status Information
    status dryer_status NOT NULL DEFAULT 'inactive',
    last_communication TIMESTAMPTZ,
    total_runtime_hours DECIMAL(10, 2) DEFAULT 0,
    
    -- Hardware Configuration
    num_temp_sensors INTEGER DEFAULT 3,
    num_humidity_sensors INTEGER DEFAULT 2,
    num_fans INTEGER DEFAULT 1,
    num_heaters INTEGER DEFAULT 1,
    solar_capacity_w INTEGER,
    battery_capacity_ah INTEGER,
    
    -- Current Operational Data
    current_preset_id UUID REFERENCES public.presets(id),
    battery_level INTEGER,
    battery_voltage DECIMAL(5, 2),
    signal_strength INTEGER,
    active_alerts_count INTEGER DEFAULT 0,
    
    -- Assignment
    assigned_technician_id UUID REFERENCES public.profiles(id),
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create presets table (if not exists)
CREATE TABLE IF NOT EXISTS public.presets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_dryers_status ON public.dryers(status);
CREATE INDEX IF NOT EXISTS idx_dryers_owner ON public.dryers(owner_id);
CREATE INDEX IF NOT EXISTS idx_dryers_region ON public.dryers(region_id);
CREATE INDEX IF NOT EXISTS idx_dryers_last_communication ON public.dryers(last_communication DESC);
CREATE INDEX IF NOT EXISTS idx_owners_name ON public.owners(name);

-- Enable Row Level Security
ALTER TABLE public.owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dryers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presets ENABLE ROW LEVEL SECURITY;

-- Owners policies
CREATE POLICY "Authenticated users can view owners"
    ON public.owners FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Super admins can manage owners"
    ON public.owners FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.staff_roles
            WHERE staff_id = auth.uid() AND role = 'super_admin'
        )
    );

CREATE POLICY "Admins can create and update owners"
    ON public.owners FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.staff_roles
            WHERE staff_id = auth.uid() AND role IN ('super_admin', 'admin')
        )
    );

CREATE POLICY "Admins can update owners"
    ON public.owners FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.staff_roles
            WHERE staff_id = auth.uid() AND role IN ('super_admin', 'admin')
        )
    );

-- Dryers policies (enhanced)
CREATE POLICY "Super admins and admins can view all dryers"
    ON public.dryers FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.staff_roles
            WHERE staff_id = auth.uid() AND role IN ('super_admin', 'admin')
        )
    );

CREATE POLICY "Regional managers can view dryers in their region"
    ON public.dryers FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.staff_roles sr
            JOIN public.regions r ON r.id = region_id
            WHERE sr.staff_id = auth.uid() 
            AND sr.role = 'regional_manager'
            AND sr.region = r.name
        )
    );

CREATE POLICY "Field technicians can view assigned dryers"
    ON public.dryers FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.dryer_assignments da
            WHERE da.technician_id = auth.uid() AND da.dryer_id = id
        )
    );

CREATE POLICY "Super admins can manage all dryers"
    ON public.dryers FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.staff_roles
            WHERE staff_id = auth.uid() AND role = 'super_admin'
        )
    );

CREATE POLICY "Admins can create and update dryers"
    ON public.dryers FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.staff_roles
            WHERE staff_id = auth.uid() AND role IN ('super_admin', 'admin')
        )
    );

CREATE POLICY "Admins can update dryers"
    ON public.dryers FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.staff_roles
            WHERE staff_id = auth.uid() AND role IN ('super_admin', 'admin')
        )
    );

CREATE POLICY "Regional managers can update dryers in their region"
    ON public.dryers FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.staff_roles sr
            JOIN public.regions r ON r.id = region_id
            WHERE sr.staff_id = auth.uid() 
            AND sr.role = 'regional_manager'
            AND sr.region = r.name
        )
    );

CREATE POLICY "Field technicians can update assigned dryers"
    ON public.dryers FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.dryer_assignments da
            WHERE da.technician_id = auth.uid() AND da.dryer_id = id
        )
    );

-- Presets policies
CREATE POLICY "All authenticated users can view presets"
    ON public.presets FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Super admins can manage presets"
    ON public.presets FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.staff_roles
            WHERE staff_id = auth.uid() AND role = 'super_admin'
        )
    );

CREATE POLICY "Admins can update presets"
    ON public.presets FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.staff_roles
            WHERE staff_id = auth.uid() AND role IN ('super_admin', 'admin')
        )
    );

-- Function to calculate deployment duration
CREATE OR REPLACE FUNCTION public.get_deployment_duration(deployment_date TIMESTAMPTZ)
RETURNS INTERVAL AS $$
BEGIN
    RETURN NOW() - deployment_date;
END;
$$ LANGUAGE plpgsql;

-- Function to update dryer's last communication timestamp
CREATE OR REPLACE FUNCTION public.update_dryer_last_communication()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.dryers
    SET last_communication = NOW()
    WHERE id = NEW.dryer_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER owners_updated_at
    BEFORE UPDATE ON public.owners
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER dryers_updated_at
    BEFORE UPDATE ON public.dryers
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER presets_updated_at
    BEFORE UPDATE ON public.presets
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- View for dryer information display
CREATE OR REPLACE VIEW public.dryer_details AS
SELECT 
    d.id,
    d.dryer_id,
    d.serial_number,
    d.status,
    d.deployment_date,
    EXTRACT(EPOCH FROM (NOW() - d.deployment_date)) / 3600 / 24 AS deployment_duration_days,
    d.location_latitude,
    d.location_longitude,
    d.location_address,
    r.name AS region_name,
    d.last_communication,
    CASE 
        WHEN d.last_communication IS NULL THEN 'Never'
        WHEN d.last_communication > NOW() - INTERVAL '5 minutes' THEN 'Online'
        WHEN d.last_communication > NOW() - INTERVAL '1 hour' THEN 'Recent'
        WHEN d.last_communication > NOW() - INTERVAL '24 hours' THEN 'Today'
        ELSE 'Offline'
    END AS communication_status,
    d.total_runtime_hours,
    d.battery_level,
    d.battery_voltage,
    d.signal_strength,
    d.active_alerts_count,
    o.name AS owner_name,
    o.contact_phone AS owner_phone,
    o.contact_email AS owner_email,
    o.address AS owner_address,
    o.farm_business_name,
    p.full_name AS assigned_technician_name,
    pr.crop_type AS current_crop_type,
    d.created_at,
    d.updated_at
FROM public.dryers d
LEFT JOIN public.regions r ON d.region_id = r.id
LEFT JOIN public.owners o ON d.owner_id = o.id
LEFT JOIN public.profiles p ON d.assigned_technician_id = p.id
LEFT JOIN public.presets pr ON d.current_preset_id = pr.id;

-- Comments for documentation
COMMENT ON TABLE public.owners IS 'Dryer owners/farmers information';
COMMENT ON TABLE public.dryers IS 'Dryer units with registration and operational data';
COMMENT ON COLUMN public.dryers.dryer_id IS 'Unique dryer identifier';
COMMENT ON COLUMN public.dryers.serial_number IS 'Hardware serial number';
COMMENT ON COLUMN public.dryers.deployment_date IS 'Date when dryer was deployed';
COMMENT ON COLUMN public.dryers.status IS 'Current operational status: active, inactive, maintenance, offline, decommissioned';
COMMENT ON COLUMN public.dryers.last_communication IS 'Last time dryer sent data';
COMMENT ON COLUMN public.dryers.total_runtime_hours IS 'Total hours dryer has been running';
COMMENT ON VIEW public.dryer_details IS 'Comprehensive view of dryer information with owner and region details';

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.dryer_details TO authenticated;
