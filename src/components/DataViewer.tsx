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
  const [owners, setOwners] = useState<any[]>([]);
  const [regions, setRegions] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [staffRoles, setStaffRoles] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [
        dryersRes, alertsRes, readingsRes, presetsRes, ownersRes,
        regionsRes, profilesRes, rolesRes, assignmentsRes
      ] = await Promise.all([
        fetch('/api/data/dryers'),
        fetch('/api/data/alerts'),
        fetch('/api/data/sensor-readings?limit=50'),
        fetch('/api/data/presets'),
        fetch('/api/data/farmers'),
        fetch('/api/data/regions'),
        fetch('/api/data/profiles'),
        fetch('/api/data/staff-roles'),
        fetch('/api/data/dryer-assignments'),
      ]);

      const [
        dryersData, alertsData, readingsData, presetsData, ownersData,
        regionsData, profilesData, rolesData, assignmentsData
      ] = await Promise.all([
        dryersRes.json(),
        alertsRes.json(),
        readingsRes.json(),
        presetsRes.json(),
        ownersRes.json(),
        regionsRes.json(),
        profilesRes.json(),
        rolesRes.json(),
        assignmentsRes.json(),
      ]);

      setDryers(dryersData.dryers || []);
      setAlerts(alertsData.alerts || []);
      setSensorReadings(readingsData.readings || []);
      setPresets(presetsData.presets || []);
      setOwners(ownersData.owners || ownersData.farmers || []);
      setRegions(regionsData.regions || []);
      setProfiles(profilesData.profiles || []);
      setStaffRoles(rolesData.roles || []);
      setAssignments(assignmentsData.assignments || []);

      toast({
        title: 'Data Loaded Successfully',
        description: `Loaded ${dryersData.count || 0} dryers, ${alertsData.count || 0} alerts, ${presetsData.count || 0} presets, ${regionsData.count || 0} regions`,
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <CardTitle className="text-sm font-medium">Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts.length}</div>
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
            <CardTitle className="text-sm font-medium">Regions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{regions.length}</div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Owners</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{owners.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Profiles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profiles.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Staff Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staffRoles.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignments.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="dryers" className="space-y-4">
        <TabsList className="grid grid-cols-4 lg:grid-cols-8">
          <TabsTrigger value="dryers">Dryers ({dryers.length})</TabsTrigger>
          <TabsTrigger value="alerts">Alerts ({alerts.length})</TabsTrigger>
          <TabsTrigger value="readings">Readings ({sensorReadings.length})</TabsTrigger>
          <TabsTrigger value="presets">Presets ({presets.length})</TabsTrigger>
          <TabsTrigger value="owners">Owners ({owners.length})</TabsTrigger>
          <TabsTrigger value="regions">Regions ({regions.length})</TabsTrigger>
          <TabsTrigger value="profiles">Profiles ({profiles.length})</TabsTrigger>
          <TabsTrigger value="roles">Roles ({staffRoles.length})</TabsTrigger>
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

        <TabsContent value="owners" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dryer Owners Table</CardTitle>
              <CardDescription>Dryer owners from Supabase ({owners.length} records)</CardDescription>
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
                    {owners.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          No owners found
                        </TableCell>
                      </TableRow>
                    ) : (
                      owners.map((owner) => (
                        <TableRow key={owner.id}>
                          <TableCell className="font-medium">{owner.name}</TableCell>
                          <TableCell>{owner.phone || 'N/A'}</TableCell>
                          <TableCell>{owner.email || 'N/A'}</TableCell>
                          <TableCell>{owner.farm_business_name || 'N/A'}</TableCell>
                          <TableCell>{owner.id_number || 'N/A'}</TableCell>
                          <TableCell className="max-w-xs truncate">{owner.address || 'N/A'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Regions Table</CardTitle>
              <CardDescription>Geographic regions ({regions.length} records)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Created At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {regions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                          No regions found
                        </TableCell>
                      </TableRow>
                    ) : (
                      regions.map((region) => (
                        <TableRow key={region.id}>
                          <TableCell className="font-medium">{region.name}</TableCell>
                          <TableCell>{region.code}</TableCell>
                          <TableCell>{new Date(region.created_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profiles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Profiles Table</CardTitle>
              <CardDescription>User profiles ({profiles.length} records)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Full Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Created At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profiles.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          No profiles found
                        </TableCell>
                      </TableRow>
                    ) : (
                      profiles.map((profile) => (
                        <TableRow key={profile.id}>
                          <TableCell className="font-medium">{profile.full_name || 'N/A'}</TableCell>
                          <TableCell>{profile.email}</TableCell>
                          <TableCell>{profile.phone || 'N/A'}</TableCell>
                          <TableCell>{new Date(profile.created_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Staff Roles Table</CardTitle>
              <CardDescription>User role assignments ({staffRoles.length} records)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role</TableHead>
                      <TableHead>Region</TableHead>
                      <TableHead>Created At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staffRoles.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                          No staff roles found
                        </TableCell>
                      </TableRow>
                    ) : (
                      staffRoles.map((role) => (
                        <TableRow key={role.id}>
                          <TableCell className="font-medium">
                            <Badge>{role.role}</Badge>
                          </TableCell>
                          <TableCell>{role.region || 'N/A'}</TableCell>
                          <TableCell>{new Date(role.created_at).toLocaleDateString()}</TableCell>
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
