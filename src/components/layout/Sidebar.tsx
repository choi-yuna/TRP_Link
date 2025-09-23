"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

const NAV_ITEMS = [
  {
    href: "/dashboard",
    label: "대시보드",
    iconDefault: "/images/dashboard-default.png",
    iconActive: "/images/dashboard-active.png",
  },
  {
    href: "/transport",
    label: "운수사관리",
    iconDefault: "/images/transport-default.png",
    iconActive: "/images/transport-active.png",
  },
  {
    href: "/support",
    label: "지원관리",
    iconDefault: "/images/support-default.png",
    iconActive: "/images/support-active.png",
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: 116,
        height: 1014,
        background: "#FFFFFF",
        borderTop: "1px solid #F2F4F6",
        borderRight: "1px solid #F2F4F6",
        paddingTop: 20,    // G10 가정값
        paddingBottom: 24, // G12 가정값
        paddingLeft: 16,   // P8
        paddingRight: 16,  // P8
      }}
      className="flex flex-col items-center gap-10 mt-2"
    >
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center gap-2 w-full py-3 rounded-md`}
          >
            <Image
              src={active ? item.iconActive : item.iconDefault}
              alt={item.label}
              width={24}
              height={24}
            />
            <span
              style={{
                fontFamily: "Spoqa Han Sans Neo, sans-serif",
                fontSize: 12,
                lineHeight: "16px",
                letterSpacing: "0%",
                textAlign: "center",
                fontWeight: active ? 500 : 400,
                color: active ? "#4A69E4" : "#111827",
              }}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </aside>
  );
}
