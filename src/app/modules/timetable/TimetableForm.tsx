"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import {
  X,
  CalendarDays,
  Clock,
  Users,
  BookOpen,
  GraduationCap,
  Sparkles,
  Loader2,
} from "lucide-react";
import { useCreateTimetable, useUpdateTimetable } from "./useTimetable";
import { useClasses } from "../class/useClasses";
import { useSubjects } from "../subject/useSubjects";
import { useTeachers } from "../teachers/useTeachers";
import { Timetable } from "./timetable.types";

const schema = z.object({
  classId:   z.string().min(1, "Class select করো"),
  subjectId: z.string().min(1, "Subject select করো"),
  teacherId: z.string().min(1, "Teacher select করো"),
  dayOfWeek: z.enum([
    "SATURDAY", "SUNDAY", "MONDAY",
    "TUESDAY", "WEDNESDAY", "THURSDAY",
  ]),
  startTime: z.string().min(1, "Start time দাও"),
  endTime:   z.string().min(1, "End time দাও"),
});

type FormData = z.infer<typeof schema>;

interface Props {
  timetable?: Timetable | null;
  onClose: () => void;
}

export default function TimetableForm({ timetable, onClose }: Props) {
  const { mutate: create, isPending: creating } = useCreateTimetable();
  const { mutate: update, isPending: updating } = useUpdateTimetable();
  const { data: classes }  = useClasses();
  const { data: subjects } = useSubjects();
  const { data: teachers } = useTeachers();

  const { register, handleSubmit, reset, formState: { errors } } =
    useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (timetable) {
      reset({
        classId:   timetable.classId,
        subjectId: timetable.subjectId,
        teacherId: timetable.teacherId,
        dayOfWeek: timetable.dayOfWeek,
        startTime: timetable.startTime,
        endTime:   timetable.endTime,
      });
    }
  }, [timetable, reset]);

  const onSubmit = (data: FormData) => {
    if (timetable) {
      update({ id: timetable.id, data }, { onSuccess: onClose });
    } else {
      create(data, { onSuccess: onClose });
    }
  };

  const isLoading = creating || updating;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Animated background orbs */}
      <motion.div
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-20 left-1/4 w-64 h-64 bg-sky-500/20 rounded-full blur-3xl pointer-events-none"
      />
      <motion.div
        animate={{ x: [0, -20, 0], y: [0, 30, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-20 right-1/4 w-72 h-72 bg-violet-500/20 rounded-full blur-3xl pointer-events-none"
      />

      {/* Modal Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative w-full max-w-lg bg-white dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-sky-50 via-indigo-50 to-violet-50 dark:from-sky-500/20 dark:via-indigo-500/20 dark:to-violet-500/20 border-b border-slate-200 dark:border-white/10 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ rotate: -10 }}
                animate={{ rotate: [0, -8, 8, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg"
              >
                <CalendarDays className="w-5 h-5 text-white" />
              </motion.div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {timetable ? "Timetable Edit" : "নতুন Class যোগ করো"}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Class schedule manage করো</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 flex items-center justify-center text-slate-400 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Class */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              <GraduationCap className="w-4 h-4 text-sky-400" />
              Class
            </label>
            <select
              {...register("classId")}
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 dark:focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/20 transition-all appearance-none cursor-pointer"
            >
              <option value="">Select Class</option>
              {classes?.map((cls) => (
                <option key={cls.id} value={cls.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  {cls.name} {cls.sections && cls.sections.length > 0 ? `(${cls.sections.length} sections)` : ""}
                </option>
              ))}
            </select>
            {errors.classId && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-red-500 dark:text-red-400 mt-1"
              >
                {errors.classId.message}
              </motion.p>
            )}
          </div>

          {/* Subject */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              Subject
            </label>
            <select
              {...register("subjectId")}
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all appearance-none cursor-pointer"
            >
              <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Select Subject</option>
              {subjects?.map((sub) => (
                <option key={sub.id} value={sub.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  {sub.name}
                </option>
              ))}
            </select>
            {errors.subjectId && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-red-500 dark:text-red-400 mt-1"
              >
                {errors.subjectId.message}
              </motion.p>
            )}
          </div>

          {/* Teacher */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              <Users className="w-4 h-4 text-violet-400" />
              Teacher
            </label>
            <select
              {...register("teacherId")}
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-violet-500 dark:focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all appearance-none cursor-pointer"
            >
              <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Select Teacher</option>
              {teachers?.map((t) => (
                <option key={t.id} value={t.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  {t.name}
                </option>
              ))}
            </select>
            {errors.teacherId && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-red-500 dark:text-red-400 mt-1"
              >
                {errors.teacherId.message}
              </motion.p>
            )}
          </div>

          {/* Day */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              <CalendarDays className="w-4 h-4 text-sky-400" />
              দিন
            </label>
            <select
              {...register("dayOfWeek")}
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 dark:focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/20 transition-all appearance-none cursor-pointer"
            >
              <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Select Day</option>
              <option value="SATURDAY">শনিবার</option>
              <option value="SUNDAY">রবিবার</option>
              <option value="MONDAY">সোমবার</option>
              <option value="TUESDAY">মঙ্গলবার</option>
              <option value="WEDNESDAY">বুধবার</option>
              <option value="THURSDAY">বৃহস্পতিবার</option>
            </select>
            {errors.dayOfWeek && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-red-500 dark:text-red-400 mt-1"
              >
                {errors.dayOfWeek.message}
              </motion.p>
            )}
          </div>

          {/* Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                <Clock className="w-4 h-4 text-indigo-400" />
                Start Time
              </label>
              <input
                type="time"
                {...register("startTime")}
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
              />
              {errors.startTime && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-red-500 dark:text-red-400 mt-1"
                >
                  {errors.startTime.message}
                </motion.p>
              )}
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                <Clock className="w-4 h-4 text-violet-400" />
                End Time
              </label>
              <input
                type="time"
                {...register("endTime")}
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-violet-500 dark:focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
              />
              {errors.endTime && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-red-500 dark:text-red-400 mt-1"
                >
                  {errors.endTime.message}
                </motion.p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="flex-1 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-900 dark:text-slate-200 py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              Cancel
            </motion.button>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 hover:from-sky-600 hover:via-indigo-600 hover:to-violet-600 text-white py-2.5 rounded-xl text-sm font-medium shadow-lg shadow-indigo-500/25 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  {timetable ? "Update" : "Add"}
                </>
              )}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
