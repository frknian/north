"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpen,
  Briefcase,
  CalendarDays,
  Check,
  CheckCircle2,
  CircleHelp,
  ClipboardList,
  Compass,
  ExternalLink,
  Flame,
  FlaskConical,
  GraduationCap,
  Headphones,
  Home,
  Layers3,
  Play,
  Search,
  Sparkles,
  Target,
  Volume2,
  X,
  Zap,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { NorthLogo } from "@/components/layout/north-logo";
import { NorthCoachSymbol } from "@/components/north/north-coach-symbol";
import { cn } from "@/lib/utils";

export const TOUR_STORAGE_KEY = "planorth_tour_completed_v2";

export interface TourStep {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  features: { title: string; desc: string; icon?: React.ComponentType<{ className?: string }> }[];
  tip?: string;
  actionRoute?: string;
  actionLabel?: string;
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    badge: "BAŞLANGIÇ & FELSEFE",
    title: "Planorth'a Hoş Geldin!",
    subtitle: "Daha az karar. Daha derin odak. Sıfır suçluluk hissi.",
    icon: Sparkles,
    accentColor: "from-blue-500/20 to-indigo-500/20 border-blue-500/30 text-blue-500",
    features: [
      {
        title: "Tek Anlamlı Adım Kuralı",
        desc: "Klasik yapılacaklar listeleri her gün ertelenen onlarca görevle suçluluk yaratır. Planorth sana her an sadece yapman gereken sıradaki TEK görevi gösterir.",
        icon: Target,
      },
      {
        title: "Borçsuz ve Suçluluksuz Akış",
        desc: "Yetişmeyen görevler borç olmaz; yapay zeka ile otomatik küçültülür, ertelenir veya haftalık havuza alınır.",
        icon: Compass,
      },
      {
        title: "Kanıta Dayalı Gelişim",
        desc: "Soyut hedefler yerine çözülen lablar, okunan kitaplar, tamamlanan projeler ve doğrulanabilir kanıtlar tutulur.",
        icon: CheckCircle2,
      },
    ],
    tip: "Bu 1 dakikalık hızlı rehberde tüm sekmelerin çalışma mantığını keşfedeceksin.",
  },
  {
    id: "today",
    badge: "1. SEKME: BUGÜN",
    title: "Bugün Ekranı: Günlük Odak Merkezin",
    subtitle: "Güne niyetle başla, tek göreve odaklan, günü borçsuz kapat.",
    icon: Home,
    accentColor: "from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-500",
    features: [
      {
        title: "Büyük 'ŞİMDİ' Odak Kartı",
        desc: "Kararsız kalma; o an üzerinde çalışman gereken görev, hedef ve süre büyük bir kart olarak karşına çıkar.",
        icon: Zap,
      },
      {
        title: "Sabah Pusulası & Günü Kapat",
        desc: "Sabah 2 dakikada günün ana önceliğini mühürle; akşam günün muhasebesini yapıp ertelenenleri borç hissetmeden sonraki güne devret.",
        icon: Compass,
      },
      {
        title: "Günlük Mikro Alışkanlıklar & Kısayollar",
        desc: "Günlük su, okuma veya kısa tekrar zincirlerini tek tıkla işaretle. Hızlı kısayollardan sınav kampı veya kaynak arama başlat.",
        icon: Flame,
      },
    ],
    tip: "Masaüstünde tek ekranda scrollsüz duracak şekilde tasarlanmıştır; mobilde ise tam ergonomiktir.",
    actionRoute: "/",
    actionLabel: "Bugün Ekranına Git",
  },
  {
    id: "areas",
    badge: "2. SEKME: ALANLAR & SINAV KAMPI",
    title: "Hedef Alanları & Alt Konu/Sınav Kampları",
    subtitle: "Ders notlarını, PDF'leri yükle; sistem analiz edip görevlendirsin.",
    icon: Layers3,
    accentColor: "from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-500",
    features: [
      {
        title: "Kişisel Hedef Alanları",
        desc: "Siber Güvenlik, Dil, Yazılım, Tıp, Matematik veya Kariyer gibi tüm alanlarını tek merkezden yönet.",
        icon: Layers3,
      },
      {
        title: "Alt Konu & Sınav Kampı Başlat",
        desc: "Üniversite vize/final haftası veya iş hayatında yeni bir teknoloji mi var? Bitiş tarihini seç, alt konuyu belirle.",
        icon: GraduationCap,
      },
      {
        title: "PDF ve Ders Notu Yükleme Entegrasyonu",
        desc: "Elindeki PDF veya ders notlarını yükle; sistem belgeyi anlayıp modüllere böler, takvime sınav etkinliği ekler ve seni hazırlar.",
        icon: BookOpen,
      },
    ],
    tip: "Aktif bir kamp başlattığında Bugün ekranının en üstünde geri sayım ve modül ilerleme şeridi belirir.",
    actionRoute: "/areas",
    actionLabel: "Alanlar Sekmesini Aç",
  },
  {
    id: "week",
    badge: "3. SEKME: HAFTALIK PLAN",
    title: "Plan: Esnek ve Borçsuz Akış",
    subtitle: "Kapasiteni aşmayan, suçluluk hissettirmeyen haftalık planlama.",
    icon: ClipboardList,
    accentColor: "from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-500",
    features: [
      {
        title: "Görev Küçültme (Shrink) & Erteleme (Postpone)",
        desc: "Gözünde büyüyen bir görevi tek tıkla yarı yarıya küçültebilir veya borç hissetmeden başka güne aktarabilirsin.",
        icon: Zap,
      },
      {
        title: "Haftalık Görev Havuzu (Pool)",
        desc: "Belirli bir güne bağlı kalmak istemediğin işleri havuza at; vaktin olunca çek.",
        icon: ClipboardList,
      },
      {
        title: "Takvime Akıllı Otomatik Dağıt",
        desc: "Havuzdaki görevleri 'Yalnızca Hafta Sonu', 'Hafta İçi Akşamları' gibi tercihlerine göre takvimindeki boşluklara dağıt.",
        icon: CalendarDays,
      },
    ],
    tip: "Haftalık planını yaparken gün başına kapasite sınırını aşmamaya dikkat et; sistem seni korur.",
    actionRoute: "/week",
    actionLabel: "Haftalık Planı Aç",
  },
  {
    id: "resources",
    badge: "4. SEKME: KAYNAKLAR",
    title: "Kaynaklar & Araştırma Merkezi",
    subtitle: "Web, Libgen, NotebookLM, Kitaplık ve PDF sayfa pinleme.",
    icon: BookOpen,
    accentColor: "from-cyan-500/20 to-blue-500/20 border-cyan-500/30 text-cyan-500",
    features: [
      {
        title: "Çoklu Kaynak Arama Motoru",
        desc: "Canlı Web araması ve Libgen akademik kitap arama entegrasyonu ile kaynaklarını doğrudan sistem içinden bul.",
        icon: Search,
      },
      {
        title: "PDF & Kitap Sayfası Pinleme",
        desc: "Okuduğun kitabın veya belgenin belirli sayfa aralıklarını kaydet, sayfa ekran görüntüsünü pinle.",
        icon: BookOpen,
      },
      {
        title: "AI Kaynak Özeti & NotebookLM",
        desc: "Eklediğin kaynaklardan tek tıkla yapay zeka özeti çıkart veya doğrudan NotebookLM export markdown dosyası indir.",
        icon: Sparkles,
      },
    ],
    tip: "Bulduğun kitap ve kaynakları Odak Kokpitindeki yan panelde çalışırken anında açabilirsin.",
    actionRoute: "/resources",
    actionLabel: "Kaynaklar Merkezini Aç",
  },
  {
    id: "focus",
    badge: "5. ÖZELLİK: ODAK KOKPİTİ",
    title: "Odak Kokpiti & Dikkat Koruma",
    subtitle: "Zen modu, ortam ses mikseri, kaynak paneli ve sekme kilidi.",
    icon: Play,
    accentColor: "from-rose-500/20 to-red-500/20 border-rose-500/30 text-rose-500",
    features: [
      {
        title: "Zen & Kilitli Odak Modu",
        desc: "Sayacı başlattığında tüm dikkat dağıtıcılar gizlenir. Çoklu sekme kilidi diğer sekmelere geçişini önler.",
        icon: Play,
      },
      {
        title: "Ortam Ses Mikseri",
        desc: "Yağmur, fırtına, kafe, şömine, dalga ve beyaz gürültü seslerini dilediğin seviyede karıştırarak dinle.",
        icon: Volume2,
      },
      {
        title: "Yan Kaynak Dock'u (Entegre Okuma)",
        desc: "Sekme değiştirmeden görevinle ilgili web bağlantılarını, PDF sayfalarını veya notlarını sağ panelde incele.",
        icon: BookOpen,
      },
    ],
    tip: "Görevin yoksa bile Bugün ekranından 'Serbest Odak' veya 'Kitap Okuma Odağı' başlatabilirsin.",
  },
  {
    id: "progress",
    badge: "6. SEKME: İLERLEME & DEĞERLENDİRME",
    title: "İlerleme, Radar Analizi & Ritüeller",
    subtitle: "Gerçek odak süreleri, radar grafiği ve pazar değerlendirmesi.",
    icon: BarChart3,
    accentColor: "from-indigo-500/20 to-violet-500/20 border-indigo-500/30 text-indigo-500",
    features: [
      {
        title: "5 Eksenli Radar Analizi",
        desc: "Tutarlılık, Derin Odak, Pratik Çıktı, Çeşitlilik ve Plan Disiplini eksenlerinde gerçek gelişimini gör.",
        icon: BarChart3,
      },
      {
        title: "Haftalık Pazar Kapatma Ritüeli",
        desc: "Her pazar haftanın analizini yap; nerede tıkandığını, neyi başardığını ve haftanın ana dersini kaydet.",
        icon: Compass,
      },
      {
        title: "Büyüyen Yol Arkadaşı (Companion)",
        desc: "Tamamladığın görevler ve hedeflerle seviye atlayan, seni motive eden sanal yol arkadaşın.",
        icon: Sparkles,
      },
    ],
    tip: "İlerleme ekranı Değerlendirmeler ile birleştirilmiştir; tek sayfada hem analiz hem ritüel sunar.",
    actionRoute: "/progress",
    actionLabel: "İlerleme Sekmesini Aç",
  },
  {
    id: "tools",
    badge: "7. EK ARAÇLAR: TAKVİM, LAB & KANIT",
    title: "Takvim, Sanal Lablar ve Portföy",
    subtitle: "Zaman blokları koruması, pratik problem günlüğü ve somut çıktılar.",
    icon: CalendarDays,
    accentColor: "from-teal-500/20 to-emerald-500/20 border-teal-500/30 text-teal-500",
    features: [
      {
        title: "Takvim & Zaman Blokları (/calendar)",
        desc: "Ders ve çalışma saatlerini blokla; sistem aşırı yüklenmeni önleyecek şekilde günlerini korur.",
        icon: CalendarDays,
      },
      {
        title: "Portföy & Kanıtlar (/evidence)",
        desc: "Ürettiğin kodları, sunumları, sertifikaları ve belgeleri somut kanıt havuzunda topla.",
        icon: Briefcase,
      },
      {
        title: "Pratik Lab Günlüğü & Sertifikalar (/labs, /certifications)",
        desc: "Takıldığın teknik problemleri, çözümleri ve sertifika sınav konularını adım adım takip et.",
        icon: FlaskConical,
      },
    ],
    tip: "Bu araçlara masaüstünde üst bardan, mobilde ise sağ alttaki 'Menü' sekmesinden tek dokunuşla ulaşabilirsin.",
  },
  {
    id: "coach",
    badge: "8. YOL ARKADAŞIN: PLANORTH KOÇ",
    title: "Planorth AI Koç: Stratejik Rehberin",
    subtitle: "Sıradan bir chatbot değil; planını koruyan, hafızalı kişisel mentor.",
    icon: Sparkles,
    accentColor: "from-blue-600/20 to-indigo-600/20 border-blue-500/40 text-blue-600 dark:text-blue-400",
    features: [
      {
        title: "Hafıza & Geri Bildirim Kuralları",
        desc: "Koç senin çalışma alışkanlıklarını hatırlar. Örneğin: 'Gece saatlerine zor soru koyma' dediğinde bunu kural olarak kaydeder.",
        icon: Sparkles,
      },
      {
        title: "Her An Yanında (Kayan Koç Butonu)",
        desc: "Hangi sayfada olursan ol sağ alttaki simgeye dokunarak anında Koç'a danışabilir, planını güncelletebilirsin.",
        icon: Headphones,
      },
      {
        title: "Profil & Yazılı Kılavuz",
        desc: "Bu kullanım kılavuzuna dilediğin an 'Profil > Kılavuz' sekmesinden yazılı olarak da ulaşabilirsin.",
        icon: CircleHelp,
      },
    ],
    tip: "Artık hazırsın! Planorth ile sıradaki anlamlı adımını atmaya başlayabilirsin.",
    actionRoute: "/",
    actionLabel: "Planorth'u Kullanmaya Başla",
  },
];

export function GuideTourModal({
  open: controlledOpen,
  onOpenChange,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
} = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const setOpen = (val: boolean) => {
    if (!isControlled) setInternalOpen(val);
    onOpenChange?.(val);
  };

  // Check on mount if first time user
  useEffect(() => {
    if (isControlled) return;
    try {
      const seen = localStorage.getItem(TOUR_STORAGE_KEY);
      if (!seen) {
        const timer = window.setTimeout(() => {
          setInternalOpen(true);
        }, 800);
        return () => window.clearTimeout(timer);
      }
    } catch {}
  }, [isControlled]);

  // Listen for global custom event to trigger tour from anywhere
  useEffect(() => {
    const handleTrigger = (e: Event) => {
      const customEvent = e as CustomEvent;
      const startStep = customEvent.detail?.step ?? 0;
      setCurrentStep(startStep);
      setOpen(true);
    };
    window.addEventListener("open-planorth-tour", handleTrigger);
    return () => {
      window.removeEventListener("open-planorth-tour", handleTrigger);
    };
  }, []);

  const handleFinish = () => {
    try {
      localStorage.setItem(TOUR_STORAGE_KEY, "true");
    } catch {}
    setOpen(false);
  };

  const stepData = TOUR_STEPS[currentStep] ?? TOUR_STEPS[0];
  const StepIcon = stepData.icon;
  const isFirst = currentStep === 0;
  const isLast = currentStep === TOUR_STEPS.length - 1;
  const progressPercent = Math.round(((currentStep + 1) / TOUR_STEPS.length) * 100);

  return (
    <Dialog open={open} onOpenChange={(v) => {
      if (!v) handleFinish();
      else setOpen(true);
    }}>
      <DialogContent className="max-w-xl w-[calc(100vw-2rem)] p-0 rounded-3xl overflow-hidden border border-border/80 bg-card shadow-2xl backdrop-blur-md">
        {/* TOP BAR / PROGRESS HEADER */}
        <div className="px-5 pt-5 pb-3 border-b border-border/60 bg-muted/20">
          <div className="flex items-center justify-between gap-3 mb-2.5">
            <div className="flex items-center gap-2">
              <NorthLogo size={26} />
              <span className="font-planorth text-xs tracking-wider text-foreground">PLANORTH KULLANIM REHBERİ</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold text-muted-foreground">
                {currentStep + 1} / {TOUR_STEPS.length}
              </span>
              <button
                type="button"
                onClick={handleFinish}
                className="size-7 rounded-full bg-muted/50 hover:bg-muted grid place-items-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                aria-label="Turu kapat"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>
          <Progress value={progressPercent} className="h-1.5 bg-muted" />
        </div>

        {/* STEP CONTENT BODY */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[70dvh] overflow-y-auto">
          {/* STEP HERO */}
          <div className="flex items-start gap-3.5">
            <div className={cn("size-12 rounded-2xl border p-2.5 shrink-0 bg-gradient-to-br flex items-center justify-center shadow-xs", stepData.accentColor)}>
              <StepIcon className="size-6" />
            </div>
            <div className="min-w-0">
              <Badge variant="outline" className="text-[10px] font-bold tracking-wider uppercase mb-1">
                {stepData.badge}
              </Badge>
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-foreground leading-snug">
                {stepData.title}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {stepData.subtitle}
              </p>
            </div>
          </div>

          {/* FEATURE CARDS LIST */}
          <div className="space-y-2.5 pt-1">
            {stepData.features.map((feat, idx) => {
              const FeatIcon = feat.icon ?? Check;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-border/60 bg-muted/20 hover:bg-muted/40 p-3 sm:p-3.5 transition-colors flex items-start gap-3"
                >
                  <div className="size-7 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0 mt-0.5">
                    <FeatIcon className="size-3.5" />
                  </div>
                  <div className="min-w-0 text-left">
                    <h3 className="text-xs font-bold text-foreground">{feat.title}</h3>
                    <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">{feat.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* PRO TIP CALLOUT */}
          {stepData.tip && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-2.5 text-xs text-foreground flex items-start gap-2.5">
              <Sparkles className="size-4 text-primary shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-normal">
                <strong className="text-foreground font-semibold">İpucu: </strong>
                {stepData.tip}
              </p>
            </div>
          )}
        </div>

        {/* STEPPER FOOTER CONTROLS */}
        <DialogFooter className="p-4 border-t border-border/60 bg-muted/10 flex flex-row items-center justify-between sm:justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setCurrentStep((c) => Math.max(0, c - 1))}
            disabled={isFirst}
            className="rounded-xl text-xs h-9 px-3 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5 mr-1" /> Geri
          </Button>

          {/* STEP INDICATOR DOTS (CLICKABLE) */}
          <div className="hidden sm:flex items-center gap-1">
            {TOUR_STEPS.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrentStep(i)}
                className={cn(
                  "size-2 rounded-full transition-all cursor-pointer",
                  i === currentStep
                    ? "w-5 bg-primary"
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/60"
                )}
                aria-label={`Adım ${i + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {!isLast ? (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleFinish}
                  className="rounded-xl text-[11px] h-9 px-2 text-muted-foreground hover:text-foreground hidden xs:inline-flex"
                >
                  Turu Geç
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setCurrentStep((c) => Math.min(TOUR_STEPS.length - 1, c + 1))}
                  className="rounded-xl text-xs font-semibold h-9 px-4 shadow-xs"
                >
                  Sonraki <ArrowRight className="size-3.5 ml-1" />
                </Button>
              </>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={handleFinish}
                className="rounded-xl text-xs font-bold h-9 px-5 shadow-sm bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Check className="size-3.5 mr-1.5" /> Anladım, Başla
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function startPlanorthTour(stepIndex = 0) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("open-planorth-tour", { detail: { step: stepIndex } }));
  }
}
