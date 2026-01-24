'use client'

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Edit, MapPin, User, Calendar, Wifi } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import DryerStatusBadge from "@/components/dashboard/DryerStatusBadge";
import SensorMetrics from "@/components/dryer-detail/SensorMetrics";
import TemperatureChart from "@/components/dryer-detail/TemperatureChart";
import HumidityChart from "@/components/dryer-detail/HumidityChart";
import PowerMetrics from "@/components/dryer-detail/PowerMetrics";
import OperationalTimeline from "@/components/dryer-detail/OperationalTimeline";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Session } from "@supabase/supabase-js";

const DryerDetail = () => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [timeRange, setTimeRange] = useState<"6h" | "24h" | "7d">("24h");
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  // Wait for session to be ready
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setSessionLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setSessionLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch dryer details - only when session is ready
  const { data: dryer, isLoading: loadingDryer, error: dryerError } = useQuery({
    queryKey: ["dryer", id, session?.access_token],
    queryFn: async () => {
      // Fetch dryer without joins to avoid FK relationship issues
      const { data: dryerData, error: dryerError } = await supabase
        .from("dryers")
        .select("*")
        .eq("id", id)
        .single();

      if (dryerError) {
        console.error("Error fetching dryer:", dryerError);
        throw dryerError;
      }

      // Fetch related data separately
      const [ownerResult, regionResult, presetResult, technicianResult] = await Promise.all([
        dryerData.owner_id
          ? supabase.from("dryer_owners").select("*").eq("id", dryerData.owner_id).single()
          : { data: null, error: null },
        dryerData.region_id
          ? supabase.from("regions").select("*").eq("id", dryerData.region_id).single()
          : { data: null, error: null },
        dryerData.current_preset_id
          ? supabase.from("presets").select("*").eq("id", dryerData.current_preset_id).single()
          : { data: null, error: null },
        dryerData.assigned_technician_id
          ? supabase.from("profiles").select("*").eq("id", dryerData.assigned_technician_id).single()
          : { data: null, error: null },
      ]);

      return {
        ...dryerData,
        owner: ownerResult.data,
        region: regionResult.data,
        current_preset: presetResult.data,
        assigned_technician: technicianResult.data,
      };
    },
    enabled: !!id && !!session && !sessionLoading,
  });

  // Fetch sensor readings - only when session is ready
  const { data: sensorReadings, isLoading: loadingReadings } = useQuery({
    queryKey: ["sensor-readings", id, timeRange, session?.access_token],
    queryFn: async () => {
      const now = new Date();
      let startTime = new Date();

      switch (timeRange) {
        case "6h":
          startTime.setHours(now.getHours() - 6);
          break;
        case "24h":
          startTime.setHours(now.getHours() - 24);
          break;
        case "7d":
          startTime.setDate(now.getDate() - 7);
          break;
      }

      const { data, error } = await supabase
        .from("sensor_readings")
        .select("*")
        .eq("dryer_id", id)
        .gte("timestamp", startTime.toISOString())
        .order("timestamp", { ascending: true });

      if (error) {
        console.error("Error fetching sensor readings:", error);
        throw error;
      }
      return data;
    },
    enabled: !!id && !!session && !sessionLoading,
  });

  // Subscribe to real-time updates
  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`dryer-${id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "sensor_readings",
          filter: `dryer_id=eq.${id}`,
        },
        () => {
          // Refetch data when new reading arrives
          toast.info("New sensor data received");
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const latestReading = sensorReadings?.[sensorReadings.length - 1];

  if (sessionLoading || loadingDryer) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6 space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!dryer) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Dryer not found</p>
            {dryerError && (
              <p className="text-center text-destructive text-sm mt-2">
                Error: {(dryerError as Error).message}
              </p>
            )}
            <p className="text-center text-muted-foreground text-xs mt-2">
              ID: {id}
            </p>
            <Button onClick={() => router.push("/dashboard/dryers")} className="w-full mt-4">
              Back to Dryers
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/dashboard")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold">{dryer.dryer_id}</h1>
                <p className="text-muted-foreground">
                  Serial: {dryer.serial_number}
                </p>
              </div>
              <DryerStatusBadge status={dryer.status} />
            </div>
          </div>
          <Button onClick={() => router.push(`/register-dryer?edit=${id}`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Dryer
          </Button>
        </div>

        {/* Quick Info Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Communication</CardTitle>
              <Wifi className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dryer.last_communication
                  ? formatDistanceToNow(new Date(dryer.last_communication), {
                      addSuffix: true,
                    })
                  : "Never"}
              </div>
              {dryer.signal_strength !== null && (
                <p className="text-xs text-muted-foreground mt-1">
                  Signal: {dryer.signal_strength}%
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Owner</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                {dryer.owner?.name || "Unassigned"}
              </div>
              {dryer.owner?.phone && (
                <p className="text-xs text-muted-foreground mt-1">
                  {dryer.owner.phone}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Location</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                {dryer.region?.name || "Unknown"}
              </div>
              {dryer.location_address && (
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {dryer.location_address}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Deployment Date</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                {format(new Date(dryer.deployment_date), "PP")}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(dryer.deployment_date), {
                  addSuffix: true,
                })}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Real-time Sensor Metrics */}
        <SensorMetrics latestReading={latestReading || null} />

        {/* Charts and Timeline */}
        <Tabs defaultValue="charts" className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="charts">Charts</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="info">Dryer Info</TabsTrigger>
            </TabsList>
            
            {/* Time Range Selector */}
            <div className="flex gap-2">
              <Badge
                variant={timeRange === "6h" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setTimeRange("6h")}
              >
                6H
              </Badge>
              <Badge
                variant={timeRange === "24h" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setTimeRange("24h")}
              >
                24H
              </Badge>
              <Badge
                variant={timeRange === "7d" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setTimeRange("7d")}
              >
                7D
              </Badge>
            </div>
          </div>

          <TabsContent value="charts" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-1">
                {loadingReadings ? (
                  <Skeleton className="h-[350px]" />
                ) : (
                  <TemperatureChart data={sensorReadings || []} />
                )}
              </div>
              <div className="md:col-span-1">
                {loadingReadings ? (
                  <Skeleton className="h-[350px]" />
                ) : (
                  <HumidityChart data={sensorReadings || []} />
                )}
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="md:col-span-1">
                <PowerMetrics
                  batteryLevel={dryer.battery_level}
                  batteryVoltage={dryer.battery_voltage}
                  solarVoltage={latestReading?.solar_voltage || null}
                  chargingStatus={latestReading?.charging_status || null}
                />
              </div>
              <div className="md:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Active Preset</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {dryer.current_preset ? (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Crop Type</p>
                            <p className="text-lg font-semibold">{dryer.current_preset.crop_type}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Region</p>
                            <p className="text-lg font-semibold">{dryer.current_preset.region}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Target Temp</p>
                            <p className="text-lg font-semibold">{dryer.current_preset.target_temp_c}°C</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Target Humidity</p>
                            <p className="text-lg font-semibold">{dryer.current_preset.target_humidity_pct}%</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Fan Speed</p>
                            <p className="text-lg font-semibold">{dryer.current_preset.fan_speed_rpm} RPM</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Duration</p>
                            <p className="text-lg font-semibold">{dryer.current_preset.duration_hours} hrs</p>
                          </div>
                        </div>
                        {dryer.current_preset.description && (
                          <p className="text-sm text-muted-foreground border-t pt-4">
                            {dryer.current_preset.description}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-muted-foreground">No preset assigned</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="timeline">
            {loadingReadings ? (
              <Skeleton className="h-[600px]" />
            ) : (
              <OperationalTimeline data={sensorReadings || []} />
            )}
          </TabsContent>

          <TabsContent value="info">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Hardware Specifications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Temperature Sensors</p>
                      <p className="text-lg font-semibold">{dryer.num_temp_sensors || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Humidity Sensors</p>
                      <p className="text-lg font-semibold">{dryer.num_humidity_sensors || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Fans</p>
                      <p className="text-lg font-semibold">{dryer.num_fans || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Heaters</p>
                      <p className="text-lg font-semibold">{dryer.num_heaters || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Solar Capacity</p>
                      <p className="text-lg font-semibold">{dryer.solar_capacity_w || 0}W</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Battery Capacity</p>
                      <p className="text-lg font-semibold">{dryer.battery_capacity_ah || 0}Ah</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Owner Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {dryer.owner ? (
                    <>
                      <div>
                        <p className="text-sm text-muted-foreground">Name</p>
                        <p className="text-lg font-semibold">{dryer.owner.name}</p>
                      </div>
                      {dryer.owner.farm_business_name && (
                        <div>
                          <p className="text-sm text-muted-foreground">Business</p>
                          <p className="text-lg font-semibold">{dryer.owner.farm_business_name}</p>
                        </div>
                      )}
                      {dryer.owner.phone && (
                        <div>
                          <p className="text-sm text-muted-foreground">Phone</p>
                          <p className="text-lg font-semibold">{dryer.owner.phone}</p>
                        </div>
                      )}
                      {dryer.owner.email && (
                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p className="text-lg font-semibold">{dryer.owner.email}</p>
                        </div>
                      )}
                      {dryer.owner.address && (
                        <div>
                          <p className="text-sm text-muted-foreground">Address</p>
                          <p className="text-lg font-semibold">{dryer.owner.address}</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-muted-foreground">No owner assigned</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DryerDetail;
