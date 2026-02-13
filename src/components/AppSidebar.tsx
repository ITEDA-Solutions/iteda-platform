'use client'

import { LayoutDashboard, Wind, AlertTriangle, Users, Settings, BarChart3, Download } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { usePermissions } from "@/hooks/usePermissions";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";

const navigationItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, roles: ['super_admin', 'admin', 'regional_manager', 'field_technician'] },
  { title: "Dryers", url: "/dashboard/dryers", icon: Wind, roles: ['super_admin', 'admin', 'regional_manager', 'field_technician'] },
  { title: "Alerts", url: "/dashboard/alerts", icon: AlertTriangle, roles: ['super_admin', 'admin', 'regional_manager', 'field_technician'] },
  { title: "Analytics", url: "/dashboard/analytics", icon: BarChart3, roles: ['super_admin', 'admin', 'regional_manager'] },
  { title: "Data Export", url: "/dashboard/data", icon: Download, roles: ['super_admin', 'admin', 'regional_manager'] },
  { title: "Presets", url: "/dashboard/presets", icon: Settings, roles: ['super_admin', 'admin'] },
  { title: "User Management", url: "/dashboard/staff", icon: Users, roles: ['super_admin'] }, // Only super_admin can manage users
];

export function AppSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { role, isAuthenticated } = usePermissions();

  // Filter navigation items based on user role
  const visibleItems = navigationItems.filter(item =>
    !item.roles || !role || item.roles.includes(role)
  );

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-primary font-semibold text-base px-4 py-3">
            {!isCollapsed && (
              <div className="flex items-center gap-2">
                <img src="/iteda-logo.png" alt="ITEDA" className="h-6 w-auto" />
                <span className="text-sm font-bold">ITEDA SOLUTIONS</span>
              </div>
            )}
            {isCollapsed && (
              <img src="/iteda-logo.png" alt="ITEDA" className="h-6 w-auto mx-auto" />
            )}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors hover:bg-accent/10"
                      activeClassName="bg-primary/10 text-primary font-medium border-l-4 border-primary"
                    >
                      <item.icon className="h-5 w-5" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
