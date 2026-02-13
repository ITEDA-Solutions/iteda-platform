import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-db';

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    // Fetch dryer counts
    const { data: dryers, error: dryersError } = await supabaseAdmin
      .from('dryers')
      .select('status, last_communication, battery_level');

    if (dryersError) {
      console.error('[dashboard-stats] Error fetching dryers:', dryersError);
    }

    const total = dryers?.length || 0;
    const active = dryers?.filter(d => d.status === 'active').length || 0;
    const offline = dryers?.filter(d => {
      if (!d.last_communication) return true;
      const lastComm = new Date(d.last_communication);
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
      return lastComm < hourAgo;
    }).length || 0;
    const maintenance = dryers?.filter(d => d.status === 'maintenance').length || 0;

    // Fetch alerts
    const { data: alerts, error: alertsError } = await supabaseAdmin
      .from('alerts')
      .select('severity, status');

    if (alertsError) {
      console.error('[dashboard-stats] Error fetching alerts:', alertsError);
    }

    const activeAlerts = alerts?.filter(a => a.status === 'active') || [];
    const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical').length || 0;

    // Fetch recent sensor readings for averages
    const { data: sensorReadings, error: sensorError } = await supabaseAdmin
      .from('sensor_readings')
      .select('battery_level, chamber_temp')
      .order('timestamp', { ascending: false })
      .limit(100);

    if (sensorError) {
      console.error('[dashboard-stats] Error fetching sensor readings:', sensorError);
    }

    const avgBattery = sensorReadings?.reduce((sum, r) => sum + (r.battery_level || 0), 0) / (sensorReadings?.length || 1);
    const avgTemp = sensorReadings?.reduce((sum, r) => sum + (r.chamber_temp || 0), 0) / (sensorReadings?.length || 1);

    const stats = {
      total_dryers: total,
      active_dryers: active,
      offline_dryers: offline,
      maintenance_needed: maintenance,
      critical_alerts: criticalAlerts,
      total_alerts: activeAlerts.length,
      avg_battery_level: Math.round(avgBattery),
      avg_chamber_temp: Math.round(avgTemp * 10) / 10
    };

    console.log('[dashboard-stats] Stats calculated:', stats);

    return NextResponse.json({ stats }, { status: 200 });
  } catch (error: any) {
    console.error('[dashboard-stats] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats', details: error.message },
      { status: 500 }
    );
  }
}
