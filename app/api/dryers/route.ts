import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
export const dynamic = 'force-dynamic';
import { dryers, regions, dryerAssignments } from '@/lib/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { requireAuth, requirePermission } from '@/lib/rbac-middleware';
import { needsRegionalFilter, needsDryerAssignmentFilter } from '@/lib/permissions';

// GET - List dryers (filtered by role)
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const { user, error } = await requireAuth(request);
    if (error) return error;

    // Build query based on role
    let dryersQuery;

    if (!user.role) {
      return NextResponse.json(
        { error: 'User role not found' },
        { status: 403 }
      );
    }

    // Super admin and admin can view all dryers
    if (user.role === 'super_admin' || user.role === 'admin') {
      dryersQuery = await db
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
        })
        .from(dryers)
        .leftJoin(regions, eq(dryers.regionId, regions.id))
        .orderBy(dryers.createdAt);
    }
    // Regional manager can only view dryers in their region
    else if (needsRegionalFilter(user.role)) {
      if (!user.region) {
        return NextResponse.json(
          { error: 'Regional manager must have an assigned region' },
          { status: 403 }
        );
      }

      dryersQuery = await db
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
        })
        .from(dryers)
        .leftJoin(regions, eq(dryers.regionId, regions.id))
        .where(eq(dryers.regionId, user.region))
        .orderBy(dryers.createdAt);
    }
    // Field technician can only view assigned dryers
    else if (needsDryerAssignmentFilter(user.role)) {
      // Get assigned dryer IDs
      const assignments = await db
        .select({ dryerId: dryerAssignments.dryerId })
        .from(dryerAssignments)
        .where(eq(dryerAssignments.technicianId, user.id));

      const assignedDryerIds = assignments.map(a => a.dryerId);

      if (assignedDryerIds.length === 0) {
        return NextResponse.json([]);
      }

      dryersQuery = await db
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
        })
        .from(dryers)
        .leftJoin(regions, eq(dryers.regionId, regions.id))
        .where(inArray(dryers.id, assignedDryerIds))
        .orderBy(dryers.createdAt);
    } else {
      return NextResponse.json(
        { error: 'Invalid user role' },
        { status: 403 }
      );
    }

    return NextResponse.json(dryersQuery);
  } catch (error: any) {
    console.error('Error fetching dryers:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch dryers' },
      { status: 500 }
    );
  }
}

// POST - Create new dryer (super admin only)
export async function POST(request: NextRequest) {
  try {
    // Only super admins can create dryers
    const { user, error } = await requirePermission(request, 'dryers', 'create');
    if (error) return error;

    const body = await request.json();
    const {
      dryerId,
      serialNumber,
      status,
      deploymentDate,
      locationLatitude,
      locationLongitude,
      locationAddress,
      regionId,
    } = body;

    if (!dryerId || !serialNumber || !deploymentDate) {
      return NextResponse.json(
        { error: 'Dryer ID, serial number, and deployment date are required' },
        { status: 400 }
      );
    }

    // Check if dryer already exists
    const existing = await db
      .select()
      .from(dryers)
      .where(eq(dryers.dryerId, dryerId))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Dryer with this ID already exists' },
        { status: 400 }
      );
    }

    // Check if region exists if regionId is provided
    if (regionId) {
      const region = await db
        .select()
        .from(regions)
        .where(eq(regions.id, regionId))
        .limit(1);

      if (region.length === 0) {
        return NextResponse.json(
          { error: 'Region not found' },
          { status: 404 }
        );
      }
    }

    // Create dryer
    const [newDryer] = await db
      .insert(dryers)
      .values({
        dryerId,
        serialNumber,
        status: status || 'idle',
        deploymentDate: new Date(deploymentDate),
        locationLatitude,
        locationLongitude,
        locationAddress,
        regionId,
      })
      .returning();

    return NextResponse.json(newDryer, { status: 201 });
  } catch (error: any) {
    console.error('Error creating dryer:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create dryer' },
      { status: 500 }
    );
  }
}
