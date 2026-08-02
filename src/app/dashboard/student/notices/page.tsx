"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import api from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";
import { useLenis } from "@/hooks/useLenis";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import {
  Megaphone,
  ArrowLeft,
  Sparkles,
  Pin,
  Calendar,
  User,
  Inbox,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const unwrap = <T,>(res: { data: any }) => (res.data?.data ?? res.data) as T;

type Notice = {
  id: string;
  title: string;
  content: string;
  target: string;
  pinned: boolean;
  createdBy?: { id: string; name: string };
  createdAt: string;
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function StudentNoticesPage() {
  useLenis();
  const { role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (role && role !== "STUDENT") {
      window.location.href = "/dashboard";
    }
  }, [role]);

  useEffect(() => {
    const loadNotices = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get("/notices/feed");
        const data = unwrap<Notice[]>(res);
        setNotices(data);
      } catch (err) {
        setError("Failed to load notices");
      } finally {
        setLoading(false);
      }
    };
    loadNotices();
  }, []);

  const sortedNotices = useMemo(() => {
    return [...notices].sort((a, b) => Number(b.pinned) - Number(a.pinned));
  }, [notices]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notices</h1>
          <p className="text-sm text-muted-foreground">School announcements and updates.</p>
        </div>
        <Link
          href="/dashboard/student"
          className="text-sm text-primary hover:underline inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-3/5" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
              <div className="flex gap-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : sortedNotices.length === 0 ? (
        <div className="rounded-2xl border border-border/60 bg-card/80 p-12 shadow-soft text-center">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-secondary/60 mx-auto mb-4">
            <Inbox className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">No notices yet</p>
          <p className="text-xs text-muted-foreground mt-1">Check back later for updates.</p>
        </div>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
          {sortedNotices.map((notice) => {
            const isExpanded = expanded === notice.id;
            const longContent = notice.content.length > 150;

            return (
              <motion.div
                key={notice.id}
                variants={item}
                className={`group relative overflow-hidden rounded-2xl border p-6 shadow-soft transition hover:shadow-lg ${
                  notice.pinned
                    ? "border-amber-300/60 dark:border-amber-400/30 bg-amber-50/60 dark:bg-amber-500/5"
                    : "border-border/60 bg-card/80 hover:border-indigo-300/50 dark:hover:border-indigo-500/30"
                }`}
              >
                {notice.pinned && (
                  <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-amber-400 to-orange-400" />
                )}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {notice.pinned && (
                        <Pin className="h-4 w-4 text-amber-500 fill-amber-400 shrink-0" />
                      )}
                      <h3 className="text-base font-semibold text-foreground">{notice.title}</h3>
                    </div>

                    <div className="mt-3">
                      <p
                        className={`text-sm text-muted-foreground leading-relaxed ${
                          !isExpanded && longContent ? "line-clamp-3" : ""
                        }`}
                      >
                        {notice.content}
                      </p>
                      {longContent && (
                        <button
                          onClick={() => setExpanded(isExpanded ? null : notice.id)}
                          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                        >
                          {isExpanded ? (
                            <>
                              Show less <ChevronUp className="h-3 w-3" />
                            </>
                          ) : (
                            <>
                              Show more <ChevronDown className="h-3 w-3" />
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                        {notice.createdBy?.name ?? "Admin"}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                        {formatDate(notice.createdAt)}
                      </span>
                    </div>
                  </div>

                  {notice.pinned && (
                    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 ring-1 ring-amber-300/50 dark:ring-amber-400/30 shrink-0">
                      <Pin className="h-3 w-3" />
                      Pinned
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
