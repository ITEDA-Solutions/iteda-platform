import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Export sensor data as CSV
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dryerId = searchParams.get('dryer_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const format = searchParams.get('format') || 'csv';

    if (!dryerId) {
      return NextResponse.json(
        { error: 'dryer_id parameter is required' },
        { status: 400 }
      );
    }

    // Get dryer UUID
    const { data: dryer, error: dryerError } = await supabase
      .from('dryers')
      .select('id, dryer_id')
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
      .order('timestamp', { ascending: true });

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

    if (format === 'csv') {
      // Generate CSV
      const csv = generateCSV(readings || [], dryer.dryer_id);
      
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="sensor-data-${dryer.dryer_id}-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    } else {
      // Return JSON
      return NextResponse.json({
        dryer_id: dryer.dryer_id,
        start_date: startDate,
        end_date: endDate,
        count: readings?.length || 0,
        data: readings || [],
      });
    }

  } catch (error: any) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

function generateCSV(readings: any[], dryerId: string): string {
  if (readings.length === 0) {
    return 'No data available';
  }

  // CSV Headers
  const headers = [
    'Timestamp',
    'Dryer ID',
    'Chamber Temp (°C)',
    'Ambient Temp (°C)',
    'Heater Temp (°C)',
    'Internal Humidity (%)',
    'External Humidity (%)',
    'Fan Speed (RPM)',
    'Fan Speed (%)',
    'Fan Status',
    'Heater Status',
    'Door Status',
    'Solar Voltage (V)',
    'Battery Level (%)',
    'Battery Voltage (V)',
    'Power Consumption (W)',
    'Charging Status',
  ];

  // CSV Rows
  const rows = readings.map(reading => [
    reading.timestamp,
    dryerId,
    reading.chamber_temp || '',
    reading.ambient_temp || '',
    reading.heater_temp || '',
    reading.internal_humidity || '',
    reading.external_humidity || '',
    reading.fan_speed_rpm || '',
    reading.fan_speed_percentage || '',
    reading.fan_status ? 'ON' : 'OFF',
    reading.heater_status ? 'ON' : 'OFF',
    reading.door_status ? 'OPEN' : 'CLOSED',
    reading.solar_voltage || '',
    reading.battery_level || '',
    reading.battery_voltage || '',
    reading.power_consumption_w || '',
    reading.charging_status || '',
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  return csvContent;
}
