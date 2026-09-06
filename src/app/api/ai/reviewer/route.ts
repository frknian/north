import { generateText, Output } from "ai";
import { NextResponse } from "next/server";
import { careerModel, hasAiConfiguration } from "@/lib/ai/model";
import { reviewInputSchema, reviewOutputSchema } from "@/lib/ai/schemas";
import { verifyFirebaseRequest } from "@/lib/firebase/admin";

export async function POST(request: Request) {
  if (!await verifyFirebaseRequest(request)) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  const parsed = reviewInputSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Geçersiz değerlendirme metrikleri" }, { status: 400 });
  if (!hasAiConfiguration()) return NextResponse.json({ error: "OPENAI_API_KEY yapılandırılmadı" }, { status: 503 });
  const { output } = await generateText({
    model: careerModel,
    output: Output.object({ schema: reviewOutputSchema }),
    system: "Kısa ve kanıta dayalı bir çalışma değerlendiricisisin. Yalnızca sağlanan metrikleri kullan. Bir güçlü yön, bir darboğaz ve bir öncelik belirle. Intelligence bağlamında güvenilir desen varsa değerlendirmeye tek bir North Intelligence içgörüsü ekle; yetersiz veriyi kesin sonuç gibi sunma. Performans verisi uydurma. Yanıtını Türkçe ve birkaç kısa paragrafla ver.",
    prompt: JSON.stringify(parsed.data),
  });
  return NextResponse.json(output);
}
