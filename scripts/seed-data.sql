-- ===========================================
-- SEED DATA SCRIPT FOR SMART DRY MONITOR
-- ===========================================
-- Run this script in Supabase SQL Editor AFTER running setup-supabase.sql
-- This seeds all tables EXCEPT authentication tables (profiles, user_roles)
--
-- Tables seeded:
-- 1. regions
-- 2. presets
-- 3. dryer_owners
-- 4. dryers
-- 5. sensor_readings
-- 6. alerts

-- ===========================================
-- CLEAR EXISTING DATA (in correct order due to foreign keys)
-- ===========================================

TRUNCATE TABLE public.alerts CASCADE;
TRUNCATE TABLE public.sensor_readings CASCADE;
TRUNCATE TABLE public.dryers CASCADE;
TRUNCATE TABLE public.dryer_owners CASCADE;
TRUNCATE TABLE public.presets CASCADE;
TRUNCATE TABLE public.regions CASCADE;

-- ===========================================
-- 1. REGIONS
-- ===========================================

INSERT INTO public.regions (id, name, code) VALUES
    ('a1000000-0000-0000-0000-000000000001', 'Rift Valley', 'RV'),
    ('a1000000-0000-0000-0000-000000000002', 'Central', 'CT'),
    ('a1000000-0000-0000-0000-000000000003', 'Coast', 'CO'),
    ('a1000000-0000-0000-0000-000000000004', 'Western', 'WE'),
    ('a1000000-0000-0000-0000-000000000005', 'Eastern', 'EA'),
    ('a1000000-0000-0000-0000-000000000006', 'Nyanza', 'NY'),
    ('a1000000-0000-0000-0000-000000000007', 'North Eastern', 'NE'),
    ('a1000000-0000-0000-0000-000000000008', 'Nairobi', 'NB');

-- ===========================================
-- 2. PRESETS (Drying configurations for different crops)
-- ===========================================

INSERT INTO public.presets (id, preset_id, crop_type, region, target_temp_c, target_humidity_pct, fan_speed_rpm, duration_hours, min_temp_threshold, max_temp_threshold, description, is_active) VALUES
    -- Maize presets
    ('b1000000-0000-0000-0000-000000000001', 'PRESET-001', 'Maize', 'Rift Valley', 45, 35, 1000, 6.0, 40, 50, 'Standard maize drying for Rift Valley region', true),
    ('b1000000-0000-0000-0000-000000000002', 'PRESET-002', 'Maize', 'Central', 43, 38, 1000, 6.0, 38, 48, 'Maize drying optimized for Central region humidity', true),
    ('b1000000-0000-0000-0000-000000000003', 'PRESET-003', 'Maize', 'Western', 44, 36, 950, 6.5, 39, 49, 'Maize drying for Western region conditions', true),
    ('b1000000-0000-0000-0000-000000000004', 'PRESET-004', 'Maize', 'Coast', 42, 40, 1100, 7.0, 37, 47, 'Maize drying adjusted for coastal humidity', true),

    -- Chili presets
    ('b1000000-0000-0000-0000-000000000005', 'PRESET-005', 'Chili', 'Rift Valley', 50, 30, 1200, 5.0, 45, 55, 'High temperature chili drying for Rift Valley', true),
    ('b1000000-0000-0000-0000-000000000006', 'PRESET-006', 'Chili', 'Coast', 48, 35, 1100, 5.5, 43, 53, 'Chili drying for coastal humidity conditions', true),
    ('b1000000-0000-0000-0000-000000000007', 'PRESET-007', 'Chili', 'Eastern', 49, 32, 1150, 5.0, 44, 54, 'Chili drying for Eastern region', true),

    -- Beans presets
    ('b1000000-0000-0000-0000-000000000008', 'PRESET-008', 'Beans', 'Western', 40, 40, 900, 7.0, 35, 45, 'Gentle bean drying for Western region', true),
    ('b1000000-0000-0000-0000-000000000009', 'PRESET-009', 'Beans', 'Nyanza', 41, 38, 920, 6.5, 36, 46, 'Bean drying for Nyanza region', true),
    ('b1000000-0000-0000-0000-000000000010', 'PRESET-010', 'Beans', 'Central', 39, 42, 880, 7.5, 34, 44, 'Bean drying for Central highland conditions', true),

    -- Banana presets
    ('b1000000-0000-0000-0000-000000000011', 'PRESET-011', 'Banana', 'Coast', 38, 45, 800, 8.0, 33, 43, 'Low temperature banana drying for Coast region', true),
    ('b1000000-0000-0000-0000-000000000012', 'PRESET-012', 'Banana', 'Western', 37, 48, 780, 8.5, 32, 42, 'Banana chips drying for Western region', true),

    -- Coffee presets
    ('b1000000-0000-0000-0000-000000000013', 'PRESET-013', 'Coffee', 'Central', 35, 50, 750, 10.0, 30, 40, 'Slow coffee bean drying for premium quality', true),
    ('b1000000-0000-0000-0000-000000000014', 'PRESET-014', 'Coffee', 'Eastern', 36, 48, 780, 9.5, 31, 41, 'Coffee drying for Eastern highlands', true),

    -- Tea presets
    ('b1000000-0000-0000-0000-000000000015', 'PRESET-015', 'Tea', 'Rift Valley', 55, 25, 1300, 4.0, 50, 60, 'High-temp tea leaf drying', true),
    ('b1000000-0000-0000-0000-000000000016', 'PRESET-016', 'Tea', 'Central', 53, 28, 1250, 4.5, 48, 58, 'Tea drying for Central region', true),

    -- Rice presets
    ('b1000000-0000-0000-0000-000000000017', 'PRESET-017', 'Rice', 'Western', 42, 38, 950, 6.0, 37, 47, 'Rice paddy drying for Western region', true),
    ('b1000000-0000-0000-0000-000000000018', 'PRESET-018', 'Rice', 'Nyanza', 43, 36, 980, 5.5, 38, 48, 'Rice drying optimized for Nyanza', true),

    -- Sorghum presets
    ('b1000000-0000-0000-0000-000000000019', 'PRESET-019', 'Sorghum', 'Eastern', 44, 34, 1000, 5.5, 39, 49, 'Sorghum drying for semi-arid conditions', true),
    ('b1000000-0000-0000-0000-000000000020', 'PRESET-020', 'Sorghum', 'North Eastern', 46, 30, 1050, 5.0, 41, 51, 'Sorghum drying for arid regions', true);

-- ===========================================
-- 3. DRYER OWNERS
-- ===========================================

INSERT INTO public.dryer_owners (id, name, phone, email, address, farm_business_name, id_number) VALUES
    ('c1000000-0000-0000-0000-000000000001', 'John Kamau', '+254712345001', 'john.kamau@email.com', 'P.O. Box 123, Nakuru', 'Kamau Grain Farmers', 'ID12345001'),
    ('c1000000-0000-0000-0000-000000000002', 'Mary Wanjiku', '+254712345002', 'mary.wanjiku@email.com', 'P.O. Box 456, Nyeri', 'Wanjiku Coffee Estates', 'ID12345002'),
    ('c1000000-0000-0000-0000-000000000003', 'Peter Ochieng', '+254712345003', 'peter.ochieng@email.com', 'P.O. Box 789, Kisumu', 'Ochieng Rice Mills', 'ID12345003'),
    ('c1000000-0000-0000-0000-000000000004', 'Grace Muthoni', '+254712345004', 'grace.muthoni@email.com', 'P.O. Box 101, Mombasa', 'Muthoni Spice Farm', 'ID12345004'),
    ('c1000000-0000-0000-0000-000000000005', 'David Kipchoge', '+254712345005', 'david.kipchoge@email.com', 'P.O. Box 202, Eldoret', 'Kipchoge Maize Cooperative', 'ID12345005'),
    ('c1000000-0000-0000-0000-000000000006', 'Sarah Akinyi', '+254712345006', 'sarah.akinyi@email.com', 'P.O. Box 303, Kakamega', 'Akinyi Bean Traders', 'ID12345006'),
    ('c1000000-0000-0000-0000-000000000007', 'James Mwangi', '+254712345007', 'james.mwangi@email.com', 'P.O. Box 404, Thika', 'Mwangi Agro Industries', 'ID12345007'),
    ('c1000000-0000-0000-0000-000000000008', 'Elizabeth Chebet', '+254712345008', 'elizabeth.chebet@email.com', 'P.O. Box 505, Kericho', 'Chebet Tea Farmers', 'ID12345008'),
    ('c1000000-0000-0000-0000-000000000009', 'Michael Otieno', '+254712345009', 'michael.otieno@email.com', 'P.O. Box 606, Homa Bay', 'Otieno Sorghum Farms', 'ID12345009'),
    ('c1000000-0000-0000-0000-000000000010', 'Catherine Njeri', '+254712345010', 'catherine.njeri@email.com', 'P.O. Box 707, Kiambu', 'Njeri Banana Plantations', 'ID12345010'),
    ('c1000000-0000-0000-0000-000000000011', 'Joseph Wafula', '+254712345011', 'joseph.wafula@email.com', 'P.O. Box 808, Bungoma', 'Wafula Grain Store', 'ID12345011'),
    ('c1000000-0000-0000-0000-000000000012', 'Agnes Moraa', '+254712345012', 'agnes.moraa@email.com', 'P.O. Box 909, Kisii', 'Moraa Highland Farms', 'ID12345012');

-- ===========================================
-- 4. DRYERS
-- ===========================================

INSERT INTO public.dryers (
    id, dryer_id, serial_number, status, deployment_date,
    location_latitude, location_longitude, location_address,
    region_id, owner_id, num_temp_sensors, num_humidity_sensors,
    num_fans, num_heaters, solar_capacity_w, battery_capacity_ah,
    current_preset_id, last_communication, total_runtime_hours,
    battery_level, battery_voltage, signal_strength, active_alerts_count
) VALUES
    -- Active dryers
    ('d1000000-0000-0000-0000-000000000001', 'DRY-001', 'SN-2024-001', 'active', '2024-01-15',
     -0.2833, 36.0667, 'Nakuru Town, Rift Valley',
     'a1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001',
     3, 2, 2, 1, 500, 200,
     'b1000000-0000-0000-0000-000000000001', NOW() - INTERVAL '5 minutes', 1250.50,
     85, 13.2, 78, 0),

    ('d1000000-0000-0000-0000-000000000002', 'DRY-002', 'SN-2024-002', 'active', '2024-02-20',
     -0.4167, 36.9500, 'Nyeri Town, Central',
     'a1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000002',
     3, 2, 2, 1, 600, 250,
     'b1000000-0000-0000-0000-000000000013', NOW() - INTERVAL '2 minutes', 890.25,
     92, 13.8, 85, 0),

    ('d1000000-0000-0000-0000-000000000003', 'DRY-003', 'SN-2024-003', 'active', '2024-03-10',
     -0.1000, 34.7500, 'Kisumu City, Nyanza',
     'a1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000003',
     4, 3, 2, 2, 750, 300,
     'b1000000-0000-0000-0000-000000000017', NOW() - INTERVAL '1 minute', 650.75,
     78, 12.9, 72, 1),

    ('d1000000-0000-0000-0000-000000000004', 'DRY-004', 'SN-2024-004', 'active', '2024-03-25',
     -4.0435, 39.6682, 'Mombasa, Coast',
     'a1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000004',
     3, 2, 2, 1, 500, 200,
     'b1000000-0000-0000-0000-000000000006', NOW() - INTERVAL '3 minutes', 420.00,
     88, 13.5, 90, 0),

    ('d1000000-0000-0000-0000-000000000005', 'DRY-005', 'SN-2024-005', 'active', '2024-04-05',
     0.5143, 35.2698, 'Eldoret, Rift Valley',
     'a1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000005',
     4, 3, 3, 2, 800, 350,
     'b1000000-0000-0000-0000-000000000001', NOW() - INTERVAL '30 seconds', 1890.25,
     95, 14.1, 88, 0),

    -- Idle dryers
    ('d1000000-0000-0000-0000-000000000006', 'DRY-006', 'SN-2024-006', 'idle', '2024-04-15',
     0.2827, 34.7519, 'Kakamega Town, Western',
     'a1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000006',
     3, 2, 2, 1, 500, 200,
     'b1000000-0000-0000-0000-000000000008', NOW() - INTERVAL '1 hour', 320.50,
     100, 14.2, 65, 0),

    ('d1000000-0000-0000-0000-000000000007', 'DRY-007', 'SN-2024-007', 'idle', '2024-05-01',
     -1.0333, 37.0833, 'Thika Town, Central',
     'a1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000007',
     3, 2, 2, 1, 600, 250,
     NULL, NOW() - INTERVAL '2 hours', 560.00,
     97, 13.9, 82, 0),

    ('d1000000-0000-0000-0000-000000000008', 'DRY-008', 'SN-2024-008', 'idle', '2024-05-10',
     -0.3667, 35.2833, 'Kericho Town, Rift Valley',
     'a1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000008',
     4, 3, 2, 2, 700, 280,
     'b1000000-0000-0000-0000-000000000015', NOW() - INTERVAL '45 minutes', 780.25,
     93, 13.7, 75, 0),

    -- Offline dryers
    ('d1000000-0000-0000-0000-000000000009', 'DRY-009', 'SN-2024-009', 'offline', '2024-05-20',
     -0.5333, 34.4667, 'Homa Bay, Nyanza',
     'a1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000009',
     3, 2, 2, 1, 500, 200,
     'b1000000-0000-0000-0000-000000000019', NOW() - INTERVAL '6 hours', 210.75,
     45, 11.8, 25, 2),

    ('d1000000-0000-0000-0000-000000000010', 'DRY-010', 'SN-2024-010', 'offline', '2024-06-01',
     -1.1667, 36.9333, 'Kiambu Town, Central',
     'a1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000010',
     3, 2, 2, 1, 600, 250,
     'b1000000-0000-0000-0000-000000000011', NOW() - INTERVAL '12 hours', 150.50,
     12, 10.5, 0, 3),

    -- Maintenance dryers
    ('d1000000-0000-0000-0000-000000000011', 'DRY-011', 'SN-2024-011', 'maintenance', '2024-06-10',
     0.5667, 34.5667, 'Bungoma Town, Western',
     'a1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000011',
     3, 2, 2, 1, 500, 200,
     NULL, NOW() - INTERVAL '3 days', 980.00,
     0, 0.0, 0, 1),

    ('d1000000-0000-0000-0000-000000000012', 'DRY-012', 'SN-2024-012', 'maintenance', '2024-06-15',
     -0.6817, 34.7717, 'Kisii Town, Nyanza',
     'a1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000012',
     4, 3, 2, 2, 700, 280,
     NULL, NOW() - INTERVAL '5 days', 1120.50,
     0, 0.0, 0, 2);

-- ===========================================
-- 5. SENSOR READINGS (Last 24 hours of data for active dryers)
-- ===========================================

-- Generate sensor readings for the last 24 hours (every 15 minutes = 96 readings per dryer)
-- We'll create a subset for demonstration

-- Dryer 1 readings (active - Maize drying)
INSERT INTO public.sensor_readings (
    dryer_id, timestamp, chamber_temp, ambient_temp, heater_temp,
    internal_humidity, external_humidity, fan_speed_rpm, fan_status,
    heater_status, door_status, solar_voltage, battery_level,
    battery_voltage, power_consumption_w, charging_status, active_preset_id
) VALUES
    ('d1000000-0000-0000-0000-000000000001', NOW() - INTERVAL '4 hours', 44.5, 28.2, 65.3, 36.2, 52.1, 980, true, true, false, 18.5, 82, 13.1, 245.5, 'charging', 'b1000000-0000-0000-0000-000000000001'),
    ('d1000000-0000-0000-0000-000000000001', NOW() - INTERVAL '3 hours', 45.1, 28.5, 66.1, 35.8, 51.8, 1000, true, true, false, 19.2, 84, 13.2, 250.2, 'charging', 'b1000000-0000-0000-0000-000000000001'),
    ('d1000000-0000-0000-0000-000000000001', NOW() - INTERVAL '2 hours', 45.3, 29.1, 66.5, 35.2, 50.5, 1010, true, true, false, 19.8, 85, 13.3, 248.8, 'full', 'b1000000-0000-0000-0000-000000000001'),
    ('d1000000-0000-0000-0000-000000000001', NOW() - INTERVAL '1 hour', 44.8, 28.8, 65.8, 35.5, 51.2, 995, true, true, false, 18.9, 85, 13.2, 246.3, 'full', 'b1000000-0000-0000-0000-000000000001'),
    ('d1000000-0000-0000-0000-000000000001', NOW() - INTERVAL '30 minutes', 45.0, 28.6, 66.0, 35.3, 51.0, 1000, true, true, false, 18.2, 85, 13.2, 247.5, 'discharging', 'b1000000-0000-0000-0000-000000000001'),
    ('d1000000-0000-0000-0000-000000000001', NOW() - INTERVAL '15 minutes', 45.2, 28.4, 66.2, 35.0, 50.8, 1005, true, true, false, 17.8, 85, 13.2, 249.1, 'discharging', 'b1000000-0000-0000-0000-000000000001'),
    ('d1000000-0000-0000-0000-000000000001', NOW(), 45.1, 28.3, 66.0, 35.1, 50.9, 1000, true, true, false, 17.5, 85, 13.2, 248.0, 'discharging', 'b1000000-0000-0000-0000-000000000001'),

    -- Dryer 2 readings (active - Coffee drying)
    ('d1000000-0000-0000-0000-000000000002', NOW() - INTERVAL '4 hours', 34.2, 22.5, 48.5, 51.2, 65.3, 740, true, true, false, 19.5, 88, 13.5, 180.5, 'charging', 'b1000000-0000-0000-0000-000000000013'),
    ('d1000000-0000-0000-0000-000000000002', NOW() - INTERVAL '3 hours', 34.8, 22.8, 49.2, 50.5, 64.8, 755, true, true, false, 20.1, 90, 13.6, 185.2, 'charging', 'b1000000-0000-0000-0000-000000000013'),
    ('d1000000-0000-0000-0000-000000000002', NOW() - INTERVAL '2 hours', 35.1, 23.2, 49.8, 49.8, 64.2, 750, true, true, false, 20.5, 91, 13.7, 182.8, 'full', 'b1000000-0000-0000-0000-000000000013'),
    ('d1000000-0000-0000-0000-000000000002', NOW() - INTERVAL '1 hour', 35.0, 23.0, 49.5, 50.0, 64.5, 748, true, true, false, 19.8, 92, 13.8, 181.5, 'full', 'b1000000-0000-0000-0000-000000000013'),
    ('d1000000-0000-0000-0000-000000000002', NOW(), 35.2, 22.9, 49.6, 49.5, 64.0, 752, true, true, false, 19.2, 92, 13.8, 183.0, 'discharging', 'b1000000-0000-0000-0000-000000000013'),

    -- Dryer 3 readings (active - Rice drying, has warning)
    ('d1000000-0000-0000-0000-000000000003', NOW() - INTERVAL '4 hours', 42.5, 30.2, 58.5, 39.2, 68.5, 945, true, true, false, 18.2, 75, 12.8, 220.5, 'charging', 'b1000000-0000-0000-0000-000000000017'),
    ('d1000000-0000-0000-0000-000000000003', NOW() - INTERVAL '3 hours', 43.1, 30.8, 59.2, 38.5, 67.8, 960, true, true, false, 18.8, 76, 12.9, 225.2, 'charging', 'b1000000-0000-0000-0000-000000000017'),
    ('d1000000-0000-0000-0000-000000000003', NOW() - INTERVAL '2 hours', 48.5, 31.2, 68.5, 32.5, 66.2, 955, true, true, false, 19.2, 77, 12.9, 265.8, 'full', 'b1000000-0000-0000-0000-000000000017'),
    ('d1000000-0000-0000-0000-000000000003', NOW() - INTERVAL '1 hour', 49.2, 31.5, 70.2, 30.8, 65.8, 950, true, true, false, 18.5, 78, 12.9, 275.5, 'full', 'b1000000-0000-0000-0000-000000000017'),
    ('d1000000-0000-0000-0000-000000000003', NOW(), 48.8, 31.3, 69.5, 31.2, 66.0, 948, true, true, false, 18.0, 78, 12.9, 270.0, 'discharging', 'b1000000-0000-0000-0000-000000000017'),

    -- Dryer 4 readings (active - Chili drying)
    ('d1000000-0000-0000-0000-000000000004', NOW() - INTERVAL '2 hours', 47.5, 32.5, 62.5, 33.8, 72.5, 1080, true, true, false, 20.5, 86, 13.4, 260.5, 'charging', 'b1000000-0000-0000-0000-000000000006'),
    ('d1000000-0000-0000-0000-000000000004', NOW() - INTERVAL '1 hour', 48.2, 32.8, 63.2, 33.2, 71.8, 1095, true, true, false, 20.8, 87, 13.5, 265.2, 'full', 'b1000000-0000-0000-0000-000000000006'),
    ('d1000000-0000-0000-0000-000000000004', NOW(), 48.0, 32.6, 63.0, 33.5, 72.0, 1090, true, true, false, 20.2, 88, 13.5, 262.8, 'full', 'b1000000-0000-0000-0000-000000000006'),

    -- Dryer 5 readings (active - Maize drying, high performance)
    ('d1000000-0000-0000-0000-000000000005', NOW() - INTERVAL '3 hours', 44.8, 26.5, 64.8, 35.5, 48.5, 995, true, true, false, 21.5, 92, 13.9, 285.5, 'charging', 'b1000000-0000-0000-0000-000000000001'),
    ('d1000000-0000-0000-0000-000000000005', NOW() - INTERVAL '2 hours', 45.2, 26.8, 65.2, 35.0, 48.0, 1000, true, true, false, 22.0, 94, 14.0, 290.2, 'full', 'b1000000-0000-0000-0000-000000000001'),
    ('d1000000-0000-0000-0000-000000000005', NOW() - INTERVAL '1 hour', 45.0, 26.6, 65.0, 35.2, 48.2, 998, true, true, false, 21.8, 95, 14.1, 288.5, 'full', 'b1000000-0000-0000-0000-000000000001'),
    ('d1000000-0000-0000-0000-000000000005', NOW(), 45.1, 26.5, 65.1, 35.1, 48.1, 1000, true, true, false, 21.5, 95, 14.1, 289.0, 'full', 'b1000000-0000-0000-0000-000000000001'),

    -- Dryer 9 readings (offline - last readings before going offline)
    ('d1000000-0000-0000-0000-000000000009', NOW() - INTERVAL '6 hours', 43.5, 32.5, 58.5, 35.5, 58.5, 985, true, true, false, 15.5, 48, 11.9, 195.5, 'discharging', 'b1000000-0000-0000-0000-000000000019'),
    ('d1000000-0000-0000-0000-000000000009', NOW() - INTERVAL '6 hours 15 minutes', 42.8, 32.2, 57.8, 36.2, 59.2, 920, true, true, false, 14.8, 52, 12.0, 185.2, 'discharging', 'b1000000-0000-0000-0000-000000000019'),

    -- Dryer 10 readings (offline - critical battery)
    ('d1000000-0000-0000-0000-000000000010', NOW() - INTERVAL '12 hours', 36.5, 24.5, 48.5, 46.5, 62.5, 680, true, false, false, 12.5, 15, 10.8, 95.5, 'discharging', 'b1000000-0000-0000-0000-000000000011'),
    ('d1000000-0000-0000-0000-000000000010', NOW() - INTERVAL '12 hours 30 minutes', 35.2, 24.2, 46.2, 47.8, 63.8, 520, true, false, false, 11.2, 18, 10.9, 75.2, 'discharging', 'b1000000-0000-0000-0000-000000000011');

-- ===========================================
-- 6. ALERTS
-- ===========================================

INSERT INTO public.alerts (
    id, dryer_id, severity, status, type, message,
    threshold_value, current_value, notes
) VALUES
    -- Active alerts
    ('e1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000003', 'warning', 'active',
     'HIGH_TEMPERATURE', 'Chamber temperature exceeds optimal range for rice drying',
     47.00, 48.80, 'Temperature spike detected. Monitor closely.'),

    ('e1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000009', 'critical', 'active',
     'COMMUNICATION_LOST', 'Dryer has not communicated for over 6 hours',
     NULL, NULL, 'Last known location: Homa Bay. Technician dispatch recommended.'),

    ('e1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000009', 'warning', 'active',
     'LOW_BATTERY', 'Battery level critically low at 45%',
     50.00, 45.00, 'Solar panel may need cleaning or replacement.'),

    ('e1000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000010', 'critical', 'active',
     'BATTERY_CRITICAL', 'Battery level extremely low at 12%',
     20.00, 12.00, 'Immediate attention required. System may shut down.'),

    ('e1000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000010', 'critical', 'active',
     'COMMUNICATION_LOST', 'Dryer offline for 12+ hours',
     NULL, NULL, 'Battery depletion suspected.'),

    ('e1000000-0000-0000-0000-000000000006', 'd1000000-0000-0000-0000-000000000010', 'warning', 'active',
     'LOW_SIGNAL', 'No cellular signal detected',
     30.00, 0.00, 'Check antenna connection.'),

    ('e1000000-0000-0000-0000-000000000007', 'd1000000-0000-0000-0000-000000000011', 'info', 'active',
     'MAINTENANCE_MODE', 'Dryer is in scheduled maintenance',
     NULL, NULL, 'Quarterly maintenance in progress. Expected completion: 2 days.'),

    ('e1000000-0000-0000-0000-000000000008', 'd1000000-0000-0000-0000-000000000012', 'warning', 'active',
     'FAN_MALFUNCTION', 'Fan 1 not responding to commands',
     NULL, NULL, 'Fan motor may need replacement.'),

    ('e1000000-0000-0000-0000-000000000009', 'd1000000-0000-0000-0000-000000000012', 'info', 'active',
     'MAINTENANCE_MODE', 'Dryer undergoing repairs',
     NULL, NULL, 'Fan replacement scheduled.'),

    -- Acknowledged alerts
    ('e1000000-0000-0000-0000-000000000010', 'd1000000-0000-0000-0000-000000000001', 'warning', 'acknowledged',
     'HUMIDITY_VARIANCE', 'Internal humidity fluctuating outside normal range',
     5.00, 8.50, 'Acknowledged by technician. Monitoring situation.'),

    -- Resolved alerts
    ('e1000000-0000-0000-0000-000000000011', 'd1000000-0000-0000-0000-000000000002', 'warning', 'resolved',
     'HIGH_TEMPERATURE', 'Temperature spike during midday',
     40.00, 42.50, 'Resolved after preset adjustment.'),

    ('e1000000-0000-0000-0000-000000000012', 'd1000000-0000-0000-0000-000000000004', 'critical', 'resolved',
     'DOOR_OPEN', 'Drying chamber door detected open during operation',
     NULL, NULL, 'Door was properly closed. False positive due to sensor calibration.'),

    ('e1000000-0000-0000-0000-000000000013', 'd1000000-0000-0000-0000-000000000005', 'info', 'resolved',
     'PRESET_CHANGED', 'Drying preset was changed remotely',
     NULL, NULL, 'Changed from PRESET-002 to PRESET-001 by operator.'),

    ('e1000000-0000-0000-0000-000000000014', 'd1000000-0000-0000-0000-000000000006', 'warning', 'resolved',
     'LOW_BATTERY', 'Battery dropped below 30%',
     30.00, 28.00, 'Battery recharged during sunny period.'),

    -- Dismissed alerts
    ('e1000000-0000-0000-0000-000000000015', 'd1000000-0000-0000-0000-000000000007', 'info', 'dismissed',
     'CYCLE_COMPLETE', 'Drying cycle completed successfully',
     NULL, NULL, 'User dismissed after reviewing.'),

    ('e1000000-0000-0000-0000-000000000016', 'd1000000-0000-0000-0000-000000000008', 'info', 'dismissed',
     'SYSTEM_UPDATE', 'Firmware update available',
     NULL, NULL, 'Update postponed to next maintenance window.');

-- Update resolved_at for resolved alerts
UPDATE public.alerts
SET resolved_at = created_at + INTERVAL '2 hours'
WHERE status = 'resolved';

-- Update acknowledged_at for acknowledged alerts
UPDATE public.alerts
SET acknowledged_at = created_at + INTERVAL '30 minutes'
WHERE status = 'acknowledged';

-- ===========================================
-- SUMMARY
-- ===========================================

SELECT 'Seed data inserted successfully!' AS message;

SELECT
    'regions' AS table_name, COUNT(*) AS row_count FROM public.regions
UNION ALL
SELECT
    'presets', COUNT(*) FROM public.presets
UNION ALL
SELECT
    'dryer_owners', COUNT(*) FROM public.dryer_owners
UNION ALL
SELECT
    'dryers', COUNT(*) FROM public.dryers
UNION ALL
SELECT
    'sensor_readings', COUNT(*) FROM public.sensor_readings
UNION ALL
SELECT
    'alerts', COUNT(*) FROM public.alerts
ORDER BY table_name;
