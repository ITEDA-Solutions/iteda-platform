-- Fix RLS policy for staff_roles table
-- This ensures users can read their own role even if they don't have super_admin yet

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can view their own role" ON public.staff_roles;

-- Recreate the policy with proper permissions
CREATE POLICY "Users can view their own role"
    ON public.staff_roles 
    FOR SELECT
    TO authenticated
    USING (auth.uid() = staff_id);

-- Verify the policy was created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'staff_roles'
AND policyname = 'Users can view their own role';

-- Test query (should return your role)
SELECT 
    sr.role,
    sr.region,
    p.email
FROM staff_roles sr
JOIN profiles p ON p.id = sr.staff_id
WHERE sr.staff_id = auth.uid();
