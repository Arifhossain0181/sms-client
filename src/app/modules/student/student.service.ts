import api from "@/lib/axios";
import { CreateStudentPayload, Student } from "./student.types";

export const studentService = {
    getAll: async (): Promise<Student[]> => {
        const res = await api.get("/students");
        const payload = res.data?.data ?? res.data;
        if (Array.isArray(payload)) return payload;
        if (Array.isArray(payload?.data)) return payload.data;
        if (Array.isArray(payload?.students)) return payload.students;
        return [];
    },
    getById: async (id: string): Promise<Student> => {
        const res = await api.get(`/students/${id}`);
        return res.data?.data ?? res.data;
    },
    create: async (student: CreateStudentPayload): Promise<Student> => {
        const res = await api.post("/students", student);
        return res.data?.data ?? res.data;
    },
    update: async (id: string, student: CreateStudentPayload): Promise<Student> => {
        const res = await api.patch(`/students/${id}`, student);
        return res.data?.data ?? res.data;
    },
    delete: async (id: string): Promise<void> => {
        await api.delete(`/students/${id}`);
    },
}