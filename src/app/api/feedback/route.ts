import { NextResponse } from "next/server";
import { z } from "zod";
import { readLimitedJson, secureApiRequest } from "@/lib/server/api-security";
import { reportEvent } from "@/lib/server/report";

const schema = z.object({
  category: z.enum(["bug", "idea", "question", "other"]),
  message: z.string().trim().min(10).max(2000),
  email: z.string().trim().email().max(200).optional().or(z.literal("")),
  path: z.string().max(200).optional(),
});

export async function POST(request: Request) {
  const access = await secureApiRequest(request, "feedback", { perMinute: 3, perDay: 10, optionalAuth: true });
  if (!access.ok) return access.response;
  const body = await readLimitedJson(request, 8 * 1024);
  if (!body.ok) return body.response;
  const parsed = schema.safeParse(body.data);
  if (!parsed.success) return NextResponse.json({ error: "Mesajın en az 10 karakter olmalı." }, { status: 400 });
  const { category, message, email, path } = parsed.data;
  await reportEvent({ kind: "feedback", category, message, email: email || access.user.email || undefined, path, uid: access.user.uid });
  return NextResponse.json({ ok: true });
}
