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
  Inbox,
} from "lucide-react";

const unwrap = <T,>(res: { data: any }) => (res.data?.data ?? res.data) as T;

type ChildDetail = {
  id: string;
  name: string;
  rollNumber?: number;
  class?: { id: string; name: string };
  section?: { id: string; name: string };
};

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
  studentName?: string;
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

export default function FeesPage() {
  useLenis();
  const router = useRouter();
  const { role } = useAuth();
  const isParent = role === "PARENT";
  const isStudent = role === "STUDENT";

  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);

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

  const { data: feesData, isLoading: feesLoading } = useQuery({
    queryKey: ["fees", "parent", selectedChildId],
    queryFn: async () => {
      const res = await api.get("/fees/my-children-fees");
      return unwrap<{ children: ChildDetail[]; fees: Fee[]; summary: FeeSummary }>(res);
    },
    enabled: isParent && children.length > 0,
  });

  const allFees = useMemo(() => feesData?.fees ?? [], [feesData]);
  const summary = useMemo(() => feesData?.summary ?? null, [feesData]);

  const filteredFees = useMemo(() => {
    if (!selectedChildId) return allFees;
    return allFees.filter((f) => {
      const child = children.find((c) => c.id === selectedChildId);
      return child && f.studentName === child.name;
    });
  }, [allFees, selectedChildId, children]);

  const childFeesMap = useMemo(() => {
    const map = new Map<string, Fee[]>();
    for (const fee of allFees) {
      const child = children.find((c) => c.name === fee.studentName);
      if (child) {
        const list = map.get(child.id) ?? [];
        list.push(fee);
        map.set(child.id, list);
      }
    }
    return map;
  }, [allFees, children]);

  const selectedChildFees = useMemo(() => {
    if (!selectedChildId) return allFees;
    return childFeesMap.get(selectedChildId) ?? [];
  }, [selectedChildId, childFeesMap, allFees]);

  const selectedChildSummary = useMemo(() => {
    const fees = selectedChildFees;
    const totalFees = fees.reduce((sum, f) => sum + (f.amount ?? 0), 0);
    const totalPaid = fees.reduce((sum, f) => sum + (f.paidAmount ?? 0), 0);
    const overdueCount = fees.filter((f) => f.status === "PENDING" && f.dueDate && new Date(f.dueDate) < new Date()).length;
    return { totalFees, totalPaid, outstanding: totalFees - totalPaid, overDue: overdueCount };
  }, [selectedChildFees]);

  useEffect(() => {
    if (isParent && children.length > 0 && !selectedChildId) {
      setSelectedChildId(children[0].id);
    }
  }, [isParent, children, selectedChildId]);

  useEffect(() => {
    if (isStudent) {
      router.replace("/dashboard/student/fees");
    }
  }, [isStudent, router]);

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
    } finally {
      setPayingId(null);
    }
  };

  if (isStudent) {
    return null;
  }

  if (!isParent) {
    const { default: FeeList } = require("@/app/modules/fees/FeeList");
    return <FeeList />;
  }

  const stats = [
    { label: "Total Fees", value: summary ? `৳${summary.totalFees.toLocaleString()}` : "৳0", icon: Wallet, color: "text-slate-600 dark:text-slate-300" },
    { label: "Total Paid", value: summary ? `৳${summary.totalPaid.toLocaleString()}` : "৳0", icon: TrendingUp, color: "text-emerald-600 dark:text-emerald-400" },
    { label: "Outstanding", value: summary ? `৳${summary.outstanding.toLocaleString()}` : "৳0", icon: TrendingDown, color: "text-amber-600 dark:text-amber-400" },
    { label: "Overdue", value: summary ? String(summary.overDue) : "0", icon: AlertTriangle, color: "text-rose-600 dark:text-rose-400" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Fees</h1>
          <p className="text-sm text-muted-foreground">Manage your children&apos;s fees and payments.</p>
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
                  { label: "Total Fees", value: `৳${selectedChildSummary.totalFees.toLocaleString()}`, icon: Wallet, color: "text-slate-600 dark:text-slate-300" },
                  { label: "Total Paid", value: `৳${selectedChildSummary.totalPaid.toLocaleString()}`, icon: TrendingUp, color: "text-emerald-600 dark:text-emerald-400" },
                  { label: "Outstanding", value: `৳${selectedChildSummary.outstanding.toLocaleString()}`, icon: TrendingDown, color: "text-amber-600 dark:text-amber-400" },
                  { label: "Overdue", value: String(selectedChildSummary.overDue), icon: AlertTriangle, color: "text-rose-600 dark:text-rose-400" },
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
                  <h2 className="text-lg font-semibold text-foreground">Fee Details</h2>
                </div>

                {feesLoading ? (
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
                ) : selectedChildFees.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="grid h-14 w-14 place-items-center rounded-full bg-secondary/60 mx-auto mb-4">
                      <Receipt className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-foreground">No fee records found</p>
                    <p className="text-xs text-muted-foreground mt-1">Fee details will appear here once assigned.</p>
                  </div>
                ) : (
                  <motion.div variants={container} initial="hidden" animate="show" className="divide-y divide-border/60">
                    {selectedChildFees.map((fee) => {
                      const style = statusStyles[fee.status] ?? statusStyles.UNPAID;
                      const StatusIcon = style.icon;
                      const canPay = fee.status !== "PAID";

                      return (
                        <motion.div
                          key={fee.id}
                          variants={item}
                          whileHover={{ x: 4, transition: { duration: 0.15 } }}
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
                                {fee.feeType} • Due: {fee.dueDate ? new Date(fee.dueDate).toLocaleDateString() : "-"}
                              </p>
                              {fee.payments && fee.payments.length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-1">
                                  {fee.payments.map((payment) => (
                                    <span
                                      key={payment.id}
                                      className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-secondary/40 text-muted-foreground"
                                    >
                                      <Receipt className="h-3 w-3" />
                                      {payment.method.toLowerCase()}: ৳{payment.amount.toLocaleString()}
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
                                <p className="text-sm font-semibold text-foreground">৳{fee.amount.toLocaleString()}</p>
                                <p className="text-xs text-muted-foreground">
                                  Paid: ৳{fee.paidAmount.toLocaleString()}
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
                                      Pay ৳{fee.dueAmount.toLocaleString()}
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
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
