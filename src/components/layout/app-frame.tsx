"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, BookOpen, Bot, BriefcaseBusiness, FlaskConical, Home, Layers3, Search, ShieldCheck, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/components/features/workspace-provider";

const primaryNav = [
  { href: "/", label: "Ana Sayfa", icon: Home }, { href: "/plan", label: "Plan", icon: Layers3 },
  { href: "/labs", label: "Lablar", icon: FlaskConical }, { href: "/resources", label: "Kaynaklar", icon: BookOpen },
  { href: "/skills", label: "Beceriler", icon: BarChart3 }, { href: "/reviews", label: "Değerlendirmeler", icon: BarChart3 },
];
const secondaryNav = [{ href: "/career", label: "Kariyer", icon: BriefcaseBusiness }, { href: "/evidence", label: "Kanıtlar", icon: BarChart3 }, { href: "/insights", label: "İçgörüler", icon: BarChart3 }];

export function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname(); const { syncMode } = useWorkspace();
  if (pathname.startsWith("/login") || pathname.startsWith("/auth")) return <>{children}</>;
  return <div className="min-h-dvh md:grid md:grid-cols-[232px_1fr]">
    <aside className="hidden border-r border-sidebar-border bg-sidebar md:fixed md:inset-y-0 md:flex md:w-[232px] md:flex-col">
      <div className="flex h-[72px] items-center gap-3 px-5"><div className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground"><ShieldCheck className="size-[18px]" /></div><div><p className="text-sm font-semibold tracking-tight">CyberCoach</p><p className="text-[11px] text-muted-foreground">Kariyer çalışma alanı</p></div></div>
      <nav className="flex flex-1 flex-col gap-0.5 px-3 py-3" aria-label="Ana navigasyon"><p className="px-3 pb-2 text-[11px] font-medium text-muted-foreground">ÇALIŞMA ALANI</p>{primaryNav.map((item) => <NavLink key={item.href} item={item} pathname={pathname} />)}<p className="px-3 pb-2 pt-6 text-[11px] font-medium text-muted-foreground">KARİYER</p>{secondaryNav.map((item) => <NavLink key={item.href} item={item} pathname={pathname} />)}</nav>
      <div className="border-t border-sidebar-border p-3"><Link href="/profile" className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground", pathname.startsWith("/profile") && "bg-sidebar-accent text-foreground")}><UserRound className="size-4" />Profil ve ayarlar</Link><div className="mt-3 px-3 text-[11px] text-muted-foreground"><span className={cn("mr-1.5 inline-block size-1.5 rounded-full", syncMode === "firebase" ? "bg-emerald-400" : "bg-amber-400")} />{syncMode === "firebase" ? "Firebase eşitleniyor" : "Yerel çalışma alanı"}</div></div>
    </aside>
    <main className="min-w-0 pb-24 md:col-start-2 md:pb-8"><div className="flex h-14 items-center justify-between border-b border-border/80 px-4 sm:px-6 lg:px-8"><div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex"><Search className="size-4" /><span>Kaynak, konu veya lab ara…</span><kbd className="ml-2 rounded border px-1.5 py-0.5 text-[10px]">⌘ K</kbd></div><span className="text-sm font-medium sm:hidden">CyberCoach</span><Link href="/coach" className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"><Bot className="size-4" />AI Koç</Link></div>{children}</main>
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-border/80 bg-background/95 px-1 pt-2 backdrop-blur md:hidden" aria-label="Mobil navigasyon">{[{ href: "/", label: "Ana Sayfa", icon: Home }, { href: "/plan", label: "Plan", icon: Layers3 }, { href: "/labs", label: "Lablar", icon: FlaskConical }, { href: "/resources", label: "Kaynaklar", icon: BookOpen }, { href: "/profile", label: "Diğer", icon: UserRound }].map((item) => { const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href); return <Link key={item.href} href={item.href} className={cn("flex min-w-0 flex-col items-center gap-1 rounded-md py-1 text-[10px] text-muted-foreground", active && "text-primary")}><item.icon className="size-4" /><span className="truncate">{item.label}</span></Link>; })}</nav>
  </div>;
}

function NavLink({ item, pathname }: { item: (typeof primaryNav)[number]; pathname: string }) { const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href); return <Link href={item.href} className={cn("flex h-9 items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground", active && "bg-sidebar-accent text-foreground")}><item.icon className="size-4" />{item.label}</Link>; }
