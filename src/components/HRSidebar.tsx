"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  CalendarCheck,
  CalendarOff,
  Banknote,
  TrendingUp,
  FolderOpen,
  BellRing,
  FileBarChart,
  LogOut,
} from "lucide-react";

// HR menu items
const hrMenuOptions = [
  { title: "Dashboard", path: "/dashboard/hr", icon: LayoutDashboard },
  { title: "Recruitment", path: "/dashboard/hr/recruitment", icon: Briefcase },
  { title: "Staff Management", path: "/dashboard/hr/profiles", icon: Users },
  { title: "Attendance", path: "/dashboard/hr/attendance", icon: CalendarCheck },
  { title: "Leave Management", path: "/dashboard/hr/leave", icon: CalendarOff },
  { title: "Payroll", path: "/dashboard/hr/payroll", icon: Banknote },
  { title: "Performance", path: "/dashboard/hr/performance", icon: TrendingUp },
  { title: "Documents", path: "/dashboard/hr/documents", icon: FolderOpen },
  { title: "Notices & Circulars", path: "/dashboard/hr/notices", icon: BellRing },
  { title: "Reports", path: "/dashboard/hr/reports", icon: FileBarChart },
];

const HRSidebar = () => {
  const pathname = usePathname(); // Identify the active route

  return (
    <aside className="h-screen w-64 bg-slate-900 text-white flex flex-col transition-all duration-300">
      {/* Logo and branding */}
      <div className="h-16 flex items-center justify-center border-b border-slate-700">
        <h1 className="text-xl font-bold tracking-wider text-blue-400">
          SMS <span className="text-white">HR Panel</span>
        </h1>
      </div>

      {/* Navigation menu */}
      <div className="flex-1 overflow-y-auto py-4 scrollbar-hide">
        <nav className="space-y-1 px-3">
          {hrMenuOptions.map((menu, index) => {
            const isActive = pathname === menu.path;
            const Icon = menu.icon;

            return (
              <Link
                key={index}
                href={menu.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200 group ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon
                  size={20}
                  className={
                    isActive ? "text-white" : "text-slate-400 group-hover:text-white"
                  }
                />
                <span className="font-medium text-sm">{menu.title}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User profile and logout (bottom section) */}
      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center font-bold text-sm">
            HR
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Admin HR</span>
            <span className="text-xs text-slate-400">hr@school.com</span>
          </div>
        </div>
        <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400 rounded-lg transition-colors text-sm font-medium">
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default HRSidebar;
