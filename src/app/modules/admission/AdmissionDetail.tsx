"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  GraduationCap,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Heart,
  Church,
  CreditCard,
  Banknote,
  Hash,
  Clock,
  BookOpen,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Users,
  MessageSquareWarning,
} from "lucide-react";
import { Admission } from "./admission.types";
import { formatDate } from "@/lib/utils";
import { useUpdateAdmissionStatus } from "./useAdmission";
import { useAuth } from "@/hooks/useAuth";
import { hasPermission } from "@/config/roles";

type StatusKey = "PENDING" | "APPROVED" | "REJECTED";

const statusConfig: Record<StatusKey, { cls: string; icon: React.ElementType; label: string }> = {
  PENDING: {
    cls: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 ring-1 ring-amber-300 dark:ring-amber-400/30",
    icon: AlertCircle,
    label: "Pending Review",
  },
  APPROVED: {
    cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 ring-1 ring-emerald-300 dark:ring-emerald-400/30",
    icon: CheckCircle2,
    label: "Approved",
  },
  REJECTED: {
    cls: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300 ring-1 ring-rose-300 dark:ring-rose-400/30",
    icon: XCircle,
    label: "Rejected",
  },
};

interface Props {
  admission: Admission;
  onClose: () => void;
}

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.92, y: 24 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const },
  },
  exit: { opacity: 0, scale: 0.96, y: 12, transition: { duration: 0.2 } },
};

const rowVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.035, duration: 0.3 },
  }),
};

export default function AdmissionDetail({ admission, onClose }: Props) {
  const { mutate: updateStatus, isPending } = useUpdateAdmissionStatus();
  const { role } = useAuth();

  const [showRejectBox, setShowRejectBox] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const handleApprove = () =>
    updateStatus({ id: admission.id, status: "APPROVED" }, { onSuccess: onClose });

  const handleRejectClick = () => setShowRejectBox(true);

  const handleConfirmReject = () =>
    updateStatus(
      { id: admission.id, status: "REJECTED", rejectionReason: rejectionReason || undefined },
      { onSuccess: onClose }
    );

  const status = statusConfig[admission.status];
  const StatusIcon = status.icon;

  const fields: { label: string; value: React.ReactNode; icon: React.ElementType }[] = [
    { label: "Name", value: admission.applicantName, icon: User },
    { label: "Gender", value: admission.gender, icon: User },
    { label: "Email", value: admission.guardianEmail, icon: Mail },
    { label: "Phone", value: admission.guardianPhone, icon: Phone },
    { label: "Date of Birth", value: formatDate(admission.dob), icon: Calendar },
    {
      label: "Class",
      value: (
        <>
          {admission.targetClass?.name} (Class {admission.targetClass?.numericLevel})
        </>
      ),
      icon: BookOpen,
    },
    { label: "Guardian Name", value: admission.guardianName, icon: Users },
    { label: "Blood Group", value: admission.bloodGroup ?? "—", icon: Heart },
    { label: "Religion", value: admission.religion ?? "—", icon: Church },
    { label: "Payment Status", value: admission.paymentStatus ?? "—", icon: CreditCard },
    { label: "Payment Method", value: admission.paymentMethod ?? "—", icon: Banknote },
    { label: "Paid Amount", value: admission.paymentAmount ?? "—", icon: Banknote },
    { label: "Transaction ID", value: admission.transactionId ?? "—", icon: Hash },
    { label: "Address", value: admission.address, icon: MapPin },
    { label: "Applied On", value: formatDate(admission.createdAt), icon: Clock },
  ];

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        variants={overlayVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {/* Backdrop */}
        <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

        {/* Modal */}
        <motion.div
          className="relative w-full max-w-lg max-h-[88vh] overflow-hidden rounded-2xl border border-border bg-card/95 backdrop-blur-xl shadow-2xl flex flex-col"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Header */}
          <div className="relative overflow-hidden bg-gradient-to-r from-sky-500/25 via-indigo-500/25 to-violet-500/25 px-6 py-5 shrink-0">
            <div className="absolute inset-0 bg-white/40 dark:bg-black/30" />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 shadow-lg shadow-indigo-500/30">
                  <GraduationCap className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Admission Details</h2>
                  <p className="text-xs text-muted-foreground font-mono">
                    ID: {admission.id.slice(0, 8)}…
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.08, rotate: 90 }}
                whileTap={{ scale: 0.92 }}
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-background/80 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </motion.button>
            </div>
          </div>

          {/* Scroll body */}
          <div className="overflow-y-auto flex-1">
            {/* Status badge */}
            <div className="px-6 pt-4">
              <div
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${status.cls}`}
              >
                <StatusIcon className="h-3.5 w-3.5" />
                {status.label}
              </div>
            </div>

            {/* Rejection reason, if any */}
            {admission.status === "REJECTED" && admission.rejectionReason && (
              <div className="mx-6 mt-3 flex items-start gap-2 rounded-xl border border-rose-200 dark:border-rose-400/20 bg-rose-50 dark:bg-rose-500/5 px-3 py-2.5">
                <MessageSquareWarning className="h-4 w-4 mt-0.5 text-rose-500 shrink-0" />
                <p className="text-xs text-rose-700 dark:text-rose-300">
                  {admission.rejectionReason}
                </p>
              </div>
            )}

            {/* Details */}
            <div className="px-4 py-4 space-y-1">
              {fields.map((field, i) => {
                const Icon = field.icon;
                return (
                  <motion.div
                    key={field.label}
                    custom={i}
                    variants={rowVariants}
                    initial="hidden"
                    animate="visible"
                    className="flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-muted/50"
                  >
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500/20 to-indigo-500/20 text-indigo-700 dark:text-sky-300 ring-1 ring-border">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        {field.label}
                      </p>
                      <p className="text-sm font-medium text-foreground break-words">
                        {field.value}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          {role && hasPermission(role, "manage_admission") && admission.status === "PENDING" && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="shrink-0 border-t border-border bg-card/95 backdrop-blur-xl px-6 py-4 space-y-3"
            >
              {showRejectBox ? (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Reason for rejection
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={2}
                    placeholder="Shown to the applicant..."
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-400/30"
                  />
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowRejectBox(false)}
                      className="flex-1 rounded-xl bg-muted px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted/70 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmReject}
                      disabled={isPending}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-600 disabled:opacity-50 transition-colors"
                    >
                      <XCircle className="h-4 w-4" />
                      Confirm reject
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleRejectClick}
                    disabled={isPending}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-rose-100 dark:bg-rose-500/15 px-4 py-2.5 text-sm font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-200 dark:hover:bg-rose-500/25 disabled:opacity-50 transition-colors"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleApprove}
                    disabled={isPending}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 disabled:opacity-50 transition-shadow"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {isPending ? "Processing…" : "Approve"}
                  </motion.button>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}