import { generateText, Output } from "ai";
import { NextResponse } from "next/server";
import { careerModel, hasAiConfiguration, securityBoundary } from "@/lib/ai/model";
import { jobAnalysisInputSchema, jobAnalysisOutputSchema } from "@/lib/ai/schemas";
import { readLimitedJson, secureApiRequest } from "@/lib/server/api-security";

export async function POST(request: Request) {
  const access = await secureApiRequest(request, "ai:job-analysis");
  if (!access.ok) return access.response;
  const body = await readLimitedJson(request);
  if (!body.ok) return body.response;
  const parsed = jobAnalysisInputSchema.safeParse(body.data);
  if (!parsed.success) return NextResponse.json({ error: "Geçersiz ilan." }, { status: 400 });
  if (!hasAiConfiguration()) return NextResponse.json({ error: "OpenAI anahtarı eksik." }, { status: 503 });
  try {
    const result = await generateText({ model: careerModel, output: Output.object({ schema: jobAnalysisOutputSchema }), system: `${securityBoundary}\nTürkçe konuşan siber güvenlik kariyer analizcisisin. Yalnızca ilan metnindeki gereksinimleri çıkar. Kullanıcının kanıtlanmış skill puanlarıyla gerçekçi match skoru üret; asla deneyim uydurma.`, prompt: JSON.stringify(parsed.data) });
    return NextResponse.json(result.output);
  } catch {
    return NextResponse.json({ error: "İlan analizi şu an yapılamadı." }, { status: 502 });
  }
}
