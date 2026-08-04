/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";
import { formatDate, } from "@/lib/utils";
import {
  ArrowLeft,
  Receipt,
  CreditCard,
  Wallet,
  Sparkles,
  Loader2,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { formatTaka } from "@/lib/utils";

const unwrap = <T,>(res: { data: any }) => (res.data?.data ?? res.data) as T;

type Payment = {
  id: string;
  amount: number;
  method: string;
  status: string;
  transactionId?: string;
  createdAt: string;
  fee?: {
    id: string;
    type: string;
    month: string;
    dueDate: string;
    amount: number;
  };
};

type FeeSummary = {
  totalFees: number;
  totalPaid: number;
  outstanding: number;
  overDue: number;
  payments: Payment[];
};

const statusStyles: Record<string, { badge: string; label: string; icon: any }> = {
  PAID: {
    badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30",
    label: "Paid",
    icon: CheckCircle2,
  },
  PENDING: {
    badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30",
    label: "Pending",
    icon: Clock,
  },
  PARTIAL: {
    badge: "bg-sky-50 text-sky-700 ring-1 ring-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/30",
    label: "Partial",
    icon: AlertTriangle,
  },
  WAIVED: {
    badge: "bg-violet-50 text-violet-700 ring-1 ring-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-500/30",
    label: "Waived",
    icon: CheckCircle2,
  },
};

export default function StudentPaymentsPage() {
  const { role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<FeeSummary | null>(null);

  useEffect(() => {
    if (role && role !== "STUDENT") {
      window.location.href = "/dashboard";
    }
  }, [role]);

  useEffect(() => {
    const loadPayments = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get("/fees/my-fees");
        const data = unwrap<FeeSummary>(res);
        setSummary(data);
      } catch (err) {
        setError("Failed to load payment data");
      } finally {
        setLoading(false);
      }
    };
    loadPayments();
  }, []);

  const payments = summary?.payments ?? [];

  if (loading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-slate-50/50 dark:bg-slate-950">
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
          <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/10 shadow-2xl p-6 sm:p-8 space-y-4">
            <div className="h-8 w-1/3 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
            <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-28 bg-slate-200/60 dark:bg-slate-700/40 rounded-2xl animate-pulse" />
              ))}
            </div>
            <div className="mt-6 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-slate-200/60 dark:bg-slate-700/40 rounded-2xl animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-start justify-start p-4 sm:p-6 overflow-hidden bg-slate-50/50 dark:bg-slate-950">
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
              <div className="flex items-center gap-3">
                <motion.div
                  whileHover={{ scale: 1.08, rotate: 4 }}
                  className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400 via-indigo-400 to-violet-500 shadow-lg shadow-indigo-500/30 flex items-center justify-center"
                >
                  <Receipt className="w-6 h-6 text-white" />
                  <motion.div
                    className="absolute inset-0 rounded-2xl border-2 border-white/40 dark:border-white/20"
                    animate={{ scale: [1, 1.12, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2.4, repeat: Infinity }}
                  />
                </motion.div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    Payments
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    Your fee and payment history
                  </p>
                </div>
              </div>

              <Link
                href="/dashboard/student"
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full bg-white/80 dark:bg-white/10 border border-white/40 dark:border-white/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 transition-colors shadow-sm"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to dashboard
              </Link>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6 space-y-4">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-rose-200/60 dark:border-rose-500/20 bg-rose-50/80 dark:bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-300 backdrop-blur-sm"
              >
                {error}
              </motion.div>
            )}

            {!loading && summary && (
              <motion.div
                layout
                className="grid grid-cols-1 sm:grid-cols-3 gap-3"
              >
                {[
                  { label: "Total Due", value: formatTaka(summary.outstanding) },
                  { label: "Total Paid", value: formatTaka(summary.totalPaid) },
                  { label: "Overdue", value: (summary.overDue ?? 0).toString() },
                ].map((item, idx) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group relative flex flex-col justify-between p-4 rounded-2xl bg-gradient-to-br from-white/80 to-slate-50/80 dark:from-slate-900/40 dark:to-slate-800/40 border border-white/40 dark:border-white/10 backdrop-blur-sm hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 via-indigo-400 to-violet-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
                        <Wallet className="w-4 h-4" />
                      </div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                        {item.label}
                      </p>
                    </div>
                    <p className="mt-3 text-xl font-bold text-slate-800 dark:text-white">
                      {item.value}
                    </p>
                  </motion.div>
                ))}
              </motion.div>
            )}

            <div className="rounded-2xl bg-white/60 dark:bg-slate-900/40 border border-white/40 dark:border-white/10 backdrop-blur-sm overflow-hidden">
              {!loading && payments.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-16 text-center"
                >
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-sky-100 via-indigo-100 to-violet-100 dark:from-sky-500/10 dark:via-indigo-500/10 dark:to-violet-500/10 flex items-center justify-center mb-4 ring-1 ring-indigo-200/60 dark:ring-indigo-400/20">
                    <Receipt className="w-10 h-10 text-indigo-400" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">
                    No payment records found
                  </h3>
                </motion.div>
              )}

              {!loading && payments.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-xs uppercase text-slate-400 dark:text-slate-500 bg-white/40 dark:bg-white/5">
                      <tr>
                        <th className="py-3 px-4 text-left">Date</th>
                        <th className="py-3 px-4 text-left">Fee Type</th>
                        <th className="py-3 px-4 text-left">Amount</th>
                        <th className="py-3 px-4 text-left">Method</th>
                        <th className="py-3 px-4 text-left">Status</th>
                        <th className="py-3 px-4 text-left">Transaction ID</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/40 dark:divide-white/5">
                      {payments.map((payment) => {
                        const style = statusStyles[payment.status] ?? statusStyles.PENDING;
                        const StatusIcon = style.icon;
                        return (
                          <motion.tr
                            key={payment.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="hover:bg-white/60 dark:hover:bg-white/5 transition-colors"
                          >
                            <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{formatDate(payment.createdAt)}</td>
                            <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{payment.fee?.type ?? "-"}</td>
                            <td className="py-3 px-4 text-slate-800 dark:text-white font-medium">{formatTaka(payment.amount)}</td>
                            <td className="py-3 px-4 text-slate-600 dark:text-slate-300 capitalize">{payment.method?.toLowerCase() ?? "-"}</td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${style.badge}`}>
                                <StatusIcon className="h-3 w-3" />
                                {style.label}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-xs text-slate-500 dark:text-slate-400">{payment.transactionId ?? "-"}</td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 1 }}
          className="text-center text-[10px] font-bold tracking-[0.3em] uppercase text-slate-400 dark:text-slate-600"
        >
          EduCore Payments Center
        </motion.p>
      </div>
    </div>
  );
}
