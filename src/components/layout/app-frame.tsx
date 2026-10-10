"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Award, BarChart3, BookOpen, Briefcase, CalendarDays, ChevronsLeft, ChevronsRight, CircleHelp, ClipboardList, FlaskConical, Home, Layers3, Library, Map as MapIcon, MoreHorizontal, ShieldCheck, Sparkles, UserRound } from "lucide-react";
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
import { SanalKutuphaneBadge } from "@/components/north/sanal-kutuphane";

const navigation = [
  { href: "/", label: "Bugün", icon: Home },
  { href: "/coach", label: "Koç", icon: Sparkles },
  { href: "/week", label: "Plan", icon: ClipboardList },
  { href: "/roadmap", label: "Yol Haritam", icon: MapIcon },
  { href: "/areas", label: "Alanlar", icon: Layers3 },
  { href: "/knowledge", label: "Kütüphane", icon: Library },
  { href: "/resources", label: "Kaynaklar", icon: BookOpen },
  { href: "/labs", label: "Lablar", icon: FlaskConical },
  { href: "/evidence", label: "Portföy", icon: Briefcase },
  { href: "/progress", label: "İlerleme", icon: BarChart3 },
  { href: "/calendar", label: "Takvim", icon: CalendarDays },
];
const navGroups = [
  { label: "Çalışma", items: ["/", "/coach", "/week", "/roadmap"] },
  { label: "Öğrenme", items: ["/areas", "/knowledge", "/resources", "/labs", "/evidence"] },
  { label: "Takip", items: ["/progress", "/calendar"] },
];
const sidebarKey = "north_sidebar_collapsed";
const sidebarEvent = "north-sidebar-change";
function subscribeSidebar(callback: () => void) { window.addEventListener(sidebarEvent, callback); window.addEventListener("storage", callback); return () => { window.removeEventListener(sidebarEvent, callback); window.removeEventListener("storage", callback); }; }
function readSidebar() { try { return localStorage.getItem(sidebarKey) === "1"; } catch { return false; } }
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
  const pathname=usePathname(); const router=useRouter(); const workspace=useWorkspace(); const {syncMode,north}=workspace;  const [scrolled,setScrolled]=useState(false); const collapsed=useSyncExternalStore(subscribeSidebar,readSidebar,()=>false);
  const [loadingTooLong, setLoadingTooLong] = useState(false);
  const area=pathname.startsWith("/areas/")?north?.areas.find(a=>a.id===pathname.split("/")[2]):undefined;
  const primaryArea=north?.areas.find(a=>a.id==="primary-goal")??north?.areas.find(a=>a.id==="cyber");
  const pageTitle=area?.name??titles[pathname]??(pathname.startsWith("/focus/")?"Odak":pathname.startsWith("/areas/")?"Alan": "Planorth");
  useEffect(()=>{document.title=pageTitle==="Planorth"?"Planorth":pageTitle+" — Planorth";},[pageTitle]);
  const toggleCollapsed = () => { try { localStorage.setItem(sidebarKey, collapsed ? "0" : "1"); } catch {} window.dispatchEvent(new Event(sidebarEvent)); };
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
  return <div className={cn("north-shell ns-shell min-h-dvh max-w-full", collapsed && "is-collapsed")}>
    <a className="skip-link" href="#north-content">İçeriğe geç</a>
    <Sidebar pathname={pathname} collapsed={collapsed} onToggle={toggleCollapsed} syncMode={syncMode}/>
    <div className="ns-stage">
      <header className={cn("ns-header",scrolled&&"is-scrolled")}>
        <Link href="/" aria-label="Planorth — Bugün" className="ns-header-brand"><NorthLogo size={30} priority/><span className="font-planorth">Planorth</span></Link>
        <div className="ns-header-title"><span>{pageTitle}</span></div>
        <div className="ns-tools">
          <SanalKutuphaneBadge />
          <WorkspaceSearch variant="pill"/>
          <ThemeToggle/>
          <Link href="/profile" className="ns-avatar sm:hidden" aria-label="Profil ve ayarlar"><UserRound size={16}/></Link>
        </div>
      </header>
      <main
        id="north-content"
        className={cn(
          "north-main max-w-full overflow-x-hidden",
          pathname === "/coach" && "!p-0 overflow-hidden h-[calc(100dvh-64px)] max-md:h-[calc(100dvh-124px)]",
        )}
        tabIndex={-1}
      >
        {areaRoutes.some(p=>pathname===p||pathname.startsWith(p+"/"))&&<div className="north-context"><Link href={primaryArea ? `/areas/${primaryArea.id}` : "/areas"}>Alanlar / {primaryArea?.name??"Ana hedef"}</Link><span>/ {titles[pathname]??"Ayrıntı"}</span></div>}
        <div key={pathname} className={cn("north-route max-w-full overflow-x-hidden", pathname === "/coach" && "h-full overflow-hidden !p-0")}>{children}</div>
      </main>
    </div>
    <NorthChatPopover/><MobileNavigation pathname={pathname}/><GuideTourModal/>
  </div>;
}
function Sidebar({ pathname, collapsed, onToggle, syncMode }: { pathname: string; collapsed: boolean; onToggle: () => void; syncMode: string }) {
  const current = activeTab(pathname);
  const utility = [
    { href: "/profile", label: "Profil ve ayarlar", icon: UserRound },
    { href: "/data", label: "Verilerim", icon: ShieldCheck },
    { href: "/profile?tab=guide", label: "Kılavuz", icon: CircleHelp },
  ];
  return (
    <aside className="ns-sidebar" aria-label="Kenar çubuğu">
      <div className="ns-sidebar-top">
        <Link href="/" aria-label="Planorth — Bugün" className="ns-brand"><NorthLogo size={32} priority/><span className="ns-label font-planorth">Planorth</span></Link>
        <button type="button" className="ns-collapse" onClick={onToggle} aria-label={collapsed ? "Kenar çubuğunu genişlet" : "Kenar çubuğunu daralt"} title={collapsed ? "Genişlet" : "Daralt"}>
          {collapsed ? <ChevronsRight size={16}/> : <ChevronsLeft size={16}/>}
        </button>
      </div>
      <nav className="ns-nav" aria-label="Ana navigasyon">
        {navGroups.map((group) => (
          <div className="ns-group" key={group.label}>
            <p className="ns-group-label">{group.label}</p>
            {group.items.map((href) => {
              const n = navigation.find((item) => item.href === href)!;
              const isActive = current === n.href;
              return (
                <Link key={n.href} href={n.href} className={cn("ns-link", isActive && "is-active")} aria-current={isActive ? "page" : undefined} title={n.label}>
                  <n.icon size={18} strokeWidth={isActive ? 2.4 : 2}/>
                  <span className="ns-label">{n.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="ns-sidebar-bottom">
        {utility.map((n) => {
          const isActive = pathname === n.href.split("?")[0] && !n.href.includes("?");
          return (
            <Link key={n.href} href={n.href} className={cn("ns-link is-quiet", isActive && "is-active")} aria-current={isActive ? "page" : undefined} title={n.label}>
              <n.icon size={17}/>
              <span className="ns-label">{n.label}</span>
              {n.href === "/profile" && <span className={cn("ns-sync", syncMode==="firebase"&&"connected")} title={syncMode==="firebase"?"Bulut çalışma alanı":"Yerel çalışma alanı"}/>}
            </Link>
          );
        })}
      </div>
    </aside>
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

          <div className="space-y-5 py-4">
            {[...navGroups, { label: "Hedefler", items: ["/certifications"] }].map((group) => (
              <div key={group.label}>
                <p className="ns-group-label mb-2">{group.label}</p>
                <div className="grid grid-cols-2 gap-2">
                  {group.items.map((href) => {
                    const item = navigation.find((n) => n.href === href) ?? { href: "/certifications", label: "Sertifikalar", icon: Award };
                    const isActive = current === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn("ns-sheet-link", isActive && "is-active")}
                      >
                        <item.icon size={18} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
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
