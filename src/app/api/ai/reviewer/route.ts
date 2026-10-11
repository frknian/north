import { generateText, Output } from "ai";
import { NextResponse } from "next/server";
import { careerModel, hasAiConfiguration, securityBoundary } from "@/lib/ai/model";
import { reviewInputSchema, reviewOutputSchema } from "@/lib/ai/schemas";
import { readLimitedJson, secureApiRequest } from "@/lib/server/api-security";

export async function POST(request: Request) {
  const access = await secureApiRequest(request, "ai:reviewer");
  if (!access.ok) return access.response;
  const body = await readLimitedJson(request);
  if (!body.ok) return body.response;
  const parsed = reviewInputSchema.safeParse(body.data);
  if (!parsed.success) return NextResponse.json({ error: "Geçersiz değerlendirme metrikleri" }, { status: 400 });
  if (!hasAiConfiguration()) return NextResponse.json({ error: "OPENAI_API_KEY yapılandırılmadı" }, { status: 503 });
  const { output } = await generateText({
    model: careerModel,
    output: Output.object({ schema: reviewOutputSchema }),
    system: `${securityBoundary}\nKısa ve kanıta dayalı bir çalışma değerlendiricisisin. Yalnızca sağlanan metrikleri kullan. Bir güçlü yön, bir darboğaz ve bir öncelik belirle. Intelligence bağlamında güvenilir desen varsa değerlendirmeye tek bir Planorth Analiz içgörüsü ekle; yetersiz veriyi kesin sonuç gibi sunma. Performans verisi uydurma. Yanıtını Türkçe ve birkaç kısa paragrafla ver.`,
    prompt: JSON.stringify(parsed.data),
  });
  return NextResponse.json(output);
}
