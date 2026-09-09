"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Briefcase,
  CalendarDays,
  Check,
  CheckCircle2,
  CircleHelp,
  ClipboardList,
  Clock3,
  Compass,
  Database,
  ExternalLink,
  Flame,
  FlaskConical,
  Focus,
  GraduationCap,
  Headphones,
  Home,
  Layers3,
  Play,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Volume2,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NorthCoachSymbol } from "@/components/north/north-coach-symbol";
import { cn } from "@/lib/utils";
import { startPlanorthTour } from "./guide-tour-modal";

const guideTabs = [
  {
    tab: "Bugün (Ana Sayfa)",
    route: "/",
    icon: Home,
    color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    summary: "Günün tek ana önceliği, sabah/akşam ritüelleri ve hızlı kısayollar.",
    points: [
      {
        title: "Büyük 'ŞİMDİ' Odak Kartı",
        desc: "Sistem günün saatine, enerjine ve hedeflerine göre üzerinde çalışman gereken tek görevi büyük bir kart olarak sunar. Karar yorgunluğu yaşamazsın.",
      },
      {
        title: "Sabah Pusulası (Ritüel)",
        desc: "Her sabah 2 dakikada günün niyetini ve tek ana görevini belirle. Günün yönü henüz başlamadan netleşir.",
      },
      {
        title: "Günü Kapat (Ritüel)",
        desc: "Akşam çalışmayı bitirirken borç hissetmeden günü kapat. Yetişmeyen işleri sonraki güne veya haftalık havuza suçluluk duymadan devret.",
      },
      {
        title: "Günlük Mikro Alışkanlıklar",
        desc: "Su içme, 15 sayfa kitap okuma veya kelime tekrarı gibi mikro alışkanlıklarını zinciri kırmadan takip et.",
      },
      {
        title: "Hızlı Kısayollar",
        desc: "Ana ekrandan tek tıkla 'Alt Konu / Sınav Kampı' başlatabilir veya 'Kaynak ve Kitap Arama' motoruna geçebilirsin.",
      },
    ],
  },
  {
    tab: "Alanlar & Sınav Kampları",
    route: "/areas",
    icon: Layers3,
    color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    summary: "Hedef alanları, vize/final alt konuları ve PDF/ders notu yükleme.",
    points: [
      {
        title: "Kişisel Hedef Alanları",
        desc: "Siber Güvenlik, Yabancı Dil, Yazılım, Tıp, İstatistik, Satranç gibi alanlarını yönet. Her alanın kendi hedefi, seviyesi ve görevleri bulunur.",
      },
      {
        title: "Alt Konu & Sınav Kampı (Topic Sprint)",
        desc: "Üniversitede vize/final haftası veya iş hayatında belirli bir süre içinde öğrenmen gereken bir konu mu var? Bitiş tarihini seçip özel bir kamp başlat.",
      },
      {
        title: "PDF ve Ders Notu Yükleme Entegrasyonu",
        desc: "Ders notunu veya konu PDF'ini yükle; yapay zeka belgeyi inceler, modüllere böler, takvimine sınav etkinliği ekler ve seni hazırlar.",
      },
    ],
  },
  {
    tab: "Haftalık Plan",
    route: "/week",
    icon: ClipboardList,
    color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    summary: "Borçsuz, suçluluksuz esnek akış ve takvime otomatik dağıtım.",
    points: [
      {
        title: "Görev Küçültme (Shrink)",
        desc: "Gözünde büyüyen veya zamanın yetmediği bir görevi suçluluk duymadan tek tıkla yarı yarıya küçültebilirsin.",
      },
      {
        title: "Erteleme (Postpone) & Havuz (Pool)",
        desc: "Görevi başka bir güne kaydırabilir ya da belirli bir güne bağlamadan haftalık havuza alabilirsin.",
      },
      {
        title: "Takvime Akıllı Otomatik Dağıtım",
        desc: "Havuzdaki görevleri 'Yalnızca Hafta Sonu', 'Yalnızca Hafta İçi' veya özel seçtiğin günlerdeki boşluklara tek tıkla dağıt.",
      },
    ],
  },
  {
    tab: "Kaynaklar & Araştırma Merkezi",
    route: "/resources",
    icon: BookOpen,
    color: "text-cyan-500 bg-cyan-500/10 border-cyan-500/20",
    summary: "Web, Libgen, NotebookLM, Kitaplık ve PDF sayfa pinleme.",
    points: [
      {
        title: "Çoklu Kaynak Arama Motoru",
        desc: "Canlı Web araması ve Libgen akademik kütüphane arama motoru ile kitap ve makaleleri doğrudan sistem içinden bul.",
      },
      {
        title: "PDF & Sayfa Pinleme",
        desc: "Kitapların belirli sayfa aralıklarını kaydet, ders notlarının sayfa görüntülerini pinle ve odak ekranında açık tut.",
      },
      {
        title: "AI Kaynak Özeti & NotebookLM Entegrasyonu",
        desc: "Kaynaklardan tek tıkla yapay zeka özeti al; istersen NotebookLM için hazır Markdown dosyasını anında indir.",
      },
    ],
  },
  {
    tab: "Odak Kokpiti",
    route: "/focus",
    icon: Play,
    color: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    summary: "Zen modu, ortam ses mikseri, yan kaynak dock'u ve dikkat kilidi.",
    points: [
      {
        title: "Zen & Kilitli Odak Seansı",
        desc: "Sayacı başlattığında dikkat dağıtıcı tüm arayüz gizlenir. Çoklu sekme kilidi diğer sekmelerde gezinmeni engeller.",
      },
      {
        title: "Ortam Ses Mikseri",
        desc: "Yağmur, fırtına, kafe, şömine, dalga ve beyaz gürültü seslerini dilediğin seviyede karıştırarak derin odaklan.",
      },
      {
        title: "Yan Kaynak Dock'u",
        desc: "Çalışırken tarayıcı sekmeleri arasında kaybolma; görevinle ilgili PDF'leri, web bağlantılarını ve notları yan panelde incele.",
      },
    ],
  },
  {
    tab: "İlerleme & Değerlendirme",
    route: "/progress",
    icon: BarChart3,
    color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
    summary: "5 eksenli radar analizi, odak süreleri ve haftalık pazar ritüeli.",
    points: [
      {
        title: "5 Eksenli Radar Analizi",
        desc: "Gelişimini; Tutarlılık, Derin Odak Süresi, Pratik Çıktı, Çeşitlilik ve Plan Disiplini boyutlarında gerçek verilerle ölç.",
      },
      {
        title: "Haftalık Pazar Kapatma Ritüeli",
        desc: "Hafta sonunda tamamlananları, ertelenenleri, karşılaşılan darboğazı ve gelecek haftanın tek ana önceliğini mühürle.",
      },
      {
        title: "Büyüyen Yol Arkadaşı (Companion)",
        desc: "Her tamamladığın görev ve ulaştığın kilometre taşıyla seviye atlayan sanal yol arkadaşını özelleştir.",
      },
    ],
  },
  {
    tab: "Takvim & Zaman Blokları",
    route: "/calendar",
    icon: CalendarDays,
    color: "text-teal-500 bg-teal-500/10 border-teal-500/20",
    summary: "Ders, iş, kişisel bloklar ve kapasite aşımı koruması.",
    points: [
      {
        title: "Aylık ve Haftalık Zaman Blokları",
        desc: "Okul derslerini, hastane veya şirket mesailerini takvime gir. Sistem o saatlere görev yazılmasını engeller.",
      },
      {
        title: "Aşırı Yüklenme Koruması",
        desc: "Günlük kapasiteni aşan durumlarda sistem seni uyarır ve görevleri nazikçe diğer günlere kaydırır.",
      },
    ],
  },
  {
    tab: "Portföy, Lablar & Sertifikalar",
    route: "/evidence",
    icon: Briefcase,
    color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    summary: "Doğrulanabilir kanıtlar, teknik hata günlüğü ve sertifika takibi.",
    points: [
      {
        title: "Portföy & Kanıtlar (/evidence)",
        desc: "Tamamladığın projeleri, yazdığın kodları veya makaleleri kanıt olarak kaydet.",
      },
      {
        title: "Pratik Lab Günlüğü (/labs)",
        desc: "Zorlandığın problemleri, takıldığın yerleri ve ulaştığın bağımsız çözümleri lab günlüğüne işle.",
      },
      {
        title: "Sertifika Planlayıcı (/certifications)",
        desc: "Hedeflediğin sertifikaları, resmi çalışma kaynaklarını ve müfredat konularını takip et.",
      },
    ],
  },
  {
    tab: "Planorth AI Koç",
    route: "/coach",
    icon: Sparkles,
    color: "text-primary bg-primary/10 border-primary/20",
    summary: "Planını koruyan, hafızalı ve proaktif kişisel rehber.",
    points: [
      {
        title: "Hafıza & Geri Bildirim Kuralları",
        desc: "Koç'a söylediğin kurallar (örn: 'Pazartesi sabahları hafif görev ver', 'Gece soru çözümü koyma') kalıcı hafızaya kaydedilir.",
      },
      {
        title: "Kayan Koç Butonu",
        desc: "Herhangi bir sayfadayken sağ alttaki simgeye dokunarak Koç ile konuşabilir, anında tavsiye veya plan revizyonu alabilirsin.",
      },
    ],
  },
];

const philosophyRules = [
  {
    title: "1. Tek Anlamlı Öncelik Kuralı",
    desc: "Aynı anda 5 farklı işle uğraşmak derinleşmeyi engeller. Planorth o an sadece tek bir görevi önüne getirir.",
  },
  {
    title: "2. Suçluluksuz ve Borçsuz Akış",
    desc: "Hayat beklenmedik durumlarla doludur. Planına sadık kalamadığında görev borcu birikmez; sistem nazikçe yeniden hizalar.",
  },
  {
    title: "3. Kanıta Dayalı İlerleme",
    desc: "İlerleme süslü yüzdelerden değil; harcanan gerçek odak dakikalarından, çözülen lablardan ve somut kanıtlardan gelir.",
  },
  {
    title: "4. Tam Veri Bağımsızlığı",
    desc: "Tüm verilerini dilediğin an JSON olarak indirebilir veya silebilirsin. Asla izinsiz üçüncü taraflarla paylaşılmaz.",
  },
];

const readyCommands = [
  "“Bugün için bana tek bir ana öncelik belirle.”",
  "“Bu görevi tamamlayamadım, lütfen yarı yarıya küçült.”",
  "“Son bir haftalık odak verilerimi ve tutarlılığımı analiz et.”",
  "“Önümüzdeki vize sınavım için elimdeki ders notlarını incele ve 2 haftalık kamp kur.”",
  "“Geceleri odaklanmakta zorlanıyorum, akşam saatlerine yalnızca hafif okuma koy.”",
];

export function UserGuide() {
  return (
    <div className="space-y-6">
      {/* 1. HERO & INTERACTIVE TOUR CALLOUT BANNER */}
      <Card className="border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-background overflow-hidden relative shadow-lg">
        <div className="absolute -top-20 -right-20 size-60 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-2xl bg-primary text-primary-foreground grid place-items-center shrink-0 shadow-md">
                <NorthCoachSymbol size={24} variant="symbol" />
              </div>
              <div>
                <CardTitle className="text-lg sm:text-xl font-extrabold text-foreground">
                  Planorth Sistem &amp; Kullanım Kılavuzu
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Tüm sekmelerin, ritüellerin ve yapay zeka koçluk sisteminin ayrıntılı rehberi.
                </CardDescription>
              </div>
            </div>
            <Button
              type="button"
              onClick={() => startPlanorthTour(0)}
              className="rounded-xl font-bold shadow-md h-10 px-4 text-xs gap-2 shrink-0 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Sparkles className="size-4 animate-pulse" />
              Adım Adım İnteraktif Turu Başlat
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-1">
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Aşağıda sistemin her bir sekmesinin ve modülünün nasıl çalıştığını yazılı olarak inceleyebilir, ihtiyaç duydukça geri dönebilir veya yukarıdaki butonla interaktif görsel turu yeniden izleyebilirsin.
          </p>
        </CardContent>
      </Card>

      {/* 2. TAB-BY-TAB COMPREHENSIVE GUIDE GRID */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Compass className="size-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
              Sekme Sekme Sistem Rehberi
            </h2>
          </div>
          <span className="text-xs text-muted-foreground font-mono">9 Bölüm</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {guideTabs.map((item, index) => {
            const ItemIcon = item.icon;
            return (
              <Card key={item.tab} className="border border-border/80 bg-card hover:border-primary/40 transition-all flex flex-col justify-between">
                <CardHeader className="pb-2.5">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className={cn("size-8 rounded-xl border grid place-items-center shrink-0", item.color)}>
                      <ItemIcon className="size-4" />
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      #{index + 1}
                    </Badge>
                  </div>
                  <CardTitle className="text-sm font-bold text-foreground flex items-center justify-between">
                    <span>{item.tab}</span>
                  </CardTitle>
                  <CardDescription className="text-xs line-clamp-2">
                    {item.summary}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-xs pt-1">
                  <div className="space-y-2 border-t border-border/50 pt-2.5">
                    {item.points.map((pt, pIdx) => (
                      <div key={pIdx} className="space-y-0.5">
                        <p className="font-semibold text-foreground text-[11px] flex items-center gap-1.5">
                          <Check className="size-3 text-primary shrink-0" />
                          {pt.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground leading-relaxed pl-4">
                          {pt.desc}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                    <Button asChild variant="ghost" size="xs" className="text-[11px] h-7 px-2 text-primary">
                      <Link href={item.route}>
                        Sekmeye Git <ArrowRight className="size-3 ml-1" />
                      </Link>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={() => startPlanorthTour(index === 0 ? 1 : index + 1)}
                      className="text-[10px] h-7 px-2 text-muted-foreground hover:text-foreground"
                    >
                      Turu Buradan Aç
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* 3. PHILOSOPHY MANIFESTO & READY COMMANDS */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* PHILOSOPHY */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <Target className="size-4 text-primary" /> Planorth Felsefesi &amp; Kuralları
            </CardTitle>
            <CardDescription className="text-xs">
              Sistemi diğer üretkenlik araçlarından ayıran 4 temel ilke.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {philosophyRules.map((rule) => (
              <div key={rule.title} className="rounded-xl border bg-muted/20 p-3 space-y-1">
                <h4 className="text-xs font-bold text-foreground">{rule.title}</h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{rule.desc}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* READY COMMANDS & RHYTHM */}
        <div className="space-y-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <Sparkles className="size-4 text-primary" /> Planorth Koç Hazır Komutları
              </CardTitle>
              <CardDescription className="text-xs">
                Koç ile konuşurken bu cümleleri doğrudan kullanabilirsin.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {readyCommands.map((cmd, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-border/70 bg-muted/20 hover:bg-muted/40 p-2.5 text-xs text-foreground font-medium flex items-center justify-between gap-2"
                >
                  <span className="truncate">{cmd}</span>
                  <Button asChild size="xs" variant="ghost" className="shrink-0 h-6 px-2 text-[10px]">
                    <Link href="/coach">Danış</Link>
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <Clock3 className="size-4 text-primary" /> Önerilen Günlük &amp; Haftalık Ritim
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between border-b border-border/50 pb-2">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Flame className="size-3.5 text-amber-500" /> Her Sabah (2 dk)
                </span>
                <span className="font-semibold text-foreground">Sabah Pusulası ile Tek Öncelik Seç</span>
              </div>
              <div className="flex items-center justify-between border-b border-border/50 pb-2">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Play className="size-3.5 text-emerald-500" /> Çalışma Anında
                </span>
                <span className="font-semibold text-foreground">Odak Kokpiti &amp; Ses Mikseri</span>
              </div>
              <div className="flex items-center justify-between border-b border-border/50 pb-2">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle2 className="size-3.5 text-blue-500" /> Her Akşam (2 dk)
                </span>
                <span className="font-semibold text-foreground">Günü Kapat &amp; Suçluluksuz Devret</span>
              </div>
              <div className="flex items-center justify-between pt-0.5">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Compass className="size-3.5 text-purple-500" /> Her Pazar (10 dk)
                </span>
                <span className="font-semibold text-foreground">Pazar Değerlendirme Ritüeli</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
