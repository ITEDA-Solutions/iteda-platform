-- System Settings Migration
-- This migration creates system-wide configuration tables

-- Create system_settings table
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT NOT NULL UNIQUE,
    setting_value JSONB NOT NULL,
    setting_type TEXT NOT NULL, -- 'general', 'alert', 'data', 'user', 'integration'
    description TEXT,
    is_encrypted BOOLEAN DEFAULT false,
    updated_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on setting_key for fast lookups
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON public.system_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_system_settings_type ON public.system_settings(setting_type);

-- Enable Row Level Security
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Only super admins can view/modify system settings
CREATE POLICY "Super admins can view system settings"
    ON public.system_settings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.staff_roles
            WHERE staff_id = (SELECT id FROM public.profiles WHERE id = auth.uid())
            AND role = 'super_admin'
        )
    );

CREATE POLICY "Super admins can update system settings"
    ON public.system_settings FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.staff_roles
            WHERE staff_id = (SELECT id FROM public.profiles WHERE id = auth.uid())
            AND role = 'super_admin'
        )
    );

CREATE POLICY "Super admins can insert system settings"
    ON public.system_settings FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.staff_roles
            WHERE staff_id = (SELECT id FROM public.profiles WHERE id = auth.uid())
            AND role = 'super_admin'
        )
    );

-- Insert default system settings
INSERT INTO public.system_settings (setting_key, setting_value, setting_type, description) VALUES
-- General Settings
('company_name', '"ITEDA Solutions"', 'general', 'Company name displayed in the platform'),
('company_logo_url', '"/iteda-logo.png"', 'general', 'URL to company logo'),
('contact_email', '"support@itedasolutions.com"', 'general', 'Support contact email'),
('support_phone', '"+254-XXX-XXXXXX"', 'general', 'Support phone number'),
('default_timezone', '"Africa/Nairobi"', 'general', 'Default timezone for the platform'),

-- Alert Settings
('alert_email_enabled', 'true', 'alert', 'Enable email notifications for alerts'),
('alert_sms_enabled', 'false', 'alert', 'Enable SMS notifications for alerts (Phase 2)'),
('alert_escalation_timeout_minutes', '30', 'alert', 'Minutes before alert escalation'),
('critical_alert_recipients', '["admin@itedasolutions.com"]', 'alert', 'Email recipients for critical alerts'),

-- Global Alert Thresholds
('global_high_temp_threshold', '80', 'alert', 'Global high temperature threshold (°C)'),
('global_low_temp_threshold', '10', 'alert', 'Global low temperature threshold (°C)'),
('global_high_humidity_threshold', '90', 'alert', 'Global high humidity threshold (%)'),
('global_low_battery_threshold', '20', 'alert', 'Global low battery threshold (%)'),
('global_critical_battery_threshold', '10', 'alert', 'Global critical battery threshold (%)'),

-- Email Server Configuration
('smtp_host', '""', 'alert', 'SMTP server hostname'),
('smtp_port', '587', 'alert', 'SMTP server port'),
('smtp_username', '""', 'alert', 'SMTP username'),
('smtp_password', '""', 'alert', 'SMTP password (encrypted)'),
('smtp_from_email', '"noreply@itedasolutions.com"', 'alert', 'From email address'),
('smtp_from_name', '"ITEDA Platform"', 'alert', 'From name'),

-- Data Settings
('data_retention_days', '90', 'data', 'Days to retain raw sensor data'),
('hourly_aggregate_retention_days', '365', 'data', 'Days to retain hourly aggregates'),
('daily_aggregate_retention_days', '-1', 'data', 'Days to retain daily aggregates (-1 = indefinite)'),
('alert_history_retention_days', '730', 'data', 'Days to retain alert history (2 years)'),
('backup_enabled', 'true', 'data', 'Enable automatic database backups'),
('backup_schedule', '"0 2 * * *"', 'data', 'Backup schedule (cron format)'),

-- API Rate Limits
('api_rate_limit_per_minute', '60', 'data', 'API requests per minute per user'),
('export_size_limit_mb', '100', 'data', 'Maximum export file size in MB'),
('export_limit_super_admin', '1000000', 'data', 'Max records per export for super admin'),
('export_limit_admin', '500000', 'data', 'Max records per export for admin'),
('export_limit_regional_manager', '100000', 'data', 'Max records per export for regional manager'),

-- User Settings
('password_min_length', '8', 'user', 'Minimum password length'),
('password_require_uppercase', 'true', 'user', 'Require uppercase letter in password'),
('password_require_lowercase', 'true', 'user', 'Require lowercase letter in password'),
('password_require_number', 'true', 'user', 'Require number in password'),
('password_require_special', 'false', 'user', 'Require special character in password'),
('password_expiry_days', '90', 'user', 'Days before password expires'),
('session_timeout_minutes', '480', 'user', 'Session timeout in minutes (8 hours)'),
('max_login_attempts', '5', 'user', 'Maximum failed login attempts before lockout'),
('lockout_duration_minutes', '30', 'user', 'Account lockout duration in minutes'),
('require_2fa_super_admin', 'false', 'user', 'Require 2FA for super admins'),
('require_2fa_admin', 'false', 'user', 'Require 2FA for admins'),

-- Integration Settings
('weather_api_enabled', 'false', 'integration', 'Enable weather API integration (Phase 3)'),
('weather_api_key', '""', 'integration', 'Weather API key (encrypted)'),
('weather_api_provider', '"openweathermap"', 'integration', 'Weather API provider'),
('maps_api_key', '""', 'integration', 'Google Maps API key (encrypted)'),
('sms_gateway_provider', '"twilio"', 'integration', 'SMS gateway provider'),
('sms_api_key', '""', 'integration', 'SMS API key (encrypted)'),
('sms_api_secret', '""', 'integration', 'SMS API secret (encrypted)'),
('payment_gateway_enabled', 'false', 'integration', 'Enable payment gateway (for bridGe product)'),
('payment_gateway_provider', '"stripe"', 'integration', 'Payment gateway provider'),
('payment_api_key', '""', 'integration', 'Payment API key (encrypted)')
ON CONFLICT (setting_key) DO NOTHING;

-- Create audit log for settings changes
CREATE TABLE IF NOT EXISTS public.system_settings_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_id UUID REFERENCES public.system_settings(id),
    setting_key TEXT NOT NULL,
    old_value JSONB,
    new_value JSONB,
    changed_by UUID REFERENCES public.profiles(id),
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    change_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_settings_audit_setting ON public.system_settings_audit(setting_id);
CREATE INDEX IF NOT EXISTS idx_settings_audit_changed_at ON public.system_settings_audit(changed_at DESC);

-- Enable RLS on audit log
ALTER TABLE public.system_settings_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view settings audit"
    ON public.system_settings_audit FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.staff_roles
            WHERE staff_id = (SELECT id FROM public.profiles WHERE id = auth.uid())
            AND role = 'super_admin'
        )
    );

-- Trigger to log settings changes
CREATE OR REPLACE FUNCTION log_settings_change()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.system_settings_audit (
        setting_id,
        setting_key,
        old_value,
        new_value,
        changed_by
    ) VALUES (
        NEW.id,
        NEW.setting_key,
        OLD.setting_value,
        NEW.setting_value,
        NEW.updated_by
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_settings_change
    AFTER UPDATE ON public.system_settings
    FOR EACH ROW
    WHEN (OLD.setting_value IS DISTINCT FROM NEW.setting_value)
    EXECUTE FUNCTION log_settings_change();

-- Function to get setting value
CREATE OR REPLACE FUNCTION get_setting(key TEXT)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT setting_value INTO result
    FROM public.system_settings
    WHERE setting_key = key;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update setting value
CREATE OR REPLACE FUNCTION update_setting(
    key TEXT,
    value JSONB,
    user_id UUID,
    reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.system_settings
    SET setting_value = value,
        updated_by = user_id,
        updated_at = NOW()
    WHERE setting_key = key;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON TABLE public.system_settings IS 'System-wide configuration settings';
COMMENT ON TABLE public.system_settings_audit IS 'Audit log for system settings changes';
COMMENT ON FUNCTION get_setting(TEXT) IS 'Get a system setting value by key';
COMMENT ON FUNCTION update_setting(TEXT, JSONB, UUID, TEXT) IS 'Update a system setting value';
