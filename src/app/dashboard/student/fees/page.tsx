"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import api from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";
import { useLenis } from "@/hooks/useLenis";
import { Skeleton } from "@/components/ui/skeleton";
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Fees</h1>
          <p className="text-sm text-muted-foreground">Your fee status and payment history.</p>
        </div>
        <Link
          href="/dashboard/student"
          className="text-sm text-primary hover:underline inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="rounded-xl border border-border/60 bg-card p-4 shadow-soft space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border/60 bg-card/80 p-4 shadow-soft">
              <div className="flex items-center gap-2">
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{stat.label}</p>
              </div>
              <p className="mt-2 text-lg font-semibold text-foreground">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-border/60 bg-card/80 shadow-soft overflow-hidden">
        <div className="px-6 py-4 border-b border-border/60 bg-secondary/20">
          <h2 className="text-lg font-semibold text-foreground">Fee Details</h2>
        </div>

        {loading && (
          <div className="p-6 space-y-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="flex items-center justify-between rounded-lg border border-border/40 px-4 py-3">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            ))}
          </div>
        )}

        {!loading && fees.length === 0 && (
          <div className="p-12 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-secondary/60 mx-auto mb-4">
              <Receipt className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No fee records found</p>
            <p className="text-xs text-muted-foreground mt-1">Your fee details will appear here once assigned.</p>
          </div>
        )}

        {!loading && fees.length > 0 && (
          <motion.div variants={container} initial="hidden" animate="show" className="divide-y divide-border/60">
            {fees.map((fee) => {
              const style = statusStyles[fee.status] ?? statusStyles.UNPAID;
              const StatusIcon = style.icon;
              const canPay = fee.status !== "PAID";

              return (
                <motion.div
                  key={fee.id}
                  variants={item}
                  className="px-6 py-4 hover:bg-secondary/20 transition-colors"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">{fee.title}</p>
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${style.badge}`}>
                          <StatusIcon className="h-3 w-3" />
                          {style.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {fee.feeType} • Due: {formatDate(fee.dueDate)}
                      </p>
                      {fee.payments && fee.payments.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {fee.payments.map((payment) => (
                            <span
                              key={payment.id}
                              className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-secondary/40 text-muted-foreground"
                            >
                              <Receipt className="h-3 w-3" />
                              {payment.method.toLowerCase()}: {formatTaka(payment.amount)}
                              {payment.transactionId && (
                                <span className="text-[9px] text-muted-foreground/70">
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
                        <p className="text-sm font-semibold text-foreground">{formatTaka(fee.amount)}</p>
                        <p className="text-xs text-muted-foreground">
                          Paid: {formatTaka(fee.paidAmount)}
                        </p>
                      </div>
                      {canPay && fee.dueAmount > 0 && (
                        <button
                          onClick={() => handlePay(fee.id)}
                          disabled={payingId === fee.id}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 hover:shadow-violet-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {payingId === fee.id ? (
                            <>
                              <div className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
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
  );
}
