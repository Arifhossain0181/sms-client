"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  Trash2,
  Inbox,
  Loader2,
  Sparkles,
} from "lucide-react";
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
} from "@/hooks/useNotifications";
import { Notification } from "@/service/notification.service";
import { formatDate } from "@/lib/utils";

export default function NotificationPanel() {
  const { data: notifications, isLoading } = useNotifications();
  const { mutate: markAsRead } = useMarkAsRead();
  const { mutate: markAllAsRead, isPending } = useMarkAllAsRead();
  const { mutate: deleteNotification } = useDeleteNotification();

  const unread = Array.isArray(notifications)
    ? notifications.filter((n: Notification) => !n.isRead).length
    : 0;

  if (isLoading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-slate-50/50 dark:bg-slate-950">
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
        <div className="relative w-full max-w-2xl">
          <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/10 shadow-2xl p-8 space-y-4">
            <div className="h-8 w-1/3 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
            <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
            <div className="space-y-3 mt-6">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-20 bg-slate-200/60 dark:bg-slate-700/40 rounded-2xl animate-pulse"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

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
        className="relative w-full max-w-2xl my-8"
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
                  {unread > 0 ? (
                    <BellRing className="w-6 h-6 text-white" />
                  ) : (
                    <Bell className="w-6 h-6 text-white" />
                  )}
                  {unread > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1.5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-slate-900"
                    >
                      {unread}
                    </motion.span>
                  )}
                  <motion.div
                    className="absolute inset-0 rounded-2xl border-2 border-white/40 dark:border-white/20"
                    animate={{ scale: [1, 1.12, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2.4, repeat: Infinity }}
                  />
                </motion.div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    Notifications
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    {unread > 0
                      ? `${unread} unread notifications`
                      : "All notifications are read"}
                  </p>
                </div>
              </div>

              {unread > 0 && (
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => markAllAsRead()}
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                >
                  {isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCheck className="w-3.5 h-3.5" />
                  )}
                  Mark all as read
                </motion.button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="p-4 sm:p-6 space-y-3 max-h-[70vh] overflow-y-auto">
            <AnimatePresence mode="popLayout">
              {(Array.isArray(notifications) ? notifications : []).map((notification: Notification, i: number) => (
                <motion.div
                  key={notification.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -50, scale: 0.95 }}
                  transition={{
                    delay: i * 0.05,
                    type: "spring",
                    stiffness: 120,
                    damping: 16,
                  }}
                  whileHover={{ scale: 1.01, y: -2 }}
                  className={`group relative flex items-start gap-3 p-4 rounded-2xl border backdrop-blur-sm transition-all duration-300 ${
                    notification.isRead
                      ? "bg-white/60 dark:bg-white/5 border-white/30 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/10"
                      : "bg-gradient-to-r from-sky-50/80 via-indigo-50/60 to-violet-50/80 dark:from-sky-500/10 dark:via-indigo-500/10 dark:to-violet-500/10 border-indigo-200/60 dark:border-indigo-400/20 hover:shadow-lg hover:shadow-indigo-500/10"
                  }`}
                >
                  {!notification.isRead && (
                    <motion.div
                      layoutId={`bar-${notification.id}`}
                      className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-gradient-to-b from-sky-400 via-indigo-400 to-violet-500"
                    />
                  )}

                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                      notification.isRead
                        ? "bg-slate-100 dark:bg-slate-800 text-slate-400"
                        : "bg-gradient-to-br from-sky-400 via-indigo-400 to-violet-500 text-white shadow-md shadow-indigo-500/30"
                    }`}
                  >
                    <Bell className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      <h3
                        className={`text-sm font-semibold truncate ${
                          notification.isRead
                            ? "text-slate-600 dark:text-slate-300"
                            : "text-slate-800 dark:text-white"
                        }`}
                      >
                        {notification.title}
                      </h3>
                      {!notification.isRead && (
                        <motion.span
                          animate={{ scale: [1, 1.3, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="flex-shrink-0 w-2 h-2 rounded-full bg-gradient-to-br from-sky-400 to-violet-500 shadow-sm shadow-indigo-500/50 mt-1.5"
                        />
                      )}
                    </div>
                    <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                      {notification.body}
                    </p>
                    <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {formatDate(notification.createdAt)}
                    </p>
                  </div>

                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    {!notification.isRead && (
                      <motion.button
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => markAsRead(notification.id)}
                        title="Mark as read"
                        className="w-8 h-8 rounded-full bg-white/80 dark:bg-white/10 border border-white/40 dark:border-white/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center hover:bg-indigo-50 dark:hover:bg-indigo-500/20 transition-colors shadow-sm"
                      >
                        <Check className="w-4 h-4" />
                      </motion.button>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => deleteNotification(notification.id)}
                      title="Delete"
                      className="w-8 h-8 rounded-full bg-white/80 dark:bg-white/10 border border-white/40 dark:border-white/10 text-rose-500 dark:text-rose-400 flex items-center justify-center hover:bg-rose-50 dark:hover:bg-rose-500/20 transition-colors shadow-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {(Array.isArray(notifications) ? notifications : []).length === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-16 text-center"
              >
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="w-20 h-20 rounded-full bg-gradient-to-br from-sky-100 via-indigo-100 to-violet-100 dark:from-sky-500/10 dark:via-indigo-500/10 dark:to-violet-500/10 flex items-center justify-center mb-4 ring-1 ring-indigo-200/60 dark:ring-indigo-400/20"
                >
                  <Inbox className="w-10 h-10 text-indigo-400" />
                </motion.div>
                <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">
                  No notifications
                </h3>
                <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
                  Youre all caught up.
                </p>
              </motion.div>
            )}
          </div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 1 }}
          className="mt-6 text-center text-[10px] font-bold tracking-[0.3em] uppercase text-slate-400 dark:text-slate-600"
        >
          EduCore Notification Center
        </motion.p>
      </motion.div>
    </div>
  );
}
