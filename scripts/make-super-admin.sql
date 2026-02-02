-- Script to make estherzawadi887@gmail.com a Super Admin
-- Run this in your Supabase SQL Editor

-- First, check if the user exists in auth.users
-- If not, they need to sign up first through the app

-- Find the user ID
DO $$
DECLARE
  user_uuid UUID;
BEGIN
  -- Get the user ID from auth.users based on email
  SELECT id INTO user_uuid
  FROM auth.users
  WHERE email = 'estherzawadi887@gmail.com';

  -- Check if user exists
  IF user_uuid IS NULL THEN
    RAISE NOTICE 'User with email estherzawadi887@gmail.com not found in auth.users';
    RAISE NOTICE 'Please sign up through the app first, then run this script again';
  ELSE
    RAISE NOTICE 'Found user with ID: %', user_uuid;
    
    -- Check if user already has a role
    IF EXISTS (SELECT 1 FROM user_roles WHERE user_id = user_uuid) THEN
      -- Update existing role to super_admin
      UPDATE user_roles
      SET role = 'super_admin',
          region = NULL,
          updated_at = NOW()
      WHERE user_id = user_uuid;
      
      RAISE NOTICE 'Updated existing role to super_admin for user: %', user_uuid;
    ELSE
      -- Insert new role record
      INSERT INTO user_roles (user_id, role, region)
      VALUES (user_uuid, 'super_admin', NULL);
      
      RAISE NOTICE 'Created new super_admin role for user: %', user_uuid;
    END IF;

    -- Also ensure user has a profile
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = user_uuid) THEN
      INSERT INTO profiles (id, email, full_name)
      VALUES (
        user_uuid,
        'estherzawadi887@gmail.com',
        'Esther Zawadi'
      );
      
      RAISE NOTICE 'Created profile for user: %', user_uuid;
    END IF;

    RAISE NOTICE 'SUCCESS: User estherzawadi887@gmail.com is now a Super Admin!';
  END IF;
END $$;

-- Verify the role assignment
SELECT 
  u.email,
  ur.role,
  ur.region,
  ur.created_at,
  ur.updated_at
FROM auth.users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE u.email = 'estherzawadi887@gmail.com';
