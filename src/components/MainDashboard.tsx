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
    try {
      const response = await fetch('/api/dashboard/stats');
      const data = await response.json();
      
      if (response.ok && data.stats) {
        setStats(data.stats);
      } else {
        console.error('Error fetching stats:', data.error);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchRecentAlerts = async () => {
    try {
      const response = await fetch('/api/dashboard/alerts');
      const data = await response.json();
      
      if (response.ok && data.alerts) {
        setRecentAlerts(data.alerts);
      } else {
        console.error('Error fetching alerts:', data.error);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  const fetchDryerLocations = async () => {
    try {
      const response = await fetch('/api/dashboard/locations');
      const data = await response.json();
      
      if (response.ok && data.locations) {
        setDryerLocations(data.locations);
      } else {
        console.error('Error fetching locations:', data.error);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
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
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Fleet overview and system status</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Dryers</CardTitle>
            <Wind className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats?.total_dryers || 0}</div>
            <p className="text-xs text-muted-foreground">Deployed units</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Active Dryers</CardTitle>
            <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-green-600">{stats?.active_dryers || 0}</div>
            <p className="text-xs text-muted-foreground">Currently operating</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Maintenance Needed</CardTitle>
            <Wrench className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-yellow-600">{stats?.maintenance_needed || 0}</div>
            <p className="text-xs text-muted-foreground">Due within 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-red-600">{stats?.total_alerts || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.critical_alerts || 0} critical
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Offline Dryers</CardTitle>
            <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats?.offline_dryers || 0}</div>
            <p className="text-xs text-muted-foreground">No communication &gt;1h</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Avg Battery Level</CardTitle>
            <Battery className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats?.avg_battery_level || 0}%</div>
            <p className="text-xs text-muted-foreground">Fleet average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Avg Chamber Temp</CardTitle>
            <Thermometer className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats?.avg_chamber_temp || 0}°C</div>
            <p className="text-xs text-muted-foreground">Fleet average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Fleet Status</CardTitle>
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-green-600">
              {stats?.total_dryers ? Math.round((stats.active_dryers / stats.total_dryers) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Operational rate</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-2">
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
                  <div key={alert.id} className="flex flex-col sm:flex-row items-start sm:justify-between border-b pb-3 last:border-0 gap-2">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={getPriorityColor(alert.priority) as any}>
                          {alert.priority}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {alert.dryer_identifier}
                        </span>
                      </div>
                      <p className="text-sm font-medium">{alert.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{alert.message}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
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
              <div className="space-y-2 max-h-[250px] sm:max-h-[300px] overflow-y-auto">
                {dryerLocations.slice(0, 10).map((dryer) => (
                  <div key={dryer.id} className="flex items-center justify-between text-sm border-b pb-2 gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{dryer.dryer_id}</p>
                      <p className="text-xs text-muted-foreground truncate">{dryer.region_name}</p>
                    </div>
                    <Badge variant={dryer.status === 'active' ? 'default' : 'secondary'} className="shrink-0">
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
