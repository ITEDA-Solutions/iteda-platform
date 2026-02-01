# Complete RBAC Implementation - User Roles & Permissions

## Overview

The iTeda Solutions Platform implements a comprehensive Role-Based Access Control (RBAC) system with four distinct user roles, each with specific permissions and access levels.

---

## 🎭 User Roles

### 1. Super Admin (super_admin)

**Full system access - Can do everything**

#### Permissions:
- ✅ **User Management**
  - Create, edit, and delete users
  - Assign and modify user roles
  - View all user profiles
  
- ✅ **Dryer Management**
  - View all dryers (system-wide)
  - Create new dryers
  - Update any dryer information
  - Delete dryers
  - Assign dryers to field technicians
  
- ✅ **Data & Reports**
  - View all dashboards and reports
  - Export all data (CSV, JSON)
  - Access analytics for all dryers
  
- ✅ **System Configuration**
  - Manage presets
  - Configure firmware versions
  - Create and manage regions
  - System settings

- ✅ **Alerts**
  - View all alerts
  - Configure alert rules
  - Acknowledge and resolve alerts

---

### 2. Admin (admin)

**Can manage operations but not users**

#### Permissions:
- ✅ **Dryer Management**
  - View all dryers (system-wide)
  - Update dryer information
  - Assign dryers to field technicians
  - Cannot create or delete dryers
  
- ✅ **Data & Reports**
  - View all dashboards and reports
  - Export data (CSV, JSON)
  - Access analytics for all dryers
  
- ✅ **Alerts**
  - View all alerts
  - Configure alert rules
  - Acknowledge and resolve alerts

- ✅ **Presets**
  - View and update presets
  - Cannot create or delete presets

#### Restrictions:
- ❌ Cannot manage users
- ❌ Cannot assign roles
- ❌ Cannot create/delete dryers
- ❌ Cannot access system configuration

---

### 3. Regional Manager (regional_manager)

**Can manage dryers in assigned region only**

#### Permissions:
- ✅ **Dryer Management**
  - View dryers in assigned region only
  - Update dryer status
  - View dryer details and history
  
- ✅ **Reports**
  - View reports for assigned region
  - Access analytics for regional dryers
  - Limited data export (regional data only)
  
- ✅ **Alerts**
  - View alerts for regional dryers
  - Acknowledge alerts
  - Cannot configure alert rules

- ✅ **Presets**
  - View presets only

#### Restrictions:
- ❌ Cannot view dryers outside assigned region
- ❌ Cannot export data
- ❌ Cannot manage users
- ❌ Cannot update dryer information (only status)
- ❌ Cannot assign dryers to technicians

#### Regional Filtering:
Regional managers must be assigned to a specific region. The system automatically filters:
- Dryers list to show only regional dryers
- Alerts to show only regional alerts
- Reports to show only regional data

---

### 4. Field Technician (field_technician)

**Can only access assigned dryers**

#### Permissions:
- ✅ **Assigned Dryers Only**
  - View assigned dryers only
  - Update basic dryer information:
    - Location (GPS coordinates)
    - Location address
    - Owner information
  - View real-time sensor data
  
- ✅ **Alerts**
  - View alerts for assigned dryers
  - Acknowledge alerts
  
- ✅ **Presets**
  - View presets only

#### Restrictions:
- ❌ Cannot view unassigned dryers
- ❌ Cannot update dryer status
- ❌ Cannot export data
- ❌ Cannot manage users
- ❌ Cannot assign dryers
- ❌ Cannot access system-wide reports

#### Assignment-Based Access:
Field technicians can only access dryers explicitly assigned to them through the `dryer_assignments` table. Admins and Super Admins manage these assignments.

---

## 🔒 Permission Matrix

| Feature | Super Admin | Admin | Regional Manager | Field Technician |
|---------|-------------|-------|------------------|------------------|
| **User Management** |
| Create Users | ✅ | ❌ | ❌ | ❌ |
| Edit Users | ✅ | ❌ | ❌ | ❌ |
| Delete Users | ✅ | ❌ | ❌ | ❌ |
| Assign Roles | ✅ | ❌ | ❌ | ❌ |
| **Dryer Management** |
| View All Dryers | ✅ | ✅ | ❌ | ❌ |
| View Regional Dryers | ✅ | ✅ | ✅ | ❌ |
| View Assigned Dryers | ✅ | ✅ | ✅ | ✅ |
| Create Dryers | ✅ | ❌ | ❌ | ❌ |
| Update Dryer Info | ✅ | ✅ | ❌ | ✅* |
| Update Dryer Status | ✅ | ✅ | ✅ | ❌ |
| Delete Dryers | ✅ | ❌ | ❌ | ❌ |
| Assign to Technicians | ✅ | ✅ | ❌ | ❌ |
| **Data & Reports** |
| View All Reports | ✅ | ✅ | ❌ | ❌ |
| View Regional Reports | ✅ | ✅ | ✅ | ❌ |
| Export Data | ✅ | ✅ | ❌ | ❌ |
| View Analytics | ✅ | ✅ | ✅ | ❌ |
| **Alerts** |
| View All Alerts | ✅ | ✅ | ❌ | ❌ |
| View Regional Alerts | ✅ | ✅ | ✅ | ❌ |
| View Assigned Alerts | ✅ | ✅ | ✅ | ✅ |
| Acknowledge Alerts | ✅ | ✅ | ✅ | ✅ |
| Configure Alerts | ✅ | ✅ | ❌ | ❌ |
| **Presets** |
| View Presets | ✅ | ✅ | ✅ | ✅ |
| Create/Edit Presets | ✅ | ✅ | ❌ | ❌ |
| Delete Presets | ✅ | ❌ | ❌ | ❌ |
| **System** |
| System Configuration | ✅ | ❌ | ❌ | ❌ |
| Manage Regions | ✅ | ❌ | ❌ | ❌ |
| Firmware Management | ✅ | ❌ | ❌ | ❌ |

*Field Technicians can only update location and owner info, not status or system settings.

---

## 🛠️ API Endpoints & Access Control

### Authentication Endpoints
| Endpoint | Method | Access | Description |
|----------|--------|--------|-------------|
| `/api/auth/signin` | POST | Public | User sign in |
| `/api/auth/signup` | POST | Public | User registration |
| `/api/auth/session` | GET | Authenticated | Get current session |

### User Management (Super Admin Only)
| Endpoint | Method | Access | Description |
|----------|--------|--------|-------------|
| `/api/users` | GET | Super Admin | List all users |
| `/api/users` | POST | Super Admin | Create new user |
| `/api/users/[id]` | GET | Super Admin | Get user details |
| `/api/users/[id]` | PUT | Super Admin | Update user |
| `/api/users/[id]` | DELETE | Super Admin | Delete user |

### Dryer Management
| Endpoint | Method | Access | Description |
|----------|--------|--------|-------------|
| `/api/dryers` | GET | All Roles | List dryers (filtered by role) |
| `/api/dryers` | POST | Super Admin | Create new dryer |
| `/api/dryers/[id]` | GET | All Roles | Get dryer details (if accessible) |
| `/api/dryers/[id]` | PUT | All Roles | Update dryer (role-specific fields) |
| `/api/dryers/[id]` | DELETE | Super Admin | Delete dryer |

### Dryer Assignments (Admin Level)
| Endpoint | Method | Access | Description |
|----------|--------|--------|-------------|
| `/api/dryer-assignments` | GET | Admin+ | List all assignments |
| `/api/dryer-assignments` | POST | Admin+ | Assign dryer to technician |
| `/api/dryer-assignments/[id]` | DELETE | Admin+ | Remove assignment |

### Data Export
| Endpoint | Method | Access | Description |
|----------|--------|--------|-------------|
| `/api/export/sensor-data` | GET | Admin+ | Export sensor data (filtered by role) |
| `/api/export/alerts` | GET | Admin+ | Export alerts (filtered by role) |

### Regions
| Endpoint | Method | Access | Description |
|----------|--------|--------|-------------|
| `/api/regions` | GET | All Roles | List all regions |
| `/api/regions` | POST | Super Admin | Create new region |

### Other Endpoints
| Endpoint | Method | Access | Description |
|----------|--------|--------|-------------|
| `/api/presets` | GET | All Roles | List presets |
| `/api/presets` | POST | Admin+ | Create preset |
| `/api/presets/[id]` | PUT | Admin+ | Update preset |
| `/api/presets/[id]` | DELETE | Super Admin | Delete preset |
| `/api/sensor-data` | GET | All Roles | Get sensor readings (filtered) |
| `/api/operational-events` | GET | All Roles | Get events (filtered) |

---

## 💻 Frontend Implementation

### Using Permissions in Components

```typescript
import { usePermissions } from '@/hooks/usePermissions';
import { PermissionGuard, ShowForSuperAdmin, ShowForAdminLevel } from '@/components/PermissionGuard';

function MyComponent() {
  const { 
    role,
    isSuperAdmin,
    isAdmin,
    isRegionalManager,
    isFieldTechnician,
    canManageUsers,
    canExportData,
    canCreateDryers,
    hasPermission
  } = usePermissions();

  return (
    <div>
      {/* Show content only for super admins */}
      <ShowForSuperAdmin>
        <UserManagementButton />
      </ShowForSuperAdmin>

      {/* Show content for admins and super admins */}
      <ShowForAdminLevel>
        <ExportDataButton />
      </ShowForAdminLevel>

      {/* Conditional rendering based on permission */}
      {canCreateDryers && <CreateDryerButton />}

      {/* Permission guard with error message */}
      <PermissionGuard 
        allowedRoles={['super_admin', 'admin']}
        showError={true}
      >
        <AdminPanel />
      </PermissionGuard>

      {/* Check specific permission */}
      {hasPermission('dryers', 'delete') && <DeleteButton />}
    </div>
  );
}
```

### Check Dryer Access

```typescript
import { useCanAccessDryer } from '@/hooks/usePermissions';

function DryerDetail({ dryerId }) {
  const { canAccess, isLoading } = useCanAccessDryer(dryerId);

  if (isLoading) return <Spinner />;
  if (!canAccess) return <AccessDenied />;

  return <DryerContent />;
}
```

### Get Assigned Dryers (Field Technicians)

```typescript
import { useAssignedDryers } from '@/hooks/usePermissions';

function TechnicianDashboard() {
  const { assignedDryers, isLoading } = useAssignedDryers();

  return (
    <div>
      <h2>My Assigned Dryers</h2>
      {assignedDryers.map(assignment => (
        <DryerCard key={assignment.id} dryer={assignment.dryer} />
      ))}
    </div>
  );
}
```

---

## 🗄️ Database Schema

### staff_roles Table
```sql
CREATE TABLE staff_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role app_role NOT NULL,  -- 'super_admin', 'admin', 'regional_manager', 'field_technician'
  region TEXT,  -- Required for regional managers
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_staff_role UNIQUE (staff_id, role)
);
```

### dryer_assignments Table
```sql
CREATE TABLE dryer_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  technician_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  dryer_id UUID NOT NULL REFERENCES dryers(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_by UUID REFERENCES profiles(id),
  notes TEXT,
  CONSTRAINT unique_technician_dryer UNIQUE (technician_id, dryer_id)
);
```

### regions Table
```sql
CREATE TABLE regions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 🚀 Setup & Deployment

### 1. Apply Database Migrations

The RBAC system tables are created through Supabase migrations:

```bash
# Tables are already created if you've run:
supabase db push
```

### 2. Create Initial Super Admin

```sql
-- First, sign up a user through the app or API
-- Then assign super admin role:
INSERT INTO staff_roles (staff_id, role)
VALUES ('user-uuid-from-profiles-table', 'super_admin');
```

### 3. Create Regions

```sql
-- Create regions for regional managers
INSERT INTO regions (name, code) VALUES
  ('Northern Region', 'NORTH'),
  ('Southern Region', 'SOUTH'),
  ('Eastern Region', 'EAST'),
  ('Western Region', 'WEST');
```

### 4. Assign Roles to Users

```sql
-- Create an admin
INSERT INTO staff_roles (staff_id, role)
VALUES ('admin-user-uuid', 'admin');

-- Create a regional manager with assigned region
INSERT INTO staff_roles (staff_id, role, region)
VALUES ('manager-user-uuid', 'regional_manager', 'region-uuid-from-regions-table');

-- Create a field technician
INSERT INTO staff_roles (staff_id, role)
VALUES ('technician-user-uuid', 'field_technician');
```

### 5. Assign Dryers to Technicians

```sql
-- Assign a dryer to a field technician
INSERT INTO dryer_assignments (technician_id, dryer_id, assigned_by, notes)
VALUES (
  'technician-user-uuid',
  'dryer-uuid',
  'admin-user-uuid',
  'Primary technician for this location'
);
```

---

## ✅ Testing Checklist

### Super Admin Tests
- [ ] Can create, edit, and delete users
- [ ] Can assign any role to users
- [ ] Can view all dryers system-wide
- [ ] Can create and delete dryers
- [ ] Can export all data
- [ ] Can configure system settings
- [ ] Can manage regions

### Admin Tests
- [ ] Can view all dryers
- [ ] Can update dryer information
- [ ] Can assign dryers to technicians
- [ ] Can export data
- [ ] Cannot create/delete users
- [ ] Cannot create/delete dryers
- [ ] Cannot access system configuration

### Regional Manager Tests
- [ ] Can only see dryers in assigned region
- [ ] Cannot see dryers in other regions
- [ ] Can update dryer status only
- [ ] Cannot update dryer location/info
- [ ] Cannot export data
- [ ] Can view regional reports and alerts

### Field Technician Tests
- [ ] Can only see assigned dryers
- [ ] Cannot see unassigned dryers
- [ ] Can update dryer location and owner info
- [ ] Cannot update dryer status
- [ ] Cannot export data
- [ ] Cannot access reports or analytics

---

## 🔐 Security Notes

1. **JWT Authentication**: All API endpoints require valid JWT tokens
2. **Server-Side Validation**: Permissions are enforced at the API level
3. **Database Row-Level Security**: Supabase RLS policies provide additional protection
4. **Automatic Filtering**: Dryer lists are automatically filtered based on role
5. **Assignment Validation**: Field technicians can only access explicitly assigned dryers
6. **Regional Isolation**: Regional managers are restricted to their assigned region

---

## 📚 Related Files

- Permission Definitions: `src/lib/permissions.ts`
- API Middleware: `src/lib/rbac-middleware.ts`
- Frontend Hooks: `src/hooks/usePermissions.tsx`
- Permission Guard Components: `src/components/PermissionGuard.tsx`
- Database Migration: `supabase/migrations/20240128_rbac_system.sql`

---

**Implementation Status**: ✅ **COMPLETE**

All four user roles are fully implemented with proper permissions, API protection, and frontend components for role-based UI rendering.
