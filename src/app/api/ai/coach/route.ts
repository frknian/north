import { generateText, Output } from "ai";
import { NextResponse } from "next/server";
import { careerGuide } from "@/lib/ai/career-guide";
import { careerModel, hasAiConfiguration, securityBoundary } from "@/lib/ai/model";
import { coachInputSchema, coachOutputSchema } from "@/lib/ai/schemas";
import { readLimitedJson, secureApiRequest } from "@/lib/server/api-security";

export async function POST(request: Request) {
  const access = await secureApiRequest(request, "ai:coach", { perDay: 20 });
  if (!access.ok) return access.response;
  const body = await readLimitedJson(request);
  if (!body.ok) return body.response;
  const parsed = coachInputSchema.safeParse(body.data);
  if (!parsed.success) return NextResponse.json({ error: "Koçluk bağlamı geçersiz." }, { status: 400 });
  if (!hasAiConfiguration()) return NextResponse.json({ error: "OpenAI API anahtarı henüz eklenmedi." }, { status: 503 });

  const { generationId, message, history, workspace } = parsed.data;

  // Determine domain archetype dynamically based on primary focus & goal
  const focus = `${workspace.profile.primaryFocus} ${workspace.profile.goal}`.toLocaleLowerCase("tr");
  const isExam = /yks|tyt|ayt|kpss|ales|dgs|tus|lgs|deneme|sınav/.test(focus);
  const isLanguage = /dil|ingilizce|almanca|fransızca|ielts|toefl|ydt/.test(focus);
  const isTech = /yazılım|software|kodlama|siber|cyber|developer|frontend|backend/.test(focus);

  const domainStrategy = isExam
    ? "Hedef Alan: Sınav & Hazırlık. Soru çözümü, deneme netleri, süre yönetimi ve yanlış defteri odağında koçluk yap."
    : isLanguage
    ? "Hedef Alan: Dil Öğrenimi. Aktif maruziyet, konuşma/gölgeleme ve kelime aralıklı tekrarı odağında koçluk yap."
    : isTech
    ? "Hedef Alan: Yazılım & Mühendislik. Çalışan kod, bağımsız lab çözümü, tutorial hell'den kaçınma ve proje çıktısı odağında koçluk yap."
    : "Hedef Alan: Teorik & Kavramsal Öğrenim. Feynman tekniği, aktif hatırlama ve kavramsal sentez odağında koçluk yap.";

  try {
    const result = await generateText({
      model: careerModel,
      output: Output.object({ schema: coachOutputSchema }),
      system: `${securityBoundary}\n\n${careerGuide}\n\nSen kullanıcının Türkçe konuşan, kanıta dayalı kişisel gelişim ve hedef koçusun. ${domainStrategy} Samimi, net ve gerektiğinde sorgulayıcı ol. Bağlam yetersizse plan uydurmak yerine en fazla iki odaklı soru sor. Kullanıcının yaptığı/yapmadığı çalışmalar hakkındaki sözlerini mevcut görevlerle eşleştir. Bir görev veya haftalık plan değişikliği açıkça istendiğinde yalnızca verilen eylem şemasını kullan. Kimliği belirsiz bir görevi tahmin ederek değiştirme; kısa bir netleştirme sorusu sor. Analizlerde saat izlemekten çok bağımsız problem/lab, somut çıktı, aralıklı tekrar ve azalan AI yardımı kanıtlarını kullan. Yeni görevler somut, 30-60 dakikalık ve ölçülebilir olmalı. Yeni görevde teori/pratik kaynağı gerekirse yalnızca Resource Library'deki kimlikleri kullan ve Source Lock'u koru; gerçek olmayan kaynak, bölüm veya URL uydurma. Cevabın tamamen Türkçe olsun. Eylem ürettiğinde cevabında neyi neden değiştirdiğini de açıkla.`,
      prompt: `Önceki konuşma:\n${JSON.stringify(history)}\n\nGüncel dashboard:\n${JSON.stringify(workspace)}\n\nKullanıcı mesajı:\n${message}`,
    });
    const validIds = new Set(workspace.resources.map((resource) => resource.id));
    const actions = result.output.actions.map((action) =>
      action.type === "create_task"
        ? { ...action, task: sanitizeResourceIds(action.task, validIds) }
        : action.type === "edit_task"
        ? { ...action, patch: sanitizeResourceIds(action.patch, validIds) }
        : action
    );
    return NextResponse.json({
      generationId,
      ...result.output,
      actions,
      model: process.env.OPENAI_MODEL ?? "gpt-5.6-luna",
      totalTokens: result.usage.totalTokens,
    });
  } catch (error) {
    console.error("AI coach generation failed", error);
    return NextResponse.json(
      { error: "AI koçu şu anda yanıt veremedi. API anahtarını ve model ayarını kontrol et." },
      { status: 502 }
    );
  }
}

function sanitizeResourceIds<
  T extends { theoryResourceId?: string; practicalResourceId?: string; optionalReferenceId?: string }
>(value: T, validIds: Set<string>): T {
  const next = { ...value };
  for (const key of ["theoryResourceId", "practicalResourceId", "optionalReferenceId"] as const)
    if (next[key] && !validIds.has(next[key])) delete next[key];
  return next;
}
