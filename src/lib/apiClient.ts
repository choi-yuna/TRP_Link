import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { getCookie, setCookie, deleteCookie } from "./cookie";
const BASE = process.env.NEXT_PUBLIC_API_BASE_URL!;
const ACCESS = process.env.AUTH_COOKIE ?? "access_token";
const REFRESH = process.env.REFRESH_COOKIE ?? "refresh_token";
type RefreshResponse = { access?: string };

export const api = axios.create({ baseURL: BASE, withCredentials: true });

api.interceptors.request.use((config) => {
  const token = getCookie(ACCESS);
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let queue: Array<(token: string | null) => void> = [];
function onRefreshed(t: string | null){ queue.forEach(cb => cb(t)); queue=[]; }

async function refreshToken(): Promise<string | null> {
  try {
    const r = getCookie(REFRESH); if (!r) return null;
    const { data } = await axios.post<RefreshResponse>(`${BASE}/auth/refresh/`, { refresh: r }, { withCredentials: true });
    const newAccess = data.access ?? null;
    if (newAccess) { setCookie(ACCESS, newAccess, 1); return newAccess; }
    return null;
  } catch { return null; }
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };
    const s = error.response?.status;
    if (s === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push((t) => {
            if (!t) return reject(error);
            original.headers = original.headers ?? {};
            (original.headers as any).Authorization = `Bearer ${t}`;
            original._retry = true;
            resolve(api(original));
          });
        });
      }
      isRefreshing = true;
      const t = await refreshToken();
      isRefreshing = false;
      onRefreshed(t);
      if (t) {
        original.headers = original.headers ?? {};
        (original.headers as any).Authorization = `Bearer ${t}`;
        original._retry = true;
        return api(original);
      } else {
        deleteCookie(ACCESS); deleteCookie(REFRESH);
        if (typeof window !== "undefined") window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);
