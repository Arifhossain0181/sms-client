"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";
import { useLenis } from "@/hooks/useLenis";
import { formatDate, formatTaka } from "@/lib/utils";
import {
  Wallet,
  ArrowLeft,
  CreditCard,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  Receipt,
  Calendar,
  Loader2,
} from "lucide-react";

const unwrap = <T,>(res: { data: any }) => (res.data?.data ?? res.data) as T;

type Fee = {
  id: string;
  feeType: string;
  title: string;
  amount: number;
  paidAmount: number;
  dueAmount: number;
  dueDate: string;
  month: string;
  status: string;
  payments?: Array<{
    id: string;
    amount: number;
    method: string;
    status: string;
    paidAt?: string;
    transactionId?: string;
    createdAt: string;
  }>;
  createdAt: string;
};

type FeeSummary = {
  totalFees: number;
  totalPaid: number;
  outstanding: number;
  overDue: number;
};

const statusStyles: Record<string, { badge: string; label: string; icon: any }> = {
  PAID: {
    badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30",
    label: "Paid",
    icon: CheckCircle2,
  },
  UNPAID: {
    badge: "bg-rose-50 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/30",
    label: "Unpaid",
    icon: AlertTriangle,
  },
  PARTIAL: {
    badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30",
    label: "Partial",
    icon: Clock,
  },
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function StudentFeesPage() {
  useLenis();
  const { role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<FeeSummary | null>(null);
  const [fees, setFees] = useState<Fee[]>([]);
  const [payingId, setPayingId] = useState<string | null>(null);

  useEffect(() => {
    if (role && role !== "STUDENT") {
      window.location.href = "/dashboard";
    }
  }, [role]);

  useEffect(() => {
    const loadFees = async () => {
      try {
        setLoading(true);
        setError(null);

        const [summaryRes, listRes] = await Promise.allSettled([
          api.get("/fees/my-fees"),
          api.get("/fees/my-fees-list"),
        ]);

        if (summaryRes.status === "fulfilled") {
          const data = unwrap<FeeSummary>(summaryRes.value);
          setSummary(data);
        }

        if (listRes.status === "fulfilled") {
          const data = unwrap<Fee[]>(listRes.value);
          setFees(data);
        }
      } catch (err) {
        setError("Failed to load fees");
      } finally {
        setLoading(false);
      }
    };

    loadFees();
  }, []);

  const handlePay = async (feeId: string) => {
    try {
      setPayingId(feeId);
      const res = await api.post("/fees/create-payment-intent", { feeId });
      const payload = unwrap<{ url?: string }>(res);
      if (payload.url) {
        window.location.href = payload.url;
      } else {
        throw new Error("No payment URL returned");
      }
    } catch (err) {
      console.error("Payment failed", err);
      setError("Payment initiation failed. Please try again.");
    } finally {
      setPayingId(null);
    }
  };

  const stats = useMemo(() => {
    if (!summary) return [];
    return [
      { label: "Total Fees", value: formatTaka(summary.totalFees), icon: Wallet, color: "text-slate-600 dark:text-slate-300" },
      { label: "Total Paid", value: formatTaka(summary.totalPaid), icon: TrendingUp, color: "text-emerald-600 dark:text-emerald-400" },
      { label: "Outstanding", value: formatTaka(summary.outstanding), icon: TrendingDown, color: "text-amber-600 dark:text-amber-400" },
      { label: "Overdue", value: summary.overDue.toString(), icon: AlertTriangle, color: "text-rose-600 dark:text-rose-400" },
    ];
  }, [summary]);

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
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              {[...Array(4)].map((_, i) => (
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
                  <Wallet className="w-6 h-6 text-white" />
                  <motion.div
                    className="absolute inset-0 rounded-2xl border-2 border-white/40 dark:border-white/20"
                    animate={{ scale: [1, 1.12, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2.4, repeat: Infinity }}
                  />
                </motion.div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    My Fees
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    Your fee status and payment history
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
                className="grid grid-cols-2 lg:grid-cols-4 gap-3"
              >
                {stats.map((stat, idx) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group relative flex flex-col justify-between p-4 rounded-2xl bg-gradient-to-br from-white/80 to-slate-50/80 dark:from-slate-900/40 dark:to-slate-800/40 border border-white/40 dark:border-white/10 backdrop-blur-sm hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 via-indigo-400 to-violet-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
                        <stat.icon className="w-4 h-4" />
                      </div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                        {stat.label}
                      </p>
                    </div>
                    <p className="mt-3 text-xl font-bold text-slate-800 dark:text-white">
                      {stat.value}
                    </p>
                  </motion.div>
                ))}
              </motion.div>
            )}

            <div className="rounded-2xl bg-white/60 dark:bg-slate-900/40 border border-white/40 dark:border-white/10 backdrop-blur-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-white/40 dark:border-white/5">
                <h2 className="text-base font-semibold text-slate-800 dark:text-white">Fee Details</h2>
              </div>

              {loading && (
                <div className="p-4 space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200/40 dark:border-slate-700/40">
                      <div className="space-y-2">
                        <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                        <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                      </div>
                      <div className="h-5 w-20 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
                    </div>
                  ))}
                </div>
              )}

              {!loading && fees.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-12 text-center"
                >
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-sky-100 via-indigo-100 to-violet-100 dark:from-sky-500/10 dark:via-indigo-500/10 dark:to-violet-500/10 flex items-center justify-center mb-3 ring-1 ring-indigo-200/60 dark:ring-indigo-400/20">
                    <Receipt className="w-7 h-7 text-indigo-400" />
                  </div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    No fee records found
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    Your fee details will appear here once assigned.
                  </p>
                </motion.div>
              )}

              {!loading && fees.length > 0 && (
                <motion.div
                  variants={container}
                  initial="hidden"
                  animate="show"
                  className="divide-y divide-white/40 dark:divide-white/5"
                >
                  {fees.map((fee) => {
                    const style = statusStyles[fee.status] ?? statusStyles.UNPAID;
                    const StatusIcon = style.icon;
                    const canPay = fee.status !== "PAID";

                    return (
                      <motion.div
                        key={fee.id}
                        variants={item}
                        className="px-4 sm:px-6 py-4 hover:bg-white/60 dark:hover:bg-white/5 transition-colors"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-slate-700 dark:text-slate-200">{fee.title}</p>
                              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${style.badge}`}>
                                <StatusIcon className="h-3 w-3" />
                                {style.label}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {fee.feeType} • Due: {formatDate(fee.dueDate)}
                            </p>
                            {fee.payments && fee.payments.length > 0 && (
                              <div className="flex flex-wrap gap-2 pt-1">
                                {fee.payments.map((payment) => (
                                  <span
                                    key={payment.id}
                                    className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-white/60 dark:bg-white/10 text-slate-500 dark:text-slate-400"
                                  >
                                    <Receipt className="h-3 w-3" />
                                    {payment.method.toLowerCase()}: {formatTaka(payment.amount)}
                                    {payment.transactionId && (
                                      <span className="text-[9px] text-slate-400/70">
                                        ({payment.transactionId.slice(0, 8)}...)
                                      </span>
                                    )}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-4 sm:gap-6">
                            <div className="text-right">
                              <p className="text-sm font-semibold text-slate-800 dark:text-white">{formatTaka(fee.amount)}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                Paid: {formatTaka(fee.paidAmount)}
                              </p>
                            </div>
                            {canPay && fee.dueAmount > 0 && (
                              <button
                                onClick={() => handlePay(fee.id)}
                                disabled={payingId === fee.id}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                              >
                                {payingId === fee.id ? (
                                  <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    Processing...
                                  </>
                                ) : (
                                  <>
                                    <CreditCard className="h-3.5 w-3.5" />
                                    Pay {formatTaka(fee.dueAmount)}
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
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
          EduCore Fees Center
        </motion.p>
      </div>
    </div>
  );
}
