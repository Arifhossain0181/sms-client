"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { motion } from "framer-motion";
import { Briefcase, Building2, Calendar, Users, ExternalLink, Search } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

type JobPosting = {
  id: string;
  title: string;
  designation: string;
  department?: { name: string };
  vacancies: number;
  deadline: string;
  description?: string;
  requirements?: string;
  applicantCount?: number;
};

export default function CareersPage() {
  const [search, setSearch] = useState("");
  const { isAuthenticated } = useAuth();

  const { data: jobs = [], isLoading: loading } = useQuery<JobPosting[]>({
    queryKey: ["recruitment", "jobs", "public"],
    queryFn: async () => {
      const res = await api.get("/recruitment/jobs/public");
      const payload = res.data?.data ?? res.data;
      return payload?.postings ?? [];
    },
    retry: false,
  });

  const filtered = jobs.filter((j) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      j.title.toLowerCase().includes(q) ||
      j.designation.toLowerCase().includes(q) ||
      j.department?.name?.toLowerCase().includes(q)
    );
  });

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
            <div className="relative">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                Careers
                <motion.span
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="text-indigo-400"
                >
                  <Briefcase className="w-5 h-5" />
                </motion.span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Explore open positions and join our team
              </p>
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by title, designation, or department..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-white/5 pl-9 pr-4 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
              />
            </div>

            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-5 shadow-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 shrink-0" />
                        <div className="space-y-2 flex-1">
                          <div className="h-4 w-48 rounded-lg bg-slate-200 dark:bg-slate-700" />
                          <div className="h-3 w-72 rounded-lg bg-slate-200 dark:bg-slate-700" />
                        </div>
                      </div>
                      <div className="h-6 w-20 rounded-full bg-slate-200 dark:bg-slate-700" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
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
                <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">No open positions</h3>
                <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">Check back later for new opportunities</p>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {filtered.map((job, idx) => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-white/5 p-5 shadow-xl hover:shadow-2xl transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="font-semibold text-slate-900 dark:text-white">{job.title}</h3>
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 px-2.5 py-0.5 text-xs font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Open
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-3 w-3" /> {job.designation}
                          </span>
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" /> {job.department?.name ?? "—"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" /> {job.vacancies} vacancies
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> Deadline: {new Date(job.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        </div>
                        {job.description && (
                          <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 line-clamp-2">{job.description}</p>
                        )}
                      </div>
                      <Link
                        href={
                          isAuthenticated
                            ? `/apply-for-Teaching?jobId=${job.id}`
                            : `/login?redirect=${encodeURIComponent(`/apply-for-Teaching?jobId=${job.id}`)}`
                        }
                        className="shrink-0"
                      >
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 text-white px-4 py-2 text-xs font-semibold shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 transition-all"
                        >
                          Apply <ExternalLink className="h-3 w-3" />
                        </motion.button>
                      </Link>
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
