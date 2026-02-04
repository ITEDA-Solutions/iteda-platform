// Centralized Supabase Authentication for Server-Side
// This module provides unified authentication across all API routes

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from './supabase-db';
import { UserRole } from './permissions';

// Authenticated user with role information
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole | null;
  region: string | null;
}

export interface AuthResult {
  user: AuthenticatedUser | null;
  error: NextResponse | null;
}

// Extract token from request (Authorization header or cookies)
async function extractToken(request: NextRequest): Promise<string | null> {
  // First, try Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.replace('Bearer ', '');
  }

  // Fallback to cookies for SSR pages
  try {
    const cookieStore = await cookies();

    // Try different cookie names that Supabase might use
    const cookieNames = [
      'sb-access-token',
      'supabase-auth-token',
      `sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token`,
    ];

    for (const name of cookieNames) {
      const cookie = cookieStore.get(name);
      if (cookie?.value) {
        // Parse the cookie value if it's JSON
        try {
          const parsed = JSON.parse(cookie.value);
          if (parsed.access_token) {
            return parsed.access_token;
          }
          // If it's a simple string token
          return cookie.value;
        } catch {
          // Not JSON, use as-is
          return cookie.value;
        }
      }
    }
  } catch (error) {
    // Cookies not available in this context
    console.debug('Cookie extraction failed:', error);
  }

  return null;
}

// Get user role from database using Supabase client
async function getUserRole(userId: string): Promise<{ role: UserRole | null; region: string | null }> {
  try {
    const supabase = getSupabaseAdmin();

    const { data: roleData, error } = await supabase
      .from('staff_roles')
      .select('role, region')
      .eq('staff_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user role:', error);
      return { role: null, region: null };
    }

    return {
      role: (roleData?.role as UserRole) || null,
      region: roleData?.region || null,
    };
  } catch (error) {
    console.error('Error fetching user role:', error);
    return { role: null, region: null };
  }
}

// Verify Supabase token and get user with role
export async function verifyAuth(request: NextRequest): Promise<AuthResult> {
  const token = await extractToken(request);

  if (!token) {
    return {
      user: null,
      error: NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      ),
    };
  }

  try {
    const supabase = getSupabaseAdmin();

    // Verify the token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Token verification failed:', authError?.message);
      return {
        user: null,
        error: NextResponse.json(
          { error: 'Unauthorized - Invalid or expired token' },
          { status: 401 }
        ),
      };
    }

    // Get user role from database
    const { role, region } = await getUserRole(user.id);

    return {
      user: {
        id: user.id,
        email: user.email || '',
        role,
        region,
      },
      error: null,
    };
  } catch (error) {
    console.error('Auth verification error:', error);
    return {
      user: null,
      error: NextResponse.json(
        { error: 'Authentication error' },
        { status: 500 }
      ),
    };
  }
}

// Verify auth and require specific roles
export async function verifyAuthWithRole(
  request: NextRequest,
  allowedRoles: UserRole[]
): Promise<AuthResult> {
  const { user, error } = await verifyAuth(request);

  if (error) {
    return { user: null, error };
  }

  if (!user?.role || !allowedRoles.includes(user.role)) {
    return {
      user: null,
      error: NextResponse.json(
        {
          error: 'Forbidden - Insufficient permissions',
          required: allowedRoles,
          current: user?.role,
        },
        { status: 403 }
      ),
    };
  }

  return { user, error: null };
}

// Check if user can access a specific dryer
export async function canUserAccessDryer(
  user: AuthenticatedUser,
  dryerId: string
): Promise<boolean> {
  // Super admin and admin can access all dryers
  if (user.role === 'super_admin' || user.role === 'admin') {
    return true;
  }

  // Regional manager can access dryers in their region
  if (user.role === 'regional_manager') {
    if (!user.region) return false;

    const supabase = getSupabaseAdmin();
    const { data: dryer } = await supabase
      .from('dryers')
      .select('region_id')
      .eq('id', dryerId)
      .single();

    return dryer?.region_id === user.region;
  }

  // Field technician can only access assigned dryers
  if (user.role === 'field_technician') {
    const supabase = getSupabaseAdmin();
    const { data: assignment } = await supabase
      .from('dryer_assignments')
      .select('id')
      .eq('technician_id', user.id)
      .eq('dryer_id', dryerId)
      .maybeSingle();

    return !!assignment;
  }

  return false;
}

// Get dryer IDs accessible to a user
export async function getAccessibleDryerIds(user: AuthenticatedUser): Promise<string[] | null> {
  // Super admin and admin can access all dryers (null = no filter)
  if (user.role === 'super_admin' || user.role === 'admin') {
    return null;
  }

  const supabase = getSupabaseAdmin();

  // Regional manager gets dryers from their region
  if (user.role === 'regional_manager') {
    if (!user.region) return [];

    const { data: dryers } = await supabase
      .from('dryers')
      .select('id')
      .eq('region_id', user.region);

    return dryers?.map(d => d.id) || [];
  }

  // Field technician gets assigned dryers
  if (user.role === 'field_technician') {
    const { data: assignments } = await supabase
      .from('dryer_assignments')
      .select('dryer_id')
      .eq('technician_id', user.id);

    return assignments?.map(a => a.dryer_id) || [];
  }

  return [];
}
