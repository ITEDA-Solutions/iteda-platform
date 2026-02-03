import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-db';

// GET - Get single preset
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('presets')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return NextResponse.json(
        { error: 'Preset not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ preset: data }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching preset:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preset', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update preset
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const {
      crop_type,
      region,
      target_temp_c,
      target_humidity_pct,
      fan_speed_rpm,
      duration_hours,
      min_temp_threshold,
      max_temp_threshold,
      description,
      is_active,
    } = body;

    const updateData: any = {};
    if (crop_type !== undefined) updateData.crop_type = crop_type;
    if (region !== undefined) updateData.region = region;
    if (target_temp_c !== undefined) updateData.target_temp_c = target_temp_c;
    if (target_humidity_pct !== undefined) updateData.target_humidity_pct = target_humidity_pct;
    if (fan_speed_rpm !== undefined) updateData.fan_speed_rpm = fan_speed_rpm;
    if (duration_hours !== undefined) updateData.duration_hours = duration_hours;
    if (min_temp_threshold !== undefined) updateData.min_temp_threshold = min_temp_threshold;
    if (max_temp_threshold !== undefined) updateData.max_temp_threshold = max_temp_threshold;
    if (description !== undefined) updateData.description = description;
    if (is_active !== undefined) updateData.is_active = is_active;

    updateData.updated_at = new Date().toISOString();

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('presets')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(
      { success: true, preset: data },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error updating preset:', error);
    return NextResponse.json(
      { error: 'Failed to update preset', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete preset (mark as inactive)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getSupabaseAdmin();

    // Check if preset is currently in use
    const { data: dryersUsingPreset } = await supabase
      .from('dryers')
      .select('id')
      .eq('current_preset_id', id)
      .limit(1);

    if (dryersUsingPreset && dryersUsingPreset.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete preset that is currently in use by dryers' },
        { status: 400 }
      );
    }

    // Soft delete by marking as inactive
    const { data, error } = await supabase
      .from('presets')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(
      { success: true, message: 'Preset deactivated successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error deleting preset:', error);
    return NextResponse.json(
      { error: 'Failed to delete preset', details: error.message },
      { status: 500 }
    );
  }
}
