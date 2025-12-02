'use client'

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import StatsCard from "@/components/dashboard/StatsCard";
import { Activity, Power, AlertTriangle, Cpu, LogOut, Users, Settings, Plus, List, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DryerStatusBadge from "@/components/dashboard/DryerStatusBadge";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalDryers: 0,
    activeDryers: 0,
    idleDryers: 0,
    offlineDryers: 0,
    activeAlerts: 0,
  });
  const [recentDryers, setRecentDryers] = useState<any[]>([]);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch dryer statistics
      const { data: dryers, error } = await supabase
        .from("dryers")
        .select("id, dryer_id, status, last_communication, battery_level, active_alerts_count");

      if (error) throw error;

      const totalDryers = dryers?.length || 0;
      const activeDryers = dryers?.filter((d) => d.status === "active").length || 0;
      const idleDryers = dryers?.filter((d) => d.status === "idle").length || 0;
      const offlineDryers = dryers?.filter((d) => d.status === "offline").length || 0;
      const activeAlerts = dryers?.reduce((sum, d) => sum + (d.active_alerts_count || 0), 0) || 0;

      setStats({
        totalDryers,
        activeDryers,
        idleDryers,
        offlineDryers,
        activeAlerts,
      });

      setRecentDryers(dryers?.slice(0, 5) || []);
    } catch (error: any) {
      toast({
        title: "Error loading dashboard",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/iteda-logo.png" alt="ITEDA SOLUTIONS" className="h-8" />
            <div>
              <h1 className="text-xl font-bold text-foreground">ITEDA SOLUTIONS PLATFORM</h1>
              <p className="text-sm text-muted-foreground">Industrial Monitoring & Management</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => router.push("/dashboard/register-dryer")}>
              <Plus className="h-4 w-4 mr-2" />
              Register Dryer
            </Button>
            <Button variant="outline" size="icon" onClick={() => router.push("/dashboard/dryers")}>
              <List className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => router.push("/dashboard/alerts")}>
              <Bell className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => router.push("/dashboard/users")}>
              <Users className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <StatsCard
            title="Total Dryers"
            value={stats.totalDryers}
            icon={Cpu}
            variant="default"
          />
          <StatsCard
            title="Active Dryers"
            value={stats.activeDryers}
            icon={Activity}
            variant="success"
          />
          <StatsCard
            title="Idle Dryers"
            value={stats.idleDryers}
            icon={Power}
            variant="warning"
          />
          <StatsCard
            title="Offline Dryers"
            value={stats.offlineDryers}
            icon={AlertTriangle}
            variant="destructive"
          />
          <StatsCard
            title="Active Alerts"
            value={stats.activeAlerts}
            icon={AlertTriangle}
            variant="destructive"
          />
        </div>

        {/* Recent Dryers */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Dryers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentDryers.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No dryers registered yet. Register your first dryer to start monitoring.
                </p>
              ) : (
                recentDryers.map((dryer) => (
                  <div
                    key={dryer.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/dashboard/dryer/${dryer.id}`)}
                  >
                    <div>
                      <p className="font-medium">{dryer.dryer_id}</p>
                      <p className="text-sm text-muted-foreground">
                        Battery: {dryer.battery_level || 0}%
                      </p>
                    </div>
                    <DryerStatusBadge status={dryer.status} />
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
