"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EmailAuthProvider, onAuthStateChanged, reauthenticateWithCredential, sendEmailVerification, signOut, updatePassword, verifyBeforeUpdateEmail, type User } from "firebase/auth";
import { BadgeCheck, LifeBuoy, LogOut, MailWarning, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getFirebase } from "@/lib/firebase/client";

function errorText(error: unknown) {
  const code = (error as { code?: string })?.code ?? "";
  if (code.includes("wrong-password") || code.includes("invalid-credential")) return "Mevcut şifre yanlış.";
  if (code.includes("weak-password")) return "Yeni şifre çok zayıf (en az 6 karakter).";
  if (code.includes("requires-recent-login")) return "Güvenlik için yeniden giriş yapman gerekiyor.";
  if (code.includes("email-already-in-use")) return "Bu e-posta başka bir hesapta kullanılıyor.";
  if (code.includes("invalid-email")) return "E-posta adresi geçersiz.";
  if (code.includes("too-many-requests")) return "Çok fazla deneme yaptın. Biraz sonra tekrar dene.";
  return "İşlem tamamlanamadı. Tekrar dene.";
}

export function AccountPanel() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [again, setAgain] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [busy, setBusy] = useState("");

  useEffect(() => {
    const firebase = getFirebase();
    if (!firebase) return;
    return onAuthStateChanged(firebase.auth, setUser);
  }, []);

  if (!getFirebase()) return <section className="account-card"><h2>Hesap</h2><p>Şu an yerel modda çalışıyorsun; hesap ayarları bulut hesabıyla birlikte etkinleşir.</p></section>;
  if (!user) return <section className="account-card"><p>Hesap bilgileri yükleniyor…</p></section>;

  const hasPassword = user.providerData.some((item) => item.providerId === "password");
  const initials = (user.displayName || user.email || "P").trim().slice(0, 1).toLocaleUpperCase("tr");

  async function reauth(password: string) {
    if (!user?.email) throw new Error("no-email");
    await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));
  }
  async function changePassword(event: FormEvent) {
    event.preventDefault();
    if (next.length < 8) return toast.error("Yeni şifre en az 8 karakter olmalı.");
    if (next !== again) return toast.error("Yeni şifreler eşleşmiyor.");
    setBusy("password");
    try { await reauth(current); await updatePassword(user!, next); setCurrent(""); setNext(""); setAgain(""); toast.success("Şifren güncellendi."); }
    catch (error) { toast.error(errorText(error)); }
    finally { setBusy(""); }
  }
  async function changeEmail(event: FormEvent) {
    event.preventDefault();
    setBusy("email");
    try { await reauth(emailPassword); await verifyBeforeUpdateEmail(user!, newEmail.trim()); setNewEmail(""); setEmailPassword(""); toast.success("Yeni adresine bir doğrulama bağlantısı gönderdik. Onaylayınca e-postan değişir."); }
    catch (error) { toast.error(errorText(error)); }
    finally { setBusy(""); }
  }
  async function resend() {
    setBusy("verify");
    try { await sendEmailVerification(user!); toast.success("Doğrulama e-postası gönderildi."); }
    catch (error) { toast.error(errorText(error)); }
    finally { setBusy(""); }
  }
  async function leave() {
    const firebase = getFirebase();
    if (firebase) await signOut(firebase.auth);
    router.replace("/welcome");
  }

  return (
    <div className="account-grid">
      <section className="account-card">
        <div className="account-identity">
          {user.photoURL ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={user.photoURL} alt="" referrerPolicy="no-referrer" className="account-avatar" /> : <span className="account-avatar is-initial" aria-hidden="true">{initials}</span>}
          <div className="min-w-0"><h2>{user.displayName || "Hesabım"}</h2><p className="truncate">{user.email}</p></div>
        </div>
        {user.emailVerified
          ? <p className="account-status is-ok"><BadgeCheck size={16} /> E-posta doğrulandı</p>
          : <p className="account-status"><MailWarning size={16} /> E-postan henüz doğrulanmadı <Button size="xs" variant="outline" disabled={busy === "verify"} onClick={resend}>Tekrar gönder</Button></p>}
        <p className="account-note">Giriş yöntemi: {hasPassword ? "e-posta ve şifre" : "Google hesabı"}</p>
        <div className="account-actions">
          <Button variant="outline" size="sm" asChild><Link href="/data"><ShieldCheck size={15} />Verilerim</Link></Button>
          <Button variant="outline" size="sm" asChild><Link href="/support"><LifeBuoy size={15} />Destek</Link></Button>
          <Button variant="outline" size="sm" onClick={leave}><LogOut size={15} />Çıkış yap</Button>
          <Button variant="outline" size="sm" asChild className="text-destructive"><Link href="/account-reset"><Trash2 size={15} />Hesabı sil</Link></Button>
        </div>
      </section>

      {hasPassword ? (
        <>
          <form className="account-card" onSubmit={changePassword}>
            <h2>Şifreyi değiştir</h2>
            <label>Mevcut şifre<input type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required /></label>
            <label>Yeni şifre<input type="password" autoComplete="new-password" minLength={8} value={next} onChange={(e) => setNext(e.target.value)} required /></label>
            <label>Yeni şifre (tekrar)<input type="password" autoComplete="new-password" minLength={8} value={again} onChange={(e) => setAgain(e.target.value)} required /></label>
            <Button type="submit" disabled={busy === "password" || !current || !next}>Şifreyi güncelle</Button>
          </form>
          <form className="account-card" onSubmit={changeEmail}>
            <h2>E-postayı değiştir</h2>
            <label>Yeni e-posta<input type="email" autoComplete="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required /></label>
            <label>Şifren (doğrulama için)<input type="password" autoComplete="current-password" value={emailPassword} onChange={(e) => setEmailPassword(e.target.value)} required /></label>
            <Button type="submit" disabled={busy === "email" || !newEmail || !emailPassword}>Doğrulama bağlantısı gönder</Button>
          </form>
        </>
      ) : (
        <section className="account-card"><h2>Şifre ve e-posta</h2><p>Google ile giriş yaptığın için şifre ve e-posta Google hesabından yönetilir.</p></section>
      )}
    </div>
  );
}
