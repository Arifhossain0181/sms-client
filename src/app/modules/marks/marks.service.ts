import api from "@/lib/axios";

export type PendingMark = {
  id: string;
  examId: string;
  studentId: string;
  subjectId: string;
  marksObtained: number;
  status: string;
  rejectReason?: string | null;
  createdAt: string;
  student: {
    id: string;
    studentId?: string;
    name: string;
    section: {
      name: string;
      class: {
        id: string;
        name: string;
      };
    };
  };
  subject: {
    id: string;
    name: string;
    fullMarks: number;
    passMarks: number;
  };
  teacher?: {
    id: string;
    name: string;
  };
};

export const marksService = {
  listPending: async (examId: string, classId?: string, subjectId?: string): Promise<PendingMark[]> => {
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
};
