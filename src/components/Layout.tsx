'use client'

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { LogOut, User, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/usePermissions";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const { user, role, isSuperAdmin, isAdmin, isRegionalManager, isFieldTechnician } = usePermissions();

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Sign out error:", error);
        toast.error("Error signing out");
      } else {
        toast.success("Signed out successfully");
      }
      // Force a hard redirect to clear any cached state
      window.location.href = "/auth";
    } catch (err) {
      console.error("Sign out exception:", err);
      // Force redirect even on error
      window.location.href = "/auth";
    }
  };

  // Get role display name and color
  const getRoleBadge = () => {
    if (isSuperAdmin) return { label: 'Super Admin', variant: 'destructive' as const };
    if (isAdmin) return { label: 'Admin', variant: 'default' as const };
    if (isRegionalManager) return { label: 'Regional Manager', variant: 'secondary' as const };
    if (isFieldTechnician) return { label: 'Field Technician', variant: 'outline' as const };
    return { label: 'User', variant: 'outline' as const };
  };

  const roleBadge = getRoleBadge();

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b border-border bg-background sticky top-0 z-10 flex items-center justify-between px-6">
            <SidebarTrigger className="text-foreground" />
            <div className="flex items-center gap-4">
              {user && (
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-medium">{user.fullName || user.email}</span>
                    <Badge variant={roleBadge.variant} className="text-xs">
                      <Shield className="h-3 w-3 mr-1" />
                      {roleBadge.label}
                    </Badge>
                  </div>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </header>
          <main className="flex-1 p-6 bg-background">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
