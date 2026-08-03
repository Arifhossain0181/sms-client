"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/axios";
import { useLenis } from "@/hooks/useLenis";
import { motion } from "framer-motion";
import { DollarSign, TrendingUp, Building2 } from "lucide-react";
import type { Role } from "@/tyPes/auth.tyPes";

type RevenueData = {
  totalRevenue: number;
  totalTransactions: number;
  bySchool: { name: string; code: string; revenue: number; count: number }[];
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.3 },
  }),
};

export default function RevenuePage() {
  useLenis();
  const router = useRouter();
  const { role } = useAuth();
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role && role !== "SUPER_ADMIN") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get("/super-admin/revenue");
        const payload = res.data?.data ?? res.data;
        setData(payload);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <p className="text-sm text-muted-foreground">Loading revenue report...</p>;
  if (!data) return <p className="text-sm text-muted-foreground">No revenue data available.</p>;

  const maxRevenue = Math.max(...data.bySchool.map((s) => s.revenue), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Revenue Report</h1>
        <p className="text-muted-foreground mt-1">Platform-wide fee collection summary.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <motion.div custom={0} variants={cardVariants} initial="hidden" animate="visible" className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total Revenue</p>
          <div className="mt-3 flex items-center gap-3">
            <DollarSign className="w-5 h-5 text-emerald-500" />
            <p className="text-2xl font-semibold">${data.totalRevenue.toFixed(2)}</p>
          </div>
        </motion.div>
        <motion.div custom={1} variants={cardVariants} initial="hidden" animate="visible" className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Transactions</p>
          <div className="mt-3 flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <p className="text-2xl font-semibold">{data.totalTransactions}</p>
          </div>
        </motion.div>
        <motion.div custom={2} variants={cardVariants} initial="hidden" animate="visible" className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Avg per Transaction</p>
          <div className="mt-3 flex items-center gap-3">
            <DollarSign className="w-5 h-5 text-purple-500" />
            <p className="text-2xl font-semibold">
              ${data.totalTransactions > 0 ? (data.totalRevenue / data.totalTransactions).toFixed(2) : "0.00"}
            </p>
          </div>
        </motion.div>
        <motion.div custom={3} variants={cardVariants} initial="hidden" animate="visible" className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Schools with Revenue</p>
          <div className="mt-3 flex items-center gap-3">
            <Building2 className="w-5 h-5 text-orange-500" />
            <p className="text-2xl font-semibold">{data.bySchool.length}</p>
          </div>
        </motion.div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/80 shadow-soft">
        <div className="p-6 border-b border-border/60">
          <h3 className="text-lg font-semibold">Revenue by School</h3>
        </div>
        <div className="p-6 space-y-4">
          {data.bySchool.length === 0 ? (
            <p className="text-xs text-muted-foreground">No revenue data yet.</p>
          ) : (
            data.bySchool.map((school) => (
              <div key={school.code} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{school.name}</span>
                  <span className="text-muted-foreground">${school.revenue.toFixed(2)} · {school.count} txns</span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(school.revenue / maxRevenue) * 100}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full rounded-full gradient-primary"
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
