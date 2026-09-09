import { NextResponse } from "next/server";
import { generateText } from "ai";
import { careerModel, hasAiConfiguration, securityBoundary } from "@/lib/ai/model";
import { readLimitedJson, secureApiRequest } from "@/lib/server/api-security";
import { verifyFirebaseRequest } from "@/lib/firebase/admin";

export async function POST(request: Request) {
  const access = await secureApiRequest(request, "ai:source-summary", { optionalAuth: true });
  if (!access.ok) return access.response;

  const body = await readLimitedJson(request);
  if (!body.ok) return body.response;

  const raw = (body.data || {}) as {
    title?: string;
    url?: string;
    content?: string;
    topic?: string;
  };

  const title = (raw.title || "Çalışma Kaynağı").trim();
  const content = (raw.content || "").trim();
  const topic = (raw.topic || "").trim();
  const url = (raw.url || "").trim();

  // Deterministic fallback if AI is not configured or fails
  const fallbackResponse = {
    title,
    summary: `${title}${topic ? ` (${topic})` : ""} üzerine odaklanılmış temel prensipleri, zihinsel modelleri ve pratik çıktıları içeren yönetici özeti.`,
    keyTakeaways: [
      `Temel Kavram: ${title} alanındaki ana mekanizma ve teorik altyapı kavrandı.`,
      "Mimari & Güvenlik: Uygulama katmanında zafiyet yaratabilecek tasarım hatalarından kaçınma stratejisi.",
      "Verimlilik & Uygulama: Ezberlemek yerine pratik senaryolar üzerinde test ederek kalıcı öğrenme sağlama.",
    ],
    actionSteps: [
      "Sayfa aralıklarındaki kritik terimleri kendi kelimelerinle bir 'Flashcard' veya özet nota dönüştür.",
      "Burp Suite, terminal veya IDE üzerinde 15-20 dakikalık mini bir doğrulama testi yap.",
      "Hazırlanan bu özeti Google NotebookLM çalışma alanına kaynak dokümanı olarak ekle.",
    ],
    notebookLmPrompt: `${title} kaynağındaki ana argümanları ve en sık karşılaşılan tuzakları adım adım analiz edebilir misin?`,
  };

  const user = await verifyFirebaseRequest(request);
  if (!user || !hasAiConfiguration()) {
    return NextResponse.json(fallbackResponse);
  }

  try {
    const prompt = `Kaynak Başlığı: ${title}
Konu / Bölüm: ${topic || "Genel"}
URL / Kaynak: ${url || "Belirtilmedi"}
İçerik / Alıntılar / Notlar:
${content || "Kullanıcı bu kaynak için derinlemesine bir yönetici özeti ve NotebookLM analiz istemi talep etti."}

Lütfen bu kaynak için Türkçe olarak aşağıdaki JSON formatında yapılandırılmış bir özet üret:
{
  "summary": "2-3 cümlelik vurucu ana fikir ve bağlam özeti",
  "keyTakeaways": ["Madde 1: En kritik kavram", "Madde 2: Mimari/pratik çıkarım", "Madde 3: Dikkat edilmesi gereken tuzak"],
  "actionSteps": ["Uygulanabilir Adım 1", "Uygulanabilir Adım 2", "Uygulanabilir Adım 3"],
  "notebookLmPrompt": "Bu kaynak NotebookLM'e yüklendiğinde yapay zekaya sorulabilecek en derin soru"
}`;

    const { text } = await generateText({
      model: careerModel,
      system: `${securityBoundary}\nSen seçkin bir teknik araştırmacı ve çalışma mentörüsün. Verilen kaynak veya kitaptan en yüksek bilişsel değerdeki çıkarımları süz ve doğrudan JSON yanıtı ver. Kod blokları olmadan saf JSON üret.`,
      prompt,
    });

    // Try parsing JSON output
    const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleanJson);

    return NextResponse.json({
      title,
      summary: parsed.summary || fallbackResponse.summary,
      keyTakeaways: Array.isArray(parsed.keyTakeaways) ? parsed.keyTakeaways : fallbackResponse.keyTakeaways,
      actionSteps: Array.isArray(parsed.actionSteps) ? parsed.actionSteps : fallbackResponse.actionSteps,
      notebookLmPrompt: parsed.notebookLmPrompt || fallbackResponse.notebookLmPrompt,
    });
  } catch (err) {
    console.warn("[AI Source Summary] Model call fallback:", err);
    return NextResponse.json(fallbackResponse);
  }
}
