"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, CheckSquare, ClipboardCheck, Users, Menu,
} from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const items = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Tasks", href: "/tasks", icon: CheckSquare },
  { title: "Approvals", href: "/approvals", icon: ClipboardCheck },
  { title: "Agents", href: "/agents", icon: Users },
];

// Bottom navbar khusus mobile (md:hidden). 4 menu utama + Menu untuk
// membuka sidebar Sheet berisi 12 menu lengkap.
export function MobileNav() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t bg-background/95 backdrop-blur md:hidden">
      <div className="grid grid-cols-5 pb-[env(safe-area-inset-bottom)]">
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2 text-[10px]",
                active ? "text-primary font-semibold" : "text-muted-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.title}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setOpenMobile(true)}
          className="flex flex-col items-center gap-0.5 py-2 text-[10px] text-muted-foreground"
        >
          <Menu className="w-5 h-5" />
          <span>Menu</span>
        </button>
      </div>
    </nav>
  );
}
