"use client";

import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Wallet,
  User,
  Calendar,
  Receipt,
  CheckCircle2,
  TrendingUp,
  CreditCard,
  Loader2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { usePayFee } from "./useFees";
import { Fee } from "./fees.types";
import { formatTaka } from "@/lib/utils";

type PaymentMethod = "STRIPE" | "CASH";

interface Props {
  fee: Fee;
  onClose: () => void;
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

const rowVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: 0.08 + i * 0.05, duration: 0.25 },
  }),
};

export default function PaymentModal({ fee, onClose }: Props) {
  const { mutate: pay, isPending } = usePayFee();

  const schema = z.object({
    amountPaid: z
      .number()
      .min(1, "Enter an amount")
      .max(fee.dueAmount, `Cannot pay more than ${fee.dueAmount}`),
    method: z.enum(["STRIPE", "CASH"]),
  });

  type FormData = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { method: "CASH" } });

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("CASH");

  const onSubmit: SubmitHandler<FormData> = (data) => {
    pay({ id: fee.id, data: { amountPaid: data.amountPaid, method: data.method } }, { onSuccess: onClose });
  };

  const currentAmount = Number(watch("amountPaid")) || 0;
  const remainingAfter = Math.max(fee.dueAmount - currentAmount, 0);
  const progressPercent = fee.amount
    ? Math.min(((fee.paidAmount + currentAmount) / fee.amount) * 100, 100)
    : 0;

  const quickAmounts = [
    { label: "25%", value: Math.round(fee.dueAmount * 0.25) },
    { label: "50%", value: Math.round(fee.dueAmount * 0.5) },
    { label: "75%", value: Math.round(fee.dueAmount * 0.75) },
    { label: "Full", value: fee.dueAmount },
  ];

  const methodOptions: { value: PaymentMethod; label: string; icon: typeof Wallet }[] = [
    { value: "CASH", label: "Cash", icon: Wallet },
    { value: "STRIPE", label: "Online", icon: CreditCard },
  ];

  const infoRows = [
    {
      icon: User,
      label: "Student",
      value: fee.student?.name ?? "—",
      tone: "text-slate-700 dark:text-slate-200",
    },
    {
      icon: Calendar,
      label: "Month",
      value: fee.month,
      tone: "text-slate-700 dark:text-slate-200",
    },
    {
      icon: Receipt,
      label: "Total Amount",
      value: formatTaka(fee.amount),
      tone: "text-slate-700 dark:text-slate-200",
    },
    {
      icon: CheckCircle2,
      label: "Already Paid",
      value: formatTaka(fee.paidAmount),
      tone: "text-emerald-600 dark:text-emerald-400",
    },
  ];

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
          <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 px-6 py-6">
            <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />

            <div className="relative flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm ring-1 ring-white/30">
                  <Wallet className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">Make Payment</h2>
                  <p className="text-xs text-white/80 mt-0.5 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Secure & Instant
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

            {/* Progress bar */}
            <div className="relative mt-5">
              <div className="flex items-center justify-between text-[11px] font-medium text-white/85 mb-1.5">
                <span>Payment Progress</span>
                <span>{progressPercent.toFixed(0)}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/20">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="h-full rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.7)]"
                />
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-5">
            {/* Fee info */}
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 ring-1 ring-slate-200 dark:ring-slate-700 divide-y divide-slate-200 dark:divide-slate-700/70">
              {infoRows.map((row, i) => {
                const Icon = row.icon;
                return (
                  <motion.div
                    key={row.label}
                    custom={i}
                    variants={rowVariants}
                    initial="hidden"
                    animate="visible"
                    className="flex items-center justify-between px-4 py-2.5"
                  >
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                      <Icon className="h-3.5 w-3.5" />
                      {row.label}
                    </div>
                    <span className={`text-sm font-semibold ${row.tone}`}>{row.value}</span>
                  </motion.div>
                );
              })}

              {/* Due highlight */}
              <motion.div
                custom={infoRows.length}
                variants={rowVariants}
                initial="hidden"
                animate="visible"
                className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-rose-50 to-orange-50 dark:from-rose-950/30 dark:to-orange-950/20 rounded-b-2xl"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Due Amount
                </div>
                <span className="text-lg font-extrabold text-rose-600 dark:text-rose-400">
                  {formatTaka(fee.dueAmount)}
                </span>
              </motion.div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  <CreditCard className="h-3.5 w-3.5 text-emerald-500" />
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
                    className={`w-full rounded-xl border-2 bg-white dark:bg-slate-800 pl-9 pr-4 py-3 text-lg font-bold text-slate-900 dark:text-white outline-none transition focus:ring-4 ${
                      errors.amountPaid
                        ? "border-rose-400 focus:border-rose-500 focus:ring-rose-100 dark:focus:ring-rose-900/30"
                        : "border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:ring-emerald-100 dark:focus:ring-emerald-900/30"
                    }`}
                  />
                </div>

                  {/* Quick amounts */}
                  <div className="mt-2 grid grid-cols-4 gap-1.5">
                    {quickAmounts.map((q) => (
                      <button
                        key={q.label}
                        type="button"
                        onClick={() =>
                          setValue("amountPaid", q.value, {
                            shouldValidate: true,
                          })
                        }
                        className="rounded-lg bg-slate-100 dark:bg-slate-800 px-2 py-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300 transition hover:bg-emerald-100 hover:text-emerald-700 dark:hover:bg-emerald-900/40 dark:hover:text-emerald-300"
                      >
                        {q.label}
                      </button>
                    ))}
                  </div>

                  {/* Remaining preview */}
                  {currentAmount > 0 && !errors.amountPaid && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 flex items-center justify-between rounded-lg bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2 text-xs"
                    >
                      <span className="text-emerald-700 dark:text-emerald-300 font-medium">
                        Remaining after payment
                      </span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-300">
                        {formatTaka(remainingAfter)}
                      </span>
                    </motion.div>
                  )}

                  {errors.amountPaid && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-1.5 flex items-center gap-1 text-xs font-medium text-rose-600 dark:text-rose-400"
                    >
                      <AlertCircle className="h-3.5 w-3.5" />
                      {errors.amountPaid.message}
                    </motion.p>
                  )}
              </div>

              {/* Method selector */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  <CreditCard className="h-3.5 w-3.5 text-emerald-500" />
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {methodOptions.map((opt) => {
                    const Icon = opt.icon;
                    const active = selectedMethod === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setSelectedMethod(opt.value);
                          setValue("method", opt.value, { shouldValidate: true });
                        }}
                        className={`flex items-center justify-center gap-2 rounded-xl border-2 px-3 py-2.5 text-sm font-semibold transition ${
                          active
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
                <input type="hidden" value={selectedMethod} {...register("method")} />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 transition hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/30 transition hover:shadow-xl hover:shadow-emerald-500/40 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Wallet className="h-4 w-4" />
                      Confirm Payment
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}