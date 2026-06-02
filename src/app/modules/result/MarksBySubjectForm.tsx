"use client";

import { useState, useMemo } from "react";
import { useExams } from "../exam/useExams";
import { useSubjects } from "../subject/useSubjects";
import { useStudents } from "../student/useStudents";
import { useCreateBulkResult } from "./useResults";
import { useAuth } from "@/hooks/useAuth";
import { hasPermission } from "@/config/roles";
import { toast } from "sonner";

interface StudentMarks {
  studentId: string;
  studentName: string;
  marks: Record<string, number>; // subjectId -> marksObtained
  totalMarks: number;
  rank?: number;
}

export default function MarksBySubjectForm() {
  const { data: exams } = useExams();
  const { data: subjects } = useSubjects();
  const { data: students } = useStudents();
  const { role } = useAuth();
  const { mutate: submitResults, isPending } = useCreateBulkResult();

  const [examId, setExamId] = useState("");
  const [classId, setClassId] = useState("");
  const [studentMarks, setStudentMarks] = useState<Record<string, StudentMarks>>({});

  const selectedExam = exams?.find((e) => e.id === examId);
  const classSubjects = subjects?.filter((s) => s.classId === classId) ?? [];
  const classStudents = students?.filter((s) => s.classId === classId) ?? [];

  // Calculate ranking
  const rankedStudents = useMemo(() => {
    const studentsList: StudentMarks[] = Object.values(studentMarks);
    const sorted = [...studentsList].sort((a, b) => b.totalMarks - a.totalMarks);
    
    return sorted.map((student, index) => ({
      ...student,
      rank: index + 1,
    }));
  }, [studentMarks]);

  // Initialize student marks when class is selected
  const handleClassChange = (newClassId: string) => {
    setClassId(newClassId);
    const newStudentMarks: Record<string, StudentMarks> = {};
    const filteredStudents = students?.filter((s) => s.classId === newClassId) ?? [];

    filteredStudents.forEach((student) => {
      newStudentMarks[student.id] = {
        studentId: student.id,
        studentName: student.name,
        marks: {},
        totalMarks: 0,
      };
      classSubjects.forEach((subject) => {
        newStudentMarks[student.id].marks[subject.id] = 0;
      });
    });

    setStudentMarks(newStudentMarks);
  };

  const handleMarkChange = (studentId: string, subjectId: string, value: number) => {
    setStudentMarks((prev) => {
      const updated = { ...prev };
      if (updated[studentId]) {
        updated[studentId].marks[subjectId] = Math.max(0, value);
        // Recalculate total
        updated[studentId].totalMarks = Object.values(updated[studentId].marks).reduce(
          (sum, m) => sum + m,
          0
        );
      }
      return updated;
    });
  };

  const handleSubmit = () => {
    if (!examId) {
      toast.error("Please select an exam");
      return;
    }
    if (!classId) {
      toast.error("Please select a class");
      return;
    }
    if (classSubjects.length === 0) {
      toast.error("No subjects found for this class");
      return;
    }

    const payload = Object.values(studentMarks).map((student) => ({
      examId,
      studentId: student.studentId,
      marks: classSubjects.map((subject) => ({
        subjectId: subject.id,
        marksObtained: student.marks[subject.id] ?? 0,
      })),
    }));

    submitResults(payload, {
      onSuccess: () => {
        toast.success("Marks submitted successfully!");
        setStudentMarks({});
        setExamId("");
        setClassId("");
      },
    });
  };

  const getTotalPossibleMarks = () => {
    return classSubjects.reduce((sum, s) => sum + (s.fullMarks ?? 0), 0);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Mark Entry by Subject
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Select exam and class to enter marks for all subjects
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow p-4 grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">
            Exam
          </label>
          <select
            value={examId}
            onChange={(e) => setExamId(e.target.value)}
            className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 dark:text-white dark:border-slate-700"
          >
            <option value="">Select Exam</option>
            {exams?.map((exam) => (
              <option key={exam.id} value={exam.id}>
                {exam.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">
            Class
          </label>
          <select
            value={classId}
            onChange={(e) => handleClassChange(e.target.value)}
            className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 dark:text-white dark:border-slate-700"
          >
            <option value="">Select Class</option>
            {[...new Set(students?.map((s) => s.classId) ?? [])]
              .map((cid) => students?.find((s) => s.classId === cid)?.class)
              .filter(Boolean)
              .map((cls: any) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Mark Entry Table */}
      {classId && classSubjects.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow overflow-hidden">
          {/* Header Info */}
          <div className="p-4 border-b dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <strong>{classSubjects.length}</strong> subjects × <strong>{rankedStudents.length}</strong> students
              <span className="ml-2">| Total possible: <strong>{getTotalPossibleMarks()}</strong> marks</span>
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-gray-300 uppercase text-xs sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Rank</th>
                  <th className="px-4 py-3 text-left font-semibold">Student Name</th>
                  {classSubjects.map((subject) => (
                    <th key={subject.id} className="px-4 py-3 text-center font-semibold whitespace-nowrap">
                      {subject.name.slice(0, 10)}
                      <br />
                      <span className="font-normal text-xs text-gray-500">({subject.fullMarks})</span>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center font-semibold sticky right-0 bg-gray-50 dark:bg-slate-800">
                    Total
                    <br />
                    <span className="font-normal text-xs">/{getTotalPossibleMarks()}</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {rankedStudents.map((student) => (
                  <tr key={student.studentId} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 font-semibold">
                      {student.rank === 1 && "🥇"}
                      {student.rank === 2 && "🥈"}
                      {student.rank === 3 && "🥉"}
                      {student.rank && student.rank > 3 && `#${student.rank}`}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-white">
                      {student.studentName}
                    </td>
                    {classSubjects.map((subject) => (
                      <td key={subject.id} className="px-4 py-3 text-center">
                        {role && hasPermission(role, "add_result") ? (
                          <input
                            type="number"
                            min={0}
                            max={subject.fullMarks}
                            value={student.marks[subject.id] ?? 0}
                            onChange={(e) =>
                              handleMarkChange(
                                student.studentId,
                                subject.id,
                                Number(e.target.value)
                              )
                            }
                            className="w-16 border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                          />
                        ) : (
                          <span className="text-gray-700 dark:text-gray-300">
                            {student.marks[subject.id] ?? 0}
                          </span>
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-center font-bold sticky right-0 bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-blue-300">
                      {student.totalMarks}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Submit Button */}
          {role && hasPermission(role, "add_result") && (
            <div className="p-4 border-t dark:border-slate-700 bg-gray-50 dark:bg-slate-800 flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={isPending || rankedStudents.length === 0}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {isPending ? "Saving marks..." : "Save Marks"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* No class selected */}
      {!classId && (
        <div className="text-center py-20 text-gray-400 dark:text-gray-500">
          Select a class to begin entering marks
        </div>
      )}

      {/* Class selected but no subjects */}
      {classId && classSubjects.length === 0 && (
        <div className="text-center py-20 text-gray-400 dark:text-gray-500">
          No subjects found for this class
        </div>
      )}

      {/* No students in class */}
      {classId && classSubjects.length > 0 && rankedStudents.length === 0 && (
        <div className="text-center py-20 text-gray-400 dark:text-gray-500">
          No students enrolled in this class
        </div>
      )}
    </div>
  );
}
