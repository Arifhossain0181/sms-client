"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  BookOpen,
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  FileText,
  GraduationCap,
  HelpCircle,
  Home,
  Briefcase,
  LayoutDashboard,
  Layers,
  Megaphone,
  Settings,
  UserCheck,
  Users,
  Wallet,
  GraduationCap as Logo,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { Role } from "@/tyPes/auth.tyPes";

type NavItem = {
  icon: typeof LayoutDashboard;
  label: string;
  href: string;
};

const getDashboardHref = (role: Role) => {
  if (role === "ADMIN") return "/dashboard/admin";
  if (role === "TEACHER") return "/dashboard/teacher";
  return "/dashboard/student";
};

const getNavItems = (role: Role | null): NavItem[] => {
  if (!role) return [];

  if (role === "ADMIN") {
    return [
      { icon: Home, label: "Home", href: "/" },
      { icon: LayoutDashboard, label: "Dashboard", href: getDashboardHref(role) },
      { icon: Users, label: "Students", href: "/dashboard/students" },
      { icon: UserCheck, label: "Teachers", href: "/dashboard/teachers" },
      { icon: Layers, label: "Classes", href: "/dashboard/class" },
      { icon: BookOpen, label: "Subjects", href: "/dashboard/subject" },
      { icon: CalendarCheck, label: "Attendance", href: "/dashboard/attendances" },
      { icon: ClipboardList, label: "Exams", href: "/dashboard/exam" },
      { icon: BarChart3, label: "Results", href: "/dashboard/result" },
      { icon: Wallet, label: "Fees", href: "/dashboard/fees" },
      { icon: Megaphone, label: "Notices", href: "/dashboard/notices" },
      { icon: CalendarDays, label: "Timetable", href: "/dashboard/timetable" },
      { icon: FileText, label: "Admission", href: "/dashboard/admission" },
      { icon: Briefcase, label: "Teaching Apps", href: "/dashboard/teaching-applications" },
      { icon: Bell, label: "Notifications", href: "/dashboard/nitfication" },
    ];
  }

  if (role === "TEACHER") {
    return [
      { icon: Home, label: "Home", href: "/" },
      { icon: LayoutDashboard, label: "Dashboard", href: getDashboardHref(role) },
      { icon: CalendarCheck, label: "Attendance", href: "/dashboard/attendances" },
      { icon: ClipboardList, label: "Exams", href: "/dashboard/exam" },
      { icon: BarChart3, label: "Results", href: "/dashboard/result" },
      { icon: Megaphone, label: "Notices", href: "/dashboard/notices" },
      { icon: CalendarDays, label: "Timetable", href: "/dashboard/timetable" },
      { icon: Bell, label: "Notifications", href: "/dashboard/nitfication" },
    ];
  }

  return [
    { icon: Home, label: "Home", href: "/" },
    { icon: LayoutDashboard, label: "Dashboard", href: getDashboardHref(role) },
    { icon: BarChart3, label: "Results", href: "/dashboard/result" },
    { icon: Wallet, label: "Fees", href: "/dashboard/fees" },
    { icon: Megaphone, label: "Notices", href: "/dashboard/notices" },
    { icon: CalendarDays, label: "Timetable", href: "/dashboard/timetable" },
    { icon: Bell, label: "Notifications", href: "/dashboard/nitfication" },
  ];
};

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const SidebarContent = ({ showClose, onClose }: { showClose: boolean; onClose: () => void }) => {
  const { role } = useAuth();
  const pathname = usePathname();
  const navItems = getNavItems(role);
  return (
    <div className="h-full w-full flex flex-col bg-sidebar-bg text-sidebar-fg p-6">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-3 mb-10"
      >
        <div className="w-11 h-11 rounded-xl gradient-primary flex items-center justify-center shadow-elegant">
          <Logo className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight">Greenwood</h1>
          <p className="text-xs text-sidebar-muted">K-10 Admin Suite</p>
        </div>
        {showClose && (
          <button
            onClick={onClose}
            className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-sidebar-fg hover:bg-white/20"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </motion.div>

      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map((item, i) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * i }}
              className="relative flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors hover:bg-white/5 group"
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-lg gradient-primary shadow-elegant"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <Link
                href={item.href}
                onClick={() => showClose && onClose()}
                className="relative z-10 flex w-full items-center gap-3"
              >
                <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? "text-white" : "text-sidebar-muted"}`} />
                <span className={`${isActive ? "text-white" : "text-sidebar-fg"}`}>{item.label}</span>
              </Link>
            </motion.div>
          );
        })}
      </nav>

      <div className="flex flex-col gap-1 pt-6 border-t border-white/10">
        <button className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-sidebar-muted hover:bg-white/5 hover:text-sidebar-fg transition-colors">
          <HelpCircle className="w-5 h-5" /> Support
        </button>
        <button className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-sidebar-muted hover:bg-white/5 hover:text-sidebar-fg transition-colors">
          <Settings className="w-5 h-5" /> Settings
        </button>
      </div>
    </div>
  );
};

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  return (
    <>
      <div className="hidden lg:flex sticky top-0 h-screen w-64 shrink-0">
        <SidebarContent showClose={false} onClose={onClose} />
      </div>

      <div className="lg:hidden">
        {isOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={onClose}
            aria-hidden="true"
          />
        )}
        <motion.aside
          initial={false}
          animate={{ x: isOpen ? 0 : -320 }}
          transition={{ type: "spring", stiffness: 320, damping: 32 }}
          className="fixed left-0 top-0 z-50 h-screen w-72 shadow-elegant"
        >
          <SidebarContent showClose={true} onClose={onClose} />
        </motion.aside>
      </div>
    </>
  );
};
