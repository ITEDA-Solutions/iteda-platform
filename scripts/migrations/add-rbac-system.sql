-- Migration: Add comprehensive RBAC system
-- Description: Adds dryer assignments table and ensures proper role-based access control

-- Create dryer_assignments table if it doesn't exist
CREATE TABLE IF NOT EXISTS dryer_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  dryer_id UUID NOT NULL REFERENCES dryers(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP NOT NULL DEFAULT NOW(),
  assigned_by UUID REFERENCES profiles(id),
  notes TEXT,
  CONSTRAINT unique_technician_dryer UNIQUE (technician_id, dryer_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_assignments_technician ON dryer_assignments(technician_id);
CREATE INDEX IF NOT EXISTS idx_assignments_dryer ON dryer_assignments(dryer_id);

-- Ensure staff_roles table has proper constraints
-- Note: This assumes the table already exists from previous migrations
ALTER TABLE staff_roles 
  ADD COLUMN IF NOT EXISTS region TEXT;

-- Add comments for documentation
COMMENT ON TABLE dryer_assignments IS 'Tracks which dryers are assigned to which field technicians';
COMMENT ON COLUMN dryer_assignments.technician_id IS 'Field technician who is assigned to the dryer';
COMMENT ON COLUMN dryer_assignments.dryer_id IS 'Dryer that is assigned to the technician';
COMMENT ON COLUMN dryer_assignments.assigned_by IS 'Admin or super admin who made the assignment';

-- Create a view for easy access to technician assignments with dryer details
CREATE OR REPLACE VIEW technician_dryer_assignments AS
SELECT 
  da.id AS assignment_id,
  da.technician_id,
  p.full_name AS technician_name,
  p.email AS technician_email,
  da.dryer_id,
  d.dryer_id AS dryer_identifier,
  d.serial_number,
  d.status AS dryer_status,
  d.location_address,
  r.name AS region_name,
  da.assigned_at,
  da.notes,
  assigner.full_name AS assigned_by_name
FROM dryer_assignments da
JOIN profiles p ON da.technician_id = p.id
JOIN dryers d ON da.dryer_id = d.id
LEFT JOIN regions r ON d.region_id = r.id
LEFT JOIN profiles assigner ON da.assigned_by = assigner.id;

-- Grant appropriate permissions (adjust based on your database user setup)
-- GRANT SELECT ON technician_dryer_assignments TO authenticated;
-- GRANT ALL ON dryer_assignments TO authenticated;

-- Insert sample data for testing (optional - comment out in production)
-- This creates a test super admin if it doesn't exist
-- DO $$
-- DECLARE
--   test_user_id UUID;
-- BEGIN
--   -- Check if test super admin exists
--   SELECT id INTO test_user_id FROM staff WHERE email = 'admin@iteda.com' LIMIT 1;
--   
--   IF test_user_id IS NULL THEN
--     -- Create test super admin
--     INSERT INTO staff (email, password) 
--     VALUES ('admin@iteda.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqNqNqNqNq')
--     RETURNING id INTO test_user_id;
--     
--     INSERT INTO profiles (id, email, full_name)
--     VALUES (test_user_id, 'admin@iteda.com', 'Super Admin');
--     
--     INSERT INTO staff_roles (staff_id, role)
--     VALUES (test_user_id, 'super_admin');
--   END IF;
-- END $$;

-- Migration complete
SELECT 'RBAC system migration completed successfully' AS status;
