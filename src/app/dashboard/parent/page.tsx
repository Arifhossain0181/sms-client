"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/axios";
import { useLenis } from "@/hooks/useLenis";
import type { Role } from "@/tyPes/auth.tyPes";
import { UsersRound, Wallet, CalendarCheck, Bell } from "lucide-react";

type ChildSummary = {
  id: string;
  name: string;
  class: string;
  section: string;
  attendancePercent: number;
  pendingFees: number;
  recentResultPercent: number;
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

export default function ParentDashboard() {
  useLenis();
  const router = useRouter();
  const { role } = useAuth();
  const [children, setChildren] = useState<ChildSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role && role !== "PARENT") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get("/parents/me/children");
        const payload = res.data?.data ?? res.data;
        setChildren(Array.isArray(payload) ? payload : []);
      } catch {
        setChildren([]);
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
          {roleLabels.PARENT} Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Monitor your children&apos;s progress, fees, and notices.
        </p>
      </div>

      {loading && (
        <p className="text-xs text-muted-foreground">Loading children...</p>
      )}

      {!loading && children.length === 0 && (
        <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft">
          <p className="text-sm text-muted-foreground">
            No children linked to this account yet.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {children.map((child) => (
          <div
            key={child.id}
            className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft"
          >
            <div className="flex items-center gap-3">
              <UsersRound className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{child.name}</p>
                <p className="text-xs text-muted-foreground">
                  {child.class} · {child.section}
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-border/50 bg-secondary/40 p-3">
                <p className="text-xs text-muted-foreground">Attendance</p>
                <p className="text-sm font-semibold">{child.attendancePercent}%</p>
              </div>
              <div className="rounded-lg border border-border/50 bg-secondary/40 p-3">
                <p className="text-xs text-muted-foreground">Pending Fees</p>
                <p className="text-sm font-semibold">
                  {child.pendingFees}
                </p>
              </div>
              <div className="rounded-lg border border-border/50 bg-secondary/40 p-3">
                <p className="text-xs text-muted-foreground">Last Result</p>
                <p className="text-sm font-semibold">
                  {child.recentResultPercent}%
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
