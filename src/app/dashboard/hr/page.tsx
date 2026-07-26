"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/axios";
import { useLenis } from "@/hooks/useLenis";
import type { Role } from "@/tyPes/auth.tyPes";
import {
  UserCog,
  CalendarCheck,
  Wallet,
  FileText,
  TrendingUp,
  Users,
  Clock,
  FileBadge,
} from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

type DashboardStats = {
  totalStaff: number;
  activeStaff: number;
  inactiveStaff: number;
  pendingLeaves: number;
  pendingPayrolls: number;
  pendingCriticalActions: number;
  avgAttendance: number;
  currentMonth: number;
  currentYear: number;
  pendingTeachingApplications: number;
};

const roleLabels: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  SCHOOL_ADMIN: "School Admin",
  ACCOUNTANT: "Accountant",
  TEACHER: "Teacher",
  STUDENT: "Student",
  PARENT: "Parent",
  EXAM_CONTROLLER: "Exam Controller",
  HR: "HR",
};

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: "easeOut" },
  }),
};

export default function HrDashboard() {
  useLenis();
  const router = useRouter();
  const { role } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role && role !== "HR" && role !== "SCHOOL_ADMIN") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        const [statsRes, staffRes, teachingRes] = await Promise.allSettled([
          api.get("/hr/dashboard"),
          api.get("/hr/staff/directory"),
          api.get("/teaching"),
        ]);
        const statsData = statsRes.status === "fulfilled" ? (statsRes.value.data?.data ?? statsRes.value.data) : null;
        setStats({
          ...(statsData || {}),
          pendingTeachingApplications:
            teachingRes.status === "fulfilled"
              ? (teachingRes.value.data?.data ?? teachingRes.value.data ?? []).filter(
                  (a: any) => a.status === "PENDING"
                ).length
              : 0,
        });

        const staffData = staffRes.status === "fulfilled" ? (staffRes.value.data?.data ?? staffRes.value.data) : [];
        setStaffList(Array.isArray(staffData) ? staffData : []);
      } catch {
        setStaffList([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const statCards = [
    {
      label: "Total Staff",
      value: stats ? stats.totalStaff.toString() : "—",
      icon: <Users className="h-5 w-5 text-sky-600 dark:text-sky-400" />,
    },
    {
      label: "Active Staff",
      value: stats ? stats.activeStaff.toString() : "—",
      sub: `${stats?.inactiveStaff ?? 0} inactive`,
      icon: <UserCog className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />,
    },
    {
      label: "Avg Attendance",
      value: stats ? `${stats.avgAttendance}%` : "—",
      sub: stats
        ? `${months[stats.currentMonth - 1]} ${stats.currentYear}`
        : undefined,
      icon: <TrendingUp className="h-5 w-5 text-teal-600 dark:text-teal-400" />,
      link: "/dashboard/hr/attendance",
      linkText: "Take Attendance →",
    },
    {
      label: "Pending Actions",
      value: stats
        ? String(
            (stats.pendingLeaves ?? 0) +
              (stats.pendingPayrolls ?? 0) +
              (stats.pendingCriticalActions ?? 0)
          )
        : "—",
      sub: `${stats?.pendingLeaves ?? 0} leaves · ${stats?.pendingPayrolls ?? 0} payrolls`,
      icon: <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />,
    },
    {
      label: "Pending Teaching Applications",
      value: stats ? String(stats.pendingTeachingApplications ?? 0) : "—",
      icon: <FileBadge className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />,
      link: "/dashboard/teaching-applications",
      linkText: "Review →",
    },
  ];

  const secondaryCards = [
    {
      label: "Pending Leave Requests",
      value: stats ? String(stats.pendingLeaves) : "—",
      icon: <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400" />,
    },
    {
      label: "Pending Payroll Disbursements",
      value: stats ? String(stats.pendingPayrolls) : "—",
      icon: <Wallet className="h-5 w-5 text-violet-600 dark:text-violet-400" />,
    },
    {
      label: "Pending Critical Actions",
      value: stats ? String(stats.pendingCriticalActions) : "—",
      sub: "Awaiting School Admin approval",
      icon: <CalendarCheck className="h-5 w-5 text-rose-600 dark:text-rose-400" />,
    },
  ];

  return (
    <div className="relative min-h-screen flex items-start justify-center p-4 sm:p-6 overflow-hidden bg-slate-50/50 dark:bg-slate-950">
      <motion.div
        animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-10 -left-32 w-[500px] h-[500px] bg-sky-300/20 dark:bg-sky-500/10 rounded-full blur-3xl pointer-events-none"
      />
      <motion.div
        animate={{ x: [0, -30, 0], y: [0, 40, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-10 -right-32 w-[600px] h-[600px] bg-violet-300/20 dark:bg-violet-500/10 rounded-full blur-3xl pointer-events-none"
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-indigo-300/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"
      />

      <div className="relative w-full max-w-5xl my-8 space-y-6">
        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/10 shadow-2xl shadow-slate-200/40 dark:shadow-none overflow-hidden">
          <div className="relative px-6 sm:px-8 py-6 bg-gradient-to-r from-sky-50 via-indigo-50 to-violet-50 dark:from-sky-500/10 dark:via-indigo-500/10 dark:to-violet-500/10 border-b border-white/40 dark:border-white/5 overflow-hidden">
            <motion.div
              animate={{ x: [0, 100, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none"
            />
            <div className="relative">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                {roleLabels.HR ?? "HR"} Dashboard
                <motion.span
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="text-indigo-400"
                >
                  <Users className="w-5 h-5" />
                </motion.span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Staff management, attendance, leave, payroll, and performance appraisals.
              </p>
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl">
                      <Skeleton className="w-14 h-14 rounded-2xl shrink-0 mb-4" />
                      <Skeleton className="h-3 w-24 rounded-md mb-2" />
                      <Skeleton className="h-6 w-16 rounded-md" />
                    </div>
                  ))
                : statCards.map((card, i) => (
                    <motion.div
                      key={card.label}
                      custom={i}
                      initial="hidden"
                      animate="visible"
                      variants={cardVariants}
                      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl flex items-center gap-5 hover:shadow-2xl transition-shadow"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        {card.icon}
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          {card.label}
                        </p>
                        <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                          {card.value}
                        </p>
                        <div className="mt-1 flex items-center justify-between">
                          {card.sub ? (
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {card.sub}
                            </p>
                          ) : (
                            <div />
                          )}
                          {(card as any).linkText && (card as any).link && (
                            <a href={(card as any).link} className="text-xs text-indigo-500 hover:underline">
                              {(card as any).linkText}
                            </a>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {loading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl">
                      <Skeleton className="w-14 h-14 rounded-2xl shrink-0 mb-4" />
                      <Skeleton className="h-3 w-32 rounded-md mb-2" />
                      <Skeleton className="h-6 w-12 rounded-md" />
                    </div>
                  ))
                : secondaryCards.map((card, i) => (
                    <motion.div
                      key={card.label}
                      custom={i + 4}
                      initial="hidden"
                      animate="visible"
                      variants={cardVariants}
                      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl flex items-center gap-5 hover:shadow-2xl transition-shadow"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        {card.icon}
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          {card.label}
                        </p>
                        <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                          {card.value}
                        </p>
                        {card.sub && (
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {card.sub}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl"
            >
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Staff Directory</h3>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32 rounded-md" />
                          <Skeleton className="h-3 w-48 rounded-md" />
                        </div>
                      </div>
                      <Skeleton className="h-3 w-24 rounded-md" />
                    </div>
                  ))}
                </div>
              ) : staffList.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">No staff records found.</p>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-slate-800">
                  {staffList.slice(0, 20).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{item.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {item.employeeId ?? ""} · {item.designation ?? "—"} ·{" "}
                          {item.department?.name ?? item.staffType ?? "—"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500 dark:text-slate-400">{item.email}</p>
                        {item.phone && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">{item.phone}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {!loading && staffList.length > 20 && (
                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                  Showing 20 of {staffList.length} staff members.{" "}
                  <a href="/dashboard/hr/profiles" className="underline">
                    View all
                  </a>
                </p>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
