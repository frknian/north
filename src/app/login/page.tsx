"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  deleteUser,
  GoogleAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  getAdditionalUserInfo,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  type User,
} from "firebase/auth";
import { deleteDoc, doc, setDoc } from "firebase/firestore";
import {
  ArrowRight,
  Bot,
  Check,
  Flame,
  Languages,
  LoaderCircle,
  MailCheck,
  Sparkles,
  Trophy,
  Volume2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NorthLogo } from "@/components/layout/north-logo";
import { getFirebase, isFirebaseConfigured } from "@/lib/firebase/client";
import { cn } from "@/lib/utils";

const KVKK_VERSION = "2026-09-06";

function message(error: unknown) {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
  return (
    ({
      "auth/email-already-in-use": "Bu e-posta adresiyle zaten bir hesap var. Giriş yapmayı dene.",
      "auth/invalid-credential": "E-posta veya şifre hatalı.",
      "auth/invalid-email": "Geçerli bir e-posta adresi yaz.",
      "auth/too-many-requests": "Çok fazla deneme yapıldı. Bir süre sonra tekrar dene.",
      "auth/weak-password": "Şifre en az 6 karakter olmalı.",
      "auth/popup-closed-by-user": "Google penceresi kapatıldı.",
      "auth/cancelled-popup-request": "Giriş işlemi iptal edildi.",
      "auth/popup-blocked": "Tarayıcı açılır pencereyi engelledi. Lütfen izin verin.",
    } as Record<string, string>)[code] ?? "Kimlik doğrulama başarısız oldu."
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [noticeRead, setNoticeRead] = useState(false);
  const [kvkkOpen, setKvkkOpen] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [pending, setPending] = useState(false);
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  const firebaseReady = isFirebaseConfigured();

  // Load remembered email on mount
  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem("north_remembered_email");
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    } catch {}
  }, []);

  async function saveRegistration(user: User, provider = "password") {
    const firebase = getFirebase();
    if (!firebase) return;
    const now = new Date().toISOString();
    const fallbackName = user.displayName || user.email?.split("@")[0] || "Kullanıcı";

    if (!user.displayName && fallbackName) {
      await updateProfile(user, { displayName: fallbackName }).catch(() => undefined);
    }

    await setDoc(
      doc(firebase.db, "users", user.uid, "workspaces", "cybercoach"),
      {
        account: {
          username: fallbackName,
          email: user.email,
          provider,
          createdAt: now,
          kvkk: { version: KVKK_VERSION, noticeReadAt: now },
        },
      },
      { merge: true }
    );
  }

  async function deleteIncomplete(user: User) {
    const firebase = getFirebase();
    if (firebase) {
      await deleteDoc(doc(firebase.db, "users", user.uid, "workspaces", "cybercoach")).catch(() => undefined);
    }
    await deleteUser(user).catch(() => undefined);
  }

  async function signInWithGoogle() {
    const firebase = getFirebase();
    if (!firebase) return;

    setGoogleBusy(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const result = await signInWithPopup(firebase.auth, provider);
      const isNewUser = Boolean(getAdditionalUserInfo(result)?.isNewUser);

      if (isNewUser) {
        try {
          await saveRegistration(result.user, "google.com");
        } catch (error) {
          console.error("Kayıt verisi yazılırken hata:", error);
        }
        toast.success("Google ile hoş geldin! Başlangıç hedeflerini belirleyelim.");
        router.push("/onboarding");
      } else {
        toast.success("Google ile başarıyla giriş yapıldı.");
        router.push("/");
      }
      router.refresh();
    } catch (error) {
      toast.error(message(error));
    } finally {
      setGoogleBusy(false);
    }
  }

  async function resend() {
    const firebase = getFirebase();
    if (!firebase) return;
    setBusy(true);
    try {
      const credential = await signInWithEmailAndPassword(firebase.auth, email.trim(), password);
      await sendEmailVerification(credential.user);
      await signOut(firebase.auth);
      toast.success("Yeni doğrulama e-postası gönderildi.");
    } catch (error) {
      toast.error(message(error));
    } finally {
      setBusy(false);
    }
  }

  async function resetPassword() {
    const firebase = getFirebase();
    if (!firebase) return;
    if (!email.trim()) {
      toast.error("Önce e-posta adresini yaz.");
      return;
    }
    setBusy(true);
    try {
      await sendPasswordResetEmail(firebase.auth, email.trim());
      toast.success("Şifre yenileme bağlantısı e-postana gönderildi.");
    } catch (error) {
      toast.error(message(error));
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    const firebase = getFirebase();
    if (!firebase) return;

    if (mode === "signup") {
      if (password.length < 6) {
        toast.error("Şifre en az 6 karakter olmalı.");
        return;
      }
      if (password !== confirmPassword) {
        toast.error("Şifreler eşleşmiyor. Lütfen her iki alana da aynı şifreyi girin.");
        return;
      }
      if (!noticeRead) {
        toast.error("Lütfen KVKK Aydınlatma Metni'ni onaylayın.");
        return;
      }
    }

    setBusy(true);
    try {
      if (mode === "signup") {
        const result = await createUserWithEmailAndPassword(firebase.auth, email.trim(), password);
        try {
          await saveRegistration(result.user, "password");
          await sendEmailVerification(result.user);
          await signOut(firebase.auth);
          setPending(true);
          toast.success("Doğrulama e-postası gönderildi.");
        } catch (error) {
          await deleteIncomplete(result.user);
          throw error;
        }
        return;
      }

      // Sign In mode
      if (firebase.auth) {
        try {
          await setPersistence(
            firebase.auth,
            rememberMe ? browserLocalPersistence : browserSessionPersistence
          );
        } catch {}
      }

      const result = await signInWithEmailAndPassword(firebase.auth, email.trim(), password);
      await result.user.reload();

      if (!firebase.auth.currentUser?.emailVerified) {
        await signOut(firebase.auth);
        setPending(true);
        toast.error("Önce e-posta adresini doğrulamalısın.");
        return;
      }

      // Remember email preference
      try {
        if (rememberMe) {
          localStorage.setItem("north_remembered_email", email.trim());
        } else {
          localStorage.removeItem("north_remembered_email");
        }
      } catch {}

      toast.success("Tekrar hoş geldin.");
      router.push("/");
      router.refresh();
    } catch (error) {
      toast.error(message(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative min-h-dvh flex items-center justify-center overflow-x-hidden bg-[#060B15] text-white px-4 py-8 sm:py-12">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 size-[620px] rounded-full bg-blue-600/10 blur-[130px] opacity-70" />
      <div className="pointer-events-none absolute -bottom-32 left-10 size-[450px] rounded-full bg-indigo-600/10 blur-[120px] opacity-40" />
      <div className="pointer-events-none absolute -bottom-32 right-10 size-[450px] rounded-full bg-cyan-600/10 blur-[120px] opacity-40" />

      <div className="relative w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-center gap-8 xl:gap-12 z-10">
        {/* SOL VİTRİN: Canlı Odak & Zen Sayaç Bento Kartları (Web/Masaüstü için - İngilizce & Odak) */}
        <div className="hidden lg:flex flex-col gap-5 w-[330px] xl:w-[360px] shrink-0">
          {/* Bento 1: Günlük Odak Kartı (İngilizce C1) */}
          <div className="rounded-2xl border border-zinc-800/90 bg-[#0B101D]/90 p-5 shadow-2xl backdrop-blur-md transition hover:border-zinc-700/80">
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 text-[11px] font-semibold text-blue-400">
                <Sparkles className="size-3" /> Bugünün Odak Görevi
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-400">
                <Flame className="size-3.5 fill-amber-400" /> 14 Gün Seri
              </span>
            </div>

            <h3 className="text-sm font-bold text-white mb-1.5 leading-snug">
              C1 İleri Kelime & Dinleme (Listening)
            </h3>
            <p className="text-xs text-zinc-400 mb-3.5 flex items-center gap-1.5">
              <Languages className="size-3.5 text-blue-400" />
              Yabancı Dil · 45 dk derin odak oturumu
            </p>

            {/* Checklist */}
            <div className="space-y-2 mb-3.5 text-xs">
              <div className="flex items-center gap-2.5 rounded-lg bg-[#131B2E]/60 border border-blue-950/60 px-3 py-2 text-zinc-300">
                <span className="grid size-4 place-items-center rounded-full bg-emerald-500/20 text-emerald-400">
                  <Check className="size-3" />
                </span>
                <span className="line-through text-zinc-500">20 yeni C1 akademik kelime tekrarı</span>
              </div>
              <div className="flex items-center gap-2.5 rounded-lg bg-[#131B2E]/60 border border-blue-950/60 px-3 py-2 text-zinc-300">
                <span className="grid size-4 place-items-center rounded-full bg-emerald-500/20 text-emerald-400">
                  <Check className="size-3" />
                </span>
                <span className="line-through text-zinc-500">BBC 6-Minute English dinleme & gölgeleme</span>
              </div>
              <div className="flex items-center gap-2.5 rounded-lg bg-[#0E1526] border border-blue-500/30 px-3 py-2 text-white font-medium shadow-xs">
                <span className="size-2 rounded-full bg-blue-500 animate-pulse ml-1 mr-1" />
                <span>Günlük konuşma pratiği ve telaffuz kaydı</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] text-zinc-400">
                <span>Tamamlanma Oranı</span>
                <span className="font-semibold text-blue-400">%75 (3 / 4 Adım)</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full w-3/4 transition-all duration-500" />
              </div>
            </div>
          </div>

          {/* Bento 2: Zen Sayaç & Ses Mikseri */}
          <div className="rounded-2xl border border-zinc-800/90 bg-[#0B101D]/90 p-4.5 shadow-2xl backdrop-blur-md transition hover:border-zinc-700/80">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
                Zen Odak Kokpiti
              </span>
              <span className="text-[11px] text-zinc-400 bg-zinc-800/60 px-2 py-0.5 rounded-md">
                Kilitli Mod
              </span>
            </div>

            <div className="flex items-center justify-around py-1">
              {/* Mini Circular Timer */}
              <div className="relative grid size-20 place-items-center rounded-full border-2 border-blue-500/30 bg-[#0E1526]">
                <div className="text-center">
                  <span className="font-mono text-lg font-bold text-white">25:00</span>
                  <span className="block text-[9px] text-blue-400 font-medium">ZEN</span>
                </div>
              </div>

              {/* Status details */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-1.5 text-zinc-300">
                  <Volume2 className="size-3.5 text-blue-400" />
                  <span>🌧️ Yağmur Sesi (%60)</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-medium">
                  <span className="size-1.5 rounded-full bg-emerald-400" />
                  Demir İrade: Aktif
                </div>
                <div className="text-[10px] text-zinc-400">
                  Sekmeler ve bildirimler engelli
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ORTA: Giriş & Kayıt Kartı */}
        <div className="w-full max-w-md shrink-0">
          <Brand />

          <Card className="border border-zinc-800/90 bg-[#0B101D]/95 shadow-2xl backdrop-blur-xl rounded-3xl overflow-hidden">
            <CardContent className="p-5 sm:p-7 space-y-4">
              {!firebaseReady ? (
                <LocalMode />
              ) : pending ? (
                <Verification
                  busy={busy}
                  onResend={resend}
                  onDone={() => {
                    setPending(false);
                    setMode("signin");
                  }}
                />
              ) : (
                <>
                  {/* GOOGLE İLE GİRİŞ BUTONU */}
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="w-full h-12 border-zinc-800 bg-[#0E1526] hover:bg-[#131B2E] text-white font-medium shadow-sm transition-all flex items-center justify-center gap-3 rounded-2xl hover:border-blue-500/40"
                    disabled={busy || googleBusy}
                    onClick={signInWithGoogle}
                  >
                    {googleBusy ? (
                      <span className="inline-flex items-center gap-2 text-xs text-zinc-300">
                        <LoaderCircle className="size-4 animate-spin text-blue-500" />
                        Google ile bağlanıyor…
                      </span>
                    ) : (
                      <>
                        <GoogleMark />
                        <span className="text-sm font-semibold tracking-wide">
                          Google ile Devam Et
                        </span>
                      </>
                    )}
                  </Button>

                  {/* VEYA E-POSTA AYIRICI */}
                  <div className="relative my-4 flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-zinc-800" />
                    </div>
                    <span className="relative bg-[#0B101D] px-3 text-[11px] font-medium text-zinc-400">
                      veya e-posta ile devam et
                    </span>
                  </div>

                  {/* SEKMELER: GİRİŞ YAP & KAYIT OL */}
                  <div className="grid grid-cols-2 rounded-xl bg-[#0E1526] p-1 border border-zinc-800/90 mb-4" role="tablist">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={mode === "signin"}
                      className={cn(
                        "rounded-lg py-2 text-xs sm:text-sm font-semibold transition-all",
                        mode === "signin"
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-zinc-400 hover:text-zinc-200"
                      )}
                      onClick={() => setMode("signin")}
                    >
                      Giriş Yap
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={mode === "signup"}
                      className={cn(
                        "rounded-lg py-2 text-xs sm:text-sm font-semibold transition-all",
                        mode === "signup"
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-zinc-400 hover:text-zinc-200"
                      )}
                      onClick={() => setMode("signup")}
                    >
                      Kayıt Ol
                    </button>
                  </div>

                  {/* FORM ALANLARI */}
                  <div className="space-y-3.5">
                    {/* E-posta */}
                    <div className="space-y-1.5">
                      <Label htmlFor="auth-email" className="text-xs font-medium text-zinc-300">
                        E-posta Adresi
                      </Label>
                      <Input
                        id="auth-email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="ornek@alanadi.com"
                        className="h-10 rounded-xl border-zinc-800 bg-[#0E1526] text-white placeholder:text-zinc-600 focus-visible:border-blue-500/60 focus-visible:ring-blue-500/20"
                      />
                    </div>

                    {/* Şifre */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="auth-password" className="text-xs font-medium text-zinc-300">
                          Şifre
                        </Label>
                        {mode === "signin" && (
                          <button
                            type="button"
                            className="text-xs font-medium text-blue-400 hover:text-blue-300 hover:underline"
                            disabled={busy}
                            onClick={resetPassword}
                          >
                            Şifremi unuttum
                          </button>
                        )}
                      </div>
                      <Input
                        id="auth-password"
                        type="password"
                        autoComplete={mode === "signup" ? "new-password" : "current-password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="h-10 rounded-xl border-zinc-800 bg-[#0E1526] text-white placeholder:text-zinc-600 focus-visible:border-blue-500/60 focus-visible:ring-blue-500/20"
                      />
                      {mode === "signup" && (
                        <p className="text-[11px] text-zinc-400">En az 6 karakter.</p>
                      )}
                    </div>

                    {/* Şifre Tekrarı (Sadece Kayıt Ol modunda) */}
                    {mode === "signup" && (
                      <div className="space-y-1.5 animate-in fade-in duration-200">
                        <Label htmlFor="auth-confirm-password" className="text-xs font-medium text-zinc-300">
                          Şifre Tekrarı
                        </Label>
                        <Input
                          id="auth-confirm-password"
                          type="password"
                          autoComplete="new-password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className={cn(
                            "h-10 rounded-xl border-zinc-800 bg-[#0E1526] text-white placeholder:text-zinc-600 focus-visible:border-blue-500/60 focus-visible:ring-blue-500/20",
                            confirmPassword && password !== confirmPassword && "border-destructive focus-visible:border-destructive"
                          )}
                        />
                        {confirmPassword && password !== confirmPassword && (
                          <p className="text-[11px] font-medium text-destructive">
                            Şifreler eşleşmiyor.
                          </p>
                        )}
                      </div>
                    )}

                    {/* Beni Hatırla (Sadece Giriş Yap modunda) */}
                    {mode === "signin" && (
                      <div className="flex items-center justify-between pt-1">
                        <label className="flex items-center gap-2.5 text-xs text-zinc-300 cursor-pointer select-none">
                          <Checkbox
                            checked={rememberMe}
                            onCheckedChange={(checked) => setRememberMe(checked === true)}
                            className="border-zinc-700 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                          />
                          <span>Beni hatırla</span>
                        </label>
                      </div>
                    )}

                    {/* KVKK Onayı & Pop-up (Sadece Kayıt Ol modunda) */}
                    {mode === "signup" && (
                      <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-zinc-800/90 bg-[#0E1526]/80 p-3 text-xs text-zinc-300 select-none animate-in fade-in duration-200">
                        <Checkbox
                          checked={noticeRead}
                          onCheckedChange={(checked) => setNoticeRead(checked === true)}
                          className="mt-0.5 border-zinc-700 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                        />
                        <span className="leading-relaxed">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setKvkkOpen(true);
                            }}
                            className="font-medium text-blue-400 hover:underline inline"
                          >
                            KVKK Aydınlatma Metni
                          </button>
                          &apos;ni okudum ve onaylıyorum.
                        </span>
                      </label>
                    )}

                    {/* Ana Buton */}
                    <Button
                      className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all shadow-md mt-2 disabled:opacity-50"
                      disabled={
                        busy ||
                        !email ||
                        password.length < 6 ||
                        (mode === "signup" && (!noticeRead || password !== confirmPassword))
                      }
                      onClick={submit}
                    >
                      {busy ? (
                        <span className="inline-flex items-center gap-2">
                          <LoaderCircle className="size-4 animate-spin text-white" />
                          İşlem yapılıyor…
                        </span>
                      ) : mode === "signup" ? (
                        <>
                          Hesap Oluştur ve Doğrula
                          <ArrowRight className="size-4 ml-1.5" />
                        </>
                      ) : (
                        <>
                          Giriş Yap
                          <ArrowRight className="size-4 ml-1.5" />
                        </>
                      )}
                    </Button>

                    {/* Alt Değiştirici Link */}
                    <div className="pt-2 text-center text-xs text-zinc-400">
                      {mode === "signin" ? (
                        <p>
                          Hesabın yok mu?{" "}
                          <button
                            type="button"
                            onClick={() => setMode("signup")}
                            className="font-semibold text-blue-400 hover:text-blue-300 hover:underline transition"
                          >
                            Kayıt Ol
                          </button>
                        </p>
                      ) : (
                        <p>
                          Zaten bir hesabın var mı?{" "}
                          <button
                            type="button"
                            onClick={() => setMode("signin")}
                            className="font-semibold text-blue-400 hover:text-blue-300 hover:underline transition"
                          >
                            Giriş Yap
                          </button>
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* SAĞ VİTRİN: North AI Koç & Satranç/Beceri İlerleme Bento Kartları (Web/Masaüstü için) */}
        <div className="hidden lg:flex flex-col gap-5 w-[330px] xl:w-[360px] shrink-0">
          {/* Bento 3: North AI Koç Canlı Sohbet Görünümü */}
          <div className="rounded-2xl border border-zinc-800/90 bg-[#0B101D]/90 p-5 shadow-2xl backdrop-blur-md transition hover:border-zinc-700/80">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 mb-3.5">
              <div className="flex items-center gap-2.5">
                <span className="grid size-8 place-items-center rounded-full bg-blue-600 text-white shadow-sm">
                  <Bot className="size-4.5" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-white">North Koç</h4>
                  <p className="text-[10px] text-zinc-400">Kişisel AI Rehberin</p>
                </div>
              </div>
              <span className="rounded-full bg-[#0E1A33] border border-blue-500/30 px-2 py-0.5 text-[10px] font-semibold text-blue-400">
                ✨ Limit: 20 / 20
              </span>
            </div>

            {/* Mesaj Balonu (İsimsiz, tarafsız karşılama) */}
            <div className="rounded-2xl rounded-tl-xs bg-[#131B2E] border border-blue-950/70 p-3.5 shadow-xs mb-3">
              <h5 className="text-xs font-bold text-white mb-1">Merhaba!</h5>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Haftalık hedeflerine göre bugün için 2 derin odak bloğu öneriyorum. İngilizce kelime çalışması veya satranç taktik analiziyle başlayabilirsin.
              </p>
              <span className="text-[10px] text-zinc-400 mt-2 block text-right">12:41</span>
            </div>

            {/* Hızlı Aksiyon Hapları */}
            <div className="flex flex-wrap gap-1.5">
              <span className="rounded-full bg-[#0E1526] border border-zinc-800 hover:border-blue-500/40 px-2.5 py-1 text-[11px] text-zinc-300 cursor-default">
                ⚡ Görevi Başlat
              </span>
              <span className="rounded-full bg-[#0E1526] border border-zinc-800 hover:border-blue-500/40 px-2.5 py-1 text-[11px] text-zinc-300 cursor-default">
                🔍 Planı İncele
              </span>
            </div>
          </div>

          {/* Bento 4: Satranç & Beceri Gelişim İvmesi */}
          <div className="rounded-2xl border border-zinc-800/90 bg-[#0B101D]/90 p-4.5 shadow-2xl backdrop-blur-md transition hover:border-zinc-700/80">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-zinc-200">
                Haftalık Beceri Gelişimi
              </span>
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                %92 Hedef Tutarlılığı
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-zinc-300">İngilizce Akıcılık (C1)</span>
                  <span className="font-semibold text-blue-400">%88</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full w-[88%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-zinc-300">Satranç Taktik & Çözüm (1850 Elo)</span>
                  <span className="font-semibold text-cyan-400">%76</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                  <div className="h-full bg-cyan-500 rounded-full w-[76%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-zinc-300">Zaman & Odaklanma Disiplini</span>
                  <span className="font-semibold text-emerald-400">%94</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full w-[94%]" />
                </div>
              </div>
            </div>

            <p className="mt-3 text-[11px] text-zinc-400 text-center flex items-center justify-center gap-1">
              <Trophy className="size-3 text-amber-400" /> Bu hafta 38 saat kesintisiz derin odak sağlandı.
            </p>
          </div>
        </div>
      </div>

      {/* KVKK AYDINLATMA METNİ POP-UP (MODAL) */}
      <Dialog open={kvkkOpen} onOpenChange={setKvkkOpen}>
        <DialogContent className="max-w-2xl max-h-[85dvh] flex flex-col bg-[#0B101D] border-zinc-800 text-white rounded-2xl p-6">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base sm:text-lg font-bold text-white">
              KVKK Aydınlatma Metni
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              Sürüm: 6 Eylül 2026
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-2 space-y-4 text-xs text-zinc-300 leading-relaxed">
            <section className="space-y-1">
              <h4 className="font-bold text-white text-xs">1. İşlenen veriler</h4>
              <p className="text-zinc-400">
                North; hesap oluştururken e-posta adresi, Firebase kullanıcı kimliği ve oturum sağlayıcısını işler. Uygulamayı kullandığında hedeflerin, değerlendirme yanıtların ve sonuçların, çalışma planların, görevlerin, odak kayıtların, beceri ve kanıtların, notların ve koç görüşmelerin hesabına bağlı olarak saklanabilir.
              </p>
            </section>

            <section className="space-y-1">
              <h4 className="font-bold text-white text-xs">2. İşleme amaçları ve hukuki sebep</h4>
              <p className="text-zinc-400">
                Bu veriler hesabı oluşturmak ve güvenli oturum açmayı sağlamak, ilerlemeyi cihazlar arasında eşitlemek, kişiselleştirilmiş plan ve analiz üretmek, AI koç özelliklerini sunmak ve hizmet güvenliğini korumak amacıyla işlenir. Hesap ve temel çalışma alanı verileri hizmetin kurulması ve ifası kapsamında işlenir.
              </p>
            </section>

            <section className="space-y-1">
              <h4 className="font-bold text-white text-xs">3. Verilerin aktarılması</h4>
              <p className="text-zinc-400">
                Kimlik doğrulama ve veri saklama için Google Firebase, uygulamanın barındırılması için Vercel ve yalnızca AI özelliklerini kullandığında yanıt üretimi için OpenAI hizmetlerinden yararlanılır. Bu sağlayıcıların sunucuları Türkiye dışında bulunabileceğinden veriler yurt dışına aktarılabilir. North, burada açıklanan amaç dışında veri satışı yapmaz.
              </p>
            </section>

            <section className="space-y-1">
              <h4 className="font-bold text-white text-xs">4. Saklama ve güvenlik</h4>
              <p className="text-zinc-400">
                Veriler hesabın açık olduğu süre boyunca veya hizmetin sunulması ve yasal yükümlülükler için gerekli süre boyunca saklanır. Hesabını profil ve ayarlar ekranından silebilirsin. Aktarım sırasında güvenli bağlantılar ve hizmet sağlayıcıların erişim kontrolleri kullanılır.
              </p>
            </section>

            <section className="space-y-1">
              <h4 className="font-bold text-white text-xs">5. KVKK kapsamındaki hakların</h4>
              <p className="text-zinc-400">
                6698 sayılı Kanun&apos;un 11. maddesi kapsamında verilerinin işlenip işlenmediğini öğrenme, bilgi isteme, işleme amacını ve amaca uygun kullanılıp kullanılmadığını öğrenme, aktarılan tarafları bilme, eksik veya yanlış verilerin düzeltilmesini isteme, şartları oluştuğunda silme veya yok etme talep etme, otomatik analiz sonucuna itiraz etme ve zararın giderilmesini isteme haklarına sahipsin.
              </p>
            </section>
          </div>

          <DialogFooter className="flex-row items-center justify-end gap-2 pt-3 border-t border-zinc-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl border-zinc-800 bg-[#0E1526] hover:bg-[#131B2E] text-zinc-300"
              onClick={() => setKvkkOpen(false)}
            >
              Kapat
            </Button>
            <Button
              type="button"
              size="sm"
              className="rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold"
              onClick={() => {
                setNoticeRead(true);
                setKvkkOpen(false);
              }}
            >
              Okudum ve Onaylıyorum
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function Brand() {
  return (
    <div className="text-center mb-6 space-y-2">
      <div className="inline-flex items-center justify-center gap-2.5">
        <NorthLogo size={42} priority />
        <span className="text-2xl font-bold tracking-tight text-white">North</span>
      </div>
      <h1 className="text-base sm:text-lg font-bold text-zinc-100 tracking-tight">
        Daha az karar. Daha iyi odak. Net hedefler.
      </h1>
      <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
        Kişiselleştirilmiş AI rehberliği ve derin odaklanma kokpiti ile gelişimini hızlandır.
      </p>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5 shrink-0">
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.91h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.4Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.97-.9 6.63-2.42l-3.24-2.54c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.39 13.87A6 6 0 0 1 6.08 12c0-.65.11-1.28.31-1.87V7.51H3.04A10 10 0 0 0 2 12c0 1.61.39 3.14 1.04 4.49l3.35-2.62Z"
      />
      <path
        fill="#EA4335"
        d="M12 6c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.63 9.63 0 0 0 12 2a10 10 0 0 0-8.96 5.51l3.35 2.62C7.18 7.76 9.39 6 12 6Z"
      />
    </svg>
  );
}

function LocalMode() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-sm text-amber-200">
        <p className="font-semibold text-amber-300">Yerel Mod Aktif</p>
        <p className="mt-1 text-xs text-amber-300/80 leading-relaxed">
          Firebase ayarları henüz yapılandırılmadı. Yerel demo çalışma alanını açabilirsiniz.
        </p>
      </div>
      <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl h-11" size="lg" asChild>
        <Link href="/">
          Yerel Çalışma Alanını Aç <ArrowRight className="size-4 ml-1.5" />
        </Link>
      </Button>
    </div>
  );
}

function Verification({
  busy,
  onResend,
  onDone,
}: {
  busy: boolean;
  onResend: () => void;
  onDone: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-blue-950 bg-[#131B2E] p-4 text-sm text-zinc-300">
        <MailCheck className="mb-2 size-6 text-blue-400" />
        <p className="font-bold text-white">Doğrulama Bağlantısını Aç</p>
        <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
          E-postana bir doğrulama bağlantısı gönderdik. Gelen kutunu (veya spam klasörünü) kontrol edip bağlantıya tıkla.
        </p>
      </div>
      <Button
        className="w-full rounded-xl border-zinc-800 bg-[#0E1526] hover:bg-[#131B2E] text-white"
        variant="outline"
        disabled={busy}
        onClick={onResend}
      >
        {busy ? "Gönderiliyor…" : "Doğrulama e-postasını yeniden gönder"}
      </Button>
      <Button
        className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold"
        onClick={onDone}
      >
        Doğruladım, Giriş Yap
      </Button>
    </div>
  );
}
