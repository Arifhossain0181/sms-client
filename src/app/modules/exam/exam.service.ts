import { get } from "http";
import { CreateExamPayload, Exam } from "./exam.types";
import api from "@/lib/axios";



export const examService={
     getAll:async() : Promise<Exam[]>=>{
        const res = await api.get("/exams");
        return res.data;
     },
     getById:async(id:string) : Promise<Exam>=>{
        const res = await api.get(`/exams/${id}`);
        return res.data;
     },
        create:async(data:CreateExamPayload) : Promise<Exam>=>{
            const res = await api.post("/exams", data);
            return res.data;
        },
        update: async (id: string, data: Partial<CreateExamPayload>): Promise<Exam> => {
    const res = await api.put(`/exams/${id}`, data);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/exams/${id}`);
  },
        
}