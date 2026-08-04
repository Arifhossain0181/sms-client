"use client";

import { useMemo, useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLenis } from "@/hooks/useLenis";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { examService } from "@/app/modules/exam/exam.service";
import { classService } from "@/app/modules/class/class.service";
import { Exam } from "@/app/modules/exam/exam.types";
import {
  ClipboardList,
  Calendar,
  BookOpen,
  GraduationCap,
  Clock,
  Search,
  ChevronRight,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

type FlatSchedule = {
  id: string;
  examId: string;
  examName: string;
  examType: string;
  subjectName: string;
  fullMarks?: number;
  className: string;
  classId: string;
  examDate: string;
  startTime: string;
  endTime: string;
};

export default function ExamSchedulesPage() {
  useLenis();
  const router = useRouter();
  const { role } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [filterExamId, setFilterExamId] = useState<string>("");
  const [filterClassId, setFilterClassId] = useState<string>("");
  const [expandedScheduleId, setExpandedScheduleId] = useState<string | null>(null);

  useEffect(() => {
    if (role && role !== "EXAM_CONTROLLER" && role !== "SCHOOL_ADMIN" && role !== "TEACHER") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  const { data: exams = [], isLoading: examsLoading } = useQuery({
    queryKey: ["exams"],
    queryFn: async () => {
      const data = await examService.getAll();
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: classes = [], isLoading: classesLoading } = useQuery({
    queryKey: ["classes"],
    queryFn: classService.getAll,
  });

  const flatSchedules: FlatSchedule[] = useMemo(() => {
    const items: FlatSchedule[] = [];
    for (const exam of exams) {
      const schedules = exam.schedules ?? [];
      for (const s of schedules) {
        items.push({
          id: s.id,
          examId: exam.id,
          examName: exam.name,
          examType: exam.type ?? "CLASS_TEST",
          subjectName: s.subject?.name ?? "—",
          fullMarks: s.subject?.fullMarks,
          className: s.class?.name ?? "—",
          classId: s.class?.id ?? "",
          examDate: s.examDate
            ? new Date(s.examDate).toISOString().split("T")[0]
            : "",
          startTime: s.startTime ?? "",
          endTime: s.endTime ?? "",
        });
      }
    }
    return items.sort((a, b) => {
      if (a.examDate !== b.examDate) return a.examDate > b.examDate ? 1 : -1;
      return a.startTime.localeCompare(b.startTime);
    });
  }, [exams]);

  const classList = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of flatSchedules) {
      if (!map.has(s.classId)) map.set(s.classId, s.className);
    }
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [flatSchedules]);

  const examsList = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    for (const e of exams) {
      if (!map.has(e.id)) map.set(e.id, { id: e.id, name: e.name });
    }
    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [exams]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return flatSchedules.filter((s) => {
      if (filterExamId && s.examId !== filterExamId) return false;
      if (filterClassId && s.classId !== filterClassId) return false;
      if (!q) return true;
      return (
        s.examName.toLowerCase().includes(q) ||
        s.subjectName.toLowerCase().includes(q) ||
        s.className.toLowerCase().includes(q) ||
        s.examType.toLowerCase().includes(q)
      );
    });
  }, [flatSchedules, search, filterExamId, filterClassId]);

  const grouped = useMemo(() => {
    const groups = new Map<string, FlatSchedule[]>();
    for (const s of filtered) {
      const key = s.classId || "unknown";
      const list = groups.get(key) ?? [];
      list.push(s);
      groups.set(key, list);
    }
    return groups;
  }, [filtered]);

  const counts = useMemo(() => {
    return flatSchedules.reduce(
      (acc, s) => {
        acc.total += 1;
        acc[s.examType] = (acc[s.examType] ?? 0) + 1;
        return acc;
      },
      { total: 0 } as Record<string, number>,
    );
  }, [flatSchedules]);

  const toggleExpand = (id: string) => {
    setExpandedScheduleId((prev) => (prev === id ? null : id));
  };

  const isLoading = examsLoading || classesLoading;

  if (isLoading) {
    return (
      <div className="relative min-h-screen flex items-start justify-center p-4 sm:p-6 overflow-hidden bg-slate-50/50 dark:bg-slate-950">
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

      <div className="relative w-full my-8 space-y-6">
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
                  Exam Schedules
                  <motion.span
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="text-indigo-400"
                  >
                    <Calendar className="w-5 h-5" />
                  </motion.span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  View all exam schedules across classes and subjects
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-slate-600 dark:text-slate-300">
                  Total: <b>{counts.total}</b>
                </span>
                <span className="rounded-full bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300 px-2.5 py-1">
                  Final: <b>{counts.FINAL ?? 0}</b>
                </span>
                <span className="rounded-full bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 px-2.5 py-1">
                  Mid: <b>{counts.MID_TERM ?? 0}</b>
                </span>
                <span className="rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 px-2.5 py-1">
                  Class: <b>{(counts.CLASS_TEST ?? 0) + (counts.UNIT_TEST ?? 0)}</b>
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
                  placeholder="Search by exam, subject, class, or type..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-white/5 pl-9 pr-4 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
                />
              </div>
              <select
                value={filterClassId}
                onChange={(e) => setFilterClassId(e.target.value)}
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-white/5 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
              >
                <option value="">All Classes</option>
                {classList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <select
                value={filterExamId}
                onChange={(e) => setFilterExamId(e.target.value)}
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-white/5 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
              >
                <option value="">All Exams</option>
                {examsList.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
              {(filterExamId || filterClassId || search) && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setSearch("");
                    setFilterExamId("");
                    setFilterClassId("");
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/40 dark:border-white/10 bg-white/60 dark:bg-white/5 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-white/10"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Reset
                </motion.button>
              )}
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Showing:{" "}
                <b className="text-slate-700 dark:text-slate-300">
                  {filtered.length}
                </b>
              </div>
            </div>

            {filtered.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-16 text-center"
              >
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="w-20 h-20 rounded-full bg-gradient-to-br from-sky-100 via-indigo-100 to-violet-100 dark:from-sky-500/10 dark:via-indigo-500/10 dark:to-violet-500/10 flex items-center justify-center mb-4 ring-1 ring-indigo-200/60 dark:ring-indigo-400/20"
                >
                  <Calendar className="w-10 h-10 text-indigo-400" />
                </motion.div>
                <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">
                  No schedules found
                </h3>
                <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
                  {flatSchedules.length === 0
                    ? "Create exams and add schedules from the Exams page."
                    : "No schedules match your search filters."}
                </p>
                {(filterExamId || filterClassId || search) && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSearch("");
                      setFilterExamId("");
                      setFilterClassId("");
                    }}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg border border-white/40 dark:border-white/10 bg-white/60 dark:bg-white/5 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-white/80 dark:hover:bg-white/10"
                  >
                    <ArrowLeft className="h-4 w-4" /> Clear Filters
                  </motion.button>
                )}
              </motion.div>
            ) : (
              <div className="space-y-8">
                {Array.from(grouped.entries()).map(
                  ([classId, items], groupIdx) => {
                    const className = items[0]?.className ?? "Unknown Class";
                    return (
                      <motion.div
                        key={classId}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: groupIdx * 0.05 }}
                        className="space-y-3"
                      >
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-5 w-5 text-indigo-500" />
                          <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wide">
                            {className}
                          </h3>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            ({items.length} schedule
                            {items.length !== 1 ? "s" : ""})
                          </span>
                        </div>
                        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-slate-200 dark:border-slate-700 text-left text-xs uppercase text-slate-500 dark:text-slate-400 bg-slate-50/60 dark:bg-slate-800/40">
                                <th className="pb-3 pt-3 font-medium pl-4 w-40">
                                  Date
                                </th>
                                <th className="pb-3 pt-3 font-medium w-44">
                                  Time
                                </th>
                                <th className="pb-3 pt-3 font-medium">
                                  Exam
                                </th>
                                <th className="pb-3 pt-3 font-medium">Type</th>
                                <th className="pb-3 pt-3 font-medium">
                                  Subject
                                </th>
                                <th className="pb-3 pt-3 font-medium">
                                  Full Marks
                                </th>
                                <th className="pb-3 pt-3 font-medium text-right pr-4">
                                  Details
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                              {items.map((schedule, idx) => {
                                const isExpanded =
                                  expandedScheduleId === schedule.id;
                                return (
                                  <motion.tr
                                    key={schedule.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{
                                      delay: groupIdx * 0.05 + idx * 0.02,
                                    }}
                                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                                  >
                                    <td className="py-3.5 pl-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                      {schedule.examDate
                                        ? new Date(
                                            schedule.examDate,
                                          ).toLocaleDateString(
                                            "en-US",
                                            {
                                              year: "numeric",
                                              month: "short",
                                              day: "numeric",
                                            },
                                          )
                                        : "—"}
                                    </td>
                                    <td className="py-3.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                      {schedule.startTime &&
                                      schedule.endTime ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg text-indigo-600 dark:text-indigo-400">
                                          <Clock className="h-3 w-3" />
                                          {schedule.startTime} -{" "}
                                          {schedule.endTime}
                                        </span>
                                      ) : (
                                        "—"
                                      )}
                                    </td>
                                    <td className="py-3.5 font-medium text-slate-900 dark:text-white">
                                      {schedule.examName}
                                    </td>
                                    <td className="py-3.5 whitespace-nowrap">
                                      <span
                                        className={`inline-flex rounded-md px-2.5 py-1.5 text-xs font-medium border ${
                                          schedule.examType === "FINAL_EXAM" ||
                                          schedule.examType === "FINAL"
                                            ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20"
                                            : schedule.examType === "MID_TERM"
                                              ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20"
                                              : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20"
                                        }`}
                                      >
                                        {schedule.examType.replace("_", " ")}
                                      </span>
                                    </td>
                                    <td className="py-3.5 text-slate-700 dark:text-slate-200">
                                      {schedule.subjectName}
                                    </td>
                                    <td className="py-3.5 text-slate-600 dark:text-slate-300">
                                      {schedule.fullMarks ?? "—"}
                                    </td>
                                    <td className="py-3.5 pr-4">
                                      <button
                                        onClick={() =>
                                          toggleExpand(schedule.id)
                                        }
                                        className="inline-flex items-center justify-end gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline w-full"
                                      >
                                        <span className="group-open:hidden">
                                          {isExpanded ? "Hide" : "View"}
                                        </span>
                                        <ChevronRight
                                          className={`h-3.5 w-3.5 transition-transform ${
                                            isExpanded
                                              ? "rotate-90"
                                              : ""
                                          }`}
                                        />
                                      </button>
                                    </td>
                                  </motion.tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {items.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-800/20 p-4"
                          >
                            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                              Click &quot;View&quot; on any schedule row above to see
                              detailed information.
                            </p>
                          </motion.div>
                        )}
                      </motion.div>
                    );
                  },
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
