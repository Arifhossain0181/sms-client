"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useMyHomework,
  useOverdueHomework,
  useCreateHomework,
  useUpdateHomework,
  useMarkHomeworkReviewed,
  useDeleteHomework,
} from "@/app/modules/homework/useHomework";
import { useClasses } from "@/app/modules/class/useClasses";
import { useSubjects } from "@/app/modules/subject/useSubjects";
import { Homework, HomeworkStatusFilter } from "@/app/modules/homework/homework.types";
import { useLenis } from "@/hooks/useLenis";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  Plus,
  Clock,
  Trash2,
  Edit3,
  CheckCircle2,
  X,
  AlertTriangle,
  BookMarked,
  CalendarDays,
  Filter,
  Eye,
  ChevronRight,
  Layers,
  ClipboardList,
} from "lucide-react";

/* ─── animation variants ─────────────────────────────────── */
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.4, ease: "easeOut" as const },
  }),
};

type Tab = "mine" | "overdue";

/* ══════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════ */
export default function TeacherHomeworkPage() {
  useLenis();
  const [activeTab, setActiveTab] = useState<Tab>("mine");
  const [showCreateForm, setShowCreateForm] = useState(false);

  const tabs: { key: Tab; label: string; icon: typeof BookOpen }[] = [
    { key: "mine", label: "My Homework", icon: BookMarked },
    { key: "overdue", label: "Overdue", icon: AlertTriangle },
  ];

  return (
    <div className="relative min-h-screen flex items-start justify-center p-4 sm:p-6 overflow-hidden bg-slate-50/50 dark:bg-slate-950">
      {/* Ambient blobs */}
      <motion.div
        animate={{ x: [0, 50, 0], y: [0, -30, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-10 -left-32 w-[500px] h-[500px] bg-indigo-300/20 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"
      />
      <motion.div
        animate={{ x: [0, -40, 0], y: [0, 50, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-10 -right-32 w-[600px] h-[600px] bg-violet-300/20 dark:bg-violet-500/10 rounded-full blur-3xl pointer-events-none"
      />

      <div className="relative w-full max-w-5xl my-8 space-y-6">
        {/* ── Glass card ── */}
        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/10 shadow-2xl shadow-slate-200/40 dark:shadow-none overflow-hidden">
          {/* Header */}
          <div className="relative px-6 sm:px-8 py-6 bg-gradient-to-r from-indigo-50 via-violet-50 to-purple-50 dark:from-indigo-500/10 dark:via-violet-500/10 dark:to-purple-500/10 border-b border-white/40 dark:border-white/5 overflow-hidden">
            <motion.div
              animate={{ x: [0, 120, 0] }}
              transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none"
            />
            <div className="relative flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  Homework
                  <motion.span
                    animate={{ rotate: [0, 8, -8, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="text-indigo-400"
                  >
                    <BookMarked className="w-5 h-5" />
                  </motion.span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Create, manage, and review homework assignments for your classes.
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 text-white px-5 py-2.5 text-sm font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-violet-500/40 transition-all"
              >
                {showCreateForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {showCreateForm ? "Close" : "New Homework"}
              </motion.button>
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-6">
            {/* Create Form */}
            <AnimatePresence>
              {showCreateForm && (
                <CreateHomeworkForm onSuccess={() => setShowCreateForm(false)} />
              )}
            </AnimatePresence>

            {/* Tabs */}
            <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl p-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`relative flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? "text-white shadow-md"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="hw-tab-bg"
                        className="absolute inset-0 rounded-lg bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 shadow-lg shadow-indigo-500/30"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Tab content */}
            <AnimatePresence mode="wait">
              {activeTab === "mine" && (
                <motion.div
                  key="mine"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                >
                  <MyHomeworkTab onSwitchToCreate={() => setShowCreateForm(true)} />
                </motion.div>
              )}
              {activeTab === "overdue" && (
                <motion.div
                  key="overdue"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                >
                  <OverdueTab />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   CREATE FORM (inline collapsible)
══════════════════════════════════════════════════════════ */
function CreateHomeworkForm({ onSuccess }: { onSuccess: () => void }) {
  const { data: classes } = useClasses();
  const { data: subjects } = useSubjects();
  const { mutate: createHomework, isPending } = useCreateHomework();

  const [selectedClassId, setSelectedClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");

  const availableSections = useMemo(() => {
    const cls = (Array.isArray(classes) ? classes : []).find((c) => c.id === selectedClassId);
    return cls?.sections ?? [];
  }, [classes, selectedClassId]);

  const availableSubjects = useMemo(() => {
    return (Array.isArray(subjects) ? subjects : []).filter((s) => s.classId === selectedClassId);
  }, [subjects, selectedClassId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectionId || !subjectId || !title || !description || !dueDate) {
      toast.error("Please fill in all fields");
      return;
    }
    createHomework(
      { sectionId, subjectId, title, description, dueDate },
      {
        onSuccess: () => {
          setSelectedClassId(""); setSectionId(""); setSubjectId("");
          setTitle(""); setDescription(""); setDueDate("");
          onSuccess();
        },
      }
    );
  };

  const inputCls =
    "w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-white/5 px-3 py-2.5 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 transition";

  return (
    <motion.form
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.3 }}
      onSubmit={handleSubmit}
      className="rounded-2xl border border-indigo-200/60 dark:border-indigo-500/20 bg-indigo-50/60 dark:bg-indigo-500/5 p-6 shadow-xl space-y-5"
    >
      <div className="flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-indigo-500" />
        <h3 className="font-semibold text-slate-900 dark:text-white">Create New Homework</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1.5">
            Class <span className="text-red-400">*</span>
          </label>
          <select
            value={selectedClassId}
            onChange={(e) => { setSelectedClassId(e.target.value); setSectionId(""); setSubjectId(""); }}
            className={inputCls}
          >
            <option value="">Select Class</option>
            {(Array.isArray(classes) ? classes : []).map((cls) => (
              <option key={cls.id} value={cls.id}>{cls.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1.5">
            Section <span className="text-red-400">*</span>
          </label>
          <select
            value={sectionId}
            onChange={(e) => setSectionId(e.target.value)}
            disabled={!selectedClassId}
            className={`${inputCls} disabled:opacity-50`}
          >
            <option value="">Select Section</option>
            {availableSections.map((sec) => (
              <option key={sec.id} value={sec.id}>{sec.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1.5">
            Subject <span className="text-red-400">*</span>
          </label>
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            disabled={!selectedClassId}
            className={`${inputCls} disabled:opacity-50`}
          >
            <option value="">Select Subject</option>
            {availableSubjects.map((subj) => (
              <option key={subj.id} value={subj.id}>{subj.name} ({subj.code})</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1.5">
            Title <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Chapter 5 – Exercise A"
            className={inputCls}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1.5">
            Due Date <span className="text-red-400">*</span>
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className={inputCls}
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1.5">
          Description <span className="text-red-400">*</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Describe the homework task in detail…"
          className={inputCls}
        />
      </div>

      <div className="flex gap-3">
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 text-white px-5 py-2.5 text-sm font-semibold shadow-md shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {isPending ? "Creating…" : "Create Homework"}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          type="button"
          onClick={onSuccess}
          className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-white/5 px-5 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-white/80 dark:hover:bg-white/10 transition"
        >
          Cancel
        </motion.button>
      </div>
    </motion.form>
  );
}

/* ══════════════════════════════════════════════════════════
   MY HOMEWORK TAB
══════════════════════════════════════════════════════════ */
function MyHomeworkTab({ onSwitchToCreate }: { onSwitchToCreate: () => void }) {
  const { data: classes } = useClasses();
  const { data: subjects } = useSubjects();
  const { data, isPending } = useMyHomework();
  const { mutate: updateHomework, isPending: isUpdating } = useUpdateHomework();
  const { mutate: markReviewed } = useMarkHomeworkReviewed();
  const { mutate: deleteHomework } = useDeleteHomework();

  const [sectionId, setSectionId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [status, setStatus] = useState<HomeworkStatusFilter>("ALL");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDueDate, setEditDueDate] = useState("");

  const filteredData = useMemo(() => {
    if (!data?.data) return [];
    let result = data.data;
    if (sectionId) result = result.filter((h) => h.section.id === sectionId);
    if (subjectId) result = result.filter((h) => h.subject.id === subjectId);
    if (status !== "ALL") result = result.filter((h) => {
      if (status === "PENDING") return !h.isReviewed && !h.isOverdue;
      if (status === "REVIEWED") return h.isReviewed;
      if (status === "OVERDUE") return h.isOverdue && !h.isReviewed;
      return true;
    });
    return result;
  }, [data, sectionId, subjectId, status]);

  const startEdit = (hw: Homework) => {
    setEditingId(hw.id);
    setEditTitle(hw.title);
    setEditDescription(hw.description);
    setEditDueDate(hw.dueDate.split("T")[0]);
  };

  const handleUpdate = (id: string) => {
    updateHomework(
      { id, data: { title: editTitle, description: editDescription, dueDate: editDueDate } },
      { onSuccess: () => setEditingId(null) }
    );
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this homework?")) deleteHomework(id);
  };

  const getStatusBadge = (hw: Homework) => {
    if (hw.isReviewed)
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
          <CheckCircle2 className="h-3 w-3" /> Reviewed
        </span>
      );
    if (hw.isOverdue)
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
          <AlertTriangle className="h-3 w-3" /> Overdue
        </span>
      );
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
        <Clock className="h-3 w-3" /> Pending
      </span>
    );
  };

  const inputCls =
    "w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-white/5 px-3 py-1.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 transition";

  if (isPending) return <HomeworkSkeleton />;

  return (
    <div className="space-y-5">
      {/* Filter bar */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-4 flex flex-wrap gap-4 items-end">
        <Filter className="h-4 w-4 text-slate-400 mt-auto mb-1 shrink-0" />
        <div className="flex-1 min-w-[180px]">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">Section</label>
          <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} className={inputCls}>
            <option value="">All Sections</option>
            {(Array.isArray(classes) ? classes : []).map((cls) =>
              (cls.sections ?? []).map((sec) => (
                <option key={sec.id} value={sec.id}>{cls.name} – {sec.name}</option>
              ))
            )}
          </select>
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">Subject</label>
          <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className={inputCls}>
            <option value="">All Subjects</option>
            {(Array.isArray(subjects) ? subjects : []).map((subj) => (
              <option key={subj.id} value={subj.id}>{subj.name} ({subj.code})</option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[140px]">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as HomeworkStatusFilter)} className={inputCls}>
            <option value="ALL">All</option>
            <option value="PENDING">Pending</option>
            <option value="REVIEWED">Reviewed</option>
            <option value="OVERDUE">Overdue</option>
          </select>
        </div>
      </div>

      {/* Summary strip */}
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 px-1">
        <Layers className="h-3.5 w-3.5" />
        <span>
          Showing <strong className="text-slate-700 dark:text-slate-200">{filteredData.length}</strong>
          {" "}of{" "}
          <strong className="text-slate-700 dark:text-slate-200">{data?.total ?? 0}</strong> assignments
        </span>
      </div>

      {/* Cards */}
      {filteredData.length === 0 ? (
        <EmptyState
          icon={<BookMarked className="w-10 h-10 text-indigo-400" />}
          title="No homework found"
          sub="Adjust your filters or create a new assignment."
          action={{ label: "Create Homework", onClick: onSwitchToCreate }}
        />
      ) : (
        <div className="space-y-3">
          {filteredData.map((hw, idx) => (
            <motion.div
              key={hw.id}
              custom={idx}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-white/5 p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              {editingId === hw.id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Title</label>
                      <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Due Date</label>
                      <input type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Description</label>
                    <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3} className={inputCls} />
                  </div>
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                      onClick={() => handleUpdate(hw.id)} disabled={isUpdating}
                      className="rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 text-white px-4 py-1.5 text-xs font-semibold shadow disabled:opacity-50"
                    >
                      {isUpdating ? "Saving…" : "Save"}
                    </motion.button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-400 via-violet-400 to-purple-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/30 shrink-0">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white truncate">{hw.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {hw.subject.name} ({hw.subject.code}) · {hw.section.name}
                        </p>
                      </div>
                      {getStatusBadge(hw)}
                    </div>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                      {hw.description}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <CalendarDays className="h-3.5 w-3.5" />
                        Due: <strong className={hw.isOverdue ? "text-red-500 dark:text-red-400" : "text-slate-700 dark:text-slate-200"}>
                          {new Date(hw.dueDate).toLocaleDateString("en-GB")}
                        </strong>
                      </span>
                      {hw.viewedCount !== undefined && (
                        <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                          <Eye className="h-3.5 w-3.5" />
                          {hw.viewedCount} / {hw.totalStudents ?? "?"} viewed
                        </span>
                      )}
                      <div className="flex items-center gap-1 ml-auto">
                        <motion.button
                          whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                          onClick={() => startEdit(hw)} title="Edit"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition"
                        >
                          <Edit3 className="h-4 w-4" />
                        </motion.button>
                        {!hw.isReviewed && (
                          <motion.button
                            whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                            onClick={() => markReviewed(hw.id)} title="Mark as Reviewed"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </motion.button>
                        )}
                        <motion.button
                          whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                          onClick={() => handleDelete(hw.id)} title="Delete"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   OVERDUE TAB
══════════════════════════════════════════════════════════ */
function OverdueTab() {
  const { data: overdueList, isPending } = useOverdueHomework();
  const { mutate: markReviewed } = useMarkHomeworkReviewed();
  const { mutate: deleteHomework } = useDeleteHomework();

  if (isPending) return <HomeworkSkeleton />;

  if (!overdueList || overdueList.length === 0) {
    return (
      <EmptyState
        icon={<CheckCircle2 className="w-10 h-10 text-emerald-400" />}
        title="No overdue homework!"
        sub="Great work — all assignments are up to date."
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-semibold">
          <AlertTriangle className="h-3.5 w-3.5" />
          {overdueList.length} overdue assignment{overdueList.length !== 1 ? "s" : ""}
        </span>
      </div>

      {overdueList.map((hw, idx) => (
        <motion.div
          key={hw.id}
          custom={idx}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          className="rounded-2xl border border-red-200/60 dark:border-red-500/20 bg-red-50/40 dark:bg-red-500/5 p-5 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center text-white shadow-md shadow-red-400/30 shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{hw.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {hw.subject.name} · {hw.section.name}
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                  Overdue
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                {hw.description}
              </p>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <span className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 font-medium">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Due: {new Date(hw.dueDate).toLocaleDateString("en-GB")}
                </span>
                <div className="flex items-center gap-1 ml-auto">
                  <motion.button
                    whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                    onClick={() => markReviewed(hw.id)} title="Mark as Reviewed"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                    onClick={() => { if (confirm("Delete this homework?")) deleteHomework(hw.id); }} title="Delete"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   SHARED HELPERS
══════════════════════════════════════════════════════════ */
function HomeworkSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-white/5 p-5 flex items-start gap-4"
        >
          <Skeleton className="w-11 h-11 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48 rounded-md" />
            <Skeleton className="h-3 w-32 rounded-md" />
            <Skeleton className="h-3 w-full rounded-md" />
            <Skeleton className="h-3 w-3/4 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  icon,
  title,
  sub,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-100 via-violet-100 to-purple-100 dark:from-indigo-500/10 dark:via-violet-500/10 dark:to-purple-500/10 flex items-center justify-center mb-4 ring-1 ring-indigo-200/60 dark:ring-indigo-400/20"
      >
        {icon}
      </motion.div>
      <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">{title}</h3>
      <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">{sub}</p>
      {action && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={action.onClick}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 text-white px-5 py-2.5 text-sm font-semibold shadow-lg shadow-indigo-500/30"
        >
          <Plus className="h-4 w-4" />
          {action.label}
          <ChevronRight className="h-4 w-4" />
        </motion.button>
      )}
    </motion.div>
  );
}

// Keep ClipboardList in scope (imported at top, used by old OverdueTab — keep import clean)
void ClipboardList;
