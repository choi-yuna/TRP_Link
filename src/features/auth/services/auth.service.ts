import { api } from "@/src/lib/apiClient";
import { setCookie, deleteCookie, getCookie } from "@/src/lib/cookie";

const ACCESS  = process.env.AUTH_COOKIE ?? "access_token";
const REFRESH = process.env.REFRESH_COOKIE ?? "refresh_token";
const ROLE    = process.env.USER_ROLE_COOKIE ?? "user_role";

export async function loginApi(payload: { username: string; password: string }) {
  const { data } = await api.post("/operator/auth/login/", {
    username: payload.username,
    password: payload.password,
  });

  const access  = data.access  || data.access_token;
  const refresh = data.refresh || data.refresh_token;
  if (access)  setCookie(ACCESS, access, 1);
  if (refresh) setCookie(REFRESH, refresh, 7);
  setCookie(ROLE, "operator", 7);

  return data;
}

export async function logoutApi() {
  try {
    // 서버 엔드포인트 별도 없으면 쿠키 삭제만
  } finally {
    deleteCookie(ACCESS);
    deleteCookie(REFRESH);
    deleteCookie(ROLE);
  }
}

export async function meApi() {
  const token = getCookie(ACCESS);
  if (!token) throw new Error("Unauthorized");
  return { id: "self", name: "관리자", roles: ["ADMIN"] };
}
