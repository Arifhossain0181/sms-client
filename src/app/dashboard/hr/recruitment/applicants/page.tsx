"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/axios";
import { useLenis } from "@/hooks/useLenis";
import type { Role } from "@/tyPes/auth.tyPes";
import {
  Plus,
  Search,
  UserCheck,
  XCircle,
  Mail,
  Phone,
  MessageSquare,
  Award,
  ChevronRight,
  Users,
  Briefcase,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

type Applicant = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: string;
  resumeUrl?: string;
  coverLetter?: string;
  jobPosting?: { id: string; title: string; designation: string };
  interviews: any[];
  offers: any[];
};

type JobPosting = {
  id: string;
  title: string;
  designation: string;
};

const STATUS_META: Record<string, { cls: string; label: string; dot: string }> = {
  APPLIED: { cls: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300", label: "Applied", dot: "bg-gray-500" },
  SHORTLISTED: { cls: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300", label: "Shortlisted", dot: "bg-sky-500" },
  REJECTED: { cls: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300", label: "Rejected", dot: "bg-red-500" },
  OFFERED: { cls: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300", label: "Offered", dot: "bg-violet-500" },
  ACCEPTED: { cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300", label: "Accepted", dot: "bg-emerald-500" },
  DECLINED: { cls: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300", label: "Declined", dot: "bg-orange-500" },
  INTERVIEWED: { cls: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300", label: "Interviewed", dot: "bg-indigo-500" },
};

export default function ApplicantsPage() {
  useLenis();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { role } = useAuth();
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<JobPosting | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    applied: 0,
    accepted: 0,
    rejected: 0,
  });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const jId = searchParams.get("jobId");
    setJobId(jId);
    if (jId) {
      api.get(`/recruitment/jobs/${jId}`)
        .then((res) => {
          const payload = res.data?.data ?? res.data;
          setJob(payload as JobPosting);
        })
        .catch(() => setJob(null));
    } else {
      setJob(null);
    }
  }, [searchParams]);

  useEffect(() => {
    if (role && role !== "HR" && role !== "SCHOOL_ADMIN" && role !== "SUPER_ADMIN") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const queryParts: string[] = [];
        if (filter) queryParts.push(`status=${encodeURIComponent(filter)}`);
        if (jobId) queryParts.push(`jobPostingId=${encodeURIComponent(jobId)}`);
        if (search) queryParts.push(`search=${encodeURIComponent(search)}`);
        const query = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
        const res = await api.get(`/recruitment/applicants${query}`);
        const payload = res.data?.data ?? res.data;
        const data = payload.applicants ?? [];
        setApplicants(data);

        const counts = data.reduce(
          (acc: any, a: Applicant) => {
            acc.total += 1;
            const key = a.status.toLowerCase();
            if (key in acc) acc[key] += 1;
            return acc;
          },
          { total: 0, applied: 0, accepted: 0, rejected: 0 }
        );
        setStats(counts);
      } catch {
        setApplicants([]);
        setStats({ total: 0, applied: 0, accepted: 0, rejected: 0 });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [filter, jobId, search]);

  const updateStatus = async (id: string, status: string) => {
    setActionLoading(id + status);
    try {
      await api.patch(`/recruitment/applicants/${id}/status`, { status });
      toast.success(`Status updated to ${status}`);
      const queryParts: string[] = [];
      if (filter) queryParts.push(`status=${encodeURIComponent(filter)}`);
      if (jobId) queryParts.push(`jobPostingId=${encodeURIComponent(jobId)}`);
      if (search) queryParts.push(`search=${encodeURIComponent(search)}`);
      const query = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
      const res = await api.get(`/recruitment/applicants${query}`);
      const payload = res.data?.data ?? res.data;
      setApplicants(payload.applicants ?? []);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to update status");
    } finally {
      setActionLoading(null);
    }
  };

  const statCards = [
    { label: "Total", value: stats.total, icon: Users, color: "from-sky-400 via-indigo-400 to-violet-500" },
    { label: "Applied", value: stats.applied, icon: Mail, color: "from-gray-400 to-gray-600" },
    { label: "Accepted", value: stats.accepted, icon: UserCheck, color: "from-emerald-400 to-emerald-600" },
    { label: "Rejected", value: stats.rejected, icon: XCircle, color: "from-red-400 to-red-600" },
  ];

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
                  Applicants
                  <motion.span
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="text-indigo-400"
                  >
                    <Users className="w-5 h-5" />
                  </motion.span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {job ? `Managing applicants for: ${job.title} · ${job.designation}` : "Track and manage job applicants"}
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push(`/dashboard/hr/recruitment/applicants/new${jobId ? `?jobId=${jobId}` : ""}`)}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 text-white px-4 py-2 text-sm font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all"
              >
                <Plus className="h-4 w-4" /> Add Applicant
              </motion.button>
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-6">
            {!loading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4"
              >
                {statCards.map((card, i) => {
                  const Icon = card.icon;
                  return (
                    <motion.div
                      key={card.label}
                      custom={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-white/5 p-4 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center text-white shadow-md shrink-0`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{card.label}</p>
                          <p className="text-lg font-bold text-slate-900 dark:text-white">{card.value}</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search applicants..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-white/5 pl-9 pr-4 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { key: "", label: "All" },
                  { key: "APPLIED", label: "Applied" },
                  { key: "ACCEPTED", label: "Accepted" },
                  { key: "REJECTED", label: "Rejected" },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      filter === f.key
                        ? "bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 text-white shadow-md"
                        : "bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-white/80"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-5 shadow-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-48 rounded-lg" />
                          <Skeleton className="h-3 w-72 rounded-lg" />
                        </div>
                      </div>
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : applicants.length === 0 ? (
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
                  <Users className="w-10 h-10 text-indigo-400" />
                </motion.div>
                <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">No applicants found</h3>
                <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
                  {search ? "Try adjusting your search" : job ? "No applicants for this job yet" : "Add your first applicant to get started"}
                </p>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {applicants.map((a, idx) => {
                  const meta = STATUS_META[a.status] ?? STATUS_META.APPLIED;
                  const isActionLoading = actionLoading === a.id + "ACCEPTED" || actionLoading === a.id + "REJECTED";

                  return (
                    <motion.div
                      key={a.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    className="group rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-white/5 p-5 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 via-indigo-400 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/30 shrink-0 text-sm font-semibold">
                            {a.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 flex-wrap">
                              <h3 className="font-semibold text-slate-900 dark:text-white truncate">{a.name}</h3>
                              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.cls}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                                {meta.label}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" /> {a.email}
                              </span>
                              {a.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" /> {a.phone}
                                </span>
                              )}
                              {a.jobPosting && (
                                <span className="flex items-center gap-1">
                                  <Briefcase className="h-3 w-3" /> {a.jobPosting.title}
                                </span>
                              )}
                            </div>
                            {a.interviews?.length > 0 && (
                              <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                <span className="font-medium">Interviews:</span> {a.interviews.length} scheduled
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          {a.status === "APPLIED" && (
                            <>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                disabled={isActionLoading}
                                onClick={() => updateStatus(a.id, "ACCEPTED")}
                                className="flex items-center gap-1 rounded-lg bg-emerald-500 text-white px-3 py-1.5 text-xs font-semibold shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-600 disabled:opacity-50"
                              >
                                <UserCheck className="h-3 w-3" /> Accept
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                disabled={isActionLoading}
                                onClick={() => updateStatus(a.id, "REJECTED")}
                                className="flex items-center gap-1 rounded-lg bg-red-500 text-white px-3 py-1.5 text-xs font-semibold shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-red-600 disabled:opacity-50"
                              >
                                <XCircle className="h-3 w-3" /> Reject
                              </motion.button>
                            </>
                          )}
                          {(a.status === "SHORTLISTED" || a.status === "INTERVIEWED") && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => router.push(`/dashboard/hr/recruitment/interviews/new?applicantId=${a.id}`)}
                              className="flex items-center gap-1 rounded-lg bg-emerald-500 text-white px-3 py-1.5 text-xs font-semibold shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-600"
                            >
                              <MessageSquare className="h-3 w-3" /> Interview
                            </motion.button>
                          )}
                          {(a.status === "SHORTLISTED" || a.status === "INTERVIEWED") && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => router.push(`/dashboard/hr/recruitment/applicants/${a.id}/offer`)}
                              className="flex items-center gap-1 rounded-lg bg-violet-500 text-white px-3 py-1.5 text-xs font-semibold shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-violet-600"
                            >
                              <Award className="h-3 w-3" /> Offer
                            </motion.button>
                          )}
                          {a.status === "OFFERED" && (
                            <>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                disabled={isActionLoading}
                                onClick={() => updateStatus(a.id, "ACCEPTED")}
                                className="flex items-center gap-1 rounded-lg bg-emerald-500 text-white px-3 py-1.5 text-xs font-semibold shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-600 disabled:opacity-50"
                              >
                                <UserCheck className="h-3 w-3" /> Accept
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                disabled={isActionLoading}
                                onClick={() => updateStatus(a.id, "REJECTED")}
                                className="flex items-center gap-1 rounded-lg bg-red-500 text-white px-3 py-1.5 text-xs font-semibold shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-red-600 disabled:opacity-50"
                              >
                                <XCircle className="h-3 w-3" /> Reject
                              </motion.button>
                            </>
                          )}
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => router.push(`/dashboard/hr/recruitment/applicants/${a.id}`)}
                            className="flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors hover:bg-white/80"
                          >
                            <Eye className="h-3 w-3" /> View
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
