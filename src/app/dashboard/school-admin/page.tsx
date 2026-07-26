"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLenis } from "@/hooks/useLenis";
import api from "@/lib/axios";
import {
  GraduationCap,
  UserCheck,
  Layers,
  BookOpen,
  CalendarCheck,
  Wallet,
  TrendingUp,
  Bell,
  FileBadge,
} from "lucide-react";
import { motion } from "framer-motion";

type StatItem = {
  label: string;
  value: string | number;
  icon: typeof GraduationCap;
  color: string;
  bg: string;
  href?: string;
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: "easeOut" },
  }),
} as any; // eslint-disable-line @typescript-eslint/no-explicit-any

export default function SchoolAdminDashboard() {
  useLenis();
  const router = useRouter();
  const { role } = useAuth();
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    classes: 0,
    subjects: 0,
    pendingAdmissions: 0,
    collectedFees: "0",
    pendingTeachingApplications: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role && role !== "SCHOOL_ADMIN" && role !== "SUPER_ADMIN") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [studentsRes, teachersRes, classesRes, subjectsRes, admissionsRes, feesRes, teachingRes] = await Promise.allSettled([
          api.get("/students"),
          api.get("/teachers"),
          api.get("/classes"),
          api.get("/subjects"),
          api.get("/admission"),
          api.get("/fees"),
          api.get("/teaching"),
        ]);
        setStats({
          students:
            studentsRes.status === "fulfilled"
              ? (studentsRes.value.data?.data?.length ?? studentsRes.value.data?.length ?? 0)
              : 0,
          teachers:
            teachersRes.status === "fulfilled"
              ? (teachersRes.value.data?.data?.length ?? teachersRes.value.data?.length ?? 0)
              : 0,
          classes:
            classesRes.status === "fulfilled"
              ? (classesRes.value.data?.data?.length ?? classesRes.value.data?.length ?? 0)
              : 0,
          subjects:
            subjectsRes.status === "fulfilled"
              ? (subjectsRes.value.data?.data?.length ?? subjectsRes.value.data?.length ?? 0)
              : 0,
          pendingAdmissions:
            admissionsRes.status === "fulfilled"
              ? (admissionsRes.value.data?.data ?? admissionsRes.value.data ?? []).filter((a: { status?: string }) => a.status === "PENDING").length
              : 0,
          collectedFees:
            feesRes.status === "fulfilled"
              ? String(feesRes.value.data?.data?.totalCollected ?? feesRes.value.data?.totalCollected ?? feesRes.value.data?.collected ?? "0")
              : "0",
          pendingTeachingApplications:
            teachingRes.status === "fulfilled"
              ? (teachingRes.value.data?.data ?? teachingRes.value.data ?? []).filter(
                  (a: { status?: string }) => a.status === "PENDING"
                ).length
              : 0,
        });
      } catch {
        // fallback
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const statCards: StatItem[] = [
    {
      label: "Total Students",
      value: loading ? "—" : stats.students,
      icon: GraduationCap,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      label: "Total Teachers",
      value: loading ? "—" : stats.teachers,
      icon: UserCheck,
      color: "text-emerald-600",
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
    },
    {
      label: "Total Classes",
      value: loading ? "—" : stats.classes,
      icon: Layers,
      color: "text-violet-600",
      bg: "bg-violet-50 dark:bg-violet-950/30",
    },
    {
      label: "Subjects Offered",
      value: loading ? "—" : stats.subjects,
      icon: BookOpen,
      color: "text-orange-600",
      bg: "bg-orange-50 dark:bg-orange-950/30",
    },
    {
      label: "Pending Admissions",
      value: loading ? "—" : stats.pendingAdmissions,
      icon: CalendarCheck,
      color: "text-yellow-600",
      bg: "bg-yellow-50 dark:bg-yellow-950/30",
    },
    {
      label: "Pending Teaching Applications",
      value: loading ? "—" : stats.pendingTeachingApplications,
      icon: FileBadge,
      color: "text-indigo-600",
      bg: "bg-indigo-50 dark:bg-indigo-950/30",
      href: "/dashboard/teaching-applications",
    },
    {
      label: "Fees Collected",
      value: loading ? "—" : `৳${stats.collectedFees}`,
      icon: Wallet,
      color: "text-teal-600",
      bg: "bg-teal-50 dark:bg-teal-950/30",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
            School Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your school — students, teachers, classes, and operations.
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground bg-secondary/60 px-4 py-2 rounded-full">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          Academic Year 2025–26
        </div>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          const cardContent = (
            <motion.div
              key={card.label}
              custom={i}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft flex items-center gap-5 hover:shadow-elegant transition-shadow"
            >
              <div className={`w-14 h-14 rounded-2xl ${card.bg} flex items-center justify-center shrink-0`}>
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
          if (card.href) {
            return (
              <a key={card.label} href={card.href} className="block">
                {cardContent}
              </a>
            );
          }
          return cardContent;
        })}
      </div>

      {/* Quick actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft"
      >
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Add Student",    href: "/dashboard/admission",            icon: GraduationCap },
            { label: "Add Teacher",    href: "/dashboard/teachers",             icon: UserCheck },
            { label: "Manage Classes", href: "/dashboard/class",                icon: Layers },
            { label: "View Notices",   href: "/dashboard/notices",              icon: Bell },
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

      {/* Notice */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft"
      >
        <h3 className="text-lg font-semibold mb-3">Recent Activity</h3>
        <p className="text-sm text-muted-foreground">
          No recent activity to show. Data will appear here as your school grows.
        </p>
      </motion.div>
    </div>
  );
}
