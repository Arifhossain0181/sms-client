"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { useLenis } from "@/hooks/useLenis";
import type { Role } from "@/tyPes/auth.tyPes";
import { Plus, Search, Briefcase, MapPin, Calendar } from "lucide-react";

type JobPosting = {
  id: string;
  title: string;
  designation: string;
  vacancies: number;
  deadline: string;
  status: string;
  department?: { name: string };
  applicantCount?: number;
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

export default function JobsPage() {
  useLenis();
  const router = useRouter();
  const { role } = useAuth();
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (role && role !== "HR" && role !== "SCHOOL_ADMIN" && role !== "SUPER_ADMIN") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/recruitment/jobs${search ? `?search=${encodeURIComponent(search)}` : ""}`);
      const payload = res.data?.data ?? res.data;
      setJobs(payload.postings ?? []);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [search]);

  const getStatusBadge = (status: string) => {
    const map: Record<string, { cls: string; label: string }> = {
      OPEN: { cls: "bg-emerald-100 text-emerald-700", label: "Open" },
      CLOSED: { cls: "bg-red-100 text-red-700", label: "Closed" },
      FILLED: { cls: "bg-sky-100 text-sky-700", label: "Filled" },
    };
    const s = map[status] ?? { cls: "bg-gray-100 text-gray-700", label: status };
    return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.cls}`}>{s.label}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Job Postings</h1>
          <p className="text-muted-foreground mt-1">Manage recruitment openings</p>
        </div>
        <button
          onClick={() => router.push("/dashboard/hr/recruitment/jobs/new")}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> New Job
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search job postings..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-border/60 bg-background pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft">
        {loading ? (
          <p className="text-xs text-muted-foreground">Loading...</p>
        ) : jobs.length === 0 ? (
          <p className="text-xs text-muted-foreground">No job postings found.</p>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <div key={job.id} className="rounded-xl border border-border/60 bg-background p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{job.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {job.designation} · {job.department?.name ?? "—"} · {job.vacancies} vacancy/ies
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Deadline: {new Date(job.deadline).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" /> {job.applicantCount ?? 0} applicants</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(job.status)}
                    <button onClick={() => router.push(`/dashboard/hr/recruitment/jobs/${job.id}`)} className="text-xs text-primary hover:underline">View</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
