"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { Check, Copy, DoorOpen, Play, Share2, Users, Timer } from "lucide-react";
import { toast } from "sonner";
import { useNorth } from "@/components/north/shared";
import { Button } from "@/components/ui/button";
import { getFirebase } from "@/lib/firebase/client";
import { dayKey } from "@/lib/north";
import { DURATION_OPTIONS, formatClock, memberSummary, remainingMs, roomPhase, type TogetherMember, type TogetherRoom } from "@/lib/together";
import { createRoom, currentUid, endRoom, joinRoom, leaveRoom, setMyState, startRoom, watchMembers, watchRoom } from "@/lib/together-store";
import { cn } from "@/lib/utils";

const NICK_KEY = "planorth_together_nick";
const LOGGED_KEY = "planorth_together_logged";

function initialRoom() {
  if (typeof window === "undefined") return "";
  return (new URLSearchParams(window.location.search).get("room") ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
}

export function TogetherPage() {
  const { update } = useNorth();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [roomId, setRoomId] = useState(initialRoom);
  const [room, setRoom] = useState<TogetherRoom | null | undefined>(undefined);
  const [members, setMembers] = useState<TogetherMember[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const [nickname, setNickname] = useState("");
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState<number>(50);
  const [codeInput, setCodeInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [logged, setLogged] = useState(false);

  useEffect(() => {
    const firebase = getFirebase();
    if (!firebase) { const frame = requestAnimationFrame(() => setSignedIn(false)); return () => cancelAnimationFrame(frame); }
    return onAuthStateChanged(firebase.auth, (user) => {
      setSignedIn(Boolean(user));
      if (user) {
        let saved = "";
        try { saved = window.localStorage.getItem(NICK_KEY) ?? ""; } catch {}
        setNickname((current) => current || saved || user.displayName?.split(" ")[0] || user.email?.split("@")[0] || "");
      }
    });
  }, []);

  // Live room + members
  useEffect(() => {
    if (!signedIn || !roomId) return;
    let stopRoom: (() => void) | undefined;
    let stopMembers: (() => void) | undefined;
    try { stopRoom = watchRoom(roomId, setRoom); stopMembers = watchMembers(roomId, setMembers); } catch { const frame = requestAnimationFrame(() => setRoom(null)); return () => cancelAnimationFrame(frame); }
    return () => { stopRoom?.(); stopMembers?.(); };
  }, [signedIn, roomId]);

  // One-second clock while a room is open
  useEffect(() => {
    if (!roomId) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [roomId]);

  const uid = signedIn ? currentUid() : null;
  const isHost = Boolean(room && uid && room.hostUid === uid);
  const phase = room ? roomPhase(room, now) : null;
  const summary = useMemo(() => memberSummary(members), [members]);
  const me = members.find((member) => member.uid === uid);

  const openRoom = useCallback((id: string) => {
    setRoom(undefined); setMembers([]); setLogged(false); setRoomId(id);
    try { window.history.replaceState(null, "", id ? `/together?room=${id}` : "/together"); } catch {}
  }, []);

  async function run(action: () => Promise<void>) {
    setBusy(true); setError("");
    try { await action(); } catch (err) { setError(err instanceof Error ? err.message : "İşlem tamamlanamadı."); } finally { setBusy(false); }
  }
  const rememberNick = () => { try { window.localStorage.setItem(NICK_KEY, nickname); } catch {} };

  const link = typeof window !== "undefined" && roomId ? `${window.location.origin}/together?room=${roomId}` : "";
  async function copy(text: string, message: string) { try { await navigator.clipboard.writeText(text); toast.success(message); } catch { toast.error("Kopyalanamadı."); } }
  async function share() {
    const text = `Planorth'ta birlikte odaklanalım! Oda kodu: ${roomId}`;
    try { if (navigator.share) await navigator.share({ title: "Birlikte odak", text, url: link }); else await copy(`${text}\n${link}`, "Davet kopyalandı."); } catch { /* cancelled */ }
  }

  function logSession() {
    if (!room) return;
    let already = false;
    try { already = window.localStorage.getItem(LOGGED_KEY) === room.id; } catch {}
    if (already || logged) { setLogged(true); return; }
    update((current) => ({
      ...current,
      activities: [...current.activities, { id: crypto.randomUUID(), taskId: `together-${room.id}`, areaId: current.areas[0]?.id ?? "primary", date: dayKey(), minutes: room.durationMin, outcome: "done", difficulty: "normal", reflection: `Ortak odak: ${room.title}`, amount: 0, metric: "", endedAt: new Date().toISOString() }],
    }));
    try { window.localStorage.setItem(LOGGED_KEY, room.id); } catch {}
    setLogged(true);
    toast.success(`${room.durationMin} dakika çalışma kaydına eklendi.`);
  }

  return (
    <div className="page-content together-page">
      <header className="north-page-header"><div><p className="north-eyebrow">Birlikte çalış</p><h1>Birlikte odak</h1><p>Arkadaşlarınla aynı zamanlayıcıyı paylaş: kodu gönder, herkes katılsın, aynı anda başlayın.</p></div></header>

      {signedIn === false && <section className="account-card"><h2><Users size={18} className="mr-2 inline" />Giriş gerekiyor</h2><p>Ortak odak odaları bulut hesabıyla çalışır. Giriş yaptıktan sonra oda kurabilir ya da kodla katılabilirsin.</p></section>}

      {signedIn && !roomId && (
        <div className="friends-top">
          <section className="account-card">
            <h2><Timer size={18} className="mr-2 inline" />Oda kur</h2>
            <label>Takma adın<input value={nickname} maxLength={24} onChange={(event) => setNickname(event.target.value)} /></label>
            <label>Oturum adı (isteğe bağlı)<input value={title} maxLength={60} onChange={(event) => setTitle(event.target.value)} placeholder="Örn. Matematik tekrarı" /></label>
            <div><p className="together-label">Süre</p><div className="together-durations">{DURATION_OPTIONS.map((option) => <button key={option} type="button" className={cn(duration === option && "is-active")} aria-pressed={duration === option} onClick={() => setDuration(option)}>{option} dk</button>)}</div></div>
            {error && <p role="alert" className="support-error">{error}</p>}
            <Button disabled={busy || nickname.trim().length < 2} onClick={() => run(async () => { rememberNick(); openRoom(await createRoom({ title, durationMin: duration, nickname })); })}>Odayı oluştur</Button>
          </section>
          <section className="account-card">
            <h2><DoorOpen size={18} className="mr-2 inline" />Kodla katıl</h2>
            <label>Takma adın<input value={nickname} maxLength={24} onChange={(event) => setNickname(event.target.value)} /></label>
            <label>Oda kodu<input value={codeInput} maxLength={7} autoCapitalize="characters" onChange={(event) => setCodeInput(event.target.value)} placeholder="ABC-234" /></label>
            {error && <p role="alert" className="support-error">{error}</p>}
            <Button disabled={busy || codeInput.trim().length < 6 || nickname.trim().length < 2} onClick={() => run(async () => { rememberNick(); openRoom(await joinRoom(codeInput, nickname)); })}>Katıl</Button>
          </section>
        </div>
      )}

      {signedIn && roomId && room === undefined && <p className="account-note">Oda yükleniyor…</p>}
      {signedIn && roomId && room === null && (
        <section className="account-card"><h2>Oda bulunamadı</h2><p>Bu kodla bir oda yok ya da erişimin yok. Kodu kontrol et.</p><div><Button variant="outline" onClick={() => openRoom("")}>Geri dön</Button></div></section>
      )}

      {signedIn && room && phase && (
        <section className="together-room account-card" aria-label="Oda">
          <div className="together-head"><div><h2>{room.title}</h2><p>{room.hostNickname} · {room.durationMin} dakika</p></div>
            {(phase === "lobby" || phase === "running") && <div className="together-code"><span>Oda kodu</span><b aria-label="Oda kodu">{room.id}</b><div><button type="button" onClick={() => copy(room.id, "Kod kopyalandı.")} aria-label="Kodu kopyala"><Copy size={15} /></button><button type="button" onClick={share} aria-label="Daveti paylaş"><Share2 size={15} /></button></div></div>}
          </div>

          {phase === "lobby" && (
            <>
              <p className="together-clock" aria-live="polite">{formatClock(room.durationMin * 60_000)}</p>
              <p>{isHost ? "Herkes katılınca başlat. Süre başladığında hepsinin sayacı aynı anda akar." : "Oda sahibinin başlatmasını bekle. Sayfayı açık tut."}</p>
              {isHost && <div><Button onClick={() => run(() => startRoom(room.id))} disabled={busy}><Play size={15} />Birlikte başlat ({members.length} kişi)</Button></div>}
            </>
          )}

          {phase === "running" && (
            <>
              <p className="together-clock" role="timer" aria-live="off">{formatClock(remainingMs(room, now))}</p>
              <div className="together-bar"><span style={{ width: `${Math.min(100, Math.round(100 - (remainingMs(room, now) / (room.durationMin * 60_000)) * 100))}%` }} /></div>
              <p>{summary.focusing} kişi odakta{summary.done ? `, ${summary.done} kişi erken bitirdi` : ""}. Telefonu bırak, birlikte devam.</p>
              <div className="account-actions">
                {me?.state !== "done" && <Button variant="outline" size="sm" onClick={() => run(() => setMyState(room.id, "done"))}><Check size={15} />Bitirdim</Button>}
                {isHost && <Button variant="outline" size="sm" onClick={() => run(() => endRoom(room.id))}>Odayı kapat</Button>}
              </div>
            </>
          )}

          {(phase === "finished" || phase === "ended" || phase === "expired") && (
            <>
              <p className="together-done">{phase === "finished" ? "Süre doldu — harika iş!" : "Bu oda kapandı."}</p>
              <p>{members.length} kişi birlikte {room.durationMin} dakika odaklandı.</p>
              <div className="account-actions">
                {phase === "finished" && <Button onClick={logSession} disabled={logged}>{logged ? "Kayda eklendi" : "Çalışma kaydıma ekle"}</Button>}
                <Button variant="outline" onClick={() => { void leaveRoom(room.id); openRoom(""); }}>Yeni oturum</Button>
              </div>
            </>
          )}

          <ul className="together-members" aria-label="Katılımcılar">{members.map((member) => (
            <li key={member.uid} className={cn(member.state === "done" && "is-done")}><span className="together-dot" aria-hidden="true" /><b>{member.nickname}{member.uid === uid ? " (sen)" : ""}</b><span>{member.uid === room.hostUid ? "Oda sahibi" : member.state === "done" ? "Bitirdi" : "Odakta"}</span></li>
          ))}</ul>
          {(phase === "lobby" || phase === "running") && <div><Button variant="ghost" size="sm" onClick={() => { void leaveRoom(room.id); openRoom(""); }}>Odadan ayrıl</Button></div>}
        </section>
      )}
    </div>
  );
}
