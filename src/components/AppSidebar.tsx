'use client'

import { LayoutDashboard, Wind, AlertTriangle, Users, Settings, BarChart3 } from "lucide-react";
import { NavLink } from "@/components/NavLink";

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
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Dryers", url: "/dashboard/dryers", icon: Wind },
  { title: "Alerts", url: "/dashboard/alerts", icon: AlertTriangle },
  { title: "Analytics", url: "/dashboard/analytics", icon: BarChart3 },
  { title: "Staff", url: "/dashboard/staff", icon: Users },
  { title: "Presets", url: "/dashboard/presets", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

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
              {navigationItems.map((item) => (
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
