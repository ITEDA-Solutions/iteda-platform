import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { AuthService } from '@/lib/auth';

// Update user profile and role
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;
    const { fullName, phone, role, region } = await request.json();

    // Check if profile exists (profile is linked to auth.users)
    const { data: existingProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', id)
      .single();

    if (profileError || !existingProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update profile if provided
    if (fullName !== undefined || phone !== undefined) {
      const updateData: Record<string, any> = {};
      if (fullName !== undefined) updateData.full_name = fullName;
      if (phone !== undefined) updateData.phone = phone;

      await supabaseAdmin
        .from('profiles')
        .update(updateData)
        .eq('id', id);
    }

    // Update role if provided
    if (role !== undefined) {
      // Check if user role exists
      const { data: existingRole } = await supabaseAdmin
        .from('user_roles')
        .select('id')
        .eq('user_id', id)
        .single();

      if (existingRole) {
        // Update existing role
        const updateData: Record<string, any> = { role };
        if (region !== undefined) updateData.region = region;

        await supabaseAdmin
          .from('user_roles')
          .update(updateData)
          .eq('user_id', id);
      } else {
        // Create new role
        await supabaseAdmin
          .from('user_roles')
          .insert({
            user_id: id,
            role,
            region,
          });
      }
    }

    // Return updated user data
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    const { data: userRole } = await supabaseAdmin
      .from('user_roles')
      .select('role, region')
      .eq('user_id', id)
      .single();

    return NextResponse.json({
      id: profile?.id,
      email: profile?.email,
      createdAt: profile?.created_at,
      fullName: profile?.full_name || null,
      phone: profile?.phone || null,
      avatarUrl: profile?.avatar_url || null,
      role: userRole?.role || null,
      region: userRole?.region || null,
    });
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update user' },
      { status: 500 }
    );
  }
}

// Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;

    // Prevent deleting self
    if (currentUser.id === id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    // Check if profile exists
    const { data: existingProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', id)
      .single();

    if (profileError || !existingProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete user via Supabase Auth Admin API (this will cascade delete profile due to FK)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(id);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete user' },
      { status: 500 }
    );
  }
}
