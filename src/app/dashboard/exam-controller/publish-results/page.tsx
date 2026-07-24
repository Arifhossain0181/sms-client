"use client";

import { useMemo, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLenis } from "@/hooks/useLenis";
import { useAuth } from "@/hooks/useAuth";
import { examService } from "@/app/modules/exam/exam.service";
import { useRouter } from "next/navigation";
import { FileText, CheckCircle2, XCircle, BookOpen, Calendar, Clock, GraduationCap, Search, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

type PublishableExam = {
  id: string;
  name: string;
  type: string;
  totalMarks: number;
  schedules: Array<{
    id: string;
    examDate: string;
    startTime: string;
    endTime: string;
    subject?: { id: string; name: string; fullMarks?: number };
    class?: { id: string; name: string };
  }>;
  status: "PUBLISHED" | "DRAFT" | "UNPUBLISHED";
  pendingCount: number;
  reportCardCount: number;
};

type FlatItem = {
  id: string;
  examId: string;
  examName: string;
  examType: string;
  className: string;
  classId: string;
  subjectName: string;
  examDate: string;
  startTime: string;
  endTime: string;
  status: string;
  pendingCount: number;
  reportCardCount: number;
};

export default function PublishResultsPage() {
  useLenis();
  const router = useRouter();
  const { role } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (role && role !== "EXAM_CONTROLLER" && role !== "SCHOOL_ADMIN" && role !== "SUPER_ADMIN") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [confirmUnpublishId, setConfirmUnpublishId] = useState<string | null>(null);

  const { data: publishableExams = [], isLoading } = useQuery({
    queryKey: ["exams", "publishing"],
    queryFn: async () => {
      const data = await examService.getPublishable();
      return Array.isArray(data) ? data : [];
    },
  });

  const flatItems: FlatItem[] = useMemo(() => {
    const items: FlatItem[] = [];
    for (const exam of publishableExams as PublishableExam[]) {
      const schedules = exam.schedules ?? [];
      if (schedules.length === 0) continue;
      const status = (exam as any).status ?? "DRAFT";
      for (const s of schedules) {
        items.push({
          id: s.id,
          examId: exam.id,
          examName: exam.name,
          examType: exam.type ?? "CLASS_TEST",
          className: s.class?.name ?? "—",
          classId: s.class?.id ?? "",
          subjectName: s.subject?.name ?? "—",
          examDate: s.examDate ? new Date(s.examDate).toISOString().split("T")[0] : "",
          startTime: s.startTime ?? "",
          endTime: s.endTime ?? "",
          status,
          pendingCount: (exam as any).pendingCount ?? 0,
          reportCardCount: (exam as any).reportCardCount ?? 0,
        });
      }
    }
    return items.sort((a, b) => {
      if (a.examDate !== b.examDate) return a.examDate > b.examDate ? 1 : -1;
      return a.startTime.localeCompare(b.startTime);
    });
  }, [publishableExams]);

  const filteredFlat = useMemo(() => {
    const q = search.trim().toLowerCase();
    return flatItems.filter((item) => {
      if (statusFilter !== "ALL" && item.status !== statusFilter) return false;
      if (!q) return true;
      return (
        item.examName.toLowerCase().includes(q) ||
        item.examType.toLowerCase().includes(q) ||
        item.className.toLowerCase().includes(q) ||
        item.subjectName.toLowerCase().includes(q) ||
        item.status.toLowerCase().includes(q)
      );
    });
  }, [flatItems, search, statusFilter]);

  const filteredGrouped = useMemo(() => {
    const groups = new Map<string, FlatItem[]>();
    for (const item of filteredFlat) {
      const key = item.classId || "unknown";
      const list = groups.get(key) ?? [];
      list.push(item);
      groups.set(key, list);
    }
    return groups;
  }, [filteredFlat]);

  const counts = useMemo(() => {
    return flatItems.reduce(
      (acc, item) => {
        acc[item.status] = (acc[item.status] ?? 0) + 1;
        acc.total += 1;
        return acc;
      },
      { total: 0 } as Record<string, number>
    );
  }, [flatItems]);

  const publishMutation = useMutation({
    mutationFn: (id: string) => examService.publish(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["exams"] });
      toast.success("Results published successfully.");
      setPublishingId(null);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ??
        (err instanceof Error ? err.message : "Failed to publish results");
      toast.error(msg);
      setPublishingId(null);
    },
  });

  const unpublishMutation = useMutation({
    mutationFn: (id: string) => examService.unpublish(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["exams"] });
      toast.success("Results unpublished.");
      setConfirmUnpublishId(null);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ??
        (err instanceof Error ? err.message : "Failed to unpublish results");
      toast.error(msg);
      setConfirmUnpublishId(null);
    },
  });

  const getStatusBadge = (status: string, pendingCount: number, reportCardCount: number) => {
    const s = status.toUpperCase();
    if (s === "PUBLISHED") {
      return (
        <span className="inline-flex rounded-md px-2.5 py-1.5 text-xs font-medium border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20">
          Published
        </span>
      );
    }
    if (s === "UNPUBLISHED") {
      return (
        <span className="inline-flex rounded-md px-2.5 py-1.5 text-xs font-medium border bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20">
          Unpublished
        </span>
      );
    }
    if (pendingCount > 0) {
      return (
        <span className="inline-flex rounded-md px-2.5 py-1.5 text-xs font-medium border bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20">
          Pending ({pendingCount})
        </span>
      );
    }
    if (reportCardCount === 0) {
      return (
        <span className="inline-flex rounded-md px-2.5 py-1.5 text-xs font-medium border bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/10 dark:text-slate-300 dark:border-slate-500/20">
          No Marks
        </span>
      );
    }
    return (
      <span className="inline-flex rounded-md px-2.5 py-1.5 text-xs font-medium border bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20">
        Ready
      </span>
    );
  };

  const formatDate = (date: string) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  const formatTimeRange = (start: string, end: string) => {
    if (start && end) return `${start} - ${end}`;
    if (start) return `${start} - —`;
    return "—";
  };

  const handlePublish = (id: string) => {
    setPublishingId(id);
    publishMutation.mutate(id);
  };

  const handleUnpublish = (id: string) => {
    setConfirmUnpublishId(id);
  };

  const confirmUnpublish = () => {
    if (!confirmUnpublishId) return;
    unpublishMutation.mutate(confirmUnpublishId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 p-4 sm:p-6">
        <Skeleton className="h-10 w-48 mb-6" />
        <Skeleton className="h-12 w-full mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

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

      <div className="relative w-full max-w-6xl my-8 space-y-6">
        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/10 shadow-2xl shadow-slate-200/40 dark:shadow-none overflow-hidden">
          <div className="relative px-6 sm:px-8 py-6 bg-gradient-to-r from-sky-50 via-indigo-50 to-violet-50 dark:from-sky-500/10 dark:via-indigo-500/10 dark:to-violet-500/10 border-b border-white/40 dark:border-white/5 overflow-hidden">
            <motion.div
              animate={{ x: [0, 100, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none"
            />
            <div className="relative flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  Publish Results
                  <motion.span
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="text-indigo-400"
                  >
                    <FileText className="w-5 h-5" />
                  </motion.span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Class-wise exam results ready to publish or unpublish
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-slate-600 dark:text-slate-300">
                  Total: <b>{counts.total}</b>
                </span>
                <span className="rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 px-2.5 py-1">
                  Published: <b>{counts.PUBLISHED ?? 0}</b>
                </span>
                <span className="rounded-full bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 px-2.5 py-1">
                  Ready: <b>{(counts.DRAFT ?? 0) + (counts.UNPUBLISHED ?? 0)}</b>
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-5">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by exam name, type, class, subject..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-white/5 pl-9 pr-4 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-white/5 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
              >
                <option value="ALL">All Statuses</option>
                <option value="PUBLISHED">Published</option>
                <option value="DRAFT">Draft / Ready</option>
                <option value="UNPUBLISHED">Unpublished</option>
              </select>
            </div>

            {filteredFlat.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FileText className="w-10 h-10 text-indigo-400 mb-4" />
                <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">No exams found</h3>
                <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
                  {flatItems.length === 0
                    ? "No exams with schedules found. Create exams and submit marks first."
                    : "No exams match your search."}
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {Array.from(filteredGrouped.entries()).map(([classId, items], gIdx) => {
                  const className = items[0]?.className ?? "Unknown Class";
                  return (
                    <motion.div
                      key={classId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: gIdx * 0.05 }}
                      className="space-y-3"
                    >
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-indigo-500" />
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wide">
                          {className}
                        </h3>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          ({items.length} schedule{items.length !== 1 ? "s" : ""})
                        </span>
                      </div>
                      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-700 text-left text-xs uppercase text-slate-500 dark:text-slate-400 bg-slate-50/60 dark:bg-slate-800/40">
                              <th className="pb-3 pt-3 font-medium pl-4 w-40">Date</th>
                              <th className="pb-3 pt-3 font-medium w-44">Time</th>
                              <th className="pb-3 pt-3 font-medium">Exam</th>
                              <th className="pb-3 pt-3 font-medium">Type</th>
                              <th className="pb-3 pt-3 font-medium">Subject</th>
                              <th className="pb-3 pt-3 font-medium">Status</th>
                              <th className="pb-3 pt-3 font-medium text-right pr-4">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {items.map((item, idx) => (
                              <motion.tr
                                key={item.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: gIdx * 0.05 + idx * 0.02 }}
                                className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                              >
                                <td className="py-3.5 pl-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                  {formatDate(item.examDate)}
                                </td>
                                <td className="py-3.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                  {formatTimeRange(item.startTime, item.endTime)}
                                </td>
                                <td className="py-3.5 font-medium text-slate-900 dark:text-white">
                                  {item.examName}
                                </td>
                                <td className="py-3.5 whitespace-nowrap">
                                  <span className={`inline-flex rounded-md px-2.5 py-1.5 text-xs font-medium border ${
                                    item.examType === "FINAL" || item.examType === "FINAL_EXAM"
                                      ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20"
                                      : item.examType === "MID_TERM"
                                        ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20"
                                      : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20"
                                  }`}>
                                    {item.examType.replace("_", " ")}
                                  </span>
                                </td>
                                <td className="py-3.5 text-slate-700 dark:text-slate-200">{item.subjectName}</td>
                                <td className="py-3.5">
                                  {getStatusBadge(item.status, item.pendingCount, item.reportCardCount)}
                                </td>
                                <td className="py-3.5 pr-4">
                                  <div className="flex items-center justify-end gap-2">
                                    {item.status === "PUBLISHED" ? (
                                      <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handleUnpublish(item.examId)}
                                        disabled={unpublishMutation.isPending && confirmUnpublishId === item.examId}
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-50 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300"
                                      >
                                        <XCircle className="h-3.5 w-3.5" /> Unpublish
                                      </motion.button>
                                    ) : item.pendingCount === 0 && item.reportCardCount > 0 ? (
                                      <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handlePublish(item.examId)}
                                        disabled={publishMutation.isPending && publishingId === item.examId}
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
                                      >
                                        <CheckCircle2 className="h-3.5 w-3.5" /> Publish
                                      </motion.button>
                                    ) : (
                                      <span className="text-xs text-slate-400">Not ready</span>
                                    )}
                                  </div>
                                </td>
                              </motion.tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            <AnimatePresence>
              {confirmUnpublishId && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
                >
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-white dark:bg-[#1E293B] rounded-2xl p-6 shadow-xl w-full max-w-md border border-slate-100 dark:border-slate-800"
                  >
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">Unpublish Results</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                      Students will no longer be able to view these results. Are you sure?
                    </p>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setConfirmUnpublishId(null)}
                        className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={confirmUnpublish}
                        disabled={unpublishMutation.isPending}
                        className="px-4 py-2 text-xs font-medium bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-50 transition-colors"
                      >
                        Yes, Unpublish
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
