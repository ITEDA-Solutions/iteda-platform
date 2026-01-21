-- ============================================================================
-- Migration: Rename Users→Staff and Owners→Farmers
-- Description: This migration renames tables and columns to use new terminology
-- Date: 2026-01-17
-- WARNING: This is a breaking change! Backup your database before running!
-- ============================================================================

BEGIN;

-- Step 1: Rename the 'users' table to 'staff'
ALTER TABLE IF EXISTS users RENAME TO staff;

-- Step 2: Rename the 'user_roles' table to 'staff_roles'
ALTER TABLE IF EXISTS user_roles RENAME TO staff_roles;

-- Step 3: Rename the 'dryer_owners' table to 'farmers'
ALTER TABLE IF EXISTS dryer_owners RENAME TO farmers;

-- Step 4: Rename column in staff_roles table
ALTER TABLE IF EXISTS staff_roles RENAME COLUMN user_id TO staff_id;

-- Step 5: Rename column in dryers table
ALTER TABLE IF EXISTS dryers RENAME COLUMN owner_id TO farmer_id;

-- Step 6: Rename unique index constraint
ALTER INDEX IF EXISTS unique_user_role RENAME TO unique_staff_role;

-- Step 7: Update foreign key references (if needed by your constraints)
-- Note: PostgreSQL automatically updates FK references when tables are renamed

COMMIT;

-- ============================================================================
-- Verification Queries
-- ============================================================================
-- Run these after migration to verify success:

-- Check renamed tables exist
-- SELECT tablename FROM pg_tables WHERE tablename IN ('staff', 'staff_roles', 'farmers');

-- Check columns were renamed
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'staff_roles' AND column_name = 'staff_id';
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'dryers' AND column_name = 'farmer_id';

-- ============================================================================
-- Rollback Script (in case you need to revert)
-- ============================================================================
-- BEGIN;
-- ALTER TABLE IF EXISTS staff RENAME TO users;
-- ALTER TABLE IF EXISTS staff_roles RENAME TO user_roles;
-- ALTER TABLE IF EXISTS farmers RENAME TO dryer_owners;
-- ALTER TABLE IF EXISTS staff_roles RENAME COLUMN staff_id TO user_id;
-- ALTER TABLE IF EXISTS dryers RENAME COLUMN farmer_id TO owner_id;
-- ALTER INDEX IF EXISTS unique_staff_role RENAME TO unique_user_role;
-- COMMIT;
