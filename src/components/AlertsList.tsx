'use client'

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, AlertTriangle, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { AlertActions } from './AlertActions';
import { useToast } from '@/hooks/use-toast';

interface Alert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  type: string;
  message: string;
  status: string;
  created_at: string;
  threshold_value: number | null;
  current_value: number | null;
  dryer: { dryer_id: string; serial_number: string; location_address: string | null } | null;
}

export default function AlertsList() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');
  const { toast } = useToast();

  const fetchAlerts = async (status?: string) => {
    setLoading(true);
    try {
      const url = status ? `/api/data/alerts?status=${status}` : '/api/data/alerts';
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setAlerts(data.alerts || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load alerts',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts(activeTab);
  }, [activeTab]);

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, any> = {
      critical: 'destructive',
      warning: 'default',
      info: 'secondary',
    };
    const icons: Record<string, any> = {
      critical: <AlertCircle className="h-3 w-3" />,
      warning: <AlertCircle className="h-3 w-3" />,
      info: <AlertCircle className="h-3 w-3" />,
    };
    return (
      <Badge variant={variants[severity] || 'default'} className="gap-1">
        {icons[severity]}
        {severity}
      </Badge>
    );
  };

  const getCounts = () => {
    return {
      total: alerts.length,
      critical: alerts.filter(a => a.severity === 'critical').length,
      warning: alerts.filter(a => a.severity === 'warning').length,
      info: alerts.filter(a => a.severity === 'info').length,
    };
  };

  const counts = getCounts();

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Alerts</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Monitor and manage system alerts
          </p>
        </div>
        <Button onClick={() => fetchAlerts(activeTab)} disabled={loading} className="text-xs sm:text-sm">
          <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{counts.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Critical</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold text-red-600">{counts.critical}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Warning</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold text-yellow-600">{counts.warning}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold text-blue-600">{counts.info}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="active" className="text-xs sm:text-sm">Active</TabsTrigger>
          <TabsTrigger value="acknowledged" className="text-xs sm:text-sm">Acknowledged</TabsTrigger>
          <TabsTrigger value="resolved" className="text-xs sm:text-sm">Resolved</TabsTrigger>
          <TabsTrigger value="dismissed" className="text-xs sm:text-sm">Dismissed</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Alerts</CardTitle>
              <CardDescription>
                Alerts with status: {activeTab}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading alerts...
                </div>
              ) : alerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No {activeTab} alerts found.
                </div>
              ) : (
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[100px]">Severity</TableHead>
                        <TableHead className="min-w-[120px]">Type</TableHead>
                        <TableHead className="min-w-[200px]">Message</TableHead>
                        <TableHead className="hidden md:table-cell">Dryer</TableHead>
                        <TableHead className="hidden lg:table-cell">Current Value</TableHead>
                        <TableHead className="hidden lg:table-cell">Threshold</TableHead>
                        <TableHead className="hidden sm:table-cell">Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {alerts.map((alert) => (
                        <TableRow key={alert.id}>
                          <TableCell>{getSeverityBadge(alert.severity)}</TableCell>
                          <TableCell className="font-medium text-xs sm:text-sm">
                            {alert.type.replace(/_/g, ' ').toUpperCase()}
                          </TableCell>
                          <TableCell className="max-w-md text-xs sm:text-sm">{alert.message}</TableCell>
                          <TableCell className="hidden md:table-cell">{alert.dryer?.dryer_id || 'N/A'}</TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {alert.current_value !== null ? alert.current_value : 'N/A'}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {alert.threshold_value !== null ? alert.threshold_value : 'N/A'}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-xs sm:text-sm">
                            {new Date(alert.created_at).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
