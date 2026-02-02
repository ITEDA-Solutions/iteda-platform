import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// PUT - Update staff member
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { full_name, role, region_id } = body;

    // Update profile
    if (full_name) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name })
        .eq('id', params.id);

      if (profileError) {
        throw new Error(`Failed to update profile: ${profileError.message}`);
      }
    }

    // Update role
    if (role) {
      const validRoles = ['super_admin', 'admin', 'regional_manager', 'field_technician'];
      if (!validRoles.includes(role)) {
        return NextResponse.json(
          { error: 'Invalid role' },
          { status: 400 }
        );
      }

      const { error: roleError } = await supabase
        .from('staff_roles')
        .update({
          role: role,
          region: region_id !== undefined ? region_id : undefined,
        })
        .eq('staff_id', params.id);

      if (roleError) {
        throw new Error(`Failed to update role: ${roleError.message}`);
      }
    }

    return NextResponse.json(
      { success: true, message: 'Staff member updated successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error updating staff member:', error);
    return NextResponse.json(
      { error: 'Failed to update staff member', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Remove staff member
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Delete user role
    const { error: roleError } = await supabase
      .from('staff_roles')
      .delete()
      .eq('staff_id', params.id);

    if (roleError) {
      console.error('Error deleting user role:', roleError);
    }

    // Delete profile
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', params.id);

    if (profileError) {
      console.error('Error deleting profile:', profileError);
    }

    // Delete auth user
    const { error: authError } = await supabase.auth.admin.deleteUser(params.id);

    if (authError) {
      throw new Error(`Failed to delete user: ${authError.message}`);
    }

    return NextResponse.json(
      { success: true, message: 'Staff member deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error deleting staff member:', error);
    return NextResponse.json(
      { error: 'Failed to delete staff member', details: error.message },
      { status: 500 }
    );
  }
}
