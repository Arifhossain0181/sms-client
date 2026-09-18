"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap, Search, Filter, Eye, CheckCircle2, XCircle, Loader2, Inbox,
  User, Mail, Phone, Calendar, Briefcase, Building2, Award, Clock, BookOpen,
  Banknote, MapPin, FileText, FileSignature, AlertCircle, X, Users, Sparkles,
  FileCheck, ShieldCheck, Heart, ExternalLink, Image as ImageIcon, CheckCircle, Pencil, Trash2, Upload,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { hasPermission } from "@/config/roles";
import api from "@/lib/axios";
import { TeachingApplication, TeachingApplicationStatus } from "./teachingApplication.types";
import { useTeachingApplications, useUpdateTeachingApplication, useUpdateTeachingApplicationStatus, useDeleteTeachingApplication } from "./useTeachingApplication";
import type { UpdateTeachingApplicationPayload } from "./teachingApplication.types";

type StatusKey = "PENDING" | "APPROVED" | "REJECTED";

const statusConfig: Record<StatusKey, { cls: string; icon: React.ElementType; label: string }> = {
  PENDING:  { cls: "bg-amber-100 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/30",       icon: AlertCircle,  label: "Pending"  },
  APPROVED: { cls: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/30", icon: CheckCircle2, label: "Approved" },
  REJECTED: { cls: "bg-rose-100 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-500/30",             icon: XCircle,      label: "Rejected" },
};

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const rowVariants = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const } } };

export default function TeachingApplicationList() {
  const { data, isLoading } = useTeachingApplications();
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateTeachingApplicationStatus();
  const { mutate: updateApplication, isPending: isSaving } = useUpdateTeachingApplication();
  const { mutate: deleteApplication, isPending: isDeleting } = useDeleteTeachingApplication();
  const { role } = useAuth();

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<TeachingApplicationStatus | "">("");
  const [selected, setSelected] = useState<TeachingApplication | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  const list: TeachingApplication[] = Array.isArray(data) ? data : [];

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return list.filter((item) => {
      const matchSearch = !q || item.name.toLowerCase().includes(q) || item.email.toLowerCase().includes(q);
      const matchStatus = filterStatus ? item.status === filterStatus : true;
      return matchSearch && matchStatus;
    });
  }, [list, search, filterStatus]);

  const stats = useMemo(() => ({
    total: list.length,
    pending: list.filter((a) => a.status === "PENDING").length,
    approved: list.filter((a) => a.status === "APPROVED").length,
    rejected: list.filter((a) => a.status === "REJECTED").length,
  }), [list]);

  const canManage = role && hasPermission(role, "create_teacher");

  const handleApprove = (id: string) => {
    if (confirm("Approve this application? This will create a Teacher account and link it automatically.")) {
      updateStatus({ id, data: { status: "APPROVED" } });
    }
  };
  const handleReject = (id: string) => {
    const reason = prompt("Enter a rejection reason (optional)") ?? undefined;
    if (confirm("Reject this application?")) {
      updateStatus({ id, data: { status: "REJECTED", rejectionReason: reason } });
    }
  };
  const handleView = (item: TeachingApplication) => { setSelected(item); setShowDetail(true); };
  const handleClose = () => { setSelected(null); setShowDetail(false); };
  const handleEdit = (item: TeachingApplication) => {
    const values: Record<string, string> = {};
    Object.entries(item).forEach(([key, value]) => {
      if (!["id", "status", "reviewedAt", "rejectionReason", "convertedToTeacherId", "createdAt"].includes(key)) {
        values[key] = value == null ? "" : String(value);
      }
    });
    if (values.dob) values.dob = values.dob.slice(0, 10);
    setSelected(item);
    setEditForm(values);
    setShowEdit(true);
  };
  const handleDelete = (item: TeachingApplication) => {
    if (confirm(`Delete application from ${item.name}?`)) deleteApplication(item.id);
  };
  const handleEditSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected) return;
    const payload: Record<string, unknown> = { ...editForm };
    payload.experience = Number(editForm.experience || 0);
    if (editForm.expectedSalary) payload.expectedSalary = Number(editForm.expectedSalary);
    else delete payload.expectedSalary;
    updateApplication({ id: selected.id, data: payload as UpdateTeachingApplicationPayload }, {
      onSuccess: () => { setShowEdit(false); setSelected(null); },
    });
  };

  const uploadEditDocument = async (file: File, field: string) => {
    setUploadingField(field);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", field === "resumeUrl" ? "cv" : field.replace(/Url$/, ""));
      const response = await api.post("/admission/upload-document", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = response.data?.data?.url ?? response.data?.url;
      if (!url) throw new Error("Upload failed");
      setEditForm((old) => ({ ...old, [field]: url, ...(field === "cvUrl" ? { resumeUrl: url } : {}) }));
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
      alert(message ?? "Document upload failed");
    } finally {
      setUploadingField(null);
    }
  };

  const editFields = [
    ["name", "Name"], ["email", "Email"], ["phone", "Phone"], ["gender", "Gender"], ["dob", "Date of birth"],
    ["address", "Address"], ["designation", "Designation"], ["department", "Department"], ["qualification", "Qualification"],
    ["experience", "Experience"], ["subjectSpecialization", "Subject specialization"], ["expectedSalary", "Expected salary"],
    ["nationalId", "National ID"], ["birthCertificateNo", "Birth certificate no"], ["religion", "Religion"],
    ["maritalStatus", "Marital status"], ["nationality", "Nationality"], ["fatherName", "Father name"], ["motherName", "Mother name"],
    ["employmentType", "Employment type"], ["presentAddress", "Present address"], ["permanentAddress", "Permanent address"],
    ["emergencyContactName", "Emergency contact name"], ["emergencyContactPhone", "Emergency contact phone"],
    ["institution", "Institution"], ["passingYear", "Passing year"], ["result", "Result"],
    ["previousOrganization", "Previous organization"], ["previousDesignation", "Previous designation"],
    ["photoUrl", "Photo URL"], ["cvUrl", "CV URL"], ["nidUrl", "NID URL"], ["birthCertUrl", "Birth certificate URL"],
    ["sscCertUrl", "SSC certificate URL"], ["hscCertUrl", "HSC certificate URL"], ["bscCertUrl", "BSc certificate URL"], ["mscCertUrl", "MSc certificate URL"],
    ["resumeUrl", "Resume URL"], ["coverLetter", "Cover letter"],
  ] as const;

  const renderDocLink = (title: string, url?: string) => {
    if (!url) return null;
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-sky-400 bg-indigo-50/60 dark:bg-white/5 hover:bg-indigo-100 dark:hover:bg-white/10 px-3 py-2 rounded-xl border border-indigo-100 dark:border-white/10 transition group"
      >
        <FileText className="h-4 w-4 text-indigo-500 group-hover:scale-110 transition-transform" />
        <span className="truncate flex-1">{title}</span>
        <ExternalLink className="h-3 w-3 text-slate-400 shrink-0" />
      </a>
    );
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-sky-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/30 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-none space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative overflow-hidden rounded-3xl border border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-5 sm:p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/40 dark:hover:shadow-black/20"
        >
          <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-gradient-to-br from-sky-400/30 via-indigo-500/20 to-violet-500/20 blur-2xl" />
          <div className="relative flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white truncate">
                  Teaching Applications
                </h1>
                <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                Total {list.length} applications received
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="grid grid-cols-2 gap-3 sm:grid-cols-4"
        >
          {[
            { label: "Total",    value: stats.total,    color: "from-sky-500 to-indigo-600",   icon: Users },
            { label: "Pending",  value: stats.pending,  color: "from-amber-400 to-orange-500", icon: AlertCircle },
            { label: "Approved", value: stats.approved, color: "from-emerald-500 to-teal-500", icon: CheckCircle2 },
            { label: "Rejected", value: stats.rejected, color: "from-rose-500 to-pink-500",    icon: XCircle },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 + i * 0.05 }}
              className="relative overflow-hidden rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4 backdrop-blur-sm shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className={`absolute -right-4 -top-4 h-16 w-16 rounded-full bg-gradient-to-br ${stat.color} opacity-20 blur-xl`} />
              <div className="relative flex items-center gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} text-white shadow-md`}>
                  <stat.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold text-slate-900 dark:text-white leading-none">{stat.value}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{stat.label}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="flex flex-col gap-3 sm:flex-row sm:items-center"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by applicant name or email..."
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-900/60 py-2.5 pl-10 pr-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 backdrop-blur-sm focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/15 transition-all"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto">
            <Filter className="h-4 w-4 text-slate-500 shrink-0" />
            {([
              { v: "" as const, l: "All" },
              { v: "PENDING" as const, l: "Pending" },
              { v: "APPROVED" as const, l: "Approved" },
              { v: "REJECTED" as const, l: "Rejected" },
            ]).map((s) => (
              <button
                key={s.l}
                onClick={() => setFilterStatus(s.v as TeachingApplicationStatus | "")}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  filterStatus === s.v
                    ? "bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md shadow-indigo-500/25"
                    : "bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10"
                }`}
              >
                {s.l}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="overflow-hidden rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-sm shadow-sm transition-all duration-300 hover:shadow-lg"
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500 dark:text-slate-400">
              <Inbox className="h-12 w-12 mb-3 opacity-40" />
              <p className="text-sm font-medium">No applications found</p>
              <p className="text-xs mt-1">Try adjusting your search or filter</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.02]">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Applicant</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 hidden sm:table-cell">Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 hidden md:table-cell">Designation</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 hidden lg:table-cell">Qualification</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Actions</th>
                  </tr>
                </thead>
                <motion.tbody variants={containerVariants} initial="hidden" animate="visible">
                  <AnimatePresence>
                    {filtered.map((item) => {
                      const status = statusConfig[item.status as StatusKey];
                      const StatusIcon = status.icon;
                      return (
                        <motion.tr
                          key={item.id}
                          variants={rowVariants}
                          className="border-b border-slate-200/60 dark:border-white/5 hover:bg-slate-50/80 dark:hover:bg-white/[0.03] transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {item.photoUrl ? (
                                <img
                                  src={item.photoUrl}
                                  alt={item.name}
                                  className="h-9 w-9 rounded-xl object-cover ring-1 ring-indigo-500/20 shrink-0"
                                />
                              ) : (
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500/15 to-indigo-500/15 text-indigo-600 dark:text-sky-300 ring-1 ring-indigo-500/10">
                                  <User className="h-4 w-4" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{item.name}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{item.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                              <Phone className="h-3.5 w-3.5 text-slate-400" />
                              {item.phone}
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <span className="text-sm text-slate-700 dark:text-slate-200">{item.designation}</span>
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell">
                            <span className="text-sm text-slate-600 dark:text-slate-300">{item.qualification}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${status.cls}`}>
                              <StatusIcon className="h-3 w-3" />
                              {status.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <motion.button
                                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                onClick={() => handleView(item)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 dark:text-slate-400 hover:bg-sky-100 dark:hover:bg-sky-500/15 hover:text-sky-700 dark:hover:text-sky-300 transition-all duration-300 hover:-translate-y-0.5"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </motion.button>
                              {canManage && (
                                <>
                                  <motion.button
                                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                    onClick={() => handleEdit(item)}
                                    disabled={isSaving || isDeleting}
                                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 dark:text-slate-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/15 hover:text-indigo-700 dark:hover:text-indigo-300 transition-all disabled:opacity-50"
                                    title="Edit Application"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </motion.button>
                                  <motion.button
                                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                    onClick={() => handleDelete(item)}
                                    disabled={isSaving || isDeleting || item.status === "APPROVED"}
                                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 dark:text-slate-400 hover:bg-rose-100 dark:hover:bg-rose-500/15 hover:text-rose-700 dark:hover:text-rose-300 transition-all disabled:opacity-40"
                                    title={item.status === "APPROVED" ? "Approved applications cannot be deleted" : "Delete Application"}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </motion.button>
                                </>
                              )}
                              {canManage && item.status === "PENDING" && (
                                <>
                                  <motion.button
                                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                    onClick={() => handleApprove(item.id)}
                                    disabled={isUpdating}
                                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 dark:text-slate-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/15 hover:text-emerald-700 dark:hover:text-emerald-300 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50"
                                    title="Approve & Convert to Teacher"
                                  >
                                    <CheckCircle2 className="h-4 w-4" />
                                  </motion.button>
                                  <motion.button
                                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                    onClick={() => handleReject(item.id)}
                                    disabled={isUpdating}
                                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 dark:text-slate-400 hover:bg-rose-100 dark:hover:bg-rose-500/15 hover:text-rose-700 dark:hover:text-rose-300 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50"
                                    title="Reject Application"
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </motion.button>
                                </>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </motion.tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>

      <AnimatePresence>
        {showEdit && selected && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
            onClick={() => setShowEdit(false)}
          >
            <motion.form
              initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 12 }}
              onSubmit={handleEditSubmit}
              onClick={(event) => event.stopPropagation()}
              className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900"
            >
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-white/10">
                <div><h2 className="text-lg font-bold text-slate-900 dark:text-white">Update Application</h2><p className="text-xs text-slate-500">Edit applicant information</p></div>
                <button type="button" onClick={() => setShowEdit(false)} className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-white/10"><X className="h-4 w-4" /></button>
              </div>
              <div className="grid flex-1 gap-4 overflow-y-auto p-6 sm:grid-cols-2">
                {editFields.map(([key, label]) => (
                  <label key={key} className={key === "coverLetter" || key.includes("Address") ? "sm:col-span-2" : ""}>
                    <span className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">{label}</span>
                    {key.endsWith("Url") ? (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <input value={editForm[key] ?? ""} onChange={(event) => setEditForm((old) => ({ ...old, [key]: event.target.value }))} className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-950 dark:text-white" />
                          <label className="flex shrink-0 cursor-pointer items-center gap-1 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold dark:bg-white/10 dark:text-white">
                            {uploadingField === key ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                            Upload
                            <input type="file" accept={key === "photoUrl" ? "image/*" : "image/*,.pdf"} className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) uploadEditDocument(file, key); event.currentTarget.value = ""; }} />
                          </label>
                        </div>
                        {editForm[key] && <a href={editForm[key]} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:underline dark:text-sky-400">Open uploaded document</a>}
                      </div>
                    ) : key === "coverLetter" || key === "address" || key === "presentAddress" || key === "permanentAddress" ? (
                      <textarea value={editForm[key] ?? ""} onChange={(event) => setEditForm((old) => ({ ...old, [key]: event.target.value }))} rows={3} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-950 dark:text-white" />
                    ) : (
                      <input type={key === "dob" ? "date" : key === "experience" || key === "expectedSalary" ? "number" : key === "email" ? "email" : "text"} value={editForm[key] ?? ""} onChange={(event) => setEditForm((old) => ({ ...old, [key]: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-950 dark:text-white" />
                    )}
                  </label>
                ))}
              </div>
              <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4 dark:border-white/10">
                <button type="button" onClick={() => setShowEdit(false)} className="rounded-xl border px-4 py-2 text-sm">Cancel</button>
                <button type="submit" disabled={isSaving} className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">{isSaving ? "Saving..." : "Save Changes"}</button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Complete Detail Modal */}
      <AnimatePresence>
        {showDetail && selected && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
            onClick={handleClose}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-2xl transition-transform duration-300"
            >
              {/* Header */}
              <div className="relative overflow-hidden bg-gradient-to-br from-sky-500 via-indigo-500 to-violet-600 px-6 py-5">
                <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {selected.photoUrl ? (
                      <img
                        src={selected.photoUrl}
                        alt={selected.name}
                        className="h-12 w-12 rounded-2xl object-cover ring-2 ring-white/30 shrink-0"
                      />
                    ) : (
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur ring-1 ring-white/20">
                        <GraduationCap className="h-5 w-5 text-white" />
                      </div>
                    )}
                    <div>
                      <h2 className="text-lg font-bold text-white">{selected.name}</h2>
                      <p className="text-xs text-white/80">{selected.designation} {selected.department ? `· ${selected.department}` : ""}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Status Badges */}
                <div className="flex items-center justify-between gap-3">
                  {(() => {
                    const s = statusConfig[selected.status as StatusKey];
                    const I = s.icon;
                    return (
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${s.cls}`}>
                        <I className="h-3.5 w-3.5" />
                        {s.label}
                      </span>
                    );
                  })()}

                  {selected.convertedToTeacherId && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 px-3 py-1.5 text-xs font-semibold border border-indigo-200 dark:border-indigo-800">
                      <CheckCircle className="h-3.5 w-3.5 text-indigo-500" />
                      Converted to Teacher
                    </span>
                  )}
                </div>

                {/* 1. Personal Information */}
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-3">
                    <User className="h-4 w-4 text-indigo-500" /> Personal Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { label: "Full Name", value: selected.name, icon: User },
                      { label: "Email", value: selected.email, icon: Mail },
                      { label: "Phone", value: selected.phone, icon: Phone },
                      { label: "Gender", value: selected.gender, icon: User },
                      { label: "Date of Birth", value: selected.dob ? new Date(selected.dob).toLocaleDateString() : "—", icon: Calendar },
                      { label: "National ID", value: selected.nationalId || "—", icon: ShieldCheck },
                      { label: "Birth Cert No", value: selected.birthCertificateNo || "—", icon: FileText },
                      { label: "Religion", value: selected.religion || "—", icon: Sparkles },
                      { label: "Marital Status", value: selected.maritalStatus || "—", icon: Heart },
                      { label: "Nationality", value: selected.nationality || "—", icon: User },
                      { label: "Father's Name", value: selected.fatherName || "—", icon: Users },
                      { label: "Mother's Name", value: selected.motherName || "—", icon: Users },
                    ].map((field) => (
                      <div key={field.label} className="rounded-xl border border-slate-200/70 dark:border-white/10 bg-slate-50/60 dark:bg-white/[0.02] p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{field.label}</p>
                        <p className="text-xs font-medium text-slate-800 dark:text-slate-100 mt-0.5 truncate">{field.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Address & Emergency */}
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-3">
                    <MapPin className="h-4 w-4 text-sky-500" /> Address & Emergency Contact
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-xl border border-slate-200/70 dark:border-white/10 bg-slate-50/60 dark:bg-white/[0.02] p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Present Address</p>
                      <p className="text-xs text-slate-800 dark:text-slate-100 mt-0.5 whitespace-pre-wrap">{selected.presentAddress || selected.address || "—"}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200/70 dark:border-white/10 bg-slate-50/60 dark:bg-white/[0.02] p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Permanent Address</p>
                      <p className="text-xs text-slate-800 dark:text-slate-100 mt-0.5 whitespace-pre-wrap">{selected.permanentAddress || selected.address || "—"}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200/70 dark:border-white/10 bg-slate-50/60 dark:bg-white/[0.02] p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Emergency Contact Name</p>
                      <p className="text-xs text-slate-800 dark:text-slate-100 mt-0.5">{selected.emergencyContactName || "—"}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200/70 dark:border-white/10 bg-slate-50/60 dark:bg-white/[0.02] p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Emergency Contact Phone</p>
                      <p className="text-xs text-slate-800 dark:text-slate-100 mt-0.5">{selected.emergencyContactPhone || "—"}</p>
                    </div>
                  </div>
                </div>

                {/* 3. Position & Qualifications */}
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-3">
                    <Briefcase className="h-4 w-4 text-purple-500" /> Position & Qualifications
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { label: "Applied Position", value: selected.designation },
                      { label: "Employment Type", value: selected.employmentType || "—" },
                      { label: "Department", value: selected.department || "—" },
                      { label: "Subject Specialization", value: selected.subjectSpecialization || "—" },
                      { label: "Highest Qualification", value: selected.qualification },
                      { label: "Institution", value: selected.institution || "—" },
                      { label: "Passing Year", value: selected.passingYear || "—" },
                      { label: "Result / GPA", value: selected.result || "—" },
                      { label: "Experience (Years)", value: `${selected.experience} yrs` },
                      { label: "Previous Org", value: selected.previousOrganization || "—" },
                      { label: "Previous Designation", value: selected.previousDesignation || "—" },
                      { label: "Expected Salary", value: selected.expectedSalary ? `BDT ${selected.expectedSalary}` : "—" },
                    ].map((field) => (
                      <div key={field.label} className="rounded-xl border border-slate-200/70 dark:border-white/10 bg-slate-50/60 dark:bg-white/[0.02] p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{field.label}</p>
                        <p className="text-xs font-medium text-slate-800 dark:text-slate-100 mt-0.5 truncate">{field.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Uploaded Documents */}
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-3">
                    <FileCheck className="h-4 w-4 text-emerald-500" /> Uploaded Documents & Certificates
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {renderDocLink("Applicant Photo", selected.photoUrl)}
                    {renderDocLink("CV / Resume", selected.cvUrl || selected.resumeUrl)}
                    {renderDocLink("NID Card Document", selected.nidUrl)}
                    {renderDocLink("Birth Certificate", selected.birthCertUrl)}
                    {renderDocLink("SSC Certificate", selected.sscCertUrl)}
                    {renderDocLink("HSC Certificate", selected.hscCertUrl)}
                    {renderDocLink("B.Sc Certificate", selected.bscCertUrl)}
                    {renderDocLink("M.Sc Certificate", selected.mscCertUrl)}
                  </div>
                  {![selected.photoUrl, selected.cvUrl, selected.resumeUrl, selected.nidUrl, selected.birthCertUrl, selected.sscCertUrl, selected.hscCertUrl, selected.bscCertUrl, selected.mscCertUrl].some(Boolean) && (
                    <p className="text-xs text-slate-500 italic">No document files uploaded with this application.</p>
                  )}
                </div>

                {/* Cover Letter */}
                {selected.coverLetter && (
                  <div className="rounded-xl border border-slate-200/70 dark:border-white/10 bg-slate-50/60 dark:bg-white/[0.02] p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-2">
                      <FileSignature className="h-3.5 w-3.5 text-indigo-500" /> Cover Letter
                    </p>
                    <p className="text-xs text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">{selected.coverLetter}</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between gap-2 border-t border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.02] p-4">
                {canManage && selected.status === "PENDING" ? (
                  <>
                    <button
                      onClick={() => { handleReject(selected.id); handleClose(); }}
                      disabled={isUpdating}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-rose-100 dark:bg-rose-500/15 px-4 py-2.5 text-sm font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-200 dark:hover:bg-rose-500/25 disabled:opacity-50 transition-colors"
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </button>
                    <button
                      onClick={() => { handleApprove(selected.id); handleClose(); }}
                      disabled={isUpdating}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 disabled:opacity-50 transition-shadow"
                    >
                      {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      {isUpdating ? "Processing…" : "Approve & Convert to Teacher"}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleClose}
                    className="ml-auto rounded-xl bg-slate-100 dark:bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                  >
                    Close
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
