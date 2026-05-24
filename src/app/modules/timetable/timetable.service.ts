import api from "@/lib/axios";
import { Timetable, CreateTimetablePayload } from "./timetable.types";

export const timetableService = {
  getAll: async (): Promise<Timetable[]> => {
    const res = await api.get("/timetable");
    return res.data;
  },

  getByClass: async (classId: string): Promise<Timetable[]> => {
    const res = await api.get(`/timetable?classId=${classId}`);
    return res.data;
  },

  getByTeacher: async (teacherId: string): Promise<Timetable[]> => {
    const res = await api.get(`/timetable?teacherId=${teacherId}`);
    return res.data;
  },

  create: async (data: CreateTimetablePayload): Promise<Timetable> => {
    const res = await api.post("/timetable", data);
    return res.data;
  },

  update: async (
    id: string,
    data: Partial<CreateTimetablePayload>
  ): Promise<Timetable> => {
    const res = await api.put(`/timetable/${id}`, data);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/timetable/${id}`);
  },
};