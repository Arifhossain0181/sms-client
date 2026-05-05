import api from "@/lib/axios";
import { Class, CreateClassPayload, CreateSectionPayload } from "./class.types";

export const classService = {
  getAll: async (): Promise<Class[]> => {
    const res = await api.get("/classes");
    const payload = res.data?.data ?? res.data;
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.classes)) return payload.classes;
    return [];
  },

  getById: async (id: string): Promise<Class> => {
    const res = await api.get(`/classes/${id}`);
    return res.data?.data ?? res.data;
  },

  create: async (data: CreateClassPayload): Promise<Class> => {
    const res = await api.post("/classes", data);
    return res.data?.data ?? res.data;
  },

  update: async (id: string, data: Partial<CreateClassPayload>): Promise<Class> => {
    const res = await api.put(`/classes/${id}`, data);
    return res.data?.data ?? res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/classes/${id}`);
  },

  createSection: async (data: CreateSectionPayload) => {
    const res = await api.post("/classes/sections", data);
    return res.data?.data ?? res.data;
  },
};