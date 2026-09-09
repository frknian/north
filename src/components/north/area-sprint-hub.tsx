"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  FileText,
  Flame,
  GraduationCap,
  Loader2,
  Play,
  Plus,
  RotateCcw,
  Sparkles,
  Target,
  UploadCloud,
  X,
  Zap,
} from "lucide-react";
import {
  dayKey,
  shiftDay,
  createSprintTasks,
  updateSprintModuleStatus,
  type Area,
  type AreaSprint,
  type AreaSprintModule,
} from "@/lib/north";
import { useNorth } from "./shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface AreaSprintHubProps {
  area: Area;
}

const sprintPresets = [
  {
    label: "🎓 Üniversite Vize Kampı",
    title: "Vize Hazırlığı & Problem Çözümü",
    level: "Lisans Seviyesi",
    days: 7,
    minutes: 60,
  },
  {
    label: "🎓 Üniversite Final Sınavı",
    title: "Final Kampı & Kapsamlı Tekrar",
    level: "Lisans Seviyesi",
    days: 12,
    minutes: 60,
  },
  {
    label: "💼 İş Hayatı / Yeni Teknoloji",
    title: "Hızlı Teknoloji & Uygulama Sprinti",
    level: "Profesyonel / Sektör",
    days: 10,
    minutes: 45,
  },
  {
    label: "🔬 Lisans Teori Derinleşme",
    title: "Teori & İspat Temelleri",
    level: "Lisans Seviyesi",
    days: 14,
    minutes: 50,
  },
];

export function AreaSprintHub({ area }: AreaSprintHubProps) {
  const { state, update } = useNorth();
  const today = dayKey();

  // Active sprint for this area
  const activeSprint = (state.sprints || []).find(
    (s) => s.areaId === area.id && s.status === "active"
  );

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [level, setLevel] = useState("Lisans Seviyesi");
  const [targetDate, setTargetDate] = useState(shiftDay(today, 7));
  const [dailyMinutes, setDailyMinutes] = useState(area.preferredSessionMinutes || 50);
  const [notesContent, setNotesContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);
  const [generatedModules, setGeneratedModules] = useState<AreaSprintModule[]>([]);
  const [strategyNote, setStrategyNote] = useState("");

  // Countdown calculations
  const daysLeft = activeSprint
    ? Math.max(
        0,
        Math.ceil(
          (new Date(`${activeSprint.targetDate}T00:00:00`).getTime() -
            new Date(`${today}T00:00:00`).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : 0;

  const completedModulesCount = activeSprint
    ? activeSprint.modules.filter((m) => m.status === "done").length
    : 0;
  const totalModulesCount = activeSprint ? activeSprint.modules.length : 0;
  const progressPercent =
    totalModulesCount > 0 ? Math.round((completedModulesCount / totalModulesCount) * 100) : 0;

  // Handle Preset selection
  const applyPreset = (preset: (typeof sprintPresets)[0]) => {
    let suggestedTitle = preset.title;
    if (/matematik/i.test(area.name)) {
      suggestedTitle =
        preset.label.includes("Vize")
          ? "Diferansiyel Sistemler & Vize Soru Çözümü"
          : "Diferansiyel Sistemler (Lisans Seviyesi)";
    } else if (/siber|cyber/i.test(area.name)) {
      suggestedTitle =
        preset.label.includes("Vize")
          ? "Web Application Security & Zafiyet Analizi"
          : "Web Application Security (OWASP & PortSwigger)";
    }
    setTitle(suggestedTitle);
    setLevel(preset.level);
    setTargetDate(shiftDay(today, preset.days));
    setDailyMinutes(preset.minutes);
  };

  // Handle File Input (PDF / Text / Notes)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    if (file.type.includes("text") || file.name.endsWith(".txt") || file.name.endsWith(".md")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = (event.target?.result as string) || "";
        setNotesContent(text.slice(0, 5000));
      };
      reader.readAsText(file);
    } else if (file.type.includes("pdf") || file.name.endsWith(".pdf")) {
      // Clean extracted name as default title if not set
      const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
      if (!title.trim()) {
        setTitle(cleanName);
      }
      // Provide guidance note for PDF
      setNotesContent(
        (curr) =>
          curr ||
          `[Yüklenen Belge: ${file.name}]\nBu PDF dökümanındaki ders slaytları, konu başlıkları ve vize/final gereksinimleri hedefleniyor.`
      );
    }
  };

  // Call AI Endpoint to Generate Modules
  const handleGenerateModules = async () => {
    if (!title.trim()) return;
    setLoadingAi(true);

    try {
      const res = await fetch("/api/ai/topic-sprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          areaName: area.name,
          sprintTitle: title.trim(),
          level: level.trim(),
          targetDate,
          dailyMinutes,
          notesContent,
          fileName,
        }),
      });

      if (!res.ok) throw new Error("AI yanıt veremedi");
      const data = await res.json();

      if (Array.isArray(data.modules) && data.modules.length > 0) {
        setGeneratedModules(data.modules);
        setStrategyNote(data.strategyNote || "");
      }
    } catch (err) {
      console.warn("AI generation fallback to deterministic logic:", err);
      // Fallback manual generation
      const fallback: AreaSprintModule[] = [
        {
          id: crypto.randomUUID(),
          title: `1. Aşama: ${title} Temel Kavramlar ve Ön Koşullar`,
          summary: "Ders notlarının taranması ve temel kavram haritasının çıkarılması.",
          estimatedMinutes: dailyMinutes,
          targetDate: today,
          status: "pending",
        },
        {
          id: crypto.randomUUID(),
          title: `2. Aşama: ${title} Çekirdek İlkeler ve Formüller`,
          summary: "Konunun ana kuralları, ispatları veya mimari prensipleri.",
          estimatedMinutes: dailyMinutes,
          targetDate: shiftDay(today, 2),
          status: "pending",
        },
        {
          id: crypto.randomUUID(),
          title: `3. Aşama: ${title} Yoğun Problem & Soru Çözümü`,
          summary: "Örnek vaka analizi, çıkmış sınav soruları veya lab uygulaması.",
          estimatedMinutes: dailyMinutes,
          targetDate: shiftDay(today, 4),
          status: "pending",
        },
        {
          id: crypto.randomUUID(),
          title: `4. Aşama: Kritik Zayıf Noktalar & Final Simülasyonu`,
          summary: "Bitiş tarihinden önce kapsamlı deneme ve zaman sınırlı pratik.",
          estimatedMinutes: dailyMinutes,
          targetDate: targetDate,
          status: "pending",
        },
      ];
      setGeneratedModules(fallback);
      setStrategyNote(`${area.name} alanında hedefine göre 4 aşamalı odak yolu hazırlandı.`);
    } finally {
      setLoadingAi(false);
    }
  };

  // Save the new sprint and generate tasks
  const handleLaunchSprint = () => {
    if (!title.trim() || generatedModules.length === 0) return;

    const newSprint: AreaSprint = {
      id: crypto.randomUUID(),
      areaId: area.id,
      title: title.trim(),
      level: level.trim(),
      targetDate,
      dailyMinutesTarget: dailyMinutes,
      sourceType: fileName ? "pdf" : notesContent ? "notes" : "manual",
      fileName: fileName || undefined,
      notesContent: notesContent || undefined,
      status: "active",
      createdAt: new Date().toISOString(),
      modules: generatedModules,
    };

    update((curr) => {
      const { updatedState } = createSprintTasks(curr, newSprint);
      return updatedState;
    });

    setModalOpen(false);
    setGeneratedModules([]);
    setTitle("");
    setNotesContent("");
    setFileName("");
  };

  // Toggle module done / pending
  const handleToggleModule = (moduleId: string, currentStatus: "pending" | "done") => {
    if (!activeSprint) return;
    const nextStatus = currentStatus === "done" ? "pending" : "done";
    update((curr) => updateSprintModuleStatus(curr, activeSprint.id, moduleId, nextStatus));
  };

  // Complete entire sprint
  const handleCompleteSprint = () => {
    if (!activeSprint) return;
    update((curr) => ({
      ...curr,
      sprints: (curr.sprints || []).map((s) =>
        s.id === activeSprint.id ? { ...s, status: "completed" as const } : s
      ),
      areas: curr.areas.map((a) => (a.id === area.id ? { ...a, activeSprintId: undefined } : a)),
    }));
  };

  return (
    <section className="space-y-4">
      {/* ------------------------------------------------------------- */}
      {/* 1. AKTİF SPRINT VARSA: KAMP MERKEZİ GÖRÜNÜMÜ                   */}
      {/* ------------------------------------------------------------- */}
      {activeSprint ? (
        <div className="rounded-3xl border border-primary/30 bg-gradient-to-br from-card via-card/95 to-primary/5 p-5 sm:p-6 shadow-md relative overflow-hidden backdrop-blur-md">
          {/* Ambient blur */}
          <div className="absolute -top-20 -right-20 size-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

          {/* Top Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary">
                  <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                  AKTİF ALT KONU KAMPI
                </span>
                <Badge variant="outline" className="text-xs font-semibold px-2 py-0.5">
                  {activeSprint.level}
                </Badge>
                {activeSprint.fileName && (
                  <Badge
                    variant="secondary"
                    className="text-[11px] font-mono gap-1 text-muted-foreground"
                  >
                    <FileText className="size-3 text-primary" /> {activeSprint.fileName}
                  </Badge>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                {activeSprint.title}
              </h2>
            </div>

            {/* Countdown / Days left */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-baseline gap-1.5 rounded-2xl border border-primary/20 bg-background/80 px-4 py-2 shadow-2xs">
                <Clock className="size-4 text-primary" />
                <span className="text-xl sm:text-2xl font-black font-mono text-primary leading-none">
                  {daysLeft}
                </span>
                <span className="text-xs font-medium text-muted-foreground">gün kaldı</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setModalOpen(true)}
                className="rounded-xl text-xs h-9"
              >
                Yeni Kamp
              </Button>
            </div>
          </div>

          {/* Progress Bar & KPI */}
          <div className="py-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-muted-foreground">
                Müfredat İlerlemesi:{" "}
                <strong className="text-foreground">
                  {completedModulesCount} / {totalModulesCount} Modül Bitti
                </strong>
              </span>
              <span className="font-mono font-bold text-primary">%{progressPercent}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted/60 overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500 shadow-xs shadow-primary/40"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>🎯 Hedef Bitiş: {activeSprint.targetDate}</span>
              <span>⏱️ Günlük Hedef: {activeSprint.dailyMinutesTarget} dk</span>
            </div>
          </div>

          {/* Modules List */}
          <div className="mt-2 space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Target className="size-3.5 text-primary" />
              Hazırlık ve Görev Adımları
            </h3>

            <div className="divide-y divide-border/40 rounded-2xl border border-border/80 bg-background/60 overflow-hidden">
              {activeSprint.modules.map((mod, index) => {
                const isDone = mod.status === "done";
                return (
                  <div
                    key={mod.id}
                    className={cn(
                      "p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors",
                      isDone ? "bg-muted/15" : "hover:bg-muted/10"
                    )}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <button
                        onClick={() => handleToggleModule(mod.id, mod.status)}
                        className={cn(
                          "mt-0.5 size-4.5 rounded-md flex items-center justify-center transition-all shrink-0 cursor-pointer",
                          isDone
                            ? "bg-emerald-500 text-white shadow-2xs"
                            : "border border-muted-foreground/40 hover:border-primary"
                        )}
                        title={isDone ? "Görevi aç" : "Tamamlandı işaretle"}
                      >
                        {isDone && <Check className="size-3 stroke-[3]" />}
                      </button>

                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] font-mono font-bold text-muted-foreground">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <h4
                            className={cn(
                              "text-xs sm:text-sm font-semibold text-foreground truncate",
                              isDone && "line-through text-muted-foreground font-normal"
                            )}
                          >
                            {mod.title}
                          </h4>
                          {isDone && (
                            <Badge
                              variant="secondary"
                              className="text-[9px] px-1 py-0 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                            >
                              Tamamlandı
                            </Badge>
                          )}
                        </div>
                        {mod.summary && (
                          <p className="text-[11px] text-muted-foreground line-clamp-1">
                            {mod.summary}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <span className="text-[11px] font-mono text-muted-foreground">
                        {mod.targetDate || activeSprint.targetDate}
                      </span>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {mod.estimatedMinutes} dk
                      </Badge>
                      {mod.taskId && !isDone && (
                        <Button
                          asChild
                          size="xs"
                          className="rounded-xl text-[11px] h-7 px-2.5 shadow-2xs"
                        >
                          <Link href={`/focus/${mod.taskId}`}>
                            <Play className="size-3 mr-1 fill-current" /> Odaklan
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Footer */}
          <div className="mt-4 pt-3 border-t border-border/60 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="text-muted-foreground text-[11px]">
              Tüm adımları tamamladığında kamp otomatik başarıyla sonuçlanır.
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="xs"
                onClick={handleCompleteSprint}
                className="text-muted-foreground hover:text-emerald-600 rounded-xl text-xs"
              >
                <CheckCircle2 className="size-3.5 mr-1" />
                Kampı Başarıyla Bitir
              </Button>
              <Button
                variant="outline"
                size="xs"
                onClick={() => setModalOpen(true)}
                className="rounded-xl text-xs"
              >
                Yeniden Planla
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* ------------------------------------------------------------- */
        /* 2. AKTİF SPRINT YOKSA: KAMP BAŞLATMA BANNERI                   */
        /* ------------------------------------------------------------- */
        <div className="rounded-3xl border border-primary/25 bg-gradient-to-r from-primary/5 via-card to-background p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5 backdrop-blur-xs">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary uppercase tracking-wider">
                <Sparkles className="size-3" />
                Hedef Alt Konu &amp; Sınav Kampı
              </span>
              <span className="text-xs text-muted-foreground">Vize / Final / Özel Konu</span>
            </div>
            <h3 className="text-base sm:text-lg font-extrabold text-foreground">
              {area.name} alanında belirli bir alt konuya veya yaklaşan sınava mı hazırlanacaksın?
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Örneğin <strong>Web Application Security</strong>,{" "}
              <strong>Diferansiyel Sistemler (Lisans Seviyesi)</strong> veya elindeki ders notu / PDF ile
              hedef tarihine kadar otomatik görevlendirilmiş bir çalışma kampı başlat.
            </p>
          </div>

          <Button
            size="sm"
            onClick={() => setModalOpen(true)}
            className="rounded-2xl text-xs font-bold h-10 px-5 shadow-xs shadow-primary/20 shrink-0 hover:scale-[1.01] transition-transform"
          >
            <Zap className="size-3.5 mr-1.5 fill-current" />
            Alt Konu / Sınav Kampı Başlat
          </Button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. YENİ KAMP OLUŞTURMA SİHİRBAZI (DIALOG)                     */}
      {/* ------------------------------------------------------------- */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <GraduationCap className="size-5 text-primary" />
              {area.name} Alt Konu &amp; Sınav Kampı Başlat
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Ders notunu veya PDF&apos;ini yükle, bitiş tarihini belirle; yapay zeka seni gün gün
              sınava veya hedefine hazırlasın.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Hızlı Şablon Seçimi */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground font-semibold">
                Hızlı Kamp Şablonları
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {sprintPresets.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className="p-2.5 rounded-xl border border-border/80 bg-background/60 hover:border-primary/50 hover:bg-primary/5 text-left transition-all"
                  >
                    <p className="text-xs font-bold text-foreground">{p.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {p.days} gün · {p.minutes} dk/gün
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Konu Başlığı & Seviye */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <Label className="text-xs font-semibold">Alt Konu / Kamp Başlığı</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Örn: Diferansiyel Sistemler, Web App Sec..."
                  className="text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Seviye / Amaç</Label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="Lisans Seviyesi">Lisans Seviyesi</option>
                  <option value="Üniversite Vize Kampı">Vize Kampı</option>
                  <option value="Üniversite Final Sınavı">Final Sınavı</option>
                  <option value="İş Hayatı / Profesyonel">İş Hayatı</option>
                  <option value="Başlangıç / Temel">Başlangıç</option>
                </select>
              </div>
            </div>

            {/* Hedef Bitiş Tarihi & Günlük Süre */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">
                  Ne Zamana Kadar Bitireceksin? (Sınav Günü)
                </Label>
                <Input
                  type="date"
                  min={today}
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Günlük Seans Süresi (Dakika)</Label>
                <select
                  value={dailyMinutes}
                  onChange={(e) => setDailyMinutes(Number(e.target.value))}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                >
                  <option value="30">30 dk / gün</option>
                  <option value="45">45 dk / gün</option>
                  <option value="50">50 dk / gün</option>
                  <option value="60">60 dk / gün (Önerilen Vize Raporu)</option>
                  <option value="90">90 dk / gün (Yoğun Kamp)</option>
                </select>
              </div>
            </div>

            {/* Dosya Yükleme veya Not Yapıştırma */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">
                  Ders Notu / PDF Yükle veya Metin Yapıştır (Opsiyonel)
                </Label>
                {fileName && (
                  <span className="text-[11px] text-primary font-mono truncate max-w-[200px]">
                    ✓ {fileName}
                  </span>
                )}
              </div>

              {/* Upload Drop area */}
              <label className="border-2 border-dashed border-border/80 hover:border-primary/60 rounded-2xl p-3 text-center block cursor-pointer bg-muted/10 hover:bg-muted/20 transition-all">
                <UploadCloud className="size-5 mx-auto text-muted-foreground mb-1" />
                <span className="text-xs font-semibold text-foreground block">
                  PDF veya Ders Notu Dosyası Seç
                </span>
                <span className="text-[10px] text-muted-foreground">
                  PDF, TXT, Markdown veya slayt notları (.pdf, .txt, .md)
                </span>
                <input
                  type="file"
                  accept=".pdf,.txt,.md,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {/* Textarea for lecture notes or syllabus */}
              <textarea
                value={notesContent}
                onChange={(e) => setNotesContent(e.target.value)}
                placeholder="Veya çalışacağın konunun ders notlarını, alt başlıklarını veya sınav kapsamını buraya yapıştır..."
                rows={3}
                className="w-full rounded-xl border border-input bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
              />
            </div>

            {/* AI Generate Button */}
            <div className="pt-1">
              <Button
                type="button"
                onClick={handleGenerateModules}
                disabled={!title.trim() || loadingAi}
                className="w-full rounded-xl text-xs font-bold h-9 shadow-xs"
              >
                {loadingAi ? (
                  <>
                    <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                    Yapay Zeka Müfredatı İnceliyor &amp; Görevlendiriyor…
                  </>
                ) : (
                  <>
                    <Sparkles className="size-3.5 mr-1.5" />
                    AI ile Müfredatı Çıkar &amp; Günlere Dağıt
                  </>
                )}
              </Button>
            </div>

            {/* Generated Modules Preview */}
            {generatedModules.length > 0 && (
              <div className="space-y-2.5 pt-2 border-t border-border/60">
                {strategyNote && (
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-2.5 text-xs text-foreground flex items-start gap-2">
                    <Sparkles className="size-4 text-primary shrink-0 mt-0.5" />
                    <p className="text-[11px] leading-relaxed">{strategyNote}</p>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground">
                    Oluşturulan Odak Adımları ({generatedModules.length} Seans)
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Hedef: {targetDate}
                  </span>
                </div>

                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                  {generatedModules.map((m, idx) => (
                    <div
                      key={m.id}
                      className="p-2.5 rounded-xl border border-border/70 bg-background/80 flex items-center justify-between text-xs gap-2"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate text-xs">
                          {idx + 1}. {m.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">{m.summary}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 text-[10px] font-mono text-muted-foreground">
                        <span>{m.targetDate}</span>
                        <Badge variant="outline" className="text-[9px]">
                          {m.estimatedMinutes} dk
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setModalOpen(false)}
              className="text-xs rounded-xl"
            >
              Vazgeç
            </Button>
            <Button
              size="sm"
              onClick={handleLaunchSprint}
              disabled={generatedModules.length === 0}
              className="text-xs rounded-xl font-bold"
            >
              <Zap className="size-3.5 mr-1.5 fill-current" />
              Kampı Başlat &amp; Takvime Ekle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
