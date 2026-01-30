import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST - Assign preset to dryer
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { preset_id } = body;

    if (!preset_id) {
      return NextResponse.json(
        { error: 'preset_id is required' },
        { status: 400 }
      );
    }

    // Verify preset exists and is active
    const { data: preset, error: presetError } = await supabase
      .from('presets')
      .select('id, is_active, crop_type, region')
      .eq('id', preset_id)
      .single();

    if (presetError || !preset) {
      return NextResponse.json(
        { error: 'Preset not found' },
        { status: 404 }
      );
    }

    if (!preset.is_active) {
      return NextResponse.json(
        { error: 'Cannot assign inactive preset' },
        { status: 400 }
      );
    }

    // Verify dryer exists
    const { data: dryer, error: dryerError } = await supabase
      .from('dryers')
      .select('id, dryer_id')
      .eq('id', params.id)
      .single();

    if (dryerError || !dryer) {
      return NextResponse.json(
        { error: 'Dryer not found' },
        { status: 404 }
      );
    }

    // Assign preset to dryer
    const { data, error } = await supabase
      .from('dryers')
      .update({
        current_preset_id: preset_id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(
      {
        success: true,
        message: `Preset ${preset.crop_type} - ${preset.region} assigned to dryer ${dryer.dryer_id}`,
        dryer: data,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error assigning preset:', error);
    return NextResponse.json(
      { error: 'Failed to assign preset', details: error.message },
      { status: 500 }
    );
  }
}
