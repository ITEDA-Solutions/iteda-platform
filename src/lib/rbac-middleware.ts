// Role-Based Access Control Middleware for API routes
import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from './auth';
import { UserRole, hasPermission, canManageUsers, canViewAllDryers, needsRegionalFilter, needsDryerAssignmentFilter } from './permissions';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    role?: UserRole;
    region?: string;
  };
}

// Middleware to verify authentication
export async function requireAuth(request: NextRequest): Promise<{ user: any; error?: NextResponse }> {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return {
      user: null,
      error: NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 })
    };
  }

  const user = await AuthService.verifyToken(token);
  if (!user) {
    return {
      user: null,
      error: NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 })
    };
  }

  return { user };
}

// Middleware to check if user has specific role
export async function requireRole(request: NextRequest, allowedRoles: UserRole[]): Promise<{ user: any; error?: NextResponse }> {
  const { user, error } = await requireAuth(request);
  
  if (error) return { user: null, error };

  if (!user.role || !allowedRoles.includes(user.role)) {
    return {
      user: null,
      error: NextResponse.json({ 
        error: 'Forbidden - Insufficient permissions',
        required: allowedRoles,
        current: user.role 
      }, { status: 403 })
    };
  }

  return { user };
}

// Middleware to check if user has specific permission
export async function requirePermission(
  request: NextRequest, 
  resource: string, 
  action: 'create' | 'read' | 'update' | 'delete' | 'export'
): Promise<{ user: any; error?: NextResponse }> {
  const { user, error } = await requireAuth(request);
  
  if (error) return { user: null, error };

  if (!user.role || !hasPermission(user.role, resource, action)) {
    return {
      user: null,
      error: NextResponse.json({ 
        error: `Forbidden - You don't have permission to ${action} ${resource}`,
        required: `${action}:${resource}`,
        role: user.role 
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

// Get filtered dryer IDs based on user role
export async function getAccessibleDryerIds(userId: string, role: UserRole, region?: string): Promise<string[] | null> {
  // Super admin and admin can access all dryers
  if (canViewAllDryers(role)) {
    return null; // null means no filter needed (all dryers)
  }

  // Regional manager can access dryers in their region
  if (needsRegionalFilter(role)) {
    if (!region) {
      return []; // No region assigned, no access
    }
    // Return null to indicate region-based filtering should be applied in the query
    return null;
  }

  // Field technician can only access assigned dryers
  if (needsDryerAssignmentFilter(role)) {
    const assignedDryerIds = await AuthService.getAssignedDryerIds(userId);
    return assignedDryerIds;
  }

  return [];
}

// Check if user can perform action on specific dryer
export async function canAccessDryer(userId: string, dryerId: string): Promise<boolean> {
  return AuthService.canAccessDryer(userId, dryerId);
}

// Validate user management permissions
export async function validateUserManagementAccess(request: NextRequest): Promise<{ user: any; error?: NextResponse }> {
  const { user, error } = await requireAuth(request);
  
  if (error) return { user: null, error };

  if (!user.role || !canManageUsers(user.role)) {
    return {
      user: null,
      error: NextResponse.json({ 
        error: 'Forbidden - Only Super Admins can manage users',
        role: user.role 
      }, { status: 403 })
    };
  }

  return { user };
}

// Validate export permissions
export async function validateExportAccess(request: NextRequest): Promise<{ user: any; error?: NextResponse }> {
  const { user, error } = await requireAuth(request);
  
  if (error) return { user: null, error };

  if (!user.role || user.role === 'field_technician') {
    return {
      user: null,
      error: NextResponse.json({ 
        error: 'Forbidden - Field Technicians cannot export data',
        role: user.role 
      }, { status: 403 })
    };
  }

  return { user };
}
