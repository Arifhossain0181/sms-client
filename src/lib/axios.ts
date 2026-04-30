/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true, // cookie auto যাবে
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve();
  });
  failedQueue = [];
};

// Response interceptor — 401 আসলে refresh করো
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 401 এবং retry হয়নি
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // অন্য request গুলো queue তে রাখো
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => api(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Refresh Token দিয়ে নতুন Access Token নাও
        await api.post("/auth/refresh");
        processQueue(null);
        return api(originalRequest); // আগের request আবার করো
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