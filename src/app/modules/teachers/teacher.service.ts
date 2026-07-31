import api from "@/lib/axios";
import { Teacher, CreateTeacherPayload } from "./teacher.types";

export const teacherService = {
  getAll: async (): Promise<Teacher[]> => {
    const res = await api.get("/teachers");
    const payload = res.data?.data ?? res.data;
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.teachers)) return payload.teachers;
    return [];
  },

  getById: async (id: string): Promise<Teacher> => {
    const res = await api.get(`/teachers/${id}`);
    return res.data?.data ?? res.data;
  },

  create: async (data: CreateTeacherPayload): Promise<Teacher> => {
    const res = await api.post("/teachers", data);
    return res.data?.data ?? res.data;
  },

  update: async (id: string, data: Partial<CreateTeacherPayload>): Promise<Teacher> => {
    const res = await api.patch(`/teachers/${id}`, data);
    return res.data?.data ?? res.data;
  },

  assignSubjects: async (id: string, subjectIds: string[]): Promise<Teacher> => {
    const res = await api.patch(`/teachers/${id}/assign-subjects`, { subjectIds });
    return res.data?.data ?? res.data;
  },

  assignClasses: async (id: string, classIds: string[]): Promise<Teacher> => {
    const res = await api.patch(`/teachers/${id}/assign-classes`, { classIds });
    return res.data?.data ?? res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/teachers/${id}`);
  },
};