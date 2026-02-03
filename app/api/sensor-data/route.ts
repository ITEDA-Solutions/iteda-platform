import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-db';
import {
  validateSensorReading,
  logValidationFailure,
  calculateChargingStatus,
} from './validation';

interface SensorDataPayload {
  dryer_id: string;
  timestamp?: string;

  // Temperature sensors
  chamber_temp?: number;
  ambient_temp?: number;
  heater_temp?: number;

  // Humidity sensors
  internal_humidity?: number;
  external_humidity?: number;

  // Fan data
  fan_speed_rpm?: number;
  fan_speed_percentage?: number;
  fan_status?: boolean;

  // Operational status
  heater_status?: boolean;
  door_status?: boolean;

  // Power metrics
  solar_voltage?: number;
  battery_level?: number;
  battery_voltage?: number;
  power_consumption_w?: number;
  charging_status?: string;

  // Metadata
  active_preset_id?: string;
  data_quality_score?: number;
}

// Validation ranges
const VALIDATION_RANGES = {
  temperature: { min: -20, max: 100 }, // °C
  humidity: { min: 0, max: 100 }, // %
  batteryLevel: { min: 0, max: 100 }, // %
  batteryVoltage: { min: 8, max: 16 }, // V (typical 12V system)
  solarVoltage: { min: 0, max: 30 }, // V
  fanSpeedRpm: { min: 0, max: 3000 }, // RPM
};

function validateSensorValue(value: number | undefined, range: { min: number; max: number }, fieldName: string): { valid: boolean; error?: string } {
  if (value === undefined || value === null) return { valid: true };
  if (value < range.min || value > range.max) {
    return {
      valid: false,
      error: `${fieldName} out of range: ${value} (expected ${range.min}-${range.max})`
    };
  }
  return { valid: true };
}

// POST - Receive sensor data from IoT devices
export async function POST(request: NextRequest) {
  try {
    const payload: SensorDataPayload = await request.json();

    // Validate required fields
    if (!payload.dryer_id) {
      return NextResponse.json(
        { error: 'dryer_id is required' },
        { status: 400 }
      );
    }

    // Validate sensor data using new validation middleware
    const validationResult = validateSensorReading(payload);

    if (!validationResult.isValid) {
      logValidationFailure(payload.dryer_id, payload, validationResult);
      return NextResponse.json(
        {
          error: 'Sensor data validation failed',
          details: validationResult.errors,
          warnings: validationResult.warnings
        },
        { status: 400 }
      );
    }

    // Log warnings if any (but still accept the data)
    if (validationResult.warnings.length > 0) {
      console.warn('[SENSOR DATA WARNING]', {
        dryer_id: payload.dryer_id,
        warnings: validationResult.warnings,
      });
    }

    // Calculate charging status if not provided
    if (!payload.charging_status) {
      payload.charging_status = calculateChargingStatus(
        payload.solar_voltage || null,
        payload.battery_voltage || null,
        payload.battery_level || null
      );
    }

    // Validate sensor values
    const validations = [
      validateSensorValue(payload.chamber_temp, VALIDATION_RANGES.temperature, 'chamber_temp'),
      validateSensorValue(payload.ambient_temp, VALIDATION_RANGES.temperature, 'ambient_temp'),
      validateSensorValue(payload.heater_temp, VALIDATION_RANGES.temperature, 'heater_temp'),
      validateSensorValue(payload.internal_humidity, VALIDATION_RANGES.humidity, 'internal_humidity'),
      validateSensorValue(payload.external_humidity, VALIDATION_RANGES.humidity, 'external_humidity'),
      validateSensorValue(payload.battery_level, VALIDATION_RANGES.batteryLevel, 'battery_level'),
      validateSensorValue(payload.battery_voltage, VALIDATION_RANGES.batteryVoltage, 'battery_voltage'),
      validateSensorValue(payload.solar_voltage, VALIDATION_RANGES.solarVoltage, 'solar_voltage'),
      validateSensorValue(payload.fan_speed_rpm, VALIDATION_RANGES.fanSpeedRpm, 'fan_speed_rpm'),
    ];

    const invalidFields = validations.filter(v => !v.valid);
    if (invalidFields.length > 0) {
      console.warn('Sensor data validation failed:', invalidFields.map(f => f.error).join(', '));
      return NextResponse.json(
        {
          error: 'Sensor data validation failed',
          details: invalidFields.map(f => f.error),
          rejectedValues: true,
        },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Verify dryer exists and get its UUID
    const { data: dryer, error: dryerError } = await supabase
      .from('dryers')
      .select('id')
      .eq('dryer_id', payload.dryer_id)
      .single();

    if (dryerError || !dryer) {
      return NextResponse.json(
        { error: 'Dryer not found' },
        { status: 404 }
      );
    }

    // Prepare sensor reading data (only include fields that exist in the schema)
    const sensorData: Record<string, any> = {
      dryer_id: dryer.id,
      timestamp: payload.timestamp ? new Date(payload.timestamp).toISOString() : new Date().toISOString(),
    };

    // Only add optional fields if they have values
    if (payload.chamber_temp !== undefined) sensorData.chamber_temp = payload.chamber_temp;
    if (payload.ambient_temp !== undefined) sensorData.ambient_temp = payload.ambient_temp;
    if (payload.heater_temp !== undefined) sensorData.heater_temp = payload.heater_temp;
    if (payload.internal_humidity !== undefined) sensorData.internal_humidity = payload.internal_humidity;
    if (payload.external_humidity !== undefined) sensorData.external_humidity = payload.external_humidity;
    if (payload.fan_speed_rpm !== undefined) sensorData.fan_speed_rpm = payload.fan_speed_rpm;
    if (payload.fan_speed_percentage !== undefined) sensorData.fan_speed_percentage = payload.fan_speed_percentage;
    if (payload.fan_status !== undefined) sensorData.fan_status = payload.fan_status;
    if (payload.heater_status !== undefined) sensorData.heater_status = payload.heater_status;
    if (payload.door_status !== undefined) sensorData.door_status = payload.door_status;
    if (payload.solar_voltage !== undefined) sensorData.solar_voltage = payload.solar_voltage;
    if (payload.battery_level !== undefined) sensorData.battery_level = payload.battery_level;
    if (payload.battery_voltage !== undefined) sensorData.battery_voltage = payload.battery_voltage;
    if (payload.power_consumption_w !== undefined) sensorData.power_consumption_w = payload.power_consumption_w;
    if (payload.charging_status !== undefined) sensorData.charging_status = payload.charging_status;
    if (payload.active_preset_id !== undefined) sensorData.active_preset_id = payload.active_preset_id;

    // Insert sensor reading
    const { data: reading, error: insertError } = await supabase
      .from('sensor_readings')
      .insert([sensorData])
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting sensor data:', insertError);
      return NextResponse.json(
        { error: 'Failed to store sensor data', details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      reading_id: reading.id,
      timestamp: reading.timestamp,
    }, { status: 201 });

  } catch (error: any) {
    console.error('Sensor data endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// GET - Retrieve sensor data for a dryer
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dryerId = searchParams.get('dryer_id');
    const limit = parseInt(searchParams.get('limit') || '100');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    if (!dryerId) {
      return NextResponse.json(
        { error: 'dryer_id parameter is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Get dryer UUID
    const { data: dryer, error: dryerError } = await supabase
      .from('dryers')
      .select('id')
      .eq('dryer_id', dryerId)
      .single();

    if (dryerError || !dryer) {
      return NextResponse.json(
        { error: 'Dryer not found' },
        { status: 404 }
      );
    }

    // Build query
    let query = supabase
      .from('sensor_readings')
      .select('*')
      .eq('dryer_id', dryer.id)
      .order('timestamp', { ascending: false })
      .limit(limit);

    // Add date filters if provided
    if (startDate) {
      query = query.gte('timestamp', startDate);
    }
    if (endDate) {
      query = query.lte('timestamp', endDate);
    }

    const { data: readings, error: readingsError } = await query;

    if (readingsError) {
      return NextResponse.json(
        { error: 'Failed to retrieve sensor data', details: readingsError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      dryer_id: dryerId,
      count: readings?.length || 0,
      readings: readings || [],
    });

  } catch (error: any) {
    console.error('Sensor data retrieval error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
