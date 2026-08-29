"use client";

import { useState } from "react";
import { ClipboardList, CheckSquare, CalendarDays, Sparkles } from "lucide-react";
import AttendanceTable from "@/app/modules/attendence/AttendanceTable";
import MarkAttendance from "@/app/modules/attendence/MarkAttendance";
import { useAuth } from "@/hooks/useAuth";
import { hasPermission } from "@/config/roles";
import { cn } from "@/lib/utils";

export default function AttendancePage() {
  const { role } = useAuth();
  const [tab, setTab] = useState<"list" | "mark">("list");

  const canMark = role && hasPermission(role, "mark_attendance");

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const tabs = [
    {
      id: "list" as const,
      label: "Attendance Records",
      icon: ClipboardList,
      gradient: "from-violet-600 via-indigo-600 to-blue-600",
      shadow: "shadow-indigo-500/30",
      show: true,
    },
    {
      id: "mark" as const,
      label: "Take Attendance",
      icon: CheckSquare,
      gradient: "from-emerald-500 via-teal-500 to-cyan-500",
      shadow: "shadow-emerald-500/30",
      show: !!canMark,
    },
  ].filter((t) => t.show);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-emerald-50 dark:from-[#0b1020] dark:via-[#0a0f1f] dark:to-[#0b1226]">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-gradient-to-br from-violet-400/30 to-indigo-400/30 blur-3xl dark:from-violet-600/20 dark:to-indigo-600/20" />
      <div className="pointer-events-none absolute -top-20 right-0 h-80 w-80 rounded-full bg-gradient-to-br from-emerald-400/25 to-cyan-400/25 blur-3xl dark:from-emerald-500/15 dark:to-cyan-500/15" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-gradient-to-br from-pink-300/20 to-amber-300/20 blur-3xl dark:from-fuchsia-500/10 dark:to-amber-500/10" />

      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 overflow-hidden rounded-3xl border border-white/60 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 p-[1px] shadow-xl shadow-indigo-500/20 dark:border-white/10 dark:shadow-indigo-500/10">
          <div className="rounded-[calc(1.5rem-1px)] bg-white/80 px-6 py-6 backdrop-blur-xl sm:px-8 sm:py-7 dark:bg-slate-950/70">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow-lg shadow-indigo-500/30">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent sm:text-4xl dark:from-indigo-300 dark:via-violet-300 dark:to-fuchsia-300">
                    Attendance
                  </h1>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    Track, manage, and record student attendance with ease.
                  </p>
                </div>
              </div>

              <div className="inline-flex items-center gap-2 self-start rounded-full border border-indigo-200/60 bg-white/70 px-4 py-2 text-sm font-medium text-indigo-700 shadow-sm backdrop-blur sm:self-auto dark:border-indigo-400/30 dark:bg-indigo-500/10 dark:text-indigo-200">
                <CalendarDays className="h-4 w-4" />
                {today}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 inline-flex rounded-2xl border border-slate-200/70 bg-white/70 p-1.5 shadow-lg shadow-slate-200/50 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/60 dark:shadow-black/40">
          {tabs.map(({ id, label, icon: Icon, gradient, shadow }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={cn(
                  "relative inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-300",
                  active
                    ? `bg-gradient-to-r ${gradient} text-white shadow-lg ${shadow} scale-[1.02]`
                    : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            );
          })}
        </div>

        {/* Content card */}
        <div className="relative rounded-3xl border border-white/60 bg-gradient-to-br from-white via-white to-indigo-50/40 p-[1px] shadow-xl shadow-indigo-500/5 dark:border-white/10 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/40 dark:shadow-black/40">
          <div className="rounded-[calc(1.5rem-1px)] bg-white/80 p-4 backdrop-blur-xl sm:p-6 dark:bg-slate-950/70 dark:text-slate-100">
            {/* Accent bar */}
            <div
              className={cn(
                "mb-4 h-1 w-16 rounded-full bg-gradient-to-r transition-all",
                tab === "list"
                  ? "from-violet-500 to-blue-500"
                  : "from-emerald-500 to-cyan-500",
              )}
            />
            {tab === "list" ? <AttendanceTable /> : <MarkAttendance />}
          </div>
        </div>
      </div>
    </div>
  );
}
