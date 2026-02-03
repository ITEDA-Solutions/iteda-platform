import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-db';
import { validateUserManagementAccess } from '@/lib/rbac-middleware';

export const dynamic = 'force-dynamic';

// Update user profile and role
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify super admin access (only super admins can update users)
    const { user: currentUser, error } = await validateUserManagementAccess(request);
    if (error) return error;

    const { id } = await params;
    const { fullName, phone, role, region } = await request.json();

    const supabase = getSupabaseAdmin();

    // Check if user exists
    const { data: existingUser, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (checkError || !existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update profile if provided
    if (fullName !== undefined || phone !== undefined) {
      const updateData: any = {};
      if (fullName !== undefined) updateData.full_name = fullName;
      if (phone !== undefined) updateData.phone = phone;

      const { error: profileError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', id);

      if (profileError) {
        throw new Error(`Failed to update profile: ${profileError.message}`);
      }
    }

    // Update role if provided
    if (role !== undefined) {
      // Check if user role exists
      const { data: existingRole } = await supabase
        .from('staff_roles')
        .select('id')
        .eq('staff_id', id)
        .maybeSingle();

      if (existingRole) {
        // Update existing role
        const updateData: any = { role };
        if (region !== undefined) updateData.region = region;

        const { error: roleError } = await supabase
          .from('staff_roles')
          .update(updateData)
          .eq('staff_id', id);

        if (roleError) {
          throw new Error(`Failed to update role: ${roleError.message}`);
        }
      } else {
        // Create new role
        const { error: roleError } = await supabase
          .from('staff_roles')
          .insert({
            staff_id: id,
            role,
            region,
          });

        if (roleError) {
          throw new Error(`Failed to create role: ${roleError.message}`);
        }
      }
    }

    // Return updated user data
    const { data: updatedUser, error: fetchError } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        phone,
        created_at,
        staff_roles(role, region)
      `)
      .eq('id', id)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch updated user: ${fetchError.message}`);
    }

    return NextResponse.json({
      id: updatedUser.id,
      email: updatedUser.email,
      createdAt: updatedUser.created_at,
      fullName: updatedUser.full_name,
      phone: updatedUser.phone,
      role: updatedUser.staff_roles?.[0]?.role || null,
      region: updatedUser.staff_roles?.[0]?.region || null,
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify super admin access (only super admins can delete users)
    const { user: currentUser, error } = await validateUserManagementAccess(request);
    if (error) return error;

    const { id } = await params;

    // Prevent deleting self
    if (currentUser.id === id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Check if user exists
    const { data: existingUser, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (checkError || !existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete user role first
    const { error: roleError } = await supabase
      .from('staff_roles')
      .delete()
      .eq('staff_id', id);

    if (roleError) {
      console.error('Error deleting user role:', roleError);
    }

    // Delete profile
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);

    if (profileError) {
      console.error('Error deleting profile:', profileError);
    }

    // Delete auth user
    const { error: authError } = await supabase.auth.admin.deleteUser(id);

    if (authError) {
      throw new Error(`Failed to delete user: ${authError.message}`);
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
