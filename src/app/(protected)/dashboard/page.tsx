"use client";

import React, { useEffect, useMemo, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { api } from "@/src/lib/apiClient";
import { getCookie } from "@/src/lib/cookie";

const ACCESS = (process.env.AUTH_COOKIE as string) ?? "access_token";

// ==============================
// Types
// ==============================
interface DashboardStats {
  total_reservations: number;
  pending_reservations: number;
  quoted_reservations: number;
  confirmed_reservations: number;
  pending_applications: number;
}

interface ReservationListItem {
  id: number;
  reservation_type?: "special_support" | "general_support";
  reservation_type_display: string;
  customer_name: string;
  customer_phone: string;
  departure_location: string;
  arrival_location: string;
  departure_date: string;
  departure_time?: string;
  estimated_price?: number;
  final_price?: number;
  status?: string;
  status_display: string;
  assigned_transport_name?: string;
  bus_count?: number;
  created_at?: string;
}

interface ReservationListResponse {
  count: number;
  results: ReservationListItem[];
  next?: string | null;
  previous?: string | null;
}

// ==============================
// Utils
// ==============================
const currency = (v?: number) =>
  typeof v === "number" ? v.toLocaleString() + "원" : "-";

const cx = (...xs: (string | false | null | undefined)[]) =>
  xs.filter(Boolean).join(" ");

const RECENT_KEY = "recentReservations";
function pushRecent(item: ReservationListItem) {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const arr: ReservationListItem[] = raw ? JSON.parse(raw) : [];
    const next = [item, ...arr.filter((x) => x.id !== item.id)].slice(0, 20);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {}
}
function getRecent(): ReservationListItem[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// ==============================
// Page
// ==============================
export default function DashboardPage() {
  // --- Auth gate: 쿠키 확인되기 전에는 어떤 API도 호출하지 않음
  const [ready, setReady] = useState(false);
  const [hasToken, setHasToken] = useState<boolean>(false);

  useEffect(() => {
    const t = getCookie(ACCESS);
    setHasToken(!!t);
    setReady(true);
  }, []);

  // 검색/필터
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "special" | "general">("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // 데이터 상태
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [list, setList] = useState<ReservationListItem[]>([]);
  const [count, setCount] = useState<number>(0);

  // 로딩/에러 분리
  const [loadingStats, setLoadingStats] = useState<boolean>(true);
  const [loadingList, setLoadingList] = useState<boolean>(true);
  const [errorStats, setErrorStats] = useState<string | null>(null);
  const [errorList, setErrorList] = useState<string | null>(null);

  // 최근 본 예약
  const [recent, setRecent] = useState<ReservationListItem[]>(getRecent());

  // -------------------------------------------
  // 통계 + 완료건수
  // -------------------------------------------
  useEffect(() => {
    if (!ready || !hasToken) return; // 토큰 확인 전/없으면 호출 금지
    let aborted = false;
    (async () => {
      setLoadingStats(true);
      setErrorStats(null);
      try {
        const [sRes, cRes] = await Promise.all([
          api.get<{ success: boolean; data: DashboardStats }>("/operator/dashboard/stats/", {
            skipAuthRedirect: true,
          }),
          api.get<ReservationListResponse>("/operator/reservations/", {
            params: { status: "completed", page_size: 1 },
            skipAuthRedirect: true,
          }),
        ]);

        if (aborted) return;
        setStats(sRes.data.data);
        setCompletedCount(cRes.data?.count || 0);
      } catch (e: any) {
        if (aborted) return;
        const status = e?.response?.status;
        setErrorStats(status ? `통계 조회 실패 (${status})` : "통계 조회 실패");
        console.error("[stats] fetch failed", e);
      } finally {
        if (!aborted) setLoadingStats(false);
      }
    })();
    return () => {
      aborted = true;
    };
  }, [ready, hasToken]);

  // -------------------------------------------
  // 예약 목록
  // -------------------------------------------
  useEffect(() => {
    if (!ready || !hasToken) return;
    let aborted = false;
    (async () => {
      setLoadingList(true);
      setErrorList(null);
      try {
        const params: Record<string, any> = {
          search: search || undefined,
          page_size: 50,
        };
        if (activeTab === "special") params.reservation_type = "special_support";
        if (activeTab === "general") params.reservation_type = "general_support";
        if (statusFilter !== "all") params.status = statusFilter;

        const { data } = await api.get<ReservationListResponse>(
          "/operator/reservations/",
          { params, skipAuthRedirect: true }
        );
        if (aborted) return;
        setList(data.results);
        setCount(data.count);
      } catch (e: any) {
        if (aborted) return;
        const status = e?.response?.status;
        setErrorList(status ? `목록 조회 실패 (${status})` : "목록 조회 실패");
        console.error("[list] fetch failed", e);
      } finally {
        if (!aborted) setLoadingList(false);
      }
    })();
    return () => {
      aborted = true;
    };
  }, [ready, hasToken, search, activeTab, statusFilter]);

  // 상단 카드
  const cards = useMemo(() => {
    const total = stats?.total_reservations ?? 0;
    const confirmed = stats?.confirmed_reservations ?? 0;
    const pending = stats?.pending_reservations ?? 0;
    const completed = completedCount;
    return [
      { label: "전체 예약", value: total },
      { label: "확정 예약", value: confirmed },
      { label: "대기중 예약", value: pending },
      { label: "완료된 예약", value: completed },
    ];
  }, [stats, completedCount]);

  // 분포(일반/특수)
  const { generalCount, specialCount } = useMemo(() => {
    let g = 0, s = 0;
    list.forEach((r) => {
      if (r.reservation_type === "general_support") g += 1;
      else if (r.reservation_type === "special_support") s += 1;
      else {
        if (r.reservation_type_display?.includes("일반")) g += 1;
        else if (r.reservation_type_display?.includes("특수")) s += 1;
      }
    });
    return { generalCount: g, specialCount: s };
  }, [list]);

  const distributionData = useMemo(
    () => [
      { name: "일반 배차", value: generalCount },
      { name: "특수 배차", value: specialCount },
    ],
    [generalCount, specialCount]
  );

  const statusOptions = [
    { label: "전체", value: "all" },
    { label: "대기중", value: "pending" },
    { label: "확정", value: "confirmed" },
    { label: "완료", value: "completed" },
  ];

  // 신규 예약
  const [openCreate, setOpenCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    departure_location: "",
    arrival_location: "",
    departure_date: "",
    departure_time: "09:00",
    passenger_count: 45,
    bus_count: 1,
    trip_type: "one_way", // enum 가정
    customer_name: "",
    customer_phone: "",
    reservation_type: "general_support",
  } as any);

  const createReservation = async () => {
    setCreating(true);
    try {
      await api.post("/operator/reservations/", form, { skipAuthRedirect: true });
      setOpenCreate(false);
      setForm({
        departure_location: "",
        arrival_location: "",
        departure_date: "",
        departure_time: "09:00",
        passenger_count: 45,
        bus_count: 1,
        trip_type: "one_way",
        customer_name: "",
        customer_phone: "",
        reservation_type: "general_support",
      });
      // 새로고침
      const { data } = await api.get<ReservationListResponse>(
        "/operator/reservations/",
        { params: { page_size: 50 }, skipAuthRedirect: true }
      );
      setList(data.results);
      setCount(data.count);
    } catch (e: any) {
      const status = e?.response?.status;
      console.error("[create] failed", e);
      alert(status ? `예약 생성 실패 (${status})` : "예약 생성 실패");
    } finally {
      setCreating(false);
    }
  };

 // 상단 카드
const StatsView = (
  <div
    className="
      flex flex-row items-start
      w-[1305px] h-[126px]
      border border-[#E5E8EB] rounded-[12px]
      overflow-hidden bg-white
    "
  >
    {(loadingStats ? Array.from({ length: 4 }) : cards).map((c: any, i) => (
      <div
        key={i}
        className="
          flex flex-col justify-center items-center
          flex-1 h-full
          border-r border-[#F2F4F6] last:border-r-0
        "
      >
        {loadingStats ? (
          <>
            <div className="h-8 w-16 rounded bg-gray-100" />
            <div className="mt-2 h-4 w-20 rounded bg-gray-100" />
          </>
        ) : (
          <>
            <div className="text-[32px] leading-none font-semibold text-[#101318]">
              {c.value}
            </div>
            <div className="mt-2 text-[16px] text-[#6B7684]">{c.label}</div>
          </>
        )}
      </div>
    ))}
  </div>
);


  // =========================
  // 렌더
  // =========================
  if (!ready) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-gray-400">
        초기화 중...
      </div>
    );
  }

  if (ready && !hasToken) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
          <div className="text-lg font-semibold">로그인이 필요합니다</div>
          <div className="text-gray-500 text-sm mt-2">
            로그인 후 다시 시도해 주세요.
          </div>
          <a
            href="/login?next=/dashboard"
            className="inline-flex mt-4 h-10 items-center px-4 rounded-lg bg-gray-900 text-white text-sm"
          >
            로그인 페이지로 이동
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">예약 관리</h1>
        <div className="flex items-center border border-gray-200 bg-white rounded-xl px-4 py-2 w-[440px]">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.9 14.32a8 8 0 111.414-1.414l3.387 3.387a1 1 0 01-1.414 1.414l-3.387-3.387zM14 8a6 6 0 11-12 0 6 6 0 0112 0z" clipRule="evenodd" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            type="text"
            placeholder="예약 정보를 검색해 보세요"
            className="ml-2 w-full text-sm placeholder:text-gray-400 focus:outline-none"
          />
        </div>
      </div>

      {/* 본문: 좌(카드+테이블) / 우(분포+버튼+최근) */}
      <div className="grid grid-cols-[1fr_360px] gap-6 items-start">
        {/* 좌영역 */}
        <div className="space-y-6">
          {/* 통계 */}
          {errorStats ? (
            <div className="bg-white border border-red-200 text-red-600 rounded-2xl p-4">
              {errorStats}
            </div>
          ) : (
            StatsView
          )}

          {/* 테이블 */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-0 py-0 h-[38px]">
          <div className="flex flex-row items-center gap-[12px] w-[432px] h-[38px]">
  {[
    { key: "all", label: "전체", count },
    { key: "special", label: "특수 배차", count: specialCount },
    { key: "general", label: "일반 배차", count: generalCount },
  ].map((t) => {
    const active = activeTab === t.key;
    return (
      <button
        key={t.key}
        onClick={() => setActiveTab(t.key as any)}
        className={cx(
          // Tab 컨테이너 스펙
          "relative flex flex-row justify-center items-center",
          "w-[136px] h-[38px] gap-[4px] pb-[12px] isolate",
          active ? "text-[#101318]" : "text-[#D1D6DB]"
        )}
      >
        <span className="text-[18px] leading-[26px] font-medium tracking-[-0.018em]">
          {t.label}
        </span>
        <span
          className={cx(
            "text-[18px] leading-[26px] font-normal tracking-[-0.018em]",
            active ? "text-[#4A69E4]" : "text-[#D1D6DB]"
          )}
        >
          {t.count}
        </span>
        {active && (
          <span className="absolute left-0 right-0 bottom-0 h-[4px] bg-[#4A69E4]" />
        )}
      </button>
    );
  })}
</div>

            </div>

            <div className="overflow-auto">
              <table className="w-full text-sm">
              <thead>
  <tr className="h-[48px]">
    {[
      { w: "w-[60px]",  align: "text-center", label: "번호",  radius: "rounded-tl-[10px]" },
      { w: "w-[100px]", align: "text-center", label: "배차유형" },
      { w: "w-[100px]", align: "text-center",   label: "고객" },
      { w: "w-[160px]", align: "text-center",   label: "전화번호" },
      { w: "w-[120px]", align: "text-center", label: "일정" },
      { w: "w-[140px]", align: "text-center",  label: "견적" },
      { w: "w-[200px]", align: "text-center",   label: "운행 정보" },
      { w: "w-[120px]", align: "text-center", label: "상태" },
      { w: "w-[165px]", align: "text-center",   label: "배정운수사", grow: true },
      { w: "w-[140px]", align: "text-center", label: "버스", radius: "rounded-tr-[10px]" },
    ].map((h, i) => (
      <th
        key={i}
        className={cx(
          "bg-[#FAFAFA] border-b border-[#F2F4F6] px-4",
          h.w,
          h.align,
          h.radius || "",
          "text-[12px] leading-[16px] font-normal text-[#6B7684]"
        )}
      >
        {h.label}
      </th>
    ))}
  </tr>
</thead>

                <tbody>
                  {loadingList && (
                    <tr>
                      <td colSpan={10} className="text-center py-10 text-gray-400">불러오는 중...</td>
                    </tr>
                  )}

                  {!loadingList && errorList && (
                    <tr>
                      <td colSpan={10} className="text-center py-10 text-red-500">{errorList}</td>
                    </tr>
                  )}

                  {!loadingList && !errorList && list.length === 0 && (
                    <tr>
                      <td colSpan={10} className="text-center py-10 text-gray-400">데이터가 없습니다.</td>
                    </tr>
                  )}

                  {!loadingList && !errorList && list.map((r, idx) => (
                     <tr
                     key={r.id}
                     className="border-t hover:bg-gray-50 cursor-pointer text-center"
                     onClick={() => { pushRecent(r); setRecent(getRecent()); }}
                   >
                     <td className="py-3 px-4">{idx + 1}</td>
                     <td className="py-3 px-4">
                       <span
                         className={cx(
                           "flex justify-center items-center gap-[4px] px-[8px] py-[2px] w-[60px] h-[18px] rounded-full text-[11px] font-medium",
                           (r.reservation_type_display?.includes("특수") ||
                             r.reservation_type_display?.includes("특수 지원"))
                             ? "bg-[#EEF1FF] text-[#4A69E4]"
                             : "bg-[#E8F6ED] text-[#1CA04B]"
                         )}
                       >
                         {r.reservation_type_display}
                       </span>
                     </td>


<td className="border-b border-[#F2F4F6] px-4 py-[14px] w-[100px] text-center align-middle text-[#101318]">{r.customer_name}</td>

<td className="border-b border-[#F2F4F6] px-4 py-[14px] w-[160px] text-center align-middle text-[#101318]">{r.customer_phone}</td>

<td className="border-b border-[#F2F4F6] px-4 py-[14px] w-[120px] text-center align-middle text-[#101318]">
  {r.departure_date}
</td>

<td className="border-b border-[#F2F4F6] px-4 py-[14px] w-[140px] text-center align-middle text-[#101318]">
  {currency(r.estimated_price)}
</td>

<td className="border-b border-[#F2F4F6] px-4 py-[14px] w-[200px] text-center align-middle">
  <div className="flex flex-row items-center justify-between gap-[4px]">
    <span className="text-[14px] text-[#333D4B]">{r.departure_location}</span>
    <span className="text-[#1CA04B]">→</span>
    <span className="text-[14px] text-[#333D4B] text-right">{r.arrival_location}</span>
  </div>
</td>

<td className="border-b border-[#F2F4F6] px-4 py-[14px] w-[120px] text-center align-middle text-[#101318]">
  {r.status_display}
</td>

<td className="border-b border-[#F2F4F6] px-4 py-[14px] w-[165px] text-center align-middle text-[#101318]">
  {r.assigned_transport_name || "-"}
</td>

<td className="border-b border-[#F2F4F6] px-4 py-[14px] w-[140px] text-center align-middle text-[#101318]">
  {r.bus_count ? `${r.bus_count}대` : "-"}
</td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 우영역 */}
        <div className="space-y-4">
          {/* 배차 분포 */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="font-semibold mb-2">배차 분포</div>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={[{ value: 100 }]} dataKey="value" cx="50%" cy="50%" outerRadius={90} innerRadius={65}>
                    <Cell fill="#E5E7EB" />
                  </Pie>
                  <Pie
                    data={distributionData}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={65}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <Cell fill="#3B82F6" />
                    <Cell fill="#111827" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="-mt-24 text-center pointer-events-none select-none">
              <div className="text-sm text-gray-400">전체</div>
              <div className="text-2xl font-semibold">100%</div>
            </div>
            <div className="flex justify-center gap-6 mt-16 text-xs text-gray-600">
              <div className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-gray-300" /> 전체</div>
              <div className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full" style={{ background: "#3B82F6" }} /> 일반 배차</div>
              <div className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full" style={{ background: "#111827" }} /> 특수 배차</div>
            </div>
          </div>

          {/* 새 예약 등록 */}
          <button
          onClick={() => setOpenCreate(true)}
          className="
            flex justify-center items-center gap-[4px]
            w-[387px] h-[52px]
            bg-[#323542] text-white rounded-[12px]
            font-semibold
          "
        >
          + 새 예약 등록
        </button>



          {/* 최근 본 예약 */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold">최근 본 예약</div>
              <button className="text-sm text-gray-400 hover:text-gray-600" onClick={() => setRecent(getRecent())}>
                전체보기 &gt;
              </button>
            </div>
            <div className="space-y-3 max-h=[420px] overflow-auto pr-1">
              {recent.length === 0 && <div className="text-sm text-gray-400">최근 본 예약이 없습니다.</div>}
              {recent.map((r) => (
               <div key={r.id} className="box-border flex flex-col items-start p-[20px] gap-[12px] w-[387px] h-[122px] bg-white border-b border-[#F2F4F6] rounded-[12px]">
               <div className="flex flex-col justify-center items-start gap-[4px]">
                 <span className="inline-flex justify-center items-center px-[8px] py-[2px] h-[18px] rounded-full bg-[#EEF1FF] text-[#4A69E4] text-[11px]">
                   {r.reservation_type_display}
                 </span>
             
                 <div className="flex flex-row items-center gap-[12px] h-[24px]">
                   <span className="text-[16px] font-bold text-[#333D4B]">{r.departure_location}</span>
                   <span className="text-[#1CA04B]">→</span>
                   <span className="text-[16px] font-bold text-[#333D4B]">{r.arrival_location}</span>
                 </div>
               </div>
             
               <div className="flex flex-row items-center gap-[12px] w-[347px] h-[20px] text-[14px]">
                 <span className="text-[#101318]">{r.customer_name}</span>
                 <span className="text-[#6B7684]">|</span>
                 <span className="text-[#6B7684]">{currency(r.estimated_price)}</span>
                 <span className="text-[#6B7684]">|</span>
                 <span className="text-[#6B7684]">{r.departure_date}</span>
                 <span className="text-[#6B7684]">|</span>
                 <span className="text-[#6B7684]">{r.assigned_transport_name || "-"}</span>
               </div>
             </div>
             
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* 신규 예약 생성 모달 */}
      {openCreate && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="w-[640px] bg-white rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="text-lg font-semibold">새 예약 등록</div>
              <button onClick={() => setOpenCreate(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="col-span-1">
                <div className="text-gray-500 mb-1">출발지</div>
                <input className="w-full h-10 rounded-lg border px-3" value={form.departure_location} onChange={(e) => setForm((f: any) => ({ ...f, departure_location: e.target.value }))} />
              </div>
              <div className="col-span-1">
                <div className="text-gray-500 mb-1">도착지</div>
                <input className="w-full h-10 rounded-lg border px-3" value={form.arrival_location} onChange={(e) => setForm((f: any) => ({ ...f, arrival_location: e.target.value }))} />
              </div>
              <div>
                <div className="text-gray-500 mb-1">출발날짜</div>
                <input type="date" className="w-full h-10 rounded-lg border px-3" value={form.departure_date} onChange={(e) => setForm((f: any) => ({ ...f, departure_date: e.target.value }))} />
              </div>
              <div>
                <div className="text-gray-500 mb-1">출발시간</div>
                <input type="time" className="w-full h-10 rounded-lg border px-3" value={form.departure_time} onChange={(e) => setForm((f: any) => ({ ...f, departure_time: e.target.value }))} />
              </div>
              <div>
                <div className="text-gray-500 mb-1">원하는 인승</div>
                <input type="number" className="w-full h-10 rounded-lg border px-3" value={form.passenger_count} onChange={(e) => setForm((f: any) => ({ ...f, passenger_count: Number(e.target.value || 0) }))} />
              </div>
              <div>
                <div className="text-gray-500 mb-1">대수</div>
                <input type="number" className="w-full h-10 rounded-lg border px-3" value={form.bus_count} onChange={(e) => setForm((f: any) => ({ ...f, bus_count: Number(e.target.value || 0) }))} />
              </div>
              <div>
                <div className="text-gray-500 mb-1">고객명</div>
                <input className="w-full h-10 rounded-lg border px-3" value={form.customer_name} onChange={(e) => setForm((f: any) => ({ ...f, customer_name: e.target.value }))} />
              </div>
              <div>
                <div className="text-gray-500 mb-1">연락처</div>
                <input className="w-full h-10 rounded-lg border px-3" value={form.customer_phone} onChange={(e) => setForm((f: any) => ({ ...f, customer_phone: e.target.value }))} />
              </div>
              <div>
                <div className="text-gray-500 mb-1">배차 타입</div>
                <select className="w-full h-10 rounded-lg border px-3" value={form.reservation_type} onChange={(e) => setForm((f: any) => ({ ...f, reservation_type: e.target.value }))}>
                  <option value="general_support">일반 배차</option>
                  <option value="special_support">특수 배차</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setOpenCreate(false)} className="h-10 px-4 rounded-lg border bg-white">취소</button>
              <button onClick={createReservation} disabled={creating} className="h-10 px-4 rounded-lg bg-gray-900 text-white">
                {creating ? "생성 중..." : "등록"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
