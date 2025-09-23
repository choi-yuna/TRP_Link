"use client";

import Image from "next/image";
import Logo from "@/public/images/logo.png"; // public/images/logo.png
import { useLogout } from "@/src/features/auth/hooks/useAuth";

export default function Topbar() {
  const logout = useLogout();

  return (
    <header
      style={{
        width: "100%",
        height: 80, // 높이 80px
        background: "#FFFFFF",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between", // 좌측: 로고 / 우측: 로그아웃
        paddingLeft: 40, // Number/Padding/P10 가정
        paddingRight: 40,
        borderBottom: "1px solid #F2F4F6",
      }}
    >
      {/* 왼쪽 로고 */}
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <Image
          src={Logo}
          alt="TRP Link Logo"
          width={118}
          height={48}
          priority
          style={{ width: 118, height: 48, objectFit: "contain" }}
        />
      </div>

      {/* 오른쪽: 로그아웃 버튼 */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <button
          onClick={logout}
          style={{
            fontSize: 14,
            fontWeight: 500,
            padding: "6px 14px",
            borderRadius: 8,
            background: "#4A69E4",
            color: "#FFFFFF",
            border: "none",
            cursor: "pointer",
          }}
        >
          로그아웃
        </button>
      </div>
    </header>
  );
}
