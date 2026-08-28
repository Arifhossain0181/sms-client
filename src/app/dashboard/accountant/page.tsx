"use client";

import { useEffect, useState } from "react";
import { motion, type Variants } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLenis } from "@/hooks/useLenis";
import { useAuth } from "@/hooks/useAuth";
import {
  CreditCard,
  DollarSign,
  Receipt,
  TimerReset,
  TrendingUp,
  BarChart3,
  ArrowLeft,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { feesService } from "@/app/modules/fees/fees.service";
import { formatTaka } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: "easeOut" },
  }),
};

export default function AccountantDashboard() {
  useLenis();
  const router = useRouter();
  const { role } = useAuth();
  const isAccountant =
    !!role && (role === "ACCOUNTANT" || role === "SUPER_ADMIN");

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["fees", "dashboard", "summary"],
    queryFn: () => feesService.getSummary(),
    enabled: isAccountant,
  });

  const { data: transactionsData, isLoading: txLoading } = useQuery({
    queryKey: ["fees", "dashboard", "recent"],
    queryFn: () => feesService.getTransactions({ page: 1, limit: 5 }),
    enabled: isAccountant,
  });

  const recentPayments = Array.isArray(transactionsData?.data) ? transactionsData.data : [];
  const totalCollected = Number(summary?.totalPaid ?? summary?.totalAmount ?? 0);
  const pendingCount = Number(summary?.pendingCount ?? 0);
  const overdueCount = Number(summary?.overdueCount ?? summary?.overDue ?? 0);
  const todayCollection = 0;

  const safeNumber = (value: unknown) => {
    const n = typeof value === "number" ? value : Number(value ?? 0);
    return Number.isFinite(n) ? n : 0;
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);

  const statCards = [
    {
      label: "Total Collected",
      value: formatCurrency(safeNumber(totalCollected)),
      icon: DollarSign,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-500/10",
    },
    {
      label: "Today's Collection",
      value: formatCurrency(safeNumber(todayCollection)),
      icon: CreditCard,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-500/10",
    },
    {
      label: "Pending Fees",
      value: String(safeNumber(pendingCount)),
      icon: Receipt,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-500/10",
    },
    {
      label: "Overdue Fees",
      value: String(safeNumber(overdueCount)),
      icon: TimerReset,
      color: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-50 dark:bg-rose-500/10",
    },
  ];

  useEffect(() => {
    if (role && role !== "ACCOUNTANT" && role !== "SUPER_ADMIN") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  if (!isAccountant) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          You do not have permission to view this page.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Accountant Dashboard
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Track fee collections, transactions, and financial reports.
            </p>
          </div>
          <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryLoading || txLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-6 shadow-xl flex items-center gap-4"
                >
                  <div className="h-14 w-14 rounded-2xl bg-slate-200 dark:bg-slate-700 animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-24 rounded-md bg-slate-200 dark:bg-slate-700 animate-pulse" />
                    <div className="h-6 w-16 rounded-md bg-slate-200 dark:bg-slate-700 animate-pulse" />
                  </div>
                </div>
              ))
            : statCards.map((card, i) => {
                const Icon = card.icon;
                return (
                  <motion.div
                    key={card.label}
                    custom={i}
                    initial="hidden"
                    animate="visible"
                    variants={cardVariants}
                    className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-slate-900/85 p-6 shadow-xl flex items-center gap-4"
                  >
                    <div className={`w-14 h-14 rounded-2xl ${card.bg} flex items-center justify-center shrink-0`}>
                      <Icon className={`w-7 h-7 ${card.color}`} />
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        {card.label}
                      </p>
                      <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                        {card.value}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-slate-900/85 shadow-xl overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/50">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Quick Actions</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: "Collect Fee", href: "/dashboard/fees", icon: CreditCard },
                { label: "View Transactions", href: "/dashboard/accountant/transactions", icon: Receipt },
                { label: "Generate Invoice", href: "/dashboard/accountant/invoice", icon: BarChart3 },
                { label: "Overdue List", href: "/dashboard/accountant/overdue", icon: TimerReset },
                { label: "Fee Analytics", href: "/dashboard/accountant/analytics", icon: TrendingUp },
                { label: "Financial Report", href: "/dashboard/accountant/reports", icon: DollarSign },
              ].map(({ label, href, icon: Icon }) => (
                <Link
                  key={label}
                  href={href}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 transition-colors text-center group"
                >
                  <Icon className="w-6 h-6 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                    {label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-slate-900/85 shadow-xl overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/50">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Payments</h3>
          </div>

          {summaryLoading || txLoading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-3">
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                    <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                  </div>
                  <div className="text-right space-y-1">
                    <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse ml-auto" />
                    <div className="h-3 w-12 bg-slate-200 dark:bg-slate-700 rounded animate-pulse ml-auto" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentPayments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-slate-100 dark:bg-slate-800 mx-auto mb-4">
                <Receipt className="h-6 w-6 text-slate-500 dark:text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">No payment records yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {recentPayments.map((p) => {
                const studentName = p.student?.user?.name ?? `Fee #${p.id.slice(0, 8)}`;
                const amount = p.amount;
                const status = p.status;
                const date = p.paidAt ? new Date(p.paidAt).toLocaleDateString() : new Date(p.createdAt).toLocaleDateString();
                return (
                  <div key={p.id} className="flex items-center justify-between px-6 py-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <div className="flex items-center gap-3">
                      {status === "PAID" ? (
                        <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                          <Sparkles className="w-4 h-4 text-emerald-500" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
                          <AlertCircle className="w-4 h-4 text-amber-500" />
                        </div>
                      )}
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        {studentName}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-800 dark:text-white">
                        {formatTaka(amount)}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {date}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
