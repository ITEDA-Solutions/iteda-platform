import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-db';

// GET - Fetch all presets from Supabase
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active_only') === 'true';

    const supabase = getSupabaseAdmin();
    let query = supabase
      .from('presets')
      .select('*')
      .order('created_at', { ascending: false });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data: presets, error } = await query;

    if (error) {
      console.error('Error fetching presets:', error);
      return NextResponse.json(
        { error: 'Failed to fetch presets', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: presets?.length || 0,
      presets: presets || [],
    });

  } catch (error: any) {
    console.error('Presets fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
