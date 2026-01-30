import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client with service role for bypassing RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

    // Prepare sensor reading data
    const sensorData = {
      dryer_id: dryer.id,
      timestamp: payload.timestamp ? new Date(payload.timestamp).toISOString() : new Date().toISOString(),
      chamber_temp: payload.chamber_temp,
      ambient_temp: payload.ambient_temp,
      heater_temp: payload.heater_temp,
      internal_humidity: payload.internal_humidity,
      external_humidity: payload.external_humidity,
      fan_speed_rpm: payload.fan_speed_rpm,
      fan_speed_percentage: payload.fan_speed_percentage,
      fan_status: payload.fan_status,
      heater_status: payload.heater_status,
      door_status: payload.door_status,
      solar_voltage: payload.solar_voltage,
      battery_level: payload.battery_level,
      battery_voltage: payload.battery_voltage,
      power_consumption_w: payload.power_consumption_w,
      charging_status: payload.charging_status,
      active_preset_id: payload.active_preset_id,
      data_quality_score: payload.data_quality_score || 1.0,
    };

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
