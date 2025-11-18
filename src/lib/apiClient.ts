// src/lib/apiClient.ts
import axios, {
  AxiosError,
  AxiosHeaders,
  InternalAxiosRequestConfig,
  AxiosRequestConfig,
} from "axios";
import { getCookie, setCookie as _setCookie, deleteCookie as _deleteCookie } from "./cookie";

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL!;               // ⬅ ex) https://kingbus.onrender.com/api/v1
const ACCESS  = process.env.AUTH_COOKIE   ?? "access_token";
const REFRESH = process.env.REFRESH_COOKIE ?? "refresh_token";

type RefreshResponse = { access?: string; access_token?: string };

// --- (1) Axios 타입 보강: 커스텀 옵션을 타입에 추가 ------------------------
declare module "axios" {
  interface InternalAxiosRequestConfig<D = any> {
    _retry?: boolean;
    skipAuthRedirect?: boolean; // 리다이렉트 제어용(헤더 아님)
  }
  interface AxiosRequestConfig<D = any> {
    skipAuthRedirect?: boolean;
  }
}

// --- (2) 쿠키 helper: 기존 setCookie 시그니처(days: number)만 있는 경우 래퍼 ----
function setCookie(name: string, value: string, days = 1) {
  // 프로젝트의 cookie.ts가 (name, value, days?) 시그니처라면 이 래퍼를 사용
  _setCookie(name, value, days as any);
}
function deleteCookie(name: string) {
  _deleteCookie(name as any);
}

// --- (3) 인스턴스 생성 -------------------------------------------------------
export const api = axios.create({ baseURL: BASE, withCredentials: true });

// --- (4) 개발용 로그 인터셉터 (항상 활성화: 안 보이면 파일이 안 불렸거나 다른 에러) ---
api.interceptors.request.use((config) => {
  try {
    const url = `${config.baseURL ?? ""}${config.url ?? ""}`;
    const h = config.headers as any;
    const auth = h?.Authorization ? String(h.Authorization).slice(0, 25) + "…" : "(none)";
    // ↓↓↓ 이 로그가 '브라우저 콘솔'에 반드시 보여야 합니다 ↓↓↓
    console.debug("[REQ]", config.method?.toUpperCase(), url, {
      withCredentials: config.withCredentials,
      Authorization: auth,
      params: config.params,
    });
  } catch {}
  return config;
});
api.interceptors.response.use(
  (res) => {
    try {
      console.debug("[RES]", res.status, res.config?.url, res.headers?.["content-type"]);
    } catch {}
    return res;
  },
  (err) => {
    try {
      const s = err.response?.status;
      const ct = err.response?.headers?.["content-type"];
      const url = err.config?.url;
      // ↓↓↓ 에러도 반드시 브라우저 콘솔에 찍혀야 합니다 ↓↓↓
      console.error("[ERR]", s, url, ct, err.response?.data?.detail ?? err.message);
    } catch {}
    return Promise.reject(err);
  }
);

// --- (5) 유틸 ---------------------------------------------------------------
function ensureAxiosHeaders(h: any) {
  return h instanceof AxiosHeaders ? h : new AxiosHeaders(h);
}
function isAuthPath(urlLike?: string) {
  if (!urlLike) return false;
  const url = String(urlLike);
  return /\/auth\/login\/?$/i.test(url)
      || /\/auth\/refresh\/?$/i.test(url)
      || /\/auth\/token\/refresh\/?$/i.test(url);
}

// --- (6) Request: Authorization 자동 주입 (auth 경로 제외) ---------------------
api.interceptors.request.use((config) => {
  config.headers = ensureAxiosHeaders(config.headers);
  if (!isAuthPath(config.url)) {
    const t = getCookie(ACCESS);
    if (t) (config.headers as AxiosHeaders).set("Authorization", `Bearer ${t}`);
  }
  return config;
});

// --- (7) 토큰 리프레시 -------------------------------------------------------
async function refreshToken(): Promise<string | null> {
  try {
    const r = getCookie(REFRESH);
    if (!r) return null;
    const { data } = await axios.post<RefreshResponse>(
      `${BASE}/auth/refresh/`,
      { refresh: r },
      { withCredentials: true }
    );
    const newAccess = data.access ?? data.access_token ?? null;
    if (newAccess) {
      setCookie(ACCESS, newAccess, 1); // days=1
      return newAccess;
    }
    return null;
  } catch (e) {
    return null;
  }
}

// --- (8) Response: 401 → refresh → 재시도 (auth 경로 제외) ---------------------
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const original = error.config as InternalAxiosRequestConfig | undefined;

    if (!original || status !== 401 || original._retry || isAuthPath(original.url)) {
      return Promise.reject(error);
    }
    original._retry = true;

    const t = await refreshToken();
    if (t) {
      original.headers = ensureAxiosHeaders(original.headers);
      (original.headers as AxiosHeaders).set("Authorization", `Bearer ${t}`);
      return api(original);
    }

    // refresh 실패 → 세션 정리 및 선택적 리다이렉트
    deleteCookie(ACCESS);
    deleteCookie(REFRESH);
    if (!original.skipAuthRedirect && typeof window !== "undefined") {
      const next = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/login?next=${next}`;
    }
    return Promise.reject(error);
  }
);
