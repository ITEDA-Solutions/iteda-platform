# Setup Super Admin - Step by Step Guide

## Making estherzawadi887@gmail.com a Super Admin

### Option 1: Using Supabase SQL Editor (Recommended)

1. **Go to your Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Select your project: `srwhtmefvsuzzoxhdpes`

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run the Super Admin Script**
   - Copy the contents of `scripts/make-super-admin.sql`
   - Paste into the SQL editor
   - Click "Run" or press Ctrl+Enter

4. **Verify Success**
   - You should see messages like:
     - "Found user with ID: [uuid]"
     - "Updated existing role to super_admin" OR "Created new super_admin role"
     - "SUCCESS: User estherzawadi887@gmail.com is now a Super Admin!"
   - The final SELECT query will show your role as 'super_admin'

### Option 2: Manual Steps in Supabase Dashboard

If the script doesn't work, follow these manual steps:

1. **Find Your User ID**
   - Go to "Authentication" → "Users" in Supabase Dashboard
   - Find user: estherzawadi887@gmail.com
   - Copy the User ID (UUID)

2. **Check user_roles Table**
   - Go to "Table Editor" → "user_roles"
   - Search for your User ID

3. **Add/Update Role**
   
   **If you DON'T have a record:**
   - Click "Insert" → "Insert row"
   - Fill in:
     - `user_id`: [Your User ID]
     - `role`: super_admin
     - `region`: NULL
   - Click "Save"

   **If you HAVE a record:**
   - Click on your row
   - Change `role` to: super_admin
   - Set `region` to: NULL
   - Click "Save"

4. **Verify Profile Exists**
   - Go to "Table Editor" → "profiles"
   - Search for your User ID
   - If not found, create one:
     - `id`: [Your User ID]
     - `email`: estherzawadi887@gmail.com
     - `full_name`: Esther Zawadi

### Option 3: Using API Endpoint (If you have access)

Create an API endpoint to assign roles (Super Admin only):

```bash
curl -X POST http://localhost:3000/api/admin/assign-role \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -d '{
    "email": "estherzawadi887@gmail.com",
    "role": "super_admin"
  }'
```

---

## Verifying Your Super Admin Access

After setting up your role, verify it works:

### 1. Sign Out and Sign In
- Go to: http://localhost:3000/auth
- Sign out if already logged in
- Sign in with: estherzawadi887@gmail.com

### 2. Check Your Role Badge
- After login, look at the top-right corner
- You should see a red badge: "Super Admin"

### 3. Check Navigation Access
You should now see ALL menu items:
- ✅ Dashboard
- ✅ Dryers
- ✅ Alerts
- ✅ Analytics
- ✅ **Staff** (Super Admin only)
- ✅ **Presets** (Super Admin & Admin)

### 4. Test Permissions

**Super Admin Capabilities:**
- ✅ View Staff Management page (`/dashboard/staff`)
- ✅ View all users and their roles
- ✅ Access to all dryers (no regional restrictions)
- ✅ Access to all data and reports
- ✅ Can export data (CSV/PDF when implemented)
- ✅ Can manage presets (when CRUD UI is implemented)
- ✅ Can configure system settings (when implemented)

---

## Current Role Permissions Matrix

### Super Admin (You)
- ✅ Full system access
- ✅ User management (view all users)
- ✅ Role assignment capability
- ✅ System configuration access
- ✅ View all dryers and data
- ✅ Manage presets
- ✅ Export all data
- ✅ Access Staff page
- ✅ Access all dashboards

### Admin
- ✅ View all dryers
- ✅ Manage dryer information
- ✅ View all reports and dashboards
- ✅ Export data
- ✅ Manage alerts configuration
- ❌ Cannot manage users
- ❌ Cannot access Staff page

### Regional Manager
- ✅ View dryers in assigned region only
- ✅ View reports for assigned dryers
- ✅ Update dryer status
- ✅ Acknowledge alerts
- ⚠️ Limited data export
- ❌ Cannot manage users
- ❌ Cannot access Staff page

### Field Technician
- ✅ View assigned dryers only
- ✅ Update basic dryer information
- ✅ View real-time data
- ✅ Update dryer location/owner info
- ❌ Cannot export data
- ❌ Cannot manage users
- ❌ Cannot access Staff page
- ❌ Cannot access Analytics

---

## Troubleshooting

### Issue: "Access Denied" after setting role

**Solution:**
1. Clear browser cache and cookies
2. Sign out completely
3. Close browser
4. Open browser and sign in again

### Issue: Role badge not showing

**Solution:**
1. Check browser console for errors (F12)
2. Verify role in Supabase:
   ```sql
   SELECT * FROM user_roles WHERE user_id = 'YOUR_USER_ID';
   ```
3. Ensure `usePermissions` hook is working:
   - Check Network tab for API calls
   - Look for errors in console

### Issue: User not found in auth.users

**Solution:**
1. Sign up through the app first: http://localhost:3000/auth
2. Use email: estherzawadi887@gmail.com
3. Complete email verification if required
4. Then run the super admin script

### Issue: Staff page shows "Access Denied"

**Solution:**
1. Verify role is exactly 'super_admin' (not 'Super Admin' or 'superadmin')
2. Check `user_roles` table in Supabase
3. Ensure no typos in email address
4. Clear session and re-login

---

## Database Schema Reference

### user_roles Table Structure
```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'admin', 'regional_manager', 'field_technician')),
  region VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);
```

### Valid Role Values
- `super_admin` - Full system access
- `admin` - Manage dryers and data, no user management
- `regional_manager` - Region-specific access
- `field_technician` - Assigned dryers only

---

## Testing Your Permissions

### Test 1: Access Staff Page
1. Navigate to: http://localhost:3000/dashboard/staff
2. You should see the Staff Management page
3. You should see all users and their roles

### Test 2: Check Navigation
1. Look at the sidebar
2. You should see the "Staff" menu item
3. Click it - should work without errors

### Test 3: View All Dryers
1. Navigate to: http://localhost:3000/dashboard/dryers
2. You should see all 23 dryers
3. No regional filtering applied

### Test 4: Check Role Badge
1. Look at top-right corner of dashboard
2. Should show: "Super Admin" in red badge
3. Should show your email: estherzawadi887@gmail.com

---

## Next Steps After Setup

Once you're confirmed as Super Admin:

1. **Create Other Users**
   - Add team members through Supabase Auth
   - Assign appropriate roles via Staff page (when implemented)

2. **Configure System**
   - Set up alert thresholds
   - Configure email notifications
   - Set data retention policies

3. **Manage Dryers**
   - Register new dryers
   - Assign presets
   - Assign technicians

4. **Review Data**
   - Check all dashboards
   - Verify data collection
   - Test export functionality (when implemented)

---

## Security Notes

⚠️ **Important Security Considerations:**

1. **Super Admin is Powerful**
   - Has access to everything
   - Can delete users and data
   - Can change system configuration
   - Use responsibly

2. **Protect Your Credentials**
   - Use a strong password
   - Enable 2FA when available
   - Don't share your super admin account

3. **Create Limited Accounts**
   - Don't give everyone super admin
   - Use appropriate roles for team members
   - Follow principle of least privilege

4. **Audit Trail**
   - All role changes are logged
   - Monitor user activities
   - Review access logs regularly

---

## Support

If you encounter issues:

1. Check browser console (F12) for errors
2. Check Supabase logs in dashboard
3. Verify database records in Table Editor
4. Review the permissions.ts file for role definitions

---

**Status:** Ready to execute  
**Your Email:** estherzawadi887@gmail.com  
**Target Role:** super_admin  
**Next Action:** Run the SQL script in Supabase Dashboard
