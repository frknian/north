"use client";

import {
  Bot,
  Camera,
  Check,
  CheckCircle2,
  Lock,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Button,
} from "@/components/ui/button";
import {
  toast,
} from "sonner";
import type { FocusSessionCtx } from "./use-focus-session";

export function ProofSection({ ctx }: { ctx: FocusSessionCtx }) {
  const {
    task,
    effectiveArea,
    guidance,
    scratchpadText,
    proofGateOpen,
    setProofGateOpen,
    proofMethod,
    setProofMethod,
    proofText,
    setProofText,
    proofStepId,
    setProofStepId,
    aiQuestionAnswer,
    setAiQuestionAnswer,
    aiVerificationStatus,
    abandonCountdown,
    setAbandonCountdown,
    abandonTimerActive,
    setAbandonTimerActive,
    photoProof,
    setPhotoProof,
    exitQuestion,
    handleVerifyAndFinish,
    handleForfeitAbandon,
    handleAiVerifyCheck,
    minutesStr,
    secondsStr,
  } = ctx;
  return (
    <>
      {/* ================================================================= */}
      {/* PROOF OF WORK / KONU ÇIKIŞ SORUSU KİLİT MODALI                    */}
      {/* ================================================================= */}
      <Dialog open={proofGateOpen} onOpenChange={setProofGateOpen}>
        <DialogContent className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-3xl p-6 sm:p-7">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-lg bg-amber-500/10 text-amber-500">
                <Lock className="size-4" />
              </span>
              <DialogTitle className="text-base font-bold text-foreground">
                Erken Çıkış &amp; Konu Doğrulama Kilidi
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              Hedeflenen sürenin tamamlanmasına <strong className="text-foreground">{minutesStr}:{secondsStr}</strong> kaldı. 
              Planorth&apos;ta sahte süre kaydedilmez ve kilit çözülmeden çıkılamaz. Çalıştığın konudan soruyu cevapla.
            </DialogDescription>
          </DialogHeader>
    
          {/* METHOD SELECTION TABS */}
          <div className="mt-4 grid grid-cols-4 gap-1.5 rounded-2xl border bg-muted/50 p-1 text-xs">
            <button
              type="button"
              onClick={() => setProofMethod("question")}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-1.5 font-medium transition-colors ${
                proofMethod === "question"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sparkles className="size-3.5 text-amber-500" />
              <span className="truncate">Konu Sorusu</span>
            </button>
            <button
              type="button"
              onClick={() => setProofMethod("photo")}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-1.5 font-medium transition-colors ${
                proofMethod === "photo"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Camera className="size-3.5 text-sky-500" />
              <span className="truncate">Fotoğraf</span>
            </button>
            <button
              type="button"
              onClick={() => setProofMethod("step")}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-1.5 font-medium transition-colors ${
                proofMethod === "step"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <CheckCircle2 className="size-3.5 text-emerald-500" />
              <span className="truncate">Görev Adımı</span>
            </button>
            <button
              type="button"
              onClick={() => setProofMethod("ai")}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-1.5 font-medium transition-colors ${
                proofMethod === "ai"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Bot className="size-3.5 text-purple-500" />
              <span className="truncate">AI Teyit</span>
            </button>
          </div>
    
          {/* METHOD 1: KONU ÇIKIŞ DOĞRULAMA SORUSU (VARSAYILAN & ZORUNLU) */}
          {proofMethod === "question" && (
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-primary/25 bg-primary/5 p-4 space-y-1.5 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                    {effectiveArea.name} Çıkış Sorusu
                  </span>
                  {scratchpadText.trim().length >= 15 && (
                    <button
                      type="button"
                      onClick={() => setProofText(scratchpadText.trim())}
                      className="text-[10px] font-medium text-primary hover:underline"
                    >
                      Canlı notlarımdan aktar ⤶
                    </button>
                  )}
                </div>
                <p className="text-xs sm:text-sm font-medium text-foreground leading-relaxed">
                  {exitQuestion}
                </p>
              </div>
    
              <textarea
                value={proofText}
                onChange={(e) => setProofText(e.target.value)}
                placeholder="Cevabını, çözdüğün formülü, kuralı veya vardığın sonucu buraya yaz..."
                className="h-28 w-full rounded-2xl border border-border bg-background p-3 text-xs leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden"
              />
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>En az 15 karakter gereklidir</span>
                <span className={proofText.trim().length >= 15 ? "text-emerald-500 font-semibold" : ""}>
                  {proofText.trim().length} / 15 karakter
                </span>
              </div>
              <Button
                type="button"
                className="w-full rounded-2xl"
                disabled={proofText.trim().length < 15}
                onClick={() =>
                  handleVerifyAndFinish("output_text", `Konu Çıkış Sorusu Cevabı: ${proofText.trim()}`)
                }
              >
                <Check className="mr-1.5 size-4" />
                Soruyu Cevapla ve Kilidi Kaldır
              </Button>
            </div>
          )}
    
          {/* METHOD 2: FOTOĞRAF / EKRAN KANITI */}
          {proofMethod === "photo" && (
            <div className="mt-4 space-y-3">
              <p className="text-xs text-muted-foreground">
                Çözdüğün soru kağıdı, defter notu, terminal çıktısı veya kod ekranının anlık fotoğrafını yükle:
              </p>
              <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border/80 p-6 text-center hover:border-primary/50 transition-colors">
                {photoProof ? (
                  <div className="space-y-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photoProof}
                      alt="Yüklenen Kanıt"
                      className="max-h-40 max-w-full rounded-lg object-contain shadow-xs"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPhotoProof(null)}
                      className="text-xs rounded-xl"
                    >
                      Fotoğrafı Değiştir
                    </Button>
                  </div>
                ) : (
                  <label className="flex cursor-pointer flex-col items-center gap-2">
                    <div className="grid size-10 place-items-center rounded-full bg-primary/10 text-primary">
                      <Camera className="size-5" />
                    </div>
                    <span className="text-xs font-semibold text-foreground">Fotoğraf Seç veya Kamerayla Çek</span>
                    <span className="text-[10px] text-muted-foreground">PNG, JPG, HEIC (Maks. 4MB)</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 4 * 1024 * 1024) {
                          toast.error("Fotoğraf 4MB'dan küçük olmalıdır.");
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = () => setPhotoProof(reader.result as string);
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>
                )}
              </div>
              <Button
                type="button"
                className="w-full rounded-2xl"
                disabled={!photoProof}
                onClick={() => handleVerifyAndFinish("photo", photoProof!)}
              >
                <Check className="mr-1.5 size-4" />
                Görsel Kanıtı Onayla ve Bitir
              </Button>
            </div>
          )}
    
          {/* METHOD 3: GÖREV ADIMI DOĞRULAMASI */}
          {proofMethod === "step" && (
            <div className="mt-4 space-y-3">
              <p className="text-xs text-muted-foreground">
                Bu oturumda rehberdeki hangi adımı tamamladığını seç:
              </p>
              {guidance && guidance.steps.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {guidance.steps.map((step) => (
                    <label
                      key={step.id}
                      className={`flex cursor-pointer items-start gap-2.5 rounded-2xl border p-2.5 text-left text-xs transition-colors ${
                        proofStepId === step.id
                          ? "border-emerald-500/50 bg-emerald-500/10 text-foreground"
                          : "border-border bg-background hover:bg-muted/40"
                      }`}
                    >
                      <input
                        type="radio"
                        name="proofStep"
                        className="mt-0.5"
                        checked={proofStepId === step.id}
                        onChange={() => setProofStepId(step.id)}
                      />
                      <div>
                        <p className="font-semibold">{step.title}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{step.detail}</p>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">Bu görev için rehber adımı bulunamadı.</p>
              )}
              <Button
                type="button"
                className="w-full rounded-2xl"
                disabled={!proofStepId}
                onClick={() => {
                  const step = guidance?.steps.find((s) => s.id === proofStepId);
                  handleVerifyAndFinish("step", step ? `Tamamlanan Adım: ${step.title}` : "Adım tamamlandı.");
                }}
              >
                <Check className="mr-1.5 size-4" />
                Adım Doğrulamasıyla Bitir
              </Button>
            </div>
          )}
    
          {/* METHOD 4: NORTH AI POP TEYİT */}
          {proofMethod === "ai" && (
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-3 text-xs leading-relaxed text-foreground">
                <span className="font-semibold text-purple-600 dark:text-purple-400">Planorth Koç Hızlı Soru: </span>
                <p className="mt-1">
                  &ldquo;{task?.title || effectiveArea.name}&rdquo; çalışırken aklında kalan en kritik 1 kural, formül veya edindiğin çıkarım ne oldu?
                </p>
              </div>
              <textarea
                value={aiQuestionAnswer}
                onChange={(e) => setAiQuestionAnswer(e.target.value)}
                placeholder="Örnek: Bu kavramın özü şudur..., formül şöyle uygulanır..., şu adımı başardım..."
                className="h-24 w-full rounded-2xl border border-border bg-background p-3 text-xs leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-purple-500 focus:outline-hidden"
              />
              {aiVerificationStatus === "verified" ? (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="size-4 shrink-0" />
                  <span>Planorth Koç cevabını onayladı! Öğrenim çıktın geçerli kabul edildi.</span>
                </div>
              ) : (
                <Button
                  type="button"
                  className="w-full rounded-2xl"
                  disabled={aiQuestionAnswer.trim().length < 10 || aiVerificationStatus === "checking"}
                  onClick={handleAiVerifyCheck}
                >
                  <Sparkles className="mr-1.5 size-4" />
                  {aiVerificationStatus === "checking" ? "İnceleniyor…" : "AI ile Öğrenimimi Teyit Et"}
                </Button>
              )}
    
              {aiVerificationStatus === "verified" && (
                <Button
                  type="button"
                  className="w-full rounded-2xl"
                  onClick={() => handleVerifyAndFinish("ai_verified", `AI Teyit: ${aiQuestionAnswer.trim()}`)}
                >
                  <Check className="mr-1.5 size-4" />
                  Teyit Edilmiş Olarak Oturumu Bitir
                </Button>
              )}
            </div>
          )}
    
          {/* FORFEIT / ABANDONMENT BOTTOM ACCORDION */}
          <div className="mt-6 border-t pt-4">
            {!abandonTimerActive ? (
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setAbandonTimerActive(true);
                    setAbandonCountdown(8);
                  }}
                  className="text-xs text-muted-foreground/80 hover:text-red-500 transition-colors"
                >
                  Kanıtım yok / Pes ediyorum
                </button>
                <Button variant="ghost" size="sm" onClick={() => setProofGateOpen(false)}>
                  Odakta Kal
                </Button>
              </div>
            ) : (
              <div className="rounded-3xl border border-red-500/30 bg-red-500/5 p-4 space-y-3 text-left">
                <div className="flex items-center gap-2 text-xs font-semibold text-red-600 dark:text-red-400">
                  <ShieldAlert className="size-4" />
                  <span>Dürüst Vazgeçiş Freni</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Dikkat dağılması ve yorgunluk insani bir durumdur. Ancak Planorth sahte odak süresi kaydetmez. 
                  Pes edersen bu seans için süre işlenmez ve çizgin etkilenmez.
                </p>
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <span className="text-[11px] font-mono text-muted-foreground">
                    {abandonCountdown > 0 ? (
                      `Derin nefes al... (${abandonCountdown} sn)`
                    ) : (
                      "Vazgeçiş onaylanabilir."
                    )}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="rounded-xl"
                      disabled={abandonCountdown > 0}
                      onClick={handleForfeitAbandon}
                    >
                      Dürüstçe Vazgeç
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                      onClick={() => setAbandonTimerActive(false)}
                    >
                      Vazgeçme, Odakta Kal
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    
    </>
  );
}
