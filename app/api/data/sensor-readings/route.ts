import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-db';

// GET - Fetch sensor readings from Supabase
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dryerId = searchParams.get('dryer_id');
    const limit = parseInt(searchParams.get('limit') || '100');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    const supabase = getSupabaseAdmin();
    let query = supabase
      .from('sensor_readings')
      .select(`
        *,
        dryer:dryers(dryer_id, serial_number),
        active_preset:presets(preset_id, crop_type)
      `)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (dryerId) {
      query = query.eq('dryer_id', dryerId);
    }

    if (startDate) {
      query = query.gte('timestamp', startDate);
    }

    if (endDate) {
      query = query.lte('timestamp', endDate);
    }

    const { data: readings, error } = await query;

    if (error) {
      console.error('Error fetching sensor readings:', error);
      return NextResponse.json(
        { error: 'Failed to fetch sensor readings', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: readings?.length || 0,
      readings: readings || [],
    });

  } catch (error: any) {
    console.error('Sensor readings fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
