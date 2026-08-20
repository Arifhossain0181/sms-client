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
  Loader2,
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

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.3 },
  }),
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
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
    { label: "Total Fees", value: `৳${selectedChildSummary.totalFees.toLocaleString()}`, icon: Wallet, color: "from-slate-400 to-slate-500" },
    { label: "Total Paid", value: `৳${selectedChildSummary.totalPaid.toLocaleString()}`, icon: TrendingUp, color: "from-emerald-400 to-teal-500" },
    { label: "Outstanding", value: `৳${selectedChildSummary.outstanding.toLocaleString()}`, icon: TrendingDown, color: "from-amber-400 to-orange-500" },
    { label: "Overdue", value: String(selectedChildSummary.overDue), icon: AlertTriangle, color: "from-rose-400 to-pink-500" },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50/50 dark:bg-slate-950">
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

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="relative w-full p-4 sm:p-6 space-y-6"
      >
        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/10 shadow-2xl shadow-slate-200/40 dark:shadow-none overflow-hidden">
          {/* Header */}
          <div className="relative px-6 sm:px-8 py-6 bg-gradient-to-r from-sky-50 via-indigo-50 to-violet-50 dark:from-sky-500/10 dark:via-indigo-500/10 dark:to-violet-50 dark:to-violet-500/10 border-b border-white/40 dark:border-white/5 overflow-hidden">
            <motion.div
              animate={{ x: [0, 100, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none"
            />

            <div className="relative flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <motion.div
                  whileHover={{ scale: 1.08, rotate: 4 }}
                  className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400 via-indigo-400 to-violet-500 shadow-lg shadow-indigo-500/30 flex items-center justify-center cursor-pointer"
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
                    Fees
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    Manage your children&apos;s fees and payments.
                  </p>
                </div>
              </div>

              <Link
                href="/dashboard/parent"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to dashboard
              </Link>
            </div>
          </div>

          {/* Children selector */}
          {childrenLoading ? (
            <div className="px-4 sm:px-6 pt-6">
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div key={idx} className="h-10 w-40 rounded-xl bg-white/60 dark:bg-white/5 border border-white/30 dark:border-white/10" />
                ))}
              </div>
            </div>
          ) : children.length === 0 ? (
            <div className="p-6">
              <div className="rounded-2xl border border-white/30 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-sm p-12 text-center">
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="w-14 h-14 rounded-full bg-gradient-to-br from-sky-100 via-indigo-100 to-violet-100 dark:from-sky-500/10 dark:via-indigo-500/10 dark:to-violet-500/10 flex items-center justify-center mx-auto mb-4 ring-1 ring-indigo-200/60 dark:ring-indigo-400/20"
                >
                  <Inbox className="w-6 h-6 text-indigo-400" />
                </motion.div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">No children linked</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Children will appear here once linked to your account.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="px-4 sm:px-6 pt-6">
                <div className="flex flex-wrap gap-2">
                  {children.map((child) => (
                    <motion.button
                      key={child.id}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedChildId(child.id)}
                      className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs sm:text-sm font-medium transition-colors ${
                        selectedChildId === child.id
                          ? "bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 text-white border-transparent shadow-lg shadow-indigo-500/30"
                          : "border-white/30 dark:border-white/10 bg-white/60 dark:bg-white/5 text-slate-700 dark:text-slate-200 hover:bg-white/80 dark:hover:bg-white/10"
                      }`}
                    >
                      <UsersRound className="h-4 w-4" />
                      {child.name}
                    </motion.button>
                  ))}
                </div>
              </div>

              {selectedChild && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 sm:p-6 space-y-6"
                >
                  <div className="mb-2">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">{selectedChild.name}</h2>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {selectedChild.class?.name ?? "Class"} · {selectedChild.section?.name ?? "Section"} · Roll: {selectedChild.rollNumber ?? "-"}
                    </p>
                  </div>

                  {feesLoading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {Array.from({ length: 4 }).map((_, idx) => (
                        <div key={idx} className="rounded-2xl border border-white/30 dark:border-white/10 bg-white/60 dark:bg-white/5 p-4 space-y-3">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-8 w-16" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {stats.map((stat, i) => (
                        <motion.div
                          key={stat.label}
                          custom={i}
                          variants={cardVariants}
                          initial="hidden"
                          animate="visible"
                          className="relative flex items-center gap-3 p-4 rounded-2xl border border-white/30 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-sm"
                        >
                          <div className={`flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white shadow-md shadow-indigo-500/20`}>
                            <stat.icon className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 truncate">{stat.label}</p>
                            <p className="text-lg font-bold text-slate-800 dark:text-white mt-0.5">{stat.value}</p>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}

                  <div className="rounded-2xl border border-white/30 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/30 dark:border-white/10 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                        <Receipt className="w-4 h-4" />
                      </div>
                      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Fee Details</h3>
                    </div>

                    {feesLoading ? (
                      <div className="p-6 space-y-4">
                        {Array.from({ length: 4 }).map((_, idx) => (
                          <div key={idx} className="flex items-center justify-between rounded-xl border border-white/20 dark:border-white/10 px-4 py-3">
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
                        <motion.div
                          animate={{ y: [0, -8, 0] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                          className="w-14 h-14 rounded-full bg-gradient-to-br from-sky-100 via-indigo-100 to-violet-100 dark:from-sky-500/10 dark:via-indigo-500/10 dark:to-violet-500/10 flex items-center justify-center mx-auto mb-4 ring-1 ring-indigo-200/60 dark:ring-indigo-400/20"
                        >
                          <Receipt className="w-6 h-6 text-indigo-400" />
                        </motion.div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">No fee records found</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Fee details will appear here once assigned.</p>
                      </div>
                    ) : (
                      <motion.div variants={container} initial="hidden" animate="show" className="divide-y divide-white/30 dark:divide-white/5">
                        {selectedChildFees.map((fee) => {
                          const style = statusStyles[fee.status] ?? statusStyles.UNPAID;
                          const StatusIcon = style.icon;
                          const canPay = fee.status !== "PAID";

                          return (
                            <motion.div
                              key={fee.id}
                              variants={item}
                              whileHover={{ x: 4, transition: { duration: 0.15 } }}
                              className="px-6 py-4 hover:bg-white/40 dark:hover:bg-white/10 transition-colors"
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
                                  <p className="text-xs text-slate-400 dark:text-slate-500">
                                    {fee.feeType} • Due: {fee.dueDate ? new Date(fee.dueDate).toLocaleDateString() : "-"}
                                  </p>
                                  {fee.payments && fee.payments.length > 0 && (
                                    <div className="flex flex-wrap gap-2 pt-1">
                                      {fee.payments.map((payment) => (
                                        <span
                                          key={payment.id}
                                          className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-white/60 dark:bg-white/5 text-slate-500 dark:text-slate-400 border border-white/30 dark:border-white/10"
                                        >
                                          <Receipt className="h-3 w-3" />
                                          {payment.method.toLowerCase()}: ৳{payment.amount.toLocaleString()}
                                          {payment.transactionId && (
                                            <span className="text-[9px] text-slate-400 dark:text-slate-500">
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
                                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">৳{fee.amount.toLocaleString()}</p>
                                    <p className="text-xs text-slate-400 dark:text-slate-500">
                                      Paid: ৳{fee.paidAmount.toLocaleString()}
                                    </p>
                                  </div>
                                  {canPay && fee.dueAmount > 0 && (
                                    <motion.button
                                      whileHover={{ scale: 1.03 }}
                                      whileTap={{ scale: 0.97 }}
                                      onClick={() => handlePay(fee.id)}
                                      disabled={payingId === fee.id}
                                      className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {payingId === fee.id ? (
                                        <>
                                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                          Processing...
                                        </>
                                      ) : (
                                        <>
                                          <CreditCard className="h-3.5 w-3.5" />
                                          Pay ৳{fee.dueAmount.toLocaleString()}
                                        </>
                                      )}
                                    </motion.button>
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

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 1 }}
          className="text-center text-[10px] font-bold tracking-[0.3em] uppercase text-slate-400 dark:text-slate-600"
        >
          EduCore Parent Panel
        </motion.p>
      </motion.div>
    </div>
  );
}
