"use client";
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html>
      <body>
        <div className="p-6">
          <h2 className="font-bold text-red-600 mb-2">전역 오류</h2>
          <pre className="text-xs bg-gray-100 p-3 rounded">{error.message}</pre>
          <button onClick={() => reset()} className="mt-3 px-3 py-1 border rounded">다시 시도</button>
        </div>
      </body>
    </html>
  );
}
