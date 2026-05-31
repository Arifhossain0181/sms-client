import { get } from "http";
import { CreateExamPayload, Exam } from "./exam.types";
import api from "@/lib/axios";



export const examService={
     getAll:async() : Promise<Exam[]>=>{
        const res = await api.get("/exams");
      const payload = res.data?.data ?? res.data;
      if (Array.isArray(payload)) return payload;
      if (Array.isArray(payload?.data)) return payload.data;
      if (Array.isArray(payload?.exams)) return payload.exams;
      return [];
     },
     getById:async(id:string) : Promise<Exam>=>{
        const res = await api.get(`/exams/${id}`);
      return res.data?.data ?? res.data;
     },
        create:async(data:CreateExamPayload) : Promise<Exam>=>{
            const res = await api.post("/exams", data);
         return res.data?.data ?? res.data;
        },
        update: async (id: string, data: Partial<CreateExamPayload>): Promise<Exam> => {
    const res = await api.put(`/exams/${id}`, data);
   return res.data?.data ?? res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/exams/${id}`);
  },
        
}