"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { readReminder, writeReminder, type ReminderSettings as Settings } from "@/lib/reminders";

export function ReminderSettings() {
  const [settings, setSettings] = useState<Settings>({ enabled: false, time: "09:00" });
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setSettings(readReminder());
      setPermission("Notification" in window ? Notification.permission : "unsupported");
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  async function toggle(enabled: boolean) {
    if (enabled && "Notification" in window && Notification.permission !== "granted") {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== "granted") { toast.error("Bildirim izni verilmedi. Tarayıcı ayarlarından izin verebilirsin."); return; }
    }
    const next = { ...settings, enabled };
    setSettings(next); writeReminder(next);
    toast.success(enabled ? `Günlük hatırlatıcı ${next.time} için açıldı.` : "Günlük hatırlatıcı kapatıldı.");
  }
  function changeTime(time: string) { const next = { ...settings, time }; setSettings(next); writeReminder(next); }
  async function test() {
    try {
      const registration = await navigator.serviceWorker?.getRegistration();
      const options = { body: "Hatırlatıcılar bu cihazda çalışıyor.", icon: "/planorth-192.png" };
      if (registration) await registration.showNotification("Planorth", options); else new Notification("Planorth", options);
    } catch { toast.error("Bildirim gösterilemedi."); }
  }

  return (
    <section className="account-card" style={{ marginTop: 16 }}>
      <h2 className="flex items-center gap-2">{settings.enabled ? <Bell size={18} /> : <BellOff size={18} />} Günlük hatırlatıcı</h2>
      {permission === "unsupported" ? <p>Bu tarayıcı bildirimleri desteklemiyor.</p> : (
        <>
          <p>Seçtiğin saatte, o gün tamamlanmamış görevin varsa bildirim alırsın. Bildirimler bu cihazda ve yalnızca Planorth tarayıcıda ya da yüklü uygulamada açıkken (arka planda bile olabilir) gelir; uygulama tamamen kapalıyken çalışmaz.</p>
          <div className="account-actions">
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>Saat<input type="time" value={settings.time} onChange={(e) => changeTime(e.target.value)} style={{ width: 120 }} /></label>
            <Button size="sm" variant={settings.enabled ? "outline" : "default"} onClick={() => toggle(!settings.enabled)}>{settings.enabled ? "Kapat" : "Aç"}</Button>
            {settings.enabled && permission === "granted" && <Button size="sm" variant="outline" onClick={test}>Test bildirimi gönder</Button>}
          </div>
          {permission === "denied" && <p>Tarayıcı bildirimleri engellemiş. Adres çubuğundaki site ayarlarından izin ver.</p>}
        </>
      )}
    </section>
  );
}
