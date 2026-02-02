import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch all staff roles from Supabase
export async function GET(request: NextRequest) {
  try {
    const { data: roles, error } = await supabase
      .from('staff_roles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching staff roles:', error);
      return NextResponse.json(
        { error: 'Failed to fetch staff roles', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: roles?.length || 0,
      roles: roles || [],
    });

  } catch (error: any) {
    console.error('Staff roles fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
