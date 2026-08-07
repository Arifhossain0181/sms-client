"use client";

import { useMemo, useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLenis } from "@/hooks/useLenis";
import { useAuth } from "@/hooks/useAuth";
import { timetableService } from "@/app/modules/timetable/timetable.service";
import { classService } from "@/app/modules/class/class.service";
import { subjectService } from "@/app/modules/subject/subject.service";
import { teacherService } from "@/app/modules/teachers/teacher.service";
import {
  useCreateTimetable,
  useUpdateTimetable,
  useDeleteTimetable,
} from "@/app/modules/timetable/useTimetable";
import type { Timetable } from "@/app/modules/timetable/timetable.types";
import { useRouter } from "next/navigation";
import {
  Calendar,
  ChevronDown,
  Clock,
  GraduationCap,
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  Save,
  Loader2,
  BookOpen,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const DAY_ORDER: Record<string, number> = {
  SATURDAY: 0,
  SUNDAY: 1,
  MONDAY: 2,
  TUESDAY: 3,
  WEDNESDAY: 4,
  THURSDAY: 5,
};

const DAY_LABEL: Record<string, string> = {
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
};

const DAYS = ["SATURDAY", "SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY"];

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2, delay: 0.1 } },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 40 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const, staggerChildren: 0.07, delayChildren: 0.15 },
  },
  exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.25, ease: "easeIn" as const } },
};

export default function RoutinePage() {
  useLenis();
  const router = useRouter();
  const { role } = useAuth();
  const queryClient = useQueryClient();

  const [selectedClassId, setSelectedClassId] = useState("");
  const [search, setSearch] = useState("");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<Timetable | null>(null);
  const [formDay, setFormDay] = useState("SATURDAY");
  const [formSubjectId, setFormSubjectId] = useState("");
  const [formTeacherId, setFormTeacherId] = useState("");
  const [formStartTime, setFormStartTime] = useState("");
  const [formEndTime, setFormEndTime] = useState("");

  const canManage = role === "EXAM_CONTROLLER" || role === "SCHOOL_ADMIN";

  useEffect(() => {
    if (role && role !== "EXAM_CONTROLLER" && role !== "SCHOOL_ADMIN" && role !== "TEACHER") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  // Queries
  const { data: classes = [], isLoading: classesLoading } = useQuery({
    queryKey: ["classes"],
    queryFn: classService.getAll,
  });

  const { data: weekly = {}, isLoading: routineLoading } = useQuery({
    queryKey: ["timetable", "weekly", selectedClassId],
    queryFn: async () => {
      if (!selectedClassId) return {};
      return timetableService.getClassWeekly(selectedClassId);
    },
    enabled: !!selectedClassId,
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => subjectService.getAll(),
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ["teachers"],
    queryFn: () => teacherService.getAll(),
  });

  // Mutations
  const { mutateAsync: createSlot, isPending: creating } = useCreateTimetable();
  const { mutateAsync: updateSlot, isPending: updating } = useUpdateTimetable();
  const { mutateAsync: deleteSlot, isPending: deleting } = useDeleteTimetable();

  const isMutating = creating || updating || deleting;

  // Computed data
  const flatSlots = useMemo<Timetable[]>(() => {
    const slots: Timetable[] = [];
    const days = Object.keys(weekly).sort((a, b) => (DAY_ORDER[a] ?? 99) - (DAY_ORDER[b] ?? 99));
    for (const day of days) {
      const list = (weekly as any)[day] ?? [];
      slots.push(...list);
    }
    return slots;
  }, [weekly]);

  const grouped = useMemo(() => {
    const groups = new Map<string, Timetable[]>();
    for (const slot of flatSlots) {
      const key = slot.dayOfWeek ?? "UNKNOWN";
      const list = groups.get(key) ?? [];
      list.push(slot);
      groups.set(key, list);
    }
    return groups;
  }, [flatSlots]);

  const filteredGrouped = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return grouped;
    const result = new Map<string, Timetable[]>();
    for (const [day, slots] of grouped) {
      const filtered = slots.filter((s) => {
        const subject = s.subject?.name?.toLowerCase() ?? "";
        const teacher = s.teacher?.user?.name?.toLowerCase() ?? "";
        const cls = s.class?.name?.toLowerCase() ?? "";
        const section = s.class?.section?.toLowerCase() ?? "";
        const time = `${s.startTime} - ${s.endTime}`.toLowerCase();
        return subject.includes(q) || teacher.includes(q) || cls.includes(q) || section.includes(q) || time.includes(q);
      });
      if (filtered.length > 0) result.set(day, filtered);
    }
    return result;
  }, [grouped, search]);

  const selectedClass = useMemo(() => classes.find((c: any) => c.id === selectedClassId), [classes, selectedClassId]);
  const isLoading = classesLoading || routineLoading;
  const totalSlots = flatSlots.length;

  // Handlers
  const handleOpenAdd = () => {
    setEditingSlot(null);
    setFormDay("SATURDAY");
    setFormSubjectId("");
    setFormTeacherId("");
    setFormStartTime("");
    setFormEndTime("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (slot: Timetable) => {
    setEditingSlot(slot);
    setFormDay(slot.dayOfWeek);
    setFormSubjectId(slot.subjectId ?? "");
    setFormTeacherId(slot.teacherId ?? "");
    setFormStartTime(slot.startTime ?? "");
    setFormEndTime(slot.endTime ?? "");
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("এই routine slot delete করতে চান?")) return;
    try {
      await deleteSlot(id);
      queryClient.invalidateQueries({ queryKey: ["timetable"] });
    } catch (_) {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId) return toast.error("Please select a class first");
    if (!formSubjectId) return toast.error("Please select a subject");
    if (!formTeacherId) return toast.error("Please select a teacher");
    if (!formStartTime || !formEndTime) return toast.error("Please enter start and end times");

    const payload = {
      classId: selectedClassId,
      subjectId: formSubjectId,
      teacherId: formTeacherId,
      dayOfWeek: formDay as any,
      startTime: formStartTime,
      endTime: formEndTime,
    };

    try {
      if (editingSlot) {
        await updateSlot({ id: editingSlot.id, data: payload });
      } else {
        await createSlot(payload);
      }
      queryClient.invalidateQueries({ queryKey: ["timetable"] });
      setIsModalOpen(false);
    } catch (_) {}
  };

  return (
    <div className="relative min-h-screen flex items-start justify-center p-4 sm:p-6 overflow-hidden bg-slate-50/50 dark:bg-slate-950">
      {/* Background orbs */}
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

          {/* Header */}
          <div className="relative px-6 sm:px-8 py-6 bg-gradient-to-r from-sky-50 via-indigo-50 to-violet-50 dark:from-sky-500/10 dark:via-indigo-500/10 dark:to-violet-500/10 border-b border-white/40 dark:border-white/5 overflow-hidden">
            <motion.div
              animate={{ x: [0, 100, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none"
            />
            <div className="relative flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  Class Routine
                  <motion.span
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="text-indigo-400"
                  >
                    <Calendar className="w-5 h-5" />
                  </motion.span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Weekly class routine — subject, teacher & time management
                </p>
              </div>
              <div className="flex items-center gap-3">
                {selectedClass && (
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Total Slots: <b className="text-slate-700 dark:text-slate-300">{totalSlots}</b>
                  </div>
                )}
                {canManage && selectedClassId && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleOpenAdd}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-fuchsia-600 rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Time Slot
                  </motion.button>
                )}
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="p-4 sm:p-6 space-y-5">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <select
                    value={selectedClassId}
                    onChange={(e) => { setSelectedClassId(e.target.value); setSearch(""); }}
                    className="w-full appearance-none rounded-2xl border border-white/40 dark:border-white/10 bg-white/80 dark:bg-slate-950/40 px-4 py-3 pr-10 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-400/30"
                  >
                    <option value="">Select Class</option>
                    {classes.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
              </div>

              {selectedClassId && (
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search subject, teacher, time..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-2xl border border-white/40 dark:border-white/10 bg-white/80 dark:bg-slate-950/40 pl-9 pr-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-400/30"
                  />
                </div>
              )}
            </div>

            {/* Content Area */}
            {!selectedClassId ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <GraduationCap className="w-10 h-10 text-indigo-400 mb-4" />
                <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">Select a class</h3>
                <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
                  Choose a class to view its weekly routine.
                </p>
              </div>
            ) : isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-2xl" />
                ))}
              </div>
            ) : totalSlots === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Calendar className="w-10 h-10 text-indigo-400 mb-4" />
                <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">No routine found</h3>
                <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
                  No timetable slots found for this class.
                </p>
                {canManage && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleOpenAdd}
                    className="mt-4 flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-fuchsia-600 rounded-xl shadow-lg cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Create First Slot
                  </motion.button>
                )}
              </div>
            ) : (
              <div className="space-y-8">
                {Array.from(filteredGrouped.entries()).map(([day, slots], gIdx) => (
                  <motion.div
                    key={day}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: gIdx * 0.05 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-indigo-500" />
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wide">
                        {DAY_LABEL[day] ?? day}
                      </h3>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        ({slots.length} slot{slots.length !== 1 ? "s" : ""})
                      </span>
                    </div>
                    <div className="overflow-x-auto rounded-2xl border border-white/40 dark:border-white/10">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/40 dark:border-white/10 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-white/65 dark:bg-white/5">
                            <th className="px-4 sm:px-6 py-3">Subject</th>
                            <th className="px-4 sm:px-6 py-3">Teacher</th>
                            <th className="px-4 sm:px-6 py-3">Time</th>
                            {canManage && <th className="px-4 sm:px-6 py-3 text-right">Actions</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/40 dark:divide-white/10">
                          {slots.map((slot, idx) => (
                            <motion.tr
                              key={slot.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: gIdx * 0.05 + idx * 0.02 }}
                              className="group transition-colors duration-200 hover:bg-white/60 dark:hover:bg-white/5"
                            >
                              <td className="px-4 sm:px-6 py-3.5 pl-4 font-medium text-slate-800 dark:text-white">
                                <span className="inline-flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-indigo-400 flex-shrink-0" />
                                  {slot.subject?.name ?? "—"}
                                </span>
                              </td>
                              <td className="px-4 sm:px-6 py-3.5 text-slate-600 dark:text-slate-300">
                                {slot.teacher?.user?.name ? (
                                  <span className="inline-flex items-center gap-1.5">
                                    <span className="w-6 h-6 rounded-full bg-gradient-to-br from-fuchsia-500 to-indigo-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                                      {slot.teacher.user.name.charAt(0).toUpperCase()}
                                    </span>
                                    {slot.teacher.user.name}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 italic text-xs">Not assigned</span>
                                )}
                              </td>
                              <td className="px-4 sm:px-6 py-3.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg text-indigo-600 dark:text-indigo-400">
                                  <Clock className="h-3 w-3" />
                                  {slot.startTime} - {slot.endTime}
                                </span>
                              </td>
                              {canManage && (
                                <td className="px-4 sm:px-6 py-3.5 pr-4 text-right">
                                  <div className="inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <motion.button
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      onClick={() => handleOpenEdit(slot)}
                                      className="p-1.5 rounded-lg text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                                      title="Edit"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </motion.button>
                                    <motion.button
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      onClick={() => handleDelete(slot.id)}
                                      className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 transition-colors cursor-pointer"
                                      title="Delete"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </motion.button>
                                  </div>
                                </td>
                              )}
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Slot Modal ── */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => !isMutating && setIsModalOpen(false)}
            />

            {/* Glow orbs behind modal */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <motion.div
                className="absolute -top-20 -right-20 w-72 h-72 bg-indigo-500/20 rounded-full blur-[100px]"
                animate={{ x: [0, 30, 0], y: [0, -20, 0], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute -bottom-20 -left-20 w-72 h-72 bg-fuchsia-500/20 rounded-full blur-[100px]"
                animate={{ x: [0, -20, 0], y: [0, 30, 0], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>

            <motion.div
              className="relative z-10 w-full max-w-md bg-white/90 dark:bg-slate-900/80 backdrop-blur-2xl rounded-3xl border border-gray-200 dark:border-white/10 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.3)] overflow-hidden"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {/* Gradient top bar */}
              <div className="h-1.5 bg-gradient-to-r from-indigo-600 via-fuchsia-500 to-pink-500" />

              {/* Modal Header */}
              <div className="relative px-7 pt-7 pb-5 border-b border-gray-200 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      {editingSlot ? "Slot Edit" : "নতুন Routine Slot"}
                      <Sparkles className="w-4 h-4 text-indigo-500" />
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {editingSlot
                        ? "Slot details update করুন ও teacher assign করুন"
                        : "Day, subject, teacher ও time select করুন"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => !isMutating && setIsModalOpen(false)}
                  disabled={isMutating}
                  className="absolute right-5 top-6 w-9 h-9 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
                >
                  <X className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSubmit} className="p-7 space-y-4">

                {/* Day of Week */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                    Day of Week
                  </label>
                  <div className="relative">
                    <select
                      value={formDay}
                      onChange={(e) => setFormDay(e.target.value)}
                      className="w-full appearance-none rounded-2xl border border-white/40 dark:border-white/10 bg-white/80 dark:bg-slate-950/40 px-4 py-3 pr-10 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-400/30"
                    >
                      {DAYS.map((d) => (
                        <option key={d} value={d}>{DAY_LABEL[d]}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  </div>
                </div>

                {/* Subject */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-fuchsia-500" />
                    Subject
                  </label>
                  <div className="relative">
                    <select
                      value={formSubjectId}
                      onChange={(e) => setFormSubjectId(e.target.value)}
                      className="w-full appearance-none rounded-2xl border border-white/40 dark:border-white/10 bg-white/80 dark:bg-slate-950/40 px-4 py-3 pr-10 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-400/30"
                    >
                      <option value="">— Select Subject —</option>
                      {subjects.map((sub: any) => (
                        <option key={sub.id} value={sub.id}>{sub.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  </div>
                </div>

                {/* Teacher */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-sky-500" />
                    Assign Teacher
                  </label>
                  <div className="relative">
                    <select
                      value={formTeacherId}
                      onChange={(e) => setFormTeacherId(e.target.value)}
                      className="w-full appearance-none rounded-2xl border border-white/40 dark:border-white/10 bg-white/80 dark:bg-slate-950/40 px-4 py-3 pr-10 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-400/30"
                    >
                      <option value="">— Select Teacher —</option>
                      {teachers.map((t: any) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  </div>
                </div>

                {/* Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-500" />
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={formStartTime}
                      onChange={(e) => setFormStartTime(e.target.value)}
                      className="w-full rounded-2xl border border-white/40 dark:border-white/10 bg-white/80 dark:bg-slate-950/40 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-400/30"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-pink-500" />
                      End Time
                    </label>
                    <input
                      type="time"
                      value={formEndTime}
                      onChange={(e) => setFormEndTime(e.target.value)}
                      className="w-full rounded-2xl border border-white/40 dark:border-white/10 bg-white/80 dark:bg-slate-950/40 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-400/30"
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                  <motion.button
                    type="button"
                    disabled={isMutating}
                    whileHover={{ scale: isMutating ? 1 : 1.02 }}
                    whileTap={{ scale: isMutating ? 1 : 0.97 }}
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-5 py-3 rounded-xl border border-white/40 dark:border-white/10 bg-white/80 dark:bg-white/5 hover:bg-white/90 dark:hover:bg-white/10 text-sm font-medium text-slate-700 dark:text-slate-200 cursor-pointer disabled:opacity-50 transition-all"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    disabled={isMutating}
                    whileHover={{ scale: isMutating ? 1 : 1.02 }}
                    whileTap={{ scale: isMutating ? 1 : 0.97 }}
                    className="flex-1 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-pink-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-fuchsia-500/40 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 transition-all"
                  >
                    {isMutating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        {editingSlot ? "Update Slot" : "Add Slot"}
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
