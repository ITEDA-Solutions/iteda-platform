-- Alerts and Notifications System Migration
-- This migration creates comprehensive alert management and notification system

-- Create alert_type enum
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

-- Create alert_priority enum
DO $$ BEGIN
    CREATE TYPE alert_priority AS ENUM ('critical', 'high', 'medium', 'low', 'info');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create alerts table (enhanced from existing)
CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dryer_id UUID NOT NULL REFERENCES public.dryers(id) ON DELETE CASCADE,
    alert_type alert_type NOT NULL,
    priority alert_priority NOT NULL DEFAULT 'medium',
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'acknowledged', 'resolved', 'dismissed'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    threshold_value DECIMAL(10, 2),
    current_value DECIMAL(10, 2),
    
    -- Timestamps
    triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    acknowledged_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    dismissed_at TIMESTAMPTZ,
    
    -- User actions
    acknowledged_by UUID REFERENCES public.profiles(id),
    resolved_by UUID REFERENCES public.profiles(id),
    dismissed_by UUID REFERENCES public.profiles(id),
    
    -- Additional info
    resolution_notes TEXT,
    auto_resolved BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create alert_thresholds table for configurable thresholds
CREATE TABLE IF NOT EXISTS public.alert_thresholds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dryer_id UUID REFERENCES public.dryers(id) ON DELETE CASCADE,
    region_id UUID REFERENCES public.regions(id),
    alert_type alert_type NOT NULL,
    
    -- Threshold values
    min_value DECIMAL(10, 2),
    max_value DECIMAL(10, 2),
    duration_minutes INTEGER, -- Alert only if condition persists for this duration
    
    -- Configuration
    is_enabled BOOLEAN DEFAULT true,
    priority alert_priority NOT NULL DEFAULT 'medium',
    
    -- Notification settings
    notify_email BOOLEAN DEFAULT true,
    notify_sms BOOLEAN DEFAULT false,
    notify_push BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure unique threshold per dryer/region and alert type
    CONSTRAINT unique_threshold UNIQUE (dryer_id, alert_type)
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    alert_id UUID REFERENCES public.alerts(id) ON DELETE CASCADE,
    
    notification_type TEXT NOT NULL, -- 'alert', 'maintenance', 'system', 'report'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    
    -- Status
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    
    -- Delivery
    delivery_method TEXT, -- 'in_app', 'email', 'sms', 'push'
    delivered_at TIMESTAMPTZ,
    
    -- Links
    action_url TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create maintenance_schedules table
CREATE TABLE IF NOT EXISTS public.maintenance_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dryer_id UUID NOT NULL REFERENCES public.dryers(id) ON DELETE CASCADE,
    
    maintenance_type TEXT NOT NULL, -- 'routine', 'repair', 'inspection', 'cleaning'
    description TEXT,
    
    -- Scheduling
    scheduled_date DATE NOT NULL,
    completed_date DATE,
    
    -- Assignment
    assigned_to UUID REFERENCES public.profiles(id),
    
    -- Status
    status TEXT NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'cancelled'
    
    -- Details
    estimated_duration_hours DECIMAL(4, 2),
    actual_duration_hours DECIMAL(4, 2),
    notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_alerts_dryer_status ON public.alerts(dryer_id, status);
CREATE INDEX IF NOT EXISTS idx_alerts_triggered_at ON public.alerts(triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_priority ON public.alerts(priority, status);
CREATE INDEX IF NOT EXISTS idx_alerts_type ON public.alerts(alert_type, status);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_maintenance_dryer_status ON public.maintenance_schedules(dryer_id, status);
CREATE INDEX IF NOT EXISTS idx_maintenance_scheduled_date ON public.maintenance_schedules(scheduled_date);

-- Enable Row Level Security
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_thresholds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_schedules ENABLE ROW LEVEL SECURITY;

-- Alerts policies
CREATE POLICY "Users can view alerts for accessible dryers"
    ON public.alerts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.dryers d
            WHERE d.id = dryer_id
            AND (
                EXISTS (
                    SELECT 1 FROM public.staff_roles
                    WHERE staff_id = auth.uid() AND role IN ('super_admin', 'admin')
                )
                OR
                EXISTS (
                    SELECT 1 FROM public.staff_roles sr
                    JOIN public.regions r ON r.id = d.region_id
                    WHERE sr.staff_id = auth.uid() 
                    AND sr.role = 'regional_manager'
                    AND sr.region = r.name
                )
                OR
                EXISTS (
                    SELECT 1 FROM public.dryer_assignments da
                    WHERE da.technician_id = auth.uid() AND da.dryer_id = d.id
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
                    WHERE staff_id = auth.uid() AND role IN ('super_admin', 'admin', 'regional_manager')
                )
                OR
                EXISTS (
                    SELECT 1 FROM public.dryer_assignments da
                    WHERE da.technician_id = auth.uid() AND da.dryer_id = d.id
                )
            )
        )
    );

-- Notifications policies
CREATE POLICY "Users can view their own notifications"
    ON public.notifications FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
    ON public.notifications FOR UPDATE
    USING (user_id = auth.uid());

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
                    WHERE staff_id = auth.uid() AND role IN ('super_admin', 'admin')
                )
                OR
                EXISTS (
                    SELECT 1 FROM public.staff_roles sr
                    JOIN public.regions r ON r.id = d.region_id
                    WHERE sr.staff_id = auth.uid() 
                    AND sr.role = 'regional_manager'
                    AND sr.region = r.name
                )
                OR
                assigned_to = auth.uid()
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
            
            -- Check if alert already exists
            SELECT EXISTS(
                SELECT 1 FROM public.alerts 
                WHERE dryer_id = NEW.dryer_id 
                AND alert_type = 'high_temperature'
                AND status = 'active'
            ) INTO alert_exists;
            
            IF NOT alert_exists THEN
                INSERT INTO public.alerts (
                    dryer_id, alert_type, priority, title, message,
                    threshold_value, current_value
                ) VALUES (
                    NEW.dryer_id,
                    'high_temperature',
                    threshold_record.priority,
                    'High Temperature Alert',
                    'Chamber temperature exceeded threshold',
                    threshold_record.max_value,
                    NEW.chamber_temp
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
                threshold_value, current_value
            ) VALUES (
                NEW.dryer_id,
                'low_battery',
                CASE WHEN NEW.battery_level < 10 THEN 'critical' ELSE 'high' END,
                'Low Battery Warning',
                'Battery level is critically low',
                20,
                NEW.battery_level
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to check alerts on new sensor reading
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
                dryer_id, alert_type, priority, title, message
            ) VALUES (
                dryer_record.id,
                'dryer_offline',
                'high',
                'Dryer Offline',
                'Dryer has not communicated for over 1 hour'
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

-- Insert default alert thresholds
INSERT INTO public.alert_thresholds (alert_type, min_value, max_value, priority, is_enabled) VALUES
    ('high_temperature', NULL, 70.0, 'high', true),
    ('low_temperature', 20.0, NULL, 'medium', true),
    ('high_humidity', NULL, 80.0, 'medium', true),
    ('low_battery', NULL, 20.0, 'high', true)
ON CONFLICT DO NOTHING;

-- Comments
COMMENT ON TABLE public.alerts IS 'Alert and notification tracking for dryer issues';
COMMENT ON TABLE public.alert_thresholds IS 'Configurable alert thresholds per dryer or region';
COMMENT ON TABLE public.notifications IS 'User notifications for alerts and system events';
COMMENT ON TABLE public.maintenance_schedules IS 'Maintenance scheduling and tracking';

-- Grant permissions
GRANT SELECT ON public.active_alerts_summary TO authenticated;
GRANT SELECT ON public.maintenance_due TO authenticated;
