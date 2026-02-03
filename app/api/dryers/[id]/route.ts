import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth, requirePermission, canAccessDryer } from '@/lib/rbac-middleware';
import { canUpdateDryerStatus } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Get single dryer by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await requireAuth(request);
    if (error) return error;
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    // Await params in Next.js 16+
    const { id: dryerId } = await params;

    // Check if user can access this dryer
    const hasAccess = await canAccessDryer(user, dryerId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'You do not have access to this dryer' },
        { status: 403 }
      );
    }

    // Get dryer details using Supabase
    const { data: dryer, error: dbError } = await supabase
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
        battery_level,
        battery_voltage,
        signal_strength,
        last_communication,
        active_alerts_count,
        total_runtime_hours,
        num_temp_sensors,
        num_humidity_sensors,
        num_fans,
        num_heaters,
        solar_capacity_w,
        battery_capacity_ah,
        created_at,
        updated_at,
        region:regions(name, code),
        owner:dryer_owners(name, phone, email),
        current_preset:presets(preset_id, crop_type, region)
      `)
      .eq('id', dryerId)
      .single();

    if (dbError) {
      if (dbError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Dryer not found' }, { status: 404 });
      }
      console.error('Error fetching dryer:', dbError);
      return NextResponse.json(
        { error: 'Failed to fetch dryer', details: dbError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ dryer });
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await requireAuth(request);
    if (error) return error;
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    // Await params in Next.js 16+
    const { id: dryerId } = await params;

    // Check if user can access this dryer
    const hasAccess = await canAccessDryer(user, dryerId);
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
    const { data: existingDryer, error: fetchError } = await supabase
      .from('dryers')
      .select('status')
      .eq('id', dryerId)
      .single();

    if (fetchError || !existingDryer) {
      return NextResponse.json({ error: 'Dryer not found' }, { status: 404 });
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
      if (locationLatitude || locationLongitude || locationAddress || regionId) {
        return NextResponse.json(
          { error: 'Regional managers can only update dryer status' },
          { status: 403 }
        );
      }
    }

    // Validate region if regionId is provided
    if (regionId) {
      const { data: region, error: regionError } = await supabase
        .from('regions')
        .select('id')
        .eq('id', regionId)
        .single();

      if (regionError || !region) {
        return NextResponse.json({ error: 'Region not found' }, { status: 404 });
      }
    }

    // Build update object (using snake_case for Supabase)
    const updateData: Record<string, any> = {};
    if (status !== undefined) updateData.status = status;
    if (locationLatitude !== undefined) updateData.location_latitude = locationLatitude;
    if (locationLongitude !== undefined) updateData.location_longitude = locationLongitude;
    if (locationAddress !== undefined) updateData.location_address = locationAddress;
    if (regionId !== undefined) updateData.region_id = regionId;

    // Update dryer
    const { data: updatedDryer, error: updateError } = await supabase
      .from('dryers')
      .update(updateData)
      .eq('id', dryerId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating dryer:', updateError);
      return NextResponse.json(
        { error: 'Failed to update dryer', details: updateError.message },
        { status: 500 }
      );
    }

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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Only super admins can delete dryers
    const { user, error } = await requirePermission(request, 'dryers', 'delete');
    if (error) return error;

    // Await params in Next.js 16+
    const { id: dryerId } = await params;

    // Check if dryer exists
    const { data: existingDryer, error: fetchError } = await supabase
      .from('dryers')
      .select('id')
      .eq('id', dryerId)
      .single();

    if (fetchError || !existingDryer) {
      return NextResponse.json({ error: 'Dryer not found' }, { status: 404 });
    }

    // Delete dryer (cascade will handle assignments)
    const { error: deleteError } = await supabase
      .from('dryers')
      .delete()
      .eq('id', dryerId);

    if (deleteError) {
      console.error('Error deleting dryer:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete dryer', details: deleteError.message },
        { status: 500 }
      );
    }

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
