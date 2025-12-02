'use client'

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Activity, BarChart3, Bell, Shield } from "lucide-react";

const Index = () => {
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push("/dashboard");
      }
    });
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary to-background">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <div className="flex flex-col items-center mb-6">
            <img src="/iteda-logo.png" alt="ITEDA SOLUTIONS" className="h-20 md:h-24 mb-4" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              ITEDA SOLUTIONS PLATFORM
            </h1>
          </div>
          <p className="text-xl text-muted-foreground mb-8">
            Real-time monitoring and management for your industrial operations
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => router.push("/auth")}>
              Get Started
            </Button>
            <Button size="lg" variant="outline" onClick={() => router.push("/auth")}>
              Sign In
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <div className="p-6 rounded-lg border bg-card hover:shadow-lg transition-shadow">
            <div className="p-3 rounded-full bg-primary/10 text-primary w-fit mb-4">
              <Activity className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Real-time Monitoring</h3>
            <p className="text-sm text-muted-foreground">
              Track temperature, humidity, and operational status in real-time
            </p>
          </div>

          <div className="p-6 rounded-lg border bg-card hover:shadow-lg transition-shadow">
            <div className="p-3 rounded-full bg-success/10 text-success w-fit mb-4">
              <BarChart3 className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Advanced Analytics</h3>
            <p className="text-sm text-muted-foreground">
              Comprehensive dashboards and data visualization tools
            </p>
          </div>

          <div className="p-6 rounded-lg border bg-card hover:shadow-lg transition-shadow">
            <div className="p-3 rounded-full bg-warning/10 text-warning w-fit mb-4">
              <Bell className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Intelligent Alerts</h3>
            <p className="text-sm text-muted-foreground">
              Configurable alerts for critical events and maintenance
            </p>
          </div>

          <div className="p-6 rounded-lg border bg-card hover:shadow-lg transition-shadow">
            <div className="p-3 rounded-full bg-accent/10 text-accent w-fit mb-4">
              <Shield className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Role-based Access</h3>
            <p className="text-sm text-muted-foreground">
              Granular permissions for different user types and regions
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
