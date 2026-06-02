"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Megaphone,
  Plus,
  Pencil,
  Trash2,
  User,
  Calendar,
  Inbox,
  Loader2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Filter,
} from "lucide-react";

import { useNotices, useDeleteNotice } from "./useNotices";
import NoticeForm from "./NoticeForm";
import { Notice } from "./notice.types";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { hasPermission } from "@/config/roles";

const targetStyles: Record<string, string> = {
  ALL: "from-sky-500/20 to-sky-500/5 text-sky-300 ring-sky-400/30",
  TEACHER: "from-violet-500/20 to-violet-500/5 text-violet-300 ring-violet-400/30",
  STUDENT: "from-indigo-500/20 to-indigo-500/5 text-indigo-300 ring-indigo-400/30",
};

const targetLabel: Record<string, string> = {
  ALL: "সবার জন্য",
  TEACHER: "শুধু Teacher",
  STUDENT: "শুধু Student",
};

export default function NoticeCard() {
  const { data: notices, isLoading } = useNotices();
  const { mutate: deleteNotice } = useDeleteNotice();
  const { role } = useAuth();

  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<Notice | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filterTarget, setFilterTarget] = useState<string>("");

  const safeNotices = Array.isArray(notices) ? notices : [];
  const filtered = safeNotices.filter((n) =>
    filterTarget ? n.target === filterTarget : true
  );

  const handleEdit = (notice: Notice) => {
    setSelected(notice);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete করবেন?")) deleteNotice(id);
  };

  const handleClose = () => {
    setShowForm(false);
    setSelected(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-white dark:bg-slate-950 p-4 sm:p-6">
      {/* Animated background orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ x: [0, 80, 0], y: [0, -50, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-sky-500/15 blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -60, 0], y: [0, 60, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/3 -right-32 h-[28rem] w-[28rem] rounded-full bg-violet-500/15 blur-3xl"
        />
        <motion.div
          animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-indigo-500/15 blur-3xl"
        />
      </div>

      <div className="relative mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/40 bg-gradient-to-r from-sky-500/5 dark:from-sky-500/15 via-indigo-500/5 dark:via-indigo-500/15 to-violet-500/5 dark:to-violet-500/15 p-5 backdrop-blur-xl"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ rotate: -15, scale: 0.8 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 14 }}
                className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 via-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/40"
              >
                <Megaphone className="h-6 w-6 text-white" />
              </motion.div>
              <div>
                <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white">
                  Notices
                  <Sparkles className="h-4 w-4 text-violet-500 dark:text-violet-300" />
                </h1>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  মোট{" "}
                  <span className="font-semibold text-sky-600 dark:text-sky-300">
                    {safeNotices.length}
                  </span>{" "}
                  টি notice
                </p>
              </div>
            </div>

            {role && hasPermission(role, "post_notice") && (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30"
              >
                <Plus className="h-4 w-4" />
                New Notice
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Filter */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-3 backdrop-blur-xl"
        >
          <Filter className="ml-1 h-4 w-4 text-indigo-600 dark:text-indigo-300/80" />
          {["", "ALL", "TEACHER", "STUDENT"].map((t) => {
            const active = filterTarget === t;
            return (
              <motion.button
                key={t || "all"}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilterTarget(t)}
                className={`relative rounded-lg px-4 py-1.5 text-xs font-medium transition ${
                  active
                    ? "text-white"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="filterPill"
                    className="absolute inset-0 rounded-lg bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 shadow-md shadow-indigo-500/40"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative">
                  {t === "" ? "সব" : targetLabel[t]}
                </span>
              </motion.button>
            );
          })}
        </motion.div>

        {/* Notice Cards */}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((notice, i) => {
              const isExpanded = expanded === notice.id;
              const longContent = notice.content.length > 120;
              return (
                <motion.div
                  key={notice.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ delay: i * 0.04 }}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/60 p-5 backdrop-blur-xl transition hover:border-indigo-300 dark:hover:border-indigo-400/30 hover:shadow-lg hover:shadow-indigo-200/20 dark:hover:shadow-indigo-500/10"
                >
                  {/* Left accent bar */}
                  <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-sky-500 via-indigo-500 to-violet-500" />

                  {/* Top */}
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-2">
                      <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                        {notice.title}
                      </h3>
                      <span
                        className={`inline-flex items-center rounded-full bg-gradient-to-r px-3 py-1 text-[11px] font-medium ring-1 ${
                          targetStyles[notice.target] ?? targetStyles.ALL
                        }`}
                      >
                        {targetLabel[notice.target]}
                      </span>
                    </div>

                    {role && hasPermission(role, "post_notice") && (
                      <div className="flex items-center gap-1.5">
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleEdit(notice)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-500/10 text-sky-700 dark:text-sky-300 transition hover:bg-sky-200 dark:hover:bg-sky-500/20"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDelete(notice.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 transition hover:bg-rose-200 dark:hover:bg-rose-500/20"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </motion.button>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <motion.p
                    layout
                    className={`mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300 ${
                      !isExpanded && longContent ? "line-clamp-3" : ""
                    }`}
                  >
                    {notice.content}
                  </motion.p>

                  {/* Read more */}
                  {longContent && (
                    <button
                      onClick={() =>
                        setExpanded(isExpanded ? null : notice.id)
                      }
                      className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-300 hover:text-indigo-700 dark:hover:text-indigo-200"
                    >
                      {isExpanded ? (
                        <>
                          কম দেখাও <ChevronUp className="h-3 w-3" />
                        </>
                      ) : (
                        <>
                          আরো দেখাও <ChevronDown className="h-3 w-3" />
                        </>
                      )}
                    </button>
                  )}

                  {/* Footer */}
                  <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-slate-200 dark:border-white/5 pt-3 text-xs text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-sky-600 dark:text-sky-300/80" />
                      {notice.createdBy?.name ?? "Admin"}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-violet-600 dark:text-violet-300/80" />
                      {formatDate(notice.createdAt)}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filtered.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-white/5 py-16 text-center backdrop-blur-xl"
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-200 dark:from-sky-500/20 via-indigo-200 dark:via-indigo-500/20 to-violet-200 dark:to-violet-500/20 ring-1 ring-slate-300 dark:ring-white/10"
              >
                <Inbox className="h-7 w-7 text-indigo-600 dark:text-indigo-300" />
              </motion.div>
              <p className="text-sm text-slate-600 dark:text-slate-400">কোনো notice নেই</p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && <NoticeForm notice={selected} onClose={handleClose} />}
    </div>
  );
}
