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
} from "lucide-react";

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

        // Load dashboard stats
        const statsRes = await api.get("/hr/dashboard");
        const statsData = statsRes.data?.data ?? statsRes.data;
        setStats(statsData);

        // Load staff directory for the list
        const staffRes = await api.get("/hr/staff/directory");
        const staffData = staffRes.data?.data ?? staffRes.data;
        setStaffList(Array.isArray(staffData) ? staffData : []);
      } catch {
        setStaffList([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
          {roleLabels.HR ?? "HR"} Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Staff management, attendance, leave, payroll, and performance appraisals.
        </p>
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard
          label="Total Staff"
          value={stats ? stats.totalStaff.toString() : "—"}
          icon={<Users className="h-4 w-4 text-sky-500" />}
        />
        <StatCard
          label="Active Staff"
          value={stats ? stats.activeStaff.toString() : "—"}
          sub={`${stats?.inactiveStaff ?? 0} inactive`}
          icon={<UserCog className="h-4 w-4 text-emerald-500" />}
        />
        <StatCard
          label="Avg Attendance"
          value={stats ? `${stats.avgAttendance}%` : "—"}
          sub={
            stats
              ? `${months[stats.currentMonth - 1]} ${stats.currentYear}`
              : undefined
          }
          icon={<TrendingUp className="h-4 w-4 text-teal-500" />}
        />
        <StatCard
          label="Pending Actions"
          value={
            stats
              ? String(
                  (stats.pendingLeaves ?? 0) +
                    (stats.pendingPayrolls ?? 0) +
                    (stats.pendingCriticalActions ?? 0)
                )
              : "—"
          }
          sub={`${stats?.pendingLeaves ?? 0} leaves · ${stats?.pendingPayrolls ?? 0} payrolls`}
          icon={<Clock className="h-4 w-4 text-amber-500" />}
        />
      </div>

      {/* Secondary stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          label="Pending Leave Requests"
          value={stats ? String(stats.pendingLeaves) : "—"}
          icon={<FileText className="h-4 w-4 text-amber-500" />}
        />
        <StatCard
          label="Pending Payroll Disbursements"
          value={stats ? String(stats.pendingPayrolls) : "—"}
          icon={<Wallet className="h-4 w-4 text-violet-500" />}
        />
        <StatCard
          label="Pending Critical Actions"
          value={stats ? String(stats.pendingCriticalActions) : "—"}
          sub="Awaiting School Admin approval"
          icon={<CalendarCheck className="h-4 w-4 text-rose-500" />}
        />
      </div>

      {/* Staff directory */}
      <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft">
        <h3 className="text-lg font-semibold">Staff Directory</h3>
        <div className="mt-4">
          {loading && (
            <p className="text-xs text-muted-foreground">Loading staff...</p>
          )}
          {!loading && staffList.length === 0 && (
            <p className="text-xs text-muted-foreground">No staff records found.</p>
          )}
          <div className="divide-y divide-border/60">
            {staffList.slice(0, 20).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-3"
              >
                <div>
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.employeeId ?? ""} · {item.designation ?? "—"} ·{" "}
                    {item.department?.name ?? item.staffType ?? "—"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">{item.email}</p>
                  {item.phone && (
                    <p className="text-xs text-muted-foreground">{item.phone}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          {staffList.length > 20 && (
            <p className="mt-3 text-xs text-muted-foreground">
              Showing 20 of {staffList.length} staff members.{" "}
              <a href="/dashboard/hr/profiles" className="underline">
                View all
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        {icon}
      </div>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      {sub && (
        <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
      )}
    </div>
  );
}
