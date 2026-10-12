"use client";

import {
  type NorthEvent,
} from "@/lib/north";


export interface CalendarDaySetting {
  date: string;
  mode: "normal" | "rest" | "deep_work" | "light" | "busy";
  maxMinutes?: number;
  themeNote?: string;
}

export const DAY_SETTINGS_KEY = "north:calendar_day_settings";

export function loadDaySettings(): Record<string, CalendarDaySetting> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(DAY_SETTINGS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveDaySettings(settings: Record<string, CalendarDaySetting>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DAY_SETTINGS_KEY, JSON.stringify(settings));
  } catch {}
}

export const eventKindLabels: Record<
  NorthEvent["kind"],
  { label: string; icon: string; badgeClass: string }
> = {
  block: { label: "Odak Bloğu", icon: "⏱", badgeClass: "border-primary/30 bg-primary/10 text-primary" },
  class: { label: "Ders / Okul", icon: "🎓", badgeClass: "border-sky-500/30 bg-sky-500/10 text-sky-500" },
  shift: { label: "İş / Mesai", icon: "💼", badgeClass: "border-amber-500/30 bg-amber-500/10 text-amber-500" },
  personal: { label: "Kişisel Blok", icon: "👤", badgeClass: "border-purple-500/30 bg-purple-500/10 text-purple-400" },
  exam: { label: "Sınav", icon: "📝", badgeClass: "border-rose-500/30 bg-rose-500/10 text-rose-500" },
  deadline: { label: "Son Tarih", icon: "⚠️", badgeClass: "border-red-500/30 bg-red-500/10 text-red-500" },
};

export const CALENDAR_DAYS_OF_WEEK = [
  { id: 1, label: "Pzt", full: "Pazartesi", isWeekend: false },
  { id: 2, label: "Sal", full: "Salı", isWeekend: false },
  { id: 3, label: "Çar", full: "Çarşamba", isWeekend: false },
  { id: 4, label: "Per", full: "Perşembe", isWeekend: false },
  { id: 5, label: "Cum", full: "Cuma", isWeekend: false },
  { id: 6, label: "Cmt", full: "Cumartesi", isWeekend: true },
  { id: 0, label: "Paz", full: "Pazar", isWeekend: true },
];
