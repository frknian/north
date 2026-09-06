"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  deleteUser,
  getAdditionalUserInfo,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  type User,
} from "firebase/auth";
import { deleteDoc, doc, setDoc } from "firebase/firestore";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getFirebase, isFirebaseConfigured } from "@/lib/firebase/client";

const KVKK_VERSION = "2026-09-06";
const USERNAME_PATTERN = /^[a-zA-Z0-9çÇğĞıİöÖşŞüÜ._-]{3,24}$/;

function authErrorMessage(error: unknown) {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
  const messages: Record<string, string> = {
    "auth/email-already-in-use": "Bu e-posta adresiyle zaten bir hesap var. Giriş yapmayı dene.",
    "auth/invalid-credential": "E-posta veya şifre hatalı.",
    "auth/invalid-email": "Geçerli bir e-posta adresi yaz.",
    "auth/operation-not-allowed": "Google ile giriş Firebase'de henüz etkin değil.",
    "auth/popup-closed-by-user": "Google penceresi tamamlanmadan kapatıldı.",
    "auth/popup-blocked": "Tarayıcı Google giriş penceresini engelledi. Açılır pencerelere izin verip tekrar dene.",
    "auth/too-many-requests": "Çok fazla deneme yapıldı. Bir süre sonra tekrar dene.",
    "auth/weak-password": "Şifre en az 6 karakter olmalı.",
  };
  return messages[code] ?? (error instanceof Error ? error.message : "Kimlik doğrulama başarısız oldu.");
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [noticeRead, setNoticeRead] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [busy, setBusy] = useState(false);
  const configured = isFirebaseConfigured();
  const normalizedUsername = username.trim();
  const signupReady = USERNAME_PATTERN.test(normalizedUsername) && noticeRead;

  async function saveRegistration(user: User, provider: "password" | "google.com") {
    const firebase = getFirebase();
    if (!firebase) return;
    const acceptedAt = new Date().toISOString();
    await updateProfile(user, { displayName: normalizedUsername });
    await setDoc(doc(firebase.db, "users", user.uid, "workspaces", "cybercoach"), {
      account: {
        username: normalizedUsername,
        email: user.email,
        provider,
        createdAt: acceptedAt,
        kvkk: { version: KVKK_VERSION, noticeReadAt: acceptedAt },
      },
    }, { merge: true });
  }

  async function removeIncompleteRegistration(user: User) {
    const firebase = getFirebase();
    if (firebase) {
      await deleteDoc(doc(firebase.db, "users", user.uid, "workspaces", "cybercoach")).catch(() => undefined);
    }
    await deleteUser(user).catch(() => undefined);
  }

  async function authenticate() {
    const firebase = getFirebase();
    if (!firebase) return;
    if (mode === "signup" && !signupReady) {
      toast.error("Kullanıcı adını tamamla ve KVKK Aydınlatma Metni'ni okuduğunu onayla.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signin") {
        await signInWithEmailAndPassword(firebase.auth, email.trim(), password);
      } else {
        const result = await createUserWithEmailAndPassword(firebase.auth, email.trim(), password);
        try {
          await saveRegistration(result.user, "password");
        } catch (error) {
          await removeIncompleteRegistration(result.user);
          throw error;
        }
      }
      toast.success(mode === "signin" ? "Tekrar hoş geldin." : "Hesabın oluşturuldu. Şimdi başlangıç değerlendirmesine geçiyoruz.");
      router.push(mode === "signup" ? "/onboarding" : "/");
      router.refresh();
    } catch (error) {
      toast.error(authErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function authenticateWithGoogle() {
    const firebase = getFirebase();
    if (!firebase) return;
    if (mode === "signup" && !signupReady) {
      toast.error("Google ile kayıt için kullanıcı adını tamamla ve KVKK Aydınlatma Metni'ni okuduğunu onayla.");
      return;
    }
    setBusy(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const result = await signInWithPopup(firebase.auth, provider);
      const isNewUser = Boolean(getAdditionalUserInfo(result)?.isNewUser);

      if (mode === "signin" && isNewUser) {
        await removeIncompleteRegistration(result.user);
        toast.error("Bu Google hesabı North'ta kayıtlı değil. Kayıt ol sekmesinden kullanıcı adı ve KVKK onayıyla devam et.");
        return;
      }

      if (mode === "signup" && isNewUser) {
        try {
          await saveRegistration(result.user, "google.com");
        } catch (error) {
          await removeIncompleteRegistration(result.user);
          throw error;
        }
        toast.success("Google hesabınla kayıt oldun. Şimdi başlangıç değerlendirmesine geçiyoruz.");
        router.push("/onboarding");
      } else {
        toast.success(mode === "signup" ? "Bu Google hesabı zaten kayıtlıydı; giriş yapıldı." : "Google hesabınla giriş yaptın.");
        router.push("/");
      }
      router.refresh();
    } catch (error) {
      toast.error(authErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return <main className="grid min-h-dvh place-items-center px-4 py-10"><div className="w-full max-w-md">
    <div className="mb-6 flex items-center justify-center gap-3"><div className="grid size-10 place-items-center overflow-hidden rounded-xl bg-white"><Image src="/north-mark.png" alt="North" width={40} height={40} className="size-10 object-contain p-1" priority /></div><div><p className="font-semibold">North</p><p className="text-xs text-muted-foreground">Daha az karar. Daha iyi odak.</p></div></div>
    <Card><CardHeader><CardTitle>{mode === "signup" ? "North'a başla" : "Gelişimine devam et"}</CardTitle><CardDescription>{mode === "signup" ? "Hesabını oluştur; ardından kısa değerlendirmeyi çöz ve hedeflerini belirle." : "Hedeflerini, odak oturumlarını ve ilerlemeni cihazların arasında eşitle."}</CardDescription></CardHeader><CardContent className="space-y-4">{configured ? <>
      <div className="grid grid-cols-2 rounded-lg bg-muted p-1" role="tablist" aria-label="Hesap işlemi"><button type="button" role="tab" aria-selected={mode === "signup"} className={`rounded-md px-3 py-2 text-sm ${mode === "signup" ? "bg-background font-medium text-foreground" : "text-muted-foreground"}`} onClick={() => setMode("signup")}>Kayıt ol</button><button type="button" role="tab" aria-selected={mode === "signin"} className={`rounded-md px-3 py-2 text-sm ${mode === "signin" ? "bg-background font-medium text-foreground" : "text-muted-foreground"}`} onClick={() => setMode("signin")}>Giriş yap</button></div>
      {mode === "signup" && <div className="space-y-2"><Label htmlFor="username">Kullanıcı adı</Label><Input id="username" autoComplete="username" value={username} maxLength={24} onChange={(event) => setUsername(event.target.value)} placeholder="furkan" aria-invalid={username.length > 0 && !USERNAME_PATTERN.test(normalizedUsername)} /><p className="text-xs text-muted-foreground">Profilinde görünür. 3–24 karakter; harf, sayı, nokta, kısa çizgi ve alt çizgi kullanabilirsin.</p></div>}
      <div className="space-y-2"><Label htmlFor="email">E-posta</Label><Input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="sen@example.com" /></div>
      <div className="space-y-2"><Label htmlFor="password">Şifre</Label><Input id="password" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} /><p className="text-xs text-muted-foreground">En az 6 karakter.</p></div>
      {mode === "signup" && <div className="rounded-xl border bg-muted/30 p-3">
        <label className="flex cursor-pointer items-start gap-3 text-sm"><Checkbox checked={noticeRead} onCheckedChange={(checked) => setNoticeRead(checked === true)} aria-label="KVKK Aydınlatma Metni'ni okudum" /><span><Link href="/kvkk" target="_blank" className="font-medium text-primary hover:underline">KVKK Aydınlatma Metni</Link>&apos;ni okudum.</span></label>
      </div>}
      <Button className="w-full" size="lg" disabled={busy || !email || password.length < 6 || (mode === "signup" && !signupReady)} onClick={() => void authenticate()}>{busy ? "İşlem yapılıyor…" : mode === "signup" ? "Hesap oluştur" : "Giriş yap"} <ArrowRight /></Button>
      <div className="flex items-center gap-3" aria-hidden="true"><span className="h-px flex-1 bg-border" /><span className="text-xs text-muted-foreground">veya</span><span className="h-px flex-1 bg-border" /></div>
      <Button className="w-full" variant="outline" size="lg" disabled={busy || (mode === "signup" && !signupReady)} onClick={() => void authenticateWithGoogle()}><GoogleMark />{mode === "signup" ? "Google ile kayıt ol" : "Google ile giriş yap"}</Button>
      <p className="text-center text-xs text-muted-foreground">Aynı e-postayla sıfırdan kayıt olmak mı istiyorsun? <Link href="/account-reset" className="text-primary hover:underline">Eski hesabı güvenle sil</Link></p>
    </> : <>
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-sm text-amber-100"><p className="font-medium">Yerel mod aktif</p><p className="mt-1 text-xs text-amber-100/70">Firebase ayarları henüz eklenmedi. Çalışma alanın bu tarayıcıda kalır.</p></div>
      <Button className="w-full" size="lg" asChild><Link href="/">Yerel çalışma alanını aç <ArrowRight /></Link></Button>
    </>}</CardContent></Card>
  </div></main>;
}

function GoogleMark() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4"><path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.91h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.4Z"/><path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.63-2.42l-3.24-2.54c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.39 13.87A6 6 0 0 1 6.08 12c0-.65.11-1.28.31-1.87V7.51H3.04A10 10 0 0 0 2 12c0 1.61.39 3.14 1.04 4.49l3.35-2.62Z"/><path fill="#EA4335" d="M12 6c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.63 9.63 0 0 0 12 2a10 10 0 0 0-8.96 5.51l3.35 2.62C7.18 7.76 9.39 6 12 6Z"/></svg>;
}
