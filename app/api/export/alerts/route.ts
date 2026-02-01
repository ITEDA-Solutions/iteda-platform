import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateExportAccess, getAccessibleDryerIds } from '@/lib/rbac-middleware';
import { db } from '@/lib/db';
import { dryers, dryerAssignments } from '@/lib/schema';
import { eq, inArray } from 'drizzle-orm';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Export alerts as CSV
export async function GET(request: NextRequest) {
  try {
    // Validate export permissions (field technicians cannot export)
    const { user, error: authError } = await validateExportAccess(request);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const dryerId = searchParams.get('dryer_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const status = searchParams.get('status');

    // Get accessible dryer IDs based on role
    const accessibleDryerIds = await getAccessibleDryerIds(user.id, user.role, user.region);
    
    // If accessibleDryerIds is an empty array, user has no access
    if (Array.isArray(accessibleDryerIds) && accessibleDryerIds.length === 0) {
      const csv = generateAlertsCSV([]);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="alerts-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    // Build query
    let query = supabase
      .from('alerts')
      .select(`
        *,
        dryers!inner(dryer_id, region_id)
      `)
      .order('triggered_at', { ascending: false });

    // Filter by specific dryer if provided
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
    // Otherwise, filter by accessible dryers
    else if (Array.isArray(accessibleDryerIds)) {
      query = query.in('dryer_id', accessibleDryerIds);
    } else if (user.role === 'regional_manager' && user.region) {
      // For regional managers, filter by region
      const regionDryers = await db
        .select({ id: dryers.id })
        .from(dryers)
        .where(eq(dryers.regionId, user.region));
      
      const regionDryerIds = regionDryers.map(d => d.id);
      if (regionDryerIds.length > 0) {
        query = query.in('dryer_id', regionDryerIds);
      } else {
        // No dryers in region, return empty
        const csv = generateAlertsCSV([]);
        return new NextResponse(csv, {
          status: 200,
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="alerts-${new Date().toISOString().split('T')[0]}.csv"`,
          },
        });
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
