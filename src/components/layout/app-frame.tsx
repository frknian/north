"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, CalendarDays, ChevronDown, ClipboardList, Home, Layers3, MoreHorizontal, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { NorthChatPopover } from "@/components/north/north-chat-popover";
import { WorkspaceSearch } from "@/components/features/workspace-search";
import { useWorkspace } from "@/components/features/workspace-provider";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { NorthLogo } from "@/components/layout/north-logo";
import { isCurrentTabLocked, FOCUS_LOCK_KEY, BROADCAST_CHANNEL_NAME, type ActiveFocusLock } from "@/lib/focus-lock";
import { FocusLockBarrier } from "@/components/features/focus-lock-barrier";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const navigation = [
  { href: "/", label: "Bugün", icon: Home },
  { href: "/coach", label: "Koç", icon: Sparkles },
  { href: "/week", label: "Plan", icon: ClipboardList },
];
const areaRoutes = ["/labs", "/skills", "/resources", "/career", "/evidence", "/knowledge", "/certifications", "/plan"];
const moreNavigation = [
  { href: "/areas", label: "Alanlarım", icon: Layers3 },
  { href: "/progress", label: "İlerleme & Analiz", icon: BarChart3 },
  { href: "/calendar", label: "Takvim", icon: CalendarDays },
  { href: "/reviews", label: "Haftalık Değerlendirme", icon: ClipboardList },
  { href: "/labs", label: "Lablar", icon: Layers3 },
  { href: "/evidence", label: "Kanıtlar", icon: ShieldCheck },
  { href: "/profile", label: "Profil ve Ayarlar", icon: UserRound },
];
const titles: Record<string,string> = {"/":"Bugün","/calendar":"Takvim","/areas":"Alanlar","/progress":"İlerleme","/north-ai":"Planorth Koç","/week":"Plan","/coach":"Planorth Koç","/profile":"Profil ve ayarlar","/data":"Verilerim ve güvenlik","/labs":"Lablar","/skills":"Beceriler","/resources":"Kaynaklar","/career":"Kariyer","/evidence":"Kanıtlar","/knowledge":"Bilgi bankası","/certifications":"Sertifikalar","/plan":"Plan","/reviews":"Değerlendirmeler","/insights":"İçgörüler","/login":"Giriş","/kvkk":"KVKK Aydınlatma Metni","/onboarding":"Başlangıç kurulumu"};
function activeTab(path: string) {
  if (path === "/") return "/";
  if (path === "/coach" || path === "/north-ai") return "/coach";
  if (path === "/week") return "/week";
  if (areaRoutes.some((route) => path === route || path.startsWith(route + "/"))) return "more";
  if (path === "/reviews" || path === "/insights") return "more";
  if (moreNavigation.some((route) => path === route.href || path.startsWith(route.href + "/"))) return "more";
  return navigation.find((n) => n.href !== "/" && path.startsWith(n.href))?.href ?? (path === "/" ? "/" : "");
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
  return <div className="north-shell min-h-dvh">
    <a className="skip-link" href="#north-content">İçeriğe geç</a>
    <header className={cn("north-topbar",scrolled&&"is-scrolled")}>
      <div className="north-topbar-inner">
        <Link href="/" aria-label="Planorth — Bugün" className="north-brand"><NorthLogo size={34} priority/><span className="font-planorth text-base tracking-[0.04em]">PLANORTH</span></Link>
        <TopNavigation pathname={pathname}/>
        <div className="north-tools"><WorkspaceSearch/><ThemeToggle/><Link href="/data" className="north-profile hidden sm:grid" aria-label="Verilerim ve güvenlik" aria-current={pathname==="/data"?"page":undefined}><ShieldCheck size={17}/><span className="sr-only">Verilerim ve güvenlik</span></Link><Link href="/profile" className="north-profile hidden sm:grid" aria-label="Profil ve ayarlar" aria-current={pathname==="/profile"?"page":undefined}><UserRound size={17}/><span className="sr-only">Profil ve ayarlar</span><span className={cn("north-sync",syncMode==="firebase"&&"connected")} title={syncMode==="firebase"?"Bulut çalışma alanı":"Yerel çalışma alanı"}/></Link></div>
      </div>
    </header>
    <main id="north-content" className="north-main" tabIndex={-1}>
      {areaRoutes.some(p=>pathname===p||pathname.startsWith(p+"/"))&&<div className="north-context"><Link href={`/areas/${primaryArea?.id??"cyber"}`}>Alanlar / {primaryArea?.name??"Ana hedef"}</Link><span>/ {titles[pathname]??"Ayrıntı"}</span></div>}
      <div key={pathname} className="north-route">{children}</div>
    </main>
    <NorthChatPopover/><MobileNavigation pathname={pathname}/>
  </div>;
}
function TopNavigation({pathname}:{pathname:string}) {
 return <nav className="north-desktop-tabs" aria-label="Ana navigasyon">{navigation.map(n=><Link key={n.href} href={n.href} className={cn("north-top-tab",activeTab(pathname)===n.href&&"is-active")} aria-current={activeTab(pathname)===n.href?"page":undefined}>{n.label}</Link>)}<DropdownMenu><DropdownMenuTrigger className={cn("north-top-tab north-more-trigger",activeTab(pathname)==="more"&&"is-active")} aria-label="Diğer sayfalar">Diğer <ChevronDown size={14}/></DropdownMenuTrigger><DropdownMenuContent align="start">{moreNavigation.map(item=><DropdownMenuItem key={item.href} asChild><Link href={item.href}><item.icon size={15}/>{item.label}</Link></DropdownMenuItem>)}</DropdownMenuContent></DropdownMenu></nav>;
}
function MobileNavigation({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);
  const isMoreActive = activeTab(pathname) === "more";

  return (
    <nav className="north-mobile-tabs safe-bottom" aria-label="Mobil navigasyon">
      {navigation.map((n) => (
        <Link
          key={n.href}
          href={n.href}
          className={cn(activeTab(pathname) === n.href && "is-active")}
          aria-current={activeTab(pathname) === n.href ? "page" : undefined}
        >
          <n.icon size={19} />
          <span>{n.label}</span>
        </Link>
      ))}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button
            type="button"
            className={cn(isMoreActive && "is-active")}
            aria-label="Diğer sayfalar menüsü"
            aria-expanded={open}
          >
            <MoreHorizontal size={19} />
            <span>Diğer</span>
          </button>
        </SheetTrigger>
        <SheetContent side="bottom" className="rounded-t-3xl px-5 pt-5 pb-8 max-h-[85vh] overflow-y-auto bg-card border-t border-border">
          <SheetHeader className="pb-3 border-b border-border/60 text-left">
            <SheetTitle className="text-base font-bold text-foreground">
              Diğer Sayfalar &amp; Araçlar
            </SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-2 gap-2.5 py-4">
            {moreNavigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 p-3 rounded-xl border text-xs sm:text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary border-primary/30 font-semibold"
                      : "bg-muted/40 hover:bg-muted text-foreground border-border/60 hover:border-border"
                  )}
                >
                  <div className={cn("p-1.5 rounded-lg shrink-0", isActive ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground border border-border/60")}>
                    <item.icon size={16} />
                  </div>
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <Link
              href="/data"
              onClick={() => setOpen(false)}
              className="flex items-center gap-1.5 hover:text-foreground font-medium p-1"
            >
              <ShieldCheck size={15} className="text-primary" />
              <span>Verilerim ve Güvenlik</span>
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-[11px]">Tema:</span>
              <ThemeToggle />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}
