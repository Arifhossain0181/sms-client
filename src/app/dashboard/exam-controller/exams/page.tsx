"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/axios";
import { useLenis } from "@/hooks/useLenis";
import { ClipboardList, Plus, Trash2, ArrowLeft, School } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

type ExamSchedule = {
  id: string;
  classId: string;
  class: { id: string; name: string };
  subject: { id: string; name: string };
};

type Exam = {
  id: string;
  name: string;
  type: string;
  totalMarks: number;
  createdAt: string;
  isPublished?: boolean;
  schedules: ExamSchedule[];
};

type Class = { id: string; name: string };
type Subject = { id: string; name: string };

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: "easeOut" as const },
  }),
};

export default function ExamsPage() {
  useLenis();
  const router = useRouter();
  const { role } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    type: "CLASS_TEST",
    classId: "",
    subjectId: "",
    totalMarks: 100,
    startDate: new Date().toISOString().split('T')[0],
    startTime: "09:00",
    endTime: "12:00",
  });

  useEffect(() => {
    if (role && role !== "EXAM_CONTROLLER" && role !== "SCHOOL_ADMIN" && role !== "SUPER_ADMIN") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [examsRes, classesRes, subjectsRes] = await Promise.all([
          api.get("/exams"),
          api.get("/classes"),
          api.get("/subjects")
        ]);
        setExams(examsRes.data?.data || examsRes.data || []);
        setClasses(classesRes.data?.data || classesRes.data || []);
        setSubjects(subjectsRes.data?.data || subjectsRes.data || []);
      } catch (error) {
        console.error("Failed to load data", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredExams = selectedClassId
    ? exams.filter(e => e.schedules?.some(s => s.classId === selectedClassId))
    : [];

  const selectedClass = classes.find(c => c.id === selectedClassId);

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/exams", {
        ...form,
        totalMarks: Number(form.totalMarks)
      });
      const res = await api.get("/exams");
      setExams(res.data?.data || res.data || []);
      setShowForm(false);
      setForm({
        name: "",
        type: "CLASS_TEST",
        classId: selectedClass?.id || classes[0]?.id || "",
        subjectId: subjects[0]?.id || "",
        totalMarks: 100,
        startDate: new Date().toISOString().split('T')[0],
        startTime: "09:00",
        endTime: "12:00",
      });
    } catch (error) {
      console.error("Failed to create exam", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this exam?")) return;
    try {
      await api.delete(`/exams/${id}`);
      setExams(exams.filter(e => e.id !== id));
    } catch (error) {
      console.error("Failed to delete exam", error);
    }
  };

  const handleClassSelect = (classId: string) => {
    setSelectedClassId(classId);
  };

  const handleBackToClasses = () => {
    setSelectedClassId(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] p-4 sm:p-6 lg:p-8">
        <Skeleton className="h-10 w-48 mb-6" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] p-4 sm:p-6 lg:p-8 font-inter">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <motion.div
          custom={0}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <ClipboardList className="w-8 h-8 text-indigo-500" />
              Exam Types & List
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Manage all examinations, class tests, and terms.
            </p>
          </div>
        </motion.div>

        {!selectedClassId ? (
          <motion.div custom={1} initial="hidden" animate="visible" variants={cardVariants}>
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Select a Class</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {classes.map((cls, i) => (
                  <motion.div
                    key={cls.id}
                    custom={i}
                    initial="hidden"
                    animate="visible"
                    variants={cardVariants}
                    onClick={() => handleClassSelect(cls.id)}
                    className="cursor-pointer bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex items-center gap-3 transition-colors"
                  >
                    <School className="w-6 h-6 text-indigo-500" />
                    <span className="font-medium text-slate-900 dark:text-white">{cls.name}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div custom={1} initial="hidden" animate="visible" variants={cardVariants}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleBackToClasses}
                  className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-colors"
                  title="Back to classes"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  {selectedClass?.name || 'Class'} - Exams
                </h2>
              </div>
              <button
                onClick={() => {
                  setForm(f => ({ ...f, classId: selectedClass?.id || "" }));
                  setShowForm(true);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors shadow-sm"
              >
                <Plus className="w-5 h-5" />
                Create Exam
              </button>
            </div>

            <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                      <th className="py-4 px-6 text-sm font-semibold text-slate-900 dark:text-white">Exam Name</th>
                      <th className="py-4 px-6 text-sm font-semibold text-slate-900 dark:text-white">Type</th>
                      <th className="py-4 px-6 text-sm font-semibold text-slate-900 dark:text-white">Total Marks</th>
                      <th className="py-4 px-6 text-sm font-semibold text-slate-900 dark:text-white">Created At</th>
                      <th className="py-4 px-6 text-sm font-semibold text-slate-900 dark:text-white text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredExams.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500 dark:text-slate-400">
                          No exams found for this class. Click Create Exam to add one.
                        </td>
                      </tr>
                    ) : (
                      filteredExams.map((exam) => (
                        <tr key={exam.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-4 px-6">
                            <div className="font-medium text-slate-900 dark:text-white">{exam.name}</div>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                              exam.type === 'FINAL_EXAM' || exam.type === 'FINAL' 
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400' 
                                : exam.type === 'MID_TERM' 
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                            }`}>
                              {exam.type?.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-slate-600 dark:text-slate-300">
                            {exam.totalMarks}
                          </td>
                          <td className="py-4 px-6 text-slate-600 dark:text-slate-300">
                            {new Date(exam.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleDelete(exam.id)}
                                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                                title="Delete Exam"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" style={{ display: showForm ? 'flex' : 'none' }}>
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-6 shadow-xl w-full max-w-2xl border border-slate-100 dark:border-slate-800">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Create New Exam{selectedClass ? ` - ${selectedClass.name}` : ''}</h2>
            <form onSubmit={handleCreateExam} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Exam Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mid Term 2026"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Exam Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="CLASS_TEST">Class Test</option>
                    <option value="MID_TERM">Mid Term</option>
                    <option value="FINAL">Final Exam</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Class</label>
                  <select
                    required
                    value={form.classId}
                    onChange={(e) => setForm({ ...form, classId: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="">Select Class</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Subject</label>
                  <select
                    required
                    value={form.subjectId}
                    onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="">Select Subject</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Total Marks</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={form.totalMarks}
                    onChange={(e) => setForm({ ...form, totalMarks: Number(e.target.value) })}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-5 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                >
                  {saving ? "Creating..." : "Create Exam"}
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}