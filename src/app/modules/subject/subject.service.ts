import api from "@/lib/axios";
import { Subject, CreateSubjectPayload } from "./subject.types";

export const subjectService = {
  getAll: async (): Promise<Subject[]> => {
    const res = await api.get("/subjects");
    const payload = res.data?.data ?? res.data;
    return Array.isArray(payload) ? payload : [];
  },

  getById: async (id: string): Promise<Subject> => {
    const res = await api.get(`/subjects/${id}`);
    return res.data;
  },

  create: async (data: CreateSubjectPayload): Promise<Subject> => {
    const res = await api.post("/subjects", data);
    return res.data;
  },

  update: async (id: string, data: Partial<CreateSubjectPayload>): Promise<Subject> => {
    const res = await api.put(`/subjects/${id}`, data);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/subjects/${id}`);
  },
};