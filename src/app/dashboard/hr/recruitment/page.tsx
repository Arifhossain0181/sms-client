"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { useLenis } from "@/hooks/useLenis";
import type { Role } from "@/tyPes/auth.tyPes";
import { Briefcase, Users, ClipboardList, Award } from "lucide-react";

type RecruitmentStats = {
  totalPostings: number;
  openPostings: number;
  totalApplicants: number;
  shortlisted: number;
  offersSent: number;
  offersAccepted: number;
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

export default function RecruitmentDashboard() {
  useLenis();
  const router = useRouter();
  const { role } = useAuth();
  const [stats, setStats] = useState<RecruitmentStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role && role !== "HR" && role !== "SCHOOL_ADMIN" && role !== "SUPER_ADMIN") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get("/recruitment/dashboard");
        const payload = res.data?.data ?? res.data;
        setStats(payload);
      } catch {
        setStats(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Recruitment</h1>
        <p className="text-muted-foreground mt-1">
          Job postings, applicant tracking, interviews, and offers
        </p>
      </div>

      {loading ? (
        <p className="text-xs text-muted-foreground">Loading...</p>
      ) : stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          <StatCard label="Open Jobs" value={String(stats.openPostings)} sub={`${stats.totalPostings} total postings`} icon={<Briefcase className="h-4 w-4 text-sky-500" />} />
          <StatCard label="Total Applicants" value={String(stats.totalApplicants)} sub={`${stats.shortlisted} shortlisted`} icon={<Users className="h-4 w-4 text-emerald-500" />} />
          <StatCard label="Offers" value={String(stats.offersSent)} sub={`${stats.offersAccepted} accepted`} icon={<Award className="h-4 w-4 text-violet-500" />} />
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">No recruitment data available.</p>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, icon }: { label: string; value: string; sub?: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        {icon}
      </div>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
