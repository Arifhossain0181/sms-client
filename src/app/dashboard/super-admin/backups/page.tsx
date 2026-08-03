"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/axios";
import { useLenis } from "@/hooks/useLenis";
import { motion } from "framer-motion";
import { Server, Download, Play, CheckCircle, Clock } from "lucide-react";
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Backup & Recovery</h1>
        <p className="text-muted-foreground mt-1">Manage database backups.</p>
      </div>

      {message && (
        <div className={`px-4 py-3 rounded-xl text-sm ${message.includes("success") ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <motion.div custom={0} variants={cardVariants} initial="hidden" animate="visible" className="rounded-2xl border border-border/60 bg-card/80 shadow-soft">
          <div className="p-6 border-b border-border/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-white">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Manual Backup</h3>
                <p className="text-xs text-muted-foreground">Trigger an on-demand database backup</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              Initiating a backup will create a snapshot of the current database state. This operation may take a few minutes depending on database size.
            </p>
            <button
              onClick={handleTriggerBackup}
              disabled={triggering}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-primary text-white text-sm font-medium shadow-elegant hover:shadow-lg transition-all disabled:opacity-50"
            >
              <Play className="w-4 h-4" /> {triggering ? "Triggering..." : "Trigger Backup"}
            </button>
          </div>
        </motion.div>

        <motion.div custom={1} variants={cardVariants} initial="hidden" animate="visible" className="rounded-2xl border border-border/60 bg-card/80 shadow-soft">
          <div className="p-6 border-b border-border/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-white">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Last Backup</h3>
                <p className="text-xs text-muted-foreground">Most recent backup record</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            {lastBackup ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-medium">{lastBackup.message}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Backup ID: {lastBackup.backupId}
                </p>
                <p className="text-xs text-muted-foreground">
                  Timestamp: {new Date(lastBackup.timestamp).toLocaleString()}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No manual backups triggered yet.</p>
            )}
          </div>
        </motion.div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/80 shadow-soft">
        <div className="p-6 border-b border-border/60">
          <h3 className="text-lg font-semibold">Backup Information</h3>
        </div>
        <div className="p-6 space-y-3 text-sm text-muted-foreground">
          <p>Automatic backups run daily at 02:00 UTC.</p>
          <p>Backups are retained for 30 days.</p>
          <p>Contact your system administrator for recovery procedures.</p>
        </div>
      </div>
    </div>
  );
}
