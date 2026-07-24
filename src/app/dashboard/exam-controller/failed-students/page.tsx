"use client";

import { useMemo, useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import { useLenis } from "@/hooks/useLenis";
import { useAuth } from "@/hooks/useAuth";
import { examService } from "@/app/modules/exam/exam.service";
import { classService } from "@/app/modules/class/class.service";
import {
  GraduationCap,
  Search,
  AlertTriangle,
  BookOpen,
  Calendar,
  Users,
  ChevronRight,
  X,
  Filter,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

type FailedSubject = {
  subjectId: string;
  subjectName: string;
  marksObtained: number;
  passMarks: number;
};

type FailedStudent = {
  student: {
    id: string;
    studentId: string;
    name: string;
    section: {
      id: string;
      name: string;
      classId: string;
      class: { name: string };
    };
  };
  failedSubjects: FailedSubject[];
};

type FailedStudentsResponse = {
  examId: string;
  classId: string | null;
  totalFailedStudents: number;
  students: FailedStudent[];
};

export default function FailedStudentsPage() {
  useLenis();
  const router = useRouter();
  const { role } = useAuth();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const examIdFromUrl = searchParams.get("examId");
  const classIdFromUrl = searchParams.get("classId");

  const [selectedExamId, setSelectedExamId] = useState<string>(examIdFromUrl || "");
  const [selectedClassId, setSelectedClassId] = useState<string>(classIdFromUrl || "");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (role && role !== "EXAM_CONTROLLER" && role !== "SCHOOL_ADMIN" && role !== "TEACHER") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  useEffect(() => {
    if (examIdFromUrl) setSelectedExamId(examIdFromUrl);
  }, [examIdFromUrl]);

  useEffect(() => {
    if (classIdFromUrl) setSelectedClassId(classIdFromUrl);
  }, [classIdFromUrl]);

  useEffect(() => {
    if (selectedExamId) {
      const params = new URLSearchParams(window.location.search);
      if (selectedExamId !== params.get("examId")) {
        router.replace(`/dashboard/exam-controller/failed-students?examId=${selectedExamId}${selectedClassId ? `&classId=${selectedClassId}` : ""}`);
      }
    }
  }, [selectedExamId, selectedClassId, router]);

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

  const { data: failedData, isLoading: failedLoading, error } = useQuery({
    queryKey: ["failed-students", selectedExamId, selectedClassId],
    queryFn: async () => {
      if (!selectedExamId) return null;
      const data = await examService.getFailedStudents(selectedExamId, selectedClassId || undefined);
      return data as FailedStudentsResponse;
    },
    enabled: !!selectedExamId,
  });

  const flatStudents = useMemo(() => {
    if (!failedData?.students?.length) return [];
    return failedData.students.map((s) => ({
      ...s,
      classId: s.student.section?.classId || "",
      className: s.student.section?.class?.name || "—",
      sectionName: s.student.section?.name || "—",
      failedCount: s.failedSubjects.length,
    }));
  }, [failedData]);

  const grouped = useMemo(() => {
    const groups = new Map<string, typeof flatStudents>();
    for (const s of flatStudents) {
      const key = s.classId || "unknown";
      const list = groups.get(key) ?? [];
      list.push(s);
      groups.set(key, list);
    }
    return groups;
  }, [flatStudents]);

  const filteredGrouped = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return grouped;

    const result = new Map<string, typeof flatStudents>();
    for (const [classId, students] of grouped) {
      const filtered = students.filter(
        (s) =>
          s.student.name.toLowerCase().includes(q) ||
          s.student.studentId.toLowerCase().includes(q) ||
          s.sectionName.toLowerCase().includes(q) ||
          s.className.toLowerCase().includes(q)
      );
      if (filtered.length > 0) {
        result.set(classId, filtered);
      }
    }
    return result;
  }, [grouped, search]);

  const totalFailed = useMemo(() => {
    return flatStudents.length;
  }, [flatStudents]);

  const selectedExam = useMemo(() => {
    return exams.find((e: any) => e.id === selectedExamId);
  }, [exams, selectedExamId]);

  const isLoading = examsLoading || classesLoading || failedLoading;

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
                  Failed Students
                  <motion.span
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="text-rose-400"
                  >
                    <AlertTriangle className="w-5 h-5" />
                  </motion.span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Students who scored below passing marks by subject
                </p>
              </div>
              {selectedExam && (
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Total Failed: <b className="text-slate-700 dark:text-slate-300">{totalFailed}</b>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-5">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[200px]">
                <select
                  value={selectedExamId}
                  onChange={(e) => {
                    setSelectedExamId(e.target.value);
                    setSelectedClassId("");
                  }}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-white/5 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
                >
                  <option value="">Select Exam</option>
                  {exams.map((e: any) => (
                    <option key={e.id} value={e.id}>
                      {e.name} {e.type ? `(${e.type.replace("_", " ")})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {selectedExamId && (
                <>
                  <div className="min-w-[180px]">
                    <select
                      value={selectedClassId}
                      onChange={(e) => setSelectedClassId(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-white/5 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
                    >
                      <option value="">All Classes</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="relative flex-1 min-w-[220px]">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search by name, ID, section..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-white/5 pl-9 pr-4 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
                    />
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
                  Choose an exam to view students who failed in one or more subjects.
                </p>
              </div>
            ) : isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-2xl" />
                ))}
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <AlertTriangle className="w-10 h-10 text-rose-400 mb-4" />
                <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">
                  Failed to load data
                </h3>
                <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
                  {(error as Error)?.message || "Please try again later."}
                </p>
              </div>
            ) : totalFailed === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <BookOpen className="w-10 h-10 text-emerald-400 mb-4" />
                <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">No failed students</h3>
                <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
                  {failedData?.totalFailedStudents === 0
                    ? "All students passed in the selected exam."
                    : "No students match your search."}
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {Array.from(filteredGrouped.entries()).map(([classId, students], gIdx) => {
                  const className = students[0]?.className ?? "Unknown Class";
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
                          ({students.length} failed student{students.length !== 1 ? "s" : ""})
                        </span>
                      </div>
                      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-700 text-left text-xs uppercase text-slate-500 dark:text-slate-400 bg-slate-50/60 dark:bg-slate-800/40">
                              <th className="pb-3 pt-3 font-medium pl-4">Student ID</th>
                              <th className="pb-3 pt-3 font-medium">Name</th>
                              <th className="pb-3 pt-3 font-medium">Section</th>
                              <th className="pb-3 pt-3 font-medium">Failed Subjects</th>
                              <th className="pb-3 pt-3 font-medium text-right pr-4">Details</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {students.map((item, idx) => (
                              <motion.tr
                                key={item.student.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: gIdx * 0.05 + idx * 0.02 }}
                                className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                              >
                                <td className="py-3.5 pl-4 text-slate-600 dark:text-slate-300 font-mono text-xs">
                                  {item.student.studentId}
                                </td>
                                <td className="py-3.5 font-medium text-slate-900 dark:text-white">
                                  {item.student.name}
                                </td>
                                <td className="py-3.5 text-slate-600 dark:text-slate-300">
                                  {item.sectionName}
                                </td>
                                <td className="py-3.5">
                                  <div className="flex flex-wrap gap-1">
                                    {item.failedSubjects.map((sub) => (
                                      <span
                                        key={sub.subjectId}
                                        className="inline-flex rounded-md px-2 py-1 text-xs font-medium border bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20"
                                        title={`Obtained: ${sub.marksObtained}, Pass: ${sub.passMarks}`}
                                      >
                                        {sub.subjectName}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                                <td className="py-3.5 pr-4">
                                  <details className="group">
                                    <summary className="list-none flex items-center justify-end cursor-pointer text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                                      <span className="group-open:hidden">View</span>
                                      <span className="hidden group-open:inline">Hide</span>
                                      <ChevronRight className="h-3.5 w-3.5 ml-1 transition-transform group-open:rotate-90" />
                                    </summary>
                                    <div className="mt-3 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                                      <table className="w-full text-xs">
                                        <thead>
                                          <tr className="border-b border-slate-200 dark:border-slate-700 text-left text-xs uppercase text-slate-500 dark:text-slate-400 bg-slate-50/60 dark:bg-slate-800/40">
                                            <th className="pb-2 pl-3 font-medium">Subject</th>
                                            <th className="pb-2 font-medium">Obtained</th>
                                            <th className="pb-2 font-medium">Pass Marks</th>
                                            <th className="pb-2 font-medium text-right pr-3">Short By</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                          {item.failedSubjects.map((sub) => {
                                            const shortBy = sub.passMarks - sub.marksObtained;
                                            return (
                                              <tr key={sub.subjectId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                                                <td className="py-2 pl-3 text-slate-700 dark:text-slate-200">{sub.subjectName}</td>
                                                <td className="py-2 text-slate-600 dark:text-slate-300">{sub.marksObtained}</td>
                                                <td className="py-2 text-slate-600 dark:text-slate-300">{sub.passMarks}</td>
                                                <td className="py-2 text-right pr-3 text-rose-600 dark:text-rose-400 font-medium">
                                                  -{shortBy}
                                                </td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                  </details>
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
          </div>
        </div>
      </div>
    </div>
  );
}
