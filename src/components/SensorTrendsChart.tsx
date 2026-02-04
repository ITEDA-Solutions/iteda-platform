'use client'

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface SensorReading {
  timestamp: string;
  chamber_temp: number;
  ambient_temp: number;
  heater_temp: number;
  internal_humidity: number;
  external_humidity: number;
}

interface SensorTrendsChartProps {
  dryerId: string;
  chartType: 'temperature' | 'humidity';
}

export function SensorTrendsChart({ dryerId, chartType }: SensorTrendsChartProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'6h' | '24h' | '7d' | '30d'>('24h');

  useEffect(() => {
    fetchData();
  }, [dryerId, timeRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const now = new Date();
      let startTime = new Date();

      // Calculate start time based on selected range
      switch (timeRange) {
        case '6h':
          startTime.setHours(now.getHours() - 6);
          break;
        case '24h':
          startTime.setHours(now.getHours() - 24);
          break;
        case '7d':
          startTime.setDate(now.getDate() - 7);
          break;
        case '30d':
          startTime.setDate(now.getDate() - 30);
          break;
      }

      const { data: readings, error } = await supabase
        .from('sensor_readings')
        .select('timestamp, chamber_temp, ambient_temp, heater_temp, internal_humidity, external_humidity')
        .eq('dryer_id', dryerId)
        .gte('timestamp', startTime.toISOString())
        .order('timestamp', { ascending: true });

      if (error) throw error;

      // Format data for chart
      const formattedData = readings?.map(reading => ({
        time: new Date(reading.timestamp).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        chamberTemp: reading.chamber_temp,
        ambientTemp: reading.ambient_temp,
        heaterTemp: reading.heater_temp,
        internalHumidity: reading.internal_humidity,
        externalHumidity: reading.external_humidity,
      })) || [];

      setData(formattedData);
    } catch (error) {
      console.error('Error fetching sensor data:', error);
    } finally {
      setLoading(false);
    }
  };

  const timeRangeButtons = [
    { value: '6h' as const, label: '6 Hours' },
    { value: '24h' as const, label: '24 Hours' },
    { value: '7d' as const, label: '7 Days' },
    { value: '30d' as const, label: '30 Days' },
  ];

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-80">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>
            {chartType === 'temperature' ? 'Temperature Trends' : 'Humidity Trends'}
          </CardTitle>
          <div className="flex gap-2">
            {timeRangeButtons.map(({ value, label }) => (
              <Button
                key={value}
                variant={timeRange === value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange(value)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-80 flex items-center justify-center text-gray-500">
            No data available for selected time range
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            {chartType === 'temperature' ? (
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  label={{ value: 'Temperature (°C)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="chamberTemp" 
                  stroke="#ef4444" 
                  name="Chamber Temp"
                  strokeWidth={2}
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="ambientTemp" 
                  stroke="#3b82f6" 
                  name="Ambient Temp"
                  strokeWidth={2}
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="heaterTemp" 
                  stroke="#f59e0b" 
                  name="Heater Temp"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            ) : (
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  label={{ value: 'Humidity (%)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="internalHumidity" 
                  stroke="#10b981" 
                  name="Internal Humidity"
                  strokeWidth={2}
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="externalHumidity" 
                  stroke="#6366f1" 
                  name="External Humidity"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
