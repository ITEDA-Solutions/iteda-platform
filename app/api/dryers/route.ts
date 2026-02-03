import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-db';
import { requireAuth, requirePermission } from '@/lib/rbac-middleware';
import { needsRegionalFilter, needsDryerAssignmentFilter } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

// GET - List dryers (filtered by role)
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const { user, error } = await requireAuth(request);
    if (error) return error;

    if (!user.role) {
      return NextResponse.json(
        { error: 'User role not found' },
        { status: 403 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Super admin and admin can view all dryers
    if (user.role === 'super_admin' || user.role === 'admin') {
      const { data: dryersData, error: dbError } = await supabase
        .from('dryers')
        .select(`
          id,
          dryer_id,
          serial_number,
          status,
          deployment_date,
          location_latitude,
          location_longitude,
          location_address,
          region_id,
          created_at,
          updated_at,
          region:regions(name)
        `)
        .order('created_at', { ascending: false });

      if (dbError) {
        console.error('Error fetching dryers:', dbError);
        return NextResponse.json(
          { error: 'Failed to fetch dryers', details: dbError.message },
          { status: 500 }
        );
      }

      // Transform to camelCase for frontend consistency
      const transformedDryers = dryersData?.map(d => {
        // Supabase returns joined data - handle both array and object cases
        const reg = Array.isArray(d.region) ? d.region[0] : d.region;
        return {
          id: d.id,
          dryerId: d.dryer_id,
          serialNumber: d.serial_number,
          status: d.status,
          deploymentDate: d.deployment_date,
          locationLatitude: d.location_latitude,
          locationLongitude: d.location_longitude,
          locationAddress: d.location_address,
          regionId: d.region_id,
          createdAt: d.created_at,
          updatedAt: d.updated_at,
          regionName: reg?.name || null,
        };
      }) || [];

      return NextResponse.json(transformedDryers);
    }

    // Regional manager can only view dryers in their region
    if (needsRegionalFilter(user.role)) {
      if (!user.region) {
        return NextResponse.json(
          { error: 'Regional manager must have an assigned region' },
          { status: 403 }
        );
      }

      const { data: dryersData, error: dbError } = await supabase
        .from('dryers')
        .select(`
          id,
          dryer_id,
          serial_number,
          status,
          deployment_date,
          location_latitude,
          location_longitude,
          location_address,
          region_id,
          created_at,
          updated_at,
          region:regions(name)
        `)
        .eq('region_id', user.region)
        .order('created_at', { ascending: false });

      if (dbError) {
        console.error('Error fetching dryers:', dbError);
        return NextResponse.json(
          { error: 'Failed to fetch dryers', details: dbError.message },
          { status: 500 }
        );
      }

      const transformedDryers = dryersData?.map(d => {
        const reg = Array.isArray(d.region) ? d.region[0] : d.region;
        return {
          id: d.id,
          dryerId: d.dryer_id,
          serialNumber: d.serial_number,
          status: d.status,
          deploymentDate: d.deployment_date,
          locationLatitude: d.location_latitude,
          locationLongitude: d.location_longitude,
          locationAddress: d.location_address,
          regionId: d.region_id,
          createdAt: d.created_at,
          updatedAt: d.updated_at,
          regionName: reg?.name || null,
        };
      }) || [];

      return NextResponse.json(transformedDryers);
    }

    // Field technician can only view assigned dryers
    if (needsDryerAssignmentFilter(user.role)) {
      // Get assigned dryer IDs
      const { data: assignments, error: assignError } = await supabase
        .from('dryer_assignments')
        .select('dryer_id')
        .eq('technician_id', user.id);

      if (assignError) {
        console.error('Error fetching assignments:', assignError);
        return NextResponse.json(
          { error: 'Failed to fetch dryer assignments', details: assignError.message },
          { status: 500 }
        );
      }

      const assignedDryerIds = assignments?.map(a => a.dryer_id) || [];

      if (assignedDryerIds.length === 0) {
        return NextResponse.json([]);
      }

      const { data: dryersData, error: dbError } = await supabase
        .from('dryers')
        .select(`
          id,
          dryer_id,
          serial_number,
          status,
          deployment_date,
          location_latitude,
          location_longitude,
          location_address,
          region_id,
          created_at,
          updated_at,
          region:regions(name)
        `)
        .in('id', assignedDryerIds)
        .order('created_at', { ascending: false });

      if (dbError) {
        console.error('Error fetching dryers:', dbError);
        return NextResponse.json(
          { error: 'Failed to fetch dryers', details: dbError.message },
          { status: 500 }
        );
      }

      const transformedDryers = dryersData?.map(d => {
        const reg = Array.isArray(d.region) ? d.region[0] : d.region;
        return {
          id: d.id,
          dryerId: d.dryer_id,
          serialNumber: d.serial_number,
          status: d.status,
          deploymentDate: d.deployment_date,
          locationLatitude: d.location_latitude,
          locationLongitude: d.location_longitude,
          locationAddress: d.location_address,
          regionId: d.region_id,
          createdAt: d.created_at,
          updatedAt: d.updated_at,
          regionName: reg?.name || null,
        };
      }) || [];

      return NextResponse.json(transformedDryers);
    }

    return NextResponse.json(
      { error: 'Invalid user role' },
      { status: 403 }
    );
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

    const supabase = getSupabaseAdmin();

    // Check if dryer already exists
    const { data: existing, error: checkError } = await supabase
      .from('dryers')
      .select('id')
      .eq('dryer_id', dryerId)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing dryer:', checkError);
      return NextResponse.json(
        { error: 'Failed to check existing dryer', details: checkError.message },
        { status: 500 }
      );
    }

    if (existing) {
      return NextResponse.json(
        { error: 'Dryer with this ID already exists' },
        { status: 400 }
      );
    }

    // Check if region exists if regionId is provided
    if (regionId) {
      const { data: region, error: regionError } = await supabase
        .from('regions')
        .select('id')
        .eq('id', regionId)
        .maybeSingle();

      if (regionError || !region) {
        return NextResponse.json(
          { error: 'Region not found' },
          { status: 404 }
        );
      }
    }

    // Create dryer
    const { data: newDryer, error: insertError } = await supabase
      .from('dryers')
      .insert({
        dryer_id: dryerId,
        serial_number: serialNumber,
        status: status || 'idle',
        deployment_date: deploymentDate,
        location_latitude: locationLatitude,
        location_longitude: locationLongitude,
        location_address: locationAddress,
        region_id: regionId,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating dryer:', insertError);
      return NextResponse.json(
        { error: 'Failed to create dryer', details: insertError.message },
        { status: 500 }
      );
    }

    // Transform to camelCase for response
    const transformedDryer = {
      id: newDryer.id,
      dryerId: newDryer.dryer_id,
      serialNumber: newDryer.serial_number,
      status: newDryer.status,
      deploymentDate: newDryer.deployment_date,
      locationLatitude: newDryer.location_latitude,
      locationLongitude: newDryer.location_longitude,
      locationAddress: newDryer.location_address,
      regionId: newDryer.region_id,
      createdAt: newDryer.created_at,
      updatedAt: newDryer.updated_at,
    };

    return NextResponse.json(transformedDryer, { status: 201 });
  } catch (error: any) {
    console.error('Error creating dryer:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create dryer' },
      { status: 500 }
    );
  }
}
