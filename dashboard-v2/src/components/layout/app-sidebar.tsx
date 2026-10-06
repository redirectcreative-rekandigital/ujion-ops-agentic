"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, CheckSquare, ClipboardCheck, Users, Sparkles,
  Plug, KeyRound, Cpu, ScrollText, Building2, FlaskConical, Settings,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton,
  SidebarHeader, SidebarFooter, SidebarTrigger,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Dashboard",   href: "/",            icon: LayoutDashboard },
  { title: "Tasks",       href: "/tasks",       icon: CheckSquare },
  { title: "Approvals",   href: "/approvals",   icon: ClipboardCheck },
  { title: "Agents",      href: "/agents",      icon: Users },
  { title: "Skills",      href: "/skills",      icon: Sparkles },
  { title: "MCP",         href: "/mcp",         icon: Plug },
  { title: "API Keys",    href: "/keys",        icon: KeyRound },
  { title: "Models",      href: "/models",      icon: Cpu },
  { title: "Logs",        href: "/logs",        icon: ScrollText },
  { title: "Kantor",      href: "/kantor",      icon: Building2 },
  { title: "Playground",  href: "/playground",  icon: FlaskConical },
  { title: "Settings",    href: "/settings",    icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">U</span>
          </div>
          <div>
            <p className="text-sm font-semibold">Ujion TKA</p>
            <p className="text-xs text-muted-foreground">Agent Dashboard</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActive}
                      render={
                        <Link href={item.href}>
                          <item.icon className="w-4 h-4" />
                          <span>{item.title}</span>
                        </Link>
                      }
                    />
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <SidebarTrigger />
      </SidebarFooter>
    </Sidebar>
  );
}
