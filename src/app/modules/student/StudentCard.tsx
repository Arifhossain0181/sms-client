"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Phone,
  GraduationCap,
  Cake,
  CalendarDays,
  MapPin,
  User,
  Venus,
  Mars,
  AlertCircle,
} from "lucide-react";
import { useStudent } from "./useStudents";
import { formatDate } from "@/lib/utils";

interface Props {
  id: string;
}

// gradient picker from name
const gradients = [
  "from-sky-500 via-blue-500 to-indigo-600",
  "from-violet-500 via-purple-500 to-fuchsia-600",
  "from-emerald-500 via-teal-500 to-cyan-600",
  "from-amber-500 via-orange-500 to-rose-600",
  "from-pink-500 via-rose-500 to-red-600",
];
const pickGradient = (s: string) =>
  gradients[
    s.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % gradients.length
  ];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.45 },
  }),
};

export default function StudentCard({ id }: Props) {
  const { data: student, isLoading } = useStudent(id);
  const router = useRouter();

  if (isLoading) return <SkeletonCard />;

  if (!student)
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3 text-slate-600 dark:text-slate-300">
          <AlertCircle className="w-10 h-10 text-rose-500" />
          <p className="text-lg font-semibold">Student not found</p>
        </div>
      </div>
    );

  const grad = pickGradient(student.name);
  const GenderIcon =
    student.gender?.toLowerCase() === "female"
      ? Venus
      : student.gender?.toLowerCase() === "male"
        ? Mars
        : User;

  const details = [
    { label: "Phone", value: student.phone, icon: Phone },
    { label: "Class", value: student.class?.name ?? "—", icon: GraduationCap },
    { label: "Date of Birth", value: formatDate(student.dateOfBirth), icon: Cake },
    { label: "Joining date", value: formatDate(student.createdAt), icon: CalendarDays },
    { label: "Address", value: student.address, icon: MapPin, full: true },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 px-4 py-10">
      {/* animated orbs */}
      <motion.div
        aria-hidden
        animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full bg-sky-300/30 dark:bg-sky-500/20 blur-3xl"
      />
      <motion.div
        aria-hidden
        animate={{ x: [0, -30, 0], y: [0, 40, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-violet-300/30 dark:bg-violet-500/20 blur-3xl"
      />

      <div className="relative max-w-3xl mx-auto">
        {/* Back */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ x: -4 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => router.back()}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/60 backdrop-blur px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 shadow-sm hover:shadow-md transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </motion.button>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 120, damping: 18 }}
          className="relative overflow-hidden rounded-3xl border border-white/40 dark:border-white/10 bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl shadow-2xl shadow-slate-900/10 dark:shadow-black/40"
        >
          {/* Header banner */}
          <div className={`relative h-36 bg-gradient-to-br ${grad}`}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.4),transparent_60%)]" />
          </div>

          {/* Top section */}
          <div className="px-6 sm:px-10 pb-8 -mt-16">
            <div className="flex flex-col sm:flex-row sm:items-end gap-5">
              {/* Avatar */}
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 180, damping: 14, delay: 0.15 }}
                className="relative"
              >
                <motion.span
                  aria-hidden
                  animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 2.4, repeat: Infinity }}
                  className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${grad} blur-xl`}
                />
                <div
                  className={`relative w-28 h-28 rounded-3xl bg-gradient-to-br ${grad} ring-4 ring-white dark:ring-slate-900 grid place-items-center text-white text-4xl font-bold shadow-xl`}
                >
                  {student.name.charAt(0).toUpperCase()}
                </div>
              </motion.div>

              {/* Name block */}
              <div className="flex-1 sm:pb-2">
                <motion.h1
                  variants={fadeUp}
                  custom={1}
                  initial="hidden"
                  animate="show"
                  className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight"
                >
                  {student.name}
                </motion.h1>
                <motion.p
                  variants={fadeUp}
                  custom={2}
                  initial="hidden"
                  animate="show"
                  className="mt-1 flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400"
                >
                  <Mail className="w-4 h-4" />
                  {student.email}
                </motion.p>
                <motion.span
                  variants={fadeUp}
                  custom={3}
                  initial="hidden"
                  animate="show"
                  className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 capitalize"
                >
                  <GenderIcon className="w-3.5 h-3.5" />
                  {student.gender}
                </motion.span>
              </div>
            </div>

            {/* Details grid */}
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {details.map((d, i) => {
                const Icon = d.icon;
                return (
                  <motion.div
                    key={d.label}
                    variants={fadeUp}
                    custom={i + 4}
                    initial="hidden"
                    animate="show"
                    whileHover={{ y: -3 }}
                    className={`group relative overflow-hidden rounded-2xl border border-slate-200/70 dark:border-white/10 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800/60 dark:to-slate-900/60 p-4 shadow-sm hover:shadow-lg transition ${
                      d.full ? "sm:col-span-2" : ""
                    }`}
                  >
                    <div
                      className={`absolute -right-6 -top-6 w-20 h-20 rounded-full bg-gradient-to-br ${grad} opacity-10 group-hover:opacity-20 transition`}
                    />
                    <div className="flex items-start gap-3">
                      <div
                        className={`shrink-0 grid place-items-center w-10 h-10 rounded-xl bg-gradient-to-br ${grad} text-white shadow-md`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          {d.label}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white break-words">
                          {d.value || "—"}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="min-h-screen px-4 py-10 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-3xl mx-auto">
        <div className="h-9 w-24 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse mb-6" />
        <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/60 overflow-hidden shadow-xl">
          <div className="h-36 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-700 animate-pulse" />
          <div className="px-8 pb-8 -mt-16">
            <div className="w-28 h-28 rounded-3xl bg-slate-300 dark:bg-slate-700 animate-pulse ring-4 ring-white dark:ring-slate-900" />
            <div className="mt-4 h-7 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            <div className="mt-2 h-4 w-64 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-20 rounded-2xl bg-slate-100 dark:bg-slate-800/60 animate-pulse"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}