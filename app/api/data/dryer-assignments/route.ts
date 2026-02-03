import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-db';

// GET - Fetch all dryer assignments from Supabase
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const { data: assignments, error } = await supabase
      .from('dryer_assignments')
      .select('*')
      .order('assigned_at', { ascending: false });

    if (error) {
      console.error('Error fetching dryer assignments:', error);
      return NextResponse.json(
        { error: 'Failed to fetch dryer assignments', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: assignments?.length || 0,
      assignments: assignments || [],
    });

  } catch (error: any) {
    console.error('Dryer assignments fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
