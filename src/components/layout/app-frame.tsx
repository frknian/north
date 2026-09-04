"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, BookOpen, Bot, BrainCircuit, FlaskConical, Home, Layers3, ShieldCheck, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/components/features/workspace-provider";

const nav = [
  { href: "/", label: "Ana Sayfa", icon: Home }, { href: "/plan", label: "Plan", icon: Layers3 },
  { href: "/labs", label: "Lablar", icon: FlaskConical }, { href: "/skills", label: "Beceriler", icon: BarChart3 },
  { href: "/resources", label: "Kaynaklar", icon: BookOpen }, { href: "/coach", label: "AI Koç", icon: Bot }, { href: "/reviews", label: "Değerlendirmeler", icon: BrainCircuit }, { href: "/profile", label: "Profil", icon: UserRound },
];

export function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname(); const { syncMode } = useWorkspace();
  if (pathname.startsWith("/login") || pathname.startsWith("/auth")) return <>{children}</>;
  return <div className="min-h-dvh md:grid md:grid-cols-[232px_1fr]">
    <aside className="hidden border-r bg-sidebar/90 md:fixed md:inset-y-0 md:flex md:w-[232px] md:flex-col">
      <div className="flex h-16 items-center gap-3 border-b px-5"><div className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground"><ShieldCheck className="size-5" /></div><div><p className="text-sm font-semibold">CyberCoach</p><p className="text-[11px] text-muted-foreground">AI destekli kariyer koçu</p></div></div>
      <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Primary navigation">{nav.map((item) => { const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href); return <Link key={item.href} href={item.href} className={cn("flex h-10 items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground", active && "bg-sidebar-accent text-foreground shadow-sm")}><item.icon className="size-4" />{item.label}</Link>; })}</nav>
      <div className="m-3 rounded-lg border bg-background/50 p-3 text-xs text-muted-foreground"><div className="mb-1 flex items-center gap-2"><span className={cn("size-1.5 rounded-full", syncMode === "firebase" ? "bg-emerald-400" : "bg-amber-400")} />{syncMode === "firebase" ? "Firebase ile eşitlendi" : "Yerel çalışma alanı"}</div><p>{syncMode === "firebase" ? "Verilerin hesabınla eşitlenir." : "Cihazlar arası eşitleme için Firebase ayarlarını ekle."}</p></div>
    </aside>
    <main className="min-w-0 pb-40 md:col-start-2 md:pb-8">{children}</main>
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-50 grid grid-cols-4 border-t bg-background/95 px-1 pt-2 backdrop-blur md:hidden" aria-label="Mobil navigasyon">{nav.map((item) => { const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href); return <Link key={item.href} href={item.href} className={cn("flex min-w-0 flex-col items-center gap-1 rounded-md py-1 text-[10px] text-muted-foreground", active && "text-primary")}><item.icon className="size-4" /><span className="truncate">{item.label}</span></Link>; })}</nav>
  </div>;
}
