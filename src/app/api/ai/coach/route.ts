import { generateText, Output } from "ai";
import { NextResponse } from "next/server";
import { careerGuide } from "@/lib/ai/career-guide";
import { careerModel, hasAiConfiguration, securityBoundary } from "@/lib/ai/model";
import { coachInputSchema, coachOutputSchema } from "@/lib/ai/schemas";
import { verifyFirebaseRequest } from "@/lib/firebase/admin";

const DAILY_LIMIT = 20;
const requestsByUser = new Map<string, { date: string; count: number }>();

export async function POST(request: Request) {
  const user = await verifyFirebaseRequest(request);
  if (!user) return NextResponse.json({ error: "AI koçunu kullanmak için Firebase hesabına giriş yapmalısın." }, { status: 401 });
  const today = new Date().toISOString().slice(0, 10);
  const previous = requestsByUser.get(user.uid);
  const count = previous?.date === today ? previous.count : 0;
  if (count >= DAILY_LIMIT) return NextResponse.json({ error: "Bugünkü AI koç limitine ulaştın. Önce önerilen görevi uygula." }, { status: 429 });
  const parsed = coachInputSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Koçluk bağlamı geçersiz." }, { status: 400 });
  if (!hasAiConfiguration()) return NextResponse.json({ error: "OpenAI API anahtarı henüz eklenmedi." }, { status: 503 });

  const { generationId, message, history, workspace } = parsed.data;
  try {
    requestsByUser.set(user.uid, { date: today, count: count + 1 });
    const result = await generateText({
      model: careerModel,
      output: Output.object({ schema: coachOutputSchema }),
      system: `${securityBoundary}\n\n${careerGuide}\n\nSen Furkan'ın Türkçe konuşan, kanıta dayalı siber güvenlik kariyer koçusun. Samimi, net ve gerektiğinde sorgulayıcı ol. Bağlam yetersizse plan uydurmak yerine en fazla iki odaklı soru sor. Kullanıcının yaptığı/yapmadığı çalışmalar hakkındaki sözlerini mevcut görevlerle eşleştir. Bir görev veya haftalık plan değişikliği açıkça istendiğinde yalnızca verilen eylem şemasını kullan. Kimliği belirsiz bir görevi tahmin ederek değiştirme; kısa bir netleştirme sorusu sor. Analizlerde saat izlemekten çok bağımsız lab, somut çıktı, tekrar ve azalan AI yardımı kanıtlarını kullan. Yeni görevler somut, 45-60 dakikalık ve ölçülebilir olmalı. Yeni görevde teori/pratik kaynağı gerekirse yalnızca Resource Library'deki kimlikleri kullan ve Source Lock'u koru; gerçek olmayan kaynak, bölüm veya URL uydurma. Cevabın tamamen Türkçe olsun. Eylem ürettiğinde cevabında neyi neden değiştirdiğini de açıkla.`,
      prompt: `Önceki konuşma:\n${JSON.stringify(history)}\n\nGüncel dashboard:\n${JSON.stringify(workspace)}\n\nKullanıcı mesajı:\n${message}`,
    });
    const validIds = new Set(workspace.resources.map((resource) => resource.id));
    const actions = result.output.actions.map((action) => action.type === "create_task" ? { ...action, task: sanitizeResourceIds(action.task, validIds) } : action.type === "edit_task" ? { ...action, patch: sanitizeResourceIds(action.patch, validIds) } : action);
    return NextResponse.json({
      generationId,
      ...result.output,
      actions,
      model: process.env.OPENAI_MODEL ?? "gpt-5.6-luna",
      totalTokens: result.usage.totalTokens,
    });
  } catch (error) {
    console.error("AI coach generation failed", error);
    return NextResponse.json({ error: "AI koçu şu anda yanıt veremedi. API anahtarını ve model ayarını kontrol et." }, { status: 502 });
  }
}

function sanitizeResourceIds<T extends { theoryResourceId?: string; practicalResourceId?: string; optionalReferenceId?: string }>(value: T, validIds: Set<string>): T {
  const next = { ...value };
  for (const key of ["theoryResourceId", "practicalResourceId", "optionalReferenceId"] as const) if (next[key] && !validIds.has(next[key])) delete next[key];
  return next;
}
