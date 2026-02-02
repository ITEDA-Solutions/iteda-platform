// Alert Generator Service
// Generates alerts based on dryer data and alert rules

import { createClient } from '@supabase/supabase-js';
import { checkAlertRules, formatAlertMessage, AlertRule, AlertType, AlertSeverity } from './alert-rules';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface AlertGenerationResult {
  alertsCreated: number;
  alertsUpdated: number;
  alertsResolved: number;
  errors: string[];
}

/**
 * Generate alerts for a single dryer
 */
export async function generateAlertsForDryer(dryerId: string): Promise<AlertGenerationResult> {
  const result: AlertGenerationResult = {
    alertsCreated: 0,
    alertsUpdated: 0,
    alertsResolved: 0,
    errors: [],
  };

  try {
    // Fetch dryer data with latest sensor reading
    const { data: dryer, error: dryerError } = await supabase
      .from('dryers')
      .select(`
        id,
        dryer_id,
        status,
        last_communication,
        battery_level,
        deployment_date,
        current_preset_id
      `)
      .eq('id', dryerId)
      .single();

    if (dryerError || !dryer) {
      result.errors.push(`Dryer not found: ${dryerId}`);
      return result;
    }

    // Fetch latest sensor reading
    const { data: sensorReading } = await supabase
      .from('sensor_readings')
      .select('*')
      .eq('dryer_id', dryerId)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    // Combine dryer and sensor data
    const data = {
      ...dryer,
      ...sensorReading,
    };

    // Check alert rules
    const { alerts } = checkAlertRules(data);

    // Fetch existing active alerts for this dryer
    const { data: existingAlerts } = await supabase
      .from('alerts')
      .select('*')
      .eq('dryer_id', dryerId)
      .eq('status', 'active');

    const existingAlertTypes = new Set(existingAlerts?.map(a => a.type) || []);
    const triggeredAlertTypes = new Set(alerts.map(a => a.rule.type));

    // Create new alerts
    for (const alert of alerts) {
      if (!existingAlertTypes.has(alert.rule.type)) {
        const message = formatAlertMessage(alert.rule, alert.currentValue, alert.threshold);
        
        const { error: insertError } = await supabase
          .from('alerts')
          .insert({
            dryer_id: dryerId,
            type: alert.rule.type,
            severity: alert.rule.severity,
            message: message,
            threshold_value: alert.threshold,
            current_value: alert.currentValue,
            status: 'active',
          });

        if (insertError) {
          result.errors.push(`Failed to create alert: ${insertError.message}`);
        } else {
          result.alertsCreated++;
          
          // Update dryer alert count
          await updateDryerAlertCount(dryerId);
        }
      }
    }

    // Resolve alerts that are no longer triggered
    if (existingAlerts) {
      for (const existingAlert of existingAlerts) {
        if (!triggeredAlertTypes.has(existingAlert.type as AlertType)) {
          const { error: updateError } = await supabase
            .from('alerts')
            .update({
              status: 'resolved',
              resolved_at: new Date().toISOString(),
            })
            .eq('id', existingAlert.id);

          if (updateError) {
            result.errors.push(`Failed to resolve alert: ${updateError.message}`);
          } else {
            result.alertsResolved++;
            
            // Update dryer alert count
            await updateDryerAlertCount(dryerId);
          }
        }
      }
    }

  } catch (error: any) {
    result.errors.push(`Error generating alerts: ${error.message}`);
  }

  return result;
}

/**
 * Generate alerts for all dryers
 */
export async function generateAlertsForAllDryers(): Promise<AlertGenerationResult> {
  const totalResult: AlertGenerationResult = {
    alertsCreated: 0,
    alertsUpdated: 0,
    alertsResolved: 0,
    errors: [],
  };

  try {
    // Fetch all dryers
    const { data: dryers, error: dryersError } = await supabase
      .from('dryers')
      .select('id')
      .neq('status', 'decommissioned');

    if (dryersError) {
      totalResult.errors.push(`Failed to fetch dryers: ${dryersError.message}`);
      return totalResult;
    }

    if (!dryers || dryers.length === 0) {
      return totalResult;
    }

    // Generate alerts for each dryer
    for (const dryer of dryers) {
      const result = await generateAlertsForDryer(dryer.id);
      totalResult.alertsCreated += result.alertsCreated;
      totalResult.alertsUpdated += result.alertsUpdated;
      totalResult.alertsResolved += result.alertsResolved;
      totalResult.errors.push(...result.errors);
    }

  } catch (error: any) {
    totalResult.errors.push(`Error in batch generation: ${error.message}`);
  }

  return totalResult;
}

/**
 * Update dryer's active alert count
 */
async function updateDryerAlertCount(dryerId: string): Promise<void> {
  try {
    // Count active alerts
    const { count } = await supabase
      .from('alerts')
      .select('*', { count: 'exact', head: true })
      .eq('dryer_id', dryerId)
      .eq('status', 'active');

    // Update dryer
    await supabase
      .from('dryers')
      .update({ active_alerts_count: count || 0 })
      .eq('id', dryerId);
  } catch (error) {
    console.error('Error updating dryer alert count:', error);
  }
}

/**
 * Check for offline dryers and generate alerts
 */
export async function checkOfflineDryers(): Promise<AlertGenerationResult> {
  const result: AlertGenerationResult = {
    alertsCreated: 0,
    alertsUpdated: 0,
    alertsResolved: 0,
    errors: [],
  };

  try {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    // Find dryers offline for 15+ minutes
    const { data: offlineDryers } = await supabase
      .from('dryers')
      .select('id, dryer_id, last_communication')
      .lt('last_communication', fifteenMinutesAgo)
      .neq('status', 'decommissioned');

    if (offlineDryers) {
      for (const dryer of offlineDryers) {
        const dryerResult = await generateAlertsForDryer(dryer.id);
        result.alertsCreated += dryerResult.alertsCreated;
        result.alertsResolved += dryerResult.alertsResolved;
        result.errors.push(...dryerResult.errors);
      }
    }
  } catch (error: any) {
    result.errors.push(`Error checking offline dryers: ${error.message}`);
  }

  return result;
}

/**
 * Check for critical temperature alerts
 */
export async function checkCriticalTemperatures(): Promise<AlertGenerationResult> {
  const result: AlertGenerationResult = {
    alertsCreated: 0,
    alertsUpdated: 0,
    alertsResolved: 0,
    errors: [],
  };

  try {
    // Find recent sensor readings with high temperature
    const { data: highTempReadings } = await supabase
      .from('sensor_readings')
      .select('dryer_id, chamber_temp')
      .gt('chamber_temp', 80)
      .gte('timestamp', new Date(Date.now() - 10 * 60 * 1000).toISOString()); // Last 10 minutes

    if (highTempReadings) {
      const uniqueDryerIds = [...new Set(highTempReadings.map(r => r.dryer_id))];
      
      for (const dryerId of uniqueDryerIds) {
        const dryerResult = await generateAlertsForDryer(dryerId);
        result.alertsCreated += dryerResult.alertsCreated;
        result.errors.push(...dryerResult.errors);
      }
    }
  } catch (error: any) {
    result.errors.push(`Error checking temperatures: ${error.message}`);
  }

  return result;
}

/**
 * Check for low battery alerts
 */
export async function checkLowBatteries(): Promise<AlertGenerationResult> {
  const result: AlertGenerationResult = {
    alertsCreated: 0,
    alertsUpdated: 0,
    alertsResolved: 0,
    errors: [],
  };

  try {
    // Find dryers with low battery
    const { data: lowBatteryDryers } = await supabase
      .from('dryers')
      .select('id, battery_level')
      .lt('battery_level', 30)
      .neq('status', 'decommissioned');

    if (lowBatteryDryers) {
      for (const dryer of lowBatteryDryers) {
        const dryerResult = await generateAlertsForDryer(dryer.id);
        result.alertsCreated += dryerResult.alertsCreated;
        result.errors.push(...dryerResult.errors);
      }
    }
  } catch (error: any) {
    result.errors.push(`Error checking batteries: ${error.message}`);
  }

  return result;
}

/**
 * Main alert generation function (called by cron job)
 */
export async function runAlertGeneration(): Promise<AlertGenerationResult> {
  console.log('[ALERT GENERATION] Starting alert generation...');
  
  const startTime = Date.now();
  const result = await generateAlertsForAllDryers();
  const duration = Date.now() - startTime;

  console.log('[ALERT GENERATION] Completed in', duration, 'ms');
  console.log('[ALERT GENERATION] Results:', {
    created: result.alertsCreated,
    resolved: result.alertsResolved,
    errors: result.errors.length,
  });

  return result;
}
