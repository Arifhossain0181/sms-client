"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useLenis } from "@/hooks/useLenis";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/axios";
import {
  UsersRound,
  Receipt,
  ArrowLeft,
  CreditCard,
  TrendingUp,
  Download,
  ExternalLink,
  Inbox,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from "lucide-react";

const unwrap = <T,>(res: { data: any }) => (res.data?.data ?? res.data) as T;

type ChildDetail = {
  id: string;
  name: string;
  rollNumber?: number;
  class?: { id: string; name: string };
  section?: { id: string; name: string };
};

type PaymentItem = {
  id: string;
  amount: number;
  status: string;
  method: string;
  paidAt?: string;
  transactionId?: string;
  pdfReceiptUrl?: string;
  note?: string;
  createdAt: string;
  student?: { id: string; name: string; rollNumber?: number };
  feeStructure?: { id: string; title?: string };
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const statusStyles: Record<string, { badge: string; label: string; icon: any; color: string }> = {
  SUCCESS: {
    badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30",
    label: "Success",
    icon: CheckCircle2,
    color: "text-emerald-600 dark:text-emerald-400",
  },
  PENDING: {
    badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30",
    label: "Pending",
    icon: Clock,
    color: "text-amber-600 dark:text-amber-400",
  },
  FAILED: {
    badge: "bg-rose-50 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/30",
    label: "Failed",
    icon: AlertTriangle,
    color: "text-rose-600 dark:text-rose-400",
  },
};

export default function ParentPaymentsPage() {
  useLenis();
  const router = useRouter();
  const { role } = useAuth();
  const isParent = role === "PARENT";

  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  const { data: children = [], isLoading: childrenLoading } = useQuery({
    queryKey: ["parents", "children"],
    queryFn: async () => {
      const res = await api.get("/parents/me/children-detailed");
      const payload = unwrap<ChildDetail[]>(res);
      return Array.isArray(payload) ? payload : [];
    },
    enabled: isParent,
  });

  const selectedChild = useMemo(
    () => children.find((c) => c.id === selectedChildId),
    [children, selectedChildId]
  );

  const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
    queryKey: ["parents", "payments"],
    queryFn: async () => {
      const res = await api.get("/parents/me/payments");
      const payload = unwrap<{ data: PaymentItem[]; total: number; page: number; pageSize: number; totalPages: number }>(res);
      return payload;
    },
    enabled: isParent,
  });

  const allPayments = useMemo(() => paymentsData?.data ?? [], [paymentsData]);

  const filteredPayments = useMemo(() => {
    if (!selectedChildId) return allPayments;
    return allPayments.filter((p) => p.student?.id === selectedChildId);
  }, [allPayments, selectedChildId]);

  const summary = useMemo(() => {
    const payments = filteredPayments;
    const totalPaid = payments
      .filter((p) => p.status === "SUCCESS")
      .reduce((sum, p) => sum + (p.amount ?? 0), 0);
    const totalPending = payments
      .filter((p) => p.status === "PENDING")
      .reduce((sum, p) => sum + (p.amount ?? 0), 0);
    const totalFailed = payments
      .filter((p) => p.status === "FAILED")
      .reduce((sum, p) => sum + (p.amount ?? 0), 0);
    return { totalPaid, totalPending, totalFailed, count: payments.length };
  }, [filteredPayments]);

  useEffect(() => {
    if (isParent && children.length > 0 && !selectedChildId) {
      setSelectedChildId(children[0].id);
    }
  }, [isParent, children, selectedChildId]);

  useEffect(() => {
    if (role && role !== "PARENT") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  if (!isParent) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Payment History</h1>
          <p className="text-sm text-muted-foreground">Track all payments made for your children.</p>
        </div>
        <Link href="/dashboard/parent" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>
      </div>

      {childrenLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="rounded-xl border border-border/60 bg-card p-4 shadow-soft space-y-3">
              <Skeleton className="h-5 w-3/5" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          ))}
        </div>
      ) : children.length === 0 ? (
        <div className="rounded-2xl border border-border/60 bg-card/80 p-12 shadow-soft text-center">
          <Inbox className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-medium text-foreground">No children linked</p>
          <p className="text-xs text-muted-foreground mt-1">Children will appear here once linked to your account.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {children.map((child) => (
              <motion.button
                key={child.id}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedChildId(child.id)}
                className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  selectedChildId === child.id
                    ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white border-transparent shadow-lg shadow-indigo-500/20"
                    : "border-border/60 hover:bg-secondary/40 text-foreground"
                }`}
              >
                <UsersRound className="h-4 w-4" />
                {child.name}
              </motion.button>
            ))}
          </div>

          {selectedChild && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Total Paid", value: `৳${summary.totalPaid.toLocaleString()}`, icon: TrendingUp, color: "text-emerald-600 dark:text-emerald-400" },
                  { label: "Pending", value: `৳${summary.totalPending.toLocaleString()}`, icon: Clock, color: "text-amber-600 dark:text-amber-400" },
                  { label: "Failed", value: `৳${summary.totalFailed.toLocaleString()}`, icon: AlertTriangle, color: "text-rose-600 dark:text-rose-400" },
                  { label: "Total Payments", value: String(summary.count), icon: Receipt, color: "text-slate-600 dark:text-slate-300" },
                ].map((stat) => (
                  <motion.div
                    key={stat.label}
                    variants={item}
                    whileHover={{ y: -2, transition: { duration: 0.2 } }}
                    whileTap={{ scale: 0.98 }}
                    className="rounded-xl border border-border/60 bg-card/80 p-4 shadow-soft"
                  >
                    <div className="flex items-center gap-2">
                      <stat.icon className={`h-4 w-4 ${stat.color}`} />
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">{stat.label}</p>
                    </div>
                    <p className={`mt-2 text-lg font-semibold ${stat.color}`}>{stat.value}</p>
                  </motion.div>
                ))}
              </div>

              <div className="rounded-2xl border border-border/60 bg-card/80 shadow-soft overflow-hidden">
                <div className="px-6 py-4 border-b border-border/60 bg-secondary/20">
                  <h2 className="text-lg font-semibold text-foreground">Payment Transactions</h2>
                </div>

                {paymentsLoading ? (
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
                ) : filteredPayments.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="grid h-14 w-14 place-items-center rounded-full bg-secondary/60 mx-auto mb-4">
                      <Receipt className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-foreground">No payment records found</p>
                    <p className="text-xs text-muted-foreground mt-1">Payment history will appear here.</p>
                  </div>
                ) : (
                  <motion.div variants={container} initial="hidden" animate="show" className="divide-y divide-border/60">
                    {filteredPayments.map((payment) => {
                      const style = statusStyles[payment.status] ?? statusStyles.PENDING;
                      const StatusIcon = style.icon;
                      const methodLabel = payment.method ? payment.method.toLowerCase() : "unknown";

                      return (
                        <motion.div
                          key={payment.id}
                          variants={item}
                          whileHover={{ x: 4, transition: { duration: 0.15 } }}
                          className="px-6 py-4 hover:bg-secondary/20 transition-colors"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-foreground">
                                  {payment.feeStructure?.title ?? "Fee Payment"}
                                </p>
                                <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${style.badge}`}>
                                  <StatusIcon className="h-3 w-3" />
                                  {style.label}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {payment.student?.name ?? "Student"} • {methodLabel}
                                {payment.transactionId && ` • ${payment.transactionId.slice(0, 12)}...`}
                              </p>
                              {payment.note && (
                                <p className="text-xs text-muted-foreground italic">{payment.note}</p>
                              )}
                            </div>

                            <div className="flex items-center gap-4 sm:gap-6">
                              <div className="text-right">
                                <p className={`text-sm font-semibold ${style.color}`}>
                                  ৳{payment.amount.toLocaleString()}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {payment.paidAt
                                    ? new Date(payment.paidAt).toLocaleDateString()
                                    : new Date(payment.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              {payment.pdfReceiptUrl && (
                                <a
                                  href={payment.pdfReceiptUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 rounded-lg border border-border/60 bg-secondary/40 px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary/80 transition-colors"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                  Receipt
                                </a>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
