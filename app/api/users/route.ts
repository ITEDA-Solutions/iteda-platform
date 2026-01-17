import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { AuthService } from '@/lib/auth';

// Get all users with their profiles and roles
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await AuthService.verifyToken(token);
    if (!currentUser) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check if user is admin
    const isAdmin = await AuthService.isAdmin(currentUser.id);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get all profiles (profiles are linked to auth.users)
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at');

    if (profilesError) {
      throw new Error(profilesError.message);
    }

    // Get roles for each profile
    const allUsers = await Promise.all(
      (profiles || []).map(async (profile) => {
        const { data: userRole } = await supabaseAdmin
          .from('user_roles')
          .select('role, region, created_at')
          .eq('user_id', profile.id)
          .single();

        return {
          id: profile.id,
          email: profile.email,
          createdAt: profile.created_at,
          fullName: profile.full_name,
          phone: profile.phone,
          avatarUrl: profile.avatar_url,
          role: userRole?.role || null,
          region: userRole?.region || null,
          roleCreatedAt: userRole?.created_at || null,
        };
      })
    );

    return NextResponse.json(allUsers);
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// Create new user (using Supabase Auth Admin API)
export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await AuthService.verifyToken(token);
    if (!currentUser) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const isAdmin = await AuthService.isAdmin(currentUser.id);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { email, password, fullName, phone, role, region } = await request.json();

    if (!email || !password || !role) {
      return NextResponse.json(
        { error: 'Email, password, and role are required' },
        { status: 400 }
      );
    }

    // Create user via Supabase Auth Admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for admin-created users
      user_metadata: {
        full_name: fullName,
      },
    });

    if (authError || !authData.user) {
      throw new Error(authError?.message || 'Failed to create user');
    }

    // The trigger will auto-create the profile, but we may need to update phone
    if (phone) {
      await supabaseAdmin
        .from('profiles')
        .update({ phone })
        .eq('id', authData.user.id);
    }

    // Assign role
    const { data: userRole, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: authData.user.id,
        role,
        region,
      })
      .select()
      .single();

    if (roleError) {
      console.error('Error assigning role:', roleError);
    }

    // Fetch the complete profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    return NextResponse.json({
      id: authData.user.id,
      email: authData.user.email,
      fullName: profile?.full_name || fullName,
      phone: profile?.phone || phone,
      avatarUrl: profile?.avatar_url,
      role: userRole?.role || role,
      region: userRole?.region || region,
      createdAt: authData.user.created_at,
    });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create user' },
      { status: 500 }
    );
  }
}
