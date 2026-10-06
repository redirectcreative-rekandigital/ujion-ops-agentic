# 04 — Layout: Sidebar, Header, Footer

## Struktur Layout

```
┌─────────────────────────────────────────────────────────┐
│ HEADER (top bar)                                         │
│  [Menu toggle]  Dashboard Ujion          [Logout]        │
├──────────┬──────────────────────────────────────────────┤
│ SIDEBAR  │  MAIN CONTENT                                 │
│ (left)   │                                               │
│          │  (halaman aktif)                              │
│ Dashboard│                                               │
│ Tasks    │                                               │
│ Approvals│                                               │
│ Agents   │                                               │
│ Skills   │                                               │
│ MCP      │                                               │
│ API Keys │                                               │
│ Models   │                                               │
│ Logs     │                                               │
│ Kantor   │                                               │
│ Playground│                                              │
│ Settings │                                               │
│          │                                               │
├──────────┴──────────────────────────────────────────────┤
│ FOOTER                                                   │
│  Ujion TKA Dashboard v2  ·  opencode v2 connected        │
└─────────────────────────────────────────────────────────┘
```

## Route Groups

Pisahkan layout login dan dashboard dengan route groups:

```
src/app/
├── layout.tsx                  # root layout (html, body, theme)
├── login/
│   ├── layout.tsx              # bare (no sidebar, no header)
│   └── page.tsx                # PIN form
└── (dashboard)/                # route group — URL tetap /
    ├── layout.tsx              # sidebar + header + footer
    ├── page.tsx                # / — dashboard utama
    ├── tasks/
    ├── approvals/
    ├── agents/
    ├── skills/
    ├── mcp/
    ├── keys/
    ├── models/
    ├── logs/
    ├── kantor/
    ├── playground/
    └── settings/
```

## Root Layout

### src/app/layout.tsx

```typescript
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Dashboard Ujion",
  description: "Agent control plane untuk Ujion TKA",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

## Dashboard Layout

### src/app/(dashboard)/layout.tsx

```typescript
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { AppFooter } from "@/components/layout/app-footer";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <AppHeader />
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
          <AppFooter />
        </div>
      </div>
    </SidebarProvider>
  );
}
```

## Sidebar

### src/components/layout/app-sidebar.tsx

```typescript
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
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.href}>
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
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
```

## Header

### src/components/layout/app-header.tsx

```typescript
"use client";

import { useRouter } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, Wifi } from "lucide-react";
import { useEffect, useState } from "react";

export function AppHeader() {
  const router = useRouter();
  const [opencodeStatus, setOpencodeStatus] = useState<"connected" | "disconnected">("disconnected");

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  useEffect(() => {
    // Check opencode serve status
    fetch("/api/opencode/global/health")
      .then((res) => res.ok ? setOpencodeStatus("connected") : setOpencodeStatus("disconnected"))
      .catch(() => setOpencodeStatus("disconnected"));
  }, []);

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-6">
      <div className="flex items-center gap-3">
        <SidebarTrigger />
        <h1 className="text-sm font-medium text-muted-foreground">Dashboard Ujion</h1>
      </div>

      <div className="flex items-center gap-3">
        <Badge variant={opencodeStatus === "connected" ? "default" : "destructive"} className="gap-1">
          <Wifi className="w-3 h-3" />
          {opencodeStatus === "connected" ? "opencode connected" : "disconnected"}
        </Badge>
        <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>
    </header>
  );
}
```

## Footer

### src/components/layout/app-footer.tsx

```typescript
export function AppFooter() {
  return (
    <footer className="flex h-10 items-center justify-between border-t bg-background px-6 text-xs text-muted-foreground">
      <span>Ujion TKA Dashboard v2.0</span>
      <span>opencode v2 · SQLite · Next.js 15</span>
    </footer>
  );
}
```

## Dashboard Utama

### src/app/(dashboard)/page.tsx

```typescript
import { db } from "@/lib/db";
import { agents, tasks, approvals, logs } from "@/lib/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CheckSquare, ClipboardCheck, ScrollText } from "lucide-react";

export default async function DashboardPage() {
  const [agentCount] = await db.select({ count: count() }).from(agents);
  const [taskCount] = await db.select({ count: count() }).from(tasks);
  const [pendingApprovals] = await db.select({ count: count() }).from(approvals).where(eq(approvals.status, "pending"));
  const [logCount] = await db.select({ count: count() }).from(logs);
  const recentTasks = await db.select().from(tasks).orderBy(desc(tasks.updated_at)).limit(5);
  const activeAgents = await db.select().from(agents).where(eq(agents.is_active, true));

  const stats = [
    { label: "Active Agents", value: activeAgents.length, icon: Users },
    { label: "Total Tasks", value: taskCount.count, icon: CheckSquare },
    { label: "Pending Approvals", value: pendingApprovals.count, icon: ClipboardCheck },
    { label: "Log Entries", value: logCount.count, icon: ScrollText },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Overview agent & task activity" />

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Tasks */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Render recent tasks table */}
        </CardContent>
      </Card>

      {/* Agent Status */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Status</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Render agent list with status badges */}
        </CardContent>
      </Card>
    </div>
  );
}
```

## Shared Components

### src/components/shared/page-header.tsx

```typescript
interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {action}
    </div>
  );
}
```

## Responsive Behavior

- **Desktop (lg+)**: Sidebar terbuka (collapsible via trigger), konten di kanan
- **Tablet (md)**: Sidebar collapsed (icon only), expand on hover
- **Mobile (sm)**: Sidebar hidden, open via hamburger menu (Sheet component)
- Header tetap di atas semua breakpoint
- Footer tetap di bawah, hide pada mobile jika perlu

## Dark Mode

Default theme: `dark`. Toggle di Settings page.

```typescript
// src/components/theme-toggle.tsx
"use client";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
      <Sun className="h-4 w-4 dark:hidden" />
      <Moon className="h-4 w-4 hidden dark:block" />
    </Button>
  );
}
```

## CSS (globals.css)

Pastikan `src/app/globals.css` include Tailwind + shadcn variables:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Light theme variables (shadcn defaults) */
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    /* ... (semua shadcn CSS variables) */
  }
  .dark {
    /* Dark theme variables */
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    /* ... */
  }
}
```
