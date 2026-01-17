'use client'

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Battery, Zap, Clock, Wind, TrendingUp, TrendingDown } from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

const Analytics = () => {
  const [timeRange, setTimeRange] = useState("7");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");

  const startDate = startOfDay(subDays(new Date(), parseInt(timeRange)));
  const endDate = endOfDay(new Date());

  // Fetch dryers data
  const { data: dryers } = useQuery({
    queryKey: ["dryers", selectedRegion],
    queryFn: async () => {
      let query = supabase.from("dryers").select("*, regions!dryers_region_id_fkey(name)");
      
      if (selectedRegion !== "all") {
        query = query.eq("region_id", selectedRegion);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Fetch sensor readings for analytics
  const { data: sensorData } = useQuery({
    queryKey: ["sensor-analytics", timeRange, selectedRegion],
    queryFn: async () => {
      let query = supabase
        .from("sensor_readings")
        .select("*, dryers!sensor_readings_dryer_id_fkey(region_id)")
        .gte("timestamp", startDate.toISOString())
        .lte("timestamp", endDate.toISOString())
        .order("timestamp", { ascending: true });

      const { data, error } = await query;
      if (error) throw error;

      // Filter by region if selected
      if (selectedRegion !== "all") {
        return data?.filter((reading) => reading.dryers?.region_id === selectedRegion);
      }
      
      return data;
    },
  });

  // Fetch regions
  const { data: regions } = useQuery({
    queryKey: ["regions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("regions").select("*");
      if (error) throw error;
      return data;
    },
  });

  // Calculate metrics
  const totalDryers = dryers?.length || 0;
  const activeDryers = dryers?.filter((d) => d.status === "active").length || 0;
  const idleDryers = dryers?.filter((d) => d.status === "idle").length || 0;
  const offlineDryers = dryers?.filter((d) => d.status === "offline").length || 0;
  const totalRuntime = dryers?.reduce((sum, d) => sum + (d.total_runtime_hours || 0), 0) || 0;
  const avgBatteryLevel = dryers?.reduce((sum, d) => sum + (d.battery_level || 0), 0) / totalDryers || 0;

  // Calculate total energy consumption
  const totalEnergy = sensorData?.reduce((sum, reading) => sum + (reading.power_consumption_w || 0), 0) || 0;
  const avgEnergyPerHour = totalEnergy / (parseInt(timeRange) * 24) || 0;

  // Prepare chart data - Energy consumption over time
  const energyTrendData = sensorData?.reduce((acc: any[], reading) => {
    const date = format(new Date(reading.timestamp), "MMM dd");
    const existing = acc.find((item) => item.date === date);
    
    if (existing) {
      existing.energy += reading.power_consumption_w || 0;
      existing.count += 1;
    } else {
      acc.push({
        date,
        energy: reading.power_consumption_w || 0,
        count: 1,
      });
    }
    
    return acc;
  }, []).map((item) => ({
    date: item.date,
    energy: (item.energy / item.count).toFixed(2),
  })) || [];

  // Temperature and Humidity trends
  const tempHumidityData = sensorData?.reduce((acc: any[], reading) => {
    const date = format(new Date(reading.timestamp), "MMM dd");
    const existing = acc.find((item) => item.date === date);
    
    if (existing) {
      existing.temp += reading.chamber_temp || 0;
      existing.humidity += reading.internal_humidity || 0;
      existing.count += 1;
    } else {
      acc.push({
        date,
        temp: reading.chamber_temp || 0,
        humidity: reading.internal_humidity || 0,
        count: 1,
      });
    }
    
    return acc;
  }, []).map((item) => ({
    date: item.date,
    temperature: (item.temp / item.count).toFixed(1),
    humidity: (item.humidity / item.count).toFixed(1),
  })) || [];

  // Status distribution
  const statusData = [
    { name: "Active", value: activeDryers, color: "hsl(var(--success))" },
    { name: "Idle", value: idleDryers, color: "hsl(var(--warning))" },
    { name: "Offline", value: offlineDryers, color: "hsl(var(--destructive))" },
  ].filter((item) => item.value > 0);

  // Regional performance
  const regionalData = regions?.map((region) => {
    const regionDryers = dryers?.filter((d) => d.region_id === region.id) || [];
    const regionActive = regionDryers.filter((d) => d.status === "active").length;
    return {
      region: region.name,
      active: regionActive,
      total: regionDryers.length,
      efficiency: regionDryers.length > 0 ? ((regionActive / regionDryers.length) * 100).toFixed(1) : 0,
    };
  }) || [];

  const StatCard = ({ title, value, icon: Icon, trend, trendValue }: any) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs ${trend === "up" ? "text-success" : "text-destructive"}`}>
            {trend === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            <span>{trendValue}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Monitor dryer performance and energy efficiency</p>
        </div>
        <div className="flex gap-4">
          <Select value={selectedRegion} onValueChange={setSelectedRegion}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Regions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              {regions?.map((region) => (
                <SelectItem key={region.id} value={region.id}>
                  {region.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Dryers"
          value={totalDryers}
          icon={Wind}
        />
        <StatCard
          title="Active Dryers"
          value={activeDryers}
          icon={Zap}
          trend="up"
          trendValue={`${((activeDryers / totalDryers) * 100).toFixed(0)}% active`}
        />
        <StatCard
          title="Total Runtime"
          value={`${totalRuntime.toFixed(0)}h`}
          icon={Clock}
        />
        <StatCard
          title="Avg Battery Level"
          value={`${avgBatteryLevel.toFixed(0)}%`}
          icon={Battery}
          trend={avgBatteryLevel > 70 ? "up" : "down"}
          trendValue={`${avgBatteryLevel > 70 ? "Healthy" : "Low"}`}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Energy Consumption Trend</CardTitle>
            <CardDescription>Average power consumption (W) over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={energyTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="energy"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  name="Energy (W)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dryer Status Distribution</CardTitle>
            <CardDescription>Current operational status breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Temperature & Humidity Trends</CardTitle>
            <CardDescription>Average chamber conditions over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={tempHumidityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="temperature"
                  stroke="hsl(var(--destructive))"
                  strokeWidth={2}
                  name="Temperature (°C)"
                />
                <Line
                  type="monotone"
                  dataKey="humidity"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={2}
                  name="Humidity (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Regional Performance</CardTitle>
            <CardDescription>Active dryer efficiency by region</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={regionalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="region" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar dataKey="active" fill="hsl(var(--success))" name="Active" />
                <Bar dataKey="total" fill="hsl(var(--chart-1))" name="Total" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
          <CardDescription>Key insights for the selected period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Total Energy Consumed</p>
              <p className="text-2xl font-bold text-foreground">{(totalEnergy / 1000).toFixed(2)} kWh</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Energy per Hour</p>
              <p className="text-2xl font-bold text-foreground">{avgEnergyPerHour.toFixed(2)} W</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fleet Efficiency</p>
              <p className="text-2xl font-bold text-foreground">
                {((activeDryers / totalDryers) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;
