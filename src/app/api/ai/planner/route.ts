import { generateText, Output } from "ai";
import { NextResponse } from "next/server";
import { careerModel, hasAiConfiguration, securityBoundary } from "@/lib/ai/model";
import { careerGuide } from "@/lib/ai/career-guide";
import { plannerInputSchema, plannerOutputSchema } from "@/lib/ai/schemas";
import { verifyFirebaseRequest } from "@/lib/firebase/admin";

export async function POST(request: Request) {
  if (!await verifyFirebaseRequest(request)) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  const parsed = plannerInputSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid planning context" }, { status: 400 });
  if (!hasAiConfiguration()) return NextResponse.json({ error: "OPENAI_API_KEY is not configured" }, { status: 503 });
  const count = parsed.data.profile.mode === "exam" ? 4 : parsed.data.profile.mode === "free" ? 14 : 10;
  const { output } = await generateText({
    model: careerModel,
    output: Output.object({ schema: plannerOutputSchema }),
    system: `${securityBoundary}\n${careerGuide}\nTürkçe konuşan haftalık siber güvenlik çalışma planlayıcısısın. ${count} adet somut 45-60 dakikalık görev üret. Her görev sonunda ölçülebilir bir outputRequirement olmalı. theoryResourceId, practicalResourceId ve optionalReferenceId alanlarında yalnızca verilen Resource Library içindeki gerçek kimlikleri kullan; asla kurs, bölüm, lab veya URL uydurma. Önce Source Lock içindeki ana kaynağı koru. Sonra primary pratik kaynağı, gerekirse secondary kaynağı seç. Kullanıcı bir kaynağı faydasız işaretlediyse alternatif seçebilirsin. Uygun kaynak yoksa resource kimliği uydurmak yerine alanı boş bırak. Belirsiz video/kurs görevleri verme; lab, resmî dokümantasyon, küçük otomasyon ve kısa teknik çıktı tercih et.`,
    prompt: `Tam olarak ${count} sırasız haftalık görev bloğu oluştur. Bağlam: ${JSON.stringify(parsed.data)}`,
  });
  const validIds = new Set(parsed.data.resources.map((resource) => resource.id));
  return NextResponse.json({ ...output, tasks: output.tasks.map((task) => ({ ...task, theoryResourceId: task.theoryResourceId && validIds.has(task.theoryResourceId) ? task.theoryResourceId : undefined, practicalResourceId: task.practicalResourceId && validIds.has(task.practicalResourceId) ? task.practicalResourceId : undefined, optionalReferenceId: task.optionalReferenceId && validIds.has(task.optionalReferenceId) ? task.optionalReferenceId : undefined })) });
}
