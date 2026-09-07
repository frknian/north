"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, Bot, CalendarDays, ClipboardList, Home, Layers3, ShieldCheck, UserRound } from "lucide-react";
import { WorkspaceSearch } from "@/components/features/workspace-search";
import { useWorkspace } from "@/components/features/workspace-provider";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/", label: "Bugün", icon: Home },
  { href: "/week", label: "Plan", icon: ClipboardList },
  { href: "/calendar", label: "Takvim", icon: CalendarDays },
  { href: "/areas", label: "Alanlar", icon: Layers3 },
  { href: "/progress", label: "İlerleme", icon: BarChart3 },
  { href: "/north-ai", label: "North AI", icon: Bot },
];
const areaRoutes = ["/labs", "/skills", "/resources", "/career", "/evidence", "/knowledge", "/certifications", "/plan"];
const titles: Record<string,string> = {"/":"Bugün","/calendar":"Takvim","/areas":"Alanlar","/progress":"İlerleme","/north-ai":"North AI","/week":"Plan","/coach":"North AI","/profile":"Profil ve ayarlar","/data":"Verilerim ve güvenlik","/labs":"Lablar","/skills":"Beceriler","/resources":"Kaynaklar","/career":"Kariyer","/evidence":"Kanıtlar","/knowledge":"Bilgi bankası","/certifications":"Sertifikalar","/plan":"Siber güvenlik planı","/reviews":"Değerlendirmeler","/insights":"İçgörüler","/login":"Giriş","/kvkk":"KVKK Aydınlatma Metni","/onboarding":"Başlangıç kurulumu"};
function activeTab(path: string) {
  if(path === "/week")return "/week";
  if(areaRoutes.some(route=>path===route||path.startsWith(route+"/")))return "/areas";
  if(path==="/reviews"||path==="/insights")return "/progress";
  if(path==="/coach")return "/north-ai";
  return navigation.find(n=>n.href!=="/"&&path.startsWith(n.href))?.href ?? (path==="/" ? "/" : "");
}
export function AppFrame({children}:{children:React.ReactNode}) {
  const pathname=usePathname(); const router=useRouter(); const workspace=useWorkspace(); const {syncMode,north}=workspace;const [scrolled,setScrolled]=useState(false);
  const area=pathname.startsWith("/areas/")?north?.areas.find(a=>a.id===pathname.split("/")[2]):undefined;
  const primaryArea=north?.areas.find(a=>a.id==="primary-goal")??north?.areas.find(a=>a.id==="cyber");
  const pageTitle=area?.name??titles[pathname]??(pathname.startsWith("/focus/")?"Odak":pathname.startsWith("/areas/")?"Alan": "North");
  useEffect(()=>{document.title=pageTitle==="North"?"North":pageTitle+" — North";},[pageTitle]);
  useEffect(()=>{const onScroll=()=>setScrolled(window.scrollY>24);onScroll();window.addEventListener("scroll",onScroll,{passive:true});return()=>window.removeEventListener("scroll",onScroll);},[]);
  useEffect(()=>{
    if(!isFirebaseConfigured()||!workspace.ready||workspace.authStatus==="loading")return;
    const publicRoute=pathname.startsWith("/login")||pathname.startsWith("/auth")||pathname.startsWith("/account-reset")||pathname.startsWith("/kvkk");
    if(workspace.authStatus==="signed_out"&&!publicRoute){router.replace("/login");return;}
    if(workspace.authStatus==="signed_in"&&!workspace.coaching.onboarding&&pathname!=="/onboarding"){router.replace("/onboarding");return;}
    if(workspace.authStatus==="signed_in"&&workspace.coaching.onboarding&&pathname==="/onboarding")router.replace("/");
  },[pathname,router,workspace.authStatus,workspace.coaching.onboarding,workspace.ready]);
  if(pathname.startsWith("/login")||pathname.startsWith("/auth")||pathname.startsWith("/account-reset")||pathname.startsWith("/kvkk")||pathname==="/onboarding"||pathname.startsWith("/focus/"))return <div className="north-route">{children}</div>;
  if(isFirebaseConfigured()&&(!workspace.ready||workspace.authStatus!=="signed_in"||!workspace.coaching.onboarding))return <main className="grid min-h-dvh place-items-center px-6 text-center"><div><Image src="/north-mark.png" alt="" width={48} height={48} className="mx-auto mb-4 rounded-xl bg-white p-1"/><p className="text-sm text-muted-foreground">North hazırlanıyor…</p></div></main>;
  return <div className="north-shell min-h-dvh">
    <a className="skip-link" href="#north-content">İçeriğe geç</a>
    <header className={cn("north-topbar",scrolled&&"is-scrolled")}>
      <div className="north-topbar-inner">
        <Link href="/" aria-label="North — Bugün" className="north-brand"><Image src="/north-mark.png" alt="" width={36} height={36} className="rounded-lg bg-white p-1" priority/><span>North</span></Link>
        <TopNavigation pathname={pathname}/>
        <div className="north-tools"><WorkspaceSearch/><Link href="/data" className="north-profile" aria-label="Verilerim ve güvenlik" aria-current={pathname==="/data"?"page":undefined}><ShieldCheck size={17}/><span className="sr-only">Verilerim ve güvenlik</span></Link><Link href="/profile" className="north-profile" aria-label="Profil ve ayarlar" aria-current={pathname==="/profile"?"page":undefined}><UserRound size={17}/><span className="sr-only">Profil ve ayarlar</span><span className={cn("north-sync",syncMode==="firebase"&&"connected")} title={syncMode==="firebase"?"Bulut çalışma alanı":"Yerel çalışma alanı"}/></Link></div>
      </div>
    </header>
    <main id="north-content" className="north-main" tabIndex={-1}>
      {areaRoutes.some(p=>pathname===p||pathname.startsWith(p+"/"))&&<div className="north-context"><Link href={`/areas/${primaryArea?.id??"cyber"}`}>Alanlar / {primaryArea?.name??"Ana hedef"}</Link><span>/ {titles[pathname]??"Ayrıntı"}</span></div>}
      <div key={pathname} className="north-route">{children}</div>
    </main>
    <MobileNavigation pathname={pathname}/>
  </div>;
}
function TopNavigation({pathname}:{pathname:string}) {
 return <nav className="north-desktop-tabs" aria-label="Ana navigasyon">{navigation.map(n=><Link key={n.href} href={n.href} className={cn("north-top-tab",activeTab(pathname)===n.href&&"is-active")} aria-current={activeTab(pathname)===n.href?"page":undefined}>{n.label}</Link>)}</nav>;
}
function MobileNavigation({pathname}:{pathname:string}) {
 return <nav className="north-mobile-tabs safe-bottom" aria-label="Mobil navigasyon">{navigation.map(n=><Link key={n.href} href={n.href} className={cn(activeTab(pathname)===n.href&&"is-active")} aria-current={activeTab(pathname)===n.href?"page":undefined}><n.icon size={19}/><span>{n.href==="/north-ai"?"AI":n.label}</span></Link>)}</nav>;
}
