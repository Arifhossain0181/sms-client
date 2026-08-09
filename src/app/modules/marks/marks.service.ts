import api from "@/lib/axios";
import {
  MarkEntry,
  TeacherExam,
  TeacherMarksResponse,
  SubmitExamMarksPayload,
} from "./marks.types";

export const marksService = {
  listPending: async (examId: string, classId?: string, subjectId?: string): Promise<MarkEntry[]> => {
    const res = await api.get(`/exams/${examId}/marks/pending`, {
      params: {
        ...(classId && classId !== "all" ? { classId } : {}),
        ...(subjectId && subjectId !== "all" ? { subjectId } : {}),
      },
    });
    const data = res.data?.data ?? res.data;
    if (Array.isArray(data)) return data;
    return [];
  },

  approve: async (examId: string, entries?: Array<{ studentId: string; subjectId: string }>) => {
    const res = await api.post(`/exams/${examId}/marks/approve`, { entries });
    return res.data?.data ?? res.data;
  },

  reject: async (examId: string, entries: Array<{ studentId: string; subjectId: string }>, reason: string) => {
    const res = await api.post(`/exams/${examId}/marks/reject`, { entries, reason });
    return res.data?.data ?? res.data;
  },

  getTeacherExams: async (): Promise<TeacherExam[]> => {
    const res = await api.get("/exams/teacher/my-exams");
    return res.data?.data ?? res.data;
  },

  getTeacherMarksForExam: async (examId: string): Promise<TeacherMarksResponse> => {
    const res = await api.get(`/exams/${examId}/teacher/my-marks`);
    return res.data?.data ?? res.data;
  },

  getStudentsForExam: async (examId: string): Promise<TeacherMarksResponse> => {
    const res = await api.get(`/exams/${examId}/teacher/students`);
    return res.data?.data ?? res.data;
  },

  submitExamMarks: async (examId: string, payload: SubmitExamMarksPayload) => {
    const res = await api.post(`/exams/${examId}/marks`, payload);
    return res.data?.data ?? res.data;
  },
};
