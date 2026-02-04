// Role-Based Access Control Middleware for API routes
import { NextRequest, NextResponse } from 'next/server';
import {
  verifyAuth,
  verifyAuthWithRole,
  canUserAccessDryer,
  getAccessibleDryerIds,
  AuthenticatedUser
} from './supabase-auth';
import { UserRole, hasPermission, canManageUsers, canViewAllDryers, needsRegionalFilter, needsDryerAssignmentFilter } from './permissions';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    role?: UserRole;
    region?: string;
  };
}

// Middleware to verify authentication using Supabase
export async function requireAuth(request: NextRequest): Promise<{ user: AuthenticatedUser | null; error?: NextResponse }> {
  const { user, error } = await verifyAuth(request);

  if (error) {
    return { user: null, error };
  }

  return { user };
}

// Middleware to check if user has specific role
export async function requireRole(request: NextRequest, allowedRoles: UserRole[]): Promise<{ user: AuthenticatedUser | null; error?: NextResponse }> {
  const { user, error } = await verifyAuthWithRole(request, allowedRoles);

  if (error) {
    return { user: null, error };
  }

  return { user };
}

// Middleware to check if user has specific permission
export async function requirePermission(
  request: NextRequest,
  resource: string,
  action: 'create' | 'read' | 'update' | 'delete' | 'export'
): Promise<{ user: AuthenticatedUser | null; error?: NextResponse }> {
  const { user, error } = await requireAuth(request);

  if (error) return { user: null, error };

  if (!user?.role || !hasPermission(user.role, resource, action)) {
    return {
      user: null,
      error: NextResponse.json({
        error: `Forbidden - You don't have permission to ${action} ${resource}`,
        required: `${action}:${resource}`,
        role: user?.role
      }, { status: 403 })
    };
  }

  return { user };
}

// Middleware to check super admin access
export async function requireSuperAdmin(request: NextRequest): Promise<{ user: any; error?: NextResponse }> {
  return requireRole(request, ['super_admin']);
}

// Middleware to check admin level access (super_admin or admin)
export async function requireAdminLevel(request: NextRequest): Promise<{ user: any; error?: NextResponse }> {
  return requireRole(request, ['super_admin', 'admin']);
}

// Re-export access control functions from supabase-auth
export { canUserAccessDryer as canAccessDryer, getAccessibleDryerIds } from './supabase-auth';

// Validate user management permissions
export async function validateUserManagementAccess(request: NextRequest): Promise<{ user: AuthenticatedUser | null; error?: NextResponse }> {
  const { user, error } = await requireAuth(request);

  if (error) return { user: null, error };

  if (!user?.role || !canManageUsers(user.role)) {
    return {
      user: null,
      error: NextResponse.json({
        error: 'Forbidden - Only Super Admins can manage users',
        role: user?.role
      }, { status: 403 })
    };
  }

  return { user };
}

// Validate export permissions
export async function validateExportAccess(request: NextRequest): Promise<{ user: AuthenticatedUser | null; error?: NextResponse }> {
  const { user, error } = await requireAuth(request);

  if (error) return { user: null, error };

  if (!user?.role || user.role === 'field_technician') {
    return {
      user: null,
      error: NextResponse.json({
        error: 'Forbidden - Field Technicians cannot export data',
        role: user?.role
      }, { status: 403 })
    };
  }

  return { user };
}
