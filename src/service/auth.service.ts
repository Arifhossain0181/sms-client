import api from "../lib/axios";

const setCookie = (name: string, value: string, maxAgeSeconds: number) => {
    if (typeof document === "undefined") return;
    document.cookie = `${name}=${value}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax`;
};

const clearCookie = (name: string) => {
    if (typeof document === "undefined") return;
    document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
};

const setStorageToken = (name: "accessToken" | "refreshToken", value?: string) => {
    if (typeof window === "undefined") return;
    try {
        if (value) window.localStorage.setItem(name, value);
        else window.localStorage.removeItem(name);
    } catch {
        // ignore storage errors
    }
};

const setAuthCookies = (accessToken?: string, refreshToken?: string) => {
    if (accessToken) setCookie("accessToken", accessToken, 60 * 60 * 24);
    if (refreshToken) setCookie("refreshToken", refreshToken, 60 * 60 * 24 * 7);
    setStorageToken("accessToken", accessToken);
    setStorageToken("refreshToken", refreshToken);
};

export const authService = {
    login:async(data:{email:string,password:string})=>{
        const res = await api.post("/auth/login", data);
        const payload = res.data?.data ?? res.data;
        setAuthCookies(payload?.accessToken, payload?.refreshToken);
        return payload?.user ?? payload;
    },
    register:async(data:{username:string,email:string,password:string,role:"ADMIN" | "TEACHER" | "STUDENT"})=>{
        const res = await api.post("/auth/register", {
            name: data.username,
            email: data.email,
            password: data.password,
            role: data.role,
        });
        const payload = res.data?.data ?? res.data;
        return payload;
    },
    refresh:async(refreshToken: string)=>{
        const res = await api.post("/auth/refresh-token", { refreshToken });
        const payload = res.data?.data ?? res.data;
        setAuthCookies(payload?.accessToken, payload?.refreshToken);
        return payload;
    },
    logout:async()=>{
        await api.post("/auth/logout");
        setStorageToken("accessToken");
        setStorageToken("refreshToken");
        clearCookie("accessToken");
        clearCookie("refreshToken");
    },
    getme:async()=>{
        const res = await api.get("/auth/me");
        return res.data?.data ?? res.data;
    }
}