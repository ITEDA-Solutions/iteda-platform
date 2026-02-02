import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch all alerts from Supabase
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // active, acknowledged, resolved, dismissed
    const severity = searchParams.get('severity'); // critical, warning, info

    let query = supabase
      .from('alerts')
      .select(`
        *,
        dryer:dryers(dryer_id, serial_number, location_address),
        acknowledged_by_user:profiles(full_name, email)
      `)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (severity) {
      query = query.eq('severity', severity);
    }

    const { data: alerts, error } = await query;

    if (error) {
      console.error('Error fetching alerts:', error);
      return NextResponse.json(
        { error: 'Failed to fetch alerts', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: alerts?.length || 0,
      alerts: alerts || [],
    });

  } catch (error: any) {
    console.error('Alerts fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
