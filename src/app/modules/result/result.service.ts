/* eslint-disable @typescript-eslint/no-explicit-any */
import api from "@/lib/axios";
import { Result, CreateResultPayload } from "@/app/modules/result/result.types";

export const resultService = {
  getAll: async (): Promise<Result[]> => {
    const res = await api.get("/results");
    return res.data;
  },

  // Fetch results by exam
  getByExam: async (examId: string): Promise<Result[]> => {
    const res = await api.get(`/results/exam/${examId}`);
    const data = res.data?.data ?? res.data;
    if (!data?.results) {
      return data
    }
    return [];
  },

  // Fetch all results for a student
  getByStudent: async (studentId: string): Promise<Result[]> => {
    const res = await api.get(`/results/student/${studentId}`);
    return res.data?.data ?? res.data;
  },

  // Submit a result
  create: async (data: CreateResultPayload): Promise<Result> => {
    const res = await api.post("/results", data);
    return res.data;
  },

  // Submit results in bulk
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