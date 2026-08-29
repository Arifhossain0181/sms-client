/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ClipboardList,
  BookOpen,
  GraduationCap,
  Calendar,
  Clock,
  Target,
  Sparkles,
  Save,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useCreateExam, useUpdateExam } from "./useExams";
import { useClasses } from "../class/useClasses";
import { useSubjects } from "../subject/useSubjects";
import { Exam } from "./exam.types";

const schema = z.object({
  name: z.string().min(1, "Enter the exam name"),
  subjectId: z.string().min(1, "Select a subject"),
  classId: z.string().min(1, "Select a class"),
  date: z.string().min(1, "Enter the date"),
  startTime: z.string().min(1, "Enter the start time"),
  endTime: z.string().min(1, "Enter the end time"),
  totalMarks: z.coerce.number().min(1, "Enter the total marks"),
});

type FormInput = z.input<typeof schema>;
type FormData = z.output<typeof schema>;

interface Props {
  exam?: Exam | null;
  onClose: () => void;
}

const backdropVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 } };

const modalVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const },
  },
  exit: { opacity: 0, y: 20, scale: 0.96, transition: { duration: 0.2 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.05 + i * 0.04, duration: 0.3, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const fieldBase =
  "peer w-full h-12 px-4 pt-4 pb-1 rounded-xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-slate-700/60 text-sm text-slate-900 dark:text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/60 transition-all";

const selectBase =
  "w-full h-12 px-4 pr-11 rounded-xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-slate-700/60 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/60 transition-all appearance-none";

const floatLabelBase =
  "absolute left-4 top-3.5 text-xs text-slate-500 dark:text-slate-400 transition-all pointer-events-none peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-indigo-600 dark:peer-focus:text-indigo-400 peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:text-[10px]";

function ErrorMsg({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 flex items-center gap-1 text-xs text-rose-500">
      <AlertCircle className="w-3 h-3" />
      {message}
    </p>
  );
}

export default function ExamForm({ exam, onClose }: Props) {
  const { mutate: create, isPending: creating } = useCreateExam();
  const { mutate: update, isPending: updating } = useUpdateExam();
  const { data: classes } = useClasses();
  const { data: subjects } = useSubjects();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormInput>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (exam) {
      reset({
        name: exam.name,
        subjectId: exam.subjectId,
        classId: exam.classId,
        date: exam.date?.slice(0, 10),
        totalMarks: exam.totalMarks,
      } as FormInput);
    }
  }, [exam, reset]);

  const onSubmit: SubmitHandler<FormInput> = (data) => {
    const parsed = data as unknown as FormData;
    if (exam) {
      update({ id: exam.id, data: parsed }, { onSuccess: onClose });
    } else {
      create(parsed, { onSuccess: onClose });
    }
  };

  const isPending = creating || updating;

  return (
    <AnimatePresence>
      <motion.div
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white/80 dark:bg-slate-900/70 backdrop-blur-2xl border border-white/40 dark:border-slate-700/50 shadow-2xl shadow-indigo-500/10"
        >
          <div className="pointer-events-none absolute -top-20 -left-20 w-48 h-48 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -right-20 w-48 h-48 rounded-full bg-fuchsia-500/20 blur-3xl" />
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 rounded-t-3xl" />

          {/* Header */}
          <div className="relative flex items-center justify-between p-6 pb-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                  <ClipboardList className="w-5 h-5 text-white" />
                </div>
                <Sparkles className="absolute -top-1 -right-1 w-3.5 h-3.5 text-amber-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                  {exam ? "Edit Exam" : "New Exam"}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {exam ? "Update the details" : "Add a new exam"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="relative px-6 pb-6 space-y-4">
            {/* Name */}
            <motion.div variants={itemVariants} custom={0} initial="hidden" animate="visible">
              <div className="relative">
                <ClipboardList className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  {...register("name")}
                  placeholder="Exam name"
                  className={`${fieldBase} pr-11`}
                />
                <label className={floatLabelBase}>Exam name</label>
              </div>
              <ErrorMsg message={errors.name?.message} />
            </motion.div>

            {/* Subject */}
            <motion.div variants={itemVariants} custom={1} initial="hidden" animate="visible">
              <div className="relative">
                <BookOpen className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <select {...register("subjectId")} className={selectBase}>
                  <option value="">Select Subject</option>
                  {subjects?.map((subject: any) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>
              <ErrorMsg message={errors.subjectId?.message} />
            </motion.div>

            {/* Class */}
            <motion.div variants={itemVariants} custom={2} initial="hidden" animate="visible">
              <div className="relative">
                <GraduationCap className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <select {...register("classId")} className={selectBase}>
                  <option value="">Select Class</option>
                  {classes?.map((cls: any) => {
                    const sectionNames = cls.sections
                      ?.map((section: any) => section.name)
                      .join(", ");
                    const sectionLabel =
                      sectionNames && sectionNames.length > 0 ? sectionNames : "—";
                    return (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} — {sectionLabel}
                      </option>
                    );
                  })}
                </select>
              </div>
              <ErrorMsg message={errors.classId?.message} />
            </motion.div>

            {/* Date */}
            <motion.div variants={itemVariants} custom={3} initial="hidden" animate="visible">
              <div className="relative">
                <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="date"
                  {...register("date")}
                  className="w-full h-12 px-4 pr-11 rounded-xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-slate-700/60 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/60 transition-all"
                />
              </div>
              <ErrorMsg message={errors.date?.message} />
            </motion.div>

            {/* Times */}
            <motion.div
              variants={itemVariants}
              custom={4}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 gap-3"
            >
              <div>
                <div className="relative">
                  <Clock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="time"
                    {...register("startTime")}
                    className="w-full h-12 px-4 pr-11 rounded-xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-slate-700/60 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/60 transition-all"
                  />
                </div>
                <p className="mt-1 text-[10px] text-slate-400 ml-1">Start Time</p>
                <ErrorMsg message={errors.startTime?.message} />
              </div>
              <div>
                <div className="relative">
                  <Clock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="time"
                    {...register("endTime")}
                    className="w-full h-12 px-4 pr-11 rounded-xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-slate-700/60 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/60 transition-all"
                  />
                </div>
                <p className="mt-1 text-[10px] text-slate-400 ml-1">End Time</p>
                <ErrorMsg message={errors.endTime?.message} />
              </div>
            </motion.div>

            {/* Total Marks */}
            <motion.div variants={itemVariants} custom={5} initial="hidden" animate="visible">
              <div className="relative">
                <Target className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  {...register("totalMarks")}
                  placeholder="Total Marks"
                  className={`${fieldBase} pr-11`}
                />
                <label className={floatLabelBase}>Total Marks</label>
              </div>
              <ErrorMsg message={errors.totalMarks?.message} />
            </motion.div>

            {/* Actions */}
            <motion.div
              variants={itemVariants}
              custom={6}
              initial="hidden"
              animate="visible"
              className="flex gap-3 pt-2"
            >
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-11 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100/80 hover:bg-slate-200/80 dark:bg-slate-800/60 dark:hover:bg-slate-800 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 h-11 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-500/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {exam ? "Update" : "Add Exam"}
                  </>
                )}
              </button>
            </motion.div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
