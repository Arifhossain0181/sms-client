"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Award,
  ChevronDown,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
  Star,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";
import { useMyPerformanceReviews } from "@/app/modules/performance/usePerformance";
import { PerformanceReview, PerformanceRating } from "@/app/modules/performance/performance.types";
import { formatDate } from "@/lib/utils";

const RATING_ORDER: PerformanceRating[] = ["EXCELLENT", "GOOD", "SATISFACTORY", "NEEDS_IMPROVEMENT", "POOR"];

function getRatingMeta(rating: PerformanceRating) {
  const map: Record<PerformanceRating, { label: string; badge: string; dot: string; icon: string }> = {
    EXCELLENT: {
      label: "Excellent",
      badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-200/70 dark:border-emerald-500/20",
      dot: "bg-emerald-500",
      icon: "🌟",
    },
    GOOD: {
      label: "Good",
      badge: "bg-sky-500/10 text-sky-600 dark:text-sky-300 border-sky-200/70 dark:border-sky-500/20",
      dot: "bg-sky-500",
      icon: "👍",
    },
    SATISFACTORY: {
      label: "Satisfactory",
      badge: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border-indigo-200/70 dark:border-indigo-500/20",
      dot: "bg-indigo-500",
      icon: "✅",
    },
    NEEDS_IMPROVEMENT: {
      label: "Needs Improvement",
      badge: "bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-200/70 dark:border-amber-500/20",
      dot: "bg-amber-500",
      icon: "⚠️",
    },
    POOR: {
      label: "Poor",
      badge: "bg-rose-500/10 text-rose-600 dark:text-rose-300 border-rose-200/70 dark:border-rose-500/20",
      dot: "bg-rose-500",
      icon: "❌",
    },
  };
  return map[rating];
}

export default function Page() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { role } = useAuth();

  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");

  const reviewsQuery = useMyPerformanceReviews();

  useEffect(() => {
    if (role && role !== "TEACHER" && role !== "SUPER_ADMIN" && role !== "SCHOOL_ADMIN") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  const reviews = useMemo(() => {
    const list = Array.isArray(reviewsQuery.data) ? reviewsQuery.data : [];
    const q = search.trim().toLowerCase();
    const rf = ratingFilter;
    return list.filter((r) => {
      const matchesSearch =
        !q ||
        r.rating.toLowerCase().includes(q) ||
        (r.comments ?? "").toLowerCase().includes(q) ||
        (r.strengths ?? "").toLowerCase().includes(q) ||
        (r.areasToImprove ?? "").toLowerCase().includes(q);
      const matchesRating = !rf || r.rating === rf;
      return matchesSearch && matchesRating;
    });
  }, [reviewsQuery.data, search, ratingFilter]);

  const stats = useMemo(() => {
    const list = Array.isArray(reviewsQuery.data) ? reviewsQuery.data : [];
    const counts: Record<string, number> = {};
    for (const r of list) {
      counts[r.rating] = (counts[r.rating] || 0) + 1;
    }
    return {
      total: list.length,
      excellent: counts.EXCELLENT || 0,
      good: counts.GOOD || 0,
      satisfactory: counts.SATISFACTORY || 0,
      needsImprovement: counts.NEEDS_IMPROVEMENT || 0,
      poor: counts.POOR || 0,
    };
  }, [reviewsQuery.data]);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["my-performance-reviews"] });
    toast.success("Data refreshed");
  };

  const isLoading = reviewsQuery.isLoading;

  if (isLoading) {
    return (
      <div className="relative min-h-[80vh] flex items-center justify-center p-4 overflow-hidden bg-slate-50/50 dark:bg-slate-950 rounded-3xl">
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
        <div className="relative w-full">
          <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/10 shadow-2xl p-8 space-y-4">
            <div className="h-8 w-1/3 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
            <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-slate-200/60 dark:bg-slate-700/40 rounded-2xl animate-pulse" />
              ))}
            </div>
            <div className="space-y-3 mt-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-slate-200/50 dark:bg-slate-700/30 rounded-2xl animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[80vh] flex items-start sm:items-center p-4 sm:p-6 overflow-hidden bg-slate-50/50 dark:bg-slate-950 rounded-3xl">
      {/* Animated background orbs */}
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

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="relative w-full my-6"
      >
        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/10 shadow-2xl shadow-slate-200/40 dark:shadow-none overflow-hidden">
          {/* Gradient Header */}
          <div className="relative px-6 sm:px-8 py-6 bg-gradient-to-r from-sky-50 via-indigo-50 to-violet-50 dark:from-sky-500/10 dark:via-indigo-500/10 dark:to-violet-500/10 border-b border-white/40 dark:border-white/5 overflow-hidden">
            <motion.div
              animate={{ x: [0, 100, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none"
            />

            <div className="relative flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <motion.div
                  whileHover={{ scale: 1.08, rotate: 4 }}
                  className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400 via-indigo-400 to-violet-500 shadow-lg shadow-indigo-500/30 flex items-center justify-center cursor-pointer"
                >
                  <Award className="w-6 h-6 text-white" />
                  <motion.div
                    className="absolute inset-0 rounded-2xl border-2 border-white/40 dark:border-white/20"
                    animate={{ scale: [1, 1.12, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2.4, repeat: Infinity }}
                  />
                </motion.div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    Performance Appraisals
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    View your performance reviews and ratings.
                  </p>
                </div>
              </div>
              <button
                onClick={handleRefresh}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/40 dark:border-white/10 bg-white/65 dark:bg-white/5 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-white/90 dark:hover:bg-white/10 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-5">
            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="grid grid-cols-2 md:grid-cols-5 gap-4"
            >
              {[
                { label: "Total Reviews", value: stats.total, color: "from-sky-400 to-indigo-400" },
                { label: "Excellent", value: stats.excellent, color: "from-emerald-400 to-green-500" },
                { label: "Good", value: stats.good, color: "from-sky-400 to-blue-500" },
                { label: "Satisfactory", value: stats.satisfactory, color: "from-indigo-400 to-violet-500" },
                { label: "Needs Improvement", value: stats.needsImprovement + stats.poor, color: "from-amber-400 to-orange-500" },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i }}
                  className="rounded-2xl border border-white/40 dark:border-white/10 bg-white/65 dark:bg-white/5 backdrop-blur-sm p-4 shadow-sm"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1 bg-gradient-to-r bg-clip-text text-transparent">
                    {stat.value}
                  </p>
                </motion.div>
              ))}
            </motion.div>

            {/* Filters */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-3xl border border-white/40 dark:border-white/10 bg-white/65 dark:bg-white/5 backdrop-blur-sm p-4 sm:p-6 shadow-sm"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                    Rating
                  </label>
                  <div className="relative">
                    <select
                      value={ratingFilter}
                      onChange={(e) => setRatingFilter(e.target.value)}
                      className="w-full appearance-none rounded-2xl border border-white/40 dark:border-white/10 bg-white/80 dark:bg-slate-950/40 px-4 py-3 pr-10 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-400/30"
                    >
                      <option value="">All Ratings</option>
                      {RATING_ORDER.map((r) => (
                        <option key={r} value={r}>
                          {getRatingMeta(r).label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  </div>
                </div>

                <div className="space-y-1.5 sm:col-span-2 lg:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                    Search
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search by rating, comments, strengths..."
                      className="w-full rounded-2xl border border-white/40 dark:border-white/10 bg-white/80 dark:bg-slate-950/40 pl-10 pr-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-400/30"
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Reviews Table */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-3xl border border-white/40 dark:border-white/10 bg-white/65 dark:bg-white/5 backdrop-blur-sm shadow-sm overflow-hidden"
            >
              {reviews.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-sky-100 via-indigo-100 to-violet-100 dark:from-sky-500/20 dark:via-indigo-500/20 dark:to-violet-500/20 flex items-center justify-center mb-4 ring-1 ring-indigo-200/60 dark:ring-indigo-400/20"
                  >
                    <Award className="w-10 h-10 text-indigo-600 dark:text-indigo-300" />
                  </motion.div>
                  <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">
                    No performance reviews found
                  </h3>
                  <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
                    {reviewsQuery.isLoading ? "Loading..." : "Your performance reviews will appear here."}
                  </p>
                </div>
              ) : (
                <div className="w-full overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-white/40 dark:border-white/10 bg-white/65 dark:bg-white/5">
                        <th className="px-4 sm:px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Date
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Rating
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Strengths
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Areas to Improve
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Comments
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/40 dark:divide-white/10">
                      <AnimatePresence mode="popLayout">
                        {reviews.map((review, index) => {
                          const ratingMeta = getRatingMeta(review.rating);
                          return (
                            <motion.tr
                              key={review.id}
                              layout
                              initial={{ opacity: 0, y: 14 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, x: -30, scale: 0.98 }}
                              transition={{ delay: index * 0.02, type: "spring", stiffness: 120, damping: 18 }}
                              className={`group transition-colors duration-200 ${
                                review.rating === "EXCELLENT"
                                  ? "bg-emerald-50/30 dark:bg-emerald-500/5"
                                  : review.rating === "POOR"
                                    ? "bg-rose-50/30 dark:bg-rose-500/5"
                                    : "hover:bg-white/60 dark:hover:bg-white/5"
                              }`}
                            >
                              <td className="px-4 sm:px-6 py-4">
                                <span className="text-sm text-slate-700 dark:text-slate-300">
                                  {formatDate(review.reviewDate)}
                                </span>
                              </td>
                              <td className="px-4 sm:px-6 py-4">
                                <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold ${ratingMeta.badge}`}>
                                  <span className={`w-2 h-2 rounded-full ${ratingMeta.dot}`} />
                                  {ratingMeta.label}
                                </span>
                              </td>
                              <td className="px-4 sm:px-6 py-4">
                                <span className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                                  {review.strengths || "—"}
                                </span>
                              </td>
                              <td className="px-4 sm:px-6 py-4">
                                <span className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                                  {review.areasToImprove || "—"}
                                </span>
                              </td>
                              <td className="px-4 sm:px-6 py-4">
                                <span className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                                  {review.comments || "—"}
                                </span>
                              </td>
                            </motion.tr>
                          );
                        })}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              )}

              {/* Footer */}
              {reviews.length > 0 && (
                <div className="p-4 sm:p-5 border-t border-white/40 dark:border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Showing{" "}
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {reviews.length}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {stats.total}
                    </span>{" "}
                    reviews
                  </p>
                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    {RATING_ORDER.map((r) => {
                      const meta = getRatingMeta(r);
                      const count = stats[r.toLowerCase() as keyof typeof stats] || 0;
                      if (count === 0) return null;
                      return (
                        <span key={r} className="inline-flex items-center gap-1.5">
                          <span className={`w-2.5 h-2.5 rounded-full ${meta.dot}`} />
                          {meta.label}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 1 }}
          className="mt-6 text-center text-[10px] font-bold tracking-[0.3em] uppercase text-slate-400 dark:text-slate-600"
        >
          Performance Appraisals
        </motion.p>
      </motion.div>
    </div>
  );
}
