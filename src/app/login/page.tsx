"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getFirebase, isFirebaseConfigured } from "@/lib/firebase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const configured = isFirebaseConfigured();

  async function authenticate(mode: "signin" | "signup") {
    const firebase = getFirebase();
    if (!firebase) return;
    setBusy(true);
    try {
      if (mode === "signin") await signInWithEmailAndPassword(firebase.auth, email, password);
      else await createUserWithEmailAndPassword(firebase.auth, email, password);
      toast.success(mode === "signin" ? "Tekrar hoş geldin." : "Hesabın oluşturuldu.");
      router.push("/");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Kimlik doğrulama başarısız oldu.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="grid min-h-dvh place-items-center px-4 py-10"><div className="w-full max-w-md">
    <div className="mb-6 flex items-center justify-center gap-3"><div className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground"><ShieldCheck className="size-5" /></div><div><p className="font-semibold">CyberCoach</p><p className="text-xs text-muted-foreground">AI destekli siber güvenlik gelişimi.</p></div></div>
    <Card><CardHeader><CardTitle>Gelişimine devam et</CardTitle><CardDescription>Görevlerini, lablarını ve değerlendirmelerini cihazların arasında eşitle.</CardDescription></CardHeader><CardContent className="space-y-4">{configured ? <>
      <div className="space-y-2"><Label htmlFor="email">E-posta</Label><Input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="sen@example.com" /></div>
      <div className="space-y-2"><Label htmlFor="password">Şifre</Label><Input id="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} /></div>
      <Button className="w-full" size="lg" disabled={busy || !email || password.length < 6} onClick={() => void authenticate("signin")}>Giriş yap <ArrowRight /></Button>
      <Button className="w-full" variant="outline" disabled={busy || !email || password.length < 6} onClick={() => void authenticate("signup")}>Hesap oluştur</Button>
    </> : <>
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-sm text-amber-100"><p className="font-medium">Yerel mod aktif</p><p className="mt-1 text-xs text-amber-100/70">Firebase ayarları henüz eklenmedi. Demo çalışma alanın bu tarayıcıda kalır.</p></div>
      <Button className="w-full" size="lg" asChild><Link href="/">Yerel çalışma alanını aç <ArrowRight /></Link></Button>
    </>}</CardContent></Card>
  </div></main>;
}
