import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch all dryer owners from Supabase
export async function GET(request: NextRequest) {
  try {
    const { data: owners, error } = await supabase
      .from('dryer_owners')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching dryer owners:', error);
      return NextResponse.json(
        { error: 'Failed to fetch dryer owners', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: owners?.length || 0,
      farmers: owners || [], // Keep 'farmers' key for backward compatibility
      owners: owners || [],
    });

  } catch (error: any) {
    console.error('Dryer owners fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
