import { get } from "http";
import { CreateExamPayload, Exam } from "./exam.types";
import api from "@/lib/axios";



export const examService={
     getAll:async() : Promise<Exam[]>=>{
        const res = await api.get("/exams");
      const payload = res.data?.data ?? res.data;
      if (Array.isArray(payload)) return payload;
      if (Array.isArray(payload?.data)) return payload.data;
      if (Array.isArray(payload?.exams)) return payload.exams;
      return [];
     },
     getById:async(id:string) : Promise<Exam>=>{
        const res = await api.get(`/exams/${id}`);
      return res.data?.data ?? res.data;
     },
        create:async(data:CreateExamPayload) : Promise<Exam>=>{
            const res = await api.post("/exams", data);
         return res.data?.data ?? res.data;
        },
        update: async (id: string, data: Partial<CreateExamPayload>): Promise<Exam> => {
    const res = await api.put(`/exams/${id}`, data);
   return res.data?.data ?? res.data;
  },
  getPublishable: async (): Promise<any[]> => {
    const res = await api.get("/exams/publishing");
    const payload = res.data?.data ?? res.data;
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
  },
  publish: async (id: string): Promise<{ examId: string; status: string; affectedReportCards: number }> => {
    const res = await api.patch(`/exams/${id}/publish`);
    return res.data?.data ?? res.data;
  },
  unpublish: async (id: string): Promise<{ examId: string; status: string; affectedReportCards: number }> => {
    const res = await api.patch(`/exams/${id}/unpublish`);
    return res.data?.data ?? res.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/exams/${id}`);
  },
  getFailedStudents: async (examId: string, classId?: string): Promise<any> => {
    const params: Record<string, string> = {};
    if (classId) params.classId = classId;
    const res = await api.get(`/exams/${examId}/failed-students`, { params });
    const payload = res.data?.data ?? res.data;
    return payload;
  },
  getAdmitCardsForClass: async (examId: string, classId: string): Promise<any[]> => {
    const res = await api.get(`/exams/${examId}/classes/${classId}/admit-cards`);
    const payload = res.data?.data ?? res.data;
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
  },
  downloadAdmitCard: async (examId: string, studentId: string): Promise<Blob> => {
    const res = await api.get(`/exams/${examId}/students/${studentId}/admit-card`, {
      responseType: "blob",
    });
    return res.data;
  },
}