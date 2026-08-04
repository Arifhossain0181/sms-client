import api from "@/lib/axios";
import { Attendance, TakeAttendancePayload, AttendanceReportRow } from "./attendance.types";

export const attendanceService = {
  getByClassAndDate: async (classId: string, sectionId: string, date: string): Promise<Attendance[]> => {
    const res = await api.get(`/attendance?classId=${classId}&sectionId=${sectionId}&date=${date}`);
    return res.data?.data ?? res.data;
  },

  getByStudent: async (studentId: string): Promise<Attendance[]> => {
    const res = await api.get(`/attendance/student/${studentId}`);
    return res.data?.data ?? res.data;
  },

  takeAttendance: async (data: TakeAttendancePayload): Promise<Attendance[]> => {
    const res = await api.post("/attendance", data);
    return res.data?.data ?? res.data;
  },

  update: async (id: string, status: string): Promise<Attendance> => {
    const res = await api.patch(`/attendance/${id}`, { status });
    return res.data?.data ?? res.data;
  },

  getMonthlyReport: async (classId: string, sectionId: string, month: number, year: number): Promise<AttendanceReportRow[]> => {
    const res = await api.get("/attendance/monthly-report", { params: { classId, sectionId, month, year } });
    return res.data?.data ?? res.data;
  },

  getYearlyReport: async (classId: string, sectionId: string, year: number): Promise<AttendanceReportRow[]> => {
    const res = await api.get("/attendance/yearly-report", { params: { classId, sectionId, year } });
    return res.data?.data ?? res.data;
  },
};