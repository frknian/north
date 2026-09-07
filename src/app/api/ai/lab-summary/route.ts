import { generateText, Output } from "ai";
import { NextResponse } from "next/server";
import { careerModel, hasAiConfiguration, securityBoundary } from "@/lib/ai/model";
import { labSummaryInputSchema, labSummaryOutputSchema } from "@/lib/ai/schemas";
import { readLimitedJson, secureApiRequest } from "@/lib/server/api-security";

export async function POST(request: Request) {
  const access = await secureApiRequest(request, "ai:lab-summary");
  if (!access.ok) return access.response;
  const body = await readLimitedJson(request);
  if (!body.ok) return body.response;
  const parsed = labSummaryInputSchema.safeParse(body.data);
  if (!parsed.success) return NextResponse.json({ error: "Geçersiz lab günlüğü" }, { status: 400 });
  if (!hasAiConfiguration()) {
    const source = [parsed.data.learned, parsed.data.stuck ? `Resolve next time: ${parsed.data.stuck}` : "", parsed.data.enumeration].filter(Boolean).slice(0,3);
    return NextResponse.json({ keyLearnings: source.length ? source : ["Labı kapatmadan önce tekrar kullanılabilir bir öğrenimi kaydet."] });
  }
  const { output } = await generateText({ model: careerModel, output: Output.object({ schema: labSummaryOutputSchema }), system: `${securityBoundary}\nBu yetkili lab günlüğünden en fazla üç kısa, tekrar kullanılabilir siber güvenlik öğrenimi çıkar. Yalnızca sağlanan kanıtları kullan ve yanıtını Türkçe ver.`, prompt: JSON.stringify(parsed.data) });
  return NextResponse.json(output);
}
