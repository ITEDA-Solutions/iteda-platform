'use client'

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface PowerMetricsChartProps {
  dryerId: string;
}

export function PowerMetricsChart({ dryerId }: PowerMetricsChartProps) {
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
        .select('timestamp, battery_level, battery_voltage, solar_voltage, power_consumption_w')
        .eq('dryer_id', dryerId)
        .gte('timestamp', startTime.toISOString())
        .order('timestamp', { ascending: true });

      if (error) throw error;

      const formattedData = readings?.map(reading => ({
        time: new Date(reading.timestamp).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        batteryLevel: reading.battery_level,
        solarVoltage: reading.solar_voltage,
        batteryVoltage: reading.battery_voltage,
        powerConsumption: reading.power_consumption_w,
      })) || [];

      setData(formattedData);
    } catch (error) {
      console.error('Error fetching power data:', error);
    } finally {
      setLoading(false);
    }
  };

  const timeRangeButtons = [
    { value: '6h' as const, label: '6H' },
    { value: '24h' as const, label: '24H' },
    { value: '7d' as const, label: '7D' },
    { value: '30d' as const, label: '30D' },
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
          <CardTitle>Power & Battery Metrics</CardTitle>
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
            No power data available for selected time range
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
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
                yAxisId="left"
                label={{ value: 'Battery Level (%)', angle: -90, position: 'insideLeft' }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                label={{ value: 'Voltage (V)', angle: 90, position: 'insideRight' }}
              />
              <Tooltip />
              <Legend />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="batteryLevel" 
                stroke="#22c55e" 
                name="Battery Level (%)"
                strokeWidth={2}
                dot={false}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="solarVoltage" 
                stroke="#f59e0b" 
                name="Solar Voltage (V)"
                strokeWidth={2}
                dot={false}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="batteryVoltage" 
                stroke="#3b82f6" 
                name="Battery Voltage (V)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
