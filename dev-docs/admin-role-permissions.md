# 🔐 Role-Based Access Control (RBAC) - Admin Role Permissions

## Overview

This document outlines the **exact permissions** for the **admin** role in the ITEDA Solar Dryer Management Platform.

---

## Admin Role Definition

The **admin** role is designed for operational administrators who manage dryers, monitor system performance, and handle day-to-day operations. They have broad access to system data and features, **except user management**.

---

## ✅ What Admins CAN Do

### 1. **View All Dryers** 📍
- Access complete list of all dryers in the system
- View dryer details, status, and location
- See real-time sensor data from all dryers
- Monitor dryer performance across all regions
- **No regional restrictions** (unlike regional managers)

### 2. **Manage Dryer Information** 🔧
- Update dryer configuration settings
- Modify dryer metadata (location, description)
- Assign presets to dryers
- Update dryer operational status (active, idle, maintenance, etc.)
- **Cannot create or delete dryers** (only super_admin)

### 3. **View All Reports & Dashboards** 📊
- Access main dashboard with system-wide statistics
- View analytics dashboard
- See reports for all dryers and regions
- Monitor system-wide performance metrics
- View historical data and trends

### 4. **Export Data** 💾
- Export dryer information
- Export sensor readings and historical data
- Export reports and analytics
- Download alert logs
- Generate CSV/Excel exports of system data

### 5. **Manage Alerts Configuration** ⚠️
- View all system alerts
- Acknowledge alerts
- Resolve alerts
- Update alert settings and thresholds
- Configure notification preferences

### 6. **Manage Presets** ⚙️
- View all drying presets
- Update existing presets
- Modify preset parameters (temperature, humidity, duration)
- **Cannot create or delete presets** (only super_admin)

---

## ❌ What Admins CANNOT Do

### 1. **User Management** 👥
- **Cannot view user list**
- **Cannot create new users**
- **Cannot modify user information**
- **Cannot delete users**
- **Cannot assign/change user roles**
- **No access to User Management page**

### 2. **System Configuration** 🔧
- Cannot modify system-wide settings
- Cannot change RBAC policies
- Cannot configure database connections

### 3. **Dryer Lifecycle Management** 🏗️
- Cannot register new dryers (only super_admin)
- Cannot decommission/delete dryers (only super_admin)

### 4. **Preset Creation** ➕
- Cannot create new drying presets (only super_admin)
- Cannot delete presets (only super_admin)

---

## 📍 Navigation Menu (Admin View)

When an admin user signs in, they will see the following menu items:

```
📊 Dashboard              ✅ Accessible
🌪️  Dryers                ✅ Accessible
⚠️  Alerts                ✅ Accessible
📈 Analytics             ✅ Accessible
💾 Data Export           ✅ Accessible
⚙️  Presets               ✅ Accessible
👥 User Management       ❌ HIDDEN (super_admin only)
```

---

## 🆚 Role Comparison

| Feature | Super Admin | Admin | Regional Manager | Field Technician |
|---------|-------------|-------|------------------|------------------|
| **View All Dryers** | ✅ | ✅ | ⚠️ Region only | ⚠️ Assigned only |
| **Manage Dryers** | ✅ Full | ✅ Update only | ⚠️ Limited | ⚠️ Very limited |
| **Create/Delete Dryers** | ✅ | ❌ | ❌ | ❌ |
| **View Reports** | ✅ All | ✅ All | ⚠️ Region only | ⚠️ Assigned only |
| **Export Data** | ✅ | ✅ | ✅ | ❌ |
| **Manage Alerts** | ✅ | ✅ | ✅ | ✅ |
| **Manage Presets** | ✅ Full | ⚠️ Update only | ❌ | ❌ |
| **User Management** | ✅ | ❌ | ❌ | ❌ |
| **Assign Roles** | ✅ | ❌ | ❌ | ❌ |
| **System Config** | ✅ | ❌ | ❌ | ❌ |

---

## 🔒 API Endpoint Access

### **Allowed Endpoints for Admin:**

```
GET    /api/dryers              ✅ View all dryers
GET    /api/dryers/:id          ✅ View dryer details
PUT    /api/dryers/:id          ✅ Update dryer info
POST   /api/dryers              ❌ Cannot create
DELETE /api/dryers/:id          ❌ Cannot delete

GET    /api/alerts              ✅ View all alerts
PUT    /api/alerts/:id          ✅ Update alert status

GET    /api/analytics           ✅ View analytics
GET    /api/reports             ✅ View reports

GET    /api/export/dryers       ✅ Export dryer data
GET    /api/export/sensor-data  ✅ Export sensor data
GET    /api/export/alerts       ✅ Export alerts

GET    /api/presets             ✅ View presets
PUT    /api/presets/:id         ✅ Update presets
POST   /api/presets             ❌ Cannot create
DELETE /api/presets/:id         ❌ Cannot delete

GET    /api/users               ❌ FORBIDDEN
POST   /api/users               ❌ FORBIDDEN
PUT    /api/users/:id           ❌ FORBIDDEN
DELETE /api/users/:id           ❌ FORBIDDEN
GET    /api/staff               ❌ FORBIDDEN
POST   /api/staff               ❌ FORBIDDEN
```

---

## 🛡️ Security Implementation

### Permission Checking

All API routes are protected with middleware that checks:

1. **Authentication**: User must be signed in
2. **Role verification**: User role is verified from `staff_roles` table
3. **Permission check**: Action is validated against role permissions
4. **403 Forbidden**: Returned if user lacks permission

### Example API Protection:

```typescript
// User management endpoint (admin CANNOT access)
export async function GET(request: NextRequest) {
  const { user, error } = await validateUserManagementAccess(request);
  
  if (error) {
    // Returns 403 Forbidden if not super_admin
    return error;
  }
  
  // Only super_admin reaches here
  const users = await getUsers();
  return NextResponse.json({ users });
}
```

---

## 👤 Admin User Example

```json
{
  "email": "Sean.Davy@est.org.uk",
  "role": "admin",
  "permissions": {
    "dryers": ["read", "update", "export"],
    "reports": ["read", "export"],
    "analytics": ["read", "export"],
    "alerts": ["read", "update"],
    "presets": ["read", "update"]
  },
  "restrictions": {
    "users": "NO_ACCESS",
    "dryers_create": "NO_ACCESS",
    "dryers_delete": "NO_ACCESS",
    "presets_create": "NO_ACCESS",
    "presets_delete": "NO_ACCESS",
    "system_config": "NO_ACCESS"
  }
}
```

---

## 🎯 Use Cases

### **When to use Admin role:**

1. **Operations Manager** - Day-to-day dryer fleet management
2. **Data Analyst** - Need to export and analyze system data
3. **Support Staff** - Monitor system health and respond to alerts
4. **Quality Control** - Review dryer performance and optimize settings

### **When NOT to use Admin role:**

1. **User provisioning** - Need super_admin
2. **Initial system setup** - Need super_admin
3. **Dryer deployment** - Need super_admin to register
4. **Role assignment** - Need super_admin

---

## ✅ Summary

The **admin** role provides comprehensive operational access without the ability to affect user management or critical system configuration. This separation ensures:

- ✅ Operational efficiency (admins can manage dryers and data)
- 🔒 Security (cannot create/modify user accounts)
- 📊 Data access (full visibility for monitoring and reporting)
- ⚠️ Alert management (can respond to system issues)
- 💾 Export capabilities (can extract data for analysis)

**Bottom line:** Admins run the system day-to-day, while super_admins control who has access and system configuration.
