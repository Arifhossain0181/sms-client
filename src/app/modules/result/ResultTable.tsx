"use client";

import { useState } from "react";
import { useExams } from "../exam/useExams";
import { useResultsByExam, useCreateBulkResult } from "./useResults";
import { useStudents } from "../student/useStudents";

import { useAuth } from "@/hooks/useAuth";
import { hasPermission } from "@/config/roles";

// Grade calculate
const getGrade = (marks: number, total: number): string => {
  const percent = (marks / total) * 100;
  if (percent >= 80) return "A+";
  if (percent >= 70) return "A";
  if (percent >= 60) return "B";
  if (percent >= 50) return "C";
  if (percent >= 40) return "D";
  return "F";
};

const gradeColor: Record<string, string> = {
  "A+": "bg-green-100 text-green-700",
  "A":  "bg-blue-100 text-blue-700",
  "B":  "bg-yellow-100 text-yellow-700",
  "C":  "bg-orange-100 text-orange-700",
  "D":  "bg-red-100 text-red-600",
  "F":  "bg-red-200 text-red-800",
};

export default function ResultTable() {
  const { data: exams } = useExams();
  const { data: students } = useStudents();
  const { role } = useAuth();

  const [examId, setExamId] = useState("");
  const [marks, setMarks] = useState<Record<string, number>>({});

  const { data: existingResults } = useResultsByExam(examId);
  const { mutate: submitResults, isPending } = useCreateBulkResult();

  const selectedExam = exams?.find((e) => e.id === examId);
  const classStudents = students?.filter(
    (s) => s.classId === selectedExam?.classId
  ) ?? [];

  const handleMarksChange = (studentId: string, value: number) => {
    setMarks((prev) => ({ ...prev, [studentId]: value }));
  };

  const handleSubmit = () => {
    if (!examId) return;
    const subjectId = selectedExam?.subjectId;
    if (!subjectId) return;

    const payload = classStudents.map((s) => ({
      examId,
      studentId: s.id,
      marks: [{ subjectId, marksObtained: marks[s.id] ?? 0 }],
    }));
    submitResults(payload);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Results</h1>
        <p className="text-sm text-gray-500">Exam select করে result দিন বা দেখুন</p>
      </div>

      {/* Exam Select */}
      <div className="bg-white rounded-xl shadow p-4 mb-6">
        <label className="block text-sm font-medium mb-1">Exam Select করুন</label>
        <select
          value={examId}
          onChange={(e) => setExamId(e.target.value)}
          className="w-full max-w-sm border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">Select Exam</option>
          {exams?.map((exam) => (
            <option key={exam.id} value={exam.id}>
              {exam.name} — {exam.subject?.name} ({exam.class?.name})
            </option>
          ))}
        </select>
      </div>

      {/* Result Table */}
      {examId && classStudents.length > 0 && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-6 py-3 text-left">#</th>
                <th className="px-6 py-3 text-left">Student</th>
                <th className="px-6 py-3 text-left">
                  Marks / {selectedExam?.totalMarks}
                </th>
                <th className="px-6 py-3 text-left">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {classStudents.map((student, index) => {
                const existing = existingResults?.find(
                  (r) => r.studentId === student.id
                );
                const currentMarks = marks[student.id] ?? existing?.marksObtained ?? 0;
                const grade = getGrade(currentMarks, selectedExam?.totalMarks ?? 100);

                return (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-500">{index + 1}</td>
                    <td className="px-6 py-4 font-medium text-gray-800">
                      {student.name}
                    </td>
                    <td className="px-6 py-4">
                      {role && hasPermission(role, "add_result") ? (
                        <input
                          type="number"
                          value={currentMarks}
                          min={0}
                          max={selectedExam?.totalMarks}
                          onChange={(e) =>
                            handleMarksChange(student.id, Number(e.target.value))
                          }
                          className="w-24 border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <span>{currentMarks}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${gradeColor[grade]}`}>
                        {grade}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Submit — শুধু Teacher/Admin দেখবে */}
          {role && hasPermission(role, "add_result") && (
            <div className="p-4 border-t flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {isPending ? "Saving..." : "Result Save করুন"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* No exam selected */}
      {!examId && (
        <div className="text-center py-20 text-gray-400">
          Exam select করুন
        </div>
      )}

      {/* No students */}
      {examId && classStudents.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          এই class এ কোনো student নেই
        </div>
      )}
    </div>
  );
}