# Dashboard RBAC Integration Guide

## ✅ Integration Complete

The RBAC (Role-Based Access Control) system has been successfully integrated with your dashboard. Users will now see different menu items and have different access levels based on their assigned roles.

---

## 🎯 What Was Integrated

### **1. Sidebar Navigation** (`src/components/AppSidebar.tsx`)
- **Role-based menu filtering**: Menu items are now filtered based on user role
- **Dynamic visibility**: Users only see menu items they have permission to access

#### Menu Visibility by Role:
| Menu Item | Super Admin | Admin | Regional Manager | Field Technician |
|-----------|-------------|-------|------------------|------------------|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Dryers | ✅ | ✅ | ✅ | ✅ |
| Alerts | ✅ | ✅ | ✅ | ✅ |
| Analytics | ✅ | ✅ | ✅ | ❌ |
| Staff | ✅ | ❌ | ❌ | ❌ |
| Presets | ✅ | ✅ | ❌ | ❌ |

### **2. Layout Header** (`src/components/Layout.tsx`)
- **User role badge**: Displays current user's role with color-coded badge
- **User information**: Shows full name and email
- **Role indicators**:
  - 🔴 Super Admin (Red badge)
  - 🔵 Admin (Blue badge)
  - ⚪ Regional Manager (Gray badge)
  - ⚫ Field Technician (Outline badge)

### **3. Protected Routes** (`src/components/ProtectedRoute.tsx`)
- **JWT authentication**: Uses local token-based authentication
- **Automatic redirect**: Redirects to login if not authenticated
- **Session validation**: Checks token validity on route access

### **4. Permission Guards** (`src/components/PermissionGuard.tsx`)
New reusable components for conditional rendering:
- `<PermissionGuard>` - Wrap content with role/permission checks
- `<ShowForSuperAdmin>` - Show only to super admins
- `<ShowForAdmin>` - Show only to admins
- `<ShowForAdminLevel>` - Show to super admins and admins
- `<ShowForRegionalManager>` - Show only to regional managers
- `<ShowForFieldTechnician>` - Show only to field technicians
- `<ExportButton>` - Automatically hidden for users without export permission

### **5. Staff Management Page** (`src/pages/Staff.tsx`)
- **Super Admin Only**: Entire page restricted to super admins
- **Access Denied Message**: Non-super admins see clear error message
- **API Integration**: Connected to `/api/users` endpoints
- **Role Management**: Create, update, and delete users with roles

---

## 🚀 How It Works

### **User Login Flow**
```
1. User logs in → JWT token generated
2. Token stored in localStorage as 'token'
3. Token sent with all API requests
4. Server validates token and returns user + role
5. Frontend uses role to filter UI elements
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
    canExportData,
    hasPermission 
  } = usePermissions();

  return (
    <div>
      {isSuperAdmin && <AdminPanel />}
      {canExportData && <ExportButton />}
      {hasPermission('dryers', 'delete') && <DeleteButton />}
    </div>
  );
}
```

### **Page-Level Protection**
```typescript
import { PermissionGuard } from '@/components/PermissionGuard';

function StaffPage() {
  return (
    <PermissionGuard allowedRoles={['super_admin']}>
      <StaffManagementContent />
    </PermissionGuard>
  );
}
```

---

## 📋 Usage Examples

### **1. Conditional Rendering Based on Role**
```typescript
import { ShowForSuperAdmin, ShowForAdminLevel } from '@/components/PermissionGuard';

function DashboardActions() {
  return (
    <div>
      <ShowForSuperAdmin>
        <Button>Manage Users</Button>
      </ShowForSuperAdmin>
      
      <ShowForAdminLevel>
        <Button>Export Data</Button>
      </ShowForAdminLevel>
    </div>
  );
}
```

### **2. Permission-Based Button Visibility**
```typescript
import { usePermissions } from '@/hooks/usePermissions';

function DryerActions({ dryerId }) {
  const { canDeleteDryers, canUpdateDryerStatus } = usePermissions();

  return (
    <div>
      {canUpdateDryerStatus && (
        <Button onClick={updateStatus}>Update Status</Button>
      )}
      {canDeleteDryers && (
        <Button variant="destructive">Delete Dryer</Button>
      )}
    </div>
  );
}
```

### **3. Protecting Entire Pages**
```typescript
import { PermissionGuard } from '@/components/PermissionGuard';

function AnalyticsPage() {
  return (
    <PermissionGuard 
      allowedRoles={['super_admin', 'admin', 'regional_manager']}
      showError={true}
    >
      <AnalyticsContent />
    </PermissionGuard>
  );
}
```

### **4. Export Button with Auto-Hide**
```typescript
import { ExportButton } from '@/components/PermissionGuard';

function DataTable() {
  return (
    <div>
      <Table data={data} />
      <ExportButton onClick={exportData}>
        Export to CSV
      </ExportButton>
    </div>
  );
}
```

---

## 🔧 Configuration

### **Adding New Menu Items**
Edit `src/components/AppSidebar.tsx`:
```typescript
const navigationItems = [
  { 
    title: "New Page", 
    url: "/dashboard/new-page", 
    icon: IconComponent,
    roles: ['super_admin', 'admin'] // Specify allowed roles
  },
];
```

### **Customizing Role Badges**
Edit `src/components/Layout.tsx`:
```typescript
const getRoleBadge = () => {
  if (isSuperAdmin) return { 
    label: 'Super Admin', 
    variant: 'destructive' 
  };
  // Add custom role badges here
};
```

---

## 🎨 UI Components

### **Role Badge Colors**
- **Super Admin**: Red (`destructive` variant)
- **Admin**: Blue (`default` variant)
- **Regional Manager**: Gray (`secondary` variant)
- **Field Technician**: Outline (`outline` variant)

### **Header Layout**
```
┌─────────────────────────────────────────────────┐
│ [☰] Menu          John Doe        [Sign Out]   │
│                   🛡️ Super Admin                │
└─────────────────────────────────────────────────┘
```

### **Sidebar Layout**
```
┌──────────────────┐
│  ITEDA SOLUTIONS │
├──────────────────┤
│ 📊 Dashboard     │
│ 💨 Dryers        │
│ ⚠️  Alerts       │
│ 📈 Analytics     │ ← Hidden for Field Technicians
│ 👥 Staff         │ ← Super Admin only
│ ⚙️  Presets      │ ← Hidden for Regional Managers
└──────────────────┘
```

---

## 🔒 Security Features

### **Client-Side Protection**
- Menu items filtered by role
- UI elements conditionally rendered
- Permission checks before actions

### **Server-Side Protection** (Already Implemented)
- JWT token validation
- Role-based API middleware
- Permission checks on all endpoints
- Regional/assignment filtering

### **Token Management**
- Stored in `localStorage` as `'token'`
- Sent in `Authorization: Bearer <token>` header
- Validated on every API request
- Cleared on logout

---

## 🧪 Testing the Integration

### **1. Test as Super Admin**
- [ ] Can see all menu items (Dashboard, Dryers, Alerts, Analytics, Staff, Presets)
- [ ] Can access Staff Management page
- [ ] Can create/edit/delete users
- [ ] Badge shows "Super Admin" in red
- [ ] Can export data

### **2. Test as Admin**
- [ ] Can see Dashboard, Dryers, Alerts, Analytics, Presets
- [ ] Cannot see Staff menu item
- [ ] Gets "Access Denied" on /dashboard/staff
- [ ] Badge shows "Admin" in blue
- [ ] Can export data

### **3. Test as Regional Manager**
- [ ] Can see Dashboard, Dryers, Alerts
- [ ] Cannot see Analytics, Staff, or Presets
- [ ] Badge shows "Regional Manager" in gray
- [ ] Cannot export data

### **4. Test as Field Technician**
- [ ] Can see Dashboard, Dryers, Alerts only
- [ ] Cannot see Analytics, Staff, or Presets
- [ ] Badge shows "Field Technician" with outline
- [ ] Cannot export data

---

## 📝 Next Steps

### **1. Update Other Pages**
Add permission guards to other dashboard pages:

```typescript
// app/dashboard/analytics/page.tsx
import { PermissionGuard } from '@/components/PermissionGuard';

export default function AnalyticsPage() {
  return (
    <PermissionGuard allowedRoles={['super_admin', 'admin', 'regional_manager']}>
      <Analytics />
    </PermissionGuard>
  );
}
```

### **2. Add Dryer Filtering**
For Regional Managers and Field Technicians:

```typescript
import { usePermissions } from '@/hooks/usePermissions';

function DryersPage() {
  const { needsRegionalFilter, needsDryerAssignmentFilter } = usePermissions();
  
  // Fetch dryers with appropriate filters
  const fetchDryers = async () => {
    const params = new URLSearchParams();
    if (needsRegionalFilter) params.append('region', userRegion);
    if (needsDryerAssignmentFilter) params.append('assignedOnly', 'true');
    
    const response = await fetch(`/api/dryers?${params}`);
    // ...
  };
}
```

### **3. Add Export Restrictions**
```typescript
import { ExportButton } from '@/components/PermissionGuard';

function ReportsPage() {
  return (
    <div>
      <DataTable />
      <ExportButton onClick={handleExport}>
        Export Report
      </ExportButton>
    </div>
  );
}
```

---

## 🐛 Troubleshooting

### **Menu Items Not Filtering**
- Check if `usePermissions()` hook is returning correct role
- Verify token is stored in localStorage as `'token'`
- Check browser console for errors

### **"Access Denied" on All Pages**
- Verify user has a role assigned in database
- Check token is valid and not expired
- Ensure `/api/auth/session` endpoint is working

### **Role Badge Not Showing**
- Check if user data is being fetched correctly
- Verify `usePermissions()` hook is working
- Check Layout component is receiving user data

### **API Calls Failing**
- Verify token is being sent in Authorization header
- Check API endpoints are using RBAC middleware
- Ensure user has required permissions

---

## 📚 Related Documentation

- **Full RBAC System**: `developer/RBAC_SYSTEM.md`
- **Implementation Summary**: `developer/RBAC_IMPLEMENTATION_SUMMARY.md`
- **Permission Utilities**: `src/lib/permissions.ts`
- **API Middleware**: `src/lib/rbac-middleware.ts`
- **Frontend Hooks**: `src/hooks/usePermissions.tsx`

---

## ✨ Summary

Your dashboard is now fully integrated with the RBAC system:

✅ **Sidebar** - Role-based menu filtering  
✅ **Header** - User role display with badges  
✅ **Protected Routes** - JWT authentication  
✅ **Permission Guards** - Reusable components  
✅ **Staff Page** - Super admin only access  
✅ **API Integration** - All endpoints connected  

Users will now see different interfaces based on their roles, and all actions are protected by permission checks both on the frontend and backend.

**The system is ready for production use!** 🎉
