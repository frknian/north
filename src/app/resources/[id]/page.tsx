"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ExternalLink, LockKeyhole } from "lucide-react";
import { useWorkspace } from "@/components/features/workspace-provider";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ResourceDetailPage() {
  const { id } = useParams<{ id: string }>(); const workspace = useWorkspace(); const resource = workspace.resources.find((item) => item.id === id);
  if (!resource) return <div className="mx-auto max-w-3xl p-8"><Card><CardContent className="py-10 text-center"><p className="font-medium">Kaynak bulunamadı.</p><Button asChild className="mt-4"><Link href="/resources">Kütüphaneye dön</Link></Button></CardContent></Card></div>;
  const relatedTasks = workspace.tasks.filter((task) => [task.theoryResourceId, task.practicalResourceId, task.optionalReferenceId].includes(resource.id));
  const isLocked = Object.values(workspace.sourceLocks ?? {}).includes(resource.id);

  function handleRate(rating: "very_useful" | "useful" | "neutral" | "not_useful") {
    workspace.rateResource(resource!.id, "", rating);
    if (rating === "not_useful") {
      workspace.addFeedbackMemory({
        id: crypto.randomUUID(),
        category: "resource",
        signal: `"${resource!.title}" işime yaramadı`,
        rule: `"${resource!.title}" veya benzer kaynakları planlarda önerme`,
        enabled: true,
        createdAt: new Date().toISOString(),
      });
    }
  }

  return <><PageHeader eyebrow={`${resource.category} / ${resource.subcategory}`} title={resource.title} description={resource.description} action={<Button asChild onClick={() => workspace.recordResourceUse(resource.id, "resource-detail")}><a href={resource.url} target="_blank" rel="noreferrer">Kaynağı aç <ExternalLink /></a></Button>} /><div className="mx-auto max-w-5xl space-y-5 p-4 sm:p-6 lg:p-8"><Button asChild variant="ghost" size="sm"><Link href="/resources"><ArrowLeft /> Kütüphaneye dön</Link></Button><div className="grid gap-5 lg:grid-cols-[1fr_320px]"><Card><CardHeader><CardTitle>Kaynak bilgileri</CardTitle><CardDescription>Görev planlama sırasında AI yalnızca bu doğrulanmış metadata’yı kullanır.</CardDescription></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2"><Info label="Sağlayıcı" value={resource.provider} /><Info label="Tür" value={resource.resourceType} /><Info label="Zorluk" value={resource.difficulty} /><Info label="Süre" value={resource.estimatedTime} /><Info label="Dil" value={resource.language} /><Info label="Erişim" value={resource.isFree ? "Ücretsiz" : "Ücretli"} /><div className="sm:col-span-2"><p className="text-xs text-muted-foreground">İlgili beceriler</p><div className="mt-2 flex flex-wrap gap-2">{resource.recommendedForSkills.map((skill) => <Badge key={skill} variant="secondary">{skill}</Badge>)}</div></div><div className="sm:col-span-2"><p className="text-xs text-muted-foreground">Etiketler</p><div className="mt-2 flex flex-wrap gap-2">{resource.tags.map((tag) => <Badge key={tag} variant="outline">{tag}</Badge>)}</div></div></CardContent></Card><div className="space-y-5"><Card><CardHeader><CardTitle className="text-base">Kullanım kanıtı &amp; Değerlendirme</CardTitle></CardHeader><CardContent className="space-y-3"><Info label="Açılma sayısı" value={String(resource.usageCount)} /><Info label="Tamamlanan görev" value={String(resource.completedTaskCount)} /><div><p className="text-xs text-muted-foreground">Değerlendirmen</p><div className="mt-2 flex flex-wrap gap-1.5"><Button size="xs" variant={resource.rating === "very_useful" ? "default" : "outline"} onClick={() => handleRate("very_useful")}>Çok faydalı</Button><Button size="xs" variant={resource.rating === "useful" ? "default" : "outline"} onClick={() => handleRate("useful")}>Faydalı</Button><Button size="xs" variant={resource.rating === "neutral" ? "default" : "outline"} onClick={() => handleRate("neutral")}>Nötr</Button><Button size="xs" variant={resource.rating === "not_useful" ? "destructive" : "outline"} onClick={() => handleRate("not_useful")}>İşime yaramadı</Button></div>{resource.rating === "not_useful" && <p className="mt-1.5 text-[11px] text-amber-500">Planorth Koç bu kaynağı gelecekteki planlarında önermemek üzere hafızaya aldı.</p>}</div>{isLocked ? <p className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs"><LockKeyhole className="size-4 text-primary" /> Bu kaynak aktif bir ana kaynak kilidi.</p> : null}</CardContent></Card><Card><CardHeader><CardTitle className="text-base">Ana kaynak kilidi</CardTitle><CardDescription>AI planlarında bu beceri için önce bu kaynak kullanılır.</CardDescription></CardHeader><CardContent className="space-y-2">{resource.recommendedForSkills.map((skill) => { const active = workspace.sourceLocks[skill] === resource.id; return <Button key={skill} variant={active ? "default" : "outline"} size="sm" className="w-full justify-start" onClick={() => workspace.setSourceLock(skill, resource.id)}><LockKeyhole />{active ? `${skill}: kilitli` : `${skill} için ana kaynak yap`}</Button>; })}</CardContent></Card><Card><CardHeader><CardTitle className="text-base">İlgili görevler</CardTitle></CardHeader><CardContent className="space-y-2">{relatedTasks.length ? relatedTasks.map((task) => <div key={task.id} className="rounded-lg border p-3"><p className="text-sm font-medium">{task.title}</p><p className="mt-1 text-xs text-muted-foreground">{task.status} · {task.duration} dk.</p></div>) : <p className="text-sm text-muted-foreground">Henüz bir göreve bağlanmadı.</p>}</CardContent></Card></div></div></div></>;
}

function Info({ label, value }: { label: string; value: string }) { return <div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-sm font-medium">{value}</p></div>; }
