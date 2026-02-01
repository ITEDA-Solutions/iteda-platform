import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
export const dynamic = 'force-dynamic';
import { dryers, regions, dryerAssignments } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { requireAuth, requirePermission, canAccessDryer } from '@/lib/rbac-middleware';
import { canUpdateDryerStatus, needsRegionalFilter, needsDryerAssignmentFilter } from '@/lib/permissions';

// GET - Get single dryer by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, error } = await requireAuth(request);
    if (error) return error;

    const dryerId = params.id;

    // Check if user can access this dryer
    const hasAccess = await canAccessDryer(user.id, dryerId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'You do not have access to this dryer' },
        { status: 403 }
      );
    }

    // Get dryer details
    const [dryer] = await db
      .select({
        id: dryers.id,
        dryerId: dryers.dryerId,
        serialNumber: dryers.serialNumber,
        status: dryers.status,
        deploymentDate: dryers.deploymentDate,
        locationLatitude: dryers.locationLatitude,
        locationLongitude: dryers.locationLongitude,
        locationAddress: dryers.locationAddress,
        regionId: dryers.regionId,
        createdAt: dryers.createdAt,
        updatedAt: dryers.updatedAt,
        regionName: regions.name,
        regionCode: regions.code,
      })
      .from(dryers)
      .leftJoin(regions, eq(dryers.regionId, regions.id))
      .where(eq(dryers.id, dryerId))
      .limit(1);

    if (!dryer) {
      return NextResponse.json(
        { error: 'Dryer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(dryer);
  } catch (error: any) {
    console.error('Error fetching dryer:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch dryer' },
      { status: 500 }
    );
  }
}

// PUT - Update dryer
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, error } = await requireAuth(request);
    if (error) return error;

    const dryerId = params.id;

    // Check if user can access this dryer
    const hasAccess = await canAccessDryer(user.id, dryerId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'You do not have access to this dryer' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      status,
      locationLatitude,
      locationLongitude,
      locationAddress,
      regionId,
    } = body;

    // Check if dryer exists
    const [existingDryer] = await db
      .select()
      .from(dryers)
      .where(eq(dryers.id, dryerId))
      .limit(1);

    if (!existingDryer) {
      return NextResponse.json(
        { error: 'Dryer not found' },
        { status: 404 }
      );
    }

    // Field technicians can only update location info, not status
    if (user.role === 'field_technician' && status && status !== existingDryer.status) {
      return NextResponse.json(
        { error: 'Field technicians cannot update dryer status' },
        { status: 403 }
      );
    }

    // Regional managers can only update status, not other fields
    if (user.role === 'regional_manager') {
      if (!canUpdateDryerStatus(user.role)) {
        return NextResponse.json(
          { error: 'You cannot update dryer status' },
          { status: 403 }
        );
      }
      // Only allow status updates for regional managers
      if (locationLatitude || locationLongitude || locationAddress || regionId) {
        return NextResponse.json(
          { error: 'Regional managers can only update dryer status' },
          { status: 403 }
        );
      }
    }

    // Validate region if regionId is provided
    if (regionId) {
      const [region] = await db
        .select()
        .from(regions)
        .where(eq(regions.id, regionId))
        .limit(1);

      if (!region) {
        return NextResponse.json(
          { error: 'Region not found' },
          { status: 404 }
        );
      }
    }

    // Build update object
    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (locationLatitude !== undefined) updateData.locationLatitude = locationLatitude;
    if (locationLongitude !== undefined) updateData.locationLongitude = locationLongitude;
    if (locationAddress !== undefined) updateData.locationAddress = locationAddress;
    if (regionId !== undefined) updateData.regionId = regionId;

    // Update dryer
    const [updatedDryer] = await db
      .update(dryers)
      .set(updateData)
      .where(eq(dryers.id, dryerId))
      .returning();

    return NextResponse.json(updatedDryer);
  } catch (error: any) {
    console.error('Error updating dryer:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update dryer' },
      { status: 500 }
    );
  }
}

// DELETE - Delete dryer (super admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Only super admins can delete dryers
    const { user, error } = await requirePermission(request, 'dryers', 'delete');
    if (error) return error;

    const dryerId = params.id;

    // Check if dryer exists
    const [existingDryer] = await db
      .select()
      .from(dryers)
      .where(eq(dryers.id, dryerId))
      .limit(1);

    if (!existingDryer) {
      return NextResponse.json(
        { error: 'Dryer not found' },
        { status: 404 }
      );
    }

    // Delete dryer (cascade will handle assignments)
    await db.delete(dryers).where(eq(dryers.id, dryerId));

    return NextResponse.json(
      { message: 'Dryer deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error deleting dryer:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete dryer' },
      { status: 500 }
    );
  }
}
