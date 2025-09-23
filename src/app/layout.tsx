import "@/src/styles/globals.css";
import Providers from "./providers"; // ✅ default import로 간단히
// 또는 import Providers from "@/app/providers";

export const metadata = {
  title: "TRP Link",
  description: "운영사 지원 배차 시스템",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://spoqa.github.io/spoqa-han-sans/css/SpoqaHanSansNeo.css"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
