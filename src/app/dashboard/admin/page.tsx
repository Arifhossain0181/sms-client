/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { AlertCircle, CalendarCheck, Layers, UserCheck, Users, Wallet } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLenis } from "@/hooks/useLenis";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/axios";
import { StatCard } from "../components/StatCard";
import { AttendanceChart } from "../components/AttendanceChart";
import { RevenueChart } from "../components/RevenueChart";
import { FeeCollection } from "../components/FeeCollection";
import { RecentAdmissions } from "../components/RecentAdmissions";
import { UpcomingExams } from "../components/UpcomingExams";

type AdmissionItem = {
  id: string;
  name: string;
  grade: string;
  status: string;
};

type UpcomingExamItem = {
  id: string;
  title: string;
  date: string;
};

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
        const classesPayload = unwrap<Array<{ id: string; sections?: Array<{ id: string; classId: string }> }>>(classesRes);
        const admissionsPayload = unwrap<{ data?: Array<any> }>(admissionsRes);
        const admissionStats = unwrap<{ pending?: number }>(admissionStatsRes);
        const feeSummary = unwrap<{ totalPaid: number; outstanding: number; overdueCount: number; pendingCount: number }>(feeSummaryRes);
        const examsPayload = unwrap<Array<any>>(examsRes);

        const sections = classesPayload.flatMap((cls) =>
          (cls.sections ?? []).map((section) => ({
            sectionId: section.id,
            classId: (section as any).classId ?? cls.id,
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
                params: { classId: section.classId, sectionId: section.sectionId, date: dateKey },
              })
              .then((res) => unwrap<Array<{ status: string }>>(res))
              .catch(() => [])
          )
        );

        const totalAttendance = attendanceResults.reduce((sum, records) => sum + records.length, 0);
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
          .map(({ id, title, date }) => ({ id, title, date }));

        setUpcomingExams(examItems);
      } catch (error) {
        console.error("Failed to load dashboard", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [monthKey]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Welcome back, Admin</h1>
        <p className="text-muted-foreground mt-1">Heres what happening today.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        <StatCard icon={Users} label="Total Students" numeric={stats.totalStudents} value={stats.totalStudents.toLocaleString()} trend={0} trendLabel="current" delay={0} />
        <StatCard icon={UserCheck} label="Active Teachers" numeric={stats.totalTeachers} value={stats.totalTeachers.toLocaleString()} trend={0} trendLabel="current" delay={0.08} />
        <StatCard icon={Layers} label="Total Classes" numeric={stats.totalClasses} value={stats.totalClasses.toLocaleString()} trend={0} trendLabel="current" delay={0.16} />
        <StatCard icon={CalendarCheck} label="Today's Attendance" numeric={stats.attendancePercent} suffix="%" value={`${stats.attendancePercent}%`} trend={0} trendLabel="today" delay={0.24} />
        <StatCard icon={Wallet} label="Fees Collected" numeric={stats.feesCollected} prefix="৳" value={`৳${stats.feesCollected.toLocaleString()}`} trend={0} trendLabel="this month" delay={0.32} />
        <StatCard icon={AlertCircle} label="Pending Fees" numeric={stats.pendingFees} prefix="৳" value={`৳${stats.pendingFees.toLocaleString()}`} trend={0} trendLabel="outstanding" delay={0.4} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2"><AttendanceChart /></div>
        <FeeCollection
          collected={stats.feesCollected}
          outstanding={stats.pendingFees}
          overdueCount={stats.overdueCount}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2"><RevenueChart /></div>
        <UpcomingExams items={upcomingExams} isLoading={loading} />
      </div>

      <RecentAdmissions items={recentAdmissions} isLoading={loading} />
    </div>
  );
};

export default function AdminDashboard() {
  return <DashboardInner />;
}
