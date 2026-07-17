/* eslint-disable @typescript-eslint/no-explicit-any */
import api from "@/lib/axios";
import { Subject, CreateSubjectPayload, SubjectQuery } from "./subject.types";

function unwrap<T>(res: { data: any }): T {
  return res.data?.data ?? res.data;
}

export const subjectService = {
  getAll: async (query: SubjectQuery = {}): Promise<Subject[]> => {
    const res = await api.get("/subjects", { params: query });
    const payload = unwrap<Subject[]>(res);
    return Array.isArray(payload) ? payload : [];
  },

  getById: async (id: string): Promise<Subject> => {
    const res = await api.get(`/subjects/${id}`);
    return unwrap<Subject>(res);
  },

  create: async (data: CreateSubjectPayload): Promise<Subject> => {
    const res = await api.post("/subjects", data);
    return unwrap<Subject>(res);
  },

  update: async (id: string, data: Partial<CreateSubjectPayload>): Promise<Subject> => {
    const res = await api.patch(`/subjects/${id}`, data);
    return unwrap<Subject>(res);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/subjects/${id}`);
  },
};