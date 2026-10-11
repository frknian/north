import { NextResponse } from "next/server";
import { reportEvent } from "@/lib/server/report";

const seen = new Map<string, { count: number; minute: number }>();

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return new NextResponse(null, { status: 204 });
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  const minute = Math.floor(Date.now() / 60_000);
  const record = seen.get(ip);
  const count = record?.minute === minute ? record.count + 1 : 1;
  seen.set(ip, { count, minute });
  if (seen.size > 500) seen.clear();
  if (count > 10) return new NextResponse(null, { status: 204 });

  const raw = await request.text();
  if (raw.length > 8_000) return new NextResponse(null, { status: 204 });
  let data: Record<string, unknown> = {};
  try { data = JSON.parse(raw); } catch { return new NextResponse(null, { status: 204 }); }
  const cut = (value: unknown, max: number) => (typeof value === "string" ? value.slice(0, max) : undefined);
  await reportEvent({
    kind: "client-error",
    message: cut(data.message, 400),
    stack: cut(data.stack, 2000),
    digest: cut(data.digest, 80),
    source: cut(data.source, 40),
    path: cut(data.path, 200),
    userAgent: cut(request.headers.get("user-agent"), 200),
  });
  return new NextResponse(null, { status: 204 });
}
