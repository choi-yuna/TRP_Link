import Sidebar from "@/src/components/layout/Sidebar";
import Topbar from "@/src/components/layout/Topbar";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh" }}>
      {/* 맨 위 Topbar: 전체폭 */}
      <Topbar />

      {/* 아래쪽: 사이드바 + 컨텐츠 */}
      <div style={{ display: "flex", flex: 1 }}>
        <Sidebar />
        <main
          style={{
            flex: 1,
            background: "#f6f7f9",
            padding:24,
            overflow: "auto"
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}