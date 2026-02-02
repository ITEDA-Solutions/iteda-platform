-- Script to verify staff_roles table exists and has correct structure
-- Run this in Supabase SQL Editor

-- Check if table exists
SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'staff_roles';

-- Check table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'staff_roles'
ORDER BY ordinal_position;

-- Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'staff_roles';

-- Check if you have any staff roles assigned
SELECT 
    sr.id,
    sr.staff_id,
    sr.role,
    sr.region,
    p.email,
    p.full_name
FROM staff_roles sr
LEFT JOIN profiles p ON p.id = sr.staff_id
ORDER BY sr.created_at DESC;

-- If no results above, you need to assign yourself a role
-- Uncomment and run this (replace with your email):
/*
DO $$
DECLARE
  user_uuid UUID;
BEGIN
  SELECT id INTO user_uuid
  FROM auth.users
  WHERE email = 'estherzawadi887@gmail.com';

  IF user_uuid IS NOT NULL THEN
    INSERT INTO staff_roles (staff_id, role)
    VALUES (user_uuid, 'super_admin')
    ON CONFLICT (staff_id, role) DO NOTHING;
    
    RAISE NOTICE 'Super admin role assigned to user: %', user_uuid;
  ELSE
    RAISE NOTICE 'User not found. Please sign up first.';
  END IF;
END $$;
*/
