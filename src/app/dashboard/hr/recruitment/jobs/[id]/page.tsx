"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/axios";
import { useLenis } from "@/hooks/useLenis";
import type { Role } from "@/tyPes/auth.tyPes";
import { ArrowLeft, UserPlus, MessageSquare, Award, Briefcase, Calendar, Users, MapPin, FileText, ExternalLink } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

type Applicant = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: string;
  resumeUrl?: string;
  coverLetter?: string;
  interviews: any[];
  offers: any[];
};

type JobPosting = {
  id: string;
  title: string;
  designation: string;
  vacancies: number;
  deadline: string;
  status: string;
  department?: { name: string };
  applicants: Applicant[];
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
  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${s.cls}`}>{s.label}</span>;
};

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  useLenis();
  const router = useRouter();
  const { role } = useAuth();
  const resolvedParams = use(params);
  const [job, setJob] = useState<JobPosting | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role && role !== "HR" && role !== "SCHOOL_ADMIN" && role !== "SUPER_ADMIN" && role !== "TEACHER") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/recruitment/jobs/${resolvedParams.id}`);
        const payload = res.data?.data ?? res.data;
        setJob(payload);
      } catch {
        setJob(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [resolvedParams.id]);

  return (
    <div className="relative min-h-screen flex items-start justify-center p-4 sm:p-6 overflow-hidden bg-slate-50/50 dark:bg-slate-950">
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

      <div className="relative w-full max-w-5xl my-8 space-y-6">
        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/10 shadow-2xl shadow-slate-200/40 dark:shadow-none overflow-hidden">
          <div className="relative px-6 sm:px-8 py-6 bg-gradient-to-r from-sky-50 via-indigo-50 to-violet-50 dark:from-sky-500/10 dark:via-indigo-500/10 dark:to-violet-500/10 border-b border-white/40 dark:border-white/5 overflow-hidden">
            <motion.div
              animate={{ x: [0, 100, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none"
            />
            <div className="relative flex flex-wrap items-center gap-4">
              <Link
                href="/dashboard/hr/recruitment/jobs"
                className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </Link>
              <div className="flex-1 min-w-0">
                {loading ? (
                  <>
                    <Skeleton className="h-7 w-64 rounded-lg mb-2" />
                    <Skeleton className="h-4 w-48 rounded-lg" />
                  </>
                ) : (
                  <>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2 truncate">
                      {job?.title ?? "Job Details"}
                      {job && getStatusBadge(job.status)}
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 truncate">
                      {job?.designation} · {job?.vacancies} vacancies
                    </p>
                  </>
                )}
              </div>
              {!loading && job && (
                <>
                  {(role === "HR" || role === "SCHOOL_ADMIN" || role === "SUPER_ADMIN") && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => router.push(`/dashboard/hr/recruitment/applicants/new?jobId=${job.id}`)}
                      className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 text-white px-4 py-2 text-sm font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all"
                    >
                      <UserPlus className="h-4 w-4" /> Add Applicant
                    </motion.button>
                  )}
                  {role === "TEACHER" && job.status === "OPEN" && (
                    <Link href={`/apply-for-Teaching?jobId=${job.id}`}>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 text-white px-4 py-2 text-sm font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all"
                      >
                        <ExternalLink className="h-4 w-4" /> Apply Now
                      </motion.button>
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-6">
            {loading ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-5 shadow-xl">
                      <Skeleton className="w-10 h-10 rounded-xl mb-3" />
                      <Skeleton className="h-3 w-24 rounded-md mb-2" />
                      <Skeleton className="h-5 w-16 rounded-md" />
                    </div>
                  ))}
                </div>
                <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-6 shadow-xl">
                  <Skeleton className="h-5 w-40 rounded-lg mb-4" />
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-40 rounded-md" />
                          <Skeleton className="h-3 w-56 rounded-md" />
                        </div>
                        <Skeleton className="h-6 w-20 rounded-full" />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : !job ? (
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
                <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">Job posting not found</h3>
                <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">The job you are looking for does not exist.</p>
                <Link href="/dashboard/hr/recruitment/jobs">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="mt-4 rounded-lg border border-white/40 dark:border-white/10 bg-white/60 dark:bg-white/5 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-white/80 dark:hover:bg-white/10"
                  >
                    Back to Jobs
                  </motion.button>
                </Link>
              </motion.div>
            ) : (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                >
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-white/5 p-5 shadow-xl flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 via-indigo-400 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/30 shrink-0">
                      <Briefcase className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Designation</p>
                      <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-white truncate">{job.designation}</p>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-white/5 p-5 shadow-xl flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 via-sky-400 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/30 shrink-0">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Vacancies</p>
                      <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-white">{job.vacancies}</p>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-white/5 p-5 shadow-xl flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 via-indigo-400 to-sky-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/30 shrink-0">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Deadline</p>
                      <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-white">
                        {new Date(job.deadline).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                      </p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-6 shadow-xl"
                >
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-400" /> Applicants ({job.applicants?.length ?? 0})
                  </h3>
                  {job.applicants?.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <motion.div
                        animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        className="w-16 h-16 rounded-full bg-gradient-to-br from-sky-100 via-indigo-100 to-violet-100 dark:from-sky-500/10 dark:via-indigo-500/10 dark:to-violet-500/10 flex items-center justify-center mb-3 ring-1 ring-indigo-200/60 dark:ring-indigo-400/20"
                      >
                        <Users className="w-8 h-8 text-indigo-400" />
                      </motion.div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">No applicants yet.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-700 text-left text-xs uppercase text-slate-500 dark:text-slate-400">
                            <th className="pb-2 font-medium">Name</th>
                            <th className="pb-2 font-medium">Email</th>
                            <th className="pb-2 font-medium">Phone</th>
                            <th className="pb-2 font-medium">Status</th>
                            <th className="pb-2 font-medium text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                          {job.applicants.map((a, idx) => (
                            <motion.tr
                              key={a.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors"
                            >
                              <td className="py-3 font-medium text-slate-900 dark:text-white">{a.name}</td>
                              <td className="py-3 text-slate-500 dark:text-slate-400">{a.email}</td>
                              <td className="py-3 text-slate-500 dark:text-slate-400">{a.phone ?? "—"}</td>
                              <td className="py-3">{getStatusBadge(a.status)}</td>
                              <td className="py-3">
                                <div className="flex items-center justify-end gap-3">
                                  {a.status === "SHORTLISTED" && (
                                    <motion.button
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      onClick={() => router.push(`/dashboard/hr/recruitment/interviews/new?applicantId=${a.id}`)}
                                      className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                                    >
                                      <MessageSquare className="h-3 w-3" /> Schedule Interview
                                    </motion.button>
                                  )}
                                  {a.interviews?.length > 0 && (
                                    <motion.button
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      onClick={() => router.push(`/dashboard/hr/recruitment/applicants/${a.id}`)}
                                      className="flex items-center gap-1 text-xs text-sky-600 dark:text-sky-400 hover:underline font-medium"
                                    >
                                      <MessageSquare className="h-3 w-3" /> Interview
                                    </motion.button>
                                  )}
                                  {a.status === "SHORTLISTED" && a.interviews?.length === 0 && (
                                    <motion.button
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      onClick={() => router.push(`/dashboard/hr/recruitment/applicants/${a.id}/offer`)}
                                      className="flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400 hover:underline font-medium"
                                    >
                                      <Award className="h-3 w-3" /> Send Offer
                                    </motion.button>
                                  )}
                                </div>
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </motion.div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
