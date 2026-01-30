# Supabase RBAC Setup Guide

## ✅ System Migrated to Supabase Authentication

Your ITEDA Platform now uses **Supabase authentication** with the complete RBAC (Role-Based Access Control) system integrated.

---

## 🎯 What Changed

### **Authentication System**
- ✅ **Switched from local JWT** to **Supabase Auth**
- ✅ Auth page uses `supabase.auth.signInWithPassword()`
- ✅ ProtectedRoute uses Supabase session management
- ✅ Layout component uses Supabase sign out
- ✅ usePermissions hook fetches roles from Supabase tables

### **RBAC Integration**
- ✅ All 4 roles maintained (Super Admin, Admin, Regional Manager, Field Technician)
- ✅ Permissions system unchanged
- ✅ Role-based UI filtering still works
- ✅ Regional and dryer assignment filtering intact

---

## 🚀 Setup Instructions

### **Step 1: Run Supabase Migration**

You need to run the migration in your Supabase project:

1. **Go to your Supabase Dashboard**: https://app.supabase.com
2. **Select your project**: `zrjyzznkjjbysertiery`
3. **Navigate to**: SQL Editor
4. **Copy and paste** the contents of: `supabase/migrations/20240128_rbac_system.sql`
5. **Click "Run"**

This will create:
- `profiles` table
- `staff_roles` table
- `regions` table
- `dryers` table
- `dryer_assignments` table
- Row Level Security (RLS) policies
- Automatic profile creation trigger

### **Step 2: Create Your First Super Admin**

After running the migration, create your super admin account:

```sql
-- In Supabase SQL Editor

-- 1. First, sign up through the app to create the auth user
-- 2. Then run this to assign super admin role:

INSERT INTO public.staff_roles (staff_id, role, region)
SELECT id, 'super_admin', 'Nairobi'
FROM public.profiles
WHERE email = 'your-email@example.com';
```

### **Step 3: Migrate Existing Users (Optional)**

If you want to migrate your existing local database users to Supabase:

```sql
-- This needs to be done manually for each user
-- You'll need to:
-- 1. Create auth user in Supabase (they sign up)
-- 2. Assign their role in staff_roles table
```

---

## 📊 Database Schema

### **Tables Created**

#### **1. profiles**
Extends Supabase `auth.users` with additional fields:
```sql
- id (UUID, references auth.users)
- email (TEXT)
- full_name (TEXT)
- phone (TEXT)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

#### **2. staff_roles**
Stores user roles for RBAC:
```sql
- id (UUID)
- staff_id (UUID, references profiles)
- role (app_role ENUM)
- region (TEXT)
- created_at (TIMESTAMPTZ)
```

#### **3. regions**
Stores available regions:
```sql
- id (UUID)
- name (TEXT)
- code (TEXT)
- created_at (TIMESTAMPTZ)
```

#### **4. dryers**
Stores dryer information:
```sql
- id (UUID)
- dryer_id (TEXT)
- serial_number (TEXT)
- status (TEXT)
- region_id (UUID, references regions)
- ... (other fields)
```

#### **5. dryer_assignments**
Tracks field technician assignments:
```sql
- id (UUID)
- technician_id (UUID, references profiles)
- dryer_id (UUID, references dryers)
- assigned_at (TIMESTAMPTZ)
- assigned_by (UUID)
- notes (TEXT)
```

---

## 🔒 Row Level Security (RLS) Policies

### **Profiles**
- ✅ Users can view/update their own profile
- ✅ Super admins can view all profiles

### **Staff Roles**
- ✅ Users can view their own role
- ✅ Super admins can manage all roles

### **Dryers**
- ✅ Super admins & admins can view all dryers
- ✅ Regional managers can view dryers in their region
- ✅ Field technicians can view assigned dryers only
- ✅ Super admins can manage all dryers

### **Dryer Assignments**
- ✅ Users can view their own assignments
- ✅ Admins can view and manage all assignments

---

## 🎨 How It Works Now

### **User Sign Up Flow**
```
1. User signs up via Supabase Auth
2. Trigger automatically creates profile
3. Super admin assigns role in staff_roles table
4. User can now sign in with role-based access
```

### **Authentication Flow**
```
1. User signs in → Supabase creates session
2. Frontend fetches user role from staff_roles
3. usePermissions hook provides role-based permissions
4. UI components filter based on role
5. RLS policies enforce data access
```

### **Permission Checking**
```typescript
// In any component
import { usePermissions } from '@/hooks/usePermissions';

function MyComponent() {
  const { 
    role,
    isSuperAdmin,
    canManageUsers,
    canExportData 
  } = usePermissions();

  return (
    <div>
      {isSuperAdmin && <AdminPanel />}
      {canExportData && <ExportButton />}
    </div>
  );
}
```

---

## 📝 Creating Users

### **Method 1: Through the App**
1. User signs up at `/auth`
2. Super admin assigns role in Supabase dashboard:
```sql
INSERT INTO staff_roles (staff_id, role, region)
VALUES ('user-uuid', 'admin', 'Central');
```

### **Method 2: Supabase Dashboard**
1. Go to Authentication → Users
2. Click "Add user"
3. Enter email and password
4. Then assign role in SQL Editor:
```sql
INSERT INTO staff_roles (staff_id, role)
SELECT id, 'super_admin'
FROM profiles
WHERE email = 'new-user@example.com';
```

---

## 🧪 Testing

### **Test Each Role:**

1. **Super Admin**
   - Sign in with super admin account
   - Should see all menu items
   - Can access Staff page
   - Can manage users

2. **Admin**
   - Sign in with admin account
   - Should see most features
   - Cannot see Staff menu
   - Cannot manage users

3. **Regional Manager**
   - Sign in with regional manager account
   - Should see limited menu
   - Only sees dryers in assigned region

4. **Field Technician**
   - Sign in with field technician account
   - Should see minimal menu
   - Only sees assigned dryers

---

## 🔄 Syncing Local Users to Supabase

If you have existing users in your local PostgreSQL database, you'll need to:

1. **Export user emails** from local database
2. **Create auth users** in Supabase (they need to sign up or you create them)
3. **Assign roles** using SQL:

```sql
-- For each user
INSERT INTO staff_roles (staff_id, role, region)
SELECT id, 'their_role', 'their_region'
FROM profiles
WHERE email = 'user@example.com';
```

---

## ⚙️ Environment Variables

Make sure your `.env` file has Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_PROJECT_ID="zrjyzznkjjbysertiery"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="your-anon-key"
NEXT_PUBLIC_SUPABASE_URL="https://zrjyzznkjjbysertiery.supabase.co"
```

---

## 🎯 Key Differences from Local Auth

| Feature | Local JWT | Supabase Auth |
|---------|-----------|---------------|
| User Storage | PostgreSQL | Supabase Auth |
| Session Management | localStorage token | Supabase session |
| Password Reset | Manual | Built-in |
| Email Verification | Manual | Built-in |
| OAuth | Not supported | Supported |
| Security | Manual | Managed by Supabase |

---

## 📚 Additional Resources

- **Supabase Auth Docs**: https://supabase.com/docs/guides/auth
- **Row Level Security**: https://supabase.com/docs/guides/auth/row-level-security
- **Supabase Dashboard**: https://app.supabase.com/project/zrjyzznkjjbysertiery

---

## 🚨 Important Notes

1. **RLS is Enabled**: All tables have Row Level Security enabled
2. **Policies Enforce Access**: Even if frontend allows, RLS blocks unauthorized access
3. **Profiles Auto-Created**: When user signs up, profile is automatically created
4. **Roles Must Be Assigned**: New users won't have roles until super admin assigns them
5. **Region Required**: Regional managers must have a region assigned

---

## ✅ Migration Checklist

- [ ] Run Supabase migration SQL
- [ ] Create first super admin account
- [ ] Test sign in/sign out
- [ ] Verify role-based menu filtering
- [ ] Test RLS policies
- [ ] Migrate existing users (if needed)
- [ ] Assign roles to all users
- [ ] Test each role's permissions
- [ ] Verify regional filtering
- [ ] Test dryer assignments

---

## 🎉 You're All Set!

Your ITEDA Platform now uses Supabase authentication with full RBAC support. The system maintains all the role-based features while leveraging Supabase's robust authentication infrastructure.

**Next Steps:**
1. Run the migration in Supabase
2. Create your super admin account
3. Start using the platform with Supabase auth!
