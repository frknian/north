"use client";

import { useEffect, useMemo, useState } from "react";
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
import { deleteDoc, doc, getDoc, setDoc } from "firebase/firestore";
import {
  ArrowRight,
  CircleHelp,
  Compass,
  LoaderCircle,
  MailCheck,
  Sparkles,
  Target,
} from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/layout/theme-toggle";
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
import { validatePasswordStrength } from "@/lib/types";
import { cn } from "@/lib/utils";

const KVKK_VERSION = "2026-09-06";

function message(error: unknown) {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
  const rawMessage = typeof error === "object" && error && "message" in error ? String(error.message) : "";
  console.error("Auth error details:", { code, error });

  const map: Record<string, string> = {
    "auth/unauthorized-domain": "Bu alan adı Firebase'de yetkilendirilmemiş. Firebase Console > Authentication > Settings > Authorized domains bölümüne 'north-frkian.vercel.app' eklenmelidir.",
    "auth/operation-not-allowed": "Firebase Console'da Google ile giriş sağlayıcısı henüz aktif edilmemiş.",
    "auth/account-exists-with-different-credential": "Bu e-posta adresiyle başka bir yöntemle kayıt olunmuş. Lütfen şifrenizle giriş yapın.",
    "auth/popup-closed-by-user": "Google penceresi kapatıldı.",
    "auth/cancelled-popup-request": "Giriş işlemi iptal edildi.",
    "auth/popup-blocked": "Tarayıcı açılır pencereyi engelledi. Lütfen açılır pencerelere izin verin.",
    "auth/network-request-failed": "Ağ hatası. Lütfen internet bağlantınızı kontrol edin.",
    "auth/email-already-in-use": "Bu e-posta adresiyle zaten bir hesap var. Giriş yapmayı dene.",
    "auth/user-not-found": "Böyle bir hesap bulunamadı. Lütfen önce Kayıt Ol sekmesinden kayıt olun.",
    "auth/invalid-credential": "E-posta veya şifre hatalı. Hesabınız yoksa lütfen Kayıt Ol sekmesini kullanın.",
    "auth/invalid-email": "Geçerli bir e-posta adresi yaz.",
    "auth/too-many-requests": "Çok fazla deneme yapıldı. Bir süre sonra tekrar dene.",
    "auth/weak-password": "Şifre en az 8 karakter olmalı, büyük harf, küçük harf ve özel karakter içermelidir.",
  };

  if (code && map[code]) return map[code];
  if (code) return `Giriş hatası (${code}): ${rawMessage || "Yetkilendirme başarısız."}`;
  return rawMessage || "Kimlik doğrulama başarısız oldu.";
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [noticeRead, setNoticeRead] = useState(false);
  const [kvkkOpen, setKvkkOpen] = useState(false);
  const [systemInfoOpen, setSystemInfoOpen] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [pending, setPending] = useState(false);
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  const pwdValidation = useMemo(() => validatePasswordStrength(password), [password]);

  const firebaseReady = isFirebaseConfigured();

  // Load remembered email on mount
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const savedEmail = localStorage.getItem("north_remembered_email");
        if (savedEmail) {
          setEmail(savedEmail);
          setRememberMe(true);
        }
      } catch {}
    }, 0);
    return () => window.clearTimeout(timer);
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

    if (mode === "signup" && !noticeRead) {
      toast.error("Google ile kayıt olabilmek için lütfen aşağıdaki KVKK Aydınlatma Metni'ni onaylayın.");
      return;
    }

    setGoogleBusy(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const result = await signInWithPopup(firebase.auth, provider);
      const isNewUser = Boolean(getAdditionalUserInfo(result)?.isNewUser);

      // Check if user has an existing account in Firestore
      const ref = doc(firebase.db, "users", result.user.uid, "workspaces", "cybercoach");
      const snapshot = await getDoc(ref).catch(() => null);
      const accountExists = !isNewUser && Boolean(snapshot && snapshot.exists());

      // CASE 1: User tried to SIGN IN (Giriş Yap), but has NO account!
      if (mode === "signin" && !accountExists) {
        // Prevent auto-registration. Delete user from auth if new, or sign out.
        if (isNewUser) {
          await deleteUser(result.user).catch(() => undefined);
        } else {
          await signOut(firebase.auth).catch(() => undefined);
        }
        toast.error("Böyle bir hesap bulunamadı. Lütfen önce 'Kayıt Ol' sekmesinden kayıt olun.");
        setMode("signup");
        return;
      }

      // CASE 2: User tried to SIGN UP (Kayıt Ol), but ALREADY has an account!
      if (mode === "signup" && accountExists) {
        toast.info("Bu Google hesabı ile zaten kayıtlı bir hesabınız var. Giriş yapıldı.");
        router.push("/");
        router.refresh();
        return;
      }

      // CASE 3: Valid Registration from SIGN UP mode
      if (mode === "signup" || isNewUser) {
        try {
          await saveRegistration(result.user, "google.com");
        } catch (error) {
          console.error("Kayıt verisi yazılırken hata:", error);
        }
        toast.success("Google ile hesabınız oluşturuldu! Başlangıç hedeflerini belirleyelim.");
        router.push("/onboarding");
      } else {
        // CASE 4: Valid Sign In from SIGN IN mode
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
      if (!noticeRead) {
        toast.error("Kayıt olabilmek için lütfen KVKK Aydınlatma Metni'ni onaylayın.");
        return;
      }
      if (!pwdValidation.isValid) {
        toast.error(
          pwdValidation.errorMessage ||
            "Şifre en az 8 karakter olmalı, büyük harf, küçük harf ve özel karakter içermelidir."
        );
        return;
      }
      if (password !== confirmPassword) {
        toast.error("Şifreler eşleşmiyor. Lütfen her iki alana da aynı şifreyi girin.");
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
    <main className="relative min-h-dvh flex items-center justify-center overflow-x-hidden bg-background text-foreground px-4 py-8 sm:py-12">
      {/* Theme toggle in top right */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle className="size-9 border border-border bg-card shadow-2xs" />
      </div>

      {/* Subtle ambient background glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 size-[500px] rounded-full bg-primary/5 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-32 right-10 size-[350px] rounded-full bg-primary/5 blur-[100px]" />

      <div className="relative w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(380px,460px)] items-center gap-10 xl:gap-20 z-10">
        <div className="hidden lg:flex login-stitch-intro">
          <p className="north-eyebrow">PLANORTH · KİŞİSEL ÇALIŞMA ALANI</p>
          <h1>Zihinsel akışa geri dönün.</h1>
          <p>Hedeflerini, odak seanslarını ve öğrendiklerini aynı yerde takip et. Her adım senin gerçek kayıtlarınla şekillenir.</p>
          <div className="login-stitch-features">
            <div><span>01</span><strong>Zen odak modu</strong><small>Dikkatini tek bir çalışmaya ver.</small></div>
            <div><span>02</span><strong>Planorth Koç</strong><small>Planını ve kanıtlarını birlikte değerlendir.</small></div>
            <div><span>03</span><strong>Gelişim analizi</strong><small>İlerlemeni kendi verilerinle gör.</small></div>
          </div>
        </div>

        {/* ORTA: Giriş & Kayıt Kartı */}
        <div className="w-full max-w-md shrink-0 lg:justify-self-end">
          <Brand onOpenSystemInfo={() => setSystemInfoOpen(true)} />

          <Card className="w-full border border-border bg-card text-card-foreground shadow-xl rounded-2xl overflow-hidden">
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
                {/* SEKMELER: GİRİŞ YAP & KAYIT OL */}
                <div className="grid grid-cols-2 rounded-xl bg-muted p-1 border border-border mb-4" role="tablist">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={mode === "signin"}
                    className={cn(
                      "rounded-lg py-2 text-xs sm:text-sm font-semibold transition-all",
                      mode === "signin"
                        ? "bg-background text-foreground shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
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
                        ? "bg-background text-foreground shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() => setMode("signup")}
                  >
                    Kayıt Ol
                  </button>
                </div>

                {/* GOOGLE BUTONU */}
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="w-full h-11 border-border bg-background hover:bg-muted text-foreground font-medium shadow-2xs transition-all flex items-center justify-center gap-3 rounded-xl"
                    disabled={busy || googleBusy}
                    onClick={signInWithGoogle}
                  >
                    {googleBusy ? (
                      <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                        <LoaderCircle className="size-4 animate-spin text-primary" />
                        Google ile bağlanıyor…
                      </span>
                    ) : (
                      <>
                        <GoogleMark />
                        <span className="text-sm font-medium">
                          {mode === "signup" ? "Google ile Kayıt Ol" : "Google ile Giriş Yap"}
                        </span>
                      </>
                    )}
                  </Button>
                </div>

                {/* VEYA E-POSTA AYIRICI */}
                <div className="relative my-4 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <span className="relative bg-card px-3 text-[11px] font-medium text-muted-foreground">
                    veya e-posta ile {mode === "signup" ? "kayıt ol" : "devam et"}
                  </span>
                </div>

                {/* FORM ALANLARI */}
                <div className="space-y-3.5">
                  {/* E-posta */}
                  <div className="space-y-1.5">
                    <Label htmlFor="auth-email" className="text-xs font-medium text-foreground">
                      E-posta Adresi
                    </Label>
                    <Input
                      id="auth-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ornek@alanadi.com"
                      className="h-10 rounded-xl border-border bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/20"
                    />
                  </div>

                  {/* Şifre */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="auth-password" className="text-xs font-medium text-foreground">
                        Şifre
                      </Label>
                      {mode === "signin" && (
                        <button
                          type="button"
                          className="text-xs font-medium text-primary hover:underline"
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
                      className="h-10 rounded-xl border-border bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/20"
                    />
                    {mode === "signup" && (
                      <div className="space-y-2 pt-1 animate-in fade-in duration-200">
                        {/* 4 Kademeli Güç Çubuğu */}
                        <div className="flex items-center gap-1.5 pt-0.5" aria-label="Şifre Gücü">
                          {[0, 1, 2, 3].map((i) => {
                            const active = i < pwdValidation.score;
                            const isFull = pwdValidation.isValid;
                            return (
                              <div
                                key={i}
                                className={cn(
                                  "h-1 flex-1 rounded-full transition-all duration-300",
                                  active
                                    ? isFull
                                      ? "bg-emerald-500"
                                      : pwdValidation.score >= 3
                                      ? "bg-blue-500"
                                      : pwdValidation.score === 2
                                      ? "bg-amber-500"
                                      : "bg-rose-500"
                                    : "bg-muted"
                                )}
                              />
                            );
                          })}
                        </div>

                        {/* Canlı Kriter Kontrol Listesi */}
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
                          {pwdValidation.requirements.map((req) => (
                            <div
                              key={req.id}
                              className={cn(
                                "flex items-center gap-1.5 transition-colors duration-200",
                                req.met
                                  ? "text-emerald-600 dark:text-emerald-400 font-medium"
                                  : "text-muted-foreground"
                              )}
                            >
                              <div
                                className={cn(
                                  "size-3.5 rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold transition-colors",
                                  req.met
                                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                    : "bg-muted text-muted-foreground/60"
                                )}
                              >
                                {req.met ? "✓" : "•"}
                              </div>
                              <span className="truncate">{req.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Şifre Tekrarı (Sadece Kayıt Ol modunda) */}
                  {mode === "signup" && (
                    <div className="space-y-1.5 animate-in fade-in duration-200">
                      <Label htmlFor="auth-confirm-password" className="text-xs font-medium text-foreground">
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
                          "h-10 rounded-xl border-border bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/20",
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
                      <label className="flex items-center gap-2.5 text-xs text-muted-foreground cursor-pointer select-none">
                        <Checkbox
                          checked={rememberMe}
                          onCheckedChange={(checked) => setRememberMe(checked === true)}
                        />
                        <span>Beni hatırla</span>
                      </label>
                    </div>
                  )}

                  {/* KVKK Onay Kutusu (Sadece Kayıt Ol modunda) */}
                  {mode === "signup" && (
                    <div className="space-y-1.5 pt-1 animate-in fade-in duration-200">
                      <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-border bg-muted/30 p-2.5 sm:p-3 text-xs text-foreground select-none transition hover:bg-muted/50">
                        <Checkbox
                          checked={noticeRead}
                          onCheckedChange={(checked) => setNoticeRead(checked === true)}
                          className="mt-0.5"
                        />
                        <span className="leading-relaxed text-muted-foreground">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setKvkkOpen(true);
                            }}
                            className="font-semibold text-primary hover:underline inline"
                          >
                            KVKK Aydınlatma Metni
                          </button>
                          &apos;ni okudum, anladım ve kabul ediyorum.
                        </span>
                      </label>
                      <p className="text-[11px] text-muted-foreground px-1 leading-normal">
                        * Hesap oluşturabilmek için KVKK onayını vermen gerekir.
                      </p>
                    </div>
                  )}

                  {/* Ana Buton */}
                  <Button
                    className="w-full h-11 font-semibold rounded-xl transition-all shadow-2xs mt-2 disabled:opacity-50"
                    disabled={
                      busy ||
                      !email ||
                      (mode === "signup"
                        ? !pwdValidation.isValid || !noticeRead || password !== confirmPassword
                        : password.length < 6)
                    }
                    onClick={submit}
                  >
                    {busy ? (
                      <span className="inline-flex items-center gap-2">
                        <LoaderCircle className="size-4 animate-spin" />
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
                  <div className="pt-2 text-center text-xs text-muted-foreground">
                    {mode === "signin" ? (
                      <p>
                        Hesabın yok mu?{" "}
                        <button
                          type="button"
                          onClick={() => setMode("signup")}
                          className="font-semibold text-primary hover:underline transition"
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
                          className="font-semibold text-primary hover:underline transition"
                        >
                          Giriş Yap
                        </button>
                      </p>
                    )}
                  </div>

                  {/* Alt Bilgi: Sistem Rehberi & KVKK Butonları */}
                  <div className="pt-2 flex items-center justify-center gap-3 text-center">
                    <button
                      type="button"
                      onClick={() => setSystemInfoOpen(true)}
                      className="text-[11px] font-medium text-primary hover:underline transition inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="size-3" />
                      Planorth Nedir?
                    </button>
                    <span className="text-muted-foreground/40 text-[10px]">•</span>
                    <button
                      type="button"
                      onClick={() => setKvkkOpen(true)}
                      className="text-[11px] text-muted-foreground hover:text-foreground hover:underline transition cursor-pointer"
                    >
                      KVKK Metni
                    </button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      </div>

      {/* KVKK AYDINLATMA METNİ POP-UP (MODAL) */}
      <Dialog open={kvkkOpen} onOpenChange={setKvkkOpen}>
        <DialogContent className="max-w-2xl max-h-[85dvh] flex flex-col bg-card border-border text-card-foreground rounded-2xl p-6">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
              KVKK Aydınlatma Metni
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Sürüm: 6 Eylül 2026
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-2 space-y-4 text-xs text-muted-foreground leading-relaxed">
            <section className="space-y-1">
              <h4 className="font-bold text-foreground text-xs">1. İşlenen veriler</h4>
              <p>
                North; hesap oluştururken e-posta adresi, Firebase kullanıcı kimliği ve oturum sağlayıcısını işler. Uygulamayı kullandığında hedeflerin, değerlendirme yanıtların ve sonuçların, çalışma planların, görevlerin, odak kayıtların, beceri ve kanıtların, notların ve koç görüşmelerin hesabına bağlı olarak saklanabilir.
              </p>
            </section>

            <section className="space-y-1">
              <h4 className="font-bold text-foreground text-xs">2. İşleme amaçları ve hukuki sebep</h4>
              <p>
                Bu veriler hesabı oluşturmak ve güvenli oturum açmayı sağlamak, ilerlemeyi cihazlar arasında eşitlemek, kişiselleştirilmiş plan ve analiz üretmek, AI koç özelliklerini sunmak ve hizmet güvenliğini korumak amacıyla işlenir. Hesap ve temel çalışma alanı verileri hizmetin kurulması ve ifası kapsamında işlenir.
              </p>
            </section>

            <section className="space-y-1">
              <h4 className="font-bold text-foreground text-xs">3. Verilerin aktarılması</h4>
              <p>
                Kimlik doğrulama ve veri saklama için Google Firebase, uygulamanın barındırılması için Vercel ve yalnızca AI özelliklerini kullandığında yanıt üretimi için OpenAI hizmetlerinden yararlanılır. Bu sağlayıcıların sunucuları Türkiye dışında bulunabileceğinden veriler yurt dışına aktarılabilir. North, burada açıklanan amaç dışında veri satışı yapmaz.
              </p>
            </section>

            <section className="space-y-1">
              <h4 className="font-bold text-foreground text-xs">4. Saklama ve güvenlik</h4>
              <p>
                Veriler hesabın açık olduğu süre boyunca veya hizmetin sunulması ve yasal yükümlülükler için gerekli süre boyunca saklanır. Hesabını profil ve ayarlar ekranından silebilirsin. Aktarım sırasında güvenli bağlantılar ve hizmet sağlayıcıların erişim kontrolleri kullanılır.
              </p>
            </section>

            <section className="space-y-1">
              <h4 className="font-bold text-foreground text-xs">5. KVKK kapsamındaki hakların</h4>
              <p>
                6698 sayılı Kanun&apos;un 11. maddesi kapsamında verilerinin işlenip işlenmediğini öğrenme, bilgi isteme, işleme amacını ve amaca uygun kullanılıp kullanılmadığını öğrenme, aktarılan tarafları bilme, eksik veya yanlış verilerin düzeltilmesini isteme, şartları oluştuğunda silme veya yok etme talep etme, otomatik analiz sonucuna itiraz etme ve zararın giderilmesini isteme haklarına sahipsin.
              </p>
            </section>
          </div>

          <DialogFooter className="flex-row items-center justify-end gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl border-border"
              onClick={() => setKvkkOpen(false)}
            >
              Kapat
            </Button>
            <Button
              type="button"
              size="sm"
              className="rounded-xl font-semibold"
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

      {/* SİSTEM & UYGULAMA REHBERİ POP-UP (MODAL) */}
      <Dialog open={systemInfoOpen} onOpenChange={setSystemInfoOpen}>
        <DialogContent className="max-w-2xl max-h-[85dvh] flex flex-col bg-card border-border text-card-foreground rounded-3xl p-6 shadow-2xl">
          <DialogHeader className="space-y-1.5 text-left border-b border-border/60 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="size-8 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
                <Sparkles className="size-4.5" />
              </span>
              <div>
                <DialogTitle className="text-base sm:text-lg font-extrabold text-foreground">
                  Planorth Nedir ve Nasıl Çalışır?
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Karar yorgunluğunu bitiren, suçluluk hissettirmeyen kişisel gelişim ve derin odaklanma sistemi.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-1 space-y-4 text-xs text-muted-foreground leading-relaxed py-2">
            {/* 1. FELSEFE */}
            <section className="rounded-2xl border border-primary/25 bg-primary/5 p-3.5 space-y-1.5 text-foreground">
              <h4 className="font-bold text-xs text-primary flex items-center gap-1.5">
                <Target className="size-3.5" /> Felsefemiz: Daha Az Karar, Daha Derin Odak
              </h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Klasik yapılacaklar listeleri her gün ertelenen onlarca maddeyle suçluluk ve karar yorgunluğu yaratır. Planorth, her an sadece o sırada yapman gereken <strong>tek anlamlı göreve</strong> odaklandırır. Yetişmeyen işler borç olmaz; yapay zeka ile otomatik küçültülür veya haftalık havuza alınır.
              </p>
            </section>

            {/* 2. TÜM SEKME VE MODÜLLER */}
            <section className="space-y-2.5">
              <h4 className="font-bold text-foreground text-xs uppercase tracking-wider">
                Tüm Sekmeler ve Temel Yetenekler
              </h4>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-xl border border-border/70 bg-muted/20 p-3 space-y-1">
                  <p className="font-bold text-foreground text-xs flex items-center gap-1.5">
                    <span>🏠</span> Bugün Ekranı
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    Büyük ŞİMDİ odak kartı, sabah pusulası, akşam günü suçluluksuz kapatma ritüeli ve günlük mikro alışkanlık zincirleri.
                  </p>
                </div>

                <div className="rounded-xl border border-border/70 bg-muted/20 p-3 space-y-1">
                  <p className="font-bold text-foreground text-xs flex items-center gap-1.5">
                    <span>🎓</span> Alanlar &amp; Sınav Kampları
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    Vize/final haftaları veya kariyer konuları için elindeki PDF/ders notunu yükle; yapay zeka belgeyi inceler, modüllere böler ve seni hazırlar.
                  </p>
                </div>

                <div className="rounded-xl border border-border/70 bg-muted/20 p-3 space-y-1">
                  <p className="font-bold text-foreground text-xs flex items-center gap-1.5">
                    <span>📋</span> Haftalık Esnek Plan
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    Görevleri tek tıkla küçültme (shrink), erteleme (postpone), havuza alma ve takvimdeki boşluklara akıllı otomatik dağıtım.
                  </p>
                </div>

                <div className="rounded-xl border border-border/70 bg-muted/20 p-3 space-y-1">
                  <p className="font-bold text-foreground text-xs flex items-center gap-1.5">
                    <span>📚</span> Kaynaklar &amp; Kütüphane
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    Canlı Web ve Google PDF arama motoru, NotebookLM entegrasyonu, PDF sayfa pinleme ve AI kaynak özetleri.
                  </p>
                </div>

                <div className="rounded-xl border border-border/70 bg-muted/20 p-3 space-y-1">
                  <p className="font-bold text-foreground text-xs flex items-center gap-1.5">
                    <span>⚡</span> Zen Odak Kokpiti
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    6 kanallı ortam ses mikseri (yağmur, kafe vb.), yan panelde kaynak okuma ve çoklu sekme kilit koruması.
                  </p>
                </div>

                <div className="rounded-xl border border-border/70 bg-muted/20 p-3 space-y-1">
                  <p className="font-bold text-foreground text-xs flex items-center gap-1.5">
                    <span>🤖</span> Planorth AI Koç
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    Çalışma alışkanlıklarını hatırlayan hafıza sistemi, proaktif uyarılar ve her an danışabileceğin kayan koç butonu.
                  </p>
                </div>
              </div>
            </section>

            {/* 3. KİMLER İÇİN */}
            <section className="space-y-1 pt-1">
              <h4 className="font-bold text-foreground text-xs">Kimler İçin İdeal?</h4>
              <p className="text-[11px]">
                Üniversite öğrencileri (vize, final, proje hazırlığı), yazılım ve siber güvenlik gibi teknik alanlarda çalışanlar, dil öğrenenler ve kariyerinde derinleşmek isteyen tüm profesyoneller için optimize edilmiştir.
              </p>
            </section>

            {/* 4. GÜVENLİK */}
            <section className="space-y-1 pt-1">
              <h4 className="font-bold text-foreground text-xs">Güvenlik ve Gizlilik</h4>
              <p className="text-[11px]">
                Verileriniz şifrelenir ve KVKK ile tam uyumludur. Dilediğiniz zaman çalışma alanınızın tam bir JSON kopyasını indirebilir veya hesabınızı tek tıkla silebilirsiniz.
              </p>
            </section>
          </div>

          <DialogFooter className="flex-row items-center justify-between sm:justify-between gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl border-border text-xs"
              onClick={() => setSystemInfoOpen(false)}
            >
              Kapat
            </Button>
            <Button
              type="button"
              size="sm"
              className="rounded-xl font-semibold text-xs bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => {
                setMode("signup");
                setSystemInfoOpen(false);
              }}
            >
              Hemen Kayıt Ol <ArrowRight className="size-3.5 ml-1" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function Brand({ onOpenSystemInfo }: { onOpenSystemInfo?: () => void } = {}) {
  return (
    <div className="text-center mb-6 space-y-2.5">
      <div className="inline-flex items-center justify-center gap-2.5">
        <NorthLogo size={42} priority />
        <span className="font-planorth text-2xl tracking-[0.04em] text-foreground">PLANORTH</span>
      </div>
      <h1 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
        Daha az karar. Daha iyi odak. Net hedefler.
      </h1>
      <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
        Kişiselleştirilmiş AI koçluk ve derin odaklanma ile hedeflerine adım adım ulaş.
      </p>
      {onOpenSystemInfo && (
        <div className="pt-0.5">
          <button
            type="button"
            onClick={onOpenSystemInfo}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold shadow-2xs transition-all cursor-pointer hover:scale-105 active:scale-95"
          >
            <Sparkles className="size-3.5 animate-pulse text-primary" />
            <span>Planorth Nedir? Sistemi Keşfet ↗</span>
          </button>
        </div>
      )}
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
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-sm text-amber-600 dark:text-amber-200">
        <p className="font-semibold">Yerel Mod Aktif</p>
        <p className="mt-1 text-xs opacity-80 leading-relaxed">
          Firebase ayarları henüz yapılandırılmadı. Yerel demo çalışma alanını açabilirsiniz.
        </p>
      </div>
      <Button className="w-full rounded-xl h-11" size="lg" asChild>
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
      <div className="rounded-2xl border border-border bg-muted/40 p-4 text-sm text-foreground">
        <MailCheck className="mb-2 size-6 text-primary" />
        <p className="font-bold">Doğrulama Bağlantısını Aç</p>
        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
          E-postana bir doğrulama bağlantısı gönderdik. Gelen kutunu (veya spam klasörünü) kontrol edip bağlantıya tıkla.
        </p>
      </div>
      <Button
        className="w-full rounded-xl"
        variant="outline"
        disabled={busy}
        onClick={onResend}
      >
        {busy ? "Gönderiliyor…" : "Doğrulama e-postasını yeniden gönder"}
      </Button>
      <Button
        className="w-full rounded-xl font-semibold"
        onClick={onDone}
      >
        Doğruladım, Giriş Yap
      </Button>
    </div>
  );
}
