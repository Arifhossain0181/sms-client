"use client";

import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Wallet,
  User,
  DollarSign,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Loader2,
} from "lucide-react";
import { useFees, useCashPayment } from "./useFees";
import { formatTaka } from "@/lib/utils";
import type { Fee } from "./fees.types";

interface CashPaymentModalProps {
  onClose?: () => void;
}

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.92, y: 24 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 320, damping: 26 },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: { duration: 0.15 },
  },
};

const schema = z.object({
  studentId: z.string().min(1, "Student select করো"),
  type: z.enum(["TUITION", "ADMISSION", "EXAM"]),
  amountPaid: z.number().min(1, "Amount দাও"),
  dueDate: z.string().optional(),
  note: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function CashPaymentModal({ onClose }: CashPaymentModalProps) {
  const { data: fees } = useFees();
  const { mutate: createPayment, isPending } = useCashPayment();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      dueDate: new Date().toISOString().split("T")[0],
      type: "TUITION",
    },
  });

  const selectedStudentId = watch("studentId");
  const selectedFee = (fees as Fee[] | undefined)?.find(
    (f) => f.studentId === selectedStudentId && f.status !== "PAID"
  );

  const onSubmit: SubmitHandler<FormData> = (data) => {
    createPayment(data, { onSuccess: () => onClose?.() });
  };

  const uniqueStudents = fees
    ? Array.from(
        new Map(
          (fees as Fee[] | undefined)?.map((f) => [f.studentId, f.student]) || []
        ).values()
      )
    : [];

  return (
    <AnimatePresence>
      <motion.div
        variants={overlayVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4"
      >
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white dark:bg-slate-900 shadow-2xl ring-1 ring-slate-200 dark:ring-slate-800"
        >
          {/* Header */}
          <div className="relative overflow-hidden bg-linear-to-br from-blue-500 via-indigo-500 to-purple-500 px-6 py-6">
            <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />

            <div className="relative flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm ring-1 ring-white/30">
                  <Wallet className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    Cash Payment
                  </h2>
                  <p className="text-xs text-white/80 mt-0.5 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    নগদ পেমেন্ট
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25 hover:rotate-90 duration-300"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-6 space-y-5">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Student Select */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  <User className="h-3.5 w-3.5 text-blue-500" />
                  Student
                </label>
                <select
                  {...register("studentId")}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition"
                >
                  <option value="">Student select করো</option>
                  {uniqueStudents.map((student) => (
                    <option key={student?.id} value={student?.id}>
                      {student?.name}
                    </option>
                  ))}
                </select>
                {errors.studentId && (
                  <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.studentId.message}
                  </p>
                )}
              </div>

              {/* Due Amount Display */}
              {selectedFee && (
                <div className="rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                      Due Amount
                    </span>
                    <span className="text-lg font-extrabold text-blue-600 dark:text-blue-400">
                      {formatTaka(selectedFee.dueAmount)}
                    </span>
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-300 mt-2">
                    Month: {selectedFee.month}
                  </p>
                </div>
              )}

              {/* Amount Input */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                  Payment Amount (৳)
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">
                    ৳
                  </span>
                  <input
                    type="number"
                    step="any"
                    placeholder="0"
                    {...register("amountPaid", { valueAsNumber: true })}
                    className={`w-full rounded-xl border-2 bg-white dark:bg-slate-800 pl-9 pr-4 py-2.5 text-lg font-bold text-slate-900 dark:text-white outline-none transition focus:ring-4 ${
                      errors.amountPaid
                        ? "border-rose-400 focus:border-rose-500 focus:ring-rose-100 dark:focus:ring-rose-900/30"
                        : "border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:ring-emerald-100 dark:focus:ring-emerald-900/30"
                    }`}
                  />
                </div>
                {errors.amountPaid && (
                  <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.amountPaid.message}
                  </p>
                )}
              </div>

              {/* Payment Date */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  <Calendar className="h-3.5 w-3.5 text-amber-500" />
                  Due Date
                </label>
                <input
                  type="date"
                  {...register("dueDate")}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 dark:focus:ring-amber-900/30 transition"
                />
                {errors.dueDate && (
                  <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.dueDate.message}
                  </p>
                )}
              </div>

              {/* Payment Type */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  <Wallet className="h-3.5 w-3.5 text-blue-500" />
                  Payment Type
                </label>
                <select
                  {...register("type")}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition"
                >
                  <option value="TUITION">Tuition</option>
                  <option value="ADMISSION">Admission</option>
                  <option value="EXAM">Exam</option>
                </select>
              </div>

              {/* Notes/Remarks */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-slate-500" />
                  Notes (Optional)
                </label>
                <textarea
                  {...register("note")}
                  placeholder="Additional notes..."
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 dark:focus:ring-slate-900/30 transition resize-none"
                />
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={isPending}
                whileHover={{ scale: isPending ? 1 : 1.02 }}
                whileTap={{ scale: isPending ? 1 : 0.98 }}
                className="w-full py-3 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-400 disabled:to-slate-400 text-white font-semibold text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Payment Submit করো
                  </>
                )}
              </motion.button>

              {/* Cancel Button */}
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-600 font-semibold text-sm transition"
              >
                Cancel
              </button>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
