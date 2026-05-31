import api from "@/lib/axios";
import { Attendance, TakeAttendancePayload } from "./attendance.types";

export const attendanceService = {
  // সব attendance আনো
  // Class + Section + Date দিয়ে attendance আনো
  getByClassAndDate: async (classId: string, sectionId: string, date: string): Promise<Attendance[]> => {
    const res = await api.get(`/attendance?classId=${classId}&sectionId=${sectionId}&date=${date}`);
    return res.data?.data ?? res.data;
  },

  // Student এর attendance আনো
  getByStudent: async (studentId: string): Promise<Attendance[]> => {
    const res = await api.get(`/attendance/student/${studentId}`);
    return res.data?.data ?? res.data;
  },

  // Attendance নাও (class + section + date + entries)
  takeAttendance: async (data: TakeAttendancePayload): Promise<Attendance[]> => {
    const res = await api.post("/attendance", data);
    return res.data?.data ?? res.data;
  },

  // Update
  update: async (id: string, status: string): Promise<Attendance> => {
    const res = await api.patch(`/attendance/${id}`, { status });
    return res.data?.data ?? res.data;
  },
};