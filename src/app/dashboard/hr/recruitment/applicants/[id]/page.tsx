"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/axios";
import { useLenis } from "@/hooks/useLenis";
import type { Role } from "@/tyPes/auth.tyPes";
import { ArrowLeft, Mail, Phone, Briefcase, MessageSquare, Award, Calendar, FileText } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

type Interview = {
  id: string;
  scheduledAt: string;
  location?: string;
  interviewers?: string[];
  status?: string;
};

type Offer = {
  id: string;
  position: string;
  salary: number;
  joiningDate: string;
  validUntil: string;
  status?: string;
  terms?: string;
};

type Applicant = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: string;
  resumeUrl?: string;
  coverLetter?: string;
  notes?: string;
  jobPosting?: { id: string; title: string; designation: string };
  interviews: Interview[];
  offers: Offer[];
};

const STATUS_META: Record<string, { cls: string; label: string; dot: string }> = {
  APPLIED: { cls: "bg-gray-100 text-gray-700", label: "Applied", dot: "bg-gray-500" },
  SHORTLISTED: { cls: "bg-sky-100 text-sky-700", label: "Shortlisted", dot: "bg-sky-500" },
  REJECTED: { cls: "bg-red-100 text-red-700", label: "Rejected", dot: "bg-red-500" },
  OFFERED: { cls: "bg-violet-100 text-violet-700", label: "Offered", dot: "bg-violet-500" },
  ACCEPTED: { cls: "bg-emerald-100 text-emerald-700", label: "Accepted", dot: "bg-emerald-500" },
  DECLINED: { cls: "bg-orange-100 text-orange-700", label: "Declined", dot: "bg-orange-500" },
};

export default function ApplicantDetailPage() {
  useLenis();
  const router = useRouter();
  const { role } = useAuth();
  const [applicant, setApplicant] = useState<Applicant | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const id = typeof window !== "undefined" ? window.location.pathname.split("/").pop() : null;

  useEffect(() => {
    if (role && role !== "HR" && role !== "SCHOOL_ADMIN" && role !== "SUPER_ADMIN") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const res = await api.get(`/recruitment/applicants/${id}`);
        const payload = res.data?.data ?? res.data;
        setApplicant(payload as Applicant);
      } catch {
        setApplicant(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const updateStatus = async (status: string) => {
    if (!id) return;
    setActionLoading(status);
    try {
      await api.patch(`/recruitment/applicants/${id}/status`, { status });
      toast.success(`Status updated to ${status}`);
      setApplicant((prev) => (prev ? { ...prev, status } : prev));
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to update status");
    } finally {
      setActionLoading(null);
    }
  };

  const meta = applicant ? STATUS_META[applicant.status] ?? STATUS_META.APPLIED : STATUS_META.APPLIED;

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

      <div className="relative w-full max-w-4xl my-8 space-y-6">
        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/10 shadow-2xl shadow-slate-200/40 dark:shadow-none overflow-hidden">
          <div className="relative px-6 sm:px-8 py-6 bg-gradient-to-r from-sky-50 via-indigo-50 to-violet-50 dark:from-sky-500/10 dark:via-indigo-500/10 dark:to-violet-500/10 border-b border-white/40 dark:border-white/5 overflow-hidden">
            <motion.div
              animate={{ x: [0, 100, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none"
            />
            <div className="relative flex flex-wrap items-center gap-4">
              <Link
                href={applicant?.jobPosting?.id ? `/dashboard/hr/recruitment/jobs/${applicant.jobPosting.id}` : "/dashboard/hr/recruitment/applicants"}
                className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </Link>
              <div className="flex-1">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  {applicant?.name ?? "Applicant Details"}
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.cls}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                    {meta.label}
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {applicant?.jobPosting ? `${applicant.jobPosting.title} · ${applicant.jobPosting.designation}` : "Applicant information"}
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-6">
            {loading ? (
              <div className="space-y-4">
                <Skeleton />
                <Skeleton />
                <Skeleton />
              </div>
            ) : !applicant ? (
              <div className="text-center py-16">
                <p className="text-sm text-slate-500">Applicant not found</p>
              </div>
            ) : (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                >
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-white/5 p-5 shadow-xl">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Email</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1"><Mail className="h-3 w-3" />{applicant.email}</p>
                  </div>
                  {applicant.phone && (
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-white/5 p-5 shadow-xl">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Phone</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1"><Phone className="h-3 w-3" />{applicant.phone}</p>
                    </div>
                  )}
                  {applicant.resumeUrl && (
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-white/5 p-5 shadow-xl">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Resume</p>
                      <a href={applicant.resumeUrl} target="_blank" rel="noreferrer" className="mt-1 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"><FileText className="h-3 w-3" /> View Resume</a>
                    </div>
                  )}
                </motion.div>

                {applicant.coverLetter && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-6 shadow-xl">
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Cover Letter</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{applicant.coverLetter}</p>
                  </motion.div>
                )}

                {applicant.notes && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-6 shadow-xl">
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Internal Notes</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{applicant.notes}</p>
                  </motion.div>
                )}

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-6 shadow-xl">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-400" /> Interviews ({applicant.interviews?.length ?? 0})
                  </h3>
                  {applicant.interviews?.length === 0 ? (
                    <p className="text-xs text-slate-500">No interviews scheduled.</p>
                  ) : (
                    <div className="space-y-3">
                      {applicant.interviews.map((interview) => {
                        const interviewers = interview.interviewers ?? [];
                        return (
                          <div key={interview.id} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-white/5 p-4">
                            <p className="text-sm font-medium text-slate-900 dark:text-white">
                              {new Date(interview.scheduledAt).toLocaleString()}
                            </p>
                            {interview.location && <p className="text-xs text-slate-500 mt-1">Location: {interview.location}</p>}
                            {interviewers.length > 0 && (
                              <p className="text-xs text-slate-500 mt-1">Interviewers: {interviewers.join(", ")}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-6 shadow-xl">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Award className="w-4 h-4 text-indigo-400" /> Offers ({applicant.offers?.length ?? 0})
                  </h3>
                  {applicant.offers?.length === 0 ? (
                    <p className="text-xs text-slate-500">No offers sent.</p>
                  ) : (
                    <div className="space-y-3">
                      {applicant.offers.map((offer) => (
                        <div key={offer.id} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-white/5 p-4">
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{offer.position}</p>
                          <p className="text-xs text-slate-500 mt-1">Salary: {offer.salary}</p>
                          <p className="text-xs text-slate-500">Joining: {new Date(offer.joiningDate).toLocaleDateString()}</p>
                          <p className="text-xs text-slate-500">Valid Until: {new Date(offer.validUntil).toLocaleDateString()}</p>
                          {offer.terms && <p className="text-xs text-slate-500 mt-1">Terms: {offer.terms}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center gap-3">
                  {applicant.status === "APPLIED" && (
                    <>
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} disabled={!!actionLoading} onClick={() => updateStatus("SHORTLISTED")} className="rounded-lg bg-sky-500 text-white px-4 py-2 text-sm font-semibold disabled:opacity-50">Shortlist</motion.button>
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} disabled={!!actionLoading} onClick={() => updateStatus("REJECTED")} className="rounded-lg bg-red-500 text-white px-4 py-2 text-sm font-semibold disabled:opacity-50">Reject</motion.button>
                    </>
                  )}
                  {applicant.status === "SHORTLISTED" && (
                    <>
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => router.push(`/dashboard/hr/recruitment/interviews/new?applicantId=${applicant.id}`)} className="rounded-lg bg-emerald-500 text-white px-4 py-2 text-sm font-semibold">Schedule Interview</motion.button>
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} disabled={!!actionLoading} onClick={() => updateStatus("REJECTED")} className="rounded-lg bg-red-500 text-white px-4 py-2 text-sm font-semibold disabled:opacity-50">Reject</motion.button>
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => router.push(`/dashboard/hr/recruitment/applicants/${applicant.id}/offer`)} className="rounded-lg bg-violet-500 text-white px-4 py-2 text-sm font-semibold">Send Offer</motion.button>
                    </>
                  )}
                  {applicant.status === "OFFERED" && (
                    <>
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} disabled={!!actionLoading} onClick={() => updateStatus("ACCEPTED")} className="rounded-lg bg-emerald-500 text-white px-4 py-2 text-sm font-semibold disabled:opacity-50">Accept</motion.button>
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} disabled={!!actionLoading} onClick={() => updateStatus("DECLINED")} className="rounded-lg bg-orange-500 text-white px-4 py-2 text-sm font-semibold disabled:opacity-50">Decline</motion.button>
                    </>
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
