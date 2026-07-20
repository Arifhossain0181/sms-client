"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  PieChart,
  DollarSign,
  Inbox,
  Loader2,
  TrendingUp,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { formatTaka, cn } from "@/lib/utils";
import { feesService } from "@/app/modules/fees/fees.service";
import { useAuth } from "@/hooks/useAuth";
import { hasPermission } from "@/config/roles";
import { Skeleton } from "@/components/ui/skeleton";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 280, damping: 24 } },
};

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const methodColors: Record<string, string> = {
  STRIPE: "#3b82f6",
  CASH: "#10b981",
  ONLINE: "#3b82f6",
  OFFLINE: "#10b981",
};

export default function AnalyticsPage() {
  const { role } = useAuth();
  const canView = !!role && hasPermission(role, "view_financial_reports");

  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);

  const { data, isLoading } = useQuery({
    queryKey: ["fees", "analytics", "monthly", year],
    queryFn: () => feesService.getMonthlyAnalytics({ year }),
    enabled: canView,
  });

  if (!canView) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">You do not have permission to view this page.</p>
      </div>
    );
  }

  const byMonth = data?.byMonth ?? [];
  const maxTotal = useMemo(() => Math.max(...byMonth.map((m) => m.total ?? 0), 1), [byMonth]);
  const byMethod = data?.byMethod ?? {};
  const byType = data?.byType ?? {};
  const totalYearAmount = byMonth.reduce((s, m) => s + (m.total ?? 0), 0);
  const totalYearCount = byMonth.reduce((s, m) => {
    const count = typeof m.count === "object" && m.count !== null ? (m.count as any).id ?? 0 : (m.count ?? 0);
    return s + (Number(count) || 0);
  }, 0);

  const methodEntries = Object.entries(byMethod);
  const totalMethodAmount = methodEntries.reduce((s, [, v]) => s + v, 0);

  const conicGradient = useMemo(() => {
    if (totalMethodAmount === 0) return "conic-gradient(#e2e8f0 0% 100%)";
    let cumulative = 0;
    const stops = methodEntries.map(([method, amount]) => {
      const start = (cumulative / totalMethodAmount) * 100;
      cumulative += amount;
      const end = (cumulative / totalMethodAmount) * 100;
      const color = methodColors[method] ?? "#94a3b8";
      return `${color} ${start}% ${end}%`;
    }).join(", ");
    return `conic-gradient(${stops})`;
  }, [methodEntries, totalMethodAmount]);

  const typeEntries = Object.entries(byType);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 sm:p-6 lg:p-8">
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Fee Analytics</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Monthly collection analysis for {year}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select value={year} onChange={(e) => setYear(Number(e.target.value))}
              className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20">
              {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </motion.div>

        {/* Year Summary */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 ring-1 ring-blue-500/20 shadow-xl shadow-blue-500/10">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Year Total</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{formatTaka(totalYearAmount)}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{totalYearCount} transactions</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 ring-1 ring-indigo-500/20 shadow-xl shadow-indigo-500/10">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Avg. Monthly</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{formatTaka(totalYearCount > 0 ? totalYearAmount / 12 : 0)}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">per month average</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl p-5 ring-1 ring-slate-200 dark:ring-slate-800 shadow-xl space-y-3">
                <Skeleton className="h-3 w-24 rounded-md" />
                <Skeleton className="h-8 w-32 rounded-md" />
                <Skeleton className="h-4 w-40 rounded-md" />
                <Skeleton className="w-10 h-10 rounded-xl ml-auto mt-2" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Monthly Bar Chart */}
            <motion.div variants={itemVariants}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 ring-1 ring-slate-200 dark:ring-slate-800 shadow-xl">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Monthly Collection ({year})
              </h3>
              <div className="flex items-end gap-2 h-64">
                {byMonth.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400">No data available.</p>
                  </div>
                ) : (
                  Array.from({ length: 12 }, (_, i) => {
                    const monthData = byMonth.find((m) => m.month === i + 1);
                    const total = monthData?.total ?? 0;
                    const heightPercent = maxTotal > 0 ? (total / maxTotal) * 100 : 0;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full flex flex-col items-center justify-end h-56">
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${Math.max(heightPercent, 0)}%` }}
                            transition={{ duration: 0.6, delay: i * 0.05, ease: "easeOut" }}
                            className="w-full max-w-[40px] bg-gradient-to-t from-blue-500 to-indigo-500 rounded-t-lg min-h-[4px] relative group"
                          >
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                              {formatTaka(total)}
                            </div>
                          </motion.div>
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{MONTH_NAMES[i]}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>

            {/* Method & Type Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* By Method - Donut Chart */}
              <motion.div variants={itemVariants}
                className="bg-white dark:bg-slate-900 rounded-2xl p-6 ring-1 ring-slate-200 dark:ring-slate-800 shadow-xl">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-indigo-600" />
                  Payment Method
                </h3>
                {methodEntries.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">No data available.</p>
                ) : (
                  <div className="flex items-center gap-6">
                    <div className="w-32 h-32 rounded-full shrink-0" style={{ background: conicGradient }} />
                    <div className="flex-1 space-y-3">
                      {methodEntries.map(([method, amount]) => {
                        const pct = totalMethodAmount > 0 ? ((amount as number) / totalMethodAmount) * 100 : 0;
                        const color = methodColors[method] ?? "#94a3b8";
                        return (
                          <div key={method} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                              <span className="text-sm text-slate-700 dark:text-slate-300">{method}</span>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-slate-900 dark:text-white">{formatTaka(amount as number)}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{pct.toFixed(1)}%</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>

              {/* By Type Breakdown */}
              <motion.div variants={itemVariants}
                className="bg-white dark:bg-slate-900 rounded-2xl p-6 ring-1 ring-slate-200 dark:ring-slate-800 shadow-xl">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  Collection by Type
                </h3>
                {typeEntries.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">No data available.</p>
                ) : (
                  <div className="space-y-4">
                    {typeEntries.map(([type, values]) => {
                      const total = (values as { amount: number; paid: number }).amount;
                      const paid = (values as { amount: number; paid: number }).paid;
                      const rate = total > 0 ? (paid / total) * 100 : 0;
                      return (
                        <div key={type} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{type}</span>
                            <span className="text-sm font-semibold text-slate-900 dark:text-white">{formatTaka(total)}</span>
                          </div>
                          <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${rate}%` }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                              className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full"
                            />
                          </div>
                          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                            <span>Paid: {formatTaka(paid)}</span>
                            <span>{rate.toFixed(0)}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
