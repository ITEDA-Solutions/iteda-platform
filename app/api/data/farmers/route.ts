import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch all farmers/owners from Supabase
export async function GET(request: NextRequest) {
  try {
    const { data: farmers, error } = await supabase
      .from('farmers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching farmers:', error);
      return NextResponse.json(
        { error: 'Failed to fetch farmers', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: farmers?.length || 0,
      farmers: farmers || [],
    });

  } catch (error: any) {
    console.error('Farmers fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
