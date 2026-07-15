"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLenis } from "@/hooks/useLenis";
import api from "@/lib/axios";
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
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCollected: 0,
    pending: 0,
    overdue: 0,
    todayCollection: 0,
  });
  const [recentPayments, setRecentPayments] = useState<
    { id: number; studentName: string; amount: number; status: string; date: string }[]
  >([]);

  useEffect(() => {
    if (role && role !== "ACCOUNTANT" && role !== "SUPER_ADMIN") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get("/fees");
        const data = res.data?.data ?? res.data ?? [];
        const arr = Array.isArray(data) ? data : [];
        const paid = arr.filter((f: { status: string }) => f.status === "PAID");
        const overdue = arr.filter((f: { status: string }) => f.status === "OVERDUE");
        const pending = arr.filter((f: { status: string }) => f.status === "PENDING");
        setStats({
          totalCollected: paid.reduce((s: number, f: { amount: number }) => s + (f.amount ?? 0), 0),
          pending: pending.length,
          overdue: overdue.length,
          todayCollection: 0,
        });
        setRecentPayments(arr.slice(0, 5));
      } catch {
        // fallback
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const statCards = [
    {
      label: "Total Collected",
      value: loading ? "—" : `৳${stats.totalCollected.toLocaleString()}`,
      icon: DollarSign,
      color: "text-emerald-600",
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
    },
    {
      label: "Today's Collection",
      value: loading ? "—" : `৳${stats.todayCollection.toLocaleString()}`,
      icon: CreditCard,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      label: "Pending Fees",
      value: loading ? "—" : stats.pending,
      icon: Receipt,
      color: "text-yellow-600",
      bg: "bg-yellow-50 dark:bg-yellow-950/30",
    },
    {
      label: "Overdue Fees",
      value: loading ? "—" : stats.overdue,
      icon: TimerReset,
      color: "text-red-600",
      bg: "bg-red-50 dark:bg-red-950/30",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
          Accountant Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Track fee collections, transactions, and financial reports.
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              custom={i}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft flex items-center gap-4 hover:shadow-elegant transition-shadow"
            >
              <div className={`w-13 h-13 w-14 h-14 rounded-2xl ${card.bg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-7 h-7 ${card.color}`} />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {card.label}
                </p>
                <p className="mt-1 text-2xl font-bold">{card.value}</p>
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
        className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft"
      >
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: "Collect Fee",       href: "/dashboard/fees",                  icon: CreditCard },
            { label: "View Transactions", href: "/dashboard/accountant/transactions", icon: Receipt },
            { label: "Generate Invoice",  href: "/dashboard/accountant/invoice",     icon: BarChart3 },
            { label: "Overdue List",      href: "/dashboard/accountant/overdue",     icon: TimerReset },
            { label: "Fee Analytics",     href: "/dashboard/accountant/analytics",   icon: TrendingUp },
            { label: "Financial Report",  href: "/dashboard/accountant/reports",     icon: DollarSign },
          ].map(({ label, href, icon: Icon }) => (
            <a
              key={label}
              href={href}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors text-center group"
            >
              <Icon className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
              <span className="text-xs font-medium">{label}</span>
            </a>
          ))}
        </div>
      </motion.div>

      {/* Recent payments */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft"
      >
        <h3 className="text-lg font-semibold mb-4">Recent Payments</h3>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : recentPayments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No payment records yet.</p>
        ) : (
          <div className="divide-y divide-border/60">
            {recentPayments.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  {p.status === "PAID" ? (
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                  )}
                  <span className="text-sm font-medium">
                    {(p as { studentName?: string }).studentName ?? `Fee #${p.id}`}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">৳{p.amount}</p>
                  <p className="text-xs text-muted-foreground">{p.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
