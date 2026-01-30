-- Fixed Alerts and Notifications System Migration
-- This migration works with the existing alerts table structure

-- Create alert_type enum if not exists
DO $$ BEGIN
    CREATE TYPE alert_type AS ENUM (
        'high_temperature',
        'low_temperature',
        'high_humidity',
        'low_humidity',
        'low_battery',
        'dryer_offline',
        'maintenance_due',
        'door_open_alert',
        'heater_malfunction',
        'fan_malfunction',
        'power_failure'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create alert_priority enum if not exists
DO $$ BEGIN
    CREATE TYPE alert_priority AS ENUM ('critical', 'high', 'medium', 'low', 'info');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add missing columns to existing alerts table
ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS alert_type alert_type;
ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS priority alert_priority DEFAULT 'medium';
ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS triggered_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS dismissed_at TIMESTAMPTZ;
ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS dismissed_by UUID REFERENCES public.profiles(id);
ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS resolved_by UUID REFERENCES public.profiles(id);
ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS resolution_notes TEXT;
ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS auto_resolved BOOLEAN DEFAULT false;

-- Update existing data to use new columns
UPDATE public.alerts 
SET triggered_at = created_at 
WHERE triggered_at IS NULL;

UPDATE public.alerts 
SET title = COALESCE(type, 'Alert')
WHERE title IS NULL;

-- Map existing severity to priority
UPDATE public.alerts 
SET priority = CASE 
    WHEN severity = 'critical' THEN 'critical'::alert_priority
    WHEN severity = 'high' THEN 'high'::alert_priority
    WHEN severity = 'medium' THEN 'medium'::alert_priority
    WHEN severity = 'low' THEN 'low'::alert_priority
    ELSE 'info'::alert_priority
END
WHERE priority IS NULL;

-- Map existing type to alert_type
UPDATE public.alerts 
SET alert_type = CASE 
    WHEN type ILIKE '%temperature%high%' OR type ILIKE '%high%temperature%' THEN 'high_temperature'::alert_type
    WHEN type ILIKE '%temperature%low%' OR type ILIKE '%low%temperature%' THEN 'low_temperature'::alert_type
    WHEN type ILIKE '%humidity%high%' OR type ILIKE '%high%humidity%' THEN 'high_humidity'::alert_type
    WHEN type ILIKE '%humidity%low%' OR type ILIKE '%low%humidity%' THEN 'low_humidity'::alert_type
    WHEN type ILIKE '%battery%' THEN 'low_battery'::alert_type
    WHEN type ILIKE '%offline%' THEN 'dryer_offline'::alert_type
    WHEN type ILIKE '%maintenance%' THEN 'maintenance_due'::alert_type
    WHEN type ILIKE '%door%' THEN 'door_open_alert'::alert_type
    WHEN type ILIKE '%heater%' THEN 'heater_malfunction'::alert_type
    WHEN type ILIKE '%fan%' THEN 'fan_malfunction'::alert_type
    ELSE 'dryer_offline'::alert_type
END
WHERE alert_type IS NULL;

-- Create alert_thresholds table
CREATE TABLE IF NOT EXISTS public.alert_thresholds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dryer_id UUID REFERENCES public.dryers(id) ON DELETE CASCADE,
    region_id UUID REFERENCES public.regions(id),
    alert_type alert_type NOT NULL,
    
    min_value DECIMAL(10, 2),
    max_value DECIMAL(10, 2),
    duration_minutes INTEGER,
    
    is_enabled BOOLEAN DEFAULT true,
    priority alert_priority NOT NULL DEFAULT 'medium',
    
    notify_email BOOLEAN DEFAULT true,
    notify_sms BOOLEAN DEFAULT false,
    notify_push BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_threshold UNIQUE (dryer_id, alert_type)
);

-- Create notifications table if not exists
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    alert_id UUID REFERENCES public.alerts(id) ON DELETE CASCADE,
    
    notification_type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    
    delivery_method TEXT,
    delivered_at TIMESTAMPTZ,
    
    action_url TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create maintenance_schedules table if not exists
CREATE TABLE IF NOT EXISTS public.maintenance_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dryer_id UUID NOT NULL REFERENCES public.dryers(id) ON DELETE CASCADE,
    
    maintenance_type TEXT NOT NULL,
    description TEXT,
    
    scheduled_date DATE NOT NULL,
    completed_date DATE,
    
    assigned_to UUID REFERENCES public.profiles(id),
    
    status TEXT NOT NULL DEFAULT 'scheduled',
    
    estimated_duration_hours DECIMAL(4, 2),
    actual_duration_hours DECIMAL(4, 2),
    notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_alerts_triggered_at ON public.alerts(triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_priority ON public.alerts(priority, status);
CREATE INDEX IF NOT EXISTS idx_alerts_alert_type ON public.alerts(alert_type, status);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_maintenance_dryer_status ON public.maintenance_schedules(dryer_id, status);
CREATE INDEX IF NOT EXISTS idx_maintenance_scheduled_date ON public.maintenance_schedules(scheduled_date);

-- Enable Row Level Security
ALTER TABLE public.alert_thresholds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_schedules ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view alerts for accessible dryers" ON public.alerts;
DROP POLICY IF EXISTS "Users can update alerts for accessible dryers" ON public.alerts;

-- Recreate alerts policies
CREATE POLICY "Users can view alerts for accessible dryers"
    ON public.alerts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.dryers d
            WHERE d.id = dryer_id
            AND (
                EXISTS (
                    SELECT 1 FROM public.staff_roles
                    WHERE staff_id = (SELECT id FROM public.profiles WHERE id = current_setting('app.current_user_id', true)::uuid)
                    AND role IN ('super_admin', 'admin')
                )
                OR
                EXISTS (
                    SELECT 1 FROM public.staff_roles sr
                    JOIN public.regions r ON r.id = d.region_id
                    WHERE sr.staff_id = (SELECT id FROM public.profiles WHERE id = current_setting('app.current_user_id', true)::uuid)
                    AND sr.role = 'regional_manager'
                    AND sr.region = r.name
                )
                OR
                EXISTS (
                    SELECT 1 FROM public.dryer_assignments da
                    WHERE da.technician_id = (SELECT id FROM public.profiles WHERE id = current_setting('app.current_user_id', true)::uuid)
                    AND da.dryer_id = d.id
                )
            )
        )
    );

CREATE POLICY "Users can update alerts for accessible dryers"
    ON public.alerts FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.dryers d
            WHERE d.id = dryer_id
            AND (
                EXISTS (
                    SELECT 1 FROM public.staff_roles
                    WHERE staff_id = (SELECT id FROM public.profiles WHERE id = current_setting('app.current_user_id', true)::uuid)
                    AND role IN ('super_admin', 'admin', 'regional_manager')
                )
                OR
                EXISTS (
                    SELECT 1 FROM public.dryer_assignments da
                    WHERE da.technician_id = (SELECT id FROM public.profiles WHERE id = current_setting('app.current_user_id', true)::uuid)
                    AND da.dryer_id = d.id
                )
            )
        )
    );

-- Notifications policies
CREATE POLICY "Users can view their own notifications"
    ON public.notifications FOR SELECT
    USING (user_id = (SELECT id FROM public.profiles WHERE id = current_setting('app.current_user_id', true)::uuid));

CREATE POLICY "Users can update their own notifications"
    ON public.notifications FOR UPDATE
    USING (user_id = (SELECT id FROM public.profiles WHERE id = current_setting('app.current_user_id', true)::uuid));

-- Maintenance policies
CREATE POLICY "Users can view maintenance for accessible dryers"
    ON public.maintenance_schedules FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.dryers d
            WHERE d.id = dryer_id
            AND (
                EXISTS (
                    SELECT 1 FROM public.staff_roles
                    WHERE staff_id = (SELECT id FROM public.profiles WHERE id = current_setting('app.current_user_id', true)::uuid)
                    AND role IN ('super_admin', 'admin')
                )
                OR
                EXISTS (
                    SELECT 1 FROM public.staff_roles sr
                    JOIN public.regions r ON r.id = d.region_id
                    WHERE sr.staff_id = (SELECT id FROM public.profiles WHERE id = current_setting('app.current_user_id', true)::uuid)
                    AND sr.role = 'regional_manager'
                    AND sr.region = r.name
                )
                OR
                assigned_to = (SELECT id FROM public.profiles WHERE id = current_setting('app.current_user_id', true)::uuid)
            )
        )
    );

-- Function to check and create alerts based on sensor readings
CREATE OR REPLACE FUNCTION public.check_sensor_alerts()
RETURNS TRIGGER AS $$
DECLARE
    threshold_record RECORD;
    alert_exists BOOLEAN;
BEGIN
    -- Check temperature thresholds
    FOR threshold_record IN 
        SELECT * FROM public.alert_thresholds 
        WHERE dryer_id = NEW.dryer_id 
        AND is_enabled = true
        AND alert_type IN ('high_temperature', 'low_temperature')
    LOOP
        IF threshold_record.alert_type = 'high_temperature' 
           AND NEW.chamber_temp > threshold_record.max_value THEN
            
            SELECT EXISTS(
                SELECT 1 FROM public.alerts 
                WHERE dryer_id = NEW.dryer_id 
                AND alert_type = 'high_temperature'
                AND status = 'active'
            ) INTO alert_exists;
            
            IF NOT alert_exists THEN
                INSERT INTO public.alerts (
                    dryer_id, alert_type, priority, title, message,
                    threshold_value, current_value, type
                ) VALUES (
                    NEW.dryer_id,
                    'high_temperature',
                    threshold_record.priority,
                    'High Temperature Alert',
                    'Chamber temperature exceeded threshold',
                    threshold_record.max_value,
                    NEW.chamber_temp,
                    'high_temperature'
                );
            END IF;
        END IF;
    END LOOP;
    
    -- Check battery level
    IF NEW.battery_level IS NOT NULL AND NEW.battery_level < 20 THEN
        SELECT EXISTS(
            SELECT 1 FROM public.alerts 
            WHERE dryer_id = NEW.dryer_id 
            AND alert_type = 'low_battery'
            AND status = 'active'
        ) INTO alert_exists;
        
        IF NOT alert_exists THEN
            INSERT INTO public.alerts (
                dryer_id, alert_type, priority, title, message,
                threshold_value, current_value, type
            ) VALUES (
                NEW.dryer_id,
                'low_battery',
                CASE WHEN NEW.battery_level < 10 THEN 'critical'::alert_priority ELSE 'high'::alert_priority END,
                'Low Battery Warning',
                'Battery level is critically low',
                20,
                NEW.battery_level,
                'low_battery'
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
DROP TRIGGER IF EXISTS trigger_check_sensor_alerts ON public.sensor_readings;
CREATE TRIGGER trigger_check_sensor_alerts
    AFTER INSERT ON public.sensor_readings
    FOR EACH ROW
    EXECUTE FUNCTION public.check_sensor_alerts();

-- Function to check offline dryers
CREATE OR REPLACE FUNCTION public.check_offline_dryers()
RETURNS VOID AS $$
DECLARE
    dryer_record RECORD;
    alert_exists BOOLEAN;
BEGIN
    FOR dryer_record IN 
        SELECT id, dryer_id, last_communication 
        FROM public.dryers 
        WHERE last_communication < NOW() - INTERVAL '1 hour'
        AND status != 'decommissioned'
    LOOP
        SELECT EXISTS(
            SELECT 1 FROM public.alerts 
            WHERE dryer_id = dryer_record.id 
            AND alert_type = 'dryer_offline'
            AND status = 'active'
        ) INTO alert_exists;
        
        IF NOT alert_exists THEN
            INSERT INTO public.alerts (
                dryer_id, alert_type, priority, title, message, type
            ) VALUES (
                dryer_record.id,
                'dryer_offline',
                'high'::alert_priority,
                'Dryer Offline',
                'Dryer has not communicated for over 1 hour',
                'dryer_offline'
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- View for active alerts summary
CREATE OR REPLACE VIEW public.active_alerts_summary AS
SELECT 
    d.id as dryer_id,
    d.dryer_id as dryer_identifier,
    d.status as dryer_status,
    r.name as region_name,
    COUNT(a.id) as active_alerts_count,
    COUNT(CASE WHEN a.priority = 'critical' THEN 1 END) as critical_count,
    COUNT(CASE WHEN a.priority = 'high' THEN 1 END) as high_count,
    MAX(a.triggered_at) as latest_alert_time
FROM public.dryers d
LEFT JOIN public.regions r ON d.region_id = r.id
LEFT JOIN public.alerts a ON d.id = a.dryer_id AND a.status = 'active'
GROUP BY d.id, d.dryer_id, d.status, r.name;

-- View for maintenance due
CREATE OR REPLACE VIEW public.maintenance_due AS
SELECT 
    ms.*,
    d.dryer_id,
    d.status as dryer_status,
    p.full_name as assigned_technician_name
FROM public.maintenance_schedules ms
JOIN public.dryers d ON ms.dryer_id = d.id
LEFT JOIN public.profiles p ON ms.assigned_to = p.id
WHERE ms.status = 'scheduled'
AND ms.scheduled_date <= CURRENT_DATE + INTERVAL '7 days'
ORDER BY ms.scheduled_date;

-- Insert default alert thresholds (avoid duplicates)
INSERT INTO public.alert_thresholds (alert_type, min_value, max_value, priority, is_enabled)
SELECT 'high_temperature', NULL, 70.0, 'high'::alert_priority, true
WHERE NOT EXISTS (SELECT 1 FROM public.alert_thresholds WHERE alert_type = 'high_temperature' AND dryer_id IS NULL);

INSERT INTO public.alert_thresholds (alert_type, min_value, max_value, priority, is_enabled)
SELECT 'low_temperature', 20.0, NULL, 'medium'::alert_priority, true
WHERE NOT EXISTS (SELECT 1 FROM public.alert_thresholds WHERE alert_type = 'low_temperature' AND dryer_id IS NULL);

INSERT INTO public.alert_thresholds (alert_type, min_value, max_value, priority, is_enabled)
SELECT 'high_humidity', NULL, 80.0, 'medium'::alert_priority, true
WHERE NOT EXISTS (SELECT 1 FROM public.alert_thresholds WHERE alert_type = 'high_humidity' AND dryer_id IS NULL);

INSERT INTO public.alert_thresholds (alert_type, min_value, max_value, priority, is_enabled)
SELECT 'low_battery', NULL, 20.0, 'high'::alert_priority, true
WHERE NOT EXISTS (SELECT 1 FROM public.alert_thresholds WHERE alert_type = 'low_battery' AND dryer_id IS NULL);

-- Comments
COMMENT ON TABLE public.alerts IS 'Alert and notification tracking for dryer issues';
COMMENT ON TABLE public.alert_thresholds IS 'Configurable alert thresholds per dryer or region';
COMMENT ON TABLE public.notifications IS 'User notifications for alerts and system events';
COMMENT ON TABLE public.maintenance_schedules IS 'Maintenance scheduling and tracking';

-- Grant permissions
GRANT SELECT ON public.active_alerts_summary TO authenticated;
GRANT SELECT ON public.maintenance_due TO authenticated;
