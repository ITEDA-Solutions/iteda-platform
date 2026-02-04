-- Seed Default Presets
-- Insert the 6 default presets as specified in requirements

INSERT INTO public.presets (preset_id, crop_type, region, target_temp_c, target_humidity_pct, fan_speed_rpm, duration_hours, min_temp_threshold, max_temp_threshold, description, is_active) VALUES
('PRESET-001', 'Maize', 'Rift Valley', 45, 35, 1000, 6.0, 40, 50, 'Optimized for maize drying in Rift Valley region', true),
('PRESET-002', 'Maize', 'Central', 43, 38, 1000, 6.0, 38, 48, 'Optimized for maize drying in Central region', true),
('PRESET-003', 'Chili', 'Rift Valley', 50, 30, 1200, 5.0, 45, 55, 'Optimized for chili drying in Rift Valley region', true),
('PRESET-004', 'Chili', 'Coast', 48, 35, 1100, 5.5, 43, 53, 'Optimized for chili drying in Coast region', true),
('PRESET-005', 'Beans', 'Western', 40, 40, 900, 7.0, 35, 45, 'Optimized for beans drying in Western region', true),
('PRESET-006', 'Banana', 'Coast', 38, 45, 800, 8.0, 33, 43, 'Optimized for banana drying in Coast region', true)
ON CONFLICT (preset_id) DO NOTHING;

-- Add more presets for comprehensive coverage
INSERT INTO public.presets (preset_id, crop_type, region, target_temp_c, target_humidity_pct, fan_speed_rpm, duration_hours, min_temp_threshold, max_temp_threshold, description, is_active) VALUES
('PRESET-007', 'Tomato', 'Central', 55, 25, 1100, 6.0, 50, 60, 'Optimized for tomato drying in Central region', true),
('PRESET-008', 'Mango', 'Coast', 50, 30, 900, 8.0, 45, 55, 'Optimized for mango drying in Coast region', true),
('PRESET-009', 'Coffee', 'Central', 45, 35, 1000, 12.0, 40, 50, 'Optimized for coffee drying in Central region', true),
('PRESET-010', 'Tea', 'Rift Valley', 40, 40, 950, 10.0, 35, 45, 'Optimized for tea drying in Rift Valley region', true)
ON CONFLICT (preset_id) DO NOTHING;

COMMENT ON TABLE public.presets IS 'Drying presets for different crops and regions';
