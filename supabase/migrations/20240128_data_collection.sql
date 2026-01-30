-- Data Collection System Migration for Solar Dryers
-- This migration creates comprehensive sensor data storage and retention policies

-- Create sensor_readings table for real-time data
CREATE TABLE IF NOT EXISTS public.sensor_readings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dryer_id UUID NOT NULL REFERENCES public.dryers(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Temperature Sensors (°C)
    chamber_temp DECIMAL(5, 2),
    ambient_temp DECIMAL(5, 2),
    heater_temp DECIMAL(5, 2),
    
    -- Humidity Sensors (%)
    internal_humidity DECIMAL(5, 2),
    external_humidity DECIMAL(5, 2),
    
    -- Fan Data
    fan_speed_rpm INTEGER,
    fan_speed_percentage DECIMAL(5, 2),
    fan_status BOOLEAN,
    
    -- Operational Status
    heater_status BOOLEAN,
    door_status BOOLEAN,
    
    -- Power Metrics
    solar_voltage DECIMAL(5, 2),
    battery_level INTEGER,
    battery_voltage DECIMAL(5, 2),
    power_consumption_w DECIMAL(7, 2),
    charging_status TEXT,
    
    -- Additional Metadata
    active_preset_id UUID REFERENCES public.presets(id),
    data_quality_score DECIMAL(3, 2), -- 0.00 to 1.00
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create operational_events table for status changes
CREATE TABLE IF NOT EXISTS public.operational_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dryer_id UUID NOT NULL REFERENCES public.dryers(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- 'heater_on', 'heater_off', 'fan_on', 'fan_off', 'door_open', 'door_close'
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    previous_state BOOLEAN,
    new_state BOOLEAN,
    triggered_by TEXT, -- 'manual', 'automatic', 'preset', 'alert'
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create aggregated_sensor_data table for long-term storage
CREATE TABLE IF NOT EXISTS public.aggregated_sensor_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dryer_id UUID NOT NULL REFERENCES public.dryers(id) ON DELETE CASCADE,
    aggregation_period TEXT NOT NULL, -- 'hourly', 'daily', 'weekly', 'monthly'
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    
    -- Temperature Aggregates
    chamber_temp_avg DECIMAL(5, 2),
    chamber_temp_min DECIMAL(5, 2),
    chamber_temp_max DECIMAL(5, 2),
    ambient_temp_avg DECIMAL(5, 2),
    heater_temp_avg DECIMAL(5, 2),
    
    -- Humidity Aggregates
    internal_humidity_avg DECIMAL(5, 2),
    internal_humidity_min DECIMAL(5, 2),
    internal_humidity_max DECIMAL(5, 2),
    external_humidity_avg DECIMAL(5, 2),
    
    -- Fan Aggregates
    fan_speed_avg DECIMAL(5, 2),
    fan_runtime_hours DECIMAL(10, 2),
    
    -- Power Aggregates
    solar_voltage_avg DECIMAL(5, 2),
    battery_level_avg DECIMAL(5, 2),
    power_consumption_total_kwh DECIMAL(10, 3),
    
    -- Operational Aggregates
    heater_runtime_hours DECIMAL(10, 2),
    door_open_count INTEGER,
    total_readings_count INTEGER,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_aggregation UNIQUE (dryer_id, aggregation_period, period_start)
);

-- Create data_retention_policies table
CREATE TABLE IF NOT EXISTS public.data_retention_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    policy_name TEXT NOT NULL UNIQUE,
    data_type TEXT NOT NULL, -- 'sensor_readings', 'operational_events', 'aggregated_data'
    retention_days INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default retention policies
INSERT INTO public.data_retention_policies (policy_name, data_type, retention_days, description) VALUES
    ('detailed_sensor_data', 'sensor_readings', 90, 'Keep detailed sensor readings for 3 months'),
    ('operational_events', 'operational_events', 365, 'Keep operational events for 1 year'),
    ('hourly_aggregates', 'aggregated_data', 365, 'Keep hourly aggregates for 1 year'),
    ('daily_aggregates', 'aggregated_data', 1825, 'Keep daily aggregates for 5 years'),
    ('monthly_aggregates', 'aggregated_data', -1, 'Keep monthly aggregates indefinitely')
ON CONFLICT (policy_name) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sensor_readings_dryer_timestamp 
    ON public.sensor_readings(dryer_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_timestamp 
    ON public.sensor_readings(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_dryer_created 
    ON public.sensor_readings(dryer_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_operational_events_dryer_timestamp 
    ON public.operational_events(dryer_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_operational_events_type 
    ON public.operational_events(event_type);

CREATE INDEX IF NOT EXISTS idx_aggregated_data_dryer_period 
    ON public.aggregated_sensor_data(dryer_id, aggregation_period, period_start DESC);

-- Enable Row Level Security
ALTER TABLE public.sensor_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operational_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aggregated_sensor_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_retention_policies ENABLE ROW LEVEL SECURITY;

-- Sensor readings policies
CREATE POLICY "Users can view sensor readings for accessible dryers"
    ON public.sensor_readings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.dryers d
            WHERE d.id = dryer_id
            AND (
                -- Super admin and admin can see all
                EXISTS (
                    SELECT 1 FROM public.staff_roles
                    WHERE staff_id = auth.uid() AND role IN ('super_admin', 'admin')
                )
                OR
                -- Regional manager can see their region
                EXISTS (
                    SELECT 1 FROM public.staff_roles sr
                    JOIN public.regions r ON r.id = d.region_id
                    WHERE sr.staff_id = auth.uid() 
                    AND sr.role = 'regional_manager'
                    AND sr.region = r.name
                )
                OR
                -- Field technician can see assigned dryers
                EXISTS (
                    SELECT 1 FROM public.dryer_assignments da
                    WHERE da.technician_id = auth.uid() AND da.dryer_id = d.id
                )
            )
        )
    );

CREATE POLICY "System can insert sensor readings"
    ON public.sensor_readings FOR INSERT
    WITH CHECK (true); -- Allow IoT devices to insert (will use service role key)

-- Operational events policies
CREATE POLICY "Users can view operational events for accessible dryers"
    ON public.operational_events FOR SELECT
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

CREATE POLICY "System can insert operational events"
    ON public.operational_events FOR INSERT
    WITH CHECK (true);

-- Aggregated data policies
CREATE POLICY "Users can view aggregated data for accessible dryers"
    ON public.aggregated_sensor_data FOR SELECT
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

-- Retention policies - only admins can view/manage
CREATE POLICY "Admins can view retention policies"
    ON public.data_retention_policies FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.staff_roles
            WHERE staff_id = auth.uid() AND role IN ('super_admin', 'admin')
        )
    );

CREATE POLICY "Super admins can manage retention policies"
    ON public.data_retention_policies FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.staff_roles
            WHERE staff_id = auth.uid() AND role = 'super_admin'
        )
    );

-- Function to update dryer's last communication timestamp
CREATE OR REPLACE FUNCTION public.update_dryer_last_communication()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.dryers
    SET last_communication = NEW.timestamp
    WHERE id = NEW.dryer_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update last communication on new sensor reading
DROP TRIGGER IF EXISTS trigger_update_last_communication ON public.sensor_readings;
CREATE TRIGGER trigger_update_last_communication
    AFTER INSERT ON public.sensor_readings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_dryer_last_communication();

-- Function to aggregate hourly data
CREATE OR REPLACE FUNCTION public.aggregate_hourly_data(target_dryer_id UUID, target_hour TIMESTAMPTZ)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.aggregated_sensor_data (
        dryer_id,
        aggregation_period,
        period_start,
        period_end,
        chamber_temp_avg,
        chamber_temp_min,
        chamber_temp_max,
        ambient_temp_avg,
        heater_temp_avg,
        internal_humidity_avg,
        internal_humidity_min,
        internal_humidity_max,
        external_humidity_avg,
        fan_speed_avg,
        solar_voltage_avg,
        battery_level_avg,
        power_consumption_total_kwh,
        total_readings_count
    )
    SELECT
        target_dryer_id,
        'hourly',
        date_trunc('hour', target_hour),
        date_trunc('hour', target_hour) + INTERVAL '1 hour',
        AVG(chamber_temp),
        MIN(chamber_temp),
        MAX(chamber_temp),
        AVG(ambient_temp),
        AVG(heater_temp),
        AVG(internal_humidity),
        MIN(internal_humidity),
        MAX(internal_humidity),
        AVG(external_humidity),
        AVG(fan_speed_rpm),
        AVG(solar_voltage),
        AVG(battery_level),
        SUM(power_consumption_w) / 1000.0, -- Convert to kWh
        COUNT(*)
    FROM public.sensor_readings
    WHERE dryer_id = target_dryer_id
    AND timestamp >= date_trunc('hour', target_hour)
    AND timestamp < date_trunc('hour', target_hour) + INTERVAL '1 hour'
    ON CONFLICT (dryer_id, aggregation_period, period_start) DO UPDATE
    SET
        chamber_temp_avg = EXCLUDED.chamber_temp_avg,
        chamber_temp_min = EXCLUDED.chamber_temp_min,
        chamber_temp_max = EXCLUDED.chamber_temp_max,
        ambient_temp_avg = EXCLUDED.ambient_temp_avg,
        heater_temp_avg = EXCLUDED.heater_temp_avg,
        internal_humidity_avg = EXCLUDED.internal_humidity_avg,
        internal_humidity_min = EXCLUDED.internal_humidity_min,
        internal_humidity_max = EXCLUDED.internal_humidity_max,
        external_humidity_avg = EXCLUDED.external_humidity_avg,
        fan_speed_avg = EXCLUDED.fan_speed_avg,
        solar_voltage_avg = EXCLUDED.solar_voltage_avg,
        battery_level_avg = EXCLUDED.battery_level_avg,
        power_consumption_total_kwh = EXCLUDED.power_consumption_total_kwh,
        total_readings_count = EXCLUDED.total_readings_count;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old data based on retention policies
CREATE OR REPLACE FUNCTION public.cleanup_old_data()
RETURNS TABLE(deleted_readings BIGINT, deleted_events BIGINT) AS $$
DECLARE
    sensor_retention INTEGER;
    events_retention INTEGER;
    deleted_sensor_count BIGINT;
    deleted_events_count BIGINT;
BEGIN
    -- Get retention periods
    SELECT retention_days INTO sensor_retention
    FROM public.data_retention_policies
    WHERE policy_name = 'detailed_sensor_data' AND is_active = true;
    
    SELECT retention_days INTO events_retention
    FROM public.data_retention_policies
    WHERE policy_name = 'operational_events' AND is_active = true;
    
    -- Delete old sensor readings
    DELETE FROM public.sensor_readings
    WHERE timestamp < NOW() - (sensor_retention || ' days')::INTERVAL;
    GET DIAGNOSTICS deleted_sensor_count = ROW_COUNT;
    
    -- Delete old operational events
    DELETE FROM public.operational_events
    WHERE timestamp < NOW() - (events_retention || ' days')::INTERVAL;
    GET DIAGNOSTICS deleted_events_count = ROW_COUNT;
    
    RETURN QUERY SELECT deleted_sensor_count, deleted_events_count;
END;
$$ LANGUAGE plpgsql;

-- View for latest sensor readings per dryer
CREATE OR REPLACE VIEW public.latest_sensor_readings AS
SELECT DISTINCT ON (dryer_id)
    sr.*,
    d.dryer_id as dryer_identifier,
    d.status as dryer_status
FROM public.sensor_readings sr
JOIN public.dryers d ON sr.dryer_id = d.id
ORDER BY dryer_id, timestamp DESC;

-- View for real-time dryer dashboard
CREATE OR REPLACE VIEW public.dryer_realtime_status AS
SELECT
    d.id,
    d.dryer_id,
    d.serial_number,
    d.status,
    d.last_communication,
    lsr.timestamp as last_reading_time,
    lsr.chamber_temp,
    lsr.ambient_temp,
    lsr.heater_temp,
    lsr.internal_humidity,
    lsr.external_humidity,
    lsr.fan_speed_rpm,
    lsr.fan_status,
    lsr.heater_status,
    lsr.door_status,
    lsr.solar_voltage,
    lsr.battery_level,
    lsr.battery_voltage,
    lsr.power_consumption_w,
    lsr.charging_status,
    CASE 
        WHEN lsr.timestamp > NOW() - INTERVAL '5 minutes' THEN 'online'
        WHEN lsr.timestamp > NOW() - INTERVAL '1 hour' THEN 'recent'
        WHEN lsr.timestamp > NOW() - INTERVAL '24 hours' THEN 'today'
        ELSE 'offline'
    END as connection_status
FROM public.dryers d
LEFT JOIN public.latest_sensor_readings lsr ON d.id = lsr.dryer_id;

-- Comments for documentation
COMMENT ON TABLE public.sensor_readings IS 'Real-time sensor data from solar dryers';
COMMENT ON TABLE public.operational_events IS 'Operational status change events with timestamps';
COMMENT ON TABLE public.aggregated_sensor_data IS 'Aggregated sensor data for long-term storage';
COMMENT ON TABLE public.data_retention_policies IS 'Data retention policies for automatic cleanup';
COMMENT ON VIEW public.latest_sensor_readings IS 'Latest sensor reading for each dryer';
COMMENT ON VIEW public.dryer_realtime_status IS 'Real-time status dashboard for all dryers';

-- Grant permissions
GRANT SELECT ON public.latest_sensor_readings TO authenticated;
GRANT SELECT ON public.dryer_realtime_status TO authenticated;
