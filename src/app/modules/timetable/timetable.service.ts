import api from "@/lib/axios";
import { Timetable, CreateTimetablePayload } from "./timetable.types";

type TeacherScheduleItem = {
  id: string;
  classId?: string;
  class?: {
    id: string;
    name: string;
  };
  section?: {
    id: string;
    name: string;
    classId?: string;
    class?: {
      id: string;
      name: string;
    };
  };
  subjectId?: string;
  subject?: {
    id: string;
    name: string;
  };
  teacherId?: string;
  teacher?: {
    id: string;
    employeeId?: string;
    user?: {
      name?: string;
    };
  };
  dayOfWeek: Timetable["dayOfWeek"];
  startTime: string;
  endTime: string;
  createdAt?: string;
};

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
    const res = await api.get(`/teachers/${teacherId}/schedule`);
    const payload = res.data?.data ?? res.data;

    if (!Array.isArray(payload)) {
      return [];
    }

    return payload.map((item: TeacherScheduleItem) => ({
      id: item.id,
      classId: item.section?.classId ?? item.classId ?? "",
      class: item.section?.class
        ? {
            id: item.section.class.id,
            name: item.section.class.name,
          }
        : item.class
          ? {
              id: item.class.id,
              name: item.class.name,
            }
          : undefined,
      section: item.section
        ? {
            id: item.section.id,
            name: item.section.name,
          }
        : undefined,
      subjectId: item.subjectId ?? item.subject?.id ?? "",
      subject: item.subject
        ? {
            id: item.subject.id,
            name: item.subject.name,
          }
        : undefined,
      teacherId: item.teacherId ?? item.teacher?.id ?? teacherId,
      teacher: item.teacher
        ? {
            id: item.teacher.id,
            name: item.teacher.user?.name,
          }
        : undefined,
      dayOfWeek: item.dayOfWeek,
      startTime: item.startTime,
      endTime: item.endTime,
      createdAt: item.createdAt ?? "",
    }));
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
