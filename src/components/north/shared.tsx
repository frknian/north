"use client";
import Link from "next/link";
import { useWorkspace } from "@/components/features/workspace-provider";
import { initializeNorth, type NorthTask } from "@/lib/north";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, Play } from "lucide-react";
export function useNorth() {
  const workspace=useWorkspace();
  return { state:workspace.north ?? initializeNorth(workspace), update:workspace.updateNorth, ready:workspace.ready, workspace };
}
export function Heading({title,description,children}:{title:string;description:string;children?:React.ReactNode}) {
  return <header className="north-page-header"><div><h1>{title}</h1><p>{description}</p></div>{children}</header>;
}
export function TaskRow({task,primary=false}:{task:NorthTask;primary?:boolean}) {
  const {state}=useNorth();const area=state.areas.find(a=>a.id===task.areaId);
  return <article className={primary?"north-focus-card":"north-task-row"}><div className="north-task-copy"><p className="north-task-meta"><span>{area?.icon} {area?.name}</span><span>{task.minutes} dk</span>{task.mandatory&&<span>Öncelikli</span>}</p><h2>{task.title}</h2><p className="north-task-goal">{task.goal}</p></div><div className="north-task-actions"><Button asChild variant={primary?"default":"ghost"}><Link href={`/focus/${task.id}`}>{primary?<><Play size={15}/>Odaklanmaya başla</>:<>Odaklan<ArrowUpRight size={15}/></>}</Link></Button>{task.why&&<details className="text-xs text-muted-foreground"><summary className="cursor-pointer">Neden bu görev?</summary><p className="mt-2 max-w-lg leading-6">{task.why}</p></details>}</div></article>;
}
export const fieldClass="north-field";
export function Field({label,children}:{label:string;children:React.ReactNode}) {return <label className="block space-y-1.5 text-sm"><span className="text-muted-foreground">{label}</span>{children}</label>;}
