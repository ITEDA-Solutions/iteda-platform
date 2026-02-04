import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-db';

// GET - Fetch all regions from Supabase
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const { data: regions, error } = await supabase
      .from('regions')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching regions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch regions', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: regions?.length || 0,
      regions: regions || [],
    });

  } catch (error: any) {
    console.error('Regions fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
