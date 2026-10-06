import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { AppFooter } from "@/components/layout/app-footer";
import { MobileNav } from "@/components/layout/mobile-nav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <AppHeader />
          <main className="flex-1 overflow-y-auto p-4 pb-20 sm:p-6 md:pb-6">
            {children}
          </main>
          <AppFooter />
          <MobileNav />
        </div>
      </div>
    </SidebarProvider>
  );
}
