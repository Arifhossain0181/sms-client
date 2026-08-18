"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/axios";
import { useLenis } from "@/hooks/useLenis";
import { motion } from "framer-motion";
import {
  Server,
  Play,
  CheckCircle,
  Clock,
  ShieldCheck,
  HardDrive,
  TimerReset,
  Loader2,
  Sparkles,
} from "lucide-react";
import type { Role } from "@/tyPes/auth.tyPes";

type BackupRecord = {
  id: string;
  success: boolean;
  message: string;
  backupId: string;
  timestamp: string;
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.3 },
  }),
};

const stats = [
  {
    label: "Auto Backup",
    value: "Daily",
    icon: TimerReset,
    color: "from-sky-400 to-indigo-500",
    helper: "Runs at 02:00 UTC",
  },
  {
    label: "Retention",
    value: "30 Days",
    icon: HardDrive,
    color: "from-violet-400 to-purple-500",
    helper: "Rolling window",
  },
  {
    label: "Status",
    value: "Ready",
    icon: ShieldCheck,
    color: "from-emerald-400 to-teal-500",
    helper: "Recovery enabled",
  },
];

export default function BackupsPage() {
  useLenis();
  const router = useRouter();
  const { role } = useAuth();
  const [triggering, setTriggering] = useState(false);
  const [lastBackup, setLastBackup] = useState<BackupRecord | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (role && role !== "SUPER_ADMIN") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  const handleTriggerBackup = async () => {
    setTriggering(true);
    setMessage(null);
    try {
      const res = await api.post("/super-admin/backup");
      const payload = res.data?.data ?? res.data;
      setLastBackup(payload);
      setMessage("Backup triggered successfully.");
    } catch {
      setMessage("Failed to trigger backup.");
    } finally {
      setTriggering(false);
    }
  };

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
          <div className="relative px-6 sm:px-8 py-6 bg-gradient-to-r from-sky-50 via-indigo-50 to-violet-50 dark:from-sky-500/10 dark:via-indigo-500/10 dark:to-violet-500/10 border-b border-white/40 dark:border-white/5 overflow-hidden">
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
                  <ShieldCheck className="w-6 h-6 text-white" />
                  <motion.div
                    className="absolute inset-0 rounded-2xl border-2 border-white/40 dark:border-white/20"
                    animate={{ scale: [1, 1.12, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2.4, repeat: Infinity }}
                  />
                </motion.div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    Backup & Recovery
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    Manage database snapshots and recovery controls.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="p-4 sm:p-6 border-b border-white/30 dark:border-white/5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{stat.helper}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Message */}
          <div className="px-6">
            {message && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-6 px-4 py-3 rounded-xl text-sm font-medium border ${
                  message.includes("success")
                    ? "bg-emerald-50/80 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20"
                    : "bg-red-50/80 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/20"
                }`}
              >
                {message}
              </motion.div>
            )}
          </div>

          {/* Actions */}
          <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <motion.div
              custom={0}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className="p-5 rounded-2xl border border-white/30 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-sm"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 via-indigo-400 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                  <Play className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Manual Backup</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500">On-demand snapshot</p>
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Initiating a backup will create a snapshot of the current database state. This operation may take a few minutes depending on database size.
              </p>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleTriggerBackup}
                disabled={triggering}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all disabled:opacity-50"
              >
                {triggering ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Triggering...
                  </span>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Trigger Backup
                  </>
                )}
              </motion.button>
            </motion.div>

            <motion.div
              custom={1}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className="p-5 rounded-2xl border border-white/30 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-sm"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Last Backup</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Most recent record</p>
                </div>
              </div>
              {lastBackup ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{lastBackup.message}</span>
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Backup ID: {lastBackup.backupId}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Timestamp: {new Date(lastBackup.timestamp).toLocaleString()}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-400 dark:text-slate-500">No manual backups triggered yet.</p>
              )}
            </motion.div>
          </div>

          {/* Info */}
          <div className="px-4 sm:px-6 pb-6">
            <div className="p-5 rounded-2xl border border-white/30 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-2">
                <Server className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Backup Information</h3>
              </div>
              <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
                <p>Automatic backups run daily at 02:00 UTC.</p>
                <p>Backups are retained for 30 days.</p>
                <p>Contact your system administrator for recovery procedures.</p>
              </div>
            </div>
          </div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 1 }}
          className="text-center text-[10px] font-bold tracking-[0.3em] uppercase text-slate-400 dark:text-slate-600"
        >
          EduCore Super Admin Panel
        </motion.p>
      </motion.div>
    </div>
  );
}
