import type { WorkspaceState } from "./types";

export type AreaKind = "math" | "cyber" | "reading" | "chess" | "projects" | "custom";
export type NorthTaskStatus = "pending" | "done" | "partial" | "skipped" | "cancelled";
export type SupportSource = "ai" | "documentation" | "video" | "course" | "friend" | "forum" | "walkthrough" | "none" | "other";
export interface Area {
  id: string; name: string; kind: AreaKind; icon: string; goal: string; priority: number;
  weeklyMinutes: number; minimumMinutes: number; archived: boolean; metric: string;
  target: number; notes: string; resources: string;
  description?: string; preferredSessionMinutes?: number; accent?: string;
  status?: "active" | "paused" | "archived";
}
export interface NorthTask {
  id: string; areaId: string; title: string; goal: string; minutes: number;
  intensity: "low" | "normal" | "high"; mandatory: boolean; status: NorthTaskStatus;
  date: string; deadline: string; resource: string; why: string; week: string;
  taskType?: "deep_work" | "practice" | "problem_solving" | "lab" | "review" | "reading" | "creative" | "administrative" | "light";
  difficulty?: "easy" | "medium" | "hard";
  plannedStart?: string;
  completedAt?: string;
  rescheduledCount?: number;
}
export interface NorthActivity {
  id: string; taskId: string; areaId: string; date: string; minutes: number;
  outcome: "done" | "partial" | "skipped"; difficulty: string; reflection: string;
  amount: number; metric: string; endedAt: string;
  plannedMinutes?: number; actualStart?: string; plannedStart?: string;
  energy?: "low" | "normal" | "high"; pauseCount?: number; earlyExit?: boolean;
  completionPercent?: number; taskType?: NorthTask["taskType"];
  supportSources?: SupportSource[];
}
export interface NorthDailyAdaptation {
  date: string; taskId?: string; originalMinutes?: number; recommendedMinutes?: number;
  message: string;
}
export interface NorthEvent { id: string; areaId: string; title: string; date: string; time: string; kind: "exam" | "deadline" | "block"; minutes: number }
export interface NorthState {
  records?: AreaRecord[];
  version: 1; areas: Area[]; tasks: NorthTask[]; activities: NorthActivity[]; events: NorthEvent[];
  energy: { date: string; level: "low" | "normal" | "high" };
  weeklyHours: number; mode: string; customMode: string;
  protection: { areaId: string; date: string; kind: "rest" | "freeze" }[];
  intelligence?: NorthIntelligenceState;
  dailyAdaptation?: NorthDailyAdaptation;
}
export type PatternStatus = "insufficient" | "emerging" | "reliable" | "strong";
export type PatternConfidence = "low" | "medium" | "high";
export interface BehaviorPattern {
  id:string; patternType:"best_time"|"session_length"|"procrastination"|"capacity"|"duration_estimation"|"area_preference"|"energy_response";
  areaId?:string; taskType?:NorthTask["taskType"]; timeRange?:string; observationStart:string; observationEnd:string;
  sampleSize:number; metricName:string; metricValue:number; baselineValue?:number; confidence:PatternConfidence; status:PatternStatus;
  summary:string; recommendation:string; createdAt:string; updatedAt:string;
}
export interface NorthExperiment { id:string; patternId:string; startedAt:string; endsAt:string; status:"active"|"completed"|"cancelled"; baselineValue:number; baselineSampleSize:number; summary:string; }
export interface NorthIntelligenceState {
  patterns:BehaviorPattern[]; dismissedPatternIds:string[]; incorrectPatternIds:string[]; experiments:NorthExperiment[];
  lockedSchedule:Record<string,string>; lockedDurations:Record<string,number>; learningStartedAt?:string; updatedAt:string;
}
export interface AreaRecord { id:string;areaId:string;module:string;title:string;values:Record<string,string>;notes:string }
export const areaModules: Record<AreaKind, {name:string;fields:{key:string;label:string;type:"text"|"number"|"date"}[]}[]> = {
  math:[{name:"Dersler",fields:[{key:"exam",label:"Sınav tarihi",type:"date"}]},{name:"Konular",fields:[{key:"solved",label:"Çözülen problem",type:"number"},{key:"correct",label:"Doğru çözüm",type:"number"},{key:"revision",label:"Tekrar tarihi",type:"date"}]}],
  reading:[{name:"Kitaplar",fields:[{key:"pages",label:"Okunan sayfa",type:"number"},{key:"total",label:"Toplam sayfa",type:"number"}]}],
  chess:[{name:"Oyunlar",fields:[{key:"opening",label:"Açılış",type:"text"},{key:"rating",label:"Oyun sonrası puan",type:"number"},{key:"blunders",label:"Büyük hata sayısı",type:"number"},{key:"result",label:"Sonuç (galibiyet / beraberlik / yenilgi)",type:"text"}]},{name:"Taktikler",fields:[{key:"attempts",label:"Deneme",type:"number"},{key:"correct",label:"Doğru",type:"number"}]}],
  projects:[{name:"Çıktılar",fields:[{key:"deadline",label:"Son tarih",type:"date"},{key:"link",label:"Kanıt bağlantısı",type:"text"}]}],
  cyber:[],custom:[{name:"Çalışmalar",fields:[{key:"output",label:"Çıktı",type:"text"}]}],
};
export function dayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
}
export function shiftDay(day: string, count: number) { const d = new Date(day+"T12:00:00"); d.setDate(d.getDate()+count); return dayKey(d); }
export function weekKey(day = dayKey()) { const d = new Date(day+"T12:00:00"); return shiftDay(day, -((d.getDay()+6)%7)); }
export const kindLabels: Record<AreaKind, string> = { math: "Matematik", cyber: "Siber Güvenlik", reading: "Okuma", chess: "Satranç", projects: "Projeler", custom: "Özel alan" };
export const metricDefaults: Record<AreaKind, string> = { math: "Çözülen problem", cyber: "Tamamlanan lab", reading: "Okunan sayfa", chess: "Çözülen taktik", projects: "Tamamlanan çıktı", custom: "Tamamlanan çalışma" };
export const areaAccents = ["#9ebeb8", "#9aa9c7", "#b5a58a", "#a89bb8", "#9eae91", "#b39a9a"];
export function areaStatus(area: Area) { return area.archived || area.status === "archived" ? "archived" : area.status === "paused" ? "paused" : "active"; }
export function isAreaActive(area: Area) { return areaStatus(area) === "active"; }
export function createArea(kind: AreaKind, id: string): Area {
  return { id, kind, name: kindLabels[kind], icon: ({math:"∑",cyber:"⌘",reading:"▤",chess:"♞",projects:"◇",custom:"◎"})[kind], goal: "", priority: 2, weeklyMinutes: 0, minimumMinutes: 10, archived: false, metric: metricDefaults[kind], target: 0, notes: "", resources: "", description: "", preferredSessionMinutes: 50, accent: areaAccents[0], status: "active" };
}
export function initializeNorth(workspace: WorkspaceState): NorthState {
  const defaultAreas = (["math","cyber","reading","chess","projects"] as AreaKind[]).map(k => createArea(k,k));
  const primaryFocus = workspace.profile.primaryFocus.trim();
  const cyberGoal = /siber|güvenlik|pentest|soc|grc|cloud security/i.test(`${workspace.profile.track} ${primaryFocus}`);
  const primary = cyberGoal ? defaultAreas.find(a => a.id === "cyber")! : createArea("custom", "primary-goal");
  if (primaryFocus) primary.name = primaryFocus;
  primary.goal = workspace.profile.goal;
  primary.weeklyMinutes = workspace.profile.weeklyCapacityHours * 60;
  const areas = cyberGoal || !primaryFocus ? defaultAreas : [primary, ...defaultAreas.filter(area => area.id !== "cyber")];
  return { version: 1, areas, weeklyHours: workspace.profile.weeklyCapacityHours, mode: "normal", customMode: "", energy: { date: "", level: "normal" }, events: [], protection: [],
    tasks: workspace.tasks.map(t => ({ id:t.id, areaId:primary.id, title:t.title, goal:t.outputRequirement || t.description, minutes:t.duration, intensity:t.difficulty === "hard" ? "high" : "normal", mandatory:t.isDailyMission, status:t.status === "completed" ? "done" : t.status === "partial" ? "partial" : t.status === "failed" ? "skipped" : "pending", date:"", deadline:"", resource: workspace.resources.find(r => r.id === t.practicalResourceId)?.url ?? "", why:"Kişisel başlangıç planından aktarıldı.", week:weekKey() })),
    activities: workspace.focusSessions.map(s => ({id:s.id, taskId:s.taskId,areaId:primary.id,date:dayKey(new Date(s.completedAt)),minutes:s.durationMinutes,outcome:s.status === "completed" ? "done" : "partial",difficulty:"",reflection:s.notes,amount:0,metric:primary.metric,endedAt:s.completedAt})),
  };
}
export function capacity(state: NorthState) { return Math.round(state.weeklyHours*60*(state.mode === "exam" ? .7 : 1)); }
export function allocation(state: NorthState, area: Area) {
  if (!isAreaActive(area)) return 0;
  const active = state.areas.filter(isAreaActive);
  const total = active.reduce((s,a)=>s+a.weeklyMinutes,0);
  return Math.round(area.weeklyMinutes*(total > capacity(state) ? capacity(state)/total : 1));
}
export function dailySelection(state: NorthState, today=dayKey()) {
  const energy = state.energy.date === today ? state.energy.level : "normal";
  const week = weekKey(today);
  const candidates = state.tasks.filter(t => ["pending","partial"].includes(t.status) && state.areas.some(a=>a.id===t.areaId&&isAreaActive(a)&&a.goal.trim()) && (!t.date ? t.week === week : t.date === today));
  const score = (t: NorthTask) => {
    const a=state.areas.find(a=>a.id===t.areaId)!;
    const spent=state.activities.filter(s=>s.areaId===a.id&&s.date>=week&&s.date<=today).reduce((n,s)=>n+s.minutes,0);
    const hour=new Date().getHours();const currentRange=hour<6?"Gece":hour<9?"Erken sabah":hour<12?"Sabah":hour<18?"Öğleden sonra":hour<22?"Akşam":"Geç gece";
    const learned=state.intelligence?.patterns.filter(p=>(p.status==="reliable"||p.status==="strong")&&!state.intelligence?.dismissedPatternIds.includes(p.id)&&!state.intelligence?.incorrectPatternIds.includes(p.id))??[];
    const timeFit=learned.some(p=>(p.patternType==="best_time"||p.patternType==="area_preference")&&p.timeRange===currentRange&&(!p.areaId||p.areaId===t.areaId))?18:0;
    return (t.mandatory?100:0)+(t.deadline && t.deadline<=shiftDay(today,2)?80:0)+a.priority*10+(spent<allocation(state,a)?20:0)+(t.intensity===energy?15:0)-(energy==="low"&&t.intensity==="high"?35:0)+timeFit;
  };
  const ranked=[...candidates].sort((a,b)=>score(b)-score(a));
  const touched=new Set(state.activities.filter(a=>a.date===today).map(a=>a.taskId));
  const usedDeep=state.tasks.filter(t=>touched.has(t.id)&&t.minutes>20).length;
  const usedLight=state.tasks.filter(t=>touched.has(t.id)&&t.minutes<=20).length;
  const deep=ranked.filter(t=>t.minutes>20&&!touched.has(t.id)).slice(0,Math.max(0,2-usedDeep));
  const light=ranked.filter(t=>t.minutes<=20&&!touched.has(t.id)).slice(0,Math.max(0,2-usedLight));
  const spent=state.activities.filter(a=>a.date>=week&&a.date<=today).reduce((n,a)=>n+a.minutes,0);
  let remaining=Math.max(0,capacity(state)-spent);
  return [...deep,...light].slice(0,4).filter(t=>{
    if(state.protection.some(p=>p.areaId===t.areaId&&p.date===today)||t.minutes>remaining)return false;
    remaining-=t.minutes;return true;
  });
}
export function suggestDailyAdaptation(state: NorthState, activity: NorthActivity): NorthDailyAdaptation | undefined {
  if (activity.outcome === "done" && activity.difficulty !== "Zor") return undefined;
  const next = dailySelection({ ...state, activities: [...state.activities, activity], tasks: state.tasks.map(task => task.id === activity.taskId ? { ...task, status: activity.outcome } : task) }, activity.date)[0];
  if (!next) return { date: activity.date, message: "Bugünün kalanında yeni zorunlu görev eklemedim. İstersen planını burada bırakabilirsin." };
  const shouldReduce = activity.outcome !== "done" || activity.difficulty === "Zor";
  if (!shouldReduce || next.minutes <= 25) return { date: activity.date, taskId: next.id, message: "Geri bildirimin kaydedildi. Sıradaki görev aynı kaldı; başlamadan önce süresini değiştirebilirsin." };
  const recommendedMinutes = Math.max(25, Math.min(next.minutes - 10, 35));
  return {
    date: activity.date,
    taskId: next.id,
    originalMinutes: next.minutes,
    recommendedMinutes,
    message: `Bu oturum zorlayıcı geçti. Sıradaki yoğun görevi ${next.minutes} dakikadan ${recommendedMinutes} dakikaya indirmeyi öneriyorum.`,
  };
}
export function areaStreak(state: NorthState, area: Area, today=dayKey()) {
  let cursor=today, streak=0;
  const qualifies=(d:string)=>state.activities.filter(s=>s.areaId===area.id&&s.date===d&&s.outcome!=="skipped").reduce((n,s)=>n+s.minutes,0)>=area.minimumMinutes;
  if(!qualifies(cursor)&&!state.protection.some(p=>p.areaId===area.id&&p.date===cursor))cursor=shiftDay(cursor,-1);
  for(let i=0;i<366;i++,cursor=shiftDay(cursor,-1)) {
    if(qualifies(cursor))streak++;
    else if(!state.protection.some(p=>p.areaId===area.id&&p.date===cursor))break;
  }
  return streak;
}
export function weeklyConsistency(state: NorthState, area: Area, today=dayKey()) {
  const start=weekKey(today); let eligible=0, active=0;
  for(let d=start;d<=today;d=shiftDay(d,1)) {
    if(state.protection.some(p=>p.areaId===area.id&&p.date===d))continue;
    eligible++; if(state.activities.filter(s=>s.areaId===area.id&&s.date===d&&s.outcome!=="skipped").reduce((n,s)=>n+s.minutes,0)>=area.minimumMinutes)active++;
  }
  return eligible ? Math.round(active/eligible*100) : 0;
}
export function missedAdvice(task: NorthTask) {
  if(!task.mandatory&&!task.deadline)return {action:"cancel" as const,label:"Bu hafta bırak",why:"İsteğe bağlı bir görev; yeni bir borca dönüşmek zorunda değil."};
  if(task.minutes>50)return {action:"reduce" as const,label:"Küçült ve havuza al",why:"Daha küçük bir oturumla yeniden başlamak kolaylaşabilir."};
  return {action:"pool" as const,label:"Haftalık havuza al",why:"Önemli görev korunur; uygun günü sen seçersin."};
}
