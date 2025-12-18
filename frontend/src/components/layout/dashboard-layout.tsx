"use client";

import * as React from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { useAuth } from "@/contexts/auth-context";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  // Close sidebar on window resize if desktop
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="p-4 lg:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
