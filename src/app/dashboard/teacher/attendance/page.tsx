"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  BellRing,
  CalendarDays,
  Check,
  CheckCheck,
  ChevronDown,
  Clock3,
  ClipboardCheck,
  Loader2,
  RefreshCw,
  Save,
  School,
  Search,
  Sparkles,
  Users,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";
import { formatDate } from "@/lib/utils";
import { useClasses } from "@/app/modules/class/useClasses";
import { useStudents } from "@/app/modules/student/useStudents";
import { useTeachers } from "@/app/modules/teachers/useTeachers";
import { attendanceService } from "@/app/modules/attendence/attendance.service";
import { Attendance, AttendanceStatus, TakeAttendancePayload } from "@/app/modules/attendence/attendance.types";
import { useAttendancesByClassAndDate, useTakeAttendance } from "@/app/modules/attendence/useAttendance";

type TeacherProfile = {
  id: string;
  name?: string;
  sectionTeacher?: Array<{
    id: string;
    class?: { id: string; name: string };
  }>;
};

type StudentLike = {
  id: string;
  name: string;
  rollNumber?: string | number;
  classId?: string;
  sectionId?: string;
};

type AttendanceRecord = Attendance & {
  student?: {
    id: string;
    name: string;
    rollNumber?: string | number;
    photo?: string | null;
  };
};

type DraftEntry = {
  studentId: string;
  attendanceId?: string;
  name: string;
  rollNumber: string;
  status: AttendanceStatus;
  isExisting: boolean;
};

type RosterCardProps = {
  initialEntries: DraftEntry[];
  date: string;
  classLabel: string;
  sectionLabel: string;
  hasExistingAttendance: boolean;
  attendancePercent: number;
  onSubmit: (entries: DraftEntry[]) => Promise<void>;
};

const statusMeta: Record<
  AttendanceStatus,
  { label: string; badge: string; soft: string; ring: string; icon: typeof Check }
> = {
  PRESENT: {
    label: "Present",
    badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-200/70 dark:border-emerald-500/20",
    soft: "bg-emerald-50/80 dark:bg-emerald-500/10",
    ring: "ring-emerald-400/40",
    icon: Check,
  },
  ABSENT: {
    label: "Absent",
    badge: "bg-rose-500/10 text-rose-600 dark:text-rose-300 border-rose-200/70 dark:border-rose-500/20",
    soft: "bg-rose-50/80 dark:bg-rose-500/10",
    ring: "ring-rose-400/40",
    icon: Bell,
  },
  LATE: {
    label: "Late",
    badge: "bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-200/70 dark:border-amber-500/20",
    soft: "bg-amber-50/80 dark:bg-amber-500/10",
    ring: "ring-amber-400/40",
    icon: Clock3,
  },
};

function normalizeRoll(value?: string | number) {
  if (value === undefined || value === null || value === "") return Number.POSITIVE_INFINITY;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : Number.POSITIVE_INFINITY;
}

function buildStudentDraft(students: StudentLike[]): DraftEntry[] {
  return [...students]
    .sort((a, b) => normalizeRoll(a.rollNumber) - normalizeRoll(b.rollNumber))
    .map((student) => ({
      studentId: student.id,
      name: student.name,
      rollNumber: student.rollNumber ? String(student.rollNumber) : "—",
      status: "PRESENT" as AttendanceStatus,
      isExisting: false,
    }));
}

function buildAttendanceDraft(records: AttendanceRecord[]): DraftEntry[] {
  return [...records]
    .sort((a, b) => normalizeRoll(a.student?.rollNumber) - normalizeRoll(b.student?.rollNumber))
    .map((record) => ({
      studentId: record.studentId,
      attendanceId: record.id,
      name: record.student?.name ?? "Student",
      rollNumber: record.student?.rollNumber ? String(record.student.rollNumber) : "—",
      status: record.status,
      isExisting: true,
    }));
}

function RosterCard({
  initialEntries,
  date,
  classLabel,
  sectionLabel,
  hasExistingAttendance,
  attendancePercent,
  onSubmit,
}: RosterCardProps) {
  const [entries, setEntries] = useState<DraftEntry[]>(initialEntries);
  const [search, setSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const rosterCount = entries.length;
  const presentCount = entries.filter((entry) => entry.status === "PRESENT").length;
  const absentCount = entries.filter((entry) => entry.status === "ABSENT").length;
  const lateCount = entries.filter((entry) => entry.status === "LATE").length;

  const filteredEntries = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((entry) => {
      return (
        entry.name.toLowerCase().includes(q) ||
        entry.studentId.toLowerCase().includes(q) ||
        entry.rollNumber.toLowerCase().includes(q)
      );
    });
  }, [entries, search]);

  const applyStatus = (studentId: string, status: AttendanceStatus) => {
    setEntries((prev) => prev.map((entry) => (entry.studentId === studentId ? { ...entry, status } : entry)));
  };

  const applyAll = (status: AttendanceStatus) => {
    setEntries((prev) => prev.map((entry) => ({ ...entry, status })));
  };

  const resetLocal = () => {
    setEntries(initialEntries);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit(entries);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-3xl border border-white/40 dark:border-white/10 bg-white/65 dark:bg-white/5 backdrop-blur-sm shadow-sm overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-white/40 dark:border-white/10 flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white">Student roster</h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {classLabel} • {sectionLabel} • {attendancePercent}% filled • {rosterCount} students
          </p>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {hasExistingAttendance
              ? "Loaded from backend. Update statuses and save changes."
              : "Mark students, then save attendance to the backend."}
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or roll"
            className="w-full rounded-2xl border border-white/40 dark:border-white/10 bg-white/80 dark:bg-slate-950/40 pl-10 pr-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-400/30"
          />
        </div>

        <button
          onClick={resetLocal}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/70 dark:bg-white/5 border border-white/40 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-white/90 dark:hover:bg-white/10 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reset
        </button>
      </div>

      <div className="p-4 sm:p-5 border-b border-white/40 dark:border-white/10">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Quick mark</span>
          {(["PRESENT", "ABSENT", "LATE"] as AttendanceStatus[]).map((status) => {
            const meta = statusMeta[status];
            return (
              <button
                key={status}
                onClick={() => applyAll(status)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold transition-colors ${meta.badge} hover:opacity-90`}
              >
                <meta.icon className="w-3.5 h-3.5" />
                All {meta.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="divide-y divide-white/40 dark:divide-white/10 max-h-[45vh] overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {filteredEntries.map((entry, index) => (
            <motion.div
              key={entry.studentId}
              layout
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -30, scale: 0.98 }}
              transition={{ delay: index * 0.03, type: "spring", stiffness: 120, damping: 18 }}
              className={`group flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 sm:p-5 transition-all duration-300 ${
                entry.status === "PRESENT"
                  ? "bg-emerald-50/30 dark:bg-emerald-500/5"
                  : entry.status === "ABSENT"
                    ? "bg-rose-50/30 dark:bg-rose-500/5"
                    : "bg-amber-50/30 dark:bg-amber-500/5"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${statusMeta[entry.status].soft} ring-1 ${statusMeta[entry.status].ring}`}>
                  <UserRound className="w-5 h-5 text-slate-700 dark:text-white" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm sm:text-base font-semibold text-slate-800 dark:text-white truncate">
                      {entry.name}
                    </h3>
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/40 dark:border-white/10 bg-white/70 dark:bg-white/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Roll {entry.rollNumber}
                    </span>
                    {entry.isExisting && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-indigo-200/60 dark:border-indigo-500/20 bg-indigo-50/80 dark:bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-300">
                        Saved
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Student ID {entry.studentId}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {(["PRESENT", "ABSENT", "LATE"] as AttendanceStatus[]).map((status) => {
                  const meta = statusMeta[status];
                  const active = entry.status === status;
                  return (
                    <button
                      key={status}
                      onClick={() => applyStatus(entry.studentId, status)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold transition-all ${
                        active
                          ? `${meta.badge} shadow-sm`
                          : "bg-white/70 dark:bg-white/5 border-white/40 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-white/90 dark:hover:bg-white/10"
                      }`}
                    >
                      <meta.icon className="w-3.5 h-3.5" />
                      {meta.label}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredEntries.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="w-20 h-20 rounded-full bg-gradient-to-br from-sky-100 via-indigo-100 to-violet-100 dark:from-sky-500/10 dark:via-indigo-500/10 dark:to-violet-500/10 flex items-center justify-center mb-4 ring-1 ring-indigo-200/60 dark:ring-indigo-400/20"
            >
              <Users className="w-10 h-10 text-indigo-400" />
            </motion.div>
            <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">No students found</h3>
            <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
              Select a class and section, or clear the search filter.
            </p>
          </div>
        )}
      </div>

      <div className="p-4 sm:p-5 border-t border-white/40 dark:border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-500" />
            Present {presentCount}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5 text-rose-500" />
            Absent {absentCount}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock3 className="w-3.5 h-3.5 text-amber-500" />
            Late {lateCount}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5 text-indigo-500" />
            {date}
          </span>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {hasExistingAttendance ? "Update attendance" : "Save attendance"}
        </button>
      </div>
    </div>
  );
}

export default function Page() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { role } = useAuth();
  const { data: classes, isLoading: classesLoading } = useClasses();
  const { data: students, isLoading: studentsLoading } = useStudents();
  const { data: teachers } = useTeachers();
  const takeAttendance = useTakeAttendance();

  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

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
        if ((payload as TeacherProfile | null)?.id && role === "TEACHER") {
          setTeacherId((payload as TeacherProfile).id);
        }
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
    return new Set((profile?.sectionTeacher ?? []).map((entry) => entry.class?.id).filter(Boolean) as string[]);
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
  }, [assignedClassIds, classes, role]);

  const effectiveClassId = classId || availableClasses[0]?.id || "";
  const selectedClass = useMemo(
    () => availableClasses.find((cls) => cls.id === effectiveClassId),
    [availableClasses, effectiveClassId]
  );

  const availableSections = useMemo(() => {
    const sections = selectedClass?.sections ?? [];
    if (role === "TEACHER") {
      const assignedSectionIds = new Set((profile?.sectionTeacher ?? []).map((entry) => entry.id).filter(Boolean) as string[]);
      if (assignedSectionIds.size > 0) {
        return sections.filter((section) => assignedSectionIds.has(section.id));
      }
      return [];
    }
    return sections;
  }, [profile, role, selectedClass]);

  const effectiveSectionId = sectionId || availableSections[0]?.id || "";
  const effectiveTeacherId = teacherId || (Array.isArray(teachers) ? teachers[0]?.id ?? "" : "");

  const attendanceQuery = useAttendancesByClassAndDate(effectiveClassId, effectiveSectionId, date);

  const baseEntries = useMemo(() => {
    const records = (attendanceQuery.data ?? []) as AttendanceRecord[];
    if (records.length > 0) {
      return buildAttendanceDraft(records);
    }

    const roster = Array.isArray(students)
      ? students.filter((student: StudentLike) => {
          const matchesClass = !effectiveClassId || student.classId === effectiveClassId;
          const matchesSection = !effectiveSectionId || student.sectionId === effectiveSectionId;
          return matchesClass && matchesSection;
        })
      : [];

    return buildStudentDraft(roster);
  }, [attendanceQuery.data, effectiveClassId, effectiveSectionId, students]);

  const hasExistingAttendance = (attendanceQuery.data ?? []).length > 0;
  const attendancePercent = baseEntries.length > 0 ? Math.round((baseEntries.filter((entry) => entry.status === "PRESENT").length / baseEntries.length) * 100) : 0;

  const handleSubmit = async (entries: DraftEntry[]) => {
    if (!effectiveClassId || !effectiveSectionId || !date) {
      toast.error("Please select class, section and date");
      return;
    }

    if (role === "SCHOOL_ADMIN" && !effectiveTeacherId) {
      toast.error("Please select a teacher");
      return;
    }

    if (!entries.length) {
      toast.error("No students found for this class/section");
      return;
    }

    try {
      if (hasExistingAttendance) {
        const existingMap = new Map((attendanceQuery.data ?? []).map((record) => [record.studentId, record]));
        const changedEntries = entries.filter((entry) => {
          const original = existingMap.get(entry.studentId);
          return !original || original.status !== entry.status;
        });

        if (changedEntries.length === 0) {
          toast.info("No changes to save");
          return;
        }

        await Promise.all(
          changedEntries.map((entry) => {
            const original = existingMap.get(entry.studentId);
            if (!original) return Promise.resolve();
            return attendanceService.update(original.id, entry.status);
          })
        );

        await queryClient.invalidateQueries({ queryKey: ["attendances"] });
        toast.success("Attendance updated successfully");
        return;
      }

      const payload: TakeAttendancePayload = {
        classId: effectiveClassId,
        sectionId: effectiveSectionId,
        date,
        entries: entries.map((entry) => ({
          studentId: entry.studentId,
          status: entry.status,
        })),
        ...(role === "TEACHER" && profile?.id ? { teacherId: profile.id } : {}),
        ...(role === "SCHOOL_ADMIN" && effectiveTeacherId ? { teacherId: effectiveTeacherId } : {}),
      };

      await takeAttendance.mutateAsync(payload);
      await queryClient.invalidateQueries({ queryKey: ["attendances"] });
      toast.success("Attendance saved successfully");
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? ((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Failed to save attendance")
          : err instanceof Error && err.message
            ? err.message
            : "Failed to save attendance";
      toast.error(message);
    }
  };

  const busy =
    classesLoading ||
    studentsLoading ||
    profileLoading ||
    attendanceQuery.isLoading ||
    takeAttendance.isPending;

  if (busy && !baseEntries.length) {
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
                  {hasExistingAttendance ? (
                    <BellRing className="w-6 h-6 text-white" />
                  ) : (
                    <ClipboardCheck className="w-6 h-6 text-white" />
                  )}
                  <motion.div
                    className="absolute inset-0 rounded-2xl border-2 border-white/40 dark:border-white/20"
                    animate={{ scale: [1, 1.12, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2.4, repeat: Infinity }}
                  />
                </motion.div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    Attendance Center
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    {hasExistingAttendance
                      ? "Existing attendance loaded. You can update individual statuses."
                      : "Select a class, load students, and save daily attendance."}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/70 dark:bg-white/5 border border-white/40 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <CalendarDays className="w-3.5 h-3.5 text-indigo-500" />
                  {formatDate(date)}
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4">
              {[
                { label: "Total", value: baseEntries.length, icon: Users, tint: "from-sky-400 to-indigo-500" },
                { label: "Present", value: baseEntries.filter((entry) => entry.status === "PRESENT").length, icon: CheckCheck, tint: "from-emerald-400 to-green-500" },
                { label: "Absent", value: baseEntries.filter((entry) => entry.status === "ABSENT").length, icon: Bell, tint: "from-rose-400 to-red-500" },
                { label: "Late", value: baseEntries.filter((entry) => entry.status === "LATE").length, icon: Clock3, tint: "from-amber-400 to-orange-500" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.label}
                    whileHover={{ y: -2, scale: 1.01 }}
                    className="rounded-2xl border border-white/40 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-sm p-4 shadow-sm"
                  >
                    <div className={`w-11 h-11 rounded-2xl mb-3 flex items-center justify-center bg-gradient-to-br ${item.tint} text-white shadow-lg`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">{item.label}</p>
                    <p className="mt-2 text-2xl font-bold text-slate-800 dark:text-white">{item.value}</p>
                  </motion.div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-4">
              <div className="rounded-3xl border border-white/40 dark:border-white/10 bg-white/65 dark:bg-white/5 backdrop-blur-sm p-4 sm:p-5 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Class</label>
                    <div className="relative">
                      <select
                        value={classId || effectiveClassId}
                        onChange={(e) => setClassId(e.target.value)}
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
                    <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Section</label>
                    <div className="relative">
                      <select
                        value={sectionId || effectiveSectionId}
                        onChange={(e) => setSectionId(e.target.value)}
                        className="w-full appearance-none rounded-2xl border border-white/40 dark:border-white/10 bg-white/80 dark:bg-slate-950/40 px-4 py-3 pr-10 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-400/30"
                      >
                        <option value="">Select section</option>
                        {availableSections.map((section) => (
                          <option key={section.id} value={section.id}>
                            {section.name} {section.maxCapacity ? `(max ${section.maxCapacity})` : ""}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>
                  </div>

                  {role !== "TEACHER" && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Teacher</label>
                      <div className="relative">
                        <select
                          value={teacherId || effectiveTeacherId}
                          onChange={(e) => setTeacherId(e.target.value)}
                          className="w-full appearance-none rounded-2xl border border-white/40 dark:border-white/10 bg-white/80 dark:bg-slate-950/40 px-4 py-3 pr-10 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-400/30"
                        >
                          <option value="">Select teacher</option>
                          {(Array.isArray(teachers) ? teachers : []).map((teacher) => (
                            <option key={teacher.id} value={teacher.id}>
                              {teacher.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Date</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full rounded-2xl border border-white/40 dark:border-white/10 bg-white/80 dark:bg-slate-950/40 px-4 py-3 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-400/30"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/40 dark:border-white/10 bg-gradient-to-br from-sky-50/90 via-indigo-50/70 to-violet-50/90 dark:from-sky-500/10 dark:via-indigo-500/10 dark:to-violet-500/10 backdrop-blur-sm p-4 sm:p-5 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-400 via-indigo-400 to-violet-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30">
                    <School className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">Live class snapshot</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {hasExistingAttendance ? "Loaded from backend record" : "Draft roster from student list"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4">
                  <div className="rounded-2xl bg-white/70 dark:bg-white/5 border border-white/40 dark:border-white/10 p-3 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Filled</p>
                    <p className="mt-1 text-lg font-bold text-slate-800 dark:text-white">{attendancePercent}%</p>
                  </div>
                  <div className="rounded-2xl bg-white/70 dark:bg-white/5 border border-white/40 dark:border-white/10 p-3 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Status</p>
                    <p className="mt-1 text-sm font-bold text-slate-800 dark:text-white">
                      {hasExistingAttendance ? "Editing" : "Taking"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/70 dark:bg-white/5 border border-white/40 dark:border-white/10 p-3 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Roster</p>
                    <p className="mt-1 text-sm font-bold text-slate-800 dark:text-white">{baseEntries.length}</p>
                  </div>
                </div>
              </div>
            </div>

            <RosterCard
              key={`${effectiveClassId}:${effectiveSectionId}:${date}:${attendanceQuery.data?.length ?? 0}`}
              initialEntries={baseEntries}
              date={date}
              classLabel={selectedClass?.name ?? "Class"}
              sectionLabel={availableSections.find((section) => section.id === effectiveSectionId)?.name ?? "Section"}
              hasExistingAttendance={hasExistingAttendance}
              attendancePercent={attendancePercent}
              onSubmit={handleSubmit}
            />
          </div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 1 }}
          className="mt-6 text-center text-[10px] font-bold tracking-[0.3em] uppercase text-slate-400 dark:text-slate-600"
        >
          Teacher Attendance Center
        </motion.p>
      </motion.div>
    </div>
  );
}
