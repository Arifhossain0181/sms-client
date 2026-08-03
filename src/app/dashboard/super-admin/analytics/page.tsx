"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/axios";
import { useLenis } from "@/hooks/useLenis";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Users, GraduationCap, School, Building2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

type AnalyticsData = {
  totalSchools: number;
  activeSchools: number;
  inactiveSchools: number;
  totalStudents: number;
  totalTeachers: number;
  totalStaff: number;
  totalClasses: number;
  totalUsers: number;
  recentAuditLogs: number;
  schoolBreakdown: {
    id: string;
    name: string;
    isActive: boolean;
    _count: { students: number; teachers: number; classes: number };
  }[];
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.3 },
  }),
};

export default function AnalyticsPage() {
  useLenis();
  const router = useRouter();
  const { role } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
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
        const res = await api.get("/super-admin/analytics");
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

  if (loading) return <p className="text-sm text-muted-foreground">Loading analytics...</p>;
  if (!data) return <p className="text-sm text-muted-foreground">No analytics data available.</p>;

  const stats = [
    { label: "Total Schools", value: data.totalSchools, icon: School, color: "text-blue-500" },
    { label: "Active Schools", value: data.activeSchools, icon: Building2, color: "text-emerald-500" },
    { label: "Total Students", value: data.totalStudents, icon: GraduationCap, color: "text-purple-500" },
    { label: "Total Teachers", value: data.totalTeachers, icon: Users, color: "text-orange-500" },
    { label: "Total Staff", value: data.totalStaff, icon: Users, color: "text-teal-500" },
    { label: "Total Classes", value: data.totalClasses, icon: BarChart3, color: "text-amber-500" },
    { label: "Total Users", value: data.totalUsers, icon: Users, color: "text-pink-500" },
    { label: "Audit Events (30d)", value: data.recentAuditLogs, icon: TrendingUp, color: "text-cyan-500" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Platform Analytics</h1>
        <p className="text-muted-foreground mt-1">Cross-school performance overview.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            custom={i}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{stat.label}</p>
            <div className="mt-3 flex items-center gap-3">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
              <p className="text-2xl font-semibold">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/80 shadow-soft">
        <div className="p-6 border-b border-border/60">
          <h3 className="text-lg font-semibold">School Overview</h3>
          <p className="text-xs text-muted-foreground">Students, teachers and classes per school</p>
        </div>
        <div className="p-6">
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={data.schoolBreakdown}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                interval={0}
                angle={-25}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid rgba(148,163,184,0.25)",
                  backgroundColor: "rgba(15,23,42,0.9)",
                  color: "#e2e8f0",
                }}
              />
              <Legend />
              <Bar dataKey="_count.students" name="Students" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="_count.teachers" name="Teachers" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="_count.classes" name="Classes" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
