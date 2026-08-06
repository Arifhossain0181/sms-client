"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  GraduationCap,
  Sparkles,
  Layers,
  School,
  CheckCircle2
} from "lucide-react";
import api from "@/lib/axios"; // ensure correct api import, fallback to fetch if needed

export default function TeacherSubjectsPage() {
  const router = useRouter();
  const { role } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Protect route
  useEffect(() => {
    if (role && role !== "TEACHER" && role !== "SUPER_ADMIN" && role !== "SCHOOL_ADMIN") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        // Using api from lib/api or similar standard setup
        const res = await api.get("/teachers/me");
        if (res?.data?.data) {
          setProfile(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch teacher profile", err);
      } finally {
        setIsLoading(false);
      }
    };
    if (role) {
      fetchProfile();
    }
  }, [role]);

  const subjects = profile?.subjectAssignments?.map((s: any) => s.subject) || [];
  const classes = profile?.sectionTeacher?.map((s: any) => s.class) || [];

  if (isLoading) {
    return (
      <div className="relative min-h-[80vh] flex flex-col items-center justify-center p-4 overflow-hidden bg-slate-50/50 dark:bg-slate-950 rounded-3xl">
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
        <div className="relative w-full max-w-4xl space-y-6">
          <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/10 shadow-xl p-8 space-y-4">
            <div className="h-8 w-1/3 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
            <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-slate-200/60 dark:bg-slate-700/40 rounded-2xl animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[80vh] flex flex-col items-center p-4 sm:p-6 overflow-hidden bg-slate-50/50 dark:bg-slate-950 rounded-3xl">
      {/* Animated Background */}
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
        className="relative w-full max-w-4xl my-4"
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
              <div className="flex items-center gap-4">
                <motion.div
                  whileHover={{ scale: 1.08, rotate: 4 }}
                  className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-400 via-sky-400 to-violet-500 shadow-lg shadow-indigo-500/30 flex items-center justify-center cursor-pointer"
                >
                  <BookOpen className="w-7 h-7 text-white" />
                  <motion.div
                    className="absolute inset-0 rounded-2xl border-2 border-white/40 dark:border-white/20"
                    animate={{ scale: [1, 1.12, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2.4, repeat: Infinity }}
                  />
                </motion.div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    My Classes & Subjects
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Manage your assigned academic responsibilities.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-6 sm:p-8 space-y-8 max-h-[65vh] overflow-y-auto">
            
            {/* Subjects Section */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Layers className="w-5 h-5 text-indigo-500" />
                <h2 className="text-xl font-semibold text-slate-800 dark:text-white">Assigned Subjects</h2>
                <span className="ml-2 px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
                  {subjects.length}
                </span>
              </div>
              
              {subjects.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                  <BookOpen className="w-10 h-10 text-slate-400 mx-auto mb-3 opacity-50" />
                  <p className="text-slate-500 dark:text-slate-400 font-medium">No subjects assigned yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {subjects.map((subject: any, i: number) => (
                    <motion.div
                      key={subject.id || i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1, type: "spring", stiffness: 120, damping: 16 }}
                      whileHover={{ scale: 1.02, y: -2 }}
                      className="group flex items-center gap-4 p-4 rounded-2xl bg-white/60 dark:bg-white/5 border border-white/40 dark:border-white/10 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300"
                    >
                      <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0">
                        <BookOpen className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-800 dark:text-white truncate">
                          {subject.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <p className="text-xs text-slate-500 dark:text-slate-400">Assigned</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </section>

            <hr className="border-t border-slate-200/50 dark:border-slate-800/50" />

            {/* Classes Section */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <School className="w-5 h-5 text-violet-500" />
                <h2 className="text-xl font-semibold text-slate-800 dark:text-white">Assigned Classes (Sections)</h2>
                <span className="ml-2 px-2.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-xs font-bold">
                  {classes.length}
                </span>
              </div>

              {classes.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                  <GraduationCap className="w-10 h-10 text-slate-400 mx-auto mb-3 opacity-50" />
                  <p className="text-slate-500 dark:text-slate-400 font-medium">No classes assigned yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {classes.map((cls: any, i: number) => (
                    <motion.div
                      key={cls.id || i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 + 0.2, type: "spring", stiffness: 120, damping: 16 }}
                      whileHover={{ scale: 1.02, y: -2 }}
                      className="group flex items-center gap-4 p-4 rounded-2xl bg-white/60 dark:bg-white/5 border border-white/40 dark:border-white/10 hover:shadow-lg hover:shadow-violet-500/10 transition-all duration-300"
                    >
                      <div className="w-12 h-12 rounded-xl bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center text-violet-500 shrink-0">
                        <GraduationCap className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-800 dark:text-white truncate">
                          {cls.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <p className="text-xs text-slate-500 dark:text-slate-400">Assigned Section</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </section>

          </div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 1 }}
          className="mt-6 text-center text-[10px] font-bold tracking-[0.3em] uppercase text-slate-400 dark:text-slate-600"
        >
          Teacher Academic Portal
        </motion.p>
      </motion.div>
    </div>
  );
}
