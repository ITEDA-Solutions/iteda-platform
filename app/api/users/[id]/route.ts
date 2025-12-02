import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, profiles, userRoles } from '@/lib/schema';
import { AuthService } from '@/lib/auth';
import { eq } from 'drizzle-orm';

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
      const existingRole = await db.select().from(userRoles).where(eq(userRoles.userId, id)).limit(1);
      
      if (existingRole.length > 0) {
        // Update existing role
        await db
          .update(userRoles)
          .set({
            role,
            ...(region !== undefined && { region }),
          })
          .where(eq(userRoles.userId, id));
      } else {
        // Create new role
        await db.insert(userRoles).values({
          userId: id,
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
      .leftJoin(userRoles, eq(profiles.id, userRoles.userId))
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
