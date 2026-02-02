'use client'

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Database, AlertCircle, Thermometer, Settings2, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function DataViewer() {
  const [loading, setLoading] = useState(false);
  const [dryers, setDryers] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [sensorReadings, setSensorReadings] = useState<any[]>([]);
  const [presets, setPresets] = useState<any[]>([]);
  const [farmers, setFarmers] = useState<any[]>([]);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dryersRes, alertsRes, readingsRes, presetsRes, farmersRes] = await Promise.all([
        fetch('/api/data/dryers'),
        fetch('/api/data/alerts?status=active'),
        fetch('/api/data/sensor-readings?limit=50'),
        fetch('/api/data/presets'),
        fetch('/api/data/farmers'),
      ]);

      const [dryersData, alertsData, readingsData, presetsData, farmersData] = await Promise.all([
        dryersRes.json(),
        alertsRes.json(),
        readingsRes.json(),
        presetsRes.json(),
        farmersRes.json(),
      ]);

      setDryers(dryersData.dryers || []);
      setAlerts(alertsData.alerts || []);
      setSensorReadings(readingsData.readings || []);
      setPresets(presetsData.presets || []);
      setFarmers(farmersData.farmers || []);

      toast({
        title: 'Data Loaded',
        description: `Loaded ${dryersData.count} dryers, ${alertsData.count} alerts, ${readingsData.count} readings`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load data from Supabase',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      active: 'default',
      idle: 'secondary',
      offline: 'destructive',
      maintenance: 'outline',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, any> = {
      critical: 'destructive',
      warning: 'default',
      info: 'secondary',
    };
    return <Badge variant={variants[severity] || 'default'}>{severity}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Supabase Data Viewer</h2>
          <p className="text-muted-foreground">
            View all data from your Supabase tables
          </p>
        </div>
        <Button onClick={fetchData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Dryers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dryers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sensor Readings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sensorReadings.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Presets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{presets.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Farmers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{farmers.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="dryers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dryers">
            <Database className="h-4 w-4 mr-2" />
            Dryers ({dryers.length})
          </TabsTrigger>
          <TabsTrigger value="alerts">
            <AlertCircle className="h-4 w-4 mr-2" />
            Alerts ({alerts.length})
          </TabsTrigger>
          <TabsTrigger value="readings">
            <Thermometer className="h-4 w-4 mr-2" />
            Sensor Readings ({sensorReadings.length})
          </TabsTrigger>
          <TabsTrigger value="presets">
            <Settings2 className="h-4 w-4 mr-2" />
            Presets ({presets.length})
          </TabsTrigger>
          <TabsTrigger value="farmers">
            <Users className="h-4 w-4 mr-2" />
            Farmers ({farmers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dryers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dryers Table</CardTitle>
              <CardDescription>All dryer devices from Supabase</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dryer ID</TableHead>
                      <TableHead>Serial Number</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Region</TableHead>
                      <TableHead>Battery</TableHead>
                      <TableHead>Last Communication</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dryers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                          No dryers found in database
                        </TableCell>
                      </TableRow>
                    ) : (
                      dryers.map((dryer) => (
                        <TableRow key={dryer.id}>
                          <TableCell className="font-medium">{dryer.dryer_id}</TableCell>
                          <TableCell>{dryer.serial_number}</TableCell>
                          <TableCell>{getStatusBadge(dryer.status)}</TableCell>
                          <TableCell>{dryer.owner?.name || 'N/A'}</TableCell>
                          <TableCell>{dryer.region?.name || 'N/A'}</TableCell>
                          <TableCell>{dryer.battery_level ? `${dryer.battery_level}%` : 'N/A'}</TableCell>
                          <TableCell>
                            {dryer.last_communication
                              ? new Date(dryer.last_communication).toLocaleString()
                              : 'Never'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alerts Table</CardTitle>
              <CardDescription>Active alerts from Supabase</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Severity</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Dryer</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alerts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          No active alerts found
                        </TableCell>
                      </TableRow>
                    ) : (
                      alerts.map((alert) => (
                        <TableRow key={alert.id}>
                          <TableCell>{getSeverityBadge(alert.severity)}</TableCell>
                          <TableCell>{alert.type}</TableCell>
                          <TableCell className="max-w-md truncate">{alert.message}</TableCell>
                          <TableCell>{alert.dryer?.dryer_id || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{alert.status}</Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(alert.created_at).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="readings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sensor Readings Table</CardTitle>
              <CardDescription>Latest 50 sensor readings from Supabase</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Dryer</TableHead>
                      <TableHead>Chamber Temp</TableHead>
                      <TableHead>Humidity</TableHead>
                      <TableHead>Battery</TableHead>
                      <TableHead>Fan Status</TableHead>
                      <TableHead>Heater Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sensorReadings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                          No sensor readings found
                        </TableCell>
                      </TableRow>
                    ) : (
                      sensorReadings.map((reading) => (
                        <TableRow key={reading.id}>
                          <TableCell>
                            {new Date(reading.timestamp).toLocaleString()}
                          </TableCell>
                          <TableCell>{reading.dryer?.dryer_id || 'N/A'}</TableCell>
                          <TableCell>
                            {reading.chamber_temp ? `${reading.chamber_temp}°C` : 'N/A'}
                          </TableCell>
                          <TableCell>
                            {reading.internal_humidity ? `${reading.internal_humidity}%` : 'N/A'}
                          </TableCell>
                          <TableCell>
                            {reading.battery_level ? `${reading.battery_level}%` : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={reading.fan_status ? 'default' : 'secondary'}>
                              {reading.fan_status ? 'ON' : 'OFF'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={reading.heater_status ? 'default' : 'secondary'}>
                              {reading.heater_status ? 'ON' : 'OFF'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="presets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Presets Table</CardTitle>
              <CardDescription>Drying presets from Supabase</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Preset ID</TableHead>
                      <TableHead>Crop Type</TableHead>
                      <TableHead>Region</TableHead>
                      <TableHead>Target Temp</TableHead>
                      <TableHead>Target Humidity</TableHead>
                      <TableHead>Fan Speed</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Active</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {presets.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground">
                          No presets found
                        </TableCell>
                      </TableRow>
                    ) : (
                      presets.map((preset) => (
                        <TableRow key={preset.id}>
                          <TableCell className="font-medium">{preset.preset_id}</TableCell>
                          <TableCell>{preset.crop_type}</TableCell>
                          <TableCell>{preset.region}</TableCell>
                          <TableCell>{preset.target_temp_c}°C</TableCell>
                          <TableCell>{preset.target_humidity_pct}%</TableCell>
                          <TableCell>{preset.fan_speed_rpm} RPM</TableCell>
                          <TableCell>{preset.duration_hours}h</TableCell>
                          <TableCell>
                            <Badge variant={preset.is_active ? 'default' : 'secondary'}>
                              {preset.is_active ? 'Yes' : 'No'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="farmers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Farmers/Owners Table</CardTitle>
              <CardDescription>Dryer owners from Supabase</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Farm/Business</TableHead>
                      <TableHead>ID Number</TableHead>
                      <TableHead>Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {farmers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          No farmers/owners found
                        </TableCell>
                      </TableRow>
                    ) : (
                      farmers.map((farmer) => (
                        <TableRow key={farmer.id}>
                          <TableCell className="font-medium">{farmer.name}</TableCell>
                          <TableCell>{farmer.phone || 'N/A'}</TableCell>
                          <TableCell>{farmer.email || 'N/A'}</TableCell>
                          <TableCell>{farmer.farm_business_name || 'N/A'}</TableCell>
                          <TableCell>{farmer.id_number || 'N/A'}</TableCell>
                          <TableCell className="max-w-xs truncate">{farmer.address || 'N/A'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
