"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useLogin } from "@/src/features/auth/hooks/useAuth";
import Logo from "@/public/images/logo.png";
import EyeOpen from "@/public/images/eye-open.png";
import EyeClosed from "@/public/images/eye-closed.png";

export default function LoginPage() {
  const { mutate: login, isPending, error } = useLogin();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [keep, setKeep] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const onSubmit = () => {
    if (!username.trim() || !password.trim()) return;
    login({ username: username.trim(), password: password.trim() });
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-5">
      {/* 상단 로고 */}
      
      <div className="w-[532px] flex flex-col gap-5">
    {/* 상단 로고 */}
    <div className="mb-8"> 
      <Image
        src={Logo}
        alt="LOGO"
        width={192}
        height={60}
        priority
        style={{ width: 192, height: 60, objectFit: "contain" }}
      />
    </div>

    {/* 안내 문구 */}
    <div
      className="text-gray-600 mb-6"
      style={{ fontSize: 12, lineHeight: "16px" }}
    >
      아이디와 비밀번호를 입력해 주세요
    </div>



      {/* 흰색 로그인 카드 */}
      <div
        className="bg-white border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.08)]"
        style={{
          width: 532,
          height: 318,
          paddingTop: 34,     
          paddingBottom: 34,  
          paddingLeft: 30,    
          paddingRight: 30,   
          borderRadius: 16,   
          display: "flex",
          flexDirection: "column",
          gap: 40,            
        }}
      >
        {/* 타이틀 */}
        <div
          className="font-bold"
          style={{ fontSize: 18, lineHeight: "18px" }}
        >
          로그인
        </div>

        {/* 입력 영역 */}
        <div className="flex-1 flex flex-col gap-7">
          {/* 아이디 입력 */}
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="아이디를 입력해 주세요"
            className="outline-none placeholder:text-gray-400"
            style={{
              width: 468,
              height: 52,
              border: "1px solid #E5E7EB", 
              borderRadius: 12,
              padding: "0 14px",
              fontSize: 16,
              lineHeight: "16px",
            }}
          />

          {/* 비밀번호 입력 + 표시/숨김 아이콘(20×20) */}
          <div className="relative" style={{ width: 468, height: 52 }}>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={showPw ? "text" : "password"}
              placeholder="비밀번호를 입력해 주세요"
              className="w-full h-full outline-none placeholder:text-gray-400"
              style={{
                border: "1px solid #E5E7EB",
                borderRadius: 12,
                padding: "0 40px 0 14px", // 오른쪽 아이콘 공간
                fontSize: 16,
                lineHeight: "16px",
              }}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              aria-label="toggle-password"
              className="absolute"
              style={{
                top: "50%",
                right: 12,
                transform: "translateY(-50%)",
                width: 20,
                height: 20,
                display: "grid",
                placeItems: "center",
              }}
            >
              <Image
                src={showPw ? EyeClosed : EyeOpen}
                alt={showPw ? "숨김" : "표시"}
                width={20}
                height={20}
                style={{ width: 20, height: 20 }}
              />
            </button>
          </div>
        </div>

        {/* 하단: 로그인 유지 + 링크(비밀번호 찾기 색상 #4A69E4) */}
        <div
          className="flex items-center justify-between"
          style={{ marginTop: -8 }}
        >
          <label className="inline-flex items-center gap-2 select-none">
            <input
              type="checkbox"
              checked={keep}
              onChange={() => setKeep((v) => !v)}
              style={{ width: 14, height: 14 }}
            />
            <span
              style={{
                fontSize: 12,
                lineHeight: "16px",
                letterSpacing: 0,
                verticalAlign: "middle",
              }}
            >
              로그인 유지
            </span>
          </label>

          <div className="flex items-center gap-2">
            <a
              href="#"
              style={{
                color: "#4A69E4",                     
                fontSize: 12,
                lineHeight: "16px",
                letterSpacing: 0,
                textAlign: "center",
                verticalAlign: "middle",
              }}
            >
              비밀번호 찾기
            </a>
            <span className="text-gray-300">|</span>
            <a
              href="#"
              style={{
                color: "#111827",
                fontSize: 12,
                lineHeight: "16px",
                letterSpacing: 0,
                textAlign: "center",
                verticalAlign: "middle",
              }}
            >
              계정 등록 문의
            </a>
          </div>
        </div>

        {/* 에러 */}
        {error && (
          <div className="text-red-600" style={{ fontSize: 12, marginTop: -10 }}>
            로그인에 실패했습니다. 아이디/비밀번호를 확인하세요.
          </div>
        )}
      </div>

      {/* 하단 로그인 버튼 (#4A69E4, 532×52, 라운드 R5-52,64 ≈ 12px 가정) */}
      <div className="mt-14">
        <button
          onClick={onSubmit}
          disabled={isPending}
          className="text-white font-semibold"
          style={{
            width: 532,
            height: 52,
            padding: "0 16px",       // Number/Padding/P8 가정
            borderRadius: 12,        // R5-52,64 토큰 px 미상 → 12px 가정
            background: "#4A69E4",   // ✅ 요구 색상
            opacity: isPending ? 0.6 : 1,
            letterSpacing: 0,
            color : "white"
          }}
        >
          {isPending ? "로그인 중..." : "로그인"}
        </button>
      </div>
      </div>
    </div>
  );
}
