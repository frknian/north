"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  deleteUser,
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
} from "firebase/auth";
import { deleteDoc, doc } from "firebase/firestore";
import { ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getFirebase } from "@/lib/firebase/client";

export default function AccountResetPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [hasPasswordProvider, setHasPasswordProvider] = useState(false);
  const [authReady, setAuthReady] = useState(true);

  useEffect(() => {
    const firebase = getFirebase();
    if (!firebase) {
      return;
    }

    return onAuthStateChanged(firebase.auth, (user) => {
      setEmail(user?.email ?? "");
      setHasPasswordProvider(user?.providerData.some((provider) => provider.providerId === "password") ?? false);
      setAuthReady(true);
    });
  }, []);

  async function removeAccount() {
    const firebase = getFirebase();
    const user = firebase?.auth.currentUser;
    if (!firebase || !user || confirmation !== "SİL") return;
    setBusy(true);
    try {
      if (!user.email || password.length < 6) {
        toast.error("Şifreni girerek devam et.");
        return;
      }
      await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));

      await deleteDoc(doc(firebase.db, "users", user.uid, "workspaces", "cybercoach"));
      await deleteDoc(doc(firebase.db, "users", user.uid, "workspaces", "career-os")).catch(() => undefined);
      await deleteUser(user);
      window.localStorage.removeItem("cybercoach:v1");
      window.localStorage.removeItem("cyber-career-os:v1");
      toast.success("North hesabın ve çalışma verilerin silindi. Şimdi aynı e-postayla yeniden kayıt olabilirsin.");
      router.replace("/login");
    } catch (error) {
      const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
      const message = code.includes("unauthorized-domain")
            ? "Bu alan adı Firebase'de yetkili değil. Firebase Authentication ayarlarından cybercoach.vercel.app alan adını ekle."
            : code.includes("invalid-credential") || code.includes("wrong-password")
              ? "Şifren doğru değil."
              : code.includes("too-many-requests")
                ? "Çok fazla deneme yapıldı. Bir süre sonra tekrar dene."
                : "Hesap silinemedi. Hesabın korunuyor; tekrar deneyebilirsin.";
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  return <main className="grid min-h-dvh place-items-center px-4 py-10"><div className="w-full max-w-md">
    <div className="mb-6 flex items-center justify-center gap-3"><Image src="/north-mark.png" alt="" width={40} height={40} className="rounded-xl bg-white p-1" priority/><div><p className="font-semibold">North</p><p className="text-xs text-muted-foreground">Tam yeni başlangıç</p></div></div>
    <Card className="border-destructive/30"><CardHeader><CardTitle>Hesabı sil</CardTitle><CardDescription>Giriş yaptığın North hesabını ve çalışma verilerini kalıcı olarak siler.</CardDescription></CardHeader><CardContent className="space-y-4">
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs leading-5 text-muted-foreground">Bu işlem geri alınamaz. Görevler, odak süreleri, beceriler, kanıtlar, notlar ve koç konuşmaları silinir. Google hesabın silinmez; yalnızca North hesabın kaldırılır.</div>
      {!authReady ? <p className="text-sm text-muted-foreground">Hesap bilgileri kontrol ediliyor…</p> : !email ? <div className="space-y-3 rounded-lg border bg-muted/30 p-4"><p className="text-sm text-muted-foreground">Hesap silmek için önce silmek istediğin hesapla giriş yapmalısın.</p><Button className="w-full" asChild><Link href="/login">Giriş yap</Link></Button></div> : <>
      <Field label="Giriş yapılmış hesap"><Input type="email" value={email} readOnly aria-readonly="true" /></Field>
      <Field label="Onaylamak için SİL yaz"><Input value={confirmation} onChange={(event) => setConfirmation(event.target.value.toLocaleUpperCase("tr-TR"))} /></Field>
      {hasPasswordProvider && <><Field label="Şifren"><Input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} /></Field><Button variant="destructive" className="w-full" disabled={busy || password.length < 6 || confirmation !== "SİL"} onClick={() => void removeAccount()}><Trash2/>{busy ? "Hesap siliniyor…" : "Şifre ile doğrula ve hesabı sil"}</Button></>}
      {!hasPasswordProvider && <p className="text-sm text-muted-foreground">Bu hesap için e-posta/şifre girişi bulunamadı.</p>}
      </>}
      <Button variant="ghost" className="w-full" asChild><Link href="/login"><ArrowLeft/>Giriş ekranına dön</Link></Button>
    </CardContent></Card>
  </div></main>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-2"><Label>{label}</Label>{children}</div>; }
