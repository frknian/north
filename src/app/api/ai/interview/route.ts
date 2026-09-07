import { generateText, Output } from "ai";
import { NextResponse } from "next/server";
import { careerModel, hasAiConfiguration, securityBoundary } from "@/lib/ai/model";
import { interviewInputSchema, interviewOutputSchema } from "@/lib/ai/schemas";
import { readLimitedJson, secureApiRequest } from "@/lib/server/api-security";

export async function POST(request: Request) {
  const access = await secureApiRequest(request, "ai:interview");
  if (!access.ok) return access.response;
  const body = await readLimitedJson(request);
  if (!body.ok) return body.response;
  const parsed = interviewInputSchema.safeParse(body.data);
  if (!parsed.success) return NextResponse.json({ error: "Geçersiz mülakat yanıtı." }, { status: 400 });
  if (!hasAiConfiguration()) return NextResponse.json({ error: "OpenAI anahtarı eksik." }, { status: 503 });
  try {
    const result = await generateText({ model: careerModel, output: Output.object({ schema: interviewOutputSchema }), system: `${securityBoundary}\nTürkçe veya İngilizce siber güvenlik mülakat değerlendiricisisin. Teknik doğruluk, kapsam ve iletişime dürüst, yapıcı puan ver.`, prompt: JSON.stringify(parsed.data) });
    return NextResponse.json(result.output);
  } catch {
    return NextResponse.json({ error: "Mülakat değerlendirmesi şu an yapılamadı." }, { status: 502 });
  }
}
