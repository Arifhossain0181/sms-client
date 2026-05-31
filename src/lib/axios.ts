/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";

const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

const api = axios.create({
  baseURL,
  withCredentials: true, // cookie auto 
});

const refreshClient = axios.create({
  baseURL,
  withCredentials: true,
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

const setStorageToken = (name: "accessToken" | "refreshToken", value?: string) => {
  if (typeof window === "undefined") return;
  try {
    if (value) window.localStorage.setItem(name, value);
    else window.localStorage.removeItem(name);
  } catch {
    // ignore storage errors
  }
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
let hasRedirectedToLogin = false;

const processQueue = (error: any) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve();
  });
  failedQueue = [];
};

const clearAuthState = () => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem("auth-user");
  } catch {
    // ignore storage errors
  }
};

const redirectToLogin = () => {
  if (typeof window === "undefined") return;
  if (hasRedirectedToLogin) return;
  if (window.location.pathname === "/login") return;
  hasRedirectedToLogin = true;
  window.location.href = "/login";
};

api.interceptors.request.use((config) => {
  const accessToken = getCookie("accessToken") ?? getStorageToken("accessToken");
  if (accessToken) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Log all errors for debugging
    if (!error.response) {
      console.error(
        `[Network Error] ${error.message} - URL: ${error.config?.url || 'unknown'}`
      );
    }

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
        const refreshRes = await refreshClient.post("/auth/refresh-token", { refreshToken });
        const payload = refreshRes.data?.data ?? refreshRes.data;
        if (payload?.accessToken) {
          setCookie("accessToken", payload.accessToken, 60 * 60 * 24);
          setStorageToken("accessToken", payload.accessToken);
        }
        if (payload?.refreshToken) {
          setCookie("refreshToken", payload.refreshToken, 60 * 60 * 24 * 7);
          setStorageToken("refreshToken", payload.refreshToken);
        }
        processQueue(null);
        return api(originalRequest); // request 
      } catch {
        processQueue(new Error("Session expired"));
        setStorageToken("accessToken");
        setStorageToken("refreshToken");
        clearAuthState();
        redirectToLogin();
        return Promise.reject(new Error("Session expired"));
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;