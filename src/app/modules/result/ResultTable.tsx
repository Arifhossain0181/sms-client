/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  ClipboardList,
  Users,
  Award,
  Sparkles,
  Save,
  Loader2,
  Inbox,
  GraduationCap,
  ChevronDown,
} from "lucide-react";
import { useExams } from "../exam/useExams";
import { useResultsByExam, useCreateBulkResult } from "./useResults";
import { useStudents } from "../student/useStudents";
import { useAuth } from "@/hooks/useAuth";
import { hasPermission } from "@/config/roles";

const getGrade = (marks: number, total: number): string => {
  const percent = (marks / total) * 100;
  if (percent >= 80) return "A+";
  if (percent >= 70) return "A";
  if (percent >= 60) return "B";
  if (percent >= 50) return "C";
  if (percent >= 40) return "D";
  return "F";
};

const gradeColor: Record<string, string> = {
  "A+": "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  A: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30",
  B: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  C: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30",
  D: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
  F: "bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/40",
};

const rowVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.03, duration: 0.3, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function ResultTable() {
  const { data: exams } = useExams();
  const { data: students } = useStudents();
  const { role } = useAuth();

  const [examId, setExamId] = useState("");
  const [marks, setMarks] = useState<Record<string, number>>({});

  const { data: existingResults } = useResultsByExam(examId);
  const { mutate: submitResults, isPending } = useCreateBulkResult();

  const selectedExam = exams?.find((e: any) => e.id === examId);
  const classStudents =
    students?.filter((s: any) => s.classId === selectedExam?.classId) ?? [];

  const canEdit = role && hasPermission(role, "add_result");

  const handleMarksChange = (studentId: string, value: number) => {
    setMarks((prev) => ({ ...prev, [studentId]: value }));
  };

  const handleSubmit = () => {
    if (!examId) return;
    const subjectId = selectedExam?.subjectId;
    if (!subjectId) return;

    const payload = classStudents.map((s: any) => ({
      examId,
      studentId: s.id,
      marks: [{ subjectId, marksObtained: marks[s.id] ?? 0 }],
    }));
    submitResults(payload);
  };

  return (
    <div className="relative min-h-screen p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/30 overflow-hidden">
      {/* Glow orbs */}
      <div className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full bg-indigo-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-fuchsia-400/20 blur-3xl" />

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-4 mb-8"
        >
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Trophy className="w-7 h-7 text-white" />
            </div>
            <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Results
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Exam select করে result দিন বা দেখুন
            </p>
          </div>
        </motion.div>

        {/* Exam Select */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="mb-6 rounded-2xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/70 dark:border-slate-700/50 shadow-sm p-5"
        >
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200 mb-3">
            <ClipboardList className="w-4 h-4 text-indigo-500" />
            Exam Select করুন
          </label>
          <div className="relative max-w-md">
            <select
              value={examId}
              onChange={(e) => setExamId(e.target.value)}
              className="w-full h-12 px-4 pr-11 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/60 transition-all appearance-none"
            >
              <option value="">Select Exam</option>
              {exams?.map((exam: any) => (
                <option key={exam.id} value={exam.id}>
                  {exam.name} — {exam.subject?.name} ({exam.class?.name})
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </motion.div>

        {/* Result Table */}
        <AnimatePresence mode="wait">
          {examId && classStudents.length > 0 && (
            <motion.div
              key="table"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4 }}
              className="rounded-2xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/70 dark:border-slate-700/50 shadow-xl shadow-slate-200/40 dark:shadow-black/30 overflow-hidden"
            >
              {/* Exam info bar */}
              <div className="px-6 py-4 bg-gradient-to-r from-indigo-50/80 to-violet-50/60 dark:from-indigo-950/40 dark:to-violet-950/30 border-b border-slate-200/70 dark:border-slate-700/50 flex flex-wrap items-center gap-4 text-sm">
                <span className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-medium">
                  <ClipboardList className="w-4 h-4 text-indigo-500" />
                  {selectedExam?.name}
                </span>
                <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <GraduationCap className="w-4 h-4" />
                  {selectedExam?.class?.name}
                </span>
                <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <Users className="w-4 h-4" />
                  {classStudents.length} students
                </span>
                <span className="ml-auto inline-flex items-center px-3 py-1 rounded-md text-xs font-mono font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-500/20">
                  Total: {selectedExam?.totalMarks}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50/60 dark:bg-slate-800/40 border-b border-slate-200/70 dark:border-slate-700/50">
                      <th className="text-left px-6 py-3.5 font-semibold text-slate-600 dark:text-slate-300 w-16">
                        #
                      </th>
                      <th className="text-left px-6 py-3.5 font-semibold text-slate-600 dark:text-slate-300">
                        Student
                      </th>
                      <th className="text-left px-6 py-3.5 font-semibold text-slate-600 dark:text-slate-300">
                        Marks / {selectedExam?.totalMarks}
                      </th>
                      <th className="text-left px-6 py-3.5 font-semibold text-slate-600 dark:text-slate-300">
                        Grade
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {classStudents.map((student: any, index: number) => {
                      const existing = existingResults?.find(
                        (r: any) => r.studentId === student.id
                      );
                      const currentMarks =
                        marks[student.id] ?? existing?.marksObtained ?? 0;
                      const grade = getGrade(
                        currentMarks,
                        selectedExam?.totalMarks ?? 100
                      );

                      return (
                        <motion.tr
                          key={student.id}
                          variants={rowVariants}
                          custom={index}
                          initial="hidden"
                          animate="visible"
                          className="border-b border-slate-100/70 dark:border-slate-800/50 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-colors"
                        >
                          <td className="px-6 py-3 text-slate-500 dark:text-slate-400 font-mono text-xs">
                            {String(index + 1).padStart(2, "0")}
                          </td>
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500/15 to-violet-500/15 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-semibold text-xs">
                                {student.name?.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-medium text-slate-900 dark:text-white">
                                {student.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-3">
                            {canEdit ? (
                              <input
                                type="number"
                                min={0}
                                max={selectedExam?.totalMarks ?? 100}
                                defaultValue={existing?.marksObtained ?? ""}
                                onChange={(e) =>
                                  handleMarksChange(
                                    student.id,
                                    Number(e.target.value)
                                  )
                                }
                                className="w-24 h-9 px-3 rounded-lg bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/60 transition-all"
                              />
                            ) : (
                              <span className="font-mono font-semibold text-slate-900 dark:text-white">
                                {currentMarks}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold border ${gradeColor[grade]}`}
                            >
                              <Award className="w-3 h-3" />
                              {grade}
                            </span>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Submit */}
              {canEdit && (
                <div className="px-6 py-4 border-t border-slate-200/70 dark:border-slate-700/50 bg-slate-50/40 dark:bg-slate-800/30 flex justify-end">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSubmit}
                    disabled={isPending}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-500/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Result Save করুন
                      </>
                    )}
                  </motion.button>
                </div>
              )}
            </motion.div>
          )}

          {/* No exam selected */}
          {!examId && (
            <motion.div
              key="no-exam"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center bg-white/40 dark:bg-slate-900/40"
            >
              <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mb-3">
                <ClipboardList className="w-7 h-7 text-indigo-500" />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Exam select করুন
              </p>
            </motion.div>
          )}

          {/* No students */}
          {examId && classStudents.length === 0 && (
            <motion.div
              key="no-students"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center bg-white/40 dark:bg-slate-900/40"
            >
              <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                <Inbox className="w-7 h-7 text-slate-400" />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                এই class এ কোনো student নেই
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
