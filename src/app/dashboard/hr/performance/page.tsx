"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/axios";
import { useLenis } from "@/hooks/useLenis";
import type { Role } from "@/tyPes/auth.tyPes";
import { Star, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

type Review = {
  id: string;
  reviewDate: string;
  rating: string;
  strengths?: string;
  areasToImprove?: string;
  comments?: string;
  staff: { name: string; employeeId: string };
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

const ratingColors: Record<string, { bg: string; text: string; darkBg?: string; darkText?: string }> = {
  EXCELLENT: { bg: "bg-emerald-100", text: "text-emerald-700", darkBg: "dark:bg-emerald-500/10", darkText: "dark:text-emerald-400" },
  GOOD: { bg: "bg-sky-100", text: "text-sky-700", darkBg: "dark:bg-sky-500/10", darkText: "dark:text-sky-400" },
  SATISFACTORY: { bg: "bg-amber-100", text: "text-amber-700", darkBg: "dark:bg-amber-500/10", darkText: "dark:text-amber-400" },
  NEEDS_IMPROVEMENT: { bg: "bg-orange-100", text: "text-orange-700", darkBg: "dark:bg-orange-500/10", darkText: "dark:text-orange-400" },
  POOR: { bg: "bg-red-100", text: "text-red-700", darkBg: "dark:bg-red-500/10", darkText: "dark:text-red-400" },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: "easeOut" },
  }),
};

export default function PerformancePage() {
  useLenis();
  const router = useRouter();
  const { role } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role && role !== "HR" && role !== "SCHOOL_ADMIN") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get("/hr/performance");
        const payload = res.data?.data ?? res.data;
        setReviews(payload ?? []);
      } catch {
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

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

      <div className="relative w-full max-w-4xl my-8 space-y-6">
        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/10 shadow-2xl shadow-slate-200/40 dark:shadow-none overflow-hidden">
          <div className="relative px-6 sm:px-8 py-6 bg-gradient-to-r from-sky-50 via-indigo-50 to-violet-50 dark:from-sky-500/10 dark:via-indigo-500/10 dark:to-violet-500/10 border-b border-white/40 dark:border-white/5 overflow-hidden">
            <motion.div
              animate={{ x: [0, 100, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none"
            />
            <div className="relative">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                Performance Appraisals
                <motion.span
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="text-indigo-400"
                >
                  <Star className="w-5 h-5" />
                </motion.span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Schedule and record staff performance reviews
              </p>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32 rounded-md" />
                        <Skeleton className="h-3 w-20 rounded-md" />
                      </div>
                    </div>
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                ))}
              </div>
            ) : reviews.length === 0 ? (
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
                  <Star className="w-10 h-10 text-indigo-400" />
                </motion.div>
                <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">
                  No performance reviews found
                </h3>
                <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
                  Reviews will appear here once scheduled.
                </p>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {reviews.map((r, idx) => {
                  const colors = ratingColors[r.rating] ?? { bg: "bg-gray-100", text: "text-gray-700", darkBg: "dark:bg-gray-500/10", darkText: "dark:text-gray-400" };
                  return (
                    <motion.div
                      key={r.id}
                      custom={idx + 1}
                      initial="hidden"
                      animate="visible"
                      variants={cardVariants}
                      className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{r.staff.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{r.staff.employeeId}</p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${colors.bg} ${colors.text} ${colors.darkBg} ${colors.darkText}`}
                          >
                            {r.rating}
                          </span>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {new Date(r.reviewDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {r.strengths && (
                        <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                          <span className="font-medium">Strengths:</span> {r.strengths}
                        </p>
                      )}
                      {r.areasToImprove && (
                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                          <span className="font-medium">Areas to improve:</span> {r.areasToImprove}
                        </p>
                      )}
                      {r.comments && (
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 italic">{r.comments}</p>
                      )}
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
