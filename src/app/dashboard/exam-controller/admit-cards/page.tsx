"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import { useLenis } from "@/hooks/useLenis";
import { useAuth } from "@/hooks/useAuth";
import { examService } from "@/app/modules/exam/exam.service";
import { classService } from "@/app/modules/class/class.service";
import {
  GraduationCap,
  Search,
  Download,
  FileText,
  Calendar,
  Clock,
  Users,
  Printer,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

type ScheduleItem = {
  subjectName: string;
  fullMarks: number;
  examDate: string;
  startTime: string;
  endTime: string;
};

type StudentInfo = {
  id: string;
  studentId: string;
  name: string;
  rollNumber: string | number;
  className: string;
  sectionName: string;
};

type AdmitCardItem = {
  exam: { id: string; name: string; type: string };
  student: StudentInfo;
  schedules: ScheduleItem[];
};

export default function AdmitCardsPage() {
  useLenis();
  const router = useRouter();
  const { role } = useAuth();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const examIdFromUrl = searchParams.get("examId");
  const classIdFromUrl = searchParams.get("classId");

  const [selectedExamId, setSelectedExamId] = useState<string>(examIdFromUrl || "");
  const [selectedClassId, setSelectedClassId] = useState<string>(classIdFromUrl || "");
  const [search, setSearch] = useState("");
  const [printingId, setPrintingId] = useState<string | null>(null);

  useEffect(() => {
    if (role && role !== "EXAM_CONTROLLER" && role !== "SCHOOL_ADMIN") {
      router.replace("/dashboard");
    }
  }, [role, router]);

  useEffect(() => {
    if (examIdFromUrl) setSelectedExamId(examIdFromUrl);
  }, [examIdFromUrl]);

  useEffect(() => {
    if (classIdFromUrl) setSelectedClassId(classIdFromUrl);
  }, [classIdFromUrl]);

  const { data: exams = [], isLoading: examsLoading } = useQuery({
    queryKey: ["exams"],
    queryFn: async () => {
      const data = await examService.getAll();
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: classes = [], isLoading: classesLoading } = useQuery({
    queryKey: ["classes"],
    queryFn: classService.getAll,
  });

  const { data: admitCards = [], isLoading: cardsLoading, error } = useQuery({
    queryKey: ["admit-cards", selectedExamId, selectedClassId],
    queryFn: async () => {
      if (!selectedExamId || !selectedClassId) return [];
      const data = await examService.getAdmitCardsForClass(selectedExamId, selectedClassId);
      return data as AdmitCardItem[];
    },
    enabled: !!selectedExamId && !!selectedClassId,
  });

  const downloadMutation = useMutation({
    mutationFn: async ({ examId, studentId }: { examId: string; studentId: string }) => {
      const blob = await examService.downloadAdmitCard(examId, studentId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `admit-card-${studentId}-${examId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      toast.success("Admit card downloaded");
      setPrintingId(null);
    },
    onError: () => {
      toast.error("Failed to download admit card");
      setPrintingId(null);
    },
  });

  const handleDownload = useCallback(
    (examId: string, studentId: string) => {
      setPrintingId(studentId);
      downloadMutation.mutate({ examId, studentId });
    },
    [downloadMutation]
  );

  const handlePrintAll = useCallback(() => {
    if (!admitCards.length) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow popups to print admit cards");
      return;
    }

    const content = admitCards
      .map(
        (card) => `
        <div style="font-family: Arial, sans-serif; padding: 20px; page-break-after: always; max-width: 700px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="margin: 0; font-size: 20px;">${card.exam.name} (${card.exam.type.replace("_", " ")})</h1>
            <h2 style="margin: 5px 0; font-size: 16px;">Admit Card</h2>
          </div>
          <div style="border: 1px solid #000; padding: 15px; margin-bottom: 15px;">
            <p style="margin: 5px 0;"><strong>Student Name:</strong> ${card.student.name}</p>
            <p style="margin: 5px 0;"><strong>Student ID:</strong> ${card.student.studentId}</p>
            <p style="margin: 5px 0;"><strong>Roll Number:</strong> ${card.student.rollNumber}</p>
            <p style="margin: 5px 0;"><strong>Class:</strong> ${card.student.className}</p>
            <p style="margin: 5px 0;"><strong>Section:</strong> ${card.student.sectionName}</p>
          </div>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
            <thead>
              <tr style="background: #f3f4f6;">
                <th style="border: 1px solid #000; padding: 8px; text-align: left;">Subject</th>
                <th style="border: 1px solid #000; padding: 8px; text-align: left;">Date</th>
                <th style="border: 1px solid #000; padding: 8px; text-align: left;">Time</th>
                <th style="border: 1px solid #000; padding: 8px; text-align: right;">Full Marks</th>
              </tr>
            </thead>
            <tbody>
              ${card.schedules
                .map(
                  (s) => `
                <tr>
                  <td style="border: 1px solid #000; padding: 8px;">${s.subjectName}</td>
                  <td style="border: 1px solid #000; padding: 8px;">${new Date(s.examDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</td>
                  <td style="border: 1px solid #000; padding: 8px;">${s.startTime} - ${s.endTime}</td>
                  <td style="border: 1px solid #000; padding: 8px; text-align: right;">${s.fullMarks}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
          <div style="margin-top: 40px; display: flex; justify-content: space-between;">
            <div>
              <p style="margin: 0;">_____________________</p>
              <p style="margin: 2px 0 0 0; font-size: 12px;">Exam Controller Signature</p>
            </div>
          </div>
        </div>
      `
      )
      .join("");

    printWindow.document.write(`
      <html>
        <head><title>Admit Cards</title></head>
        <body>${content}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }, [admitCards]);

  const filteredCards = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return admitCards;
    return admitCards.filter((card) => {
      const name = card.student.name.toLowerCase();
      const sid = String(card.student.studentId).toLowerCase();
      const roll = String(card.student.rollNumber).toLowerCase();
      const cls = card.student.className.toLowerCase();
      const section = card.student.sectionName.toLowerCase();
      return name.includes(q) || sid.includes(q) || roll.includes(q) || cls.includes(q) || section.includes(q);
    });
  }, [admitCards, search]);

  const selectedExam = useMemo(() => {
    return exams.find((e: any) => e.id === selectedExamId);
  }, [exams, selectedExamId]);

  const isLoading = examsLoading || classesLoading || cardsLoading;

  return (
    <div className="relative min-h-screen flex items-start justify-center p-4 sm:p-6 overflow-hidden bg-slate-50/50 dark:bg-slate-950">
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

      <div className="relative w-full max-w-6xl my-8 space-y-6">
        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/10 shadow-2xl shadow-slate-200/40 dark:shadow-none overflow-hidden">
          <div className="relative px-6 sm:px-8 py-6 bg-gradient-to-r from-sky-50 via-indigo-50 to-violet-50 dark:from-sky-500/10 dark:via-indigo-500/10 dark:to-violet-500/10 border-b border-white/40 dark:border-white/5 overflow-hidden">
            <motion.div
              animate={{ x: [0, 100, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none"
            />
            <div className="relative flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  Admit Cards
                  <motion.span
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="text-indigo-400"
                  >
                    <FileText className="w-5 h-5" />
                  </motion.span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Generate and download exam admit cards by class
                </p>
              </div>
              {filteredCards.length > 0 && (
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Total Students: <b className="text-slate-700 dark:text-slate-300">{filteredCards.length}</b>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-5">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[200px]">
                <select
                  value={selectedExamId}
                  onChange={(e) => {
                    setSelectedExamId(e.target.value);
                    setSelectedClassId("");
                    setSearch("");
                  }}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-white/5 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
                >
                  <option value="">Select Exam</option>
                  {exams.map((e: any) => (
                    <option key={e.id} value={e.id}>
                      {e.name} {e.type ? `(${e.type.replace("_", " ")})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {selectedExamId && (
                <>
                  <div className="min-w-[180px]">
                    <select
                      value={selectedClassId}
                      onChange={(e) => {
                        setSelectedClassId(e.target.value);
                        setSearch("");
                      }}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-white/5 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
                    >
                      <option value="">Select Class</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="relative flex-1 min-w-[220px]">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search by name, ID, roll..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-white/5 pl-9 pr-4 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handlePrintAll}
                    disabled={filteredCards.length === 0}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/40 dark:border-white/10 bg-white/60 dark:bg-white/5 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-white/80 dark:hover:bg-white/10 disabled:opacity-50"
                  >
                    <Printer className="h-4 w-4" /> Print All
                  </motion.button>
                </>
              )}
            </div>

            {!selectedExamId ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <GraduationCap className="w-10 h-10 text-indigo-400 mb-4" />
                <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">Select an exam</h3>
                <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
                  Choose an exam and class to generate admit cards.
                </p>
              </div>
            ) : !selectedClassId ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Users className="w-10 h-10 text-indigo-400 mb-4" />
                <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">Select a class</h3>
                <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
                  Choose a class to view students and generate admit cards.
                </p>
              </div>
            ) : isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-2xl" />
                ))}
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FileText className="w-10 h-10 text-rose-400 mb-4" />
                <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">Failed to load</h3>
                <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
                  {(error as Error)?.message || "Please try again later."}
                </p>
              </div>
            ) : filteredCards.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FileText className="w-10 h-10 text-indigo-400 mb-4" />
                <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">No students found</h3>
                <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
                  No students found for the selected class.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCards.map((card, idx) => (
                  <motion.div
                    key={card.student.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/60 p-4 sm:p-6"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-2 flex-1 min-w-[200px]">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                            {card.student.name}
                          </h3>
                          <span className="text-xs text-slate-500">
                            ID: {card.student.studentId} | Roll: {card.student.rollNumber}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5 text-indigo-400" /> {card.student.className} - {card.student.sectionName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-indigo-400" />{" "}
                            {card.schedules.length} exam{card.schedules.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {card.schedules.map((s, i) => (
                            <span
                              key={i}
                              className="inline-flex rounded-md px-2 py-1 text-xs font-medium border bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/20"
                              title={`${new Date(s.examDate).toLocaleDateString("en-GB")} ${s.startTime} - ${s.endTime}`}
                            >
                              {s.subjectName}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleDownload(card.exam.id, card.student.id)}
                          disabled={printingId === card.student.id}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 disabled:opacity-50 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300"
                        >
                          {printingId === card.student.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Download className="h-3.5 w-3.5" />
                          )}
                          Download
                        </motion.button>
                      </div>
                    </div>

                    <details className="group mt-4">
                      <summary className="list-none flex items-center justify-between cursor-pointer text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                        <span>View Schedule Details</span>
                        <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
                      </summary>
                      <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-700 text-left text-xs uppercase text-slate-500 dark:text-slate-400 bg-slate-50/60 dark:bg-slate-800/40">
                              <th className="pb-2 pl-3 font-medium">Subject</th>
                              <th className="pb-2 font-medium">Date</th>
                              <th className="pb-2 font-medium">Time</th>
                              <th className="pb-2 font-medium text-right pr-3">Full Marks</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {card.schedules.map((s, i) => (
                              <tr key={i} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                                <td className="py-2.5 pl-3 text-slate-700 dark:text-slate-200">{s.subjectName}</td>
                                <td className="py-2.5 text-slate-600 dark:text-slate-300">
                                  {new Date(s.examDate).toLocaleDateString("en-GB", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </td>
                                <td className="py-2.5 text-slate-600 dark:text-slate-300">
                                  {s.startTime} - {s.endTime}
                                </td>
                                <td className="py-2.5 text-right pr-3 text-slate-600 dark:text-slate-300">
                                  {s.fullMarks}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </details>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
