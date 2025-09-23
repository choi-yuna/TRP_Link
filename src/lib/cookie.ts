// 클라이언트에서만 사용 (middleware/서버에서는 next/headers 사용)
export function setCookie(name: string, value: string, days = 1) {
    if (typeof document === "undefined") return;
    const d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${d.toUTCString()}; path=/; SameSite=Lax`;
  }
  export function getCookie(name: string) {
    if (typeof document === "undefined") return null;
    const m = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
    return m ? decodeURIComponent(m[2]) : null;
  }
  export function deleteCookie(name: string) {
    if (typeof document === "undefined") return;
    document.cookie = `${name}=; Max-Age=0; path=/;`;
  }
  