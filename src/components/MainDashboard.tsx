'use client'

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Wind, 
  Activity, 
  AlertTriangle, 
  Wrench,
  MapPin,
  TrendingUp,
  Battery,
  Thermometer
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface DashboardStats {
  total_dryers: number;
  active_dryers: number;
  offline_dryers: number;
  maintenance_needed: number;
  critical_alerts: number;
  total_alerts: number;
  avg_battery_level: number;
  avg_chamber_temp: number;
}

interface RecentAlert {
  id: string;
  dryer_id: string;
  dryer_identifier: string;
  alert_type: string;
  priority: string;
  title: string;
  message: string;
  triggered_at: string;
  status: string;
}

interface DryerLocation {
  id: string;
  dryer_id: string;
  location_latitude: number;
  location_longitude: number;
  location_address: string;
  status: string;
  region_name: string;
}

export function MainDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentAlerts, setRecentAlerts] = useState<RecentAlert[]>([]);
  const [dryerLocations, setDryerLocations] = useState<DryerLocation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      await Promise.all([
        fetchStats(),
        fetchRecentAlerts(),
        fetchDryerLocations()
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    // Fetch dryer counts
    const { data: dryers } = await supabase
      .from('dryers')
      .select('status, last_communication');

    const total = dryers?.length || 0;
    const active = dryers?.filter(d => d.status === 'active').length || 0;
    const offline = dryers?.filter(d => {
      if (!d.last_communication) return true;
      const lastComm = new Date(d.last_communication);
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
      return lastComm < hourAgo;
    }).length || 0;

    // Fetch maintenance needed
    const { data: maintenance } = await supabase
      .from('maintenance_schedules')
      .select('id')
      .eq('status', 'scheduled')
      .lte('scheduled_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString());

    // Fetch alerts
    const { data: alerts } = await supabase
      .from('alerts')
      .select('priority')
      .eq('status', 'active');

    const criticalAlerts = alerts?.filter(a => a.priority === 'critical').length || 0;

    // Fetch latest sensor readings for averages
    const { data: latestReadings } = await supabase
      .from('latest_sensor_readings')
      .select('battery_level, chamber_temp');

    const avgBattery = latestReadings?.reduce((sum, r) => sum + (r.battery_level || 0), 0) / (latestReadings?.length || 1);
    const avgTemp = latestReadings?.reduce((sum, r) => sum + (r.chamber_temp || 0), 0) / (latestReadings?.length || 1);

    setStats({
      total_dryers: total,
      active_dryers: active,
      offline_dryers: offline,
      maintenance_needed: maintenance?.length || 0,
      critical_alerts: criticalAlerts,
      total_alerts: alerts?.length || 0,
      avg_battery_level: Math.round(avgBattery),
      avg_chamber_temp: Math.round(avgTemp * 10) / 10
    });
  };

  const fetchRecentAlerts = async () => {
    const { data } = await supabase
      .from('alerts')
      .select(`
        id,
        alert_type,
        priority,
        title,
        message,
        triggered_at,
        status,
        dryers!inner(dryer_id)
      `)
      .eq('status', 'active')
      .order('triggered_at', { ascending: false })
      .limit(5);

    if (data) {
      setRecentAlerts(data.map(alert => ({
        ...alert,
        dryer_identifier: (alert.dryers as any).dryer_id
      })));
    }
  };

  const fetchDryerLocations = async () => {
    const { data } = await supabase
      .from('dryers')
      .select(`
        id,
        dryer_id,
        location_latitude,
        location_longitude,
        location_address,
        status,
        regions(name)
      `)
      .not('location_latitude', 'is', null)
      .not('location_longitude', 'is', null);

    if (data) {
      setDryerLocations(data.map(d => ({
        ...d,
        region_name: (d.regions as any)?.name || 'Unknown'
      })));
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Activity className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Fleet overview and system status</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Dryers</CardTitle>
            <Wind className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_dryers || 0}</div>
            <p className="text-xs text-muted-foreground">Deployed units</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Dryers</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.active_dryers || 0}</div>
            <p className="text-xs text-muted-foreground">Currently operating</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance Needed</CardTitle>
            <Wrench className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats?.maintenance_needed || 0}</div>
            <p className="text-xs text-muted-foreground">Due within 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.total_alerts || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.critical_alerts || 0} critical
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offline Dryers</CardTitle>
            <Activity className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.offline_dryers || 0}</div>
            <p className="text-xs text-muted-foreground">No communication &gt;1h</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Battery Level</CardTitle>
            <Battery className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.avg_battery_level || 0}%</div>
            <p className="text-xs text-muted-foreground">Fleet average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Chamber Temp</CardTitle>
            <Thermometer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.avg_chamber_temp || 0}°C</div>
            <p className="text-xs text-muted-foreground">Fleet average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fleet Status</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.total_dryers ? Math.round((stats.active_dryers / stats.total_dryers) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Operational rate</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Recent Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentAlerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active alerts</p>
            ) : (
              <div className="space-y-3">
                {recentAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-start justify-between border-b pb-3 last:border-0">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={getPriorityColor(alert.priority) as any}>
                          {alert.priority}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {alert.dryer_identifier}
                        </span>
                      </div>
                      <p className="text-sm font-medium">{alert.title}</p>
                      <p className="text-xs text-muted-foreground">{alert.message}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                      {new Date(alert.triggered_at).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Map View */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Dryer Locations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {dryerLocations.length} dryers with GPS coordinates
              </p>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {dryerLocations.slice(0, 10).map((dryer) => (
                  <div key={dryer.id} className="flex items-center justify-between text-sm border-b pb-2">
                    <div>
                      <p className="font-medium">{dryer.dryer_id}</p>
                      <p className="text-xs text-muted-foreground">{dryer.region_name}</p>
                    </div>
                    <Badge variant={dryer.status === 'active' ? 'default' : 'secondary'}>
                      {dryer.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
