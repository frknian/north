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
  X,
  Zap,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { NorthLogo } from "@/components/layout/north-logo";
import { cn } from "@/lib/utils";

export const TOUR_STORAGE_KEY = "planorth_tour_completed_v3";

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
    badge: "BAŞLANGIÇ",
    title: "Planorth'a Hoş Geldin!",
    subtitle: "Daha az karar. Daha derin odak. Sıfır suçluluk hissi.",
    icon: Sparkles,
    accentColor: "from-blue-500/20 to-indigo-500/20 border-blue-500/30 text-blue-500",
    features: [
      { title: "Tek anlamlı adım", desc: "Planorth her an yalnızca yapman gereken sıradaki işi gösterir; onlarca maddelik listeler yok.", icon: Target },
      { title: "Borçsuz akış", desc: "Yetişmeyen görevler suçluluk olmaz; küçültülür, ertelenir ya da haftalık havuza alınır.", icon: Compass },
      { title: "Gerçek ilerleme", desc: "Yalnızca tamamladığın işler sayılır: odak süresi, bitirilen görevler, kanıtlar ve seri.", icon: CheckCircle2 },
    ],
    tip: "Bu kısa tur yaklaşık 2 dakika sürer. İstediğin zaman Ayarlar → Kılavuz'dan yeniden açabilirsin.",
  },
  {
    id: "navigation",
    badge: "GEZİNME",
    title: "Kenar çubuğu, arama ve ayarlar",
    subtitle: "Her şey sol menüde gruplanmış durumda.",
    icon: Layers3,
    accentColor: "from-slate-500/20 to-zinc-500/20 border-slate-500/30 text-slate-400",
    features: [
      { title: "Üç grup", desc: "Çalışma (Bugün, Koç, Plan, Yol Haritam), Öğrenme (Alanlar, Kütüphane, Kaynaklar, Lablar, Portföy) ve Takip (İlerleme, Takvim, Arkadaşlar, Birlikte Odak).", icon: Layers3 },
      { title: "Ara veya git (⌘K)", desc: "Üstteki arama kutusu görev, kaynak, not ve ekranlara anında götürür. Telefonda alt çubuktaki Menü tüm sayfaları açar.", icon: Search },
      { title: "Ayarlar", desc: "Profil, hesap ve güvenlik, bildirimler, yapay zekâ hafızası, kullanım hakların, veri yedeği ve uygulamayı yükleme tek yerde.", icon: CircleHelp },
    ],
    tip: "Sol menüyü ‹‹ düğmesiyle daraltabilirsin; dar ekranlarda otomatik ikon çubuğuna dönüşür.",
  },
  {
    id: "today",
    badge: "BUGÜN",
    title: "Bugün ekranı: tek ekranda günün özeti",
    subtitle: "Güne niyetle başla, tek göreve odaklan, günü borçsuz kapat.",
    icon: Home,
    accentColor: "from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-500",
    features: [
      { title: "Büyük “Şimdi” kartı", desc: "Üzerinde çalışman gereken görev, hedef ve süre karşına çıkar. “Odaklanmaya başla” ile oturumu aç.", icon: Zap },
      { title: "Günün ilerlemesi", desc: "Tamamlanan, sıradaki ve kalan odak süren tek bir şeritte. Masaüstünde kaydırma gerekmez.", icon: BarChart3 },
      { title: "Sabah Pusulası ve Günü Kapat", desc: "Sabah önceliğini seç, akşam ertelenenleri suçluluk hissetmeden sonraki güne devret.", icon: Flame },
    ],
    tip: "Telefonda ilk ekranda selamlama, ilerleme ve “Şimdi” kartı görünür; kısayollar aşağıda.",
    actionRoute: "/",
    actionLabel: "Bugün ekranına git",
  },
  {
    id: "roadmap",
    badge: "YOL HARİTAM",
    title: "Koç yol haritanı yazsın",
    subtitle: "Sıfırdan plan yazmana gerek yok.",
    icon: Sparkles,
    accentColor: "from-violet-500/20 to-indigo-500/20 border-violet-500/30 text-violet-500",
    features: [
      { title: "Koç ile oluştur", desc: "Hedefini, seviyeni, süreni ve hedef tarihini yaz; Planorth Koç haftalık planı hazırlasın. Beğenmezsen değişiklik iste.", icon: Sparkles },
      { title: "Dosya, metin veya başka yapay zekâ", desc: "JSON, CSV, Markdown ya da düz metin yükle; ChatGPT veya Gemini'nin çıktısını yapıştır, Planorth okuyup plana çevirsin.", icon: ClipboardList },
      { title: "Haftayı başlat ve yay", desc: "Seçtiğin haftanın görevleri günlere dengeli dağıtılır; Alanlar ile eşleştirerek tek yerden takip edersin.", icon: Play },
    ],
    tip: "Koç ile plan oluşturma hakkın günlük sınırlıdır; kalan hakkını ekranda ve Ayarlar → Kullanım hakların'da görürsün.",
    actionRoute: "/roadmap",
    actionLabel: "Yol haritama git",
  },
  {
    id: "week",
    badge: "PLAN VE TAKVİM",
    title: "Haftalık plan ve takvim",
    subtitle: "Görevlerin hangi gün, ne kadar süreyle yapılacağını gör.",
    icon: CalendarDays,
    accentColor: "from-orange-500/20 to-amber-500/20 border-orange-500/30 text-orange-500",
    features: [
      { title: "Gün gün akış", desc: "Haftalık kapasiteni, tamamlanma oranını ve her günün yükünü gör; görevleri günlere sürükle ya da otomatik dağıt.", icon: ClipboardList },
      { title: "Takvim ve zaman blokları", desc: "Ders, vardiya ve sınavlarını ekle; Planorth görevleri bu bloklara çarpmayacak şekilde yerleştirir.", icon: CalendarDays },
      { title: "Takvime aktar ve hatırlatıcı", desc: ".ics ile planını Google, Apple veya Outlook takvimine ekle. Ayarlar → Bildirimler'den günlük hatırlatıcı kur.", icon: Flame },
    ],
    tip: "Dinlenme günlerini seçebilirsin; o gündeki görevler diğer günlere aktarılır.",
    actionRoute: "/week",
    actionLabel: "Planı aç",
  },
  {
    id: "areas",
    badge: "ALANLAR",
    title: "Hedef alanları, sınav takvimi ve seviye testi",
    subtitle: "Her hedefin kendi çalışma alanı olsun.",
    icon: GraduationCap,
    accentColor: "from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-500",
    features: [
      { title: "Sınav takvimi", desc: "Sınav tarihini gir; kalan haftalar aşamalara bölünür, dersler zayıflığına göre süre alır, denemeler planlanır ve görevler takvimine eklenir.", icon: GraduationCap },
      { title: "Seviye testi", desc: "Cevaplarına göre zorluğu ayarlayan 12 soruluk test; sonunda konu bazlı güçlü ve zayıf yönlerin çıkar, zayıf konular için tek tıkla görev eklenir.", icon: Target },
      { title: "Alt konu ve sınav kampı", desc: "Vize, final ya da yeni bir teknoloji için bitiş tarihli kamp başlat; ders notu veya PDF'inden modüller çıkarılır.", icon: BookOpen },
    ],
    tip: "Sınav takvimi ve seviye testi, ilgili alanın detay sayfasındadır.",
    actionRoute: "/areas",
    actionLabel: "Alanları aç",
  },
  {
    id: "focus",
    badge: "ODAK OTURUMU",
    title: "Odak oturumu: tek ekranda çalışma masan",
    subtitle: "Zamanlayıcı, adımlar, notlar ve kaynaklar bir arada.",
    icon: Zap,
    accentColor: "from-rose-500/20 to-red-500/20 border-rose-500/30 text-rose-500",
    features: [
      { title: "Zamanlayıcı ve adımlar", desc: "Görevin somut adımlarını işaretle, süreyi esnet, gerekirse küçült.", icon: Zap },
      { title: "Notlar, kaynaklar ve ses", desc: "Canlı not defteri, kaynak masası, ortam sesi ve müzik mikseri; dikkatin dağılırsa “aklındakini dök”.", icon: Headphones },
      { title: "Çıktını kaydet", desc: "Oturum sonunda ne yaptığını yaz; kanıt olarak ilerlemene ve portföyüne eklenir.", icon: CheckCircle2 },
    ],
    tip: "Serbest odak ve kitap okuma oturumlarını görev olmadan da başlatabilirsin.",
  },
  {
    id: "coach",
    badge: "PLANORTH KOÇ",
    title: "Koç ile konuş, planını birlikte düzenleyin",
    subtitle: "Takıldığında, motivasyonun düştüğünde ya da planı değiştirmek istediğinde.",
    icon: Sparkles,
    accentColor: "from-cyan-500/20 to-blue-500/20 border-cyan-500/30 text-cyan-500",
    features: [
      { title: "Kişisel koçluk", desc: "Enerji seviyene ve hedefine göre bugün için en kritik tek işi önerir, görevleri küçültür veya ertelemeni önerir.", icon: Sparkles },
      { title: "Planı değiştir, geri al", desc: "Koçun önerdiği görev değişikliklerini onaylarsın; yaptığın değişiklikleri geri alabilirsin.", icon: Compass },
      { title: "Hakların açık", desc: "Yapay zekâ araçlarının günlük kalan hakkı Ayarlar → Kullanım hakların'da görünür.", icon: BarChart3 },
    ],
    tip: "Koç kişisel hafızana göre çalışır; hafızayı Ayarlar → Koç hafızası ve sohbet'ten yönetebilirsin.",
    actionRoute: "/coach",
    actionLabel: "Koça git",
  },
  {
    id: "library",
    badge: "KÜTÜPHANE VE KAYNAKLAR",
    title: "Notların, kitapların ve kaynakların",
    subtitle: "Öğrendiğini kaydet, doğru zamanda tekrar et.",
    icon: BookOpen,
    accentColor: "from-teal-500/20 to-emerald-500/20 border-teal-500/30 text-teal-500",
    features: [
      { title: "Kütüphane", desc: "Notlarını kaydet; aralıklı tekrar sistemi unutma eğrisine göre ne zaman tekrar edeceğini söyler.", icon: BookOpen },
      { title: "Kaynaklar ve okuma rafı", desc: "Kitap, PDF ve web kaynaklarını ara, kaydet, okuma ilerlemeni takip et.", icon: Search },
      { title: "Lablar ve portföy", desc: "Pratik çalışmalarını ve çıktılarını kaydet; doğrulanabilir kanıtlar portföyünde birikir.", icon: FlaskConical },
    ],
    tip: "⌘K aramasıyla notlarında ve kaynaklarında anında arama yapabilirsin.",
    actionRoute: "/knowledge",
    actionLabel: "Kütüphaneyi aç",
  },
  {
    id: "progress",
    badge: "İLERLEME",
    title: "Gelişimini dürüstçe gör",
    subtitle: "Süreler ve çıktılar gerçek kayıtlarından gelir.",
    icon: BarChart3,
    accentColor: "from-sky-500/20 to-cyan-500/20 border-sky-500/30 text-sky-500",
    features: [
      { title: "İstatistikler", desc: "Haftalık ve aylık odak süren, tamamlanan görevler, aktif gün ve tutarlılık skorun.", icon: BarChart3 },
      { title: "Davranışsal öğrenme", desc: "Planorth hangi saatlerde ve hangi sürelerle daha verimli çalıştığını öğrenir ve öneriler sunar.", icon: Compass },
      { title: "Başarı karnesi", desc: "Seviye testi sonuçların, rozetlerin ve portföy çıktıların tek yerde.", icon: Briefcase },
    ],
    tip: "Seri, bir gün en az bir görev bitirdiğinde ilerler.",
    actionRoute: "/progress",
    actionLabel: "İlerlemeyi gör",
  },
  {
    id: "together",
    badge: "ARKADAŞLAR VE BİRLİKTE ODAK",
    title: "Yalnız değilsin: arkadaşlarınla birlikte çalış",
    subtitle: "Tamamen isteğe bağlı, istediğin an kapatırsın.",
    icon: Flame,
    accentColor: "from-pink-500/20 to-rose-500/20 border-pink-500/30 text-pink-500",
    features: [
      { title: "Arkadaşlar ve sıralama", desc: "Davet koduyla arkadaş ekle; bu haftaki odak sürenizi ve serilerinizi karşılaştırın. Yalnızca takma adın ve istatistiklerin paylaşılır.", icon: Flame },
      { title: "Birlikte odak", desc: "Oda kur, 6 haneli kodu paylaş; herkes katılınca aynı zamanlayıcıyı birlikte başlatın. Oturum bitince çalışma kaydına eklenir.", icon: Zap },
      { title: "Gizlilik sende", desc: "E-postan, hedeflerin ve notların asla paylaşılmaz. Paylaşımı kapatınca verilerin silinir.", icon: CheckCircle2 },
    ],
    tip: "Ortak odak ve arkadaş özellikleri için bulut hesabıyla giriş yapmış olman gerekir.",
    actionRoute: "/together",
    actionLabel: "Birlikte odağa git",
  },
  {
    id: "settings",
    badge: "AYARLAR VE UYGULAMA",
    title: "Hesabını, verilerini ve bildirimlerini yönet",
    subtitle: "Planorth'u cebine kur, verilerin hep sende kalsın.",
    icon: CircleHelp,
    accentColor: "from-indigo-500/20 to-violet-500/20 border-indigo-500/30 text-indigo-500",
    features: [
      { title: "Hesap ve güvenlik", desc: "Şifre ve e-posta değiştir, çıkış yap, hesabını sil. Verilerini JSON olarak indirebilir, yedekten geri yükleyebilirsin.", icon: CheckCircle2 },
      { title: "Bildirimler ve kullanım hakların", desc: "Günlük hatırlatıcı kur; yapay zekâ araçlarında bugün kaç hakkın kaldığını gör.", icon: Flame },
      { title: "Uygulamayı yükle ve destek", desc: "Planorth'u ana ekrana ekleyip uygulama gibi aç. Sorun ya da önerin için Destek sayfası her zaman açık.", icon: Play },
    ],
    tip: "Hazırsın! Önce Yol Haritam'dan Koç ile ilk planını oluştur ya da Bugün ekranından ilk odak oturumunu başlat.",
    actionRoute: "/profile",
    actionLabel: "Planorth'u kullanmaya başla",
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

          {stepData.actionRoute && stepData.actionLabel && (
            <Link href={stepData.actionRoute} onClick={handleFinish} className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
              {stepData.actionLabel} <ArrowRight className="size-3.5" />
            </Link>
          )}

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
