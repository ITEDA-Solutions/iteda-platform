// Role-based permission system
export type UserRole = 'super_admin' | 'admin' | 'regional_manager' | 'field_technician';

export interface Permission {
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'export';
}

// Define permissions for each role
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin: [
    // Full system access
    { resource: 'users', action: 'create' },
    { resource: 'users', action: 'read' },
    { resource: 'users', action: 'update' },
    { resource: 'users', action: 'delete' },
    { resource: 'roles', action: 'create' },
    { resource: 'roles', action: 'read' },
    { resource: 'roles', action: 'update' },
    { resource: 'roles', action: 'delete' },
    { resource: 'dryers', action: 'create' },
    { resource: 'dryers', action: 'read' },
    { resource: 'dryers', action: 'update' },
    { resource: 'dryers', action: 'delete' },
    { resource: 'dryers', action: 'export' },
    { resource: 'reports', action: 'read' },
    { resource: 'reports', action: 'export' },
    { resource: 'analytics', action: 'read' },
    { resource: 'analytics', action: 'export' },
    { resource: 'alerts', action: 'read' },
    { resource: 'alerts', action: 'update' },
    { resource: 'presets', action: 'create' },
    { resource: 'presets', action: 'read' },
    { resource: 'presets', action: 'update' },
    { resource: 'presets', action: 'delete' },
    { resource: 'system', action: 'read' },
    { resource: 'system', action: 'update' },
  ],
  admin: [
    // View all dryers, manage dryer info, view reports, export data
    // Cannot manage users
    { resource: 'dryers', action: 'read' },
    { resource: 'dryers', action: 'update' },
    { resource: 'dryers', action: 'export' },
    { resource: 'reports', action: 'read' },
    { resource: 'reports', action: 'export' },
    { resource: 'analytics', action: 'read' },
    { resource: 'analytics', action: 'export' },
    { resource: 'alerts', action: 'read' },
    { resource: 'alerts', action: 'update' },
    { resource: 'presets', action: 'read' },
    { resource: 'presets', action: 'update' },
  ],
  regional_manager: [
    // View dryers in assigned region, view reports, update dryer status
    { resource: 'dryers', action: 'read' }, // Limited to region
    { resource: 'dryers', action: 'update' }, // Limited to status updates
    { resource: 'reports', action: 'read' }, // Limited to region
    { resource: 'analytics', action: 'read' }, // Limited to region
    { resource: 'alerts', action: 'read' }, // Limited to region
    { resource: 'alerts', action: 'update' },
    { resource: 'presets', action: 'read' },
  ],
  field_technician: [
    // View assigned dryers only, update basic info, view real-time data
    // Cannot export data
    { resource: 'dryers', action: 'read' }, // Limited to assigned dryers
    { resource: 'dryers', action: 'update' }, // Limited to basic info
    { resource: 'alerts', action: 'read' }, // Limited to assigned dryers
    { resource: 'alerts', action: 'update' },
    { resource: 'presets', action: 'read' },
  ],
};

// Check if a role has a specific permission
export function hasPermission(role: UserRole, resource: string, action: Permission['action']): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions.some(p => p.resource === resource && p.action === action);
}

// Check if user can manage other users
export function canManageUsers(role: UserRole): boolean {
  return role === 'super_admin';
}

// Check if user can assign roles
export function canAssignRoles(role: UserRole): boolean {
  return role === 'super_admin';
}

// Check if user can view all dryers
export function canViewAllDryers(role: UserRole): boolean {
  return role === 'super_admin' || role === 'admin';
}

// Check if user can export data
export function canExportData(role: UserRole): boolean {
  return hasPermission(role, 'dryers', 'export') || hasPermission(role, 'reports', 'export');
}

// Check if user can configure system
export function canConfigureSystem(role: UserRole): boolean {
  return role === 'super_admin';
}

// Check if user is admin level (super_admin or admin)
export function isAdminLevel(role: UserRole): boolean {
  return role === 'super_admin' || role === 'admin';
}

// Check if user needs regional filtering
export function needsRegionalFilter(role: UserRole): boolean {
  return role === 'regional_manager';
}

// Check if user needs dryer assignment filtering
export function needsDryerAssignmentFilter(role: UserRole): boolean {
  return role === 'field_technician';
}

// Get allowed actions for a resource
export function getAllowedActions(role: UserRole, resource: string): Permission['action'][] {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions
    .filter(p => p.resource === resource)
    .map(p => p.action);
}

// Check if user can update dryer status
export function canUpdateDryerStatus(role: UserRole): boolean {
  return role !== 'field_technician'; // Field technicians can only update basic info, not status
}

// Check if user can delete dryers
export function canDeleteDryers(role: UserRole): boolean {
  return role === 'super_admin';
}

// Check if user can create dryers
export function canCreateDryers(role: UserRole): boolean {
  return role === 'super_admin';
}
