"use client";

import { useMemo, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLenis } from "@/hooks/useLenis";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { marksService, type PendingMark } from "@/app/modules/marks/marks.service";
import { Exam } from "@/app/modules/exam/exam.types";
import { examService } from "@/app/modules/exam/exam.service";
import {
  ClipboardEdit,
  Search,
  Check,
  X,
  GraduationCap,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

type RowSelection = Record<string, boolean>;

export default function MarksApprovalPage() {
  useLenis();
  const router = useRouter();
  const { role } = useAuth();
  const queryClient = useQueryClient();

  const [selectedExamId, setSelectedExamId] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [rowSelection, setRowSelection] = useState<RowSelection>({});

  useEffect(() => {
    if (role && role !== "EXAM_CONTROLLER" && role !== "SCHOOL_ADMIN" && role !== "SUPER_ADMIN") {
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

  const { data: pendingMarks = [], isLoading: marksLoading } = useQuery({
    queryKey: ["pending-marks", selectedExamId, selectedClassId, selectedSubjectId],
    queryFn: () =>
      marksService.listPending(
        selectedExamId,
        selectedClassId || undefined,
        selectedSubjectId || undefined,
      ),
    enabled: !!selectedExamId,
  });

  const approveMutation = useMutation({
    mutationFn: () =>
      marksService.approve(
        selectedExamId,
        Object.keys(rowSelection).filter((id) => rowSelection[id]).map((id) => {
          const mark = pendingMarks.find((m: PendingMark) => m.id === id);
          if (!mark) throw new Error("Invalid mark");
          return { studentId: mark.studentId, subjectId: mark.subjectId };
        }),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-marks"] });
      setRowSelection({});
      toast.success("Selected marks approved!");
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ??
        (err instanceof Error ? err.message : "Failed to approve marks");
      toast.error(msg);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () =>
      marksService.reject(
        selectedExamId,
        Object.keys(rowSelection).filter((id) => rowSelection[id]).map((id) => {
          const mark = pendingMarks.find((m: PendingMark) => m.id === id);
          if (!mark) throw new Error("Invalid mark");
          return { studentId: mark.studentId, subjectId: mark.subjectId };
        }),
        rejectReason || "No reason provided",
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-marks"] });
      setRowSelection({});
      setRejectReason("");
      toast.success("Selected marks rejected!");
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ??
        (err instanceof Error ? err.message : "Failed to reject marks");
      toast.error(msg);
    },
  });

  const examsList = useMemo(() => Array.isArray(exams) ? exams : [], [exams]);

  const classList = useMemo(() => {
    const unique = new Map<string, string>();
    for (const m of pendingMarks) {
      const cls = m.student.section.class;
      if (!unique.has(cls.id)) unique.set(cls.id, cls.name);
    }
    return Array.from(unique.entries()).map(([id, name]) => ({ id, name }));
  }, [pendingMarks]);

  const subjectList = useMemo(() => {
    const unique = new Map<string, string>();
    for (const m of pendingMarks) {
      if (!unique.has(m.subject.id)) unique.set(m.subject.id, m.subject.name);
    }
    return Array.from(unique.entries()).map(([id, name]) => ({ id, name }));
  }, [pendingMarks]);

  const selectedAll = useMemo(() => {
    if (pendingMarks.length === 0) return false;
    return pendingMarks.every((m) => rowSelection[m.id]);
  }, [pendingMarks, rowSelection]);

  const selectedCount = useMemo(
    () => Object.keys(rowSelection).filter((id) => rowSelection[id]).length,
    [rowSelection],
  );

  const toggleAll = () => {
    if (selectedAll) {
      setRowSelection({});
    } else {
      setRowSelection(Object.fromEntries(pendingMarks.map((m) => [m.id, true])));
    }
  };

  const toggleRow = (id: string) => {
    setRowSelection((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleApprove = () => {
    if (selectedCount === 0) return toast.error("No marks selected");
    approveMutation.mutate();
  };

  const handleReject = () => {
    if (selectedCount === 0) return toast.error("No marks selected");
    if (!rejectReason.trim()) return toast.error("Please provide a rejection reason");
    rejectMutation.mutate();
  };

  const selectedExamName = useMemo(
    () => examsList.find((e: Exam) => e.id === selectedExamId)?.name ?? "",
    [examsList, selectedExamId],
  );

  if (examsLoading) {
    return (
      <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 p-4 sm:p-6">
        <Skeleton className="h-10 w-48 mb-6" />
        <Skeleton className="h-64 w-full rounded-2xl" />
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
                  Approve Marks
                  <motion.span
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="text-indigo-400"
                  >
                    <ClipboardEdit className="w-5 h-5" />
                  </motion.span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Review and approve submitted marks for an exam
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-5">
            <div className="flex flex-wrap items-center gap-4">
              <select
                value={selectedExamId}
                onChange={(e) => {
                  setSelectedExamId(e.target.value);
                  setSelectedClassId("");
                  setSelectedSubjectId("");
                }}
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-white/5 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
              >
                <option value="">Select Exam</option>
                {examsList.map((e: Exam) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>

              {selectedExamId && (
                <>
                  <select
                    value={selectedClassId}
                    onChange={(e) => {
                      setSelectedClassId(e.target.value);
                      setSelectedSubjectId("");
                    }}
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
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-white/5 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
                  >
                    <option value="">All Subjects</option>
                    {subjectList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </>
              )}

              {selectedExamId && (
                <>
                  <div className="relative flex-1 min-w-[220px]">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search student, subject, class..."
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-white/5 pl-9 pr-4 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
                    />
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Total:{" "}
                    <b className="text-slate-700 dark:text-slate-300">
                      {pendingMarks.length}
                    </b>
                  </div>
                </>
              )}
            </div>

            {!selectedExamId ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <GraduationCap className="w-10 h-10 text-indigo-400 mb-4" />
                <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">
                  Select an exam
                </h3>
                <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
                  Choose an exam to review pending marks.
                </p>
              </div>
            ) : marksLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-2xl" />
                ))}
              </div>
            ) : pendingMarks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <AlertCircle className="w-10 h-10 text-indigo-400 mb-4" />
                <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">
                  No pending marks
                </h3>
                <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
                  All marks for this exam have been reviewed.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 text-left text-xs uppercase text-slate-500 dark:text-slate-400 bg-slate-50/60 dark:bg-slate-800/40">
                      <th className="pb-3 pt-3 font-medium pl-4">
                        <input
                          type="checkbox"
                          checked={selectedAll}
                          onChange={toggleAll}
                          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </th>
                      <th className="pb-3 pt-3 font-medium">Student</th>
                      <th className="pb-3 pt-3 font-medium">Class</th>
                      <th className="pb-3 pt-3 font-medium">Subject</th>
                      <th className="pb-3 pt-3 font-medium">Marks</th>
                      <th className="pb-3 pt-3 font-medium">Full Marks</th>
                      <th className="pb-3 pt-3 font-medium">Submitted At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {pendingMarks.map((mark, idx) => (
                      <motion.tr
                        key={mark.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.02 }}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="py-3.5 pl-4">
                          <input
                            type="checkbox"
                            checked={!!rowSelection[mark.id]}
                            onChange={() => toggleRow(mark.id)}
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="py-3.5 font-medium text-slate-900 dark:text-white">
                          {mark.student.name}
                        </td>
                        <td className="py-3.5 text-slate-600 dark:text-slate-300">
                          {mark.student.section.class.name} ({mark.student.section.name})
                        </td>
                        <td className="py-3.5 text-slate-600 dark:text-slate-300">
                          {mark.subject.name}
                        </td>
                        <td className="py-3.5 text-slate-600 dark:text-slate-300">
                          {mark.marksObtained}
                        </td>
                        <td className="py-3.5 text-slate-600 dark:text-slate-300">
                          {mark.subject.fullMarks}
                        </td>
                        <td className="py-3.5 text-slate-600 dark:text-slate-300">
                          {new Date(mark.createdAt).toLocaleString()}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {selectedCount > 0 && selectedExamId && (
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="text"
                  placeholder="Rejection reason (required for reject)..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="flex-1 min-w-[220px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-white/5 px-4 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleApprove}
                  disabled={approveMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  <Check className="h-4 w-4" /> Approve ({selectedCount})
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleReject}
                  disabled={rejectMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50"
                >
                  <X className="h-4 w-4" /> Reject ({selectedCount})
                </motion.button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
