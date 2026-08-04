export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE";

export interface AttendanceEntry {
  studentId: string;
  status: AttendanceStatus;
}

export interface Attendance {
  id: string;
  studentId: string;
  student?: {
    id: string;
    name: string;
  };
  classId: string;
  class?: {
    id: string;
    name: string;
  };
  date: string;
  status: AttendanceStatus;
  createdAt: string;
}

export interface AttendanceReportRow {
  student: {
    id: string;
    name: string;
    rollNumber: number;
  };
  present: number;
  absent: number;
  late: number;
  total: number;
  percentage: number;
  belowThreshold: boolean;
}

export interface TakeAttendancePayload {
  classId: string;
  sectionId: string;
  date: string;
  entries: AttendanceEntry[];
  teacherId?: string;
}