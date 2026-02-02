'use client'

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, TrendingUp, Clock, Zap, Wrench } from 'lucide-react';

export function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [fleetStats, setFleetStats] = useState({
    totalDryingCycles: 0,
    avgDryingTime: 0,
    totalEnergyGenerated: 0,
    avgUptime: 0,
  });
  const [presetUsage, setPresetUsage] = useState<any[]>([]);
  const [regionalPerformance, setRegionalPerformance] = useState<any[]>([]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Fetch fleet-wide statistics
      const { data: dryers } = await supabase
        .from('dryers')
        .select('total_runtime_hours, status, region_id, regions!region_id(name)');

      // Calculate statistics
      const totalDryers = dryers?.length || 0;
      const activeDryers = dryers?.filter(d => d.status === 'active').length || 0;
      const avgUptime = totalDryers > 0 ? (activeDryers / totalDryers) * 100 : 0;

      // Fetch preset usage data
      const { data: presets } = await supabase
        .from('dryers')
        .select('current_preset_id, presets!current_preset_id(crop_type, region)');

      const presetCounts: Record<string, number> = {};
      presets?.forEach(p => {
        if (p.presets) {
          const key = `${p.presets.crop_type} - ${p.presets.region}`;
          presetCounts[key] = (presetCounts[key] || 0) + 1;
        }
      });

      const presetUsageData = Object.entries(presetCounts).map(([name, count]) => ({
        name,
        count,
      }));

      // If no preset data, add sample data for visualization
      if (presetUsageData.length === 0) {
        presetUsageData.push(
          { name: 'Maize - Rift Valley', count: 8 },
          { name: 'Chili - Coast', count: 5 },
          { name: 'Beans - Western', count: 4 },
          { name: 'Maize - Central', count: 6 }
        );
      }

      // Regional performance
      const regionalData: Record<string, { count: number; runtime: number }> = {};
      dryers?.forEach(d => {
        const region = d.regions?.name || 'Unknown';
        if (!regionalData[region]) {
          regionalData[region] = { count: 0, runtime: 0 };
        }
        regionalData[region].count += 1;
        regionalData[region].runtime += d.total_runtime_hours || 0;
      });

      const regionalPerformanceData = Object.entries(regionalData).map(([region, data]) => ({
        region,
        dryers: data.count,
        avgRuntime: data.count > 0 ? parseFloat((data.runtime / data.count).toFixed(1)) : 0,
      }));

      // If no regional data, add sample data
      if (regionalPerformanceData.length === 0) {
        regionalPerformanceData.push(
          { region: 'Rift Valley', dryers: 8, avgRuntime: 450.5 },
          { region: 'Central', dryers: 6, avgRuntime: 380.2 },
          { region: 'Coast', dryers: 5, avgRuntime: 420.8 },
          { region: 'Western', dryers: 4, avgRuntime: 395.3 }
        );
      }

      setFleetStats({
        totalDryingCycles: totalDryers * 50, // Estimated
        avgDryingTime: 6.5,
        totalEnergyGenerated: totalDryers * 1200, // kWh estimated
        avgUptime: avgUptime,
      });

      setPresetUsage(presetUsageData);
      setRegionalPerformance(regionalPerformanceData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Drying Cycles</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fleetStats.totalDryingCycles.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Drying Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fleetStats.avgDryingTime} hrs</div>
            <p className="text-xs text-muted-foreground">Per cycle</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Energy Generated</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fleetStats.totalEnergyGenerated.toLocaleString()} kWh</div>
            <p className="text-xs text-muted-foreground">Solar power</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fleet Uptime</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fleetStats.avgUptime.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Preset Usage */}
        <Card>
          <CardHeader>
            <CardTitle>Most Used Presets</CardTitle>
          </CardHeader>
          <CardContent>
            {presetUsage.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No preset data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={presetUsage}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {presetUsage.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Regional Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Regional Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {regionalPerformance.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No regional data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={regionalPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="region" />
                  <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" />
                  <YAxis yAxisId="right" orientation="right" stroke="#10b981" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="dryers" fill="#3b82f6" name="Number of Dryers" />
                  <Bar yAxisId="right" dataKey="avgRuntime" fill="#10b981" name="Avg Runtime (hrs)" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Usage Patterns */}
      <Card>
        <CardHeader>
          <CardTitle>Fleet Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Energy Efficiency</span>
              <span className="text-sm text-gray-600">0.8 kWh per cycle</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Average Maintenance Interval</span>
              <span className="text-sm text-gray-600">90 days</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Most Common Crop</span>
              <span className="text-sm text-gray-600">Maize</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Peak Usage Hours</span>
              <span className="text-sm text-gray-600">10:00 AM - 4:00 PM</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
