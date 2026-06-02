import api from "@/lib/axios";
import { Timetable, CreateTimetablePayload } from "./timetable.types";

export const timetableService = {
  getAll: async (): Promise<Timetable[]> => {
    const res = await api.get("/timetable");
    const payload = res.data?.data ?? res.data;
    return Array.isArray(payload) ? payload : [];
  },

  getByClass: async (classId: string): Promise<Timetable[]> => {
    const res = await api.get(`/timetable?classId=${classId}`);
    const payload = res.data?.data ?? res.data;
    return Array.isArray(payload) ? payload : [];
  },

  getByTeacher: async (teacherId: string): Promise<Timetable[]> => {
    const res = await api.get(`/timetable?teacherId=${teacherId}`);
    const payload = res.data?.data ?? res.data;
    return Array.isArray(payload) ? payload : [];
  },

  create: async (data: CreateTimetablePayload): Promise<Timetable> => {
    const res = await api.post("/timetable", data);
    return res.data?.data ?? res.data;
  },

  update: async (
    id: string,
    data: Partial<CreateTimetablePayload>
  ): Promise<Timetable> => {
    const res = await api.patch(`/timetable/${id}`, data);
    return res.data?.data ?? res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/timetable/${id}`);
  },
};