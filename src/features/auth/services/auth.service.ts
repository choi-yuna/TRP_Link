// src/features/auth/services/auth.service.ts
import { api } from "@/src/lib/apiClient";
import { setCookie, deleteCookie, getCookie } from "@/src/lib/cookie";

const ACCESS  = process.env.AUTH_COOKIE ?? "access_token";
const REFRESH = process.env.REFRESH_COOKIE ?? "refresh_token";
const ROLE    = process.env.USER_ROLE_COOKIE ?? "user_role";
const OP_PREFIX = process.env.NEXT_PUBLIC_OPERATOR_PREFIX ?? "/operator";

export async function loginApi(payload: { username: string; password: string }) {
  const res = await api.post(`${OP_PREFIX}/auth/login/`, payload, {
    withCredentials: true, // 헤더 추가 금지(CORS 유발)
  });

  const bag = res.data?.data ?? res.data ?? {};
  const access  = bag.access  || bag.access_token;
  const refresh = bag.refresh || bag.refresh_token;

  if (!access) throw new Error("로그인 응답에 access 토큰이 없습니다.");

  setCookie(ACCESS,  access,  { days: 1, path: "/", sameSite: "Lax" });
  if (refresh) setCookie(REFRESH, refresh, { days: 7, path: "/", sameSite: "Lax" });
  setCookie(ROLE, "operator", { days: 7, path: "/", sameSite: "Lax" });

  return bag.user ?? null;
}

export async function logoutApi() {
  try {} finally {
    deleteCookie(ACCESS,  { path: "/" });
    deleteCookie(REFRESH, { path: "/" });
    deleteCookie(ROLE,    { path: "/" });
  }
}

export async function meApi() {
  const token = getCookie(ACCESS);
  if (!token) throw new Error("Unauthorized");
  return { id: "self", name: "관리자", roles: ["ADMIN"] };
}
