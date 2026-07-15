"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/axios";
import { useLenis } from "@/hooks/useLenis";
import type { Role } from "@/tyPes/auth.tyPes";
import { BarChart3, Shield, School, Users } from "lucide-react";

type SchoolStat = {
  id: number;
  name: string;
  students: number;
  teachers: number;
  status: string;
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

export default function SuperAdminDashboard() {
  useLenis();
  const router = useRouter();
  const { role } = useAuth();
  const [schools, setSchools] = useState<SchoolStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role && role !== "SUPER_ADMIN") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get("/super-admin/schools");
        const payload = res.data?.data ?? res.data;
        setSchools(Array.isArray(payload) ? payload : []);
      } catch {
        setSchools([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const totalStudents = useMemo(
    () => schools.reduce((sum, s) => sum + (s.students ?? 0), 0),
    [schools]
  );
  const totalTeachers = useMemo(
    () => schools.reduce((sum, s) => sum + (s.teachers ?? 0), 0),
    [schools]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
          {roleLabels.SUPER_ADMIN} Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Platform-wide control, analytics, and school management.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Total Schools
          </p>
          <p className="mt-2 text-2xl font-semibold">{schools.length}</p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Total Students
          </p>
          <p className="mt-2 text-2xl font-semibold">{totalStudents}</p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Total Teachers
          </p>
          <p className="mt-2 text-2xl font-semibold">{totalTeachers}</p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Platform Status
          </p>
          <p className="mt-2 text-sm text-emerald-600 font-medium">Operational</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft">
        <h3 className="text-lg font-semibold">Schools Overview</h3>
        <div className="mt-4">
          {loading && (
            <p className="text-xs text-muted-foreground">Loading schools...</p>
          )}
          {!loading && schools.length === 0 && (
            <p className="text-xs text-muted-foreground">No schools onboarded yet.</p>
          )}
          <div className="divide-y divide-border/60">
            {schools.map((school) => (
              <div
                key={school.id}
                className="flex items-center justify-between py-3"
              >
                <div className="flex items-center gap-3">
                  <School className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{school.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {school.students} students · {school.teachers} teachers
                    </p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {school.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
