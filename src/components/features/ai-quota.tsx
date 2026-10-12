"use client";

import { useCallback, useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { authenticatedAiFetch } from "@/lib/ai/client";
import { getFirebase } from "@/lib/firebase/client";

type Usage = { roadmap: { used: number; limit: number }; levelTest: { used: number; limit: number }; tools: { used: number; limit: number }; coach: { unlimited: boolean } };

function useAiUsage() {
  const [usage, setUsage] = useState<Usage | null>(null);
  const load = useCallback(async () => {
    if (!getFirebase()?.auth.currentUser) return;
    try {
      const response = await authenticatedAiFetch("/api/usage", { method: "GET" });
      if (response.ok) setUsage(await response.json());
    } catch {}
  }, []);
  useEffect(() => {
    const first = window.setTimeout(() => void load(), 800);
    const interval = window.setInterval(() => void load(), 60_000);
    const onEvent = () => void load();
    window.addEventListener("planorth-ai-used", onEvent);
    window.addEventListener("focus", onEvent);
    return () => { window.clearTimeout(first); window.clearInterval(interval); window.removeEventListener("planorth-ai-used", onEvent); window.removeEventListener("focus", onEvent); };
  }, [load]);
  return usage;
}

function Bar({ used, limit }: { used: number; limit: number }) {
  const percent = Math.min(100, Math.round((used / limit) * 100));
  return <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className={percent >= 90 ? "h-full rounded-full bg-amber-500" : "h-full rounded-full bg-primary"} style={{ width: `${percent}%` }} /></div>;
}

/** Full breakdown, used in settings. */
export function AiQuotaPanel() {
  const usage = useAiUsage();
  if (!getFirebase()) return null;
  return (
    <section className="account-card" style={{ marginTop: 16 }}>
      <h2 className="flex items-center gap-2"><Sparkles size={18} /> Yapay zekâ kullanımın (bugün)</h2>
      {!usage ? <p>Kullanım bilgisi yükleniyor…</p> : (
        <div className="grid gap-4">
          <div><div className="mb-1.5 flex justify-between text-xs"><span>Planorth Koç sohbeti</span><span className="text-muted-foreground">Adil kullanım içinde sınırsız</span></div></div>
          <div><div className="mb-1.5 flex justify-between text-xs"><span>Yol haritası oluşturma</span><span className="text-muted-foreground">{usage.roadmap.limit - usage.roadmap.used} hakkın kaldı ({usage.roadmap.used}/{usage.roadmap.limit})</span></div><Bar {...usage.roadmap} /></div>
          <div><div className="mb-1.5 flex justify-between text-xs"><span>Seviye testi oluşturma</span><span className="text-muted-foreground">{usage.levelTest.limit - usage.levelTest.used} hakkın kaldı ({usage.levelTest.used}/{usage.levelTest.limit})</span></div><Bar {...usage.levelTest} /></div>
          <div><div className="mb-1.5 flex justify-between text-xs"><span>Diğer AI araçları (değerlendirme, lab özeti, mülakat…)</span><span className="text-muted-foreground">{usage.tools.limit - usage.tools.used} hakkın kaldı ({usage.tools.used}/{usage.tools.limit})</span></div><Bar {...usage.tools} /></div>
          <p>Haklar her gün gece yarısı (UTC) yenilenir. Ayrıca dakikada en fazla birkaç istek yapılabilir.</p>
        </div>
      )}
    </section>
  );
}

/** One-line hint for a single feature. */
export function AiQuotaHint({ kind }: { kind: "roadmap" | "levelTest" | "tools" }) {
  const usage = useAiUsage();
  if (!usage) return null;
  const item = usage[kind];
  const left = Math.max(0, item.limit - item.used);
  return <span className="text-xs text-muted-foreground">Bugün {left} / {item.limit} hakkın kaldı{left === 0 ? " — yarın yenilenir" : ""}</span>;
}

export function notifyAiUsed() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("planorth-ai-used"));
}
