import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-db';

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    const { data, error } = await supabaseAdmin
      .from('alerts')
      .select('id, type, severity, message, created_at, status, dryer_id')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('[dashboard-alerts] Error fetching alerts:', error);
      return NextResponse.json({ alerts: [] }, { status: 200 });
    }

    if (data && data.length > 0) {
      // Fetch dryer info separately
      const dryerIds = data.map(a => a.dryer_id);
      const { data: dryersData } = await supabaseAdmin
        .from('dryers')
        .select('id, dryer_id')
        .in('id', dryerIds);

      const alerts = data.map(alert => {
        const dryer = dryersData?.find(d => d.id === alert.dryer_id);
        return {
          id: alert.id,
          dryer_id: alert.dryer_id,
          dryer_identifier: dryer?.dryer_id || 'Unknown',
          alert_type: alert.type,
          priority: alert.severity,
          title: alert.type.replace(/_/g, ' ').toUpperCase(),
          message: alert.message,
          triggered_at: alert.created_at,
          status: alert.status,
        };
      });

      return NextResponse.json({ alerts }, { status: 200 });
    }

    return NextResponse.json({ alerts: [] }, { status: 200 });
  } catch (error: any) {
    console.error('[dashboard-alerts] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts', details: error.message },
      { status: 500 }
    );
  }
}
