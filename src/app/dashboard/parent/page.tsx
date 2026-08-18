"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import api from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";
import { useLenis } from "@/hooks/useLenis";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import {
  UsersRound,
  Wallet,
  CalendarCheck,
  Bell,
  ArrowLeft,
  Sparkles,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Inbox,
  ChevronRight,
  Loader2,
  Shield,
} from "lucide-react";

const unwrap = <T,>(res: { data: any }) => (res.data?.data ?? res.data) as T;

type ChildSummary = {
  id: string;
  name: string;
  class?: { id: string; name: string };
  section?: { id: string; name: string };
  rollNumber?: number;
  attendancePercentage?: number;
  pendingFees?: number;
  recentResultPercent?: number;
};

type AlertItem = {
  childId: string;
  childName: string;
  attendancePercentage: number;
  totalDays: number;
  absentDays: number;
};

type NoticeItem = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  read: boolean;
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.3 },
  }),
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function ParentDashboard() {
  useLenis();
  const router = useRouter();
  const { role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [children, setChildren] = useState<ChildSummary[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [notices, setNotices] = useState<NoticeItem[]>([]);

  useEffect(() => {
    if (role && role !== "PARENT") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const [childrenRes, alertsRes, noticesRes] = await Promise.allSettled([
          api.get("/parents/me/children-detailed"),
          api.get("/parents/me/alerts"),
          api.get("/parents/me/notices"),
        ]);

        if (childrenRes.status === "fulfilled") {
          const payload = unwrap<ChildSummary[]>(childrenRes.value);
          setChildren(Array.isArray(payload) ? payload : []);
        }

        if (alertsRes.status === "fulfilled") {
          const payload = unwrap<AlertItem[]>(alertsRes.value);
          setAlerts(Array.isArray(payload) ? payload : []);
        }

        if (noticesRes.status === "fulfilled") {
          const payload = unwrap<NoticeItem[]>(noticesRes.value);
          setNotices(Array.isArray(payload) ? payload.slice(0, 5) : []);
        }
      } catch {
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const stats = useMemo(() => {
    const totalChildren = children.length;
    const avgAttendance = totalChildren > 0
      ? Math.round(children.reduce((sum, c) => sum + (c.attendancePercentage ?? 0), 0) / totalChildren)
      : 0;
    const totalPendingFees = children.reduce((sum, c) => sum + (c.pendingFees ?? 0), 0);
    const alertCount = alerts.length;

    return [
      {
        label: "Children",
        value: totalChildren.toString(),
        icon: UsersRound,
        color: "from-sky-400 to-indigo-500",
      },
      {
        label: "Avg Attendance",
        value: `${avgAttendance}%`,
        icon: TrendingUp,
        color: avgAttendance >= 75 ? "from-emerald-400 to-teal-500" : "from-rose-400 to-pink-500",
      },
      {
        label: "Pending Fees",
        value: totalPendingFees.toString(),
        icon: Wallet,
        color: "from-amber-400 to-orange-500",
      },
      {
        label: "Alerts",
        value: alertCount.toString(),
        icon: AlertTriangle,
        color: alertCount > 0 ? "from-rose-400 to-pink-500" : "from-emerald-400 to-teal-500",
      },
    ];
  }, [children, alerts]);

  if (loading) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-slate-50/50 dark:bg-slate-950">
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
        <div className="relative w-full p-4 sm:p-6">
          <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/10 shadow-2xl p-8 space-y-4">
            <div className="h-8 w-1/3 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
            <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
            <div className="space-y-3 mt-6">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-20 bg-slate-200/60 dark:bg-slate-700/40 rounded-2xl animate-pulse"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50/50 dark:bg-slate-950">
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

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="relative w-full p-4 sm:p-6 space-y-6"
      >
        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/10 shadow-2xl shadow-slate-200/40 dark:shadow-none overflow-hidden">
          {/* Header */}
          <div className="relative px-6 sm:px-8 py-6 bg-gradient-to-r from-sky-50 via-indigo-50 to-violet-50 dark:from-sky-500/10 dark:via-indigo-500/10 dark:to-violet-500/10 border-b border-white/40 dark:border-white/5 overflow-hidden">
            <motion.div
              animate={{ x: [0, 100, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none"
            />

            <div className="relative flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <motion.div
                  whileHover={{ scale: 1.08, rotate: 4 }}
                  className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400 via-indigo-400 to-violet-500 shadow-lg shadow-indigo-500/30 flex items-center justify-center cursor-pointer"
                >
                  <Shield className="w-6 h-6 text-white" />
                  <motion.div
                    className="absolute inset-0 rounded-2xl border-2 border-white/40 dark:border-white/20"
                    animate={{ scale: [1, 1.12, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2.4, repeat: Infinity }}
                  />
                </motion.div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    Parent Dashboard
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    Monitor your children&apos;s progress, fees, and notices.
                  </p>
                </div>
              </div>

              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to dashboard
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="p-4 sm:p-6 border-b border-white/30 dark:border-white/5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  custom={i}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  className="relative flex items-center gap-3 p-4 rounded-2xl border border-white/30 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-sm"
                >
                  <div className={`flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white shadow-md shadow-indigo-500/20`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 truncate">{stat.label}</p>
                    <p className="text-lg font-bold text-slate-800 dark:text-white mt-0.5">{stat.value}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="px-6">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 px-4 py-3 rounded-xl text-sm font-medium border bg-red-50/80 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/20"
              >
                {error}
              </motion.div>
            </div>
          )}

          {/* Alerts */}
          {alerts.length > 0 && (
            <div className="px-4 sm:px-6 pb-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-2xl border border-amber-200/60 dark:border-amber-500/20 bg-amber-50/60 dark:bg-amber-500/5 backdrop-blur-sm"
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Low Attendance Alerts</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {alerts.map((alert) => (
                    <motion.div
                      key={alert.childId}
                      whileHover={{ y: -2, transition: { duration: 0.2 } }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center justify-between rounded-xl border border-amber-200/60 dark:border-amber-500/20 bg-white/60 dark:bg-white/5 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{alert.childName}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          Attendance: {alert.attendancePercentage}% · {alert.absentDays} absent out of {alert.totalDays} days
                        </p>
                      </div>
                      <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                        Below 75%
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          )}

          {/* Children + Notices */}
          <div className="p-4 sm:p-6 grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Children */}
            <div className="rounded-2xl border border-white/30 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-white/30 dark:border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 via-indigo-400 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                    <UsersRound className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Your Children</h3>
                </div>
                <span className="text-xs text-slate-400 dark:text-slate-500">{children.length} total</span>
              </div>

              {children.length === 0 ? (
                <div className="p-12 text-center">
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="w-14 h-14 rounded-full bg-gradient-to-br from-sky-100 via-indigo-100 to-violet-100 dark:from-sky-500/10 dark:via-indigo-500/10 dark:to-violet-500/10 flex items-center justify-center mx-auto mb-4 ring-1 ring-indigo-200/60 dark:ring-indigo-400/20"
                  >
                    <Inbox className="w-6 h-6 text-indigo-400" />
                  </motion.div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">No children linked</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    Children will appear here once linked to your account.
                  </p>
                </div>
              ) : (
                <motion.div variants={container} initial="hidden" animate="show" className="divide-y divide-white/30 dark:divide-white/5">
                  {children.map((child) => (
                    <motion.div
                      key={child.id}
                      variants={item}
                      whileHover={{ x: 4, transition: { duration: 0.15 } }}
                      className="px-6 py-4 hover:bg-white/40 dark:hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{child.name}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500">
                            {child.class?.name ?? "Class"} · {child.section?.name ?? "Section"} · Roll: {child.rollNumber ?? "-"}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-xs text-slate-400 dark:text-slate-500">Attendance</p>
                            <p className={`text-sm font-semibold ${(child.attendancePercentage ?? 0) >= 75 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                              {child.attendancePercentage ?? 0}%
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-400 dark:text-slate-500">Result</p>
                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{child.recentResultPercent ?? 0}%</p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-600" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>

            {/* Notices */}
            <div className="rounded-2xl border border-white/30 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-white/30 dark:border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white shadow-md shadow-violet-500/20">
                    <Bell className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Recent Notices</h3>
                </div>
                <span className="text-xs text-slate-400 dark:text-slate-500">{notices.length} new</span>
              </div>

              {notices.length === 0 ? (
                <div className="p-12 text-center">
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="w-14 h-14 rounded-full bg-gradient-to-br from-sky-100 via-indigo-100 to-violet-100 dark:from-sky-500/10 dark:via-indigo-500/10 dark:to-violet-500/10 flex items-center justify-center mx-auto mb-4 ring-1 ring-indigo-200/60 dark:ring-indigo-400/20"
                  >
                    <Inbox className="w-6 h-6 text-indigo-400" />
                  </motion.div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">No notices yet</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Check back later for updates.</p>
                </div>
              ) : (
                <motion.div variants={container} initial="hidden" animate="show" className="divide-y divide-white/30 dark:divide-white/5">
                  {notices.map((notice) => (
                    <motion.div
                      key={notice.id}
                      variants={item}
                      whileHover={{ x: 4, transition: { duration: 0.15 } }}
                      className="px-6 py-4 hover:bg-white/40 dark:hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {!notice.read && (
                          <span className="h-2 w-2 rounded-full bg-indigo-500 dark:bg-indigo-400 shrink-0" />
                        )}
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{notice.title}</p>
                      </div>
                      <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-2 ml-4">
                        {notice.content}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 ml-4">
                        {formatDate(notice.createdAt)}
                      </p>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          </div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 1 }}
          className="text-center text-[10px] font-bold tracking-[0.3em] uppercase text-slate-400 dark:text-slate-600"
        >
          EduCore Parent Panel
        </motion.p>
      </motion.div>
    </div>
  );
}
