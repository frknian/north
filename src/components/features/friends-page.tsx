"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import { Check, Copy, Flame, Timer, Share2, ShieldCheck, Trophy, UserPlus, Users, X } from "lucide-react";
import { toast } from "sonner";
import { useNorth } from "@/components/north/shared";
import { Button } from "@/components/ui/button";
import { getFirebase } from "@/lib/firebase/client";
import { dayKey } from "@/lib/north";
import { computeShareStats, rankLeaderboard, type FriendRow, type PublicProfile } from "@/lib/social";
import { acceptRequest, declineRequest, disableSharing, enableSharing, loadFriendProfiles, loadSocialSettings, publishStats, removeFriend, sendFriendRequest, watchRequests, type FriendRequest, type SocialSettings } from "@/lib/social-store";
import { cn } from "@/lib/utils";

export function FriendsPage() {
  const { state } = useNorth();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [settings, setSettings] = useState<SocialSettings | null>(null);
  const [friends, setFriends] = useState<PublicProfile[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [nickname, setNickname] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const today = dayKey();
  const stats = useMemo(() => computeShareStats(state.activities, today), [state.activities, today]);
  const statsRef = useRef(stats);
  useEffect(() => { statsRef.current = stats; }, [stats]);

  useEffect(() => {
    const firebase = getFirebase();
    if (!firebase) { const frame = requestAnimationFrame(() => setSignedIn(false)); return () => cancelAnimationFrame(frame); }
    return onAuthStateChanged(firebase.auth, (user) => setSignedIn(Boolean(user)));
  }, []);

  const refresh = useCallback(async () => {
    try { setFriends(await loadFriendProfiles()); } catch { /* offline or rules not deployed yet */ }
  }, []);

  useEffect(() => {
    if (!signedIn) return;
    let stop: (() => void) | undefined;
    loadSocialSettings().then((value) => { setSettings(value); if (value.nickname) setNickname(value.nickname); }).catch(() => setSettings({ enabled: false, nickname: "", code: "" }));
    void refresh();
    try { stop = watchRequests(setRequests); } catch {}
    const interval = window.setInterval(() => void refresh(), 60_000);
    return () => { stop?.(); window.clearInterval(interval); };
  }, [signedIn, refresh]);

  // Keep the published numbers fresh while sharing is on.
  useEffect(() => {
    if (!settings?.enabled) return;
    const timer = window.setTimeout(() => { void publishStats(settings.nickname, settings.code, statsRef.current).catch(() => {}); }, 2500);
    return () => window.clearTimeout(timer);
  }, [settings, stats]);

  const rows = useMemo(() => {
    if (!settings?.enabled) return [];
    const me: FriendRow = { uid: "me", nickname: settings.nickname, isMe: true, updatedAt: "", ...stats };
    return rankLeaderboard([me, ...friends], stats.weekKey);
  }, [settings, friends, stats]);

  async function run(action: () => Promise<void>, success?: string) {
    setBusy(true); setError("");
    try { await action(); if (success) toast.success(success); }
    catch (err) { setError(err instanceof Error ? err.message : "İşlem tamamlanamadı."); }
    finally { setBusy(false); }
  }

  const shareText = `Planorth'ta bu hafta ${stats.weeklyMinutes} dk odaklandım, ${stats.weeklyDone} görev bitirdim, ${stats.streak} günlük serim var.${settings?.code ? ` Beni eklemek için davet kodum: ${settings.code}` : ""}`;
  async function share() {
    try {
      if (navigator.share) await navigator.share({ title: "Planorth", text: shareText });
      else { await navigator.clipboard.writeText(shareText); toast.success("Özet panoya kopyalandı."); }
    } catch { /* cancelled */ }
  }
  async function copyCode() { try { await navigator.clipboard.writeText(settings?.code ?? ""); toast.success("Davet kodu kopyalandı."); } catch { toast.error("Kopyalanamadı."); } }

  return (
    <div className="page-content friends-page">
      <header className="north-page-header"><div><p className="north-eyebrow">Birlikte çalış</p><h1>Arkadaşlar</h1><p>Arkadaşlarınla haftalık odak süreni ve serini karşılaştır. Paylaşım tamamen isteğe bağlı.</p></div></header>

      {signedIn === false && <section className="account-card"><h2><Users size={18} className="mr-2 inline" />Giriş gerekiyor</h2><p>Arkadaş özellikleri bulut hesabıyla çalışır. Giriş yaptıktan sonra davet kodunu paylaşabilir ve arkadaş ekleyebilirsin.</p></section>}

      {signedIn && settings && !settings.enabled && (
        <section className="account-card">
          <h2><ShieldCheck size={18} className="mr-2 inline" />Paylaşımı aç</h2>
          <p>Açtığında arkadaşların yalnızca şunları görür: takma adın, bu haftaki odak süren, bitirdiğin görev sayısı ve serin. E-postan, hedeflerin, notların ve görev içerikleri asla paylaşılmaz. İstediğin an kapatıp her şeyi silebilirsin.</p>
          <label>Takma adın<input value={nickname} maxLength={24} onChange={(event) => setNickname(event.target.value)} placeholder="Örn. Elif" /></label>
          {error && <p role="alert" className="support-error">{error}</p>}
          <Button disabled={busy || nickname.trim().length < 2} onClick={() => run(async () => { setSettings(await enableSharing(nickname, stats)); }, "Paylaşım açıldı.")}>Paylaşımı aç</Button>
        </section>
      )}

      {signedIn && settings?.enabled && (
        <>
          <div className="friends-top">
            <section className="account-card">
              <h2>Davet kodun</h2>
              <p className="friends-code" aria-label="Davet kodu">{settings.code}</p>
              <div className="account-actions"><Button size="sm" variant="outline" onClick={copyCode}><Copy size={15} />Kopyala</Button><Button size="sm" variant="outline" onClick={share}><Share2 size={15} />Haftalık özeti paylaş</Button></div>
              <p>Arkadaşın bu kodu “Arkadaş ekle” alanına yazınca sana istek gider; sen de onaylayınca birbirinizi görürsünüz.</p>
            </section>
            <section className="account-card">
              <h2>Arkadaş ekle</h2>
              <label>Arkadaşının davet kodu<input value={code} onChange={(event) => setCode(event.target.value)} placeholder="ABCD-EFGH" maxLength={9} autoCapitalize="characters" /></label>
              {error && <p role="alert" className="support-error">{error}</p>}
              <Button disabled={busy || code.trim().length < 8} onClick={() => run(async () => { await sendFriendRequest(code, settings.nickname); setCode(""); await refresh(); }, "İstek gönderildi. Arkadaşın onaylayınca seni de görecek.")}><UserPlus size={15} />Ekle</Button>
            </section>
          </div>

          <section className="account-card">
            <h2><Timer size={18} className="mr-2 inline" />Birlikte odak</h2>
            <p>Arkadaşlarınla aynı zamanlayıcıda çalış: oda kur, kodu paylaş, hep birlikte başlayın.</p>
            <div><Button size="sm" asChild><Link href="/together">Birlikte odak başlat</Link></Button></div>
          </section>

          {requests.length > 0 && (
            <section className="account-card" aria-label="Arkadaşlık istekleri">
              <h2>Bekleyen istekler ({requests.length})</h2>
              <ul className="friends-requests">{requests.map((request) => (
                <li key={request.uid}><span>{request.nickname}</span><div><Button size="sm" disabled={busy} onClick={() => run(async () => { await acceptRequest(request.uid); await refresh(); }, "Arkadaş eklendi.")}><Check size={14} />Kabul et</Button><Button size="sm" variant="outline" disabled={busy} onClick={() => run(() => declineRequest(request.uid))}><X size={14} />Reddet</Button></div></li>
              ))}</ul>
            </section>
          )}

          <section className="account-card" aria-label="Haftalık sıralama">
            <h2><Trophy size={18} className="mr-2 inline" />Bu haftanın sıralaması</h2>
            <p>Süreler arkadaşların kendi bildirdiği değerlerdir; yarışmadan çok motivasyon içindir.</p>
            <ol className="friends-board">{rows.map((row) => (
              <li key={row.uid} className={cn(row.isMe && "is-me")}>
                <span className="friends-rank">{row.rank}</span>
                <b>{row.nickname}{row.isMe ? " (sen)" : ""}</b>
                <span>{row.weeklyMinutes} dk</span>
                <span>{row.weeklyDone} görev</span>
                <span className="friends-streak"><Flame size={14} />{row.streak}</span>
                {!row.isMe && <button type="button" aria-label={`${row.nickname} arkadaşlıktan çıkar`} onClick={() => run(async () => { await removeFriend(row.uid); await refresh(); }, "Arkadaşlıktan çıkarıldı.")}><X size={14} /></button>}
              </li>
            ))}</ol>
            {rows.length === 1 && <p>Henüz arkadaşın yok. Davet kodunu paylaş!</p>}
          </section>

          <section className="account-card">
            <h2>Paylaşımı kapat</h2>
            <p>Kapattığında takma adın, istatistiklerin ve davet kodun silinir; arkadaşlar seni artık göremez.</p>
            <div><Button variant="outline" disabled={busy} onClick={() => run(async () => { await disableSharing(settings.code); setSettings({ enabled: false, nickname: settings.nickname, code: "" }); setFriends([]); }, "Paylaşım kapatıldı ve verilerin silindi.")}>Paylaşımı kapat ve verilerimi sil</Button></div>
          </section>
        </>
      )}
    </div>
  );
}
