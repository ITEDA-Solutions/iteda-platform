'use client'

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Thermometer, 
  Droplets, 
  Fan, 
  Zap, 
  Battery, 
  Sun,
  Power,
  DoorOpen,
  Activity
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface SensorReading {
  id: string;
  timestamp: string;
  chamber_temp?: number;
  ambient_temp?: number;
  heater_temp?: number;
  internal_humidity?: number;
  external_humidity?: number;
  fan_speed_rpm?: number;
  fan_speed_percentage?: number;
  fan_status?: boolean;
  heater_status?: boolean;
  door_status?: boolean;
  solar_voltage?: number;
  battery_level?: number;
  battery_voltage?: number;
  power_consumption_w?: number;
  charging_status?: string;
}

interface RealtimeSensorDataProps {
  dryerId: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

export function RealtimeSensorData({ 
  dryerId, 
  autoRefresh = true, 
  refreshInterval = 30000 
}: RealtimeSensorDataProps) {
  const [latestReading, setLatestReading] = useState<SensorReading | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'recent' | 'offline'>('offline');

  useEffect(() => {
    fetchLatestReading();

    if (autoRefresh) {
      const interval = setInterval(fetchLatestReading, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [dryerId, autoRefresh, refreshInterval]);

  const fetchLatestReading = async () => {
    try {
      const { data, error } = await supabase
        .from('sensor_readings')
        .select('*')
        .eq('dryer_id', dryerId)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching sensor data:', error);
        return;
      }

      if (data) {
        setLatestReading(data);
        updateConnectionStatus(data.timestamp);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateConnectionStatus = (timestamp: string) => {
    const lastUpdate = new Date(timestamp);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastUpdate.getTime()) / 1000 / 60;

    if (diffMinutes < 5) {
      setConnectionStatus('online');
    } else if (diffMinutes < 60) {
      setConnectionStatus('recent');
    } else {
      setConnectionStatus('offline');
    }
  };

  const getStatusColor = (status: typeof connectionStatus) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'recent': return 'bg-yellow-500';
      case 'offline': return 'bg-red-500';
    }
  };

  const getStatusText = (status: typeof connectionStatus) => {
    switch (status) {
      case 'online': return 'Online';
      case 'recent': return 'Recent';
      case 'offline': return 'Offline';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Activity className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading sensor data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!latestReading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            No sensor data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Real-Time Sensor Data</CardTitle>
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${getStatusColor(connectionStatus)}`} />
              <Badge variant="outline">{getStatusText(connectionStatus)}</Badge>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Last updated: {formatDistanceToNow(new Date(latestReading.timestamp), { addSuffix: true })}
          </p>
        </CardHeader>
      </Card>

      {/* Temperature Sensors */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Thermometer className="h-5 w-5" />
            Temperature Sensors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Chamber</p>
              <p className="text-2xl font-bold">
                {latestReading.chamber_temp?.toFixed(1) || '--'}°C
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Ambient</p>
              <p className="text-2xl font-bold">
                {latestReading.ambient_temp?.toFixed(1) || '--'}°C
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Heater</p>
              <p className="text-2xl font-bold">
                {latestReading.heater_temp?.toFixed(1) || '--'}°C
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Humidity Sensors */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Droplets className="h-5 w-5" />
            Humidity Sensors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Internal</p>
              <p className="text-2xl font-bold">
                {latestReading.internal_humidity?.toFixed(1) || '--'}%
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">External</p>
              <p className="text-2xl font-bold">
                {latestReading.external_humidity?.toFixed(1) || '--'}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Operational Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Operational Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Fan className="h-4 w-4" />
                <span>Fan</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={latestReading.fan_status ? "default" : "secondary"}>
                  {latestReading.fan_status ? 'ON' : 'OFF'}
                </Badge>
                {latestReading.fan_speed_rpm && (
                  <span className="text-sm font-medium">{latestReading.fan_speed_rpm} RPM</span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Zap className="h-4 w-4" />
                <span>Heater</span>
              </div>
              <Badge variant={latestReading.heater_status ? "destructive" : "secondary"}>
                {latestReading.heater_status ? 'ON' : 'OFF'}
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DoorOpen className="h-4 w-4" />
                <span>Door</span>
              </div>
              <Badge variant={latestReading.door_status ? "outline" : "secondary"}>
                {latestReading.door_status ? 'OPEN' : 'CLOSED'}
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Power className="h-4 w-4" />
                <span>Power</span>
              </div>
              <span className="text-sm font-medium">
                {latestReading.power_consumption_w?.toFixed(1) || '--'} W
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Power Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Battery className="h-5 w-5" />
            Power Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sun className="h-4 w-4" />
                <span>Solar Voltage</span>
              </div>
              <p className="text-xl font-bold">
                {latestReading.solar_voltage?.toFixed(2) || '--'} V
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Battery className="h-4 w-4" />
                <span>Battery Level</span>
              </div>
              <div className="space-y-1">
                <p className="text-xl font-bold">
                  {latestReading.battery_level || '--'}%
                </p>
                {latestReading.battery_level !== undefined && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        latestReading.battery_level > 60 ? 'bg-green-500' :
                        latestReading.battery_level > 30 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${latestReading.battery_level}%` }}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Zap className="h-4 w-4" />
                <span>Battery Voltage</span>
              </div>
              <p className="text-xl font-bold">
                {latestReading.battery_voltage?.toFixed(2) || '--'} V
              </p>
              {latestReading.charging_status && (
                <Badge variant="outline" className="text-xs">
                  {latestReading.charging_status}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
