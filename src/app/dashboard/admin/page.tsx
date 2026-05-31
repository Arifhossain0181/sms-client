/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  AlertCircle,
  CalendarCheck,
  Layers,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLenis } from "@/hooks/useLenis";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/axios";
import { AttendanceChart } from "../components/AttendanceChart";
import { RevenueChart } from "../components/RevenueChart";
import { FeeCollection } from "../components/FeeCollection";
import { RecentAdmissions } from "../components/RecentAdmissions";
import { UpcomingExams } from "../components/UpcomingExams";

type AdmissionItem = { id: string; name: string; grade: string; status: string };
type UpcomingExamItem = { id: string; title: string; date: string };
type AdminStats = {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  attendancePercent: number;
  feesCollected: number;
  pendingFees: number;
  admissionsPending: number;
  overdueCount: number;
};

const unwrap = <T,>(res: { data: any }): T => (res.data?.data ?? res.data) as T;

const formatShortDate = (value: string | Date) =>
  new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short" }).format(
    typeof value === "string" ? new Date(value) : value
  );

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const DashboardInner = () => {
  useLenis();
  const { role } = useAuth();
  const [stats, setStats] = useState<AdminStats>({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    attendancePercent: 0,
    feesCollected: 0,
    pendingFees: 0,
    admissionsPending: 0,
    overdueCount: 0,
  });
  const [recentAdmissions, setRecentAdmissions] = useState<AdmissionItem[]>([]);
  const [upcomingExams, setUpcomingExams] = useState<UpcomingExamItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role && role !== "ADMIN") {
      window.location.href = "/dashboard";
    }
  }, [role]);

  const monthKey = useMemo(() => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${now.getFullYear()}-${month}`;
  }, []);

  const todayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("en-GB", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      }).format(new Date()),
    []
  );

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const [
          studentsRes,
          teachersRes,
          classesRes,
          admissionsRes,
          admissionStatsRes,
          feeSummaryRes,
          examsRes,
        ] = await Promise.all([
          api.get("/students?limit=1"),
          api.get("/teachers?limit=1"),
          api.get("/classes"),
          api.get("/admission?limit=5"),
          api.get("/admission/stats"),
          api.get(`/fees/summary?month=${monthKey}`),
          api.get("/exams"),
        ]);

        const studentsPayload = unwrap<{ meta?: { total?: number } }>(studentsRes);
        const teachersPayload = unwrap<{ meta?: { total?: number } }>(teachersRes);
        const classesPayload = unwrap<Array<{ id: string; sections?: any[] }>>(classesRes);
        const admissionsPayload = unwrap<{ data?: Array<any> }>(admissionsRes);
        const admissionStats = unwrap<{ pending?: number }>(admissionStatsRes);
        const feeSummary = unwrap<{
          totalPaid: number;
          outstanding: number;
          overdueCount: number;
          pendingCount: number;
        }>(feeSummaryRes);
        const examsPayload = unwrap<Array<any>>(examsRes);

        const sections = classesPayload.flatMap((cls) =>
          (cls.sections ?? []).map((section: any) => ({
            sectionId: section.id,
            classId: section.classId ?? cls.id,
          }))
        );

        const today = new Date();
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const dateKey = today.toISOString().split("T")[0];

        const attendanceResults = await Promise.all(
          sections.map((section) =>
            api
              .get("/attendance", {
                params: {
                  classId: section.classId,
                  sectionId: section.sectionId,
                  date: dateKey,
                },
              })
              .then((res) => unwrap<Array<{ status: string }>>(res))
              .catch(() => [])
          )
        );

        const totalAttendance = attendanceResults.reduce(
          (sum, records) => sum + records.length,
          0
        );
        const presentAttendance = attendanceResults.reduce(
          (sum, records) => sum + records.filter((r) => r.status === "PRESENT").length,
          0
        );
        const attendancePercent = totalAttendance
          ? Math.round((presentAttendance / totalAttendance) * 100)
          : 0;

        setStats({
          totalStudents: studentsPayload?.meta?.total ?? 0,
          totalTeachers: teachersPayload?.meta?.total ?? 0,
          totalClasses: classesPayload.length,
          attendancePercent,
          feesCollected: feeSummary.totalPaid ?? 0,
          pendingFees: feeSummary.outstanding ?? 0,
          admissionsPending: admissionStats?.pending ?? 0,
          overdueCount: feeSummary.overdueCount ?? 0,
        });

        const admissionsData = admissionsPayload?.data ?? [];
        setRecentAdmissions(
          admissionsData.map((item: any) => ({
            id: item.id,
            name: item.applicantName,
            grade: item.targetClass
              ? `${item.targetClass.name} (Class ${item.targetClass.numericLevel})`
              : "",
            status: item.status,
          }))
        );

        const examItems: UpcomingExamItem[] = examsPayload
          .flatMap((exam: any) =>
            (exam.schedules ?? []).map((schedule: any) => ({
              id: schedule.id,
              title: `${exam.name} - ${schedule.subject?.name ?? "Subject"}`,
              date: formatShortDate(schedule.examDate),
              dateValue: new Date(schedule.examDate).getTime(),
            }))
          )
          .filter((item: any) => item.dateValue >= todayStart.getTime())
          .sort((a: any, b: any) => a.dateValue - b.dateValue)
          .slice(0, 3)
          .map(({ id, title, date }: any) => ({ id, title, date }));

        setUpcomingExams(examItems);
      } catch (error) {
        console.error("Failed to load dashboard", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [monthKey]);

  const statCards = [
    {
      title: "Total Students",
      value: stats.totalStudents.toLocaleString(),
      icon: Users,
      tone: "text-blue-600 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400",
      ring: "ring-blue-100 dark:ring-blue-500/20",
    },
    {
      title: "Total Teachers",
      value: stats.totalTeachers.toLocaleString(),
      icon: UserCheck,
      tone: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400",
      ring: "ring-emerald-100 dark:ring-emerald-500/20",
    },
    {
      title: "Active Classes",
      value: stats.totalClasses.toLocaleString(),
      icon: Layers,
      tone: "text-sky-600 bg-sky-50 dark:bg-sky-500/10 dark:text-sky-400",
      ring: "ring-sky-100 dark:ring-sky-500/20",
    },
    {
      title: "Attendance Today",
      value: `${stats.attendancePercent}%`,
      icon: CalendarCheck,
      tone: "text-violet-600 bg-violet-50 dark:bg-violet-500/10 dark:text-violet-400",
      ring: "ring-violet-100 dark:ring-violet-500/20",
    },
    {
      title: "Fees Collected",
      value: formatCurrency(stats.feesCollected),
      icon: Wallet,
      tone: "text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400",
      ring: "ring-amber-100 dark:ring-amber-500/20",
    },
    {
      title: "Pending / Overdue",
      value: `${stats.admissionsPending} · ${stats.overdueCount}`,
      icon: AlertCircle,
      tone: "text-rose-600 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400",
      ring: "ring-rose-100 dark:ring-rose-500/20",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 dark:border-slate-800 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {todayLabel}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              Welcome back, Admin
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Heres whats happening across your school today.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex h-2 w-2 rounded-full ${
                loading ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
              }`}
            />
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {loading ? "Syncing data…" : "All systems up to date"}
            </span>
          </div>
        </header>

        {/* Stats */}
        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {statCards.map(({ title, value, icon: Icon, tone, ring }) => (
            <div
              key={title}
              className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900 ring-1 ${ring}`}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {title}
                </p>
                <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${tone}`}>
                  <Icon className="h-4.5 w-4.5" strokeWidth={2} />
                </span>
              </div>
              <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                {value}
              </p>
            </div>
          ))}
        </section>

        {/* Charts */}
        <section className="mt-6 grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  Attendance Overview
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Weekly attendance across all sections
                </p>
              </div>
            </div>
            <AttendanceChart />
          </div>
          <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Revenue
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Monthly fee collection trend
              </p>
            </div>
            <RevenueChart />
          </div>
        </section>

        {/* Fees + Admissions */}
        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <FeeCollection collected={stats.feesCollected} outstanding={stats.pendingFees} overdueCount={stats.overdueCount} />
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <RecentAdmissions items={recentAdmissions} isLoading={loading} />
          </div>
        </section>

        {/* Upcoming exams */}
        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <UpcomingExams items={upcomingExams} isLoading={loading} />
        </section>
      </div>
    </div>
  );
};

export default function AdminDashboard() {
  return <DashboardInner />;
}
