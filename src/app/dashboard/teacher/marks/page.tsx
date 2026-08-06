"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookMarked,
  CalendarDays,
  ChevronDown,
  ClipboardEdit,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Search,
  Sparkles,
  Users,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";
import { useClasses } from "@/app/modules/class/useClasses";
import { useSubjects } from "@/app/modules/subject/useSubjects";
import {
  useTeacherExams,
  useTeacherMarksForExam,
  useSubmitExamMarks,
} from "@/app/modules/marks/useMarks";
import {
  TeacherExam,
  TeacherMarksResponse,
  SubmitExamMarksPayload,
} from "@/app/modules/marks/marks.types";
import { formatDate } from "@/lib/utils";

type TeacherProfile = {
  id: string;
  name?: string;
  sectionTeacher?: Array<{
    id: string;
    class?: { id: string; name: string };
  }>;
};

type MarkRow = {
  studentId: string;
  studentName: string;
  rollNumber: string;
  sectionName: string;
  className: string;
  marks: Record<string, { subjectId: string; subjectName: string; marksObtained: number; fullMarks: number; passMarks: number; grade: string | null; gpa: number | null; status: string }>;
};

type TabType = "entry" | "history";

const EXAM_TYPES = [
  { value: "", label: "All Types" },
  { value: "CLASS_TEST", label: "Class Test" },
  { value: "MID_TERM", label: "Mid Term" },
  { value: "FINAL", label: "Final Exam" },
];

function getGradeColor(grade: string | null) {
  if (!grade) return "text-slate-500 dark:text-slate-400";
  if (["A+", "A"].includes(grade)) return "text-emerald-600 dark:text-emerald-300";
  if (["B+", "B"].includes(grade)) return "text-sky-600 dark:text-sky-300";
  if (["C+", "C"].includes(grade)) return "text-amber-600 dark:text-amber-300";
  return "text-rose-600 dark:text-rose-300";
}

function getStatusMeta(status: string) {
  if (status === "APPROVED")
    return {
      label: "Approved",
      badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-200/70 dark:border-emerald-500/20",
      dot: "bg-emerald-500",
    };
  if (status === "REJECTED")
    return {
      label: "Rejected",
      badge: "bg-rose-500/10 text-rose-600 dark:text-rose-300 border-rose-200/70 dark:border-rose-500/20",
      dot: "bg-rose-500",
    };
  return {
    label: "Submitted",
    badge: "bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-200/70 dark:border-amber-500/20",
    dot: "bg-amber-500",
  };
}

export default function Page() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { role } = useAuth();
  const { data: classes, isLoading: classesLoading } = useClasses();
  const { data: subjects } = useSubjects();

  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("entry");
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [examType, setExamType] = useState("");
  const [search, setSearch] = useState("");

  const [selectedExam, setSelectedExam] = useState<TeacherExam | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const examsQuery = useTeacherExams();
  const marksQuery = useTeacherMarksForExam(selectedExam?.id);
  const submitMutation = useSubmitExamMarks();

  useEffect(() => {
    if (role && role !== "TEACHER" && role !== "SUPER_ADMIN" && role !== "SCHOOL_ADMIN") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setProfileLoading(true);
        const res = await api.get("/teachers/me");
        const payload = res.data?.data ?? res.data;
        setProfile(payload ?? null);
      } catch {
        setProfile(null);
      } finally {
        setProfileLoading(false);
      }
    };

    if (role === "TEACHER" || role === "SCHOOL_ADMIN" || role === "SUPER_ADMIN") {
      loadProfile();
    } else {
      setProfileLoading(false);
    }
  }, [role]);

  const assignedClassIds = useMemo(() => {
    return new Set(profile?.sectionTeacher?.map((entry) => entry.class?.id).filter(Boolean) as string[]);
  }, [profile]);

  const availableClasses = useMemo(() => {
    const list = Array.isArray(classes) ? classes : [];
    if (role === "TEACHER") {
      if (assignedClassIds.size > 0) {
        return list.filter((cls) => assignedClassIds.has(cls.id));
      }
      return [];
    }
    return list;
  }, [classes, assignedClassIds, role]);

  const selectedClass = useMemo(
    () => availableClasses.find((cls) => cls.id === classId),
    [availableClasses, classId]
  );

  const availableSubjects = useMemo(() => {
    const allSubjects = Array.isArray(subjects) ? subjects : [];
    if (!selectedClass) return allSubjects;
    return allSubjects.filter((sub) => sub.classId === selectedClass.id);
  }, [subjects, selectedClass]);

  const filteredExams = useMemo(() => {
    let exams = examsQuery.data ?? [];
    if (classId) {
      exams = exams.filter((exam) =>
        exam.schedules.some((s) => s.classId === classId)
      );
    }
    if (subjectId) {
      exams = exams.filter((exam) =>
        exam.schedules.some((s) => s.subjectId === subjectId)
      );
    }
    if (examType) {
      exams = exams.filter((exam) => exam.type === examType);
    }
    return exams;
  }, [examsQuery.data, classId, subjectId, examType]);

  const marksData = marksQuery.data;
  const markRows = useMemo(() => {
    if (!marksData?.students) return [];
    const rows: MarkRow[] = marksData.students.map((s) => {
      const marksMap: MarkRow["marks"] = {};
      for (const m of s.subjectMarks) {
        marksMap[m.subjectId] = m;
      }
      return {
        studentId: s.student.id,
        studentName: s.student.name,
        rollNumber: String(s.student.rollNumber ?? ""),
        sectionName: s.student.section.name,
        className: s.student.section.class.name,
        marks: marksMap,
      };
    });
    return rows;
  }, [marksData]);

  const stats = useMemo(() => {
    if (!marksData?.students) return { total: 0, submitted: 0, approved: 0, rejected: 0 };
    const allMarks = marksData.students.flatMap((s) => s.subjectMarks);
    return {
      total: marksData.totalStudents,
      submitted: allMarks.filter((m) => m.status === "SUBMITTED").length,
      approved: allMarks.filter((m) => m.status === "APPROVED").length,
      rejected: allMarks.filter((m) => m.status === "REJECTED").length,
    };
  }, [marksData]);

  const filteredMarkRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return markRows;
    return markRows.filter(
      (r) =>
        r.studentName.toLowerCase().includes(q) ||
        r.rollNumber.includes(q) ||
        r.sectionName.toLowerCase().includes(q)
    );
  }, [markRows, search]);

  const handleRefresh = () => {
    if (activeTab === "entry") {
      queryClient.invalidateQueries({ queryKey: ["teacher-exams"] });
    } else {
      if (selectedExam?.id) {
        queryClient.invalidateQueries({ queryKey: ["teacher-marks", selectedExam.id] });
      }
    }
    toast.success("Data refreshed");
  };

  const handleSaveMarks = async () => {
    if (!selectedExam) return;
    const entries: SubmitExamMarksPayload["entries"] = [];
    for (const row of filteredMarkRows) {
      for (const [subjectId, mark] of Object.entries(row.marks)) {
        entries.push({
          studentId: row.studentId,
          subjectId,
          marksObtained: mark.marksObtained,
        });
      }
    }
    if (!entries.length) {
      toast.error("No marks to save");
      return;
    }
    setIsSubmitting(true);
    try {
      await submitMutation.mutateAsync({ examId: selectedExam.id, payload: { entries } });
    } catch {
      // error handled by mutation
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkChange = (studentId: string, subjectId: string, value: number, fullMarks: number) => {
    if (!marksData) return;
    const newMarks = { ...marksData };
    for (const student of newMarks.students) {
      if (student.student.id === studentId) {
        for (const mark of student.subjectMarks) {
          if (mark.subjectId === subjectId) {
            mark.marksObtained = Math.max(0, Math.min(value, fullMarks));
            break;
          }
        }
        break;
      }
    }
    marksQuery.refetch();
  };

  const isLoading = profileLoading || classesLoading || examsQuery.isLoading;

  if (isLoading && !examsQuery.data?.length) {
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
                  <ClipboardEdit className="w-6 h-6 text-white" />
                  <motion.div
                    className="absolute inset-0 rounded-2xl border-2 border-white/40 dark:border-white/20"
                    animate={{ scale: [1, 1.12, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2.4, repeat: Infinity }}
                  />
                </motion.div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    Enter Marks
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    Input and manage exam marks for your students.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-5">
            {/* Tabs */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="inline-flex rounded-2xl border border-white/40 dark:border-white/10 bg-white/65 dark:bg-white/5 p-1"
            >
              {([
                { key: "entry" as TabType, label: "Enter Marks", icon: Plus },
                { key: "history" as TabType, label: "My Submissions", icon: ClipboardEdit },
              ]).map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`relative inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                      isActive
                        ? "text-white"
                        : "text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-white/5"
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="marksTab"
                        className="absolute inset-0 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/30"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className="relative flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </motion.div>

            {/* Filters Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-3xl border border-white/40 dark:border-white/10 bg-white/65 dark:bg-white/5 backdrop-blur-sm p-4 sm:p-6 shadow-sm"
            >
              {activeTab === "entry" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                      Class
                    </label>
                    <div className="relative">
                      <select
                        value={classId}
                        onChange={(e) => {
                          setClassId(e.target.value);
                          setSubjectId("");
                        }}
                        className="w-full appearance-none rounded-2xl border border-white/40 dark:border-white/10 bg-white/80 dark:bg-slate-950/40 px-4 py-3 pr-10 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-400/30"
                      >
                        <option value="">Select class</option>
                        {availableClasses.map((cls) => (
                          <option key={cls.id} value={cls.id}>
                            {cls.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                      Subject
                    </label>
                    <div className="relative">
                      <select
                        value={subjectId}
                        onChange={(e) => setSubjectId(e.target.value)}
                        className="w-full appearance-none rounded-2xl border border-white/40 dark:border-white/10 bg-white/80 dark:bg-slate-950/40 px-4 py-3 pr-10 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-400/30"
                      >
                        <option value="">Select subject</option>
                        {availableSubjects.map((sub) => (
                          <option key={sub.id} value={sub.id}>
                            {sub.name} ({sub.code})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                      Exam Type
                    </label>
                    <div className="relative">
                      <select
                        value={examType}
                        onChange={(e) => setExamType(e.target.value)}
                        className="w-full appearance-none rounded-2xl border border-white/40 dark:border-white/10 bg-white/80 dark:bg-slate-950/40 px-4 py-3 pr-10 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-400/30"
                      >
                        {EXAM_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                      Search
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search exams..."
                        className="w-full rounded-2xl border border-white/40 dark:border-white/10 bg-white/80 dark:bg-slate-950/40 pl-10 pr-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-400/30"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                      Select Exam
                    </label>
                    <div className="relative mt-1.5">
                      <select
                        value={selectedExam?.id || ""}
                        onChange={(e) => {
                          const exam = filteredExams.find((ex) => ex.id === e.target.value);
                          setSelectedExam(exam || null);
                        }}
                        className="w-full appearance-none rounded-2xl border border-white/40 dark:border-white/10 bg-white/80 dark:bg-slate-950/40 px-4 py-3 pr-10 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-400/30"
                      >
                        <option value="">Choose an exam to view marks</option>
                        {filteredExams.map((exam) => (
                          <option key={exam.id} value={exam.id}>
                            {exam.name} ({exam.type.replace("_", " ")})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search students..."
                      className="w-full rounded-2xl border border-white/40 dark:border-white/10 bg-white/80 dark:bg-slate-950/40 pl-10 pr-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-400/30"
                    />
                  </div>
                </div>
              )}
            </motion.div>

            {/* Exam List (Entry Tab) */}
            {activeTab === "entry" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="rounded-3xl border border-white/40 dark:border-white/10 bg-white/65 dark:bg-white/5 backdrop-blur-sm shadow-sm overflow-hidden"
              >
                {filteredExams.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <motion.div
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      className="w-20 h-20 rounded-full bg-gradient-to-br from-sky-100 via-indigo-100 to-violet-100 dark:from-sky-500/20 dark:via-indigo-500/20 dark:to-violet-500/20 flex items-center justify-center mb-4 ring-1 ring-indigo-200/60 dark:ring-indigo-400/20"
                    >
                      <ClipboardEdit className="w-10 h-10 text-indigo-600 dark:text-indigo-300" />
                    </motion.div>
                    <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">
                      No exams found
                    </h3>
                    <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
                      {examsQuery.isLoading ? "Loading exams..." : "No exams match your filters."}
                    </p>
                  </div>
                ) : (
                  <div className="w-full overflow-x-auto">
                    <table className="w-full min-w-[640px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-white/40 dark:border-white/10 bg-white/65 dark:bg-white/5">
                          <th className="px-4 sm:px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Exam Name
                          </th>
                          <th className="px-4 sm:px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Type
                          </th>
                          <th className="px-4 sm:px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Class
                          </th>
                          <th className="px-4 sm:px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Subject
                          </th>
                          <th className="px-4 sm:px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Date
                          </th>
                          <th className="px-4 sm:px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/40 dark:divide-white/10">
                        {filteredExams.map((exam, index) => (
                          <motion.tr
                            key={exam.id}
                            layout
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.02, type: "spring", stiffness: 120, damping: 18 }}
                            className="group transition-colors duration-200 hover:bg-white/60 dark:hover:bg-white/5"
                          >
                            <td className="px-4 sm:px-6 py-4">
                              <span className="font-medium text-slate-800 dark:text-white">{exam.name}</span>
                            </td>
                            <td className="px-4 sm:px-6 py-4">
                              <span className="text-sm text-slate-700 dark:text-slate-300">
                                {exam.type.replace("_", " ")}
                              </span>
                            </td>
                            <td className="px-4 sm:px-6 py-4">
                              <span className="text-sm text-slate-700 dark:text-slate-300">
                                {exam.schedules.map((s) => s.class.name).join(", ")}
                              </span>
                            </td>
                            <td className="px-4 sm:px-6 py-4">
                              <span className="text-sm text-slate-700 dark:text-slate-300">
                                {exam.schedules.map((s) => s.subject.name).join(", ")}
                              </span>
                            </td>
                            <td className="px-4 sm:px-6 py-4">
                              <span className="text-sm text-slate-700 dark:text-slate-300">
                                {exam.schedules[0]?.examDate ? formatDate(exam.schedules[0].examDate) : "—"}
                              </span>
                            </td>
                            <td className="px-4 sm:px-6 py-4 text-center">
                              <button
                                onClick={() => {
                                  setSelectedExam(exam);
                                  setActiveTab("entry");
                                }}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-white/40 dark:border-white/10 bg-white/65 dark:bg-white/5 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-white/90 dark:hover:bg-white/10 transition-colors"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                Enter Marks
                              </button>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            )}

            {/* Marks Entry / History Table */}
            {activeTab === "entry" && selectedExam && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="rounded-3xl border border-white/40 dark:border-white/10 bg-white/65 dark:bg-white/5 backdrop-blur-sm shadow-sm overflow-hidden"
              >
                {/* Exam Info Bar */}
                <div className="p-4 sm:p-5 border-b border-white/40 dark:border-white/10 bg-white/65 dark:bg-white/5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h2 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white">
                        {selectedExam.name}
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                        {selectedExam.type.replace("_", " ")} • {selectedExam.schedules.map((s) => s.className).join(", ")}
                      </p>
                    </div>
                    <button
                      onClick={handleSaveMarks}
                      disabled={isSubmitting || submitMutation.isPending}
                      className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                    >
                      {isSubmitting || submitMutation.isPending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                      Save Marks
                    </button>
                  </div>
                </div>

                {marksQuery.isLoading ? (
                  <div className="p-8 space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-16 bg-slate-200/50 dark:bg-slate-700/30 rounded-2xl animate-pulse" />
                    ))}
                  </div>
                ) : markRows.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <motion.div
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      className="w-20 h-20 rounded-full bg-gradient-to-br from-sky-100 via-indigo-100 to-violet-100 dark:from-sky-500/20 dark:via-indigo-500/20 dark:to-violet-500/20 flex items-center justify-center mb-4 ring-1 ring-indigo-200/60 dark:ring-indigo-400/20"
                    >
                      <ClipboardEdit className="w-10 h-10 text-indigo-600 dark:text-indigo-300" />
                    </motion.div>
                    <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">
                      No marks found
                    </h3>
                    <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
                      Enter marks for students in the selected exam.
                    </p>
                  </div>
                ) : (
                  <div className="w-full overflow-x-auto">
                    <table className="w-full min-w-[640px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-white/40 dark:border-white/10 bg-white/65 dark:bg-white/5">
                          <th className="px-4 sm:px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Student
                          </th>
                          <th className="px-4 sm:px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center">
                            Roll
                          </th>
                          {selectedExam.schedules.map((sched) => (
                            <th key={sched.subjectId} className="px-4 sm:px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center">
                              {sched.subjectName}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/40 dark:divide-white/10">
                        <AnimatePresence mode="popLayout">
                          {filteredMarkRows.map((row, index) => (
                            <motion.tr
                              key={row.studentId}
                              layout
                              initial={{ opacity: 0, y: 14 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, x: -30, scale: 0.98 }}
                              transition={{ delay: index * 0.02, type: "spring", stiffness: 120, damping: 18 }}
                              className="group transition-colors duration-200 hover:bg-white/60 dark:hover:bg-white/5"
                            >
                              <td className="px-4 sm:px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300">
                                    {row.studentName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                                  </div>
                                  <span className="font-medium text-slate-800 dark:text-white truncate max-w-[200px]">
                                    {row.studentName}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 sm:px-6 py-4 text-center">
                                <span className="inline-flex items-center rounded-full border border-white/40 dark:border-white/10 bg-white/70 dark:bg-white/5 px-2 py-0.5 text-xs font-bold text-slate-500 dark:text-slate-400">
                                  {row.rollNumber}
                                </span>
                              </td>
                              {selectedExam.schedules.map((sched) => {
                                const mark = row.marks[sched.subjectId];
                                const fullMarks = mark?.fullMarks ?? sched.totalMarks ?? 100;
                                const passMarks = mark?.passMarks ?? 40;
                                const value = mark?.marksObtained ?? 0;
                                const percentage = fullMarks > 0 ? Math.round((value / fullMarks) * 100) : 0;
                                const isPass = value >= passMarks;
                                return (
                                  <td key={sched.subjectId} className="px-4 sm:px-6 py-4 text-center">
                                    <div className="flex flex-col items-center gap-1">
                                      <input
                                        type="number"
                                        min={0}
                                        max={fullMarks}
                                        value={value}
                                        onChange={(e) => handleMarkChange(row.studentId, sched.subjectId, Number(e.target.value), fullMarks)}
                                        className={`w-20 rounded-xl border px-3 py-2 text-center text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-400/30 ${
                                          isPass
                                            ? "border-emerald-200/70 dark:border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                            : "border-rose-200/70 dark:border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300"
                                        }`}
                                      />
                                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                        / {fullMarks} ({percentage}%)
                                      </span>
                                    </div>
                                  </td>
                                );
                              })}
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Footer */}
                {markRows.length > 0 && (
                  <div className="p-4 sm:p-5 border-t border-white/40 dark:border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Showing{" "}
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {filteredMarkRows.length}
                      </span>{" "}
                      of{" "}
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {stats.total}
                      </span>{" "}
                      students
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* History Tab */}
            {activeTab === "history" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="rounded-3xl border border-white/40 dark:border-white/10 bg-white/65 dark:bg-white/5 backdrop-blur-sm shadow-sm overflow-hidden"
              >
                {!selectedExam ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <motion.div
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      className="w-20 h-20 rounded-full bg-gradient-to-br from-sky-100 via-indigo-100 to-violet-100 dark:from-sky-500/20 dark:via-indigo-500/20 dark:to-violet-500/20 flex items-center justify-center mb-4 ring-1 ring-indigo-200/60 dark:ring-indigo-400/20"
                    >
                      <ClipboardEdit className="w-10 h-10 text-indigo-600 dark:text-indigo-300" />
                    </motion.div>
                    <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">
                      Select an exam
                    </h3>
                    <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
                      Choose an exam from the entry tab to view your submitted marks.
                    </p>
                  </div>
                ) : marksQuery.isLoading ? (
                  <div className="p-8 space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-16 bg-slate-200/50 dark:bg-slate-700/30 rounded-2xl animate-pulse" />
                    ))}
                  </div>
                ) : markRows.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <motion.div
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      className="w-20 h-20 rounded-full bg-gradient-to-br from-sky-100 via-indigo-100 to-violet-100 dark:from-sky-500/20 dark:via-indigo-500/20 dark:to-violet-500/20 flex items-center justify-center mb-4 ring-1 ring-indigo-200/60 dark:ring-indigo-400/20"
                    >
                      <ClipboardEdit className="w-10 h-10 text-indigo-600 dark:text-indigo-300" />
                    </motion.div>
                    <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">
                      No marks submitted yet
                    </h3>
                    <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
                      Switch to the "Enter Marks" tab to submit marks for this exam.
                    </p>
                  </div>
                ) : (
                  <div className="w-full overflow-x-auto">
                    <table className="w-full min-w-[640px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-white/40 dark:border-white/10 bg-white/65 dark:bg-white/5">
                          <th className="px-4 sm:px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Student
                          </th>
                          <th className="px-4 sm:px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center">
                            Roll
                          </th>
                          {selectedExam.schedules.map((sched) => (
                            <th key={sched.subjectId} className="px-4 sm:px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center">
                              {sched.subjectName}
                            </th>
                          ))}
                          <th className="px-4 sm:px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/40 dark:divide-white/10">
                        <AnimatePresence mode="popLayout">
                          {filteredMarkRows.map((row, index) => {
                            const allApproved = Object.values(row.marks).every((m) => m.status === "APPROVED");
                            const anyRejected = Object.values(row.marks).some((m) => m.status === "REJECTED");
                            const rowStatus = allApproved ? "APPROVED" : anyRejected ? "REJECTED" : "SUBMITTED";
                            const statusMeta = getStatusMeta(rowStatus);
                            return (
                              <motion.tr
                                key={row.studentId}
                                layout
                                initial={{ opacity: 0, y: 14 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -30, scale: 0.98 }}
                                transition={{ delay: index * 0.02, type: "spring", stiffness: 120, damping: 18 }}
                                className={`group transition-colors duration-200 ${
                                  rowStatus === "APPROVED"
                                    ? "bg-emerald-50/30 dark:bg-emerald-500/5"
                                    : rowStatus === "REJECTED"
                                      ? "bg-rose-50/30 dark:bg-rose-500/5"
                                      : "hover:bg-white/60 dark:hover:bg-white/5"
                                }`}
                              >
                                <td className="px-4 sm:px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div
                                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold ${
                                        rowStatus === "APPROVED"
                                          ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                                          : rowStatus === "REJECTED"
                                            ? "bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-300"
                                            : "bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-300"
                                      }`}
                                    >
                                      {row.studentName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                                    </div>
                                    <span className="font-medium text-slate-800 dark:text-white truncate max-w-[200px]">
                                      {row.studentName}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 sm:px-6 py-4 text-center">
                                  <span className="inline-flex items-center rounded-full border border-white/40 dark:border-white/10 bg-white/70 dark:bg-white/5 px-2 py-0.5 text-xs font-bold text-slate-500 dark:text-slate-400">
                                    {row.rollNumber}
                                  </span>
                                </td>
                                {selectedExam.schedules.map((sched) => {
                                  const mark = row.marks[sched.subjectId];
                                  const fullMarks = mark?.fullMarks ?? sched.totalMarks ?? 100;
                                  const value = mark?.marksObtained ?? 0;
                                  const percentage = fullMarks > 0 ? Math.round((value / fullMarks) * 100) : 0;
                                  const isPass = value >= (mark?.passMarks ?? 40);
                                  return (
                                    <td key={sched.subjectId} className="px-4 sm:px-6 py-4 text-center">
                                      <div className="flex flex-col items-center gap-1">
                                        <span className={`text-sm font-bold ${isPass ? "text-emerald-600 dark:text-emerald-300" : "text-rose-600 dark:text-rose-300"}`}>
                                          {value} / {fullMarks}
                                        </span>
                                        <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                          {percentage}% • {mark?.grade || "—"}
                                        </span>
                                      </div>
                                    </td>
                                  );
                                })}
                                <td className="px-4 sm:px-6 py-4 text-center">
                                  <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold ${statusMeta.badge}`}>
                                    <span className={`w-2 h-2 rounded-full ${statusMeta.dot}`} />
                                    {statusMeta.label}
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
                {markRows.length > 0 && (
                  <div className="p-4 sm:p-5 border-t border-white/40 dark:border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Showing{" "}
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {filteredMarkRows.length}
                      </span>{" "}
                      of{" "}
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {stats.total}
                      </span>{" "}
                      students
                    </p>
                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        Submitted
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        Approved
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                        Rejected
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 1 }}
          className="mt-6 text-center text-[10px] font-bold tracking-[0.3em] uppercase text-slate-400 dark:text-slate-600"
        >
          Enter Marks
        </motion.p>
      </motion.div>
    </div>
  );
}