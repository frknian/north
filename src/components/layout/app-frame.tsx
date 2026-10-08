"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Award, BarChart3, BookOpen, Briefcase, CalendarDays, CircleHelp, ClipboardList, FlaskConical, Home, Layers3, MoreHorizontal, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { NorthChatPopover } from "@/components/north/north-chat-popover";
import { GuideTourModal } from "@/components/features/guide-tour-modal";
import { WorkspaceSearch } from "@/components/features/workspace-search";
import { useWorkspace } from "@/components/features/workspace-provider";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { NorthLogo } from "@/components/layout/north-logo";
import { isCurrentTabLocked, FOCUS_LOCK_KEY, BROADCAST_CHANNEL_NAME, type ActiveFocusLock } from "@/lib/focus-lock";
import { FocusLockBarrier } from "@/components/features/focus-lock-barrier";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SanalKutuphaneBadge } from "@/components/north/sanal-kutuphane";

const navigation = [
  { href: "/", label: "Bugün", icon: Home },
  { href: "/coach", label: "Koç", icon: Sparkles },
  { href: "/week", label: "Plan", icon: ClipboardList },
  { href: "/roadmap", label: "Yol Haritam", icon: ClipboardList },
  { href: "/areas", label: "Alanlar", icon: Layers3 },
  { href: "/knowledge", label: "Kütüphane", icon: BookOpen },
  { href: "/resources", label: "Kaynaklar", icon: BookOpen },
  { href: "/labs", label: "Lablar", icon: FlaskConical },
  { href: "/evidence", label: "Portföy", icon: Briefcase },
  { href: "/progress", label: "İlerleme", icon: BarChart3 },
  { href: "/calendar", label: "Takvim", icon: CalendarDays },
];
const featuredNavigation = ["/", "/roadmap", "/coach", "/progress", "/knowledge"];
const areaRoutes = ["/skills", "/resources", "/career", "/knowledge", "/certifications", "/plan"];
const titles: Record<string, string> = {
  "/": "Bugün",
  "/coach": "Planorth Koç",
  "/north-ai": "Planorth Koç",
  "/week": "Haftalık Plan",
  "/roadmap": "Yol Haritam",
  "/areas": "Hedef Alanları",
  "/calendar": "Takvim & Zaman Blokları",
  "/progress": "İlerleme & Değerlendirme",
  "/reviews": "İlerleme & Değerlendirme",
  "/resources": "Kaynaklar & Araştırma Merkezi",
  "/labs": "Pratik Lab Günlüğü",
  "/evidence": "Portföy & Çıktılar",
  "/profile": "Profil ve Ayarlar",
  "/data": "Verilerim ve Güvenlik",
  "/skills": "Beceriler",
  "/career": "Kariyer",
  "/knowledge": "Bilgi Bankası",
  "/certifications": "Sertifikalar",
  "/plan": "Plan",
  "/insights": "İçgörüler",
  "/login": "Giriş",
  "/kvkk": "KVKK Aydınlatma Metni",
  "/onboarding": "Başlangıç Kurulumu",
};
function activeTab(path: string) {
  if (path === "/") return "/";
  if (path === "/coach" || path === "/north-ai") return "/coach";
  const matched = navigation.find((n) => n.href !== "/" && (path === n.href || path.startsWith(n.href + "/")));
  if (matched) return matched.href;
  if (path.startsWith("/areas/")) return "/areas";
  if (path.startsWith("/focus/")) return "/";
  return "";
}
export function AppFrame({children}:{children:React.ReactNode}) {
  const pathname=usePathname(); const router=useRouter(); const workspace=useWorkspace(); const {syncMode,north}=workspace;  const [scrolled,setScrolled]=useState(false);
  const [loadingTooLong, setLoadingTooLong] = useState(false);
  const area=pathname.startsWith("/areas/")?north?.areas.find(a=>a.id===pathname.split("/")[2]):undefined;
  const primaryArea=north?.areas.find(a=>a.id==="primary-goal")??north?.areas.find(a=>a.id==="cyber");
  const pageTitle=area?.name??titles[pathname]??(pathname.startsWith("/focus/")?"Odak":pathname.startsWith("/areas/")?"Alan": "Planorth");
  useEffect(()=>{document.title=pageTitle==="Planorth"?"Planorth":pageTitle+" — Planorth";},[pageTitle]);
  useEffect(() => {
    const timer = window.setTimeout(() => setLoadingTooLong(true), 4500);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(()=>{
    if(!isFirebaseConfigured()||!workspace.ready||workspace.authStatus==="loading")return;
    const publicRoute=pathname.startsWith("/login")||pathname.startsWith("/auth")||pathname.startsWith("/account-reset")||pathname.startsWith("/kvkk");
    if(workspace.authStatus==="signed_out"&&!publicRoute){router.replace("/login");return;}
    if(workspace.authStatus==="signed_in"&&!workspace.coaching.onboarding&&pathname!=="/onboarding"){router.replace("/onboarding");return;}
    if(workspace.authStatus==="signed_in"&&workspace.coaching.onboarding&&pathname==="/onboarding")router.replace("/");
  },[pathname,router,workspace.authStatus,workspace.coaching.onboarding,workspace.ready]);
  const [lockState, setLockState] = useState<{
    isLocked: boolean;
    reason?: "other_tab" | "reopened_unanswered";
    lock?: ActiveFocusLock;
  }>({ isLocked: false });

  useEffect(() => {
    const checkLock = () => {
      const current = isCurrentTabLocked();
      if (current.isLocked && current.lock && pathname === `/focus/${current.lock.taskId}`) {
        if (current.lock.status === "running") {
          setLockState({ isLocked: false });
          return;
        }
      }
      setLockState(current);
    };

    checkLock();

    const handleStorage = (e: StorageEvent) => {
      if (e.key === FOCUS_LOCK_KEY) checkLock();
    };
    window.addEventListener("storage", handleStorage);

    let channel: BroadcastChannel | null = null;
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        channel.onmessage = () => checkLock();
      } catch {}
    }

    return () => {
      window.removeEventListener("storage", handleStorage);
      channel?.close();
    };
  }, [pathname]);

  if (lockState.isLocked && lockState.lock && lockState.reason) {
    return (
      <FocusLockBarrier
        lock={lockState.lock}
        reason={lockState.reason}
        onUnlocked={() => setLockState({ isLocked: false })}
      />
    );
  }

  if (pathname.startsWith("/login") || pathname.startsWith("/auth") || pathname.startsWith("/account-reset") || pathname.startsWith("/kvkk") || pathname === "/onboarding" || pathname.startsWith("/focus/")) {
    return <div className="north-route">{children}</div>;
  }

  if (isFirebaseConfigured() && (!workspace.ready || workspace.authStatus !== "signed_in" || !workspace.coaching.onboarding)) {
    return (
      <main className="grid min-h-dvh place-items-center px-6 text-center">
        <div className="max-w-sm space-y-4">
          <NorthLogo size={48} className="mx-auto mb-2" />
          <p className="text-sm font-medium text-foreground">Planorth hazırlanıyor…</p>
          {loadingTooLong && (
            <div className="space-y-3 pt-2">
              <p className="text-xs text-muted-foreground">
                Bağlantı veya veri senkronizasyonu beklenenden uzun sürdü.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
                  Sayfayı Yenile
                </Button>
                <Button size="sm" variant="secondary" onClick={() => router.replace("/onboarding")}>
                  Onboarding&apos;e Git
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    );
  }
  return <div className="north-shell min-h-dvh max-w-full overflow-x-hidden">
    <a className="skip-link" href="#north-content">İçeriğe geç</a>
    <header className={cn("north-topbar",scrolled&&"is-scrolled")}>
      <div className="north-topbar-inner">
        <Link href="/" aria-label="Planorth — Bugün" className="north-brand"><NorthLogo size={34} priority/><span className="font-planorth text-base tracking-tight">Planorth</span></Link>
        <TopNavigation pathname={pathname}/>
        <div className="north-tools">
          <SanalKutuphaneBadge />
          <WorkspaceSearch/>
          <ThemeToggle/>
          <Link href="/data" className="north-profile hidden sm:grid" aria-label="Verilerim ve güvenlik" aria-current={pathname==="/data"?"page":undefined}><ShieldCheck size={17}/><span className="sr-only">Verilerim ve güvenlik</span></Link>
          <Link href="/profile" className="north-profile hidden sm:grid" aria-label="Profil ve ayarlar" aria-current={pathname==="/profile"?"page":undefined}><UserRound size={17}/><span className="sr-only">Profil ve ayarlar</span><span className={cn("north-sync",syncMode==="firebase"&&"connected")} title={syncMode==="firebase"?"Bulut çalışma alanı":"Yerel çalışma alanı"}/></Link>
        </div>
      </div>
    </header>
    <main
      id="north-content"
      className={cn(
        "north-main max-w-full overflow-x-hidden",
        pathname === "/coach" && "!p-0 overflow-hidden h-[calc(100dvh-64px)] max-md:h-[calc(100dvh-124px)]",
        pathname === "/" && "md:py-2 md:pb-2"
      )}
      tabIndex={-1}
    >
      {areaRoutes.some(p=>pathname===p||pathname.startsWith(p+"/"))&&<div className="north-context"><Link href={primaryArea ? `/areas/${primaryArea.id}` : "/areas"}>Alanlar / {primaryArea?.name??"Ana hedef"}</Link><span>/ {titles[pathname]??"Ayrıntı"}</span></div>}
      <div key={pathname} className={cn("north-route max-w-full overflow-x-hidden", pathname === "/coach" && "h-full overflow-hidden !p-0")}>{children}</div>
    </main>
    <NorthChatPopover/><MobileNavigation pathname={pathname}/><GuideTourModal/>
  </div>;
}
function TopNavigation({ pathname }: { pathname: string }) {
  const current = activeTab(pathname);
  return (
    <nav className="north-desktop-tabs" aria-label="Ana navigasyon">
      {featuredNavigation.map((href) => navigation.find((item) => item.href === href)!).map((n) => {
        const isActive = current === n.href;
        return (
          <Link
            key={n.href}
            href={n.href}
            className={cn("north-top-tab", isActive && "is-active")}
            aria-current={isActive ? "page" : undefined}
          >
            {n.href === "/" ? "Ana Panel" : n.href === "/coach" ? "Planorth Koç" : n.href === "/progress" ? "Gelişim & İstatistik" : n.href === "/knowledge" ? "Kütüphane" : n.label}
          </Link>
        );
      })}
      <DropdownMenu>
        <DropdownMenuTrigger className={cn("north-top-tab", !featuredNavigation.includes(current) && current && "is-active")}>Diğer sayfalar <MoreHorizontal size={15} /></DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-56 border border-border/70 bg-popover/95 backdrop-blur-xl">
          {navigation.filter((n) => !featuredNavigation.includes(n.href)).map((n) => <DropdownMenuItem key={n.href} asChild><Link href={n.href} className="flex items-center gap-2.5 px-3 py-2"><n.icon size={15} />{n.label}</Link></DropdownMenuItem>)}
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
}

function MobileNavigation({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);
  const current = activeTab(pathname);

  // Odak seansında ekranı tam odak moduna almak için mobil alt çubuğu gizle
  if (pathname.startsWith("/focus")) {
    return null;
  }

  const mobilePrimary = [
    { href: "/", label: "Bugün", icon: Home },
    { href: "/roadmap", label: "Yol Haritam", icon: ClipboardList },
    { href: "/coach", label: "Koç", icon: Sparkles },
    { href: "/knowledge", label: "Kütüphane", icon: BookOpen },
  ];
  const isSheetActive = !mobilePrimary.some((item) => current === item.href);

  return (
    <nav className="north-mobile-tabs safe-bottom" aria-label="Mobil navigasyon">
      {mobilePrimary.map((n) => {
        const isActive = current === n.href;
        return (
          <Link
            key={n.href}
            href={n.href}
            className={cn("relative group select-none", isActive && "is-active text-primary")}
            aria-current={isActive ? "page" : undefined}
          >
            <div className="relative">
              <n.icon size={20} className={cn("transition-transform group-active:scale-90", isActive && "stroke-[2.5]")} />
              {isActive && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 size-1 rounded-full bg-primary animate-pulse" />
              )}
            </div>
            <span className={cn("text-[10px] tracking-tight leading-tight", isActive ? "font-bold text-primary" : "text-muted-foreground")}>
              {n.label}
            </span>
          </Link>
        );
      })}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button
            type="button"
            className={cn("relative group select-none", isSheetActive && "is-active text-primary")}
            aria-label="Tüm sayfalar ve araçlar menüsü"
            aria-expanded={open}
          >
            <div className="relative">
              <MoreHorizontal size={20} className={cn("transition-transform group-active:scale-90", isSheetActive && "stroke-[2.5]")} />
              {isSheetActive && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 size-1 rounded-full bg-primary animate-pulse" />
              )}
            </div>
            <span className={cn("text-[10px] tracking-tight leading-tight", isSheetActive ? "font-bold text-primary" : "text-muted-foreground")}>
              Menü
            </span>
          </button>
        </SheetTrigger>
        <SheetContent side="bottom" className="rounded-t-3xl px-5 pt-3 pb-8 max-h-[88dvh] overflow-y-auto bg-card border-t border-border shadow-2xl">
          {/* DRAG HANDLE */}
          <div className="w-12 h-1.5 rounded-full bg-muted-foreground/30 mx-auto mb-3 cursor-grab" aria-hidden="true" />

          <SheetHeader className="pb-3 border-b border-border/60 text-left">
            <SheetTitle className="text-base font-bold text-foreground flex items-center justify-between">
              <span>Tüm Sayfalar &amp; Araçlar</span>
              <span className="text-xs font-normal text-muted-foreground font-mono">Planorth</span>
            </SheetTitle>
          </SheetHeader>

          {/* KATEGORİZE EDİLMİŞ MENÜ KARTLARI */}
          <div className="space-y-4 py-3">
            <div>
              <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase mb-2">Çalışma Alanları &amp; Takip</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { href: "/roadmap", label: "Yol Haritam", icon: ClipboardList, desc: "Kendi planını oluştur" },
                  { href: "/calendar", label: "Takvim & Zaman", icon: CalendarDays, desc: "Aylık taksim & bloklar" },
                  { href: "/progress", label: "İlerleme & Rapor", icon: BarChart3, desc: "Radar ve değerlendirme" },
                  { href: "/coach", label: "Planorth AI Koç", icon: Sparkles, desc: "Birebir rehberlik" },
                  { href: "/evidence", label: "Portföy & Kanıt", icon: Briefcase, desc: "Kazanımlar ve projeler" },
                ].map((item) => {
                  const isActive = current === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all active:scale-[0.98]",
                        isActive
                          ? "bg-primary/10 text-primary border-primary/30 font-semibold"
                          : "bg-muted/30 hover:bg-muted text-foreground border-border/60"
                      )}
                    >
                      <div className={cn("p-1.5 rounded-lg shrink-0", isActive ? "bg-primary text-primary-foreground" : "bg-background text-primary border border-border/60")}>
                        <item.icon size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate leading-tight">{item.label}</p>
                        <p className="text-[9px] text-muted-foreground truncate leading-tight mt-0.5">{item.desc}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase mb-2">Öğrenme &amp; Başarı</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { href: "/certifications", label: "Sertifikalar", icon: Award, desc: "Hedef ve sınavlar" },
                  { href: "/labs", label: "Sanal Lablar", icon: FlaskConical, desc: "Pratik senaryolar" },
                ].map((item) => {
                  const isActive = current === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all active:scale-[0.98]",
                        isActive
                          ? "bg-primary/10 text-primary border-primary/30 font-semibold"
                          : "bg-muted/30 hover:bg-muted text-foreground border-border/60"
                      )}
                    >
                      <div className={cn("p-1.5 rounded-lg shrink-0", isActive ? "bg-primary text-primary-foreground" : "bg-background text-indigo-500 border border-border/60")}>
                        <item.icon size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate leading-tight">{item.label}</p>
                        <p className="text-[9px] text-muted-foreground truncate leading-tight mt-0.5">{item.desc}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ALT TERCİHLER VE TEMA BARI */}
          <div className="pt-3 border-t border-border/60 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <Link
              href="/profile?tab=guide"
              onClick={() => setOpen(false)}
              className="flex items-center gap-1.5 hover:text-foreground font-medium p-1.5 rounded-lg active:bg-muted/50"
            >
              <CircleHelp size={15} className="text-primary" />
              <span>Kılavuz &amp; Tur</span>
            </Link>
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-1.5 hover:text-foreground font-medium p-1.5 rounded-lg active:bg-muted/50"
            >
              <UserRound size={15} className="text-primary" />
              <span>Profil ve Ayarlar</span>
            </Link>
            <Link
              href="/data"
              onClick={() => setOpen(false)}
              className="flex items-center gap-1.5 hover:text-foreground font-medium p-1.5 rounded-lg active:bg-muted/50"
            >
              <ShieldCheck size={15} className="text-primary" />
              <span>Verilerim</span>
            </Link>
            <div className="flex items-center gap-2 pl-1">
              <span className="text-[11px]">Tema:</span>
              <ThemeToggle />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}
