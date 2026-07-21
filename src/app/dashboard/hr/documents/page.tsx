"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/axios";
import { useLenis } from "@/hooks/useLenis";
import type { Role } from "@/tyPes/auth.tyPes";
import { FolderOpen, Upload, FileText, ExternalLink, Search } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

type StaffRecord = {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  designation?: string;
  department?: { name: string };
  idProofUrl?: string;
  certificates: string[];
  contractUrl?: string;
};

const roleLabels: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  SCHOOL_ADMIN: "School Admin",
  ACCOUNTANT: "Accountant",
  TEACHER: "Teacher",
  STUDENT: "Student",
  PARENT: "Parent",
  EXAM_CONTROLLER: "Exam Controller",
  HR: "HR",
};

export default function DocumentsPage() {
  useLenis();
  const router = useRouter();
  const { role } = useAuth();
  const [staff, setStaff] = useState<StaffRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStaff, setSelectedStaff] = useState<StaffRecord | null>(null);

  useEffect(() => {
    if (role && role !== "HR" && role !== "SCHOOL_ADMIN" && role !== "SUPER_ADMIN") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  const load = async () => {
    setLoading(true);
    try {
      const url = `/hr/staff/directory${search ? `?search=${encodeURIComponent(search)}` : ""}`;
      const res = await api.get(url);
      const payload = res.data?.data ?? res.data;
      setStaff(Array.isArray(payload) ? payload : []);
    } catch {
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [search]);

  return (
    <div className="relative min-h-screen flex items-start justify-center p-4 sm:p-6 overflow-hidden bg-slate-50/50 dark:bg-slate-950">
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

      <div className="relative w-full max-w-6xl my-8 space-y-6">
        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/10 shadow-2xl shadow-slate-200/40 dark:shadow-none overflow-hidden">
          <div className="relative px-6 sm:px-8 py-6 bg-gradient-to-r from-sky-50 via-indigo-50 to-violet-50 dark:from-sky-500/10 dark:via-indigo-500/10 dark:to-violet-500/10 border-b border-white/40 dark:border-white/5 overflow-hidden">
            <motion.div
              animate={{ x: [0, 100, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none"
            />
            <div className="relative">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                Employee Files
                <motion.span
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="text-indigo-400"
                >
                  <FolderOpen className="w-5 h-5" />
                </motion.span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                View and manage onboarding documents for staff members
              </p>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-6 shadow-xl">
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search staff..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-9 pr-4 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
                    />
                  </div>

                  {loading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="space-y-1 p-3 rounded-lg">
                          <Skeleton className="h-4 w-32 rounded-md" />
                          <Skeleton className="h-3 w-24 rounded-md" />
                        </div>
                      ))}
                    </div>
                  ) : staff.length === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-4">No staff found.</p>
                  ) : (
                    <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                      {staff.map((s, idx) => (
                        <motion.button
                          key={s.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          onClick={() => setSelectedStaff(s)}
                          className={`w-full text-left rounded-lg p-3 transition-colors ${
                            selectedStaff?.id === s.id
                              ? "bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-violet-500/10 border border-indigo-200/60 dark:border-indigo-400/20"
                              : "bg-white/60 dark:bg-white/5 border border-white/40 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/10"
                          }`}
                        >
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{s.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{s.employeeId} · {s.designation ?? "—"}</p>
                        </motion.button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-2">
                {selectedStaff ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-6 shadow-xl space-y-6"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{selectedStaff.name}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {selectedStaff.employeeId} · {selectedStaff.designation ?? "—"} · {selectedStaff.department?.name ?? "—"}
                        </p>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 text-white px-4 py-2 text-sm font-semibold shadow-md shadow-indigo-500/30"
                      >
                        <Upload className="h-4 w-4" /> Upload Document
                      </motion.button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <DocumentCard
                        title="ID Proof"
                        url={selectedStaff.idProofUrl}
                        icon={<FileText className="h-6 w-6 text-sky-500" />}
                      />
                      <DocumentCard
                        title="Contract"
                        url={selectedStaff.contractUrl}
                        icon={<FileText className="h-6 w-6 text-emerald-500" />}
                      />
                      <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-white/60 dark:bg-white/5 p-6 flex flex-col items-center justify-center">
                        <Upload className="h-6 w-6 text-slate-400 mb-2" />
                        <p className="text-xs text-slate-500 dark:text-slate-400 text-center">Add more certificates</p>
                      </div>
                    </div>

                    {selectedStaff.certificates?.length > 0 && (
                      <div>
                        <h4 className="font-medium text-slate-900 dark:text-white mb-3">Certificates</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {selectedStaff.certificates.map((url, idx) => (
                            <a
                              key={idx}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-white/5 p-3 hover:bg-white/80 dark:hover:bg-white/10"
                            >
                              <FileText className="h-4 w-4 text-slate-400" />
                              <span className="text-xs truncate flex-1 text-slate-700 dark:text-slate-200">Certificate {idx + 1}</span>
                              <ExternalLink className="h-3 w-3 text-slate-400" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-12 shadow-xl text-center"
                  >
                    <motion.div
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      className="w-20 h-20 rounded-full bg-gradient-to-br from-sky-100 via-indigo-100 to-violet-100 dark:from-sky-500/10 dark:via-indigo-500/10 dark:to-violet-500/10 flex items-center justify-center mb-4 ring-1 ring-indigo-200/60 dark:ring-indigo-400/20 mx-auto"
                    >
                      <FolderOpen className="w-10 h-10 text-indigo-400" />
                    </motion.div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Select a staff member to view their documents</p>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DocumentCard({ title, url, icon }: { title: string; url?: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-white/5 p-4">
      <div className="flex items-center gap-3 mb-3">
        {icon}
        <p className="font-medium text-sm text-slate-900 dark:text-white">{title}</p>
      </div>
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          View Document <ExternalLink className="h-3 w-3" />
        </a>
      ) : (
        <p className="text-xs text-slate-500 dark:text-slate-400">No document uploaded</p>
      )}
    </div>
  );
}
