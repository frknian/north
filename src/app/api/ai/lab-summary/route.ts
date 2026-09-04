import { generateText, Output } from "ai";
import { NextResponse } from "next/server";
import { careerModel, hasAiConfiguration } from "@/lib/ai/model";
import { labSummaryInputSchema, labSummaryOutputSchema } from "@/lib/ai/schemas";
import { verifyFirebaseRequest } from "@/lib/firebase/admin";

export async function POST(request: Request) {
  if (!await verifyFirebaseRequest(request)) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  const parsed = labSummaryInputSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Geçersiz lab günlüğü" }, { status: 400 });
  if (!hasAiConfiguration()) {
    const source = [parsed.data.learned, parsed.data.stuck ? `Resolve next time: ${parsed.data.stuck}` : "", parsed.data.enumeration].filter(Boolean).slice(0,3);
    return NextResponse.json({ keyLearnings: source.length ? source : ["Labı kapatmadan önce tekrar kullanılabilir bir öğrenimi kaydet."] });
  }
  const { output } = await generateText({ model: careerModel, output: Output.object({ schema: labSummaryOutputSchema }), system: "Bu yetkili lab günlüğünden en fazla üç kısa, tekrar kullanılabilir siber güvenlik öğrenimi çıkar. Yalnızca sağlanan kanıtları kullan ve yanıtını Türkçe ver.", prompt: JSON.stringify(parsed.data) });
  return NextResponse.json(output);
}
