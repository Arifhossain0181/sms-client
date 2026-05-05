"use client";

import { useState } from "react";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background text-foreground flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 min-w-0 flex flex-col">
          <Topbar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
          <main className="flex-1 px-6 lg:px-10 py-8">{children}</main>
        </div>
      </div>
    </ThemeProvider>
  );
}
