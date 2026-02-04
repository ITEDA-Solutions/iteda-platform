import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-db';

// Alert thresholds
const THRESHOLDS = {
  CRITICAL_TEMP: 80, // °C
  HIGH_TEMP: 70, // °C
  CRITICAL_BATTERY: 10, // %
  LOW_BATTERY: 30, // %
  OFFLINE_MINUTES: 15,
  OFFLINE_CRITICAL_HOURS: 1,
};

interface AlertToCreate {
  dryerId: string;
  severity: 'critical' | 'warning' | 'info';
  type: string;
  message: string;
  thresholdValue?: number;
  currentValue?: number;
}

// POST - Generate alerts based on current sensor data and dryer status
export async function POST(request: NextRequest) {
  try {
    const alertsToCreate: AlertToCreate[] = [];
    const supabase = getSupabaseAdmin();

    // Get all active dryers
    const { data: activeDryers, error: dryersError } = await supabase
      .from('dryers')
      .select('*')
      .neq('status', 'decommissioned');

    if (dryersError) {
      throw new Error(`Failed to fetch dryers: ${dryersError.message}`);
    }

    const now = new Date();

    for (const dryer of activeDryers || []) {
      // Check offline status
      if (dryer.last_communication) {
        const minutesOffline = (now.getTime() - new Date(dryer.last_communication).getTime()) / (1000 * 60);

        if (minutesOffline > THRESHOLDS.OFFLINE_CRITICAL_HOURS * 60) {
          alertsToCreate.push({
            dryerId: dryer.id,
            severity: 'critical',
            type: 'dryer_offline',
            message: `Dryer ${dryer.dryer_id} has been offline for over ${THRESHOLDS.OFFLINE_CRITICAL_HOURS} hour(s)`,
            thresholdValue: THRESHOLDS.OFFLINE_CRITICAL_HOURS * 60,
            currentValue: minutesOffline,
          });
        } else if (minutesOffline > THRESHOLDS.OFFLINE_MINUTES) {
          alertsToCreate.push({
            dryerId: dryer.id,
            severity: 'warning',
            type: 'dryer_offline',
            message: `Dryer ${dryer.dryer_id} has been offline for ${Math.round(minutesOffline)} minutes`,
            thresholdValue: THRESHOLDS.OFFLINE_MINUTES,
            currentValue: minutesOffline,
          });
        }
      }

      // Check battery level
      if (dryer.battery_level !== null) {
        if (dryer.battery_level < THRESHOLDS.CRITICAL_BATTERY) {
          alertsToCreate.push({
            dryerId: dryer.id,
            severity: 'critical',
            type: 'battery_critical',
            message: `Dryer ${dryer.dryer_id} battery critically low at ${dryer.battery_level}%`,
            thresholdValue: THRESHOLDS.CRITICAL_BATTERY,
            currentValue: dryer.battery_level,
          });
        } else if (dryer.battery_level < THRESHOLDS.LOW_BATTERY) {
          alertsToCreate.push({
            dryerId: dryer.id,
            severity: 'warning',
            type: 'battery_low',
            message: `Dryer ${dryer.dryer_id} battery low at ${dryer.battery_level}%`,
            thresholdValue: THRESHOLDS.LOW_BATTERY,
            currentValue: dryer.battery_level,
          });
        }
      }

      // Get latest sensor reading
      const { data: latestReading } = await supabase
        .from('sensor_readings')
        .select('*')
        .eq('dryer_id', dryer.id)
        .order('timestamp', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestReading) {
        // Check chamber temperature
        if (latestReading.chamber_temp !== null) {
          const temp = parseFloat(latestReading.chamber_temp.toString());

          if (temp > THRESHOLDS.CRITICAL_TEMP) {
            alertsToCreate.push({
              dryerId: dryer.id,
              severity: 'critical',
              type: 'temperature_critical',
              message: `Dryer ${dryer.dryer_id} chamber temperature critically high at ${temp}°C - Fire risk!`,
              thresholdValue: THRESHOLDS.CRITICAL_TEMP,
              currentValue: temp,
            });
          } else if (temp > THRESHOLDS.HIGH_TEMP) {
            alertsToCreate.push({
              dryerId: dryer.id,
              severity: 'warning',
              type: 'temperature_high',
              message: `Dryer ${dryer.dryer_id} chamber temperature high at ${temp}°C`,
              thresholdValue: THRESHOLDS.HIGH_TEMP,
              currentValue: temp,
            });
          }
        }

        // Check for sensor failures (null values when dryer is active)
        if (dryer.status === 'active') {
          if (latestReading.chamber_temp === null || latestReading.internal_humidity === null) {
            alertsToCreate.push({
              dryerId: dryer.id,
              severity: 'warning',
              type: 'sensor_failure',
              message: `Dryer ${dryer.dryer_id} has sensor reading failures`,
            });
          }
        }

        // Check heater malfunction (heater on but no temp increase)
        if (latestReading.heater_status && latestReading.chamber_temp !== null && latestReading.ambient_temp !== null) {
          const tempDiff = parseFloat(latestReading.chamber_temp.toString()) - parseFloat(latestReading.ambient_temp.toString());
          if (tempDiff < 2) {
            alertsToCreate.push({
              dryerId: dryer.id,
              severity: 'warning',
              type: 'heater_malfunction',
              message: `Dryer ${dryer.dryer_id} heater may be malfunctioning - no temperature increase`,
            });
          }
        }
      }
    }

    // Check for existing active alerts to avoid duplicates
    const { data: existingAlerts } = await supabase
      .from('alerts')
      .select('dryer_id, type')
      .eq('status', 'active');

    const existingAlertKeys = new Set(
      (existingAlerts || []).map(a => `${a.dryer_id}-${a.type}`)
    );

    // Filter out alerts that already exist
    const newAlerts = alertsToCreate.filter(
      alert => !existingAlertKeys.has(`${alert.dryerId}-${alert.type}`)
    );

    // Create new alerts
    if (newAlerts.length > 0) {
      const { error: insertError } = await supabase
        .from('alerts')
        .insert(
          newAlerts.map(alert => ({
            dryer_id: alert.dryerId,
            severity: alert.severity,
            type: alert.type,
            message: alert.message,
            threshold_value: alert.thresholdValue?.toString(),
            current_value: alert.currentValue?.toString(),
            status: 'active',
          }))
        );

      if (insertError) {
        throw new Error(`Failed to create alerts: ${insertError.message}`);
      }

      // Update dryer alert counts
      for (const alert of newAlerts) {
        await supabase.rpc('increment_dryer_alert_count', {
          dryer_uuid: alert.dryerId,
        });
      }
    }

    return NextResponse.json({
      success: true,
      alertsGenerated: newAlerts.length,
      totalDryersChecked: activeDryers?.length || 0,
      alerts: newAlerts,
    });

  } catch (error: any) {
    console.error('Alert generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate alerts', details: error.message },
      { status: 500 }
    );
  }
}

// GET - Get alert generation status and statistics
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();

    const { count: activeCount } = await supabase
      .from('alerts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    const { count: criticalCount } = await supabase
      .from('alerts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .eq('severity', 'critical');

    return NextResponse.json({
      activeAlerts: activeCount || 0,
      criticalAlerts: criticalCount || 0,
      thresholds: THRESHOLDS,
    });

  } catch (error: any) {
    console.error('Alert status error:', error);
    return NextResponse.json(
      { error: 'Failed to get alert status', details: error.message },
      { status: 500 }
    );
  }
}
