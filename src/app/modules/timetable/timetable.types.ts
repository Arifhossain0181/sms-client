export type DayOfWeek =
  | "SATURDAY"
  | "SUNDAY"
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY";

export interface Timetable {
  id: string;
  classId: string;
  class?: {
    id: string;
    name: string;
    section: string;
  };
  subjectId: string;
  subject?: {
    id: string;
    name: string;
  };
  teacherId: string;
  teacher?: {
    id: string;
    name: string;
  };
  day: DayOfWeek;
  startTime: string;
  endTime: string;
  createdAt: string;
}

export interface CreateTimetablePayload {
  classId: string;
  subjectId: string;
  teacherId: string;
  day: DayOfWeek;
  startTime: string;
  endTime: string;
}