import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dryers, sensorReadings, alerts } from '@/lib/schema';
import { eq, and, desc, gte, sql } from 'drizzle-orm';

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
    
    // Get all active dryers
    const activeDryers = await db
      .select()
      .from(dryers)
      .where(sql`${dryers.status} != 'decommissioned'`);

    const now = new Date();

    for (const dryer of activeDryers) {
      // Check offline status
      if (dryer.lastCommunication) {
        const minutesOffline = (now.getTime() - new Date(dryer.lastCommunication).getTime()) / (1000 * 60);
        
        if (minutesOffline > THRESHOLDS.OFFLINE_CRITICAL_HOURS * 60) {
          alertsToCreate.push({
            dryerId: dryer.id,
            severity: 'critical',
            type: 'dryer_offline',
            message: `Dryer ${dryer.dryerId} has been offline for over ${THRESHOLDS.OFFLINE_CRITICAL_HOURS} hour(s)`,
            thresholdValue: THRESHOLDS.OFFLINE_CRITICAL_HOURS * 60,
            currentValue: minutesOffline,
          });
        } else if (minutesOffline > THRESHOLDS.OFFLINE_MINUTES) {
          alertsToCreate.push({
            dryerId: dryer.id,
            severity: 'warning',
            type: 'dryer_offline',
            message: `Dryer ${dryer.dryerId} has been offline for ${Math.round(minutesOffline)} minutes`,
            thresholdValue: THRESHOLDS.OFFLINE_MINUTES,
            currentValue: minutesOffline,
          });
        }
      }

      // Check battery level
      if (dryer.batteryLevel !== null) {
        if (dryer.batteryLevel < THRESHOLDS.CRITICAL_BATTERY) {
          alertsToCreate.push({
            dryerId: dryer.id,
            severity: 'critical',
            type: 'battery_critical',
            message: `Dryer ${dryer.dryerId} battery critically low at ${dryer.batteryLevel}%`,
            thresholdValue: THRESHOLDS.CRITICAL_BATTERY,
            currentValue: dryer.batteryLevel,
          });
        } else if (dryer.batteryLevel < THRESHOLDS.LOW_BATTERY) {
          alertsToCreate.push({
            dryerId: dryer.id,
            severity: 'warning',
            type: 'battery_low',
            message: `Dryer ${dryer.dryerId} battery low at ${dryer.batteryLevel}%`,
            thresholdValue: THRESHOLDS.LOW_BATTERY,
            currentValue: dryer.batteryLevel,
          });
        }
      }

      // Get latest sensor reading
      const latestReading = await db
        .select()
        .from(sensorReadings)
        .where(eq(sensorReadings.dryerId, dryer.id))
        .orderBy(desc(sensorReadings.timestamp))
        .limit(1);

      if (latestReading.length > 0) {
        const reading = latestReading[0];

        // Check chamber temperature
        if (reading.chamberTemp !== null) {
          const temp = parseFloat(reading.chamberTemp.toString());
          
          if (temp > THRESHOLDS.CRITICAL_TEMP) {
            alertsToCreate.push({
              dryerId: dryer.id,
              severity: 'critical',
              type: 'temperature_critical',
              message: `Dryer ${dryer.dryerId} chamber temperature critically high at ${temp}°C - Fire risk!`,
              thresholdValue: THRESHOLDS.CRITICAL_TEMP,
              currentValue: temp,
            });
          } else if (temp > THRESHOLDS.HIGH_TEMP) {
            alertsToCreate.push({
              dryerId: dryer.id,
              severity: 'warning',
              type: 'temperature_high',
              message: `Dryer ${dryer.dryerId} chamber temperature high at ${temp}°C`,
              thresholdValue: THRESHOLDS.HIGH_TEMP,
              currentValue: temp,
            });
          }
        }

        // Check for sensor failures (null values when dryer is active)
        if (dryer.status === 'active') {
          if (reading.chamberTemp === null || reading.internalHumidity === null) {
            alertsToCreate.push({
              dryerId: dryer.id,
              severity: 'warning',
              type: 'sensor_failure',
              message: `Dryer ${dryer.dryerId} has sensor reading failures`,
            });
          }
        }

        // Check heater malfunction (heater on but no temp increase)
        if (reading.heaterStatus && reading.chamberTemp !== null && reading.ambientTemp !== null) {
          const tempDiff = parseFloat(reading.chamberTemp.toString()) - parseFloat(reading.ambientTemp.toString());
          if (tempDiff < 2) {
            alertsToCreate.push({
              dryerId: dryer.id,
              severity: 'warning',
              type: 'heater_malfunction',
              message: `Dryer ${dryer.dryerId} heater may be malfunctioning - no temperature increase`,
            });
          }
        }
      }
    }

    // Check for existing active alerts to avoid duplicates
    const existingAlerts = await db
      .select()
      .from(alerts)
      .where(eq(alerts.status, 'active'));

    const existingAlertKeys = new Set(
      existingAlerts.map(a => `${a.dryerId}-${a.type}`)
    );

    // Filter out alerts that already exist
    const newAlerts = alertsToCreate.filter(
      alert => !existingAlertKeys.has(`${alert.dryerId}-${alert.type}`)
    );

    // Create new alerts
    if (newAlerts.length > 0) {
      await db.insert(alerts).values(
        newAlerts.map(alert => ({
          dryerId: alert.dryerId,
          severity: alert.severity,
          type: alert.type,
          message: alert.message,
          thresholdValue: alert.thresholdValue?.toString(),
          currentValue: alert.currentValue?.toString(),
          status: 'active' as const,
        }))
      );

      // Update dryer alert counts
      for (const alert of newAlerts) {
        await db
          .update(dryers)
          .set({ 
            activeAlertsCount: sql`${dryers.activeAlertsCount} + 1`,
            updatedAt: new Date(),
          })
          .where(eq(dryers.id, alert.dryerId));
      }
    }

    return NextResponse.json({
      success: true,
      alertsGenerated: newAlerts.length,
      totalDryersChecked: activeDryers.length,
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
    const activeAlertsCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(alerts)
      .where(eq(alerts.status, 'active'));

    const criticalAlertsCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(alerts)
      .where(and(
        eq(alerts.status, 'active'),
        eq(alerts.severity, 'critical')
      ));

    return NextResponse.json({
      activeAlerts: activeAlertsCount[0]?.count || 0,
      criticalAlerts: criticalAlertsCount[0]?.count || 0,
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
