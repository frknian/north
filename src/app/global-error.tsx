"use client";
import { useEffect } from "react";
import { reportClientError } from "@/lib/report-error";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { reportClientError(error, { digest: error.digest, source: "global" }); }, [error]);
  return (
    <html lang="tr">
      <body style={{ margin: 0, minHeight: "100dvh", display: "grid", placeItems: "center", fontFamily: "system-ui, sans-serif", background: "#0a0b10", color: "#f4f5f9", padding: 24, textAlign: "center" }}>
        <div style={{ maxWidth: 360 }}>
          <h1 style={{ fontSize: 20, margin: "0 0 8px" }}>Planorth açılamadı</h1>
          <p style={{ color: "#959bb0", fontSize: 14, lineHeight: 1.6 }}>Beklenmeyen bir hata oluştu. Verilerin güvende; sayfayı yeniden yüklemeyi dene.</p>
          <button onClick={reset} style={{ marginTop: 16, padding: "10px 18px", borderRadius: 10, border: 0, background: "#8b8ff8", color: "#0d0e1a", fontWeight: 600, cursor: "pointer" }}>Tekrar dene</button>
        </div>
      </body>
    </html>
  );
}
