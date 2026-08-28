"use client";

import { useState, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { hasPermission } from "@/config/roles";
import { useNotices, useCreateNotice, useUpdateNotice, usePinNotice, useDeleteNotice } from "@/app/modules/notice/useNotices";
import NoticeForm from "@/app/modules/notice/NoticeForm";
import { motion } from "framer-motion";
import {
  Megaphone,
  Search,
  Plus,
  Pencil,
  Trash2,
  Pin,
  PinOff,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Notice } from "@/app/modules/notice/notice.types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function Skel({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-block rounded bg-muted/60 animate-pulse ${className}`} />
  );
}

function getTargetLabel(target: string): string {
  switch (target) {
    case "ALL": return "All";
    case "STUDENT": return "Students";
    case "TEACHER": return "Teachers";
    case "PARENT": return "Parents";
    case "STAFF": return "Staff";
    case "ACCOUNTANT": return "Accountant";
    case "EXAM_CONTROLLER": return "Exam Controller";
    case "HR": return "HR";
    case "SUPER_ADMIN": return "Super Admin";
    case "SCHOOL_ADMIN": return "School Admin";
    default: return target;
  }
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SchoolAdminNoticesPage() {
  const router = useRouter();
  const { role } = useAuth();
  const queryClient = useQueryClient();

  // ── Role guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (role && role !== "SCHOOL_ADMIN" && role !== "SUPER_ADMIN") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  const canManage = role ? hasPermission(role, "post_notice") : false;

  // ── State ─────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string>("");

  // ── Fetch notices ─────────────────────────────────────────────────────────
  const { data: notices = [], isLoading, refetch } = useNotices(
    priorityFilter ? { priority: priorityFilter } : undefined
  );

  const noticeList = Array.isArray(notices) ? notices : [];

  // ── Mutations ──────────────────────────────────────────────────────────────
  const createMutation = useCreateNotice();
  const updateMutation = useUpdateNotice();
  const pinMutation = usePinNotice();
  const deleteMutation = useDeleteNotice();

  // ── useMemo: derived values ────────────────────────────────────────────────
  const filterKey = search.toLowerCase().replace(/[^a-z0-9]/g, "");

  const filtered = useMemo(() => {
    let list = [...noticeList];
    if (filterKey) {
      list = list.filter((n) => {
        const hay = `${n.title} ${n.content} ${getTargetLabel(n.target)}`.toLowerCase().replace(/[^a-z0-9]/g, "");
        return hay.includes(filterKey);
      });
    }
    // Sort: pinned first, then by date
    list.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return list;
  }, [noticeList, filterKey]);

  const totalNotices = noticeList.length;
  const pinnedCount = useMemo(() => noticeList.filter((n) => n.pinned).length, [noticeList]);
  const activeCount = totalNotices;

  const handleCreate = async (data: any) => {
    await createMutation.mutateAsync(data);
    setShowForm(false);
    toast.success("Notice published successfully");
  };

  const handleUpdate = async (id: string, data: any) => {
    await updateMutation.mutateAsync({ id, data });
    setEditingNotice(null);
    toast.success("Notice updated successfully");
  };

  const handleTogglePin = async (id: string, pinned: boolean) => {
    await pinMutation.mutateAsync({ id, pinned });
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this notice?")) {
      deleteMutation.mutate(id);
    }
  };

  const openEdit = (notice: Notice) => {
    setEditingNotice(notice);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingNotice(null);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (!canManage) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-sm text-muted-foreground">You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-3"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Notices</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Publish and manage notices for the school community.
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => { setEditingNotice(null); setShowForm(true); }}
            className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl border border-border hover:bg-secondary transition-colors"
          >
            <Plus className="w-4 h-4" /> Publish Notice
          </button>
        )}
      </motion.div>

      {/* Stats strip */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-3 gap-4"
      >
        {[
          {
            label: "Total Notices",
            value: totalNotices,
            color: "text-foreground",
            bg: "bg-secondary/60",
            icon: Megaphone,
          },
          {
            label: "Pinned",
            value: pinnedCount,
            color: "text-blue-600 dark:text-blue-400",
            bg: "bg-blue-50 dark:bg-blue-950/30",
            icon: Pin,
          },
          {
            label: "Active",
            value: activeCount,
            color: "text-emerald-600 dark:text-emerald-400",
            bg: "bg-emerald-50 dark:bg-emerald-950/30",
            icon: CheckCircle2,
          },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label} className={`${bg} rounded-2xl p-4`}>
            <div className="flex items-center gap-2 mb-1">
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
            <p className={`text-2xl font-bold ${color}`}>
              {isLoading ? <Skel className="w-10 h-7 inline-block" /> : value}
            </p>
          </div>
        ))}
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-3 flex-wrap"
      >
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search notices by title or content…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="text-sm border border-border rounded-xl px-3 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All Priorities</option>
          <option value="URGENT">Urgent</option>
          <option value="HIGH">High</option>
          <option value="NORMAL">Normal</option>
          <option value="LOW">Low</option>
        </select>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl border border-border hover:bg-secondary transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </motion.div>

      {/* Notices list */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="space-y-3"
      >
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border/60 bg-card/80 p-5 animate-pulse">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <Skel className="w-3/4 h-5" />
                  <Skel className="w-1/2 h-4" />
                </div>
                <Skel className="w-20 h-6 rounded-full" />
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-border/60 bg-card/80 p-12 text-center">
            <Megaphone className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No notices found.</p>
          </div>
        ) : (
          filtered.map((notice) => {
            return (
              <motion.div
                key={notice.id}
                layout
                className={`rounded-2xl border bg-card/80 p-5 transition-all ${
                  notice.pinned
                    ? "border-blue-200 dark:border-blue-800/40 shadow-md"
                    : "border-border/60 shadow-soft"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-sm">{notice.title}</h3>
                      {notice.pinned && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                          <Pin className="w-3 h-3" /> Pinned
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {notice.content}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      <span>Target: {getTargetLabel(notice.target)}</span>
                      <span>By: {notice.createdBy?.name ?? "Unknown"}</span>
                      <span>{fmt(notice.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleTogglePin(notice.id, !notice.pinned)}
                      className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center transition-colors"
                      title={notice.pinned ? "Unpin" : "Pin"}
                    >
                      {notice.pinned ? (
                        <PinOff className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Pin className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>
                    {canManage && (
                      <>
                        <button
                          onClick={() => openEdit(notice)}
                          className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => handleDelete(notice.id)}
                          disabled={deleteMutation.isPending}
                          className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </motion.div>

      {/* Form Modal */}
      {showForm && (
        <NoticeForm
          notice={editingNotice ?? undefined}
          onClose={closeForm}
        />
      )}
    </div>
  );
}
