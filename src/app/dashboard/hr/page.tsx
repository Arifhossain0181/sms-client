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
import { motion, type Variants } from "framer-motion";
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
  totalTeachingApplications: number;
  pendingTeachingApplications: number;
};

type TeachingApplicationSummary = {
  id: string;
  name: string;
  email: string;
  designation: string;
  experience: number;
  phone?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt?: string;
  reviewedAt?: string;
};

type StaffRecord = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  employeeId?: string;
  designation?: string;
  staffType?: string;
  department?: { name?: string };
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

const cardVariants: Variants = {
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
  const [staffList, setStaffList] = useState<StaffRecord[]>([]);
  const [teachingApplications, setTeachingApplications] = useState<TeachingApplicationSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role && role !== "HR" && role !== "SCHOOL_ADMIN") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  useEffect(() => {
    if (!role || (role !== "HR" && role !== "SCHOOL_ADMIN")) {
      return;
    }

    const load = async () => {
      try {
        setLoading(true);

        const [statsRes, staffRes, teachingRes] = await Promise.allSettled([
          api.get("/hr/dashboard"),
          api.get("/hr/staff/directory"),
          api.get("/teaching"),
        ]);
        const statsData = statsRes.status === "fulfilled" ? (statsRes.value.data?.data ?? statsRes.value.data) : null;

        const rawTeachingData = teachingRes.status === "fulfilled" ? teachingRes.value.data : null;
        const teachingPayload = Array.isArray(rawTeachingData)
          ? rawTeachingData
          : Array.isArray(rawTeachingData?.data)
            ? rawTeachingData.data
            : Array.isArray(rawTeachingData?.data?.data)
              ? rawTeachingData.data.data
              : [];
        const normalizedTeachingApplications: TeachingApplicationSummary[] = Array.isArray(teachingPayload)
          ? (teachingPayload as TeachingApplicationSummary[])
          : [];

        setStats({
          ...(statsData || {}),
          totalTeachingApplications: normalizedTeachingApplications.length,
          pendingTeachingApplications:
            normalizedTeachingApplications.filter((item) => item.status === "PENDING").length,
        });
        setTeachingApplications(normalizedTeachingApplications);

        const staffData = staffRes.status === "fulfilled" ? (staffRes.value.data?.data ?? staffRes.value.data) : [];
        setStaffList(Array.isArray(staffData) ? (staffData as StaffRecord[]) : []);
      } catch {
        setStaffList([]);
        setTeachingApplications([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [role]);

  const approvedTeacherCount = teachingApplications.filter((item) => item.status === "APPROVED").length;

  const summaryCards = [
    {
      label: "Approved Teachers",
      value: String(approvedTeacherCount),
      icon: <FileBadge className="h-5 w-5 text-violet-600 dark:text-violet-400" />,
    },
    {
      label: "Total Teachers",
      value: stats ? String(stats.totalStaff) : "—",
      icon: <Users className="h-5 w-5 text-sky-600 dark:text-sky-400" />,
    },
    {
      label: "Active",
      value: stats ? String(stats.activeStaff) : "—",
      icon: <UserCog className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />,
    },
    {
      label: "Inactive",
      value: stats ? String(stats.inactiveStaff) : "—",
      icon: <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />,
    },
  ];

  const staffStatusCards = [
    {
      label: "Active Staff",
      value: stats ? String(stats.activeStaff) : "0",
      accent: "emerald",
      note: "Currently working",
      icon: <UserCog className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />,
    },
    {
      label: "Inactive Staff",
      value: stats ? String(stats.inactiveStaff) : "0",
      accent: "amber",
      note: "Currently inactive",
      icon: <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />,
    },
  ];

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-slate-50/50 dark:bg-slate-950">
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

      <div className="relative w-full max-w-none px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">
        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/10 shadow-2xl shadow-slate-200/40 dark:shadow-none overflow-hidden transition-all duration-300 hover:shadow-[0_25px_60px_-15px_rgba(15,23,42,0.35)]">
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
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl">
                      <Skeleton className="w-14 h-14 rounded-2xl shrink-0 mb-4" />
                      <Skeleton className="h-3 w-28 rounded-md mb-2" />
                      <Skeleton className="h-6 w-12 rounded-md" />
                    </div>
                  ))
                : summaryCards.map((card, i) => (
                    <motion.div
                      key={card.label}
                      custom={i}
                      initial="hidden"
                      animate="visible"
                      variants={cardVariants}
                      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl flex items-center gap-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
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
                      </div>
                    </motion.div>
                  ))}
            </div>

            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xl">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    Staff status
                  </p>
                  <h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                    Active vs Inactive Staff
                  </h2>
                </div>
                <div className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {stats ? `${stats.totalStaff} total staff` : "0 total staff"}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {staffStatusCards.map((card) => (
                  <div
                    key={card.label}
                    className={`rounded-2xl border p-5 shadow-sm ${
                      card.accent === "emerald"
                        ? "border-emerald-200 bg-emerald-50/80 dark:border-emerald-800/60 dark:bg-emerald-950/30"
                        : "border-amber-200 bg-amber-50/80 dark:border-amber-800/60 dark:bg-amber-950/30"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          {card.label}
                        </p>
                        <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{card.value}</p>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 dark:bg-slate-900/60">
                        {card.icon}
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{card.note}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
