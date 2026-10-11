"use client";

import { useState, type FormEvent } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authenticatedAiFetch } from "@/lib/ai/client";

const categories = [["bug", "Hata bildirimi"], ["idea", "Öneri"], ["question", "Soru"], ["other", "Diğer"]] as const;

export function SupportForm() {
  const [category, setCategory] = useState<(typeof categories)[number][0]>("bug");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setState("sending"); setError("");
    const payload = JSON.stringify({ category, message, email: email.trim(), path: document.referrer ? new URL(document.referrer).pathname : undefined });
    const init = { method: "POST", headers: { "Content-Type": "application/json" }, body: payload };
    try {
      // Signed-in users are identified; visitors can still write (rate limited by IP).
      let response: Response;
      try { response = await authenticatedAiFetch("/api/feedback", init); } catch { response = await fetch("/api/feedback", init); }
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "Gönderilemedi. Lütfen tekrar dene.");
      setState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gönderilemedi."); setState("idle");
    }
  }

  if (state === "done") return <p className="support-done" role="status"><Check size={18} /> Mesajın bize ulaştı, teşekkürler.</p>;
  return (
    <form onSubmit={submit} className="support-form">
      <label>Konu<select value={category} onChange={(e) => setCategory(e.target.value as typeof category)}>{categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label>Mesajın<textarea required minLength={10} maxLength={2000} rows={6} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Ne oldu, ne bekliyordun? Hangi sayfadaydın?" /></label>
      <label>E-posta (yanıt almak istersen)<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ornek@eposta.com" autoComplete="email" /></label>
      {error && <p role="alert" className="support-error">{error}</p>}
      <Button type="submit" disabled={state === "sending" || message.trim().length < 10}>{state === "sending" ? <Loader2 size={15} className="animate-spin" /> : null}Gönder</Button>
    </form>
  );
}
