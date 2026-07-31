import api from "@/lib/axios";
import { Timetable, CreateTimetablePayload } from "./timetable.types";

export const timetableService = {
  getAll: async (): Promise<Timetable[]> => {
    const res = await api.get("/timetable");
    const payload = res.data?.data ?? res.data;
    return Array.isArray(payload) ? payload : [];
  },

  getMyRoutine: async (): Promise<Timetable[]> => {
    const res = await api.get("/timetable/my-routine");
    const payload = res.data?.data ?? res.data;
    return Array.isArray(payload) ? payload : [];
  },

  getByClass: async (classId: string): Promise<Timetable[]> => {
    const res = await api.get(`/timetable?classId=${classId}`);
    const payload = res.data?.data ?? res.data;
    return Array.isArray(payload) ? payload : [];
  },

  getClassWeekly: async (classId: string): Promise<Record<string, Timetable[]>> => {
    const res = await api.get(`/timetable/class/${classId}`);
    const payload = res.data?.data ?? res.data;
    if (typeof payload === "object" && payload !== null && !Array.isArray(payload)) {
      return payload as Record<string, Timetable[]>;
    }
    if (Array.isArray(payload)) {
      const grouped: Record<string, Timetable[]> = {};
      for (const item of payload) {
        const key = item.dayOfWeek ?? "UNKNOWN";
        grouped[key] = grouped[key] ?? [];
        grouped[key].push(item);
      }
      return grouped;
    }
    return {};
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

  deleteByClass: async (classId: string): Promise<void> => {
    await api.delete(`/timetable/class/${classId}`);
  },
};