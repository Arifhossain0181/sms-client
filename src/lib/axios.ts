/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1",
  withCredentials: true, // cookie auto 
});

const getCookie = (name: string) => {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? match[2] : null;
};

const setCookie = (name: string, value: string, maxAgeSeconds: number) => {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${value}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax`;
};

const getStorageToken = (key: "accessToken" | "refreshToken") => {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve();
  });
  failedQueue = [];
};

api.interceptors.request.use((config) => {
  const accessToken = getCookie("accessToken") ?? getStorageToken("accessToken");
  if (accessToken) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Response interceptor — 401 refresh 
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 401  retry 
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        //  request 
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => api(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = getCookie("refreshToken") ?? getStorageToken("refreshToken");
        if (!refreshToken) throw new Error("No refresh token");
        const refreshRes = await api.post("/auth/refresh-token", { refreshToken });
        const payload = refreshRes.data?.data ?? refreshRes.data;
        if (payload?.accessToken) setCookie("accessToken", payload.accessToken, 60 * 60 * 24);
        if (payload?.refreshToken) setCookie("refreshToken", payload.refreshToken, 60 * 60 * 24 * 7);
        processQueue(null);
        return api(originalRequest); // request 
      } catch {
        processQueue(new Error("Session expired"));
        window.location.href = "/login";
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;