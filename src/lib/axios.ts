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
  const cookieToken = getCookie("accessToken");
  const storageToken = getStorageToken("accessToken");
  const accessToken = cookieToken ?? storageToken;
  
  console.log(`[AXIOS-REQUEST] ${config.method?.toUpperCase()} ${config.url}`);
  console.log(`[AXIOS-REQUEST] Token sources:`, {
    cookie: cookieToken ? `Yes (${cookieToken.length} chars)` : "No",
    storage: storageToken ? `Yes (${storageToken.length} chars)` : "No",
    used: accessToken ? `Yes (${accessToken.length} chars)` : "No"
  });
  
  if (accessToken) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${accessToken}`;
    console.log(`[AXIOS-REQUEST]  Authorization header set: Bearer ${accessToken.substring(0, 20)}...`);
  } else {
    console.log(`[AXIOS-REQUEST] No access token found in cookie or localStorage`);
  }
  
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log(`[AXIOS-RESPONSE]  ${response.status} ${response.config.url}`);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    const isUnauthorized = error.response?.status === 401;

    // 401 retry path: keep the console quiet unless the refresh flow truly fails.
    if (isUnauthorized && !originalRequest._retry) {
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
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(new Error("Session expired"));
        setStorageToken("accessToken");
        setStorageToken("refreshToken");
        clearAuthState();
        console.warn("[AXIOS-RESPONSE] Session refresh failed; redirecting to login.", refreshError);
        redirectToLogin();
        return Promise.reject(new Error("Session expired"));
      } finally {
        isRefreshing = false;
      }
    }

    if (!isUnauthorized) {
      if (!error.response) {
        console.error(`[AXIOS-ERROR] Network Error - ${error.message} - URL: ${error.config?.url || "unknown"}`);
      } else {
        console.error(`[AXIOS-ERROR] ${error.response?.status} ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
        console.error(`[AXIOS-ERROR] Response:`, error.response?.data);
      }
    }

    return Promise.reject(error);
  }
);

export default api;