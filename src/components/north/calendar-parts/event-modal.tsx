"use client";

import {
  Trash2,
} from "lucide-react";
import {
  type NorthEvent,
} from "@/lib/north";
import {
  Button,
} from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Input,
} from "@/components/ui/input";
import {
  Label,
} from "@/components/ui/label";
import {
  eventKindLabels,
} from "./module-level";
import type { CalendarPlanCtx } from "./use-calendar-plan";

export function EventModal({ ctx }: { ctx: CalendarPlanCtx }) {
  const {
    state,
    update,
    eventDraft,
    setEventDraft,
  } = ctx;
  return (
    <>
      {/* EVENT MODAL */}
      <Dialog open={Boolean(eventDraft)} onOpenChange={(open) => !open && setEventDraft(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              {eventDraft && state.events.some((e) => e.id === eventDraft.id) ? "Etkinliği Düzenle" : "Yeni Zaman Bloğu"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Ders, mesai, sınav veya kişisel blok ekleyerek gününü koru.
            </DialogDescription>
          </DialogHeader>
    
          {eventDraft && (
            <div className="space-y-3 py-2 text-xs">
              <div className="space-y-1">
                <Label className="text-xs">Blok Türü</Label>
                <select
                  value={eventDraft.kind}
                  onChange={(e) => setEventDraft({ ...eventDraft, kind: e.target.value as NorthEvent["kind"] })}
                  className="w-full rounded-xl border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {Object.entries(eventKindLabels).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.icon} {v.label}
                    </option>
                  ))}
                </select>
              </div>
    
              <div className="space-y-1">
                <Label className="text-xs">Başlık</Label>
                <Input
                  value={eventDraft.title}
                  onChange={(e) => setEventDraft({ ...eventDraft, title: e.target.value })}
                  placeholder="Örn: Veri Yapıları Dersi veya Gece Vardiyası"
                  className="rounded-xl text-xs"
                />
              </div>
    
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Tarih</Label>
                  <Input
                    type="date"
                    value={eventDraft.date}
                    onChange={(e) => setEventDraft({ ...eventDraft, date: e.target.value })}
                    className="rounded-xl text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Saat (İsteğe Bağlı)</Label>
                  <Input
                    type="time"
                    value={eventDraft.time || ""}
                    onChange={(e) => setEventDraft({ ...eventDraft, time: e.target.value })}
                    className="rounded-xl text-xs"
                  />
                </div>
              </div>
            </div>
          )}
    
          <DialogFooter className="flex items-center justify-between gap-2 pt-2">
            {eventDraft && state.events.some((e) => e.id === eventDraft.id) ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => {
                  update((curr) => ({ ...curr, events: curr.events.filter((e) => e.id !== eventDraft.id) }));
                  setEventDraft(null);
                }}
              >
                <Trash2 className="size-3.5 mr-1" /> Sil
              </Button>
            ) : <div />}
    
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setEventDraft(null)} className="rounded-xl text-xs">
                Vazgeç
              </Button>
              <Button
                size="sm"
                disabled={!eventDraft?.title.trim()}
                onClick={() => {
                  if (!eventDraft) return;
                  update((curr) => ({
                    ...curr,
                    events: curr.events.some((e) => e.id === eventDraft.id)
                      ? curr.events.map((e) => (e.id === eventDraft.id ? eventDraft : e))
                      : [...curr.events, eventDraft],
                  }));
                  setEventDraft(null);
                }}
                className="rounded-xl text-xs"
              >
                Kaydet
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    
    </>
  );
}
