// src/lib/cookie.ts
type SameSite = "Lax" | "Strict" | "None";

export function setCookie(
  name: string,
  value: string,
  opts: { days?: number; path?: string; sameSite?: SameSite; secure?: boolean; domain?: string } = {}
) {
  if (typeof document === "undefined") return;
  const { days = 1, path = "/", sameSite = "Lax", secure = false, domain } = opts;
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);

  let cookie = `${name}=${encodeURIComponent(value)}; expires=${d.toUTCString()}; path=${path}; SameSite=${sameSite}`;
  if (secure) cookie += "; Secure";
  if (domain) cookie += `; domain=${domain}`;
  document.cookie = cookie;
}

export function getCookie(name: string) {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]+)`));
  return m ? decodeURIComponent(m[1]) : null;
}

export function deleteCookie(
  name: string,
  opts: { path?: string; domain?: string; sameSite?: SameSite } = {}
) {
  if (typeof document === "undefined") return;
  const path = opts.path ?? "/";
  const domain = opts.domain;
  const sameSite = opts.sameSite ?? "Lax";
  let cookie = `${name}=; Max-Age=0; path=${path}; SameSite=${sameSite}`;
  if (domain) cookie += `; domain=${domain}`;
  document.cookie = cookie;
}
