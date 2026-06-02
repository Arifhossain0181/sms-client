/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  BookOpen,
  Hash,
  GraduationCap,
  Target,
  CheckCircle2,
  Sparkles,
  Save,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useCreateSubject, useUpdateSubject } from "./useSubjects";
import { useClasses } from "../class/useClasses";
import { Subject } from "./subject.types";

const schema = z.object({
  name: z.string().min(1, "Subject নাম দাও"),
  code: z.string().min(1, "Code দাও"),
  classId: z.string().min(1, "Class select করো"),
  fullMarks: z.number().min(1, "Full marks দাও"),
  passMarks: z.number().min(0, "Pass marks দাও"),
  isOptional: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  subject?: Subject | null;
  onClose: () => void;
}

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

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

export default function SubjectForm({ subject, onClose }: Props) {
  const { mutate: create, isPending: creating } = useCreateSubject();
  const { mutate: update, isPending: updating } = useUpdateSubject();
  const { data: classes } = useClasses();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { fullMarks: 100, passMarks: 33, isOptional: false },
  });

  useEffect(() => {
    if (subject) {
      reset({
        name: subject.name,
        code: subject.code,
        classId: subject.classId,
        fullMarks: subject.fullMarks ?? 100,
        passMarks: subject.passMarks ?? 33,
        isOptional: subject.isCompulsory === false,
      });
    }
  }, [subject, reset]);

  const onSubmit: SubmitHandler<FormData> = (data) => {
    if (subject) {
      update({ id: subject.id, data }, { onSuccess: onClose });
    } else {
      create(data, { onSuccess: onClose });
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
          {/* Animated orbs */}
          <div className="pointer-events-none absolute -top-20 -left-20 w-48 h-48 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -right-20 w-48 h-48 rounded-full bg-fuchsia-500/20 blur-3xl" />

          {/* Gradient bar */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 rounded-t-3xl" />

          {/* Header */}
          <div className="relative flex items-center justify-between p-6 pb-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <Sparkles className="absolute -top-1 -right-1 w-3.5 h-3.5 text-amber-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                  {subject ? "Subject Edit" : "নতুন Subject"}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {subject ? "তথ্য আপডেট করো" : "নতুন subject যোগ করো"}
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

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="relative px-6 pb-6 space-y-4">
            {/* Name */}
            <motion.div variants={itemVariants} custom={0} initial="hidden" animate="visible">
              <div className="relative">
                <BookOpen className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  {...register("name")}
                  placeholder="Subject নাম"
                  className={`${fieldBase} pr-11`}
                />
                <label className={floatLabelBase}>Subject নাম</label>
              </div>
              <ErrorMsg message={errors.name?.message} />
            </motion.div>

            {/* Code */}
            <motion.div variants={itemVariants} custom={1} initial="hidden" animate="visible">
              <div className="relative">
                <Hash className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  {...register("code")}
                  placeholder="Code"
                  className={`${fieldBase} pr-11 font-mono`}
                />
                <label className={floatLabelBase}>Subject Code</label>
              </div>
              <ErrorMsg message={errors.code?.message} />
            </motion.div>

            {/* Class */}
            <motion.div variants={itemVariants} custom={2} initial="hidden" animate="visible">
              <div className="relative">
                <GraduationCap className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <select
                  {...register("classId")}
                  className="w-full h-12 px-4 pr-11 rounded-xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-slate-700/60 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/60 transition-all appearance-none"
                >
                  <option value="">Select Class</option>
                  {classes?.map((cls: any) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                      {cls.sections?.length
                        ? ` — ${cls.sections.map((s: any) => s.name).join(", ")}`
                        : ""}
                    </option>
                  ))}
                </select>
              </div>
              <ErrorMsg message={errors.classId?.message} />
            </motion.div>

            {/* Marks */}
            <motion.div
              variants={itemVariants}
              custom={3}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 gap-3"
            >
              <div>
                <div className="relative">
                  <Target className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    {...register("fullMarks", { valueAsNumber: true })}
                    placeholder="Full Marks"
                    className={`${fieldBase} pr-11`}
                  />
                  <label className={floatLabelBase}>Full Marks</label>
                </div>
                <ErrorMsg message={errors.fullMarks?.message} />
              </div>
              <div>
                <div className="relative">
                  <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    {...register("passMarks", { valueAsNumber: true })}
                    placeholder="Pass Marks"
                    className={`${fieldBase} pr-11`}
                  />
                  <label className={floatLabelBase}>Pass Marks</label>
                </div>
                <ErrorMsg message={errors.passMarks?.message} />
              </div>
            </motion.div>

            {/* Optional */}
            <motion.label
              variants={itemVariants}
              custom={4}
              initial="hidden"
              animate="visible"
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 cursor-pointer hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition-colors"
            >
              <input
                type="checkbox"
                {...register("isOptional")}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/40"
              />
              <span className="text-sm text-slate-700 dark:text-slate-200">Optional subject</span>
            </motion.label>

            {/* Actions */}
            <motion.div
              variants={itemVariants}
              custom={5}
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
                    {subject ? "Update" : "Add Subject"}
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
