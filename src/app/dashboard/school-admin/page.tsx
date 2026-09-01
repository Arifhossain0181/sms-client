"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLenis } from "@/hooks/useLenis";
import api from "@/lib/axios";
import {
  GraduationCap,
  UserCheck,
  Layers,
  CalendarCheck,
  Wallet,
  TrendingUp,
  Bell,
  BookMarked,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  BookOpen,
  ClipboardList,
  ArrowRight,
  AlertCircle,
  LibraryBig,
} from "lucide-react";
import { motion } from "framer-motion";

// ─── Types ──────────────────────────────────────────────────────────────────

type AttendanceSummary = {
  present: number;
  absent: number;
  late: number;
  total: number;
  date: string;
};

type FeeSummary = {
  totalPending: number;
  totalPaid: number;
  totalCollected: number;
};

type LibrarySummary = {
  totalBooks: number;
  totalIssued: number;
  overdueIssues: number;
};

type RecentAdmission = {
  id: string;
  applicantName: string;
  targetClass?: { name: string };
  createdAt: string;
  status: string;
};

type UpcomingExam = {
  id: string;
  name: string;
  type: string;
  nextExamDate: string | null;
};

type DashboardData = {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  attendance: AttendanceSummary;
  fees: FeeSummary;
  library: LibrarySummary;
  recentAdmissions: RecentAdmission[];
  upcomingExams: UpcomingExam[];
};

// ─── Animation variants ──────────────────────────────────────────────────────

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.38, ease: "easeOut" as const },
});

// ─── Skeleton helper ─────────────────────────────────────────────────────────

function Skel({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block rounded bg-muted/60 animate-pulse ${className}`}
    />
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function SchoolAdminDashboard() {
  useLenis();
  const router = useRouter();
  const { role } = useAuth();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Role guard
  useEffect(() => {
    if (role && role !== "SCHOOL_ADMIN" && role !== "SUPER_ADMIN") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  // Fetch single dashboard endpoint (SRS §Actor 2, UR3, SR3.3)
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get("/dashboard/school-admin");
        setData(res.data?.data ?? res.data ?? null);
      } catch {
        // keep data null — UI shows placeholders
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ── Today's attendance percentages ────────────────────────────────────────
  const att = data?.attendance;
  const attTotal = att?.total ?? 0;
  const presentPct = attTotal ? Math.round(((att?.present ?? 0) / attTotal) * 100) : 0;
  const absentPct  = attTotal ? Math.round(((att?.absent  ?? 0) / attTotal) * 100) : 0;
  const latePct    = attTotal ? Math.round(((att?.late    ?? 0) / attTotal) * 100) : 0;

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50/50 dark:bg-slate-950">
      {/* Animated background blobs */}
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

      <div className="relative space-y-8 p-4 sm:p-6 max-w-7xl mx-auto">

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <motion.div {...fadeUp(0)} className="relative rounded-3xl bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/30 dark:border-white/10 shadow-2xl shadow-slate-200/40 dark:shadow-none overflow-hidden">
          <div className="relative px-6 sm:px-8 py-6 bg-gradient-to-r from-sky-50 via-indigo-50 to-violet-50 dark:from-sky-500/10 dark:via-indigo-500/10 dark:to-violet-500/10 border-b border-white/40 dark:border-white/5 overflow-hidden">
            <motion.div
              animate={{ x: [0, 100, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none"
            />
            <div className="relative flex items-center justify-between flex-wrap gap-3">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-800 dark:text-white">
                  School Admin Dashboard
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
                  Consolidated overview — students, staff, fees, library &amp; exams.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-white/60 dark:bg-white/10 px-4 py-2 rounded-full">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                Academic Year 2025–26
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Top stat cards: students / teachers / classes ──────────────────── */}
        <motion.div {...fadeUp(0.05)} className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            {
              label: "Total Students",
              value: loading ? null : (data?.totalStudents ?? 0),
              icon: GraduationCap,
              color: "text-blue-600",
              bg: "bg-blue-50 dark:bg-blue-950/30",
              href: "/dashboard/students",
            },
            {
              label: "Total Teachers",
              value: loading ? null : (data?.totalTeachers ?? 0),
              icon: UserCheck,
              color: "text-emerald-600",
              bg: "bg-emerald-50 dark:bg-emerald-950/30",
              href: "/dashboard/teachers",
            },
            {
              label: "Total Classes",
              value: loading ? null : (data?.totalClasses ?? 0),
              icon: Layers,
              color: "text-violet-600",
              bg: "bg-violet-50 dark:bg-violet-950/30",
              href: "/dashboard/class",
            },
          ].map(({ label, value, icon: Icon, color, bg, href }, i) => (
            <motion.a
              key={label}
              href={href}
              custom={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 + i * 0.07, duration: 0.38, ease: "easeOut" }}
              className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/10 shadow-2xl p-6 flex items-center gap-5 transition-shadow group"
            >
              <div className={`w-14 h-14 rounded-2xl ${bg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-7 h-7 ${color}`} />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {label}
                </p>
                <p className="mt-1 text-3xl font-bold">
                  {value === null ? <Skel className="w-12 h-7 mt-1" /> : value}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400/60 dark:text-slate-500/60 ml-auto group-hover:translate-x-1 transition-transform" />
            </motion.a>
          ))}
        </motion.div>

        {/* ── Middle row: Attendance + Fee summary ───────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Today's Attendance Summary (SRS SR3.3) */}
          <motion.div {...fadeUp(0.15)} className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/10 shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <h2 className="font-semibold text-base text-slate-800 dark:text-white">Today&apos;s Attendance</h2>
              </div>
              {att?.date && (
                <span className="text-xs text-slate-500 dark:text-slate-400 bg-white/60 dark:bg-white/10 px-3 py-1 rounded-full">
                  {att.date}
                </span>
              )}
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((n) => <Skel key={n} className="w-full h-8 block" />)}
              </div>
            ) : attTotal === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No attendance records for today yet.</p>
            ) : (
              <div className="space-y-4">
                {/* Stacked progress bar */}
                <div className="h-3 rounded-full overflow-hidden flex bg-muted/40">
                  <div className="bg-emerald-500 transition-all" style={{ width: `${presentPct}%` }} />
                  <div className="bg-red-500 transition-all"     style={{ width: `${absentPct}%` }}  />
                  <div className="bg-amber-400 transition-all"   style={{ width: `${latePct}%` }}    />
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[
                    { label: "Present", count: att?.present ?? 0, pct: presentPct, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
                    { label: "Absent",  count: att?.absent  ?? 0, pct: absentPct,  icon: XCircle,       color: "text-red-500",     bg: "bg-red-50 dark:bg-red-950/30"         },
                    { label: "Late",    count: att?.late    ?? 0, pct: latePct,    icon: Clock,         color: "text-amber-500",   bg: "bg-amber-50 dark:bg-amber-950/30"     },
                  ].map(({ label, count, pct, icon: Icon, color, bg }) => (
                    <div key={label} className={`rounded-xl ${bg} p-3`}>
                      <Icon className={`w-5 h-5 ${color} mx-auto mb-1`} />
                      <p className="text-xl font-bold">{count}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{label} ({pct}%)</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-right text-slate-500 dark:text-slate-400">
                  Total marked: {attTotal} students
                </p>
              </div>
            )}
          </motion.div>

          {/* Fee Collection Summary (SRS SR3.3) */}
          <motion.div {...fadeUp(0.2)} className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/10 shadow-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <Wallet className="w-5 h-5 text-primary" />
              <h2 className="font-semibold text-base text-slate-800 dark:text-white">Fee Collection Status</h2>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((n) => <Skel key={n} className="w-full h-10 block" />)}
              </div>
            ) : (
              <div className="space-y-3">
                {[
                  { label: "Total Collected", value: `৳${data?.fees?.totalCollected ?? 0}`, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
                  { label: "Paid Count",      value: data?.fees?.totalPaid ?? 0,             color: "text-blue-600",    bg: "bg-blue-50 dark:bg-blue-950/30"       },
                  { label: "Pending Count",   value: data?.fees?.totalPending ?? 0,           color: "text-red-500",     bg: "bg-red-50 dark:bg-red-950/30"         },
                ].map(({ label, value, color, bg }) => (
                  <div key={label} className={`rounded-xl ${bg} px-4 py-3 flex items-center justify-between`}>
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</span>
                    <span className={`text-lg font-bold ${color}`}>{value}</span>
                  </div>
                ))}
                <a
                  href="/dashboard/fees"
                  className="mt-1 flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  View full fee report <ArrowRight className="w-3 h-3" />
                </a>
              </div>
            )}
          </motion.div>
        </div>

        {/* ── Library Status (SRS SR3.3) ─────────────────────────────────────── */}
        <motion.div {...fadeUp(0.25)} className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/10 shadow-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <LibraryBig className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-base text-slate-800 dark:text-white">Library Status</h2>
          </div>
          {loading ? (
            <div className="flex gap-4">
              {[1, 2, 3].map((n) => <Skel key={n} className="flex-1 h-20 block" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: "Total Books",   value: data?.library?.totalBooks    ?? 0, icon: BookOpen,    color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950/30" },
                { label: "Currently Issued", value: data?.library?.totalIssued ?? 0, icon: BookMarked,  color: "text-blue-600",   bg: "bg-blue-50 dark:bg-blue-950/30"     },
                { label: "Overdue Issues",   value: data?.library?.overdueIssues ?? 0, icon: AlertCircle, color: "text-red-500",    bg: "bg-red-50 dark:bg-red-950/30"       },
              ].map(({ label, value, icon: Icon, color, bg }) => (
                <div key={label} className={`rounded-xl ${bg} p-4 flex items-center gap-4`}>
                  <Icon className={`w-6 h-6 ${color} shrink-0`} />
                  <div>
                    <p className="text-2xl font-bold">{value}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* ── Bottom row: Recent Admissions + Upcoming Exams ─────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Recent Admissions (SRS SR3.3) */}
          <motion.div {...fadeUp(0.3)} className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/10 shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-primary" />
                <h2 className="font-semibold text-base text-slate-800 dark:text-white">Recent Admissions</h2>
              </div>
              <a href="/dashboard/admission" className="text-xs text-primary hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </a>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((n) => <Skel key={n} className="w-full h-9 block" />)}
              </div>
            ) : !data?.recentAdmissions?.length ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No pending admissions at this time.</p>
            ) : (
              <div className="divide-y divide-white/30 dark:divide-white/10">
                {data.recentAdmissions.map((adm) => (
                  <div key={adm.id} className="py-3 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{adm.applicantName}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {adm.targetClass?.name ?? "—"} &middot;{" "}
                        {new Date(adm.createdAt).toLocaleDateString("en-GB")}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                      {adm.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Upcoming Exams (SRS SR3.3) */}
          <motion.div {...fadeUp(0.35)} className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/10 shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-primary" />
                <h2 className="font-semibold text-base text-slate-800 dark:text-white">Upcoming Exams</h2>
              </div>
              <a href="/dashboard/exam-controller" className="text-xs text-primary hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </a>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((n) => <Skel key={n} className="w-full h-9 block" />)}
              </div>
            ) : !data?.upcomingExams?.length ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No upcoming exams scheduled.</p>
            ) : (
              <div className="divide-y divide-white/30 dark:divide-white/10">
                {data.upcomingExams.map((exam) => (
                  <div key={exam.id} className="py-3 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{exam.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{exam.type.replace(/_/g, " ")}</p>
                    </div>
                    <span className="shrink-0 text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      {exam.nextExamDate
                        ? new Date(exam.nextExamDate).toLocaleDateString("en-GB")
                        : "TBD"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* ── Quick Actions ──────────────────────────────────────────────────── */}
        <motion.div {...fadeUp(0.4)} className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/10 shadow-2xl p-6">
          <h3 className="text-base font-semibold mb-4 text-slate-800 dark:text-white">Quick Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Admission",      href: "/dashboard/admission",  icon: GraduationCap },
              { label: "Teachers",       href: "/dashboard/teachers",   icon: UserCheck     },
              { label: "Classes",        href: "/dashboard/class",      icon: Layers        },
              { label: "Post Notice",    href: "/dashboard/notices",    icon: Bell          },
            ].map(({ label, href, icon: Icon }) => (
              <a
                key={label}
                href={href}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-white/30 dark:border-white/10 text-center group hover:shadow-lg transition-shadow"
              >
                <Icon className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{label}</span>
              </a>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
