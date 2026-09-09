import "server-only";

import { verifyFirebaseRequest } from "@/lib/firebase/admin";

type VerifiedUser = NonNullable<Awaited<ReturnType<typeof verifyFirebaseRequest>>>;
type RateRecord = { minute: number; minuteCount: number; day: string; dayCount: number; touchedAt: number };
type SecurityResult = { ok: true; user: VerifiedUser } | { ok: false; response: Response };
type JsonResult = { ok: true; data: unknown } | { ok: false; response: Response };

const globalRateState = globalThis as typeof globalThis & { __northApiRates?: Map<string, RateRecord> };
const rates = globalRateState.__northApiRates ??= new Map<string, RateRecord>();

function consumeRate(key: string, now: number, perMinute: number, perDay: number) {
  const minute = Math.floor(now / 60_000);
  const day = new Date(now).toISOString().slice(0, 10);
  const previous = rates.get(key);
  const record: RateRecord = {
    minute,
    minuteCount: previous?.minute === minute ? previous.minuteCount + 1 : 1,
    day,
    dayCount: previous?.day === day ? previous.dayCount + 1 : 1,
    touchedAt: now,
  };
  rates.set(key, record);
  const limited = record.minuteCount > perMinute || record.dayCount > perDay;
  const retryAfter = record.minuteCount > perMinute ? 60 - Math.floor(now / 1000) % 60 : 86_400;
  return { limited, retryAfter };
}

export async function secureApiRequest(
  request: Request,
  scope: string,
  limits: { perMinute?: number; perDay?: number; unlimited?: boolean } = {},
): Promise<SecurityResult> {
  const origin = request.headers.get("origin");
  if (origin && origin !== "null" && origin !== new URL(request.url).origin) {
    return { ok: false, response: apiError("İstek kaynağına izin verilmedi.", 403) };
  }

  const user = await verifyFirebaseRequest(request);
  if (!user) return { ok: false, response: apiError("Oturum gerekli.", 401) };

  const now = Date.now();
  const perMinute = limits.unlimited ? 120 : (limits.perMinute ?? 8);
  const perDay = limits.unlimited ? 10_000 : (limits.perDay ?? 50);
  const scopedRate = consumeRate(`${user.uid}:${scope}`, now, perMinute, perDay);
  const isExemptAi = Boolean(limits.unlimited || scope === "ai:north");
  const globalAiRate = (scope.startsWith("ai:") && !isExemptAi) ? consumeRate(`${user.uid}:ai:global`, now, 12, 80) : null;
  const limited = scopedRate.limited ? scopedRate : globalAiRate?.limited ? globalAiRate : null;
  if (limited) {
    return { ok: false, response: apiError("İstek sınırına ulaştın. Bir süre sonra tekrar dene.", 429, { "Retry-After": String(limited.retryAfter) }) };
  }

  if (rates.size > 2_000) {
    for (const [rateKey, value] of rates) if (now - value.touchedAt > 86_400_000) rates.delete(rateKey);
  }
  return { ok: true, user };
}

export async function readLimitedJson(request: Request, maxBytes = 64 * 1024): Promise<JsonResult> {
  const contentType = request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
  if (contentType !== "application/json") return { ok: false, response: apiError("Content-Type application/json olmalı.", 415) };

  const declaredSize = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredSize) && declaredSize > maxBytes) return { ok: false, response: apiError("İstek çok büyük.", 413) };

  const reader = request.body?.getReader();
  if (!reader) return { ok: false, response: apiError("Geçersiz JSON isteği.", 400) };

  const decoder = new TextDecoder();
  let receivedBytes = 0;
  let raw = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      receivedBytes += value.byteLength;
      if (receivedBytes > maxBytes) {
        await reader.cancel();
        return { ok: false, response: apiError("İstek çok büyük.", 413) };
      }
      raw += decoder.decode(value, { stream: true });
    }
    raw += decoder.decode();
    return { ok: true, data: JSON.parse(raw) };
  } catch {
    return { ok: false, response: apiError("Geçersiz JSON isteği.", 400) };
  } finally {
    reader.releaseLock();
  }
}

export function apiError(message: string, status: number, headers?: HeadersInit) {
  return Response.json({ error: message }, { status, headers: { "Cache-Control": "no-store", ...headers } });
}
