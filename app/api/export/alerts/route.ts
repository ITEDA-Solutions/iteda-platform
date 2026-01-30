import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Export alerts as CSV
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dryerId = searchParams.get('dryer_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const status = searchParams.get('status');

    // Build query
    let query = supabase
      .from('alerts')
      .select(`
        *,
        dryers!inner(dryer_id)
      `)
      .order('triggered_at', { ascending: false });

    if (dryerId) {
      const { data: dryer } = await supabase
        .from('dryers')
        .select('id')
        .eq('dryer_id', dryerId)
        .single();
      
      if (dryer) {
        query = query.eq('dryer_id', dryer.id);
      }
    }

    if (startDate) {
      query = query.gte('triggered_at', startDate);
    }
    if (endDate) {
      query = query.lte('triggered_at', endDate);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data: alerts, error: alertsError } = await query;

    if (alertsError) {
      return NextResponse.json(
        { error: 'Failed to retrieve alerts', details: alertsError.message },
        { status: 500 }
      );
    }

    // Generate CSV
    const csv = generateAlertsCSV(alerts || []);
    
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="alerts-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });

  } catch (error: any) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

function generateAlertsCSV(alerts: any[]): string {
  if (alerts.length === 0) {
    return 'No alerts available';
  }

  // CSV Headers
  const headers = [
    'Alert ID',
    'Dryer ID',
    'Alert Type',
    'Priority',
    'Status',
    'Title',
    'Message',
    'Threshold Value',
    'Current Value',
    'Triggered At',
    'Acknowledged At',
    'Resolved At',
  ];

  // CSV Rows
  const rows = alerts.map(alert => [
    alert.id,
    (alert.dryers as any).dryer_id,
    alert.alert_type,
    alert.priority,
    alert.status,
    alert.title,
    alert.message,
    alert.threshold_value || '',
    alert.current_value || '',
    alert.triggered_at,
    alert.acknowledged_at || '',
    alert.resolved_at || '',
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  return csvContent;
}
