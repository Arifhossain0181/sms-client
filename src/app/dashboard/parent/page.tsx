"use client";

import { useEffect, useMemo, useState } from "react";
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

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const cardHover = {
  hover: { y: -2, transition: { duration: 0.2 } },
  tap: { scale: 0.98 },
};

const listItemHover = {
  hover: { x: 4, transition: { duration: 0.15 } },
};

export default function ParentDashboard() {
  useLenis();
  const { role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [children, setChildren] = useState<ChildSummary[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [notices, setNotices] = useState<NoticeItem[]>([]);

  useEffect(() => {
    if (role && role !== "PARENT") {
      window.location.href = "/dashboard";
    }
  }, [role]);

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
        color: "text-slate-600 dark:text-slate-300",
      },
      {
        label: "Avg Attendance",
        value: `${avgAttendance}%`,
        icon: TrendingUp,
        color: avgAttendance >= 75 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400",
      },
      {
        label: "Pending Fees",
        value: totalPendingFees.toString(),
        icon: Wallet,
        color: "text-amber-600 dark:text-amber-400",
      },
      {
        label: "Alerts",
        value: alertCount.toString(),
        icon: AlertTriangle,
        color: alertCount > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400",
      },
    ];
  }, [children, alerts]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Parent Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Monitor your children&apos;s progress, fees, and notices.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="text-sm text-primary hover:underline inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-border/60 bg-card p-4 shadow-soft space-y-3"
            >
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              variants={item}
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.98 }}
              className="rounded-xl border border-border/60 bg-card/80 p-4 shadow-soft cursor-default"
            >
              <div className="flex items-center gap-2">
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{stat.label}</p>
              </div>
              <p className="mt-2 text-lg font-semibold text-foreground">{stat.value}</p>
            </motion.div>
          ))}
        </motion.div>
      )}

      {alerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-amber-300/60 dark:border-amber-400/30 bg-amber-50/60 dark:bg-amber-500/5 p-6 shadow-soft"
        >
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <h2 className="text-lg font-semibold text-foreground">Low Attendance Alerts</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {alerts.map((alert) => (
              <motion.div
                key={alert.childId}
                whileHover={{ y: -2, transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center justify-between rounded-lg border border-amber-200/60 dark:border-amber-500/20 bg-white/60 dark:bg-white/[0.03] px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{alert.childName}</p>
                  <p className="text-xs text-muted-foreground">
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
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-border/60 bg-card/80 shadow-soft overflow-hidden">
          <div className="px-6 py-4 border-b border-border/60 bg-secondary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UsersRound className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
                <h3 className="text-base font-semibold text-foreground">Your Children</h3>
              </div>
              <span className="text-xs text-muted-foreground">{children.length} total</span>
            </div>
          </div>

          {loading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 2 }).map((_, idx) => (
                <div key={idx} className="space-y-3">
                  <Skeleton className="h-4 w-3/5" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-4/5" />
                </div>
              ))}
            </div>
          ) : children.length === 0 ? (
            <div className="p-12 text-center">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-secondary/60 mx-auto mb-4">
                <Inbox className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">No children linked</p>
              <p className="text-xs text-muted-foreground mt-1">
                Children will appear here once linked to your account.
              </p>
            </div>
          ) : (
            <motion.div variants={container} initial="hidden" animate="show" className="divide-y divide-border/60">
              {children.map((child) => (
                <motion.div
                  key={child.id}
                  variants={item}
                  whileHover={{ x: 4, transition: { duration: 0.15 } }}
                  className="px-6 py-4 hover:bg-secondary/20 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{child.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {child.class?.name ?? "Class"} · {child.section?.name ?? "Section"} · Roll: {child.rollNumber ?? "-"}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Attendance</p>
                        <p className={`text-sm font-semibold ${(child.attendancePercentage ?? 0) >= 75 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                          {child.attendancePercentage ?? 0}%
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Result</p>
                        <p className="text-sm font-semibold text-foreground">{child.recentResultPercent ?? 0}%</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/80 shadow-soft overflow-hidden">
          <div className="px-6 py-4 border-b border-border/60 bg-secondary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-violet-500 dark:text-violet-400" />
                <h3 className="text-base font-semibold text-foreground">Recent Notices</h3>
              </div>
              <span className="text-xs text-muted-foreground">{notices.length} new</span>
            </div>
          </div>

          {loading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="space-y-2">
                  <Skeleton className="h-4 w-3/5" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-4/5" />
                </div>
              ))}
            </div>
          ) : notices.length === 0 ? (
            <div className="p-12 text-center">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-secondary/60 mx-auto mb-4">
                <Inbox className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">No notices yet</p>
              <p className="text-xs text-muted-foreground mt-1">Check back later for updates.</p>
            </div>
          ) : (
            <motion.div variants={container} initial="hidden" animate="show" className="divide-y divide-border/60">
              {notices.map((notice) => (
                <motion.div
                  key={notice.id}
                  variants={item}
                  whileHover={{ x: 4, transition: { duration: 0.15 } }}
                  className="px-6 py-4 hover:bg-secondary/20 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-1">
                    {!notice.read && (
                      <span className="h-2 w-2 rounded-full bg-indigo-500 dark:bg-indigo-400 shrink-0" />
                    )}
                    <p className="text-sm font-medium text-foreground">{notice.title}</p>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 ml-4">
                    {notice.content}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1 ml-4">
                    {formatDate(notice.createdAt)}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
