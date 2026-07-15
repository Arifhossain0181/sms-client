"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/axios";
import { useLenis } from "@/hooks/useLenis";
import type { Role } from "@/tyPes/auth.tyPes";
import { UserCog, CalendarCheck, Wallet, FileText } from "lucide-react";

type StaffSummary = {
  id: string;
  name: string;
  designation: string;
  department: string;
  attendancePercent: number;
  leaveBalance: number;
  lastPayrollMonth?: string;
};

const roleLabels: Record<Role, string> = {
  SUPER_ADMIN:     "Super Admin",
  SCHOOL_ADMIN:    "School Admin",
  ACCOUNTANT:      "Accountant",
  TEACHER:         "Teacher",
  STUDENT:         "Student",
  PARENT:          "Parent",
  EXAM_CONTROLLER: "Exam Controller",
  HR:              "HR",
};

export default function HrDashboard() {
  useLenis();
  const router = useRouter();
  const { role } = useAuth();
  const [staff, setStaff] = useState<StaffSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role && role !== "HR") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get("/hr/staff");
        const payload = res.data?.data ?? res.data;
        setStaff(Array.isArray(payload) ? payload : []);
      } catch {
        setStaff([]);
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
          {roleLabels.HR} Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Staff records, attendance/leave, payroll, and performance appraisals.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Total Staff
            </p>
            <UserCog className="h-4 w-4 text-sky-500" />
          </div>
          <p className="mt-2 text-2xl font-semibold">{staff.length}</p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Avg Attendance
            </p>
            <CalendarCheck className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-semibold">
            {staff.length
              ? Math.round(
                  staff.reduce((s, st) => s + (st.attendancePercent ?? 0), 0) /
                    staff.length
                )
              : 0}
            %
          </p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Pending Leaves
            </p>
            <FileText className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-2 text-2xl font-semibold">
            {staff.filter((s) => s.leaveBalance < 3).length}
          </p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Payroll Month
            </p>
            <Wallet className="h-4 w-4 text-violet-500" />
          </div>
          <p className="mt-2 text-sm font-medium">
            {staff[0]?.lastPayrollMonth ?? "Not generated"}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft">
        <h3 className="text-lg font-semibold">Staff Directory</h3>
        <div className="mt-4">
          {loading && (
            <p className="text-xs text-muted-foreground">Loading staff...</p>
          )}
          {!loading && staff.length === 0 && (
            <p className="text-xs text-muted-foreground">No staff records found.</p>
          )}
          <div className="divide-y divide-border/60">
            {staff.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-3"
              >
                <div>
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.designation} · {item.department}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">
                    {item.attendancePercent}% attendance
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.leaveBalance} leave days
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
