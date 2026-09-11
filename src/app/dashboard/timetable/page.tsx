"use client";

import { motion } from "framer-motion";
import { useLenis } from "@/hooks/useLenis";
import { useAuth } from "@/hooks/useAuth";
import TimetableGrid from "../../modules/timetable/TimetableGrid";

export default function TimetablePage() {
  useLenis();
  const { role } = useAuth();

  return (
    <div className="relative min-h-screen flex items-start sm:items-center justify-center p-4 sm:p-6 overflow-hidden bg-slate-50/50 dark:bg-slate-950">
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
        className="relative w-full max-w-6xl my-8 space-y-6"
      >
        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/10 shadow-2xl shadow-slate-200/40 dark:shadow-none overflow-hidden">
          <div className="relative px-6 sm:px-8 py-6 bg-gradient-to-r from-sky-50 via-indigo-50 to-violet-50 dark:from-sky-500/10 dark:via-indigo-500/10 dark:to-violet-500/10 border-b border-white/40 dark:border-white/5 overflow-hidden">
            <motion.div
              animate={{ x: [0, 100, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none"
            />

            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">Timetable</h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {role === "TEACHER"
                    ? "Your assigned classes routine"
                    : role === "STUDENT"
                    ? "Your class weekly routine"
                    : "Weekly routine by class"}
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <TimetableGrid />
          </div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 1 }}
          className="text-center text-[10px] font-bold tracking-[0.3em] uppercase text-slate-400 dark:text-slate-600"
        >
          Class Timetable
        </motion.p>
      </motion.div>
    </div>
  );
}
