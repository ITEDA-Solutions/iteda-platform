import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-db';

// GET - List all presets
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('is_active');

    const supabase = getSupabaseAdmin();
    let query = supabase
      .from('presets')
      .select('*')
      .order('crop_type', { ascending: true })
      .order('region', { ascending: true });

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ presets: data }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching presets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch presets', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create new preset
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      preset_id,
      crop_type,
      region,
      target_temp_c,
      target_humidity_pct,
      fan_speed_rpm,
      duration_hours,
      min_temp_threshold,
      max_temp_threshold,
      description,
    } = body;

    // Validation
    if (!crop_type || !region || !target_temp_c || !target_humidity_pct || !fan_speed_rpm || !duration_hours) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate preset_id if not provided
    const generatedPresetId = preset_id || `PRESET-${Date.now()}`;

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('presets')
      .insert([
        {
          preset_id: generatedPresetId,
          crop_type,
          region,
          target_temp_c,
          target_humidity_pct,
          fan_speed_rpm,
          duration_hours,
          min_temp_threshold,
          max_temp_threshold,
          description,
          is_active: true,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(
      { success: true, preset: data },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating preset:', error);
    return NextResponse.json(
      { error: 'Failed to create preset', details: error.message },
      { status: 500 }
    );
  }
}
