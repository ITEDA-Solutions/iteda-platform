# RBAC System Setup Guide

This guide walks you through implementing the complete Role-Based Access Control (RBAC) system for the iTeda Solutions Platform.

---

## 🎯 Quick Start

### 1. Verify Database Schema

The RBAC tables should already be created through Supabase migrations. Verify by running:

```bash
npm run test:rbac
```

If tables are missing, apply the migrations:

```bash
# Using Supabase CLI
supabase db push

# Or manually run the migration
psql -U your_user -d your_database -f supabase/migrations/20240128_rbac_system.sql
```

---

## 👤 Creating Your First Super Admin

### Step 1: Create a User Account

Sign up through your application's registration page or API:

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@itedasolutions.com",
    "password": "YourSecurePassword123!",
    "fullName": "System Administrator"
  }'
```

### Step 2: Get the User ID

```sql
-- Connect to your database
SELECT id, email FROM profiles WHERE email = 'admin@itedasolutions.com';
```

### Step 3: Assign Super Admin Role

```sql
INSERT INTO staff_roles (staff_id, role)
VALUES ('user-uuid-from-step-2', 'super_admin');
```

### Step 4: Verify

```bash
npm run test:rbac
```

You should see "✅ super_admin: 1 users"

---

## 🗺️ Setting Up Regions

### Create Regions

```sql
-- Create regions for your organization
INSERT INTO regions (name, code) VALUES
  ('Northern Region', 'NORTH'),
  ('Southern Region', 'SOUTH'),
  ('Eastern Region', 'EAST'),
  ('Western Region', 'WEST'),
  ('Central Region', 'CENTRAL');
```

### Or Use the API (Super Admin Required)

```bash
curl -X POST http://localhost:3000/api/regions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Northern Region",
    "code": "NORTH"
  }'
```

---

## 👥 Creating Users with Different Roles

### Super Admin Creates an Admin

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SUPER_ADMIN_JWT_TOKEN" \
  -d '{
    "email": "admin@company.com",
    "password": "SecurePassword123!",
    "fullName": "John Admin",
    "phone": "+1234567890",
    "role": "admin"
  }'
```

### Super Admin Creates a Regional Manager

```bash
# First, get the region ID
curl -X GET http://localhost:3000/api/regions \
  -H "Authorization: Bearer SUPER_ADMIN_JWT_TOKEN"

# Then create the regional manager
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SUPER_ADMIN_JWT_TOKEN" \
  -d '{
    "email": "manager@company.com",
    "password": "SecurePassword123!",
    "fullName": "Jane Manager",
    "phone": "+1234567890",
    "role": "regional_manager",
    "region": "REGION_UUID_FROM_ABOVE"
  }'
```

### Super Admin Creates a Field Technician

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SUPER_ADMIN_JWT_TOKEN" \
  -d '{
    "email": "technician@company.com",
    "password": "SecurePassword123!",
    "fullName": "Bob Technician",
    "phone": "+1234567890",
    "role": "field_technician"
  }'
```

---

## 🔧 Assigning Dryers to Field Technicians

### List Available Dryers

```bash
curl -X GET http://localhost:3000/api/dryers \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

### Create Dryer Assignment

```bash
curl -X POST http://localhost:3000/api/dryer-assignments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -d '{
    "technicianId": "TECHNICIAN_UUID",
    "dryerId": "DRYER_UUID",
    "notes": "Primary technician for Northern region"
  }'
```

### View All Assignments

```bash
curl -X GET http://localhost:3000/api/dryer-assignments \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

---

## 🧪 Testing the RBAC System

### Run Automated Tests

```bash
npm run test:rbac
```

This will check:
- ✅ All required tables exist
- ✅ User roles are properly assigned
- ✅ Regions are configured
- ✅ Dryer assignments are set up
- ✅ Regional managers have assigned regions
- ✅ Field technicians have dryer assignments

### Manual Testing

#### Test Super Admin Access

```bash
# Sign in as super admin
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@company.com",
    "password": "YourPassword"
  }'

# Try to create a user (should succeed)
curl -X POST http://localhost:3000/api/users \
  -H "Authorization: Bearer SUPER_ADMIN_TOKEN" \
  -d '{"email": "test@company.com", "password": "Pass123!", "role": "admin"}'
```

#### Test Admin Access

```bash
# Sign in as admin
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin-user@company.com",
    "password": "YourPassword"
  }'

# Try to create a user (should fail with 403)
curl -X POST http://localhost:3000/api/users \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{"email": "test@company.com", "password": "Pass123!", "role": "admin"}'

# Try to view dryers (should succeed)
curl -X GET http://localhost:3000/api/dryers \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Try to export data (should succeed)
curl -X GET "http://localhost:3000/api/export/sensor-data?dryer_id=DRY001" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

#### Test Regional Manager Access

```bash
# Sign in as regional manager
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "manager@company.com",
    "password": "YourPassword"
  }'

# View dryers (should only show regional dryers)
curl -X GET http://localhost:3000/api/dryers \
  -H "Authorization: Bearer REGIONAL_MANAGER_TOKEN"

# Try to export data (should fail with 403)
curl -X GET "http://localhost:3000/api/export/sensor-data?dryer_id=DRY001" \
  -H "Authorization: Bearer REGIONAL_MANAGER_TOKEN"
```

#### Test Field Technician Access

```bash
# Sign in as field technician
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "technician@company.com",
    "password": "YourPassword"
  }'

# View dryers (should only show assigned dryers)
curl -X GET http://localhost:3000/api/dryers \
  -H "Authorization: Bearer TECHNICIAN_TOKEN"

# Try to export data (should fail with 403)
curl -X GET "http://localhost:3000/api/export/sensor-data?dryer_id=DRY001" \
  -H "Authorization: Bearer TECHNICIAN_TOKEN"

# Update dryer location (should succeed)
curl -X PUT http://localhost:3000/api/dryers/DRYER_UUID \
  -H "Authorization: Bearer TECHNICIAN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "locationLatitude": 1.2345,
    "locationLongitude": 36.7890,
    "locationAddress": "123 Main St"
  }'

# Try to update dryer status (should fail with 403)
curl -X PUT http://localhost:3000/api/dryers/DRYER_UUID \
  -H "Authorization: Bearer TECHNICIAN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "active"
  }'
```

---

## 🖥️ Frontend Implementation

### Update Your Dashboard Pages

All dashboard pages should already use the permission system. Example:

```typescript
// app/dashboard/users/page.tsx
import { PermissionGuard } from '@/components/PermissionGuard';

export default function UsersPage() {
  return (
    <PermissionGuard 
      allowedRoles={['super_admin']} 
      showError={true}
    >
      <UserManagementContent />
    </PermissionGuard>
  );
}
```

### Update Navigation

```typescript
// src/components/AppSidebar.tsx
import { usePermissions } from '@/hooks/usePermissions';

export function AppSidebar() {
  const { canManageUsers, canExportData, isFieldTechnician } = usePermissions();

  return (
    <nav>
      {canManageUsers && (
        <NavLink href="/dashboard/users">User Management</NavLink>
      )}
      
      {!isFieldTechnician && (
        <NavLink href="/dashboard/analytics">Analytics</NavLink>
      )}
      
      {canExportData && (
        <NavLink href="/dashboard/export">Export Data</NavLink>
      )}
    </nav>
  );
}
```

---

## 📊 Monitoring & Maintenance

### Check System Status

```bash
# Run RBAC tests periodically
npm run test:rbac

# Check users without roles
psql -U your_user -d your_database -c "
  SELECT p.email, p.full_name 
  FROM profiles p 
  LEFT JOIN staff_roles sr ON p.id = sr.staff_id 
  WHERE sr.staff_id IS NULL;
"

# Check regional managers without regions
psql -U your_user -d your_database -c "
  SELECT p.email, sr.role, sr.region 
  FROM staff_roles sr 
  JOIN profiles p ON sr.staff_id = p.id 
  WHERE sr.role = 'regional_manager' AND sr.region IS NULL;
"

# Check field technicians without assignments
psql -U your_user -d your_database -c "
  SELECT p.email, COUNT(da.id) as assignments 
  FROM staff_roles sr 
  JOIN profiles p ON sr.staff_id = p.id 
  LEFT JOIN dryer_assignments da ON p.id = da.technician_id 
  WHERE sr.role = 'field_technician' 
  GROUP BY p.email 
  HAVING COUNT(da.id) = 0;
"
```

### Common Issues

#### Issue: User Can't Access Any Dryers

**Solution:**
```sql
-- Check if user has a role
SELECT * FROM staff_roles WHERE staff_id = 'USER_UUID';

-- If field technician, check assignments
SELECT * FROM dryer_assignments WHERE technician_id = 'USER_UUID';

-- If regional manager, check region assignment
SELECT * FROM staff_roles WHERE staff_id = 'USER_UUID' AND region IS NOT NULL;
```

#### Issue: Regional Manager Sees All Dryers

**Solution:**
```sql
-- Verify region is assigned
UPDATE staff_roles 
SET region = 'CORRECT_REGION_UUID' 
WHERE staff_id = 'USER_UUID' AND role = 'regional_manager';
```

#### Issue: Can't Export Data

**Solution:**
- Check role: Only Super Admin, Admin, and Regional Manager can export
- Field Technicians cannot export data by design

---

## 🔄 Migration from Old System

If you have existing users without roles:

```sql
-- Assign default role to all users without roles
INSERT INTO staff_roles (staff_id, role)
SELECT id, 'field_technician' 
FROM profiles 
WHERE id NOT IN (SELECT staff_id FROM staff_roles);

-- Or assign specific roles based on criteria
-- Example: Assign admin role to users with specific email domain
INSERT INTO staff_roles (staff_id, role)
SELECT id, 'admin' 
FROM profiles 
WHERE email LIKE '%@admin.company.com' 
AND id NOT IN (SELECT staff_id FROM staff_roles);
```

---

## 📚 Additional Resources

- **Complete Documentation**: `developer/RBAC_USER_ROLES.md`
- **Permission Definitions**: `src/lib/permissions.ts`
- **API Middleware**: `src/lib/rbac-middleware.ts`
- **Frontend Hooks**: `src/hooks/usePermissions.tsx`
- **Database Migration**: `supabase/migrations/20240128_rbac_system.sql`

---

## ✅ Setup Checklist

Use this checklist to ensure everything is configured:

- [ ] Database tables created (run `npm run test:rbac`)
- [ ] At least one super admin created
- [ ] Regions defined (if using regional managers)
- [ ] All users have assigned roles
- [ ] Regional managers have assigned regions
- [ ] Field technicians have dryer assignments
- [ ] API endpoints return correct filtered data
- [ ] Frontend shows/hides features based on roles
- [ ] Export functionality restricted to appropriate roles
- [ ] User management restricted to super admins

---

**Need Help?**

Check the complete documentation in `developer/RBAC_USER_ROLES.md` or run `npm run test:rbac` to diagnose issues.
