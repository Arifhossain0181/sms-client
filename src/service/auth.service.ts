import { refresh } from "next/cache";
import  api  from "../lib/axios";
export const authService = {
    login:async(data:{email:string,password:string})=>{
        const res = await api.post("/auth/login", data);
        return res.data.user;
    },
    register:async(data:{username:string,email:string,password:string,role:"ADMIN" | "TEACHER" | "STUDENT"})=>{
        const res = await api.post("/auth/register", data);
        return res.data.user;
    },
    refresh:async()=>{
        const res = await api.post("/auth/refresh");
        return res.data.user;
    },
    logout:async()=>{
        await api.post("/auth/logout");
    },
    getme:async()=>{
        const res = await api.get("/auth/me");
        return res.data.user;
    }
}