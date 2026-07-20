"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLenis } from "@/hooks/useLenis";
import {
  CreditCard,
  DollarSign,
  Receipt,
  TimerReset,
  TrendingUp,
  BarChart3,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { feesService } from "@/app/modules/fees/fees.service";
import { formatTaka } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

const cardVariants = {
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
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Accountant Dashboard
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Track fee collections, transactions, and financial reports.
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {summaryLoading || txLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl flex items-center gap-4"
              >
                <Skeleton className="w-14 h-14 rounded-2xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-24 rounded-md" />
                  <Skeleton className="h-6 w-16 rounded-md" />
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
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl flex items-center gap-4 hover:shadow-2xl transition-shadow"
                >
                  <div
                    className={`w-14 h-14 rounded-2xl ${card.bg} flex items-center justify-center shrink-0`}
                  >
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

      {/* Quick links */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl"
      >
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: "Collect Fee", href: "/dashboard/fees", icon: CreditCard },
            {
              label: "View Transactions",
              href: "/dashboard/accountant/transactions",
              icon: Receipt,
            },
            {
              label: "Generate Invoice",
              href: "/dashboard/accountant/invoice",
              icon: BarChart3,
            },
            {
              label: "Overdue List",
              href: "/dashboard/accountant/overdue",
              icon: TimerReset,
            },
            {
              label: "Fee Analytics",
              href: "/dashboard/accountant/analytics",
              icon: TrendingUp,
            },
            {
              label: "Financial Report",
              href: "/dashboard/accountant/reports",
              icon: DollarSign,
            },
          ].map(({ label, href, icon: Icon }) => (
            <a
              key={label}
              href={href}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-center group"
            >
              <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                {label}
              </span>
            </a>
          ))}
        </div>
      </motion.div>

      {/* Recent payments */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl"
      >
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Recent Payments
        </h3>
        {summaryLoading || txLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-4 h-4 rounded-full" />
                  <Skeleton className="h-4 w-32 rounded-md" />
                </div>
                <div className="text-right space-y-1">
                  <Skeleton className="h-4 w-16 rounded-md ml-auto" />
                  <Skeleton className="h-3 w-12 rounded-md ml-auto" />
                </div>
              </div>
            ))}
          </div>
        ) : recentPayments.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No payment records yet.
          </p>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {recentPayments.map((p) => {
              const studentName =
                p.student?.user?.name ?? `Fee #${p.id.slice(0, 8)}`;
              const amount = p.amount;
              const status = p.status;
              const date = p.paidAt
                ? new Date(p.paidAt).toLocaleDateString()
                : new Date(p.createdAt).toLocaleDateString();
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between py-3"
                >
                  <div className="flex items-center gap-3">
                    {status === "PAID" ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-500" />
                    )}
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      {studentName}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
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
  );
}
