"use client";

import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLenis } from "@/hooks/useLenis";
import { useAuth } from "@/hooks/useAuth";
import { timetableService } from "@/app/modules/timetable/timetable.service";
import { classService } from "@/app/modules/class/class.service";
import { teacherService } from "@/app/modules/teachers/teacher.service";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Calendar,
  Clock,
  GraduationCap,
  UserCheck,
  RefreshCcw,
} from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

type ConflictEntry = {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  classId: string;
  className: string;
  sectionName?: string;
  subjectName?: string;
  teacherId: string;
  teacherName: string;
  conflictType: "TEACHER_DOUBLE_BOOKED" | "CLASS_DOUBLE_BOOKED";
  conflictingSlotId: string;
  conflictingClassName?: string;
  conflictingTeacherName?: string;
};

const DAY_LABEL: Record<string, string> = {
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
};

export default function RoutineConflictsPage() {
  useLenis();
  const router = useRouter();
  const { role } = useAuth();

  const [selectedClassId, setSelectedClassId] = useState("");
  const [conflicts, setConflicts] = useState<ConflictEntry[]>([]);
  const [analyzing, setAnalyzing] = useState(false);

  const { data: classes = [], isLoading: classesLoading } = useQuery({
    queryKey: ["classes"],
    queryFn: classService.getAll,
  });

  const { data: allSlots = [], isLoading: slotsLoading } = useQuery({
    queryKey: ["timetable", "all"],
    queryFn: async () => {
      const data = await timetableService.getAll();
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ["teachers"],
    queryFn: () => teacherService.getAll(),
  });

  useEffect(() => {
    if (role && role !== "EXAM_CONTROLLER" && role !== "SCHOOL_ADMIN") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  const teacherMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const t of teachers as any[]) {
      map[t.id] = t.user?.name ?? t.name ?? "Unknown";
    }
    return map;
  }, [teachers]);

  const classMap = useMemo(() => {
    const map: Record<string, { name: string; sectionName?: string }> = {};
    for (const c of classes as any[]) {
      map[c.id] = { name: c.name };
      if (c.sections?.length) {
        map[c.id] = { name: c.name, sectionName: c.sections[0]?.name };
      }
    }
    return map;
  }, [classes]);

  const analyzeConflicts = () => {
    setAnalyzing(true);
    try {
      const slots = selectedClassId
        ? allSlots.filter((s: any) => s.classId === selectedClassId)
        : allSlots;

      const found: ConflictEntry[] = [];
      const byTeacher = new Map<string, any[]>();
      const byClass = new Map<string, any[]>();

      for (const slot of slots) {
        const tKey = `${slot.teacherId}:${slot.dayOfWeek}`;
        const cKey = `${slot.classId}:${slot.dayOfWeek}`;
        (byTeacher.get(tKey) ?? byTeacher.set(tKey, []).get(tKey)!).push(slot);
        (byClass.get(cKey) ?? byClass.set(cKey, []).get(cKey)!).push(slot);
      }

      for (const [key, slotsForTeacher] of byTeacher) {
        for (let i = 0; i < slotsForTeacher.length; i++) {
          for (let j = i + 1; j < slotsForTeacher.length; j++) {
            const a = slotsForTeacher[i];
            const b = slotsForTeacher[j];
            if (a.startTime < b.endTime && a.endTime > b.startTime) {
              found.push({
                id: a.id,
                dayOfWeek: a.dayOfWeek,
                startTime: a.startTime,
                endTime: a.endTime,
                classId: a.classId,
                className: classMap[a.classId]?.name ?? "Unknown",
                sectionName: classMap[a.classId]?.sectionName,
                subjectName: a.subject?.name,
                teacherId: a.teacherId,
                teacherName: teacherMap[a.teacherId] ?? "Unknown",
                conflictType: "TEACHER_DOUBLE_BOOKED",
                conflictingSlotId: b.id,
                conflictingClassName: classMap[b.classId]?.name,
                conflictingTeacherName: teacherMap[b.teacherId],
              });
            }
          }
        }
      }

      for (const [key, slotsForClass] of byClass) {
        if (slotsForClass.length <= 1) continue;
        for (let i = 0; i < slotsForClass.length; i++) {
          for (let j = i + 1; j < slotsForClass.length; j++) {
            const a = slotsForClass[i];
            const b = slotsForClass[j];
            if (a.startTime < b.endTime && a.endTime > b.startTime) {
              found.push({
                id: a.id,
                dayOfWeek: a.dayOfWeek,
                startTime: a.startTime,
                endTime: a.endTime,
                classId: a.classId,
                className: classMap[a.classId]?.name ?? "Unknown",
                sectionName: classMap[a.classId]?.sectionName,
                subjectName: a.subject?.name,
                teacherId: a.teacherId,
                teacherName: teacherMap[a.teacherId] ?? "Unknown",
                conflictType: "CLASS_DOUBLE_BOOKED",
                conflictingSlotId: b.id,
                conflictingClassName: classMap[b.classId]?.name,
                conflictingTeacherName: teacherMap[b.teacherId],
              });
            }
          }
        }
      }

      const unique = new Map<string, ConflictEntry>();
      for (const c of found) {
        const k = `${c.id}-${c.conflictingSlotId}-${c.conflictType}`;
        if (!unique.has(k)) unique.set(k, c);
      }

      setConflicts(Array.from(unique.values()));
      if (unique.size === 0) {
        toast.success("No conflicts detected!");
      } else {
        toast.warning(`Found ${unique.size} conflict(s)`);
      }
    } catch {
      toast.error("Failed to analyze conflicts");
    } finally {
      setAnalyzing(false);
    }
  };

  const isLoading = classesLoading || slotsLoading;

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

      <div className="relative w-full max-w-5xl my-8 space-y-6">
        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/10 shadow-2xl shadow-slate-200/40 dark:shadow-none overflow-hidden">
          <div className="relative px-6 sm:px-8 py-6 bg-gradient-to-r from-rose-50 via-orange-50 to-amber-50 dark:from-rose-500/10 dark:via-orange-500/10 dark:to-amber-500/10 border-b border-white/40 dark:border-white/5 overflow-hidden">
            <motion.div
              animate={{ x: [0, 100, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none"
            />
            <div className="relative flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  Routine Conflicts
                  <motion.span
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="text-rose-400"
                  >
                    <AlertTriangle className="w-5 h-5" />
                  </motion.span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Detect teacher double-bookings and class scheduling overlaps
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={analyzeConflicts}
                disabled={analyzing || slotsLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-rose-500/25 hover:bg-rose-700 disabled:opacity-50 cursor-pointer"
              >
                {analyzing ? (
                  <>
                    <RefreshCcw className="h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4" />
                    Analyze Conflicts
                  </>
                )}
              </motion.button>
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-5">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[200px]">
                <select
                  value={selectedClassId}
                  onChange={(e) => {
                    setSelectedClassId(e.target.value);
                    setConflicts([]);
                  }}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-white/5 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-400/50"
                >
                  <option value="">All Classes (analyze all)</option>
                  {classes.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {conflicts.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 dark:bg-rose-500/10 px-3 py-1.5 text-rose-700 dark:text-rose-300 font-medium">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {conflicts.length} conflict{conflicts.length !== 1 ? "s" : ""} found
                  </span>
                )}
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-2xl" />
                ))}
              </div>
            ) : conflicts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="h-16 w-16 rounded-full bg-gradient-to-br from-emerald-100 via-teal-100 to-cyan-100 dark:from-emerald-500/10 dark:via-teal-500/10 dark:to-cyan-500/10 flex items-center justify-center mb-4 ring-1 ring-emerald-200/60 dark:ring-emerald-400/20"
                >
                  <Calendar className="h-7 w-7 text-emerald-500" />
                </motion.div>
                <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">
                  No conflicts detected
                </h3>
                <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
                  Select a class or click "Analyze Conflicts" to scan the full timetable.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {conflicts.map((conflict, idx) => (
                  <motion.div
                    key={`${conflict.id}-${conflict.conflictingSlotId}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className={`rounded-xl border p-4 ${
                      conflict.conflictType === "TEACHER_DOUBLE_BOOKED"
                        ? "border-amber-200 dark:border-amber-500/30 bg-amber-50/60 dark:bg-amber-500/5"
                        : "border-rose-200 dark:border-rose-500/30 bg-rose-50/60 dark:bg-rose-500/5"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex rounded-lg px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                              conflict.conflictType === "TEACHER_DOUBLE_BOOKED"
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
                                : "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
                            }`}
                          >
                            {conflict.conflictType === "TEACHER_DOUBLE_BOOKED"
                              ? "Teacher Double-Booked"
                              : "Class Double-Booked"}
                          </span>
                          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            {DAY_LABEL[conflict.dayOfWeek] ?? conflict.dayOfWeek}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {conflict.teacherName} — {conflict.className} ({conflict.sectionName ?? ""})
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          Subject: <b>{conflict.subjectName ?? "—"}</b> · Time:{" "}
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {conflict.startTime} – {conflict.endTime}
                          </span>
                        </p>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 text-right space-y-0.5">
                        <p>
                          Conflicts with: <b>{conflict.conflictingClassName ?? "—"}</b>
                        </p>
                        <p>Teacher: {conflict.conflictingTeacherName ?? "—"}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
