# Role-Based Access Control (RBAC) System

## Overview

The iTeda Solutions Platform implements a comprehensive Role-Based Access Control (RBAC) system with four distinct user roles, each with specific permissions and access levels.

## User Roles

### 1. Super Admin
**Full system access with complete control**

#### Permissions:
- ✅ **User Management**: Create, read, update, and delete users
- ✅ **Role Assignment**: Assign and modify user roles
- ✅ **System Configuration**: Configure system settings
- ✅ **All Dryer Access**: View and manage all dryers
- ✅ **Data Export**: Export all data and reports
- ✅ **Analytics**: Full access to analytics and dashboards
- ✅ **Preset Management**: Create, update, and delete presets
- ✅ **Alert Management**: View and manage all alerts

#### Restrictions:
- None - Full system access

---

### 2. Admin
**Operational management without user administration**

#### Permissions:
- ✅ **Dryer Management**: View and update all dryers
- ✅ **Data Export**: Export dryer data and reports
- ✅ **Analytics**: View all reports and dashboards
- ✅ **Alert Management**: View and update alerts
- ✅ **Preset Management**: View and update presets

#### Restrictions:
- ❌ **Cannot manage users** (create, edit, delete users)
- ❌ **Cannot assign roles**
- ❌ **Cannot configure system settings**
- ❌ **Cannot delete dryers**

---

### 3. Regional Manager
**Regional oversight and monitoring**

#### Permissions:
- ✅ **Regional Dryer Access**: View dryers in assigned region only
- ✅ **Status Updates**: Update dryer status
- ✅ **Regional Reports**: View reports for assigned region
- ✅ **Regional Analytics**: View analytics for assigned region
- ✅ **Alert Management**: View and update alerts in region
- ✅ **Preset Viewing**: View available presets

#### Restrictions:
- ❌ **Cannot view dryers outside assigned region**
- ❌ **Cannot export data**
- ❌ **Cannot manage users**
- ❌ **Cannot create or delete dryers**
- ❌ **Cannot modify presets**

#### Special Requirements:
- Must be assigned to a specific region
- Access is automatically filtered by region

---

### 4. Field Technician
**Limited access to assigned dryers only**

#### Permissions:
- ✅ **Assigned Dryer Access**: View assigned dryers only
- ✅ **Basic Updates**: Update basic dryer information
- ✅ **Real-time Data**: View real-time sensor data
- ✅ **Alert Viewing**: View alerts for assigned dryers
- ✅ **Alert Updates**: Acknowledge and update alerts
- ✅ **Preset Viewing**: View available presets

#### Restrictions:
- ❌ **Cannot view unassigned dryers**
- ❌ **Cannot update dryer status** (only basic info)
- ❌ **Cannot export data**
- ❌ **Cannot manage users**
- ❌ **Cannot create or delete dryers**
- ❌ **Cannot modify presets**
- ❌ **Cannot access system-wide reports**

#### Special Requirements:
- Must be explicitly assigned to specific dryers
- Access is limited to assigned dryers only

---

## Implementation Details

### Database Schema

#### Staff Roles Table
```sql
CREATE TABLE staff_roles (
  id UUID PRIMARY KEY,
  staff_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role app_role NOT NULL, -- 'super_admin', 'admin', 'regional_manager', 'field_technician'
  region TEXT, -- Required for regional_manager
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Dryer Assignments Table
```sql
CREATE TABLE dryer_assignments (
  id UUID PRIMARY KEY,
  technician_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  dryer_id UUID REFERENCES dryers(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP DEFAULT NOW(),
  assigned_by UUID REFERENCES profiles(id),
  notes TEXT,
  CONSTRAINT unique_technician_dryer UNIQUE (technician_id, dryer_id)
);
```

### Permission System

#### Permission Structure
```typescript
interface Permission {
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'export';
}
```

#### Key Functions
- `hasPermission(role, resource, action)`: Check if role has specific permission
- `canManageUsers(role)`: Check if user can manage other users
- `canViewAllDryers(role)`: Check if user can view all dryers
- `canExportData(role)`: Check if user can export data
- `needsRegionalFilter(role)`: Check if queries need regional filtering
- `needsDryerAssignmentFilter(role)`: Check if queries need dryer assignment filtering

### API Middleware

#### Authentication Middleware
```typescript
requireAuth(request) // Verify JWT token
requireRole(request, allowedRoles) // Check specific role
requirePermission(request, resource, action) // Check permission
requireSuperAdmin(request) // Super admin only
requireAdminLevel(request) // Admin or super admin
```

#### Usage Example
```typescript
export async function GET(request: NextRequest) {
  const { user, error } = await requireAdminLevel(request);
  if (error) return error;
  
  // Proceed with authorized logic
}
```

### Frontend Hooks

#### usePermissions Hook
```typescript
const {
  user,
  role,
  isSuperAdmin,
  isAdmin,
  isRegionalManager,
  isFieldTechnician,
  canManageUsers,
  canViewAllDryers,
  canExportData,
  hasPermission,
} = usePermissions();
```

#### useCanAccessDryer Hook
```typescript
const { canAccess, isLoading } = useCanAccessDryer(dryerId);
```

#### useAssignedDryers Hook
```typescript
const { assignedDryers, isLoading } = useAssignedDryers();
```

---

## API Endpoints

### User Management (Super Admin Only)
- `GET /api/users` - List all users
- `POST /api/users` - Create new user
- `PUT /api/users/[id]` - Update user
- `DELETE /api/users/[id]` - Delete user

### Dryer Assignments (Admin Level)
- `GET /api/dryer-assignments` - List all assignments
- `POST /api/dryer-assignments` - Create assignment
- `DELETE /api/dryer-assignments/[id]` - Remove assignment

### Session Management
- `GET /api/auth/session` - Get current session
- `POST /api/auth/signin` - Sign in
- `POST /api/auth/signup` - Sign up

---

## Usage Examples

### Creating a User (Super Admin)
```typescript
const response = await fetch('/api/users', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'technician@example.com',
    password: 'secure_password',
    fullName: 'John Doe',
    role: 'field_technician',
  }),
});
```

### Assigning Dryer to Technician (Admin)
```typescript
const response = await fetch('/api/dryer-assignments', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    technicianId: 'uuid-of-technician',
    dryerId: 'uuid-of-dryer',
    notes: 'Primary technician for this location',
  }),
});
```

### Conditional UI Rendering
```tsx
function DashboardActions() {
  const { canManageUsers, canExportData, isFieldTechnician } = usePermissions();
  
  return (
    <div>
      {canManageUsers && (
        <Button onClick={openUserManagement}>Manage Users</Button>
      )}
      {canExportData && (
        <Button onClick={exportData}>Export Data</Button>
      )}
      {!isFieldTechnician && (
        <Button onClick={viewAllDryers}>View All Dryers</Button>
      )}
    </div>
  );
}
```

---

## Migration Guide

### Running the Migration
```bash
# Using psql
psql -U your_user -d your_database -f scripts/migrations/add-rbac-system.sql

# Using Drizzle
npm run db:push
```

### Post-Migration Steps
1. Assign roles to existing users
2. Assign regions to regional managers
3. Assign dryers to field technicians
4. Test permissions for each role
5. Update frontend components to use permission hooks

---

## Security Considerations

1. **Token Security**: JWT tokens are used for authentication
2. **Password Hashing**: Bcrypt with salt rounds of 12
3. **Cascade Deletes**: User deletion cascades to roles and assignments
4. **Unique Constraints**: Prevent duplicate role assignments
5. **Index Optimization**: Indexes on foreign keys for performance

---

## Testing Checklist

### Super Admin
- [ ] Can create users
- [ ] Can assign roles
- [ ] Can view all dryers
- [ ] Can export data
- [ ] Can delete users

### Admin
- [ ] Can view all dryers
- [ ] Can export data
- [ ] Cannot manage users
- [ ] Can assign dryers to technicians

### Regional Manager
- [ ] Can only view dryers in assigned region
- [ ] Cannot view dryers in other regions
- [ ] Cannot export data
- [ ] Can update dryer status

### Field Technician
- [ ] Can only view assigned dryers
- [ ] Cannot view unassigned dryers
- [ ] Cannot export data
- [ ] Can update basic dryer info
- [ ] Cannot update dryer status

---

## Troubleshooting

### User Cannot Access Expected Resources
1. Verify user role in database
2. Check region assignment for regional managers
3. Check dryer assignments for field technicians
4. Verify JWT token is valid and not expired

### Permission Denied Errors
1. Check API middleware is properly applied
2. Verify role permissions in `permissions.ts`
3. Check database role assignment
4. Verify token is being sent in Authorization header

### Assignment Issues
1. Verify dryer exists in database
2. Check technician has field_technician role
3. Ensure no duplicate assignments
4. Check foreign key constraints

---

## Future Enhancements

- [ ] Role hierarchy system
- [ ] Custom permission sets
- [ ] Temporary access grants
- [ ] Audit logging for permission changes
- [ ] Multi-region assignments for managers
- [ ] Dryer group assignments
- [ ] Permission inheritance
- [ ] API rate limiting per role

---

## Support

For questions or issues with the RBAC system:
1. Check this documentation
2. Review the code in `src/lib/permissions.ts`
3. Check API middleware in `src/lib/rbac-middleware.ts`
4. Contact the development team
