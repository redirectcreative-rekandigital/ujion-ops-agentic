"use client";

import { useRouter } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, Wifi } from "lucide-react";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

export function AppHeader() {
  const router = useRouter();
  const [opencodeStatus, setOpencodeStatus] = useState<"connected" | "disconnected">("disconnected");

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  useEffect(() => {
    // Check opencode serve status (proxy penuh di 10-OPENCODE-SYNC;
    // sebelum itu endpoint 404 dan badge tampil "disconnected" — wajar).
    fetch("/api/opencode/global/health")
      .then((res) => res.ok ? setOpencodeStatus("connected") : setOpencodeStatus("disconnected"))
      .catch(() => setOpencodeStatus("disconnected"));
  }, []);

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-4 sm:px-6">
      <div className="flex items-center gap-2 sm:gap-3">
        <SidebarTrigger />
        <h1 className="font-heading text-sm font-bold sm:text-sm sm:font-medium sm:text-muted-foreground">Dashboard Ujion</h1>
      </div>

      <div className="flex items-center gap-1 sm:gap-3">
        <Badge variant={opencodeStatus === "connected" ? "default" : "destructive"} className="gap-1">
          <Wifi className="w-3 h-3" />
          <span className="hidden sm:inline">
            {opencodeStatus === "connected" ? "opencode connected" : "disconnected"}
          </span>
          <span className="sm:hidden">
            {opencodeStatus === "connected" ? "on" : "off"}
          </span>
        </Badge>
        <ThemeToggle />
        <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2 px-2 sm:px-3">
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </header>
  );
}
