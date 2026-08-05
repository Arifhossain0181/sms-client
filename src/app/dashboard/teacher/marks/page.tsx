"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useLenis } from "@/hooks/useLenis";
import { useExams } from "@/app/modules/exam/useExams";
import { useCreateBulkResult } from "@/app/modules/result/useResults";
import api from "@/lib/axios";
import { toast } from "sonner";
import {
  ClipboardEdit,
  BookOpen,
  Users,
  ChevronDown,
  Send,
  RefreshCw,
  Trophy,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  FileText,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AssignedSection {
  id: string;
  name: string;
  classId: string;
  class: { id: string; name: string };
}

interface Subject {
  id: string;
  name: string;
  code?: string;
  fullMarks: number;
  passMarks: number;
  classId: string;
}

interface Student {
  id: string;
  name: string;
  studentId?: string;
  rollNumber?: number;
  photo?: string;
}

interface StudentMark {
  studentId: string;
  studentName: string;
  rollNumber?: number;
  photo?: string;
  marks: Record<string, number>; // subjectId → marksObtained
  total: number;
  passed: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function calcTotal(marks: Record<string, number>) {
  return Object.values(marks).reduce((s, v) => s + (isNaN(v) ? 0 : v), 0);
}

function checkPassed(
  marks: Record<string, number>,
  subjects: Subject[]
): boolean {
  return subjects.every(
    (sub) => (marks[sub.id] ?? 0) >= sub.passMarks
  );
}

const RANK_EMOJI = ["🥇", "🥈", "🥉"];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TeacherMarksPage() {
  useLenis();
  const { user } = useAuth();
  const { data: exams, isLoading: examsLoading } = useExams();
  const { mutate: submitBulk, isPending: submitting } = useCreateBulkResult();

  // Teacher's assigned sections (from /teachers/me)
  const [sections, setSections] = useState<AssignedSection[]>([]);
  const [loadingSections, setLoadingSections] = useState(true);

  // Selections
  const [examId, setExamId] = useState("");
  const [sectionId, setSectionId] = useState("");

  // Data fetched after section select
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Marks grid: studentId → StudentMark
  const [markGrid, setMarkGrid] = useState<Record<string, StudentMark>>({});

  // ── Load teacher's assigned sections ──────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const res = await api.get("/teachers/me");
        const payload = res.data?.data ?? res.data;
        const raw: AssignedSection[] = Array.isArray(payload?.sectionTeacher)
          ? payload.sectionTeacher
          : [];
        setSections(raw.filter((s) => s.id && s.class?.id));
      } catch {
        toast.error("Could not load your assigned sections.");
      } finally {
        setLoadingSections(false);
      }
    })();
  }, [user?.id]);

  // ── Load subjects + students when section changes ─────────────────────────
  const loadSectionData = useCallback(async (secId: string, classId: string) => {
    setLoadingData(true);
    setSubjects([]);
    setStudents([]);
    setMarkGrid({});
    try {
      const [subRes, stuRes] = await Promise.all([
        api.get("/subjects", { params: { classId } }),
        api.get("/students", { params: { classId, sectionId: secId, limit: 200 } }),
      ]);

      const subPayload = subRes.data?.data ?? subRes.data;
      const subArr: Subject[] = Array.isArray(subPayload)
        ? subPayload
        : Array.isArray(subPayload?.subjects)
        ? subPayload.subjects
        : [];

      const stuPayload = stuRes.data?.data ?? stuRes.data;
      const stuArr: Student[] = Array.isArray(stuPayload)
        ? stuPayload
        : Array.isArray(stuPayload?.students)
        ? stuPayload.students
        : [];

      setSubjects(subArr);
      setStudents(stuArr);

      // Init mark grid
      const grid: Record<string, StudentMark> = {};
      stuArr.forEach((stu) => {
        const emptyMarks: Record<string, number> = {};
        subArr.forEach((sub) => { emptyMarks[sub.id] = 0; });
        grid[stu.id] = {
          studentId: stu.id,
          studentName: stu.name,
          rollNumber: stu.rollNumber,
          photo: stu.photo,
          marks: emptyMarks,
          total: 0,
          passed: false,
        };
      });
      setMarkGrid(grid);
    } catch {
      toast.error("Failed to load class data.");
    } finally {
      setLoadingData(false);
    }
  }, []);

  const handleSectionChange = (secId: string) => {
    setSectionId(secId);
    const sec = sections.find((s) => s.id === secId);
    if (sec) loadSectionData(secId, sec.classId);
  };

  // ── Mark change handler ───────────────────────────────────────────────────
  const handleMarkChange = (studentId: string, subjectId: string, raw: string) => {
    const val = raw === "" ? 0 : Math.max(0, Number(raw));
    const sub = subjects.find((s) => s.id === subjectId);
    const capped = sub ? Math.min(val, sub.fullMarks) : val;

    setMarkGrid((prev) => {
      const entry = prev[studentId];
      if (!entry) return prev;
      const updMarks = { ...entry.marks, [subjectId]: capped };
      return {
        ...prev,
        [studentId]: {
          ...entry,
          marks: updMarks,
          total: calcTotal(updMarks),
          passed: checkPassed(updMarks, subjects),
        },
      };
    });
  };

  // ── Ranked rows ───────────────────────────────────────────────────────────
  const rankedRows = useMemo(() => {
    return Object.values(markGrid).sort((a, b) => b.total - a.total);
  }, [markGrid]);

  const totalFullMarks = useMemo(
    () => subjects.reduce((s, sub) => s + sub.fullMarks, 0),
    [subjects]
  );

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = () => {
    if (!examId) { toast.error("Please select an exam first."); return; }
    if (!sectionId) { toast.error("Please select a section first."); return; }
    if (students.length === 0) { toast.error("No students in this section."); return; }

    const payload = Object.values(markGrid).map((entry) => ({
      examId,
      studentId: entry.studentId,
      marks: subjects.map((sub) => ({
        subjectId: sub.id,
        marksObtained: entry.marks[sub.id] ?? 0,
      })),
    }));

    submitBulk(payload, {
      onSuccess: () => {
        toast.success(`Marks submitted for ${payload.length} students ✓`);
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message ?? "Submission failed.");
      },
    });
  };

  const selectedSection = sections.find((s) => s.id === sectionId);
  const ready = !!examId && !!sectionId && students.length > 0 && subjects.length > 0;

  return (
    <div className="relative min-h-screen p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950 overflow-hidden">
      {/* Ambient blobs */}
      <motion.div
        animate={{ x: [0, 60, 0], y: [0, -40, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute -top-32 -left-40 w-[550px] h-[550px] bg-violet-300/20 dark:bg-violet-500/10 rounded-full blur-3xl"
      />
      <motion.div
        animate={{ x: [0, -50, 0], y: [0, 60, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute -bottom-32 -right-40 w-[600px] h-[600px] bg-indigo-300/20 dark:bg-indigo-500/10 rounded-full blur-3xl"
      />

      <div className="relative max-w-7xl mx-auto space-y-6">
        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/10 shadow-2xl shadow-slate-200/40 dark:shadow-none overflow-hidden"
        >
          <div className="relative px-6 sm:px-8 py-6 bg-gradient-to-r from-violet-50 via-indigo-50 to-blue-50 dark:from-violet-500/10 dark:via-indigo-500/10 dark:to-blue-500/10 border-b border-white/40 dark:border-white/5">
            <motion.div
              animate={{ x: [0, 140, 0] }}
              transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none"
            />
            <div className="relative flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <motion.span
                    animate={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="text-violet-500"
                  >
                    <ClipboardEdit className="w-6 h-6" />
                  </motion.span>
                  Exam Mark Entry
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Enter marks for your assigned classes. Marks are sent to Exam Controller for approval.
                </p>
              </div>

              {ready && (
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 via-indigo-500 to-blue-500 text-white px-5 py-2.5 text-sm font-semibold shadow-lg shadow-violet-500/30 hover:shadow-xl disabled:opacity-60 transition-all"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {submitting ? "Submitting…" : "Submit Marks"}
                </motion.button>
              )}
            </div>
          </div>

          {/* ── Selectors ── */}
          <div className="px-6 sm:px-8 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Exam */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Exam
              </label>
              <div className="relative">
                <select
                  value={examId}
                  onChange={(e) => setExamId(e.target.value)}
                  disabled={examsLoading}
                  className="w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 pr-9 text-sm text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50"
                >
                  <option value="">
                    {examsLoading ? "Loading exams…" : "— Select Exam —"}
                  </option>
                  {(exams ?? []).map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
            </div>

            {/* Section */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Section
              </label>
              <div className="relative">
                <select
                  value={sectionId}
                  onChange={(e) => handleSectionChange(e.target.value)}
                  disabled={loadingSections}
                  className="w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 pr-9 text-sm text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50"
                >
                  <option value="">
                    {loadingSections ? "Loading sections…" : "— Select Section —"}
                  </option>
                  {sections.map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.class?.name} — {sec.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Stats row ── */}
        <AnimatePresence>
          {ready && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3"
            >
              {[
                { label: "Class", value: `${selectedSection?.class?.name} – ${selectedSection?.name}`, icon: BookOpen, color: "from-violet-500 to-indigo-500" },
                { label: "Students", value: students.length, icon: Users, color: "from-blue-500 to-cyan-500" },
                { label: "Subjects", value: subjects.length, icon: ClipboardEdit, color: "from-emerald-500 to-teal-500" },
                { label: "Total Marks", value: totalFullMarks, icon: Trophy, color: "from-amber-500 to-orange-500" },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-white/30 dark:border-white/10 p-4 shadow-sm">
                    <div className={`inline-flex p-2 rounded-xl bg-gradient-to-br ${stat.color} mb-2`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{stat.value}</p>
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Main mark entry table ── */}
        {loadingData ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-white/30 dark:border-white/10 shadow-xl p-12 flex flex-col items-center gap-4"
          >
            <RefreshCw className="w-8 h-8 text-violet-500 animate-spin" />
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading class data…</p>
          </motion.div>
        ) : !sectionId ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-white/30 dark:border-white/10 shadow-xl p-20 flex flex-col items-center gap-3 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
              <ClipboardEdit className="w-8 h-8 text-violet-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 dark:text-white">Select an exam and section</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
              Choose the exam and your assigned class section above to start entering marks.
            </p>
          </motion.div>
        ) : students.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-white/30 dark:border-white/10 shadow-xl p-20 flex flex-col items-center gap-3 text-center"
          >
            <Users className="w-10 h-10 text-slate-400" />
            <p className="text-slate-500 dark:text-slate-400">No students found in this section.</p>
          </motion.div>
        ) : subjects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-white/30 dark:border-white/10 shadow-xl p-20 flex flex-col items-center gap-3 text-center"
          >
            <BookOpen className="w-10 h-10 text-slate-400" />
            <p className="text-slate-500 dark:text-slate-400">No subjects configured for this class yet.</p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/10 shadow-2xl shadow-slate-200/40 dark:shadow-none overflow-hidden"
          >
            {/* Table header info */}
            <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between flex-wrap gap-2">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-slate-700 dark:text-white">{rankedRows.length}</span> students ·{" "}
                <span className="font-semibold text-slate-700 dark:text-white">{subjects.length}</span> subjects ·{" "}
                Max <span className="font-semibold text-slate-700 dark:text-white">{totalFullMarks}</span> marks
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Marks go to Exam Controller for approval before publishing.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-700/60">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide w-10">#</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide min-w-[180px]">Student</th>
                    {subjects.map((sub) => (
                      <th key={sub.id} className="px-3 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide min-w-[90px]">
                        <span className="block truncate max-w-[80px] mx-auto" title={sub.name}>{sub.name}</span>
                        <span className="text-[10px] font-normal text-slate-400">/ {sub.fullMarks}</span>
                      </th>
                    ))}
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide sticky right-0 bg-slate-50/80 dark:bg-slate-800/60 min-w-[80px]">
                      Total<span className="font-normal block text-[10px]">/ {totalFullMarks}</span>
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide min-w-[70px]">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {rankedRows.map((row, idx) => {
                    const pct = totalFullMarks > 0 ? Math.round((row.total / totalFullMarks) * 100) : 0;
                    return (
                      <motion.tr
                        key={row.studentId}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.02, duration: 0.25 }}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        {/* Rank */}
                        <td className="px-4 py-3 text-center font-bold text-slate-600 dark:text-slate-400">
                          {idx < 3 ? RANK_EMOJI[idx] : <span className="text-xs">#{idx + 1}</span>}
                        </td>

                        {/* Student */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
                              {row.photo ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={row.photo} alt={row.studentName} className="w-full h-full object-cover" />
                              ) : (
                                getInitials(row.studentName)
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-slate-800 dark:text-white text-xs leading-tight">{row.studentName}</p>
                              {row.rollNumber && (
                                <p className="text-[10px] text-slate-400">Roll #{row.rollNumber}</p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Marks inputs */}
                        {subjects.map((sub) => {
                          const val = row.marks[sub.id] ?? 0;
                          const failing = val < sub.passMarks && val > 0;
                          return (
                            <td key={sub.id} className="px-3 py-3 text-center">
                              <input
                                type="number"
                                min={0}
                                max={sub.fullMarks}
                                value={val === 0 ? "" : val}
                                placeholder="0"
                                onChange={(e) =>
                                  handleMarkChange(row.studentId, sub.id, e.target.value)
                                }
                                className={`w-16 rounded-lg border px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 transition-colors
                                  ${failing
                                    ? "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 focus:ring-red-400"
                                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-violet-400"
                                  }`}
                              />
                            </td>
                          );
                        })}

                        {/* Total */}
                        <td className="px-4 py-3 text-center sticky right-0 bg-white/90 dark:bg-slate-900/80 backdrop-blur-sm">
                          <span className={`text-sm font-bold ${pct >= 33 ? "text-indigo-600 dark:text-indigo-400" : "text-red-600 dark:text-red-400"}`}>
                            {row.total}
                          </span>
                          <span className="text-[10px] text-slate-400 block">{pct}%</span>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3 text-center">
                          {row.total === 0 ? (
                            <span className="text-[10px] text-slate-400">—</span>
                          ) : row.passed ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" /> Pass
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded-full">
                              <AlertTriangle className="w-3 h-3" /> Fail
                            </span>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between flex-wrap gap-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Red cells indicate marks below pass mark. Ranks update as you type.
              </p>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 via-indigo-500 to-blue-500 text-white px-6 py-2.5 text-sm font-semibold shadow-lg shadow-violet-500/30 hover:shadow-xl disabled:opacity-60 transition-all"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {submitting ? "Submitting…" : `Submit ${rankedRows.length} Students`}
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
