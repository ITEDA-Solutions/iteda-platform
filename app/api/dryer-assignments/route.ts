import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
export const dynamic = 'force-dynamic';
import { dryerAssignments, dryers, profiles } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { requireAdminLevel } from '@/lib/rbac-middleware';

// Get all dryer assignments
export async function GET(request: NextRequest) {
  try {
    // Only admins and super admins can view all assignments
    const { user: currentUser, error } = await requireAdminLevel(request);
    if (error) return error;

    const assignments = await db
      .select({
        id: dryerAssignments.id,
        technicianId: dryerAssignments.technicianId,
        dryerId: dryerAssignments.dryerId,
        assignedAt: dryerAssignments.assignedAt,
        assignedBy: dryerAssignments.assignedBy,
        notes: dryerAssignments.notes,
        technicianName: profiles.fullName,
        technicianEmail: profiles.email,
        dryerSerialNumber: dryers.serialNumber,
        dryerStatus: dryers.status,
      })
      .from(dryerAssignments)
      .leftJoin(profiles, eq(dryerAssignments.technicianId, profiles.id))
      .leftJoin(dryers, eq(dryerAssignments.dryerId, dryers.id))
      .orderBy(dryerAssignments.assignedAt);

    return NextResponse.json(assignments);
  } catch (error: any) {
    console.error('Error fetching dryer assignments:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch dryer assignments' },
      { status: 500 }
    );
  }
}

// Create new dryer assignment
export async function POST(request: NextRequest) {
  try {
    // Only admins and super admins can assign dryers
    const { user: currentUser, error } = await requireAdminLevel(request);
    if (error) return error;

    const { technicianId, dryerId, notes } = await request.json();

    if (!technicianId || !dryerId) {
      return NextResponse.json(
        { error: 'Technician ID and Dryer ID are required' },
        { status: 400 }
      );
    }

    // Check if technician exists and is a field technician
    const [technician] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, technicianId))
      .limit(1);

    if (!technician) {
      return NextResponse.json({ error: 'Technician not found' }, { status: 404 });
    }

    // Check if dryer exists
    const [dryer] = await db
      .select()
      .from(dryers)
      .where(eq(dryers.id, dryerId))
      .limit(1);

    if (!dryer) {
      return NextResponse.json({ error: 'Dryer not found' }, { status: 404 });
    }

    // Check if assignment already exists
    const existingAssignment = await db
      .select()
      .from(dryerAssignments)
      .where(eq(dryerAssignments.technicianId, technicianId))
      .where(eq(dryerAssignments.dryerId, dryerId))
      .limit(1);

    if (existingAssignment.length > 0) {
      return NextResponse.json(
        { error: 'This dryer is already assigned to this technician' },
        { status: 400 }
      );
    }

    // Create assignment
    const [assignment] = await db
      .insert(dryerAssignments)
      .values({
        technicianId,
        dryerId,
        assignedBy: currentUser.id,
        notes,
      })
      .returning();

    return NextResponse.json(assignment, { status: 201 });
  } catch (error: any) {
    console.error('Error creating dryer assignment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create dryer assignment' },
      { status: 500 }
    );
  }
}
