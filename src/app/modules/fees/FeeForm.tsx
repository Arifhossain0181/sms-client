"use client";

import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Wallet,
  User,
  FileText,
  Tag,
  DollarSign,
  CalendarDays,
  Loader2,
  Plus,
  AlertCircle,
  GraduationCap,
  BookOpen,
  ClipboardCheck,
} from "lucide-react";
import { useCreateFee } from "./useFees";
import { useStudents } from "../student/useStudents";
import { toast } from "sonner";

/**
 * ⚠️ This creates ONE fee for ONE student. It does not fulfil req 1.1
 * ("define fee amount and due date per class") — that needs a separate
 * fee-structure flow that auto-applies to every student in a class.
 * Keep this form for one-off/manual cases (e.g. a single late fee), but
 * it isn't a substitute for per-class fee structure setup.
 */

const schema = z.object({
  studentId: z.string().min(1, "Select a student"),
  title: z.string().min(1, "Title is required"),
  type: z.enum(["TUITION", "ADMISSION", "EXAM"]),
  amount: z.number().min(1, "Enter an amount"),
  dueDate: z.string().min(1, "Due date is required"),
});

type FormInput = z.input<typeof schema>;
type FormData = z.output<typeof schema>;

interface Props {
  onClose: () => void;
}

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.94, y: 24 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 320, damping: 26 },
  },
  exit: { opacity: 0, scale: 0.96, y: 12, transition: { duration: 0.15 } },
};

const fieldVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.04 * i, type: "spring" as const, stiffness: 300, damping: 24 },
  }),
};

const feeTypes = [
  { value: "TUITION", label: "Tuition", icon: BookOpen, color: "text-blue-600" },
  { value: "ADMISSION", label: "Admission", icon: GraduationCap, color: "text-emerald-600" },
  { value: "EXAM", label: "Exam", icon: ClipboardCheck, color: "text-purple-600" },
] as const;

export default function FeeForm({ onClose }: Props) {
  const { mutate: create, isPending } = useCreateFee();
  const { data: students } = useStudents();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInput>({ resolver: zodResolver(schema) });

  const onSubmit: SubmitHandler<FormData> = (data) => {
    const studentList = Array.isArray(students) ? students : [];
    const selectedStudent = studentList.find((s) => s.id === data.studentId);
    if (!selectedStudent?.classId) {
      toast.error("This student has no class assigned");
      return;
    }
    create({ ...data, classId: selectedStudent.classId }, { onSuccess: onClose });
  };

  const inputBase =
    "w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all";

  return (
    <AnimatePresence>
      <motion.div
        variants={overlayVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
      >
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl ring-1 ring-slate-200 dark:ring-slate-800 overflow-hidden max-h-[92vh] flex flex-col"
        >
          {/* Header */}
          <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-6 text-white overflow-hidden">
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md ring-1 ring-white/30 flex items-center justify-center">
                  <Wallet className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Add Fee</h2>
                  <p className="text-xs text-white/80 mt-0.5">
                    Create a fee for a single student
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md ring-1 ring-white/30 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </motion.button>
            </div>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit(onSubmit as SubmitHandler<FormInput>)}
            className="p-6 space-y-5 overflow-y-auto"
          >
            {/* Student */}
            <motion.div variants={fieldVariants} initial="hidden" animate="visible" custom={0}>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                Student
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <select
                  {...register("studentId")}
                  className={`${inputBase} appearance-none cursor-pointer pr-8`}
                >
                  <option value="">Select a student</option>
                  {Array.isArray(students) &&
                    students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                </select>
              </div>
              {errors.studentId && (
                <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.studentId.message}
                </p>
              )}
            </motion.div>

            {/* Title */}
            <motion.div variants={fieldVariants} initial="hidden" animate="visible" custom={1}>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                Title
              </label>
              <div className="relative">
                <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="e.g. January Tuition Fee"
                  {...register("title")}
                  className={inputBase}
                />
              </div>
              {errors.title && (
                <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.title.message}
                </p>
              )}
            </motion.div>

            {/* Type */}
            <motion.div variants={fieldVariants} initial="hidden" animate="visible" custom={2}>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                Type
              </label>
              <div className="relative">
                <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
                <select
                  {...register("type")}
                  className={`${inputBase} appearance-none cursor-pointer pr-8`}
                >
                  <option value="">Select type</option>
                  {feeTypes.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              {errors.type && (
                <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.type.message}
                </p>
              )}
            </motion.div>

            {/* Amount + Due Date grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <motion.div variants={fieldVariants} initial="hidden" animate="visible" custom={3}>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Amount (৳)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="number"
                    placeholder="0"
                    {...register("amount", { valueAsNumber: true })}
                    className={`${inputBase} font-semibold`}
                  />
                </div>
                {errors.amount && (
                  <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.amount.message}
                  </p>
                )}
              </motion.div>

              <motion.div variants={fieldVariants} initial="hidden" animate="visible" custom={4}>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Due Date
                </label>
                <div className="relative">
                  <CalendarDays className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input type="date" {...register("dueDate")} className={inputBase} />
                </div>
                {errors.dueDate && (
                  <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.dueDate.message}
                  </p>
                )}
              </motion.div>
            </div>

            {/* Actions */}
            <motion.div
              variants={fieldVariants}
              initial="hidden"
              animate="visible"
              custom={5}
              className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isPending}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Add Fee
                  </>
                )}
              </motion.button>
            </motion.div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}