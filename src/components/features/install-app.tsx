"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { Download, Share, Smartphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
const DISMISS_KEY = "planorth_install_dismissed";
let deferred: InstallEvent | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => { event.preventDefault(); deferred = event as InstallEvent; emit(); });
  window.addEventListener("appinstalled", () => { deferred = null; emit(); });
}

function subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }

function useInstallState() {
  const canPrompt = useSyncExternalStore(subscribe, () => Boolean(deferred), () => false);
  const [env, setEnv] = useState({ standalone: false, ios: false });
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setEnv({
      standalone: window.matchMedia("(display-mode: standalone)").matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone),
      ios: /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1),
    }));
    return () => window.cancelAnimationFrame(frame);
  }, []);
  const install = useCallback(async () => {
    if (!deferred) return false;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    deferred = null; emit();
    return choice.outcome === "accepted";
  }, []);
  return { canPrompt, install, ...env };
}

/** Slim banner shown on supported browsers; remembers a dismissal for 14 days. */
export function InstallBanner() {
  const { canPrompt, install, standalone } = useInstallState();
  const [hidden, setHidden] = useState(true);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try { const at = Number(window.localStorage.getItem(DISMISS_KEY) ?? 0); setHidden(Date.now() - at < 14 * 86_400_000); } catch { setHidden(false); }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);
  if (!canPrompt || standalone || hidden) return null;
  const dismiss = () => { setHidden(true); try { window.localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {} };
  return (
    <div className="install-banner" role="region" aria-label="Uygulamayı yükle">
      <Smartphone size={18} />
      <p><b>Planorth’u uygulama gibi kur.</b> Ana ekrandan tek dokunuşla aç, tam ekran kullan.</p>
      <Button size="sm" onClick={() => void install().then((ok) => ok && dismiss())}>Yükle</Button>
      <button type="button" onClick={dismiss} aria-label="Kapat"><X size={16} /></button>
    </div>
  );
}

/** Settings panel with platform specific instructions. */
export function InstallPanel() {
  const { canPrompt, install, standalone, ios } = useInstallState();
  return (
    <section className="account-card">
      <h2 className="flex items-center gap-2"><Smartphone size={18} />Uygulamayı yükle</h2>
      {standalone ? <p>Planorth şu anda uygulama olarak çalışıyor.</p> : (
        <>
          <p>Planorth’u telefonuna ya da bilgisayarına kurarak ana ekrandan açabilir, tam ekran kullanabilir ve bildirimleri daha güvenilir alabilirsin.</p>
          {canPrompt && <div><Button onClick={() => void install()}><Download size={15} />Şimdi yükle</Button></div>}
          {ios && <ol className="install-steps"><li>Safari’de bu sayfayı aç.</li><li>Alttaki <Share size={14} className="inline" /> <b>Paylaş</b> düğmesine dokun.</li><li><b>Ana Ekrana Ekle</b>’yi seç ve onayla.</li></ol>}
          {!ios && !canPrompt && <ol className="install-steps"><li>Chrome veya Edge’de adres çubuğunun sağındaki <b>Yükle</b> simgesine tıkla.</li><li>Android’de menüden <b>Ana ekrana ekle</b> / <b>Uygulamayı yükle</b>’yi seç.</li></ol>}
        </>
      )}
    </section>
  );
}
