import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-db';
import { verifyAuth, getAccessibleDryerIds } from '@/lib/supabase-auth';

// GET - Fetch all dryers from Supabase (with role-based filtering)
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const { user, error: authError } = await verifyAuth(request);
    if (authError) return authError;
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get accessible dryer IDs based on user role
    const accessibleDryerIds = await getAccessibleDryerIds(user);

    const supabase = getSupabaseAdmin();
    let query = supabase
      .from('dryers')
      .select(`
        id,
        dryer_id,
        serial_number,
        status,
        battery_level,
        battery_voltage,
        signal_strength,
        last_communication,
        location_address,
        active_alerts_count,
        deployment_date,
        total_runtime_hours,
        owner:dryer_owners(name),
        region:regions(name),
        current_preset:presets(preset_id, crop_type)
      `)
      .order('created_at', { ascending: false });

    // Apply filter for non-admin users
    if (accessibleDryerIds !== null) {
      if (accessibleDryerIds.length === 0) {
        // No accessible dryers
        return NextResponse.json({
          success: true,
          count: 0,
          dryers: [],
        });
      }
      query = query.in('id', accessibleDryerIds);
    }

    const { data: dryers, error } = await query;

    if (error) {
      console.error('Error fetching dryers:', error);
      return NextResponse.json(
        { error: 'Failed to fetch dryers', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: dryers?.length || 0,
      dryers: dryers || [],
    });

  } catch (error: any) {
    console.error('Dryers fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
