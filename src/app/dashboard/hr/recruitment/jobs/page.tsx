"use client";

import { useEffect, useState } from "react";
import type { MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/axios";
import { useLenis } from "@/hooks/useLenis";
import type { Role } from "@/tyPes/auth.tyPes";
import { Plus, Search, Briefcase, Calendar, ChevronRight, ExternalLink } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

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

const getStatusBadge = (status: string) => {
  const map: Record<string, { cls: string; label: string }> = {
    OPEN: { cls: "bg-emerald-100 text-emerald-700", label: "Open" },
    CLOSED: { cls: "bg-red-100 text-red-700", label: "Closed" },
    FILLED: { cls: "bg-sky-100 text-sky-700", label: "Filled" },
    APPLIED: { cls: "bg-gray-100 text-gray-700", label: "Applied" },
    SHORTLISTED: { cls: "bg-sky-100 text-sky-700", label: "Shortlisted" },
    REJECTED: { cls: "bg-red-100 text-red-700", label: "Rejected" },
    OFFERED: { cls: "bg-violet-100 text-violet-700", label: "Offered" },
    ACCEPTED: { cls: "bg-emerald-100 text-emerald-700", label: "Accepted" },
    DECLINED: { cls: "bg-red-100 text-red-700", label: "Declined" },
  };
  const s = map[status] ?? { cls: "bg-gray-100 text-gray-700", label: status };
  return <span className={`rounded-full px-3 py-1 text-xs font-medium ${s.cls}`}>{s.label}</span>;
};

export default function JobsPage() {
  useLenis();
  const router = useRouter();
  const { role } = useAuth();
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (role && role !== "HR" && role !== "SCHOOL_ADMIN" && role !== "SUPER_ADMIN" && role !== "TEACHER") {
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

  const totalApplicants = jobs.reduce((sum, j) => sum + (j.applicantCount ?? 0), 0);
  const openJobs = jobs.filter((j) => j.status === "OPEN").length;

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
            <div className="relative flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  Job Postings
                  <motion.span
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="text-indigo-400"
                  >
                    <Briefcase className="w-5 h-5" />
                  </motion.span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">Manage recruitment openings</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push("/dashboard/hr/recruitment/jobs/new")}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 text-white px-4 py-2 text-sm font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all"
              >
                <Plus className="h-4 w-4" /> New Job
              </motion.button>
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-5">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search job postings..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-white/5 pl-9 pr-4 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
                />
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                <span>Total: <b className="text-slate-700 dark:text-slate-300">{jobs.length}</b></span>
                <span>Open: <b className="text-emerald-600 dark:text-emerald-400">{openJobs}</b></span>
                <span>Applicants: <b className="text-slate-700 dark:text-slate-300">{totalApplicants}</b></span>
              </div>
            </div>

            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-5 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
                    <div className="flex items-center justify-between">
                      <div className="space-y-3 flex-1">
                        <Skeleton className="h-5 w-48 rounded-lg" />
                        <Skeleton className="h-3 w-72 rounded-lg" />
                        <div className="flex items-center gap-4">
                          <Skeleton className="h-3 w-32 rounded-lg" />
                          <Skeleton className="h-3 w-28 rounded-lg" />
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-6 w-16 rounded-full" />
                        <Skeleton className="h-3 w-10 rounded-lg" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-16 text-center"
              >
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="w-20 h-20 rounded-full bg-gradient-to-br from-sky-100 via-indigo-100 to-violet-100 dark:from-sky-500/10 dark:via-indigo-500/10 dark:to-violet-500/10 flex items-center justify-center mb-4 ring-1 ring-indigo-200/60 dark:ring-indigo-400/20"
                >
                  <Briefcase className="w-10 h-10 text-indigo-400" />
                </motion.div>
                <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">No job postings found</h3>
                <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">Create your first job posting to get started.</p>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {jobs.map((job, idx) => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-white/5 p-5 shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-2xl"
                    onClick={() => router.push(`/dashboard/hr/recruitment/jobs/${job.id}`)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 via-indigo-400 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/30 shrink-0">
                            <Briefcase className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900 dark:text-white truncate">{job.title}</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              {job.designation} · {job.department?.name ?? "—"} · {job.vacancies} vacancies
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-3 text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> Deadline: {new Date(job.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-3 w-3" /> {job.applicantCount ?? 0} applicants
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        {getStatusBadge(job.status)}
                        {role === "TEACHER" && job.status === "OPEN" && (
                          <Link
                            href={`/apply-for-Teaching?jobId=${job.id}`}
                            onClick={(e: MouseEvent) => e.stopPropagation()}
                            className="flex items-center gap-1 text-xs font-semibold text-white bg-indigo-500 hover:bg-indigo-600 rounded-full px-3 py-1 transition-all duration-300 hover:-translate-y-0.5"
                          >
                            Apply <ExternalLink className="h-3 w-3" />
                          </Link>
                        )}
                        {(role === "HR" || role === "SCHOOL_ADMIN" || role === "SUPER_ADMIN") && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/dashboard/hr/recruitment/jobs/${job.id}`);
                            }}
                            className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium transition-colors"
                          >
                            View <ChevronRight className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
