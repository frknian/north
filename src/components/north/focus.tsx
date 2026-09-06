"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
const FocusCoach = dynamic(() => import("./ai").then(m => m.NorthAI));
import { useRouter } from "next/navigation";
import { dayKey, type NorthActivity } from "@/lib/north";
import { inferTaskType, refreshIntelligence } from "@/lib/north-intelligence";
import { browserCompanion } from "@/lib/focus-companion";
import { useNorth, Field, fieldClass } from "./shared";
import { Button } from "@/components/ui/button";
type Timer = {id:string; started:number; beganAt?:number; accumulated:number; running:boolean; pauses?:number};
export function NorthFocus({id}:{id:string}) {
  const {state,update,ready}=useNorth();const router=useRouter();
  const task=state.tasks.find(t=>t.id===id);const area=state.areas.find(a=>a.id===task?.areaId);
  const [timer,setTimer]=useState<Timer|null>(null);const [now,setNow]=useState(0);const [finishing,setFinishing]=useState(false);
  const [exitAt,setExitAt]=useState<number|null>(null);const [reason,setReason]=useState("");
  const [outcome,setOutcome]=useState<NorthActivity["outcome"]>("partial");const [difficulty,setDifficulty]=useState("");const [reflection,setReflection]=useState("");const [amount,setAmount]=useState(0);const [saved,setSaved]=useState(false);const [coachOpen,setCoachOpen]=useState(false);
  useEffect(()=>{
    const hydration=setTimeout(()=>{const key=`north:focus:${id}`;const stored=sessionStorage.getItem(key);
    if(stored)try{const value=JSON.parse(stored) as Timer;if(typeof value.started==="number"&&typeof value.accumulated==="number")setTimer(value);}catch{}},0);
    const tick=setInterval(()=>setNow(Date.now()),250);return()=>{clearTimeout(hydration);clearInterval(tick);};
  },[id]);
  useEffect(()=>{if(timer)sessionStorage.setItem(`north:focus:${id}`,JSON.stringify(timer));},[id,timer]);
  useEffect(()=>{if(!timer?.running)return;const warn=(e:BeforeUnloadEvent)=>{e.preventDefault();};window.addEventListener("beforeunload",warn);return()=>window.removeEventListener("beforeunload",warn);},[timer?.running]);
  const elapsed=timer?timer.accumulated+(timer.running?Math.max(0,now-timer.started):0):0;
  const seconds=Math.max(0,(task?.minutes??50)*60-Math.floor(elapsed/1000));
  function pause(){if(timer?.running)setTimer({...timer,accumulated:timer.accumulated+Math.max(0,Date.now()-timer.started),running:false,pauses:(timer.pauses??0)+1});}
  function finish(){pause();setFinishing(true);setOutcome(seconds===0?"done":"partial");}
  if(!ready)return <main className="p-8">Oturum hazırlanıyor…</main>;
  if(!task||!area)return <main className="p-8">Görev bulunamadı. <Link href="/">Bugüne dön</Link></main>;
  return <main className="north-focus-mode"><p className="text-sm text-primary">{area.icon} {area.name}</p><h1 className="north-focus-title">{task.title}</h1><p className="mt-5 leading-relaxed text-muted-foreground">Amaç: {task.goal}</p>
  {!finishing?<><div className="north-focus-timer" role="timer" aria-label="Kalan süre">{String(Math.floor(seconds/60)).padStart(2,"0")}:{String(seconds%60).padStart(2,"0")}</div>{task.resource.startsWith("https://")&&<a className="mb-5 text-sm text-primary" href={task.resource} target="_blank" rel="noreferrer">Gerekli kaynağı aç ↗</a>}<div className="flex flex-wrap gap-3">{!timer?<Button onClick={()=>{const started=Date.now();setNow(started);setTimer({id:crypto.randomUUID(),started,beganAt:started,accumulated:0,running:true,pauses:0});void browserCompanion.start(area.id);}}>Odaklanmayı başlat</Button>:<><Button variant="outline" onClick={()=>timer.running?pause():setTimer({...timer,started:Date.now(),running:true})}>{timer.running?"Duraklat":"Devam et"}</Button><Button onClick={()=>seconds===0?finish():setExitAt(Date.now())}>Oturumu bitir</Button></>}<Button variant="ghost" onClick={()=>setCoachOpen(true)}>North Koç</Button><Dialog open={coachOpen} onOpenChange={setCoachOpen}><DialogContent className="north-coach-drawer"><DialogHeader><DialogTitle>North Koç</DialogTitle><DialogDescription>Yalnızca şu anki görev için bir sonraki adım.</DialogDescription></DialogHeader>{coachOpen&&<FocusCoach taskId={id} embedded/>}</DialogContent></Dialog></div>
  {exitAt!==null&&<section className="mt-6 space-y-4 rounded-xl border p-5" aria-label="Erken bitir"><p>Plan değişebilir. Neden erken bitiriyorsun?</p><select aria-label="Erken bitirme nedeni" className={fieldClass} value={reason} onChange={e=>setReason(e.target.value)}><option value="">Bir neden seç</option>{["Acil durum","Görev tamamlandı","Yanlış görev","Düşük enerji","Diğer"].map(r=><option key={r}>{r}</option>)}</select><Button disabled={!reason||now-exitAt<10000} onClick={finish}>{now-exitAt<10000?`${Math.min(10,Math.ceil((10000-(now-exitAt))/1000))} saniye sonra bitir`:"Erken bitir"}</Button><Button variant="ghost" onClick={()=>setExitAt(null)}>Odakta kal</Button></section>}
  {!timer&&<Link href="/" className="mt-8 text-sm text-muted-foreground">← Bugüne dön</Link>}<p className="mt-10 text-xs text-muted-foreground">North yalnızca uygulama içindeki plan ve oturum kayıtlarını kullanır; cihaz etkinliğini izlemez.</p></>:<section className="mt-8 space-y-5"><p className="text-sm text-muted-foreground">{Math.floor(elapsed/60000)} dakika gerçek odak. Kısaca kaydedelim.</p><Field label="Sonuç"><select className={fieldClass} value={outcome} onChange={e=>setOutcome(e.target.value as NorthActivity["outcome"])}><option value="done">Tamamlandı</option><option value="partial">Kısmen</option><option value="skipped">Yapılmadı</option></select></Field><Field label="Zorluk (isteğe bağlı)"><select className={fieldClass} value={difficulty} onChange={e=>setDifficulty(e.target.value)}><option value="">Seçmeden geç</option><option>Kolay</option><option>Tam kararında</option><option>Zor</option></select></Field><Field label={`${area.metric} · gerçek miktar`}><input type="number" min="0" className={fieldClass} value={amount} onChange={e=>setAmount(Math.max(0,Number(e.target.value)))}/></Field><Field label="Seni ne zorladı? (isteğe bağlı)"><input className={fieldClass} value={reflection} onChange={e=>setReflection(e.target.value)}/></Field><Button disabled={saved} onClick={()=>{if(!timer||saved)return;setSaved(true);const actualMinutes=Math.max(0,Math.floor(elapsed/60000));const activity:NorthActivity={id:timer.id,taskId:id,areaId:area.id,date:dayKey(),minutes:actualMinutes,outcome,difficulty,reflection:[reason,reflection].filter(Boolean).join(" · "),amount:outcome==="skipped"?0:amount,metric:area.metric,endedAt:new Date().toISOString(),plannedMinutes:task.minutes,actualStart:new Date(timer.beganAt??timer.started).toISOString(),plannedStart:task.plannedStart,energy:state.energy.date===dayKey()?state.energy.level:"normal",pauseCount:Math.max(0,(timer.pauses??0)-(timer.running?0:1)),earlyExit:seconds>0,completionPercent:outcome==="done"?100:outcome==="skipped"?0:Math.min(99,Math.round(actualMinutes/task.minutes*100)),taskType:inferTaskType(task,area.kind)};update(s=>s.activities.some(a=>a.id===timer.id)?s:refreshIntelligence({...s,activities:[...s.activities,activity],tasks:s.tasks.map(t=>t.id===id?{...t,status:outcome}:t)}));sessionStorage.removeItem(`north:focus:${id}`);void browserCompanion.stop();router.push("/");}}>Kaydet ve Bugün’e dön</Button></section>}
  </main>;
}
