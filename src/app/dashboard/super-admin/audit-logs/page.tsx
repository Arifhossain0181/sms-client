"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/axios";
import { useLenis } from "@/hooks/useLenis";
import { motion } from "framer-motion";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import type { Role } from "@/tyPes/auth.tyPes";

type AuditLog = {
  id: string;
  userId: string;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  user?: { id: string; name: string; email: string; role: Role };
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.03, duration: 0.3 },
  }),
};

export default function AuditLogsPage() {
  useLenis();
  const router = useRouter();
  const { role } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const LIMIT = 20;

  useEffect(() => {
    if (role && role !== "SUPER_ADMIN") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (actionFilter) params.set("action", actionFilter);
        params.set("page", String(page));
        params.set("limit", String(LIMIT));
        const res = await api.get(`/super-admin/audit-logs?${params.toString()}`);
        const payload = res.data?.data ?? res.data;
        if (payload && Array.isArray(payload.logs)) {
          setLogs(payload.logs);
          setTotalPages(payload.totalPages ?? 1);
        } else {
          setLogs([]);
          setTotalPages(1);
        }
      } catch {
        setLogs([]);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [actionFilter, page]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleActionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setActionFilter(e.target.value);
    setPage(1);
  };

  const filtered = useMemo(() => {
    if (!search) return logs;
    const q = search.toLowerCase();
    return logs.filter(
      (l) =>
        l.action.toLowerCase().includes(q) ||
        l.user?.name.toLowerCase().includes(q) ||
        l.user?.email.toLowerCase().includes(q)
    );
  }, [logs, search]);

  const uniqueActions = useMemo(() => {
    const set = new Set(logs.map((l) => l.action));
    return Array.from(set).sort();
  }, [logs]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Audit Logs</h1>
        <p className="text-muted-foreground mt-1">System-wide activity trail.</p>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/80 shadow-soft">
        <div className="p-6 border-b border-border/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h3 className="text-lg font-semibold">Recent Activity</h3>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search logs..."
                value={search}
                onChange={handleSearchChange}
                className="w-full sm:w-48 pl-10 pr-3 py-2 rounded-xl bg-secondary/60 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <select
              value={actionFilter}
              onChange={handleActionChange}
              className="px-3 py-2 rounded-xl bg-secondary/60 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="">All Actions</option>
              {uniqueActions.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 text-left text-xs text-muted-foreground uppercase tracking-wide">
                <th className="px-6 py-3 font-medium">User</th>
                <th className="px-6 py-3 font-medium">Action</th>
                <th className="px-6 py-3 font-medium">Target</th>
                <th className="px-6 py-3 font-medium">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-xs text-muted-foreground">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-xs text-muted-foreground">No logs found.</td></tr>
              ) : (
                filtered.map((log) => (
                  <motion.tr
                    key={log.id}
                    custom={0}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    className="hover:bg-secondary/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium">{log.user?.name ?? "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">{log.user?.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-secondary text-foreground">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {log.targetType ?? "—"} {log.targetId ? `#${log.targetId}` : ""}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && totalPages > 1 && (
          <div className="px-6 py-4 border-t border-border/60 flex items-center justify-between text-sm">
            <span className="text-muted-foreground text-xs">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-secondary disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-secondary disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
