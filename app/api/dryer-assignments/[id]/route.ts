import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
export const dynamic = 'force-dynamic';
import { dryerAssignments } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { requireAdminLevel } from '@/lib/rbac-middleware';

// Delete dryer assignment
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Only admins and super admins can remove assignments
    const { user: currentUser, error } = await requireAdminLevel(request);
    if (error) return error;

    const { id } = params;

    // Check if assignment exists
    const existingAssignment = await db
      .select()
      .from(dryerAssignments)
      .where(eq(dryerAssignments.id, id))
      .limit(1);

    if (existingAssignment.length === 0) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Delete assignment
    await db.delete(dryerAssignments).where(eq(dryerAssignments.id, id));

    return NextResponse.json({ message: 'Assignment deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting dryer assignment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete dryer assignment' },
      { status: 500 }
    );
  }
}
