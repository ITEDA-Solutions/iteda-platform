'use client'

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RefreshCw, Search, MapPin, Battery, Signal, AlertTriangle, Clock, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

interface Dryer {
  id: string;
  dryer_id: string;
  serial_number: string;
  status: string;
  battery_level: number | null;
  battery_voltage: number | null;
  signal_strength: number | null;
  last_communication: string | null;
  location_address: string | null;
  owner: { name: string } | null;
  region: { name: string } | null;
  current_preset: { preset_id: string; crop_type: string } | null;
  active_alerts_count: number;
  deployment_date: string | null;
  total_runtime_hours: number | null;
}

export default function DryersList() {
  const [dryers, setDryers] = useState<Dryer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const fetchDryers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/data/dryers');
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setDryers(data.dryers || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load dryers',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDryers();
  }, []);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      active: 'default',
      idle: 'secondary',
      offline: 'destructive',
      maintenance: 'outline',
      decommissioned: 'outline',
    };
    const colors: Record<string, string> = {
      active: 'bg-green-500',
      idle: 'bg-yellow-500',
      offline: 'bg-red-500',
      maintenance: 'bg-orange-500',
      decommissioned: 'bg-gray-500',
    };
    return (
      <Badge variant={variants[status] || 'default'} className="gap-1">
        <span className={`h-2 w-2 rounded-full ${colors[status]}`}></span>
        {status}
      </Badge>
    );
  };

  const getBatteryIcon = (level: number | null) => {
    if (level === null) return <Battery className="h-4 w-4 text-gray-400" />;
    if (level > 70) return <Battery className="h-4 w-4 text-green-600" />;
    if (level > 30) return <Battery className="h-4 w-4 text-yellow-600" />;
    return <Battery className="h-4 w-4 text-red-600" />;
  };

  const getSignalIcon = (strength: number | null) => {
    if (strength === null) return <Signal className="h-4 w-4 text-gray-400" />;
    if (strength > 70) return <Signal className="h-4 w-4 text-green-600" />;
    if (strength > 30) return <Signal className="h-4 w-4 text-yellow-600" />;
    return <Signal className="h-4 w-4 text-red-600" />;
  };

  const formatLastCommunication = (timestamp: string | null) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getDaysActive = (deploymentDate: string | null) => {
    if (!deploymentDate) return 0;
    const deployed = new Date(deploymentDate);
    const now = new Date();
    const diffMs = now.getTime() - deployed.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  };

  const filteredDryers = dryers.filter(dryer =>
    dryer.dryer_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dryer.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dryer.owner?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusCounts = () => {
    return {
      total: dryers.length,
      active: dryers.filter(d => d.status === 'active').length,
      idle: dryers.filter(d => d.status === 'idle').length,
      offline: dryers.filter(d => d.status === 'offline').length,
      maintenance: dryers.filter(d => d.status === 'maintenance').length,
    };
  };

  const counts = getStatusCounts();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dryers</h2>
          <p className="text-muted-foreground">
            View and manage all dryers in the system
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/dryers/register">
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Register Dryer
            </Button>
          </Link>
          <Button onClick={fetchDryers} disabled={loading} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Dryers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{counts.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Idle</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{counts.idle}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Offline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{counts.offline}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{counts.maintenance}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dryer List</CardTitle>
          <CardDescription>
            All dryers based on your role permissions
          </CardDescription>
          <div className="flex items-center gap-2 mt-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by dryer ID, serial number, or owner..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading dryers...
            </div>
          ) : filteredDryers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'No dryers found matching your search.' : 'No dryers found in database.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dryer ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead>Battery</TableHead>
                    <TableHead>Signal</TableHead>
                    <TableHead>Alerts</TableHead>
                    <TableHead>Last Comm</TableHead>
                    <TableHead>Days Active</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDryers.map((dryer) => (
                    <TableRow key={dryer.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{dryer.dryer_id}</span>
                          <span className="text-xs text-muted-foreground">{dryer.serial_number}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(dryer.status)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm">{dryer.owner?.name || 'N/A'}</span>
                          {dryer.location_address && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {dryer.location_address.substring(0, 30)}...
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{dryer.region?.name || 'N/A'}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getBatteryIcon(dryer.battery_level)}
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {dryer.battery_level !== null ? `${dryer.battery_level}%` : 'N/A'}
                            </span>
                            {dryer.battery_voltage && (
                              <span className="text-xs text-muted-foreground">
                                {dryer.battery_voltage}V
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getSignalIcon(dryer.signal_strength)}
                          <span className="text-sm">
                            {dryer.signal_strength !== null ? `${dryer.signal_strength}%` : 'N/A'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {dryer.active_alerts_count > 0 ? (
                          <Badge variant="destructive" className="gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {dryer.active_alerts_count}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-green-600">
                            <span className="text-xs">No alerts</span>
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className={
                            dryer.last_communication && 
                            new Date().getTime() - new Date(dryer.last_communication).getTime() > 900000
                              ? 'text-red-600 font-medium'
                              : 'text-muted-foreground'
                          }>
                            {formatLastCommunication(dryer.last_communication)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {getDaysActive(dryer.deployment_date)} days
                          </span>
                          {dryer.total_runtime_hours !== null && (
                            <span className="text-xs text-muted-foreground">
                              {dryer.total_runtime_hours.toFixed(1)}h runtime
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Link href={`/dashboard/dryers/${dryer.id}`}>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
