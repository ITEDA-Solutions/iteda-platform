import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-db';
import { validateUserManagementAccess } from '@/lib/rbac-middleware';

export const dynamic = 'force-dynamic';

// Get all users with their profiles and roles
export async function GET(request: NextRequest) {
  try {
    // Verify super admin access (only super admins can manage users)
    const { user: currentUser, error } = await validateUserManagementAccess(request);
    if (error) return error;

    const supabase = getSupabaseAdmin();

    // Get all profiles with their roles
    const { data: profiles, error: dbError } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        phone,
        created_at,
        staff_roles(role, region, created_at)
      `)
      .order('created_at', { ascending: false });

    if (dbError) {
      console.error('Error fetching users:', dbError);
      return NextResponse.json(
        { error: 'Failed to fetch users', details: dbError.message },
        { status: 500 }
      );
    }

    // Transform to expected format
    const allUsers = profiles?.map(p => ({
      id: p.id,
      email: p.email,
      createdAt: p.created_at,
      fullName: p.full_name,
      phone: p.phone,
      role: p.staff_roles?.[0]?.role || null,
      region: p.staff_roles?.[0]?.region || null,
      roleCreatedAt: p.staff_roles?.[0]?.created_at || null,
    })) || [];

    return NextResponse.json(allUsers);
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// Create new user
export async function POST(request: NextRequest) {
  try {
    // Verify super admin access (only super admins can create users)
    const { user: currentUser, error } = await validateUserManagementAccess(request);
    if (error) return error;

    const { email, password, fullName, phone, role, region } = await request.json();

    if (!email || !password || !role) {
      return NextResponse.json(
        { error: 'Email, password, and role are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName || email,
      },
    });

    if (authError) {
      throw new Error(`Failed to create user: ${authError.message}`);
    }

    if (!authData.user) {
      throw new Error('User creation failed - no user returned');
    }

    // Create profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        email,
        full_name: fullName || email,
        phone,
      })
      .select()
      .single();

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Rollback: delete the auth user
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw new Error(`Failed to create profile: ${profileError.message}`);
    }

    // Create user role
    const { data: userRole, error: roleError } = await supabase
      .from('staff_roles')
      .insert({
        staff_id: authData.user.id,
        role,
        region,
      })
      .select()
      .single();

    if (roleError) {
      // Rollback: delete the auth user
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw new Error(`Failed to assign role: ${roleError.message}`);
    }

    return NextResponse.json({
      id: authData.user.id,
      email: authData.user.email,
      fullName: profile.full_name,
      phone: profile.phone,
      role: userRole.role,
      region: userRole.region,
      createdAt: profile.created_at,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create user' },
      { status: 500 }
    );
  }
}
