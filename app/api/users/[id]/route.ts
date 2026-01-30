import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
export const dynamic = 'force-dynamic';
import { staff as users, profiles, staffRoles as userRoles } from '@/lib/schema';
import { AuthService } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { validateUserManagementAccess } from '@/lib/rbac-middleware';

// Update user profile and role
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify super admin access (only super admins can update users)
    const { user: currentUser, error } = await validateUserManagementAccess(request);
    if (error) return error;

    const { id } = params;
    const { fullName, phone, role, region } = await request.json();

    // Check if user exists
    const existingUser = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (existingUser.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update profile if provided
    if (fullName !== undefined || phone !== undefined) {
      await db
        .update(profiles)
        .set({
          ...(fullName !== undefined && { fullName }),
          ...(phone !== undefined && { phone }),
        })
        .where(eq(profiles.id, id));
    }

    // Update role if provided
    if (role !== undefined) {
      // Check if user role exists
      const existingRole = await db.select().from(userRoles).where(eq(userRoles.staffId, id)).limit(1);

      if (existingRole.length > 0) {
        // Update existing role
        await db
          .update(userRoles)
          .set({
            role,
            ...(region !== undefined && { region }),
          })
          .where(eq(userRoles.staffId, id));
      } else {
        // Create new role
        await db.insert(userRoles).values({
          staffId: id,
          role,
          region,
        });
      }
    }

    // Return updated user data
    const updatedUser = await db
      .select({
        id: users.id,
        email: users.email,
        createdAt: users.createdAt,
        fullName: profiles.fullName,
        phone: profiles.phone,
        role: userRoles.role,
        region: userRoles.region,
      })
      .from(users)
      .leftJoin(profiles, eq(users.id, profiles.id))
      .leftJoin(userRoles, eq(profiles.id, userRoles.staffId))
      .where(eq(users.id, id))
      .limit(1);

    return NextResponse.json(updatedUser[0]);
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
    // Verify super admin access (only super admins can delete users)
    const { user: currentUser, error } = await validateUserManagementAccess(request);
    if (error) return error;

    const { id } = params;

    // Prevent deleting self
    if (currentUser.id === id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    // Check if user exists
    const existingUser = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (existingUser.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete user (cascade will handle profiles and roles)
    await db.delete(users).where(eq(users.id, id));

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete user' },
      { status: 500 }
    );
  }
}
