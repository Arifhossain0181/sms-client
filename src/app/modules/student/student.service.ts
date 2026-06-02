/* eslint-disable @typescript-eslint/no-explicit-any */
import api from "@/lib/axios";
import { Student, CreateStudentPayload } from "./student.types";

export const studentService = {
  getAll: async (): Promise<Student[]> => {
    const res = await api.get("/students");
    const payload = res.data?.data ?? res.data;
    // Backend returns { data: [...students], meta: {...} }
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.students)) return payload.students;
    return [];
  },

  getById: async (id: string): Promise<Student> => {
    const res = await api.get(`/students/${id}`);
    return res.data?.data ?? res.data;
  },

  create: async (data: CreateStudentPayload): Promise<Student> => {
    // Map frontend field names to backend field names
    const backendData: any = {
      name: data.name,
      password: data.password || "",
      rollNumber: data.rollNumber,
      classId: data.classId,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      bloodGroup: data.bloodGroup,
      phoneNumber: data.phone,
      address: data.address,
      guardianName: data.guardianName,
      guardianEmail: data.guardianEmail,
      guardianPhone: data.guardianPhone,
      guradianRelation: data.guardianRelation, // Note: backend has typo "guradianRelation"
    };

    // Add email only if provided (optional for admin mode)
    if (data.email) {
      backendData.email = data.email;
    }
    
    const res = await api.post("/students", backendData);
    return res.data?.data ?? res.data;
  },

  update: async (id: string, data: Partial<CreateStudentPayload>): Promise<Student> => {
    const res = await api.put(`/students/${id}`, data);
    return res.data?.data ?? res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/students/${id}`);
  },
};
