'use client'

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, AlertTriangle, Battery, BatteryCharging, 
  Calendar, MapPin, Cpu, ThermometerSun, Droplets, 
  Fan, Zap, Signal, User, Clock, Gauge, ArrowLeft,
  CheckCircle2, XCircle, AlertCircle, Loader2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface DryerData {
  id: string;
  dryer_id: string;
  serial_number: string;
  status: string;
  deployment_date: string;
  
  // Location
  location_latitude: number;
  location_longitude: number;
  location_address: string;
  region: { name: string; code: string };
  
  // Hardware
  num_temp_sensors: number;
  num_humidity_sensors: number;
  num_fans: number;
  num_heaters: number;
  solar_capacity_w: number;
  battery_capacity_ah: number;
  
  // Operational
  last_communication: string;
  total_runtime_hours: number;
  battery_level: number;
  battery_voltage: number;
  signal_strength: number;
  active_alerts_count: number;
  
  // Owner
  dryer_owners: {
    name: string;
    phone: string;
    email: string;
    address: string;
    farm_business_name: string;
    id_number: string;
  };
  
  // Current preset
  presets: {
    crop_type: string;
    target_temp_c: number;
    target_humidity_pct: number;
  };
}

export function DryerDetailView() {
  const params = useParams();
  const router = useRouter();
  const [dryer, setDryer] = useState<DryerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [latestReading, setLatestReading] = useState<any>(null);

  useEffect(() => {
    if (params?.id) {
      loadDryerData();
      loadLatestReading();
      
      // Auto-refresh every 30 seconds
      const interval = setInterval(() => {
        loadDryerData();
        loadLatestReading();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [params?.id]);

  const loadDryerData = async () => {
    try {
      const { data, error } = await supabase
        .from('dryers')
        .select(`
          *,
          region:regions(name, code),
          dryer_owners(name, phone, email, address, farm_business_name, id_number),
          presets(crop_type, target_temp_c, target_humidity_pct)
        `)
        .eq('id', params?.id)
        .single();

      if (error) throw error;
      setDryer(data);
    } catch (error: any) {
      console.error('Error loading dryer:', error);
      toast.error('Failed to load dryer details');
    } finally {
      setLoading(false);
    }
  };

  const loadLatestReading = async () => {
    try {
      const { data, error } = await supabase
        .from('sensor_readings')
        .select('*')
        .eq('dryer_id', params?.id)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        setLatestReading(data);
      }
    } catch (error) {
      // No readings yet
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-500',
      idle: 'bg-blue-500',
      offline: 'bg-gray-500',
      maintenance: 'bg-yellow-500',
      decommissioned: 'bg-red-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Activity className="h-4 w-4" />;
      case 'idle':
        return <Clock className="h-4 w-4" />;
      case 'offline':
        return <XCircle className="h-4 w-4" />;
      case 'maintenance':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <CheckCircle2 className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      active: 'Active - Currently drying',
      idle: 'Idle - Powered on, not drying',
      offline: 'Offline - No communication in last 15 minutes',
      maintenance: 'Maintenance - Marked for service',
      decommissioned: 'Decommissioned - No longer in service',
    };
    return texts[status] || status;
  };

  const getSignalStrength = (strength: number) => {
    if (strength >= 80) return { label: 'Excellent', color: 'text-green-600' };
    if (strength >= 60) return { label: 'Good', color: 'text-blue-600' };
    if (strength >= 40) return { label: 'Fair', color: 'text-yellow-600' };
    return { label: 'Poor', color: 'text-red-600' };
  };

  const getBatteryStatus = (level: number) => {
    if (level >= 80) return { icon: Battery, color: 'text-green-600' };
    if (level >= 50) return { icon: Battery, color: 'text-blue-600' };
    if (level >= 20) return { icon: Battery, color: 'text-yellow-600' };
    return { icon: Battery, color: 'text-red-600' };
  };

  const getDeploymentDuration = (deploymentDate: string) => {
    const days = Math.floor((Date.now() - new Date(deploymentDate).getTime()) / (1000 * 60 * 60 * 24));
    return `${days} days active`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!dryer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <XCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg text-muted-foreground">Dryer not found</p>
        <Button onClick={() => router.push('/dashboard/dryers')} className="mt-4">
          Back to Dryers
        </Button>
      </div>
    );
  }

  const BatteryIcon = getBatteryStatus(dryer.battery_level || 0).icon;
  const signalInfo = getSignalStrength(dryer.signal_strength || 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/dryers')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{dryer.dryer_id}</h1>
            <p className="text-muted-foreground">Serial: {dryer.serial_number}</p>
          </div>
        </div>
        
        <Badge className={`${getStatusColor(dryer.status)} text-white`}>
          <span className="flex items-center gap-2">
            {getStatusIcon(dryer.status)}
            {dryer.status.toUpperCase()}
          </span>
        </Badge>
      </div>

      {/* Status Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Operational Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dryer.status}</div>
            <p className="text-xs text-muted-foreground">{getStatusText(dryer.status)}</p>
          </CardContent>
        </Card>

        {/* Last Communication */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Communication</CardTitle>
            <Signal className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dryer.last_communication ? formatDistanceToNow(new Date(dryer.last_communication), { addSuffix: true }) : 'Never'}
            </div>
            <p className={`text-xs ${signalInfo.color}`}>
              Signal: {signalInfo.label} ({dryer.signal_strength || 0}%)
            </p>
          </CardContent>
        </Card>

        {/* Runtime */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Runtime</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dryer.total_runtime_hours}h</div>
            <p className="text-xs text-muted-foreground">
              {getDeploymentDuration(dryer.deployment_date)}
            </p>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dryer.active_alerts_count || 0}</div>
            <p className="text-xs text-muted-foreground">
              {dryer.active_alerts_count > 0 ? 'Requires attention' : 'No active alerts'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="hardware">Hardware</TabsTrigger>
          <TabsTrigger value="power">Power & Battery</TabsTrigger>
          <TabsTrigger value="owner">Owner</TabsTrigger>
          <TabsTrigger value="realtime">Real-Time Data</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Location */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Installation Location
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm font-medium">Region/County</p>
                  <p className="text-sm text-muted-foreground">{dryer.region?.name || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Address</p>
                  <p className="text-sm text-muted-foreground">{dryer.location_address || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">GPS Coordinates</p>
                  <p className="text-sm text-muted-foreground">
                    {dryer.location_latitude && dryer.location_longitude
                      ? `${dryer.location_latitude}, ${dryer.location_longitude}`
                      : 'Not available'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Deployment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Deployment Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm font-medium">Deployment Date</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(dryer.deployment_date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Duration Active</p>
                  <p className="text-sm text-muted-foreground">
                    {getDeploymentDuration(dryer.deployment_date)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Current Preset</p>
                  <p className="text-sm text-muted-foreground">
                    {dryer.presets?.crop_type || 'None assigned'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Hardware Tab */}
        <TabsContent value="hardware" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-5 w-5" />
                Hardware Configuration
              </CardTitle>
              <CardDescription>Installed sensors and modules</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <ThermometerSun className="h-5 w-5 text-orange-600" />
                      <span className="font-medium">Temperature Sensors</span>
                    </div>
                    <Badge variant="secondary">{dryer.num_temp_sensors}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <Droplets className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">Humidity Sensors</span>
                    </div>
                    <Badge variant="secondary">{dryer.num_humidity_sensors}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <Fan className="h-5 w-5 text-green-600" />
                      <span className="font-medium">Fans</span>
                    </div>
                    <Badge variant="secondary">{dryer.num_fans}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-yellow-600" />
                      <span className="font-medium">Heaters</span>
                    </div>
                    <Badge variant="secondary">{dryer.num_heaters}</Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg">
                    <p className="text-sm font-medium mb-1">Solar Panel Capacity</p>
                    <p className="text-2xl font-bold">{dryer.solar_capacity_w || 'N/A'} W</p>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg">
                    <p className="text-sm font-medium mb-1">Battery Capacity</p>
                    <p className="text-2xl font-bold">{dryer.battery_capacity_ah || 'N/A'} Ah</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Power & Battery Tab */}
        <TabsContent value="power" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BatteryIcon className={`h-5 w-5 ${getBatteryStatus(dryer.battery_level || 0).color}`} />
                  Battery Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Charge Level</span>
                    <span className="text-2xl font-bold">{dryer.battery_level || 0}%</span>
                  </div>
                  <Progress value={dryer.battery_level || 0} className="h-2" />
                </div>
                
                <div>
                  <p className="text-sm font-medium">Voltage</p>
                  <p className="text-xl font-bold">{dryer.battery_voltage || 0}V</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium">Charging Status</p>
                  <div className="flex items-center gap-2">
                    {latestReading?.charging_status === 'charging' ? (
                      <>
                        <BatteryCharging className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-600">Charging from solar</span>
                      </>
                    ) : (
                      <>
                        <Battery className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Not charging</span>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Power Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium">Solar Voltage</p>
                  <p className="text-xl font-bold">{latestReading?.solar_voltage || 0}V</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium">Power Consumption</p>
                  <p className="text-xl font-bold">{latestReading?.power_consumption_w || 0}W</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium">Solar Panel Status</p>
                  <p className="text-sm text-muted-foreground">
                    {dryer.solar_capacity_w ? `${dryer.solar_capacity_w}W capacity` : 'Not configured'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Owner Tab */}
        <TabsContent value="owner" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Owner Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium">Name</p>
                  <p className="text-sm text-muted-foreground">{dryer.dryer_owners?.name || 'Not specified'}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-sm text-muted-foreground">{dryer.dryer_owners?.phone || 'Not specified'}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{dryer.dryer_owners?.email || 'Not specified'}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium">Farm/Business Name</p>
                  <p className="text-sm text-muted-foreground">{dryer.dryer_owners?.farm_business_name || 'Not specified'}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium">ID/Registration Number</p>
                  <p className="text-sm text-muted-foreground">{dryer.dryer_owners?.id_number || 'Not specified'}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium">Address</p>
                  <p className="text-sm text-muted-foreground">{dryer.dryer_owners?.address || 'Not specified'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Real-Time Data Tab */}
        <TabsContent value="realtime" className="space-y-4">
          {latestReading ? (
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Chamber Temperature</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{latestReading.chamber_temp}°C</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Target: {dryer.presets?.target_temp_c || 'N/A'}°C
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Internal Humidity</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{latestReading.internal_humidity}%</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Target: {dryer.presets?.target_humidity_pct || 'N/A'}%
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Fan Speed</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{latestReading.fan_speed_rpm} RPM</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Status: {latestReading.fan_status ? 'Running' : 'Off'}
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Gauge className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No sensor data available</p>
                <p className="text-sm text-muted-foreground">Waiting for first communication from dryer</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
