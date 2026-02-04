-- RBAC System Migration for Supabase
-- This migration creates the necessary tables and policies for role-based access control

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create app_role enum type
DO $$ BEGIN
    CREATE TYPE app_role AS ENUM ('super_admin', 'admin', 'regional_manager', 'field_technician');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create staff_roles table
CREATE TABLE IF NOT EXISTS public.staff_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role app_role NOT NULL,
    region TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_staff_role UNIQUE (staff_id, role)
);

-- Create regions table
CREATE TABLE IF NOT EXISTS public.regions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create dryers table
CREATE TABLE IF NOT EXISTS public.dryers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dryer_id TEXT NOT NULL UNIQUE,
    serial_number TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'idle',
    deployment_date TIMESTAMPTZ NOT NULL,
    location_latitude DECIMAL(10, 8),
    location_longitude DECIMAL(11, 8),
    location_address TEXT,
    region_id UUID REFERENCES public.regions(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create dryer_assignments table
CREATE TABLE IF NOT EXISTS public.dryer_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    technician_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    dryer_id UUID NOT NULL REFERENCES public.dryers(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    assigned_by UUID REFERENCES public.profiles(id),
    notes TEXT,
    CONSTRAINT unique_technician_dryer UNIQUE (technician_id, dryer_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_staff_roles_staff_id ON public.staff_roles(staff_id);
CREATE INDEX IF NOT EXISTS idx_dryer_assignments_technician ON public.dryer_assignments(technician_id);
CREATE INDEX IF NOT EXISTS idx_dryer_assignments_dryer ON public.dryer_assignments(dryer_id);
CREATE INDEX IF NOT EXISTS idx_dryers_region ON public.dryers(region_id);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dryers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dryer_assignments ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Staff roles policies
CREATE POLICY "Users can view their own role"
    ON public.staff_roles FOR SELECT
    USING (auth.uid() = staff_id);

CREATE POLICY "Super admins can manage all roles"
    ON public.staff_roles FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.staff_roles
            WHERE staff_id = auth.uid() AND role = 'super_admin'
        )
    );

-- Regions policies
CREATE POLICY "All authenticated users can view regions"
    ON public.regions FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Only super admins can manage regions"
    ON public.regions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.staff_roles
            WHERE staff_id = auth.uid() AND role = 'super_admin'
        )
    );

-- Dryers policies
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
            WHERE sr.staff_id = auth.uid() 
            AND sr.role = 'regional_manager'
            AND sr.region = region_id::text
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

-- Dryer assignments policies
CREATE POLICY "Users can view their own assignments"
    ON public.dryer_assignments FOR SELECT
    USING (auth.uid() = technician_id);

CREATE POLICY "Admins can view all assignments"
    ON public.dryer_assignments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.staff_roles
            WHERE staff_id = auth.uid() AND role IN ('super_admin', 'admin')
        )
    );

CREATE POLICY "Admins can manage assignments"
    ON public.dryer_assignments FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.staff_roles
            WHERE staff_id = auth.uid() AND role IN ('super_admin', 'admin')
        )
    );

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER dryers_updated_at
    BEFORE UPDATE ON public.dryers
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Comments for documentation
COMMENT ON TABLE public.profiles IS 'User profiles extending Supabase auth.users';
COMMENT ON TABLE public.staff_roles IS 'User roles for RBAC system';
COMMENT ON TABLE public.dryer_assignments IS 'Tracks which dryers are assigned to field technicians';
COMMENT ON COLUMN public.staff_roles.role IS 'User role: super_admin, admin, regional_manager, or field_technician';
COMMENT ON COLUMN public.staff_roles.region IS 'Assigned region for regional managers';
