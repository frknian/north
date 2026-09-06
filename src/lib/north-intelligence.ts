import type { BehaviorPattern, NorthActivity, NorthIntelligenceState, NorthState, NorthTask, PatternConfidence, PatternStatus } from "./north";

export type IntelligenceMetric = { label:string; value:string; detail:string };
export interface IntelligenceReport {
  generatedAt:string; observationStart:string; observationEnd:string; sampleSize:number;
  patterns:BehaviorPattern[]; visiblePatterns:BehaviorPattern[]; metrics:IntelligenceMetric[];
  fourWeek:{sessions:number;completionRate:number;actualMinutes:number;planningAccuracy:number};
  twelveWeek:{sessions:number;completionRate:number;actualMinutes:number;planningAccuracy:number};
  previousFourWeek:{sessions:number;completionRate:number;actualMinutes:number};
  sustainableWeeklyMinutes:number; summary:string;
}

const DAY = 86_400_000;
const segment = (iso:string) => { const hour=new Date(iso).getHours(); return hour<6?"Gece":hour<9?"Erken sabah":hour<12?"Sabah":hour<18?"Öğleden sonra":hour<22?"Akşam":"Geç gece"; };
const lengthBucket = (minutes:number) => minutes<25?"25 dk altı":minutes<=40?"25–40 dk":minutes<=60?"40–60 dk":minutes<=90?"60–90 dk":"90 dk üzeri";
const pct = (value:number) => Math.round(value*100);
const confidence = (n:number):{status:PatternStatus;confidence:PatternConfidence} => n>=15?{status:"strong",confidence:"high"}:n>=6?{status:"reliable",confidence:"medium"}:n>=3?{status:"emerging",confidence:"low"}:{status:"insufficient",confidence:"low"};
const median = (values:number[]) => { if(!values.length)return 0;const sorted=[...values].sort((a,b)=>a-b);const middle=Math.floor(sorted.length/2);return sorted.length%2?sorted[middle]:Math.round((sorted[middle-1]+sorted[middle])/2); };
const safeDate = (iso:string|undefined, fallback:string) => iso && !Number.isNaN(new Date(iso).getTime()) ? iso : fallback;
const activityStart = (a:NorthActivity) => safeDate(a.actualStart, new Date(new Date(a.endedAt).getTime()-a.minutes*60_000).toISOString());
const completed = (a:NorthActivity) => a.outcome==="done" || (a.completionPercent??0)>=90;
const weight = (a:NorthActivity, now:Date) => Math.pow(.78,Math.max(0,(now.getTime()-new Date(a.endedAt).getTime())/(28*DAY)));
const rate = (items:NorthActivity[], now:Date) => { const total=items.reduce((n,a)=>n+weight(a,now),0);return total?items.reduce((n,a)=>n+(completed(a)?weight(a,now):0),0)/total:0; };
const taskFor = (state:NorthState,a:NorthActivity) => state.tasks.find(t=>t.id===a.taskId);
export function inferTaskType(task:NorthTask, areaKind?:string):NonNullable<NorthTask["taskType"]> {
  if(task.taskType)return task.taskType;const text=`${task.title} ${task.goal}`.toLocaleLowerCase("tr-TR");
  if(areaKind==="reading"||/oku|kitap|makale/.test(text))return "reading";
  if(/lab|laboratuvar/.test(text))return "lab";
  if(areaKind==="math"||/problem|denklem|soru çöz/.test(text))return "problem_solving";
  if(/tekrar|incele|gözden geçir/.test(text))return "review";
  if(task.minutes<=20||task.intensity==="low")return "light";
  return "deep_work";
}
function pattern(input:Omit<BehaviorPattern,"createdAt"|"updatedAt"|"status"|"confidence">, now:Date):BehaviorPattern {
  return {...input,...confidence(input.sampleSize),createdAt:now.toISOString(),updatedAt:now.toISOString()};
}
function windowed(state:NorthState,now:Date,days:number,fromDays=0) {
  const end=now.getTime()-fromDays*DAY,start=end-days*DAY,learning=state.intelligence?.learningStartedAt?new Date(state.intelligence.learningStartedAt).getTime():0;
  return state.activities.filter(a=>{const time=new Date(a.endedAt).getTime();return time>=Math.max(start,learning)&&time<=end;});
}
function summaryWindow(items:NorthActivity[],state:NorthState) {
  const planned=items.reduce((n,a)=>n+(a.plannedMinutes??taskFor(state,a)?.minutes??a.minutes),0);const actual=items.reduce((n,a)=>n+a.minutes,0);
  return {sessions:items.length,completionRate:items.length?pct(items.filter(completed).length/items.length):0,actualMinutes:actual,planningAccuracy:planned?Math.max(0,Math.round((1-Math.min(1,Math.abs(actual-planned)/planned))*100)):0};
}
export function analyzeNorth(state:NorthState, at=new Date()):IntelligenceReport {
  const now=new Date(at);const twelve=windowed(state,now,84),four=windowed(state,now,28),previous=windowed(state,now,28,28);const patterns:BehaviorPattern[]=[];
  const start=twelve.length?[...twelve].sort((a,b)=>a.endedAt.localeCompare(b.endedAt))[0].endedAt:now.toISOString();
  const byTime=Map.groupBy(twelve,a=>segment(activityStart(a)));const timeRows=[...byTime].map(([name,items])=>({name,items,rate:rate(items,now)})).sort((a,b)=>b.rate-a.rate);
  if(timeRows.length){const best=timeRows[0],baseline=rate(twelve,now);patterns.push(pattern({id:`best_time:${best.name}`,patternType:"best_time",timeRange:best.name,observationStart:start,observationEnd:now.toISOString(),sampleSize:best.items.length,metricName:"completion_rate",metricValue:pct(best.rate),baselineValue:pct(baseline),summary:`${best.name} oturumlarında tamamlanma oranın %${pct(best.rate)}.`,recommendation:`Yüksek eforlu görevleri mümkün oldukça ${best.name.toLocaleLowerCase("tr-TR")} zamanına yerleştirmeyi dene.`},now));}
  const byLength=Map.groupBy(twelve,a=>lengthBucket(a.plannedMinutes??taskFor(state,a)?.minutes??a.minutes));const lengthRows=[...byLength].map(([name,items])=>({name,items,rate:rate(items,now),median:median(items.map(a=>a.minutes))})).sort((a,b)=>b.rate-a.rate);
  if(lengthRows.length){const best=lengthRows[0];patterns.push(pattern({id:`session_length:${best.name}`,patternType:"session_length",observationStart:start,observationEnd:now.toISOString(),sampleSize:best.items.length,metricName:"completion_rate",metricValue:pct(best.rate),baselineValue:pct(rate(twelve,now)),summary:`${best.name} bloklarında tamamlanma oranın %${pct(best.rate)}.`,recommendation:`Yeni bloklarda yaklaşık ${Math.max(10,best.median)} dakikayı başlangıç noktası olarak dene.`},now));}
  for(const area of state.areas){const items=twelve.filter(a=>a.areaId===area.id);if(!items.length)continue;const rows=[...Map.groupBy(items,a=>segment(activityStart(a)))].map(([name,list])=>({name,list,rate:rate(list,now)})).sort((a,b)=>b.rate-a.rate);if(rows[0])patterns.push(pattern({id:`area_preference:${area.id}:${rows[0].name}`,patternType:"area_preference",areaId:area.id,timeRange:rows[0].name,observationStart:start,observationEnd:now.toISOString(),sampleSize:rows[0].list.length,metricName:"completion_rate",metricValue:pct(rows[0].rate),baselineValue:pct(rate(items,now)),summary:`${area.name} için en iyi görünen zaman ${rows[0].name.toLocaleLowerCase("tr-TR")} (%${pct(rows[0].rate)}).`,recommendation:`${area.name} bloklarını bir hafta boyunca ${rows[0].name.toLocaleLowerCase("tr-TR")} dene.`},now));}
  const postponed=state.tasks.filter(t=>(t.rescheduledCount??0)>0);if(postponed.length)patterns.push(pattern({id:"procrastination:rescheduled",patternType:"procrastination",observationStart:start,observationEnd:now.toISOString(),sampleSize:postponed.length,metricName:"average_reschedules",metricValue:Number((postponed.reduce((n,t)=>n+(t.rescheduledCount??0),0)/postponed.length).toFixed(1)),summary:`${postponed.length} görev en az bir kez yeniden planlandı.`,recommendation:"Tekrar ertelenen uzun görevleri küçült veya daha güçlü odak saatine taşı."},now));
  const estimates=twelve.filter(a=>(a.plannedMinutes??taskFor(state,a)?.minutes??0)>0);if(estimates.length){const planned=estimates.reduce((n,a)=>n+(a.plannedMinutes??taskFor(state,a)?.minutes??0),0),actual=estimates.reduce((n,a)=>n+a.minutes,0),error=planned?Math.round((actual-planned)/planned*100):0;patterns.push(pattern({id:"duration_estimation:all",patternType:"duration_estimation",observationStart:start,observationEnd:now.toISOString(),sampleSize:estimates.length,metricName:"estimate_error_percent",metricValue:error,baselineValue:0,summary:`Gerçek sürelerin planından ortalama %${Math.abs(error)} ${error>0?"uzun":"kısa"}.`,recommendation:Math.abs(error)<10?"Süre tahminlerin dengeli; mevcut yaklaşımı koru.":`Yeni sürelerde yaklaşık %${Math.abs(error)} ${error>0?"tampon eklemeyi":"azaltmayı"} dene.`},now));}
  const weeks=Map.groupBy(twelve,a=>{const d=new Date(a.endedAt);d.setHours(12,0,0,0);d.setDate(d.getDate()-((d.getDay()+6)%7));return d.toISOString().slice(0,10);});const sustainable=median([...weeks.values()].map(items=>items.reduce((n,a)=>n+a.minutes,0)));
  if(weeks.size)patterns.push(pattern({id:"capacity:weekly",patternType:"capacity",observationStart:start,observationEnd:now.toISOString(),sampleSize:weeks.size,metricName:"sustainable_weekly_minutes",metricValue:sustainable,baselineValue:state.weeklyHours*60,summary:`Kayıtlı etkin haftalarda ortanca gerçek odak ${Math.round(sustainable/6)/10} saat.`,recommendation:sustainable?`Gelecek haftayı yaklaşık ${Math.round(sustainable/6)/10} saatlik başlangıç kapasitesiyle karşılaştır.`:"Kapasite için daha fazla hafta verisi gerekli."},now));
  const visible=patterns.filter(p=>!state.intelligence?.dismissedPatternIds.includes(p.id)&&!state.intelligence?.incorrectPatternIds.includes(p.id)).sort((a,b)=>b.sampleSize-a.sampleSize);
  const bestTime=timeRows[0],bestLength=lengthRows[0],accuracy=summaryWindow(twelve,state).planningAccuracy;
  const metrics:IntelligenceMetric[]=[{label:"En güçlü odak zamanı",value:bestTime&&bestTime.items.length>=3?bestTime.name:"Veri birikiyor",detail:bestTime?`${bestTime.items.length} oturum`:"En az 3 oturum gerekli"},{label:"En uygun blok",value:bestLength&&bestLength.items.length>=3?bestLength.name:"Veri birikiyor",detail:bestLength?`${bestLength.items.length} oturum`:"En az 3 oturum gerekli"},{label:"Sürdürülebilir hafta",value:weeks.size>=3?`${Math.round(sustainable/6)/10} saat`:"Veri birikiyor",detail:`${weeks.size} etkin hafta`},{label:"Planlama doğruluğu",value:estimates.length>=3?`%${accuracy}`:"Veri birikiyor",detail:`${estimates.length} süre karşılaştırması`}];
  return {generatedAt:now.toISOString(),observationStart:start,observationEnd:now.toISOString(),sampleSize:twelve.length,patterns,visiblePatterns:visible,metrics,fourWeek:summaryWindow(four,state),twelveWeek:summaryWindow(twelve,state),previousFourWeek:summaryWindow(previous,state),sustainableWeeklyMinutes:sustainable,summary:twelve.length<3?"North henüz güçlü bir sonuç çıkarmıyor. Her gerçek oturum, sürdürülebilir ritmini biraz daha görünür kılacak.":`${twelve.length} oturumdan oluşan son 12 haftalık kanıta göre ${bestTime?.name.toLocaleLowerCase("tr-TR")} ve ${bestLength?.name} blokları şu an en güçlü adaylar.`};
}
export function refreshIntelligence(state:NorthState,at=new Date()):NorthState {const report=analyzeNorth(state,at),current=state.intelligence;const patterns=report.patterns.map(p=>({...p,createdAt:current?.patterns.find(old=>old.id===p.id)?.createdAt??p.createdAt}));const intelligence:NorthIntelligenceState={patterns,dismissedPatternIds:current?.dismissedPatternIds??[],incorrectPatternIds:current?.incorrectPatternIds??[],experiments:current?.experiments??[],lockedSchedule:current?.lockedSchedule??{},lockedDurations:current?.lockedDurations??{},learningStartedAt:current?.learningStartedAt,updatedAt:report.generatedAt};return {...state,intelligence};}
export function recommendedSessionMinutes(state:NorthState,areaId?:string){const locked=(areaId?state.intelligence?.lockedDurations[areaId]:undefined)??state.intelligence?.lockedDurations["*"];if(locked)return locked;const report=analyzeNorth(state),item=report.patterns.find(p=>p.patternType==="session_length"&&p.sampleSize>=3);if(!item)return 50;const match=item.recommendation.match(/yaklaşık (\d+)/);return match?Number(match[1]):50;}
export function plannerIntelligenceContext(state:NorthState){const report=analyzeNorth(state);return {observationCount:report.sampleSize,summary:report.summary,metrics:report.metrics,reliablePatterns:report.visiblePatterns.filter(p=>p.status==="reliable"||p.status==="strong").map(p=>({type:p.patternType,areaId:p.areaId,timeRange:p.timeRange,sampleSize:p.sampleSize,metric:p.metricName,value:p.metricValue,confidence:p.confidence,recommendation:p.recommendation})),rolling4Weeks:report.fourWeek,rolling12Weeks:report.twelveWeek,sustainableWeeklyMinutes:report.sustainableWeeklyMinutes,userLocks:state.intelligence?{schedule:state.intelligence.lockedSchedule,durations:state.intelligence.lockedDurations}:{schedule:{},durations:{}}};}
