'use client'

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

type AlertSeverity = "critical" | "warning" | "info";
type AlertStatus = "active" | "acknowledged" | "resolved" | "dismissed";

const Alerts = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusTab, setStatusTab] = useState<string>("active");
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [notes, setNotes] = useState("");

  // Fetch alerts
  const { data: alerts, isLoading } = useQuery({
    queryKey: ["alerts", severityFilter, statusTab],
    queryFn: async () => {
      let query = supabase
        .from("alerts")
        .select(`
          *,
          dryer:dryers(dryer_id, serial_number, owner:dryer_owners(name)),
          acknowledged_by_user:profiles!alerts_acknowledged_by_fkey(full_name)
        `)
        .order("created_at", { ascending: false });

      if (severityFilter !== "all" && (severityFilter === "critical" || severityFilter === "warning" || severityFilter === "info")) {
        query = query.eq("severity", severityFilter);
      }

      if (statusTab !== "all" && (statusTab === "active" || statusTab === "acknowledged" || statusTab === "resolved" || statusTab === "dismissed")) {
        query = query.eq("status", statusTab);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Acknowledge alert mutation
  const acknowledgeMutation = useMutation({
    mutationFn: async ({ alertId, notes }: { alertId: string; notes: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("alerts")
        .update({
          status: "acknowledged",
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: user?.id,
          notes: notes || null,
        })
        .eq("id", alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      toast.success("Alert acknowledged successfully");
      setSelectedAlert(null);
      setNotes("");
    },
    onError: (error) => {
      toast.error("Failed to acknowledge alert: " + error.message);
    },
  });

  // Resolve alert mutation
  const resolveMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from("alerts")
        .update({
          status: "resolved",
          resolved_at: new Date().toISOString(),
        })
        .eq("id", alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      toast.success("Alert resolved successfully");
    },
    onError: (error) => {
      toast.error("Failed to resolve alert: " + error.message);
    },
  });

  // Dismiss alert mutation
  const dismissMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from("alerts")
        .update({
          status: "dismissed",
        })
        .eq("id", alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      toast.success("Alert dismissed");
    },
    onError: (error) => {
      toast.error("Failed to dismiss alert: " + error.message);
    },
  });

  const getSeverityConfig = (severity: AlertSeverity) => {
    switch (severity) {
      case "critical":
        return {
          icon: AlertTriangle,
          className: "bg-destructive text-destructive-foreground",
          label: "Critical",
        };
      case "warning":
        return {
          icon: AlertCircle,
          className: "bg-warning text-warning-foreground",
          label: "Warning",
        };
      case "info":
        return {
          icon: Info,
          className: "bg-primary text-primary-foreground",
          label: "Info",
        };
    }
  };

  const getStatusConfig = (status: AlertStatus) => {
    switch (status) {
      case "active":
        return {
          icon: AlertTriangle,
          className: "bg-destructive text-destructive-foreground",
          label: "Active",
        };
      case "acknowledged":
        return {
          icon: Clock,
          className: "bg-warning text-warning-foreground",
          label: "Acknowledged",
        };
      case "resolved":
        return {
          icon: CheckCircle,
          className: "bg-success text-success-foreground",
          label: "Resolved",
        };
      case "dismissed":
        return {
          icon: XCircle,
          className: "bg-muted text-muted-foreground",
          label: "Dismissed",
        };
    }
  };

  // Calculate statistics
  const stats = {
    total: alerts?.length || 0,
    critical: alerts?.filter((a) => a.severity === "critical").length || 0,
    warning: alerts?.filter((a) => a.severity === "warning").length || 0,
    active: alerts?.filter((a) => a.status === "active").length || 0,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/dashboard")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Alerts Management</h1>
              <p className="text-sm text-muted-foreground">
                Monitor and manage system alerts
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Statistics */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {stats.critical}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Warnings</CardTitle>
              <AlertCircle className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">
                {stats.warning}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {stats.active}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filter Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => setSeverityFilter("all")}
              >
                Clear Filter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Alerts Table with Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>Alert History</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={statusTab} onValueChange={setStatusTab}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="acknowledged">Acknowledged</TabsTrigger>
                <TabsTrigger value="resolved">Resolved</TabsTrigger>
                <TabsTrigger value="dismissed">Dismissed</TabsTrigger>
              </TabsList>

              <TabsContent value={statusTab} className="mt-6">
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : alerts && alerts.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Severity</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Dryer</TableHead>
                          <TableHead>Message</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {alerts.map((alert) => {
                          const severityConfig = getSeverityConfig(
                            alert.severity as AlertSeverity
                          );
                          const statusConfig = getStatusConfig(
                            alert.status as AlertStatus
                          );
                          const SeverityIcon = severityConfig.icon;
                          const StatusIcon = statusConfig.icon;

                          return (
                            <TableRow key={alert.id}>
                              <TableCell>
                                <Badge className={severityConfig.className}>
                                  <SeverityIcon className="h-3 w-3 mr-1" />
                                  {severityConfig.label}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-medium">
                                {alert.type}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="link"
                                  className="p-0 h-auto"
                                  onClick={() =>
                                    router.push(`/dashboard/dryer/${alert.dryer_id}`)
                                  }
                                >
                                  {alert.dryer?.dryer_id || "Unknown"}
                                </Button>
                              </TableCell>
                              <TableCell className="max-w-md">
                                <p className="truncate">{alert.message}</p>
                                {alert.current_value !== null && (
                                  <p className="text-xs text-muted-foreground">
                                    Value: {alert.current_value}
                                    {alert.threshold_value &&
                                      ` (Threshold: ${alert.threshold_value})`}
                                  </p>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge className={statusConfig.className}>
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {statusConfig.label}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm">
                                {formatDistanceToNow(
                                  new Date(alert.created_at),
                                  { addSuffix: true }
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex gap-2 justify-end">
                                  {alert.status === "active" && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setSelectedAlert(alert)}
                                    >
                                      Acknowledge
                                    </Button>
                                  )}
                                  {alert.status === "acknowledged" && (
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        resolveMutation.mutate(alert.id)
                                      }
                                    >
                                      Resolve
                                    </Button>
                                  )}
                                  {alert.status === "active" && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() =>
                                        dismissMutation.mutate(alert.id)
                                      }
                                    >
                                      Dismiss
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No alerts found in this category
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>

      {/* Acknowledge Dialog */}
      <Dialog open={!!selectedAlert} onOpenChange={() => setSelectedAlert(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Acknowledge Alert</DialogTitle>
            <DialogDescription>
              Add notes about this alert (optional)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedAlert && (
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p className="font-medium">{selectedAlert.type}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedAlert.message}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(selectedAlert.created_at), "PPp")}
                </p>
              </div>
            )}
            <Textarea
              placeholder="Add notes about how this alert was handled..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedAlert(null)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                acknowledgeMutation.mutate({
                  alertId: selectedAlert.id,
                  notes,
                })
              }
              disabled={acknowledgeMutation.isPending}
            >
              Acknowledge Alert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Alerts;
