import api from "@/lib/axios";
import { Result, CreateResultPayload } from "@/app/modules/result/result.types";

export const resultService = {
  getAll: async (): Promise<Result[]> => {
    const res = await api.get("/results");
    return res.data;
  },

  // Exam অনুযায়ী result আনো
  getByExam: async (examId: string): Promise<Result[]> => {
    const res = await api.get(`/results?examId=${examId}`);
    return res.data;
  },

  // Student এর সব result আনো
  getByStudent: async (studentId: string): Promise<Result[]> => {
    const res = await api.get(`/results?studentId=${studentId}`);
    return res.data;
  },

  // Result দাও
  create: async (data: CreateResultPayload): Promise<Result> => {
    const res = await api.post("/results", data);
    return res.data;
  },

  // Bulk result দাও
  createBulk: async (data: CreateResultPayload[]): Promise<Result[]> => {
    const res = await api.post("/results/bulk", data);
    return res.data;
  },

  update: async (id: string, marksObtained: number): Promise<Result> => {
    const res = await api.put(`/results/${id}`, { marksObtained });
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/results/${id}`);
  },
};