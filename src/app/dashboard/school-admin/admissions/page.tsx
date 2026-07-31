"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  GraduationCap,
  Phone,
  Mail,
  MapPin,
  Calendar,
  BookOpen,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

// ─── Types 

type AdmissionStatus = "PENDING" | "APPROVED" | "REJECTED";

type Admission = {
  id: string;
  applicantName: string;
  studentEmail: string;
  dob: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  religion?: string;
  bloodGroup?: string;
  address: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;
  photoUrl?: string;
  birthCertUrl?: string;
  status: AdmissionStatus;
  rejectionReason?: string;
  paymentStatus?: string;
  paymentAmount?: number;
  paymentMethod?: string;
  createdAt: string;
  targetClass?: { name: string; numericLevel?: number };
};

type Stats = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
};

type ConvertForm = {
  admissionId: string;
};

// ─── Status badge config 

const STATUS_CONFIG: Record<
  AdmissionStatus,
  { label: string; bg: string; text: string; icon: React.ElementType }
> = {
  PENDING:  { label: "Pending",  bg: "bg-amber-100 dark:bg-amber-900/30",   text: "text-amber-700 dark:text-amber-400",   icon: Clock         },
  APPROVED: { label: "Approved", bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400", icon: CheckCircle2  },
  REJECTED: { label: "Rejected", bg: "bg-red-100 dark:bg-red-900/30",         text: "text-red-700 dark:text-red-400",         icon: XCircle       },
};

// ─── Helpers 

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function Skel({ className = "" }: { className?: string }) {
  return <span className={`inline-block rounded bg-muted/60 animate-pulse ${className}`} />;
}

// ─── Detail modal 

function DetailModal({
  admission,
  onClose,
  onApprove,
  onReject,
  onConvert,
  actionLoading,
}: {
  admission: Admission;
  onClose: () => void;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
  onConvert: (form: ConvertForm) => Promise<void>;
  actionLoading: boolean;
}) {
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [showConvert, setShowConvert] = useState(false);
  const [convertForm, setConvertForm] = useState<ConvertForm>({
    admissionId: admission.id,
  });

  const cfg = STATUS_CONFIG[admission.status];
  const Icon = cfg.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-card/95 backdrop-blur border-b border-border/60 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-base">{admission.applicantName}</h2>
              <p className="text-xs text-muted-foreground">Application #{admission.id.slice(-8).toUpperCase()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
              <Icon className="w-3.5 h-3.5" /> {cfg.label}
            </span>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Photo + basic info */}
          <div className="flex gap-5">
            {admission.photoUrl ? (
              <img src={admission.photoUrl} alt={admission.applicantName} className="w-20 h-20 rounded-xl object-cover border border-border shrink-0" />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                <GraduationCap className="w-9 h-9 text-muted-foreground" />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 flex-1 text-sm">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Email</p>
                <p className="font-medium truncate">{admission.studentEmail}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Date of Birth</p>
                <p className="font-medium">{fmt(admission.dob)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Gender</p>
                <p className="font-medium capitalize">{admission.gender.toLowerCase()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Target Class</p>
                <p className="font-medium">{admission.targetClass?.name ?? "—"}</p>
              </div>
              {admission.bloodGroup && (
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Blood Group</p>
                  <p className="font-medium">{admission.bloodGroup.replace("_", "")}</p>
                </div>
              )}
              {admission.religion && (
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Religion</p>
                  <p className="font-medium">{admission.religion}</p>
                </div>
              )}
            </div>
          </div>

          {/* Info rows */}
          {[
            { icon: MapPin, label: "Address", value: admission.address },
            { icon: Phone, label: "Guardian Phone", value: admission.guardianPhone },
            { icon: Mail, label: "Guardian Email", value: admission.guardianEmail },
            { icon: BookOpen, label: "Guardian Name", value: admission.guardianName },
            { icon: Calendar, label: "Applied On", value: fmt(admission.createdAt) },
          ].map(({ icon: I, label, value }) => (
            <div key={label} className="flex items-start gap-3 text-sm">
              <I className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <span className="text-muted-foreground text-xs">{label}: </span>
                <span className="font-medium">{value}</span>
              </div>
            </div>
          ))}

          {/* Payment info */}
          {admission.paymentAmount && (
            <div className="rounded-xl bg-secondary/50 p-4 text-sm flex items-center justify-between">
              <span className="text-muted-foreground">Payment</span>
              <div className="text-right">
                <p className="font-semibold">৳{admission.paymentAmount}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {admission.paymentMethod?.toLowerCase()} · {admission.paymentStatus}
                </p>
              </div>
            </div>
          )}

          {/* Rejection reason */}
          {admission.status === "REJECTED" && admission.rejectionReason && (
            <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 p-4 text-sm">
              <p className="font-semibold text-red-600 dark:text-red-400 mb-1 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" /> Rejection Reason
              </p>
              <p className="text-muted-foreground">{admission.rejectionReason}</p>
            </div>
          )}

          {/* Documents */}
          {admission.birthCertUrl && (
            <a href={admission.birthCertUrl} target="_blank" rel="noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline">
              <BookOpen className="w-4 h-4" /> View Birth Certificate
            </a>
          )}
        </div>

        {/* Actions */}
        {admission.status === "PENDING" && (
          <div className="sticky bottom-0 bg-card/95 backdrop-blur border-t border-border/60 px-6 py-4 space-y-3">
            {!showReject ? (
              <div className="flex gap-3">
                <button
                  onClick={() => onApprove(admission.id)}
                  disabled={actionLoading}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Approve
                </button>
                <button
                  onClick={() => setShowReject(true)}
                  disabled={actionLoading}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" /> Reject
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <textarea
                  placeholder="Reason for rejection (required)…"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={2}
                  className="w-full text-sm border border-border rounded-xl px-3 py-2 bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => { setShowReject(false); setRejectReason(""); }}
                    className="flex-1 text-sm py-2.5 rounded-xl border border-border hover:bg-secondary transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => onReject(admission.id, rejectReason)}
                    disabled={!rejectReason.trim() || actionLoading}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Confirm Reject
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Approved → Convert to Student */}
        {admission.status === "APPROVED" && (
          <div className="sticky bottom-0 bg-card/95 backdrop-blur border-t border-border/60 px-6 py-4">
            {!showConvert ? (
              <button
                onClick={() => setShowConvert(true)}
                className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold py-2.5 rounded-xl transition-colors"
              >
                <UserPlus className="w-4 h-4" /> Convert to Student Account
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-semibold">Create Student Account</p>
                <p className="text-xs text-muted-foreground">
                  This will create a student profile, assign class/section/roll number, and send credentials to the student and parent email.
                </p>
                <div className="flex gap-2">
                  <button onClick={() => setShowConvert(false)}
                    className="flex-1 text-sm py-2.5 rounded-xl border border-border hover:bg-secondary transition-colors">
                    Cancel
                  </button>
                  <button
                    onClick={() => onConvert(convertForm)}
                    disabled={actionLoading}
                    className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                    Create Account
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ─── Main Page 

export default function AdminAdmissionsPage() {
  const router = useRouter();
  const { role } = useAuth();

  // Role guard
  useEffect(() => {
    if (role && role !== "SCHOOL_ADMIN" && role !== "SUPER_ADMIN") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selected, setSelected] = useState<Admission | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AdmissionStatus | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const LIMIT = 10;

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Fetch 
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {
        page: String(page),
        limit: String(LIMIT),
      };
      if (search) params.search = search;
      if (statusFilter !== "ALL") params.status = statusFilter;

      const [listRes, statsRes] = await Promise.allSettled([
        api.get("/admission", { params }),
        api.get("/admission/stats"),
      ]);

      if (listRes.status === "fulfilled") {
        const d = listRes.value.data?.data ?? listRes.value.data;
        const list = Array.isArray(d) ? d : (d?.data ?? []);
        const total = d?.total ?? list.length;
        setAdmissions(list);
        setTotalPages(Math.max(1, Math.ceil(total / LIMIT)));
      }
      if (statsRes.status === "fulfilled") {
        const s = statsRes.value.data?.data ?? statsRes.value.data ?? {};
        setStats({
          total:    s.total    ?? 0,
          pending:  s.pending  ?? 0,
          approved: s.approved ?? 0,
          rejected: s.rejected ?? 0,
        });
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // reset page when filters change
  useEffect(() => { setPage(1); }, [search, statusFilter]);

  // ── Actions 
  const handleApprove = async (id: string) => {
    try {
      setActionLoading(true);
      await api.patch(`/admission/${id}/status`, { status: "APPROVED" });
      showToast("Application approved ✓");
      setSelected(null);
      fetchData();
    } catch {
      showToast("Failed to approve application", false);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id: string, reason: string) => {
    try {
      setActionLoading(true);
      await api.patch(`/admission/${id}/status`, { status: "REJECTED", rejectionReason: reason });
      showToast("Application rejected");
      setSelected(null);
      fetchData();
    } catch {
      showToast("Failed to reject application", false);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConvert = async (form: ConvertForm) => {
    try {
      setActionLoading(true);
      await api.post("/admission/convert-to-student", { admissionId: form.admissionId });
      showToast("Student account created ✓");
      setSelected(null);
      fetchData();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to create student account";
      showToast(msg, false);
    } finally {
      setActionLoading(false);
    }
  };

  // ── Render 
  return (
    <div className="space-y-6">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-5 right-5 z-[60] px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 ${
              toast.ok
                ? "bg-emerald-600 text-white"
                : "bg-red-600 text-white"
            }`}
          >
            {toast.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Admissions</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Review, approve, or reject student admission applications.
          </p>
        </div>
        <button onClick={fetchData}
          className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl border border-border hover:bg-secondary transition-colors">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </motion.div>

      {/* Stat strip */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total",    value: stats.total,    color: "text-foreground",              bg: "bg-secondary/60"                       },
          { label: "Pending",  value: stats.pending,  color: "text-amber-600 dark:text-amber-400",   bg: "bg-amber-50 dark:bg-amber-950/30"   },
          { label: "Approved", value: stats.approved, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
          { label: "Rejected", value: stats.rejected, color: "text-red-600 dark:text-red-400",        bg: "bg-red-50 dark:bg-red-950/30"         },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`${bg} rounded-2xl p-4 text-center`}>
            <p className={`text-2xl font-bold ${color}`}>
              {loading ? <Skel className="w-8 h-7 mx-auto" /> : value}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </motion.div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, guardian, phone or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
          {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`text-xs px-3 py-2 rounded-lg font-medium transition-colors ${
                statusFilter === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary hover:bg-secondary/80 text-muted-foreground"
              }`}
            >
              {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Table card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="rounded-2xl border border-border/60 bg-card/80 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-secondary/40">
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Applicant</th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Class</th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide hidden md:table-cell">Guardian</th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide hidden lg:table-cell">Applied</th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Status</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4"><Skel className="w-32 h-4" /></td>
                    <td className="px-5 py-4"><Skel className="w-16 h-4" /></td>
                    <td className="px-5 py-4 hidden md:table-cell"><Skel className="w-24 h-4" /></td>
                    <td className="px-5 py-4 hidden lg:table-cell"><Skel className="w-20 h-4" /></td>
                    <td className="px-5 py-4"><Skel className="w-16 h-5 rounded-full" /></td>
                    <td className="px-5 py-4"><Skel className="w-8 h-8 rounded-lg" /></td>
                  </tr>
                ))
              ) : admissions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <GraduationCap className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No admissions found.</p>
                  </td>
                </tr>
              ) : (
                admissions.map((adm) => {
                  const cfg = STATUS_CONFIG[adm.status];
                  const Icon = cfg.icon;
                  return (
                    <tr key={adm.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-medium">{adm.applicantName}</p>
                        <p className="text-xs text-muted-foreground">{adm.studentEmail}</p>
                      </td>
                      <td className="px-5 py-4 font-medium">{adm.targetClass?.name ?? "—"}</td>
                      <td className="px-5 py-4 hidden md:table-cell text-muted-foreground">
                        {adm.guardianName}
                      </td>
                      <td className="px-5 py-4 hidden lg:table-cell text-muted-foreground">
                        {fmt(adm.createdAt)}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
                          <Icon className="w-3 h-3" /> {cfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => setSelected(adm)}
                          className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center ml-auto transition-colors"
                          title="View details"
                        >
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="px-5 py-4 border-t border-border/60 flex items-center justify-between text-sm">
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
      </motion.div>

      {/* Detail modal */}
      <AnimatePresence>
        {selected && (
          <DetailModal
            admission={selected}
            onClose={() => setSelected(null)}
            onApprove={handleApprove}
            onReject={handleReject}
            onConvert={handleConvert}
            actionLoading={actionLoading}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
