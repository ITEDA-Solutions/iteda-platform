import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch all dryers from Supabase
export async function GET(request: NextRequest) {
  try {
    const { data: dryers, error } = await supabase
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
