import { NextResponse } from "next/server";
import { generateText } from "ai";
import { careerModel, hasAiConfiguration, securityBoundary } from "@/lib/ai/model";
import { readLimitedJson, secureApiRequest } from "@/lib/server/api-security";
import { dayKey, shiftDay } from "@/lib/north";

export async function POST(request: Request) {
  const access = await secureApiRequest(request, "ai:topic-sprint");
  if (!access.ok) return access.response;

  const body = await readLimitedJson(request);
  if (!body.ok) return body.response;

  const raw = (body.data || {}) as {
    areaName?: string;
    sprintTitle?: string;
    level?: string;
    targetDate?: string;
    dailyMinutes?: number;
    notesContent?: string;
    fileName?: string;
  };

  const areaName = (raw.areaName || "Genel Alan").trim();
  const sprintTitle = (raw.sprintTitle || "Alt Konu Çalışması").trim();
  const level = (raw.level || "Lisans Seviyesi").trim();
  const today = dayKey();
  const targetDate = raw.targetDate && raw.targetDate > today ? raw.targetDate : shiftDay(today, 7);
  const dailyMinutes = Math.min(180, Math.max(25, Number(raw.dailyMinutes) || 45));
  const notesContent = (raw.notesContent || "").trim();
  const fileName = (raw.fileName || "").trim();

  // Calculate days available
  const startTs = new Date(`${today}T00:00:00`).getTime();
  const endTs = new Date(`${targetDate}T00:00:00`).getTime();
  const totalDays = Math.max(1, Math.round((endTs - startTs) / (1000 * 60 * 60 * 24)));
  const moduleCount = Math.min(10, Math.max(3, Math.min(totalDays, 7)));

  // Generate fallback dates evenly spread out
  const dates: string[] = [];
  for (let i = 0; i < moduleCount; i++) {
    const dayOffset = Math.min(totalDays - 1, Math.floor((i * (totalDays - 1)) / (moduleCount - 1 || 1)));
    dates.push(shiftDay(today, dayOffset));
  }

  // Domain-aware fallback modules generator
  function generateFallbackModules() {
    // If user provided notes with line breaks or bullet points, try to extract them
    const extractedLines = notesContent
      .split("\n")
      .map((l) => l.replace(/^[-*•\d.)\s]+/, "").trim())
      .filter((l) => l.length > 5 && l.length < 90);

    if (extractedLines.length >= 3) {
      return extractedLines.slice(0, moduleCount).map((line, idx) => ({
        id: crypto.randomUUID(),
        title: line,
        summary: `${sprintTitle} kapsamında "${line}" alt başlığının çalışılması ve notların pekiştirilmesi.`,
        estimatedMinutes: dailyMinutes,
        targetDate: dates[idx] || dates[dates.length - 1],
        status: "pending" as const,
      }));
    }

    // Specific domain heuristics
    const combined = `${areaName} ${sprintTitle} ${notesContent}`.toLocaleLowerCase("tr-TR");

    let titles: { title: string; summary: string }[] = [];

    if (/matematik|calculus|diferansiyel|cebir|integral|analiz/.test(combined)) {
      titles = [
        {
          title: "1. Aşama: Temel Tanımlar & 1. Derece Ayrılabilir Denklemler",
          summary: "Temel diferansiyel operatörler, değişkenlerine ayrılabilir formlar ve ilk değer problemleri (IVP).",
        },
        {
          title: "2. Aşama: Homojen Denklemler ve İntegral Çarpanı",
          summary: "Tam diferansiyel denklemler ve integral çarpanı bulma yöntemlerinin adım adım uygulaması.",
        },
        {
          title: "3. Aşama: Yüksek Dereceden Lineer Diferansiyel Denklemler",
          summary: "Homojen lineer denklemler, karakteristik kök analizi ve Wronskian determinantı.",
        },
        {
          title: "4. Aşama: Belirsiz Katsayılar & Parametrelerin Değişimi",
          summary: "Özel çözümlerin (Yp) bulunması, rezonans durumları ve parametre değişimi entegrasyonu.",
        },
        {
          title: "5. Aşama: Vize/Sınav Simülasyonu & Çıkmış Soru Çözümü",
          summary: "Zaman sınırlı soru çözüm seansı, işlem hatalarını ayıklama ve kritik formül özeti.",
        },
      ];
    } else if (/siber|güvenlik|cyber|web app|owasp|pentest|network/.test(combined)) {
      titles = [
        {
          title: "1. Aşama: Web Mimarisi & OWASP Top 10 Haritası",
          summary: "HTTP istek/yanıt döngüsü, session mekanizması ve modern web zafiyet sınıflandırması.",
        },
        {
          title: "2. Aşama: Kimlik Doğrulama & Oturum Yönetimi Zafiyetleri",
          summary: "Broken Object Level Auth (BOLA), JWT zayıflıkları ve oturum sabitleme testleri.",
        },
        {
          title: "3. Aşama: SQL Injection & XSS (Cross-Site Scripting) Labı",
          summary: "Blind/in-band SQLi teknikleri ve DOM/Stored XSS saldırı vektörlerinin incelenmesi.",
        },
        {
          title: "4. Aşama: CSRF, SSRF & Yetkisiz API Erişimleri",
          summary: "Server-side request forgery simülasyonu ve güvenli kodlama savunma mimarisi.",
        },
        {
          title: "5. Aşama: PortSwigger / CTF Vaka Çözümü & Raporlama",
          summary: "Uçtan uca sızma testi senaryosu, bulguların dokümantasyonu ve pekiştirme.",
        },
      ];
    } else {
      titles = [
        {
          title: `1. Aşama: ${sprintTitle} Temel Kavramlar & Kapsam`,
          summary: "Ön koşul bilgilerin taranması, temel terimlerin haritalandırılması ve kaynak düzeni.",
        },
        {
          title: `2. Aşama: ${sprintTitle} Çekirdek İlkeler & Metodoloji`,
          summary: "Konunun ana omurgasını oluşturan teorik ve pratik mekanizmaların çalışılması.",
        },
        {
          title: `3. Aşama: Derinlemesine Uygulama & Vaka Çözümü`,
          summary: "Bağımsız problem çözme, kodlama veya örnek senaryolar üzerinde pratik yapılması.",
        },
        {
          title: `4. Aşama: Zayıf Halkalar & Hata Analizi`,
          summary: "Zorlanılan veya belirsiz kalan başlıkların aralıklı tekrarla pekiştirilmesi.",
        },
        {
          title: `5. Aşama: Sınav/Teslim Simülasyonu & Final Çıktı`,
          summary: "Bitiş tarihinden önce kapsamlı deneme, portföy çıktısı ve nihai kontrol.",
        },
      ];
    }

    return titles.slice(0, moduleCount).map((item, idx) => ({
      id: crypto.randomUUID(),
      title: item.title,
      summary: item.summary,
      estimatedMinutes: dailyMinutes,
      targetDate: dates[idx] || dates[dates.length - 1],
      status: "pending" as const,
    }));
  }

  const fallbackModules = generateFallbackModules();

  const fallbackResponse = {
    sprintTitle,
    level,
    targetDate,
    dailyMinutes,
    modules: fallbackModules,
    strategyNote: `${areaName} alanında "${sprintTitle}" konusunu ${targetDate} tarihine kadar ${fallbackModules.length} aşamalı odak modülüne ayırdık.`,
  };

  if (!hasAiConfiguration()) {
    return NextResponse.json(fallbackResponse);
  }

  try {
    const prompt = `Alan: ${areaName}
Alt Konu / Hedef: ${sprintTitle}
Seviye / Amaç: ${level} (Örn: Üniversite Vize/Final Kampı, Lisans Seviyesi veya İş Hayatı Yeni Yetkinlik)
Hedef Bitiş / Sınav Tarihi: ${targetDate} (Bugün: ${today}, Toplam Gün: ${totalDays})
Günlük Odak Süresi: ${dailyMinutes} dakika
Varsa Yüklenen Dosya: ${fileName || "Yok"}
Varsa Ders Notları / Müfredat / Slayt Metni:
"""
${notesContent ? notesContent.slice(0, 3500) : "Not metni verilmedi; konunun standart üniversite/sektör müfredatını baz al."}
"""

Lütfen kullanıcıyı ${targetDate} tarihine kadar bu alt konuda eksiksiz hazırlayacak, günlere dengeli dağılmış ${moduleCount} adet odak modülü oluştur.
Her modülün başlığı son derece net, eyleme dönük ve somut olsun.
Örnek tarihler: ${dates.join(", ")}

Yanıtını kod blokları olmadan SAF JSON olarak ver:
{
  "strategyNote": "Öğrenciye veya uzmana yönelik 1-2 cümlelik motive edici çalışma stratejisi özeti",
  "modules": [
    {
      "title": "Aşama 1: Konu Başlığı ve Net Eylem",
      "summary": "Bu seansta tam olarak ne öğrenilecek veya çözülecek",
      "estimatedMinutes": ${dailyMinutes},
      "targetDate": "YYYY-MM-DD"
    }
  ]
}`;

    const { text } = await generateText({
      model: careerModel,
      system: `${securityBoundary}\nSen üniversite sınavlarına (vize/final) ve profesyonel teknik yetkinlik sprintlerine hazırlayan üst düzey bir akademik koçsun. Öğrencinin elindeki ders notlarını, PDF dökümanını veya konu başlığını mantıklı, birbirini tamamlayan günlük çalışma seanslarına böl. Kod blokları olmadan saf JSON üret.`,
      prompt,
    });

    const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleanJson);

    if (Array.isArray(parsed.modules) && parsed.modules.length > 0) {
      const formattedModules = parsed.modules.map((m: any, idx: number) => ({
        id: crypto.randomUUID(),
        title: String(m.title || `Aşama ${idx + 1}`).trim(),
        summary: String(m.summary || `${sprintTitle} odak çalışması.`).trim(),
        estimatedMinutes: Number(m.estimatedMinutes) || dailyMinutes,
        targetDate: String(m.targetDate || dates[idx] || dates[dates.length - 1]).trim(),
        status: "pending" as const,
      }));

      return NextResponse.json({
        sprintTitle,
        level,
        targetDate,
        dailyMinutes,
        modules: formattedModules,
        strategyNote: parsed.strategyNote || fallbackResponse.strategyNote,
      });
    }

    return NextResponse.json(fallbackResponse);
  } catch (err) {
    console.warn("[AI Topic Sprint] Fallback triggered:", err);
    return NextResponse.json(fallbackResponse);
  }
}
