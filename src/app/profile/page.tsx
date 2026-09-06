"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { BookOpenText, Bot, CircleHelp, Languages, LogOut, Plus, ShieldCheck, Target, UserRound } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { UserGuide } from "@/components/features/user-guide";
import { useWorkspace } from "@/components/features/workspace-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { getFirebase } from "@/lib/firebase/client";
import type { UniversityMode } from "@/lib/types";

export default function ProfilePage() {
  const router = useRouter();
  const workspace = useWorkspace();
  const [note, setNote] = useState({ title: "", category: "Genel", content: "" });
  const [vocab, setVocab] = useState({ term: "", meaning: "", example: "" });

  function saveNote() {
    if (!note.title.trim()) return;
    workspace.addNote({ id: crypto.randomUUID(), ...note, updatedAt: new Date().toISOString() });
    setNote({ title: "", category: "Genel", content: "" });
    toast.success("Not kaydedildi.");
  }

  function saveVocabulary() {
    if (!vocab.term.trim() || !vocab.meaning.trim()) return;
    workspace.addVocabulary({ id: crypto.randomUUID(), ...vocab });
    setVocab({ term: "", meaning: "", example: "" });
    toast.success("Terim kaydedildi.");
  }

  async function signOutUser() {
    const firebase = getFirebase();
    if (firebase) await signOut(firebase.auth);
    router.push("/login");
    router.refresh();
  }

  return <>
    <PageHeader eyebrow="Sistem ayarları" title="Profil ve çalışma kütüphanesi" description="Hedefini, çalışma kapasiteni ve kişisel bilgi arşivini yönet." />
    <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
      <Tabs defaultValue="profile">
        <TabsList className="mb-5 grid h-auto w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="profile"><UserRound />Profil</TabsTrigger>
          <TabsTrigger value="notes"><BookOpenText />Notlar</TabsTrigger>
          <TabsTrigger value="terms"><Languages />Terimler</TabsTrigger>
          <TabsTrigger value="guide"><CircleHelp />Kılavuz</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <div className="grid gap-5 lg:grid-cols-[1fr_.8fr]">
            <Card>
              <CardHeader><CardTitle>Hedef ve çalışma düzeni</CardTitle><CardDescription>Buradaki değişiklikler ana alanına ve North planına yansır.</CardDescription></CardHeader>
              <CardContent className="space-y-5">
                <Field label="Adın"><Input value={workspace.profile.fullName} onChange={(event) => workspace.updateProfile({ fullName: event.target.value })} /></Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Hedef kategorisi"><Input value={workspace.profile.track} onChange={(event) => workspace.updateProfile({ track: event.target.value })} placeholder="Kariyer, eğitim, sağlık…" /></Field>
                  <Field label="Ana odak"><Input value={workspace.profile.primaryFocus} onChange={(event) => workspace.updateProfile({ primaryFocus: event.target.value })} placeholder="Neyi geliştirmek istiyorsun?" /></Field>
                </div>
                <Field label="90 günlük hedef"><Textarea value={workspace.profile.goal} onChange={(event) => workspace.updateProfile({ goal: event.target.value })} placeholder="90 günün sonunda hangi ölçülebilir sonuca ulaşmak istiyorsun?" /></Field>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Hafta yoğunluğu">
                    <Select value={workspace.profile.universityMode} onValueChange={(value) => workspace.updateProfile({ universityMode: value as UniversityMode })}>
                      <SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="exam">Hafif</SelectItem><SelectItem value="normal">Dengeli</SelectItem><SelectItem value="free">Yoğun</SelectItem></SelectContent>
                    </Select>
                  </Field>
                  <Field label="Oturum süresi">
                    <Select value={String(workspace.profile.preferredSessionMinutes)} onValueChange={(value) => workspace.updateProfile({ preferredSessionMinutes: Number(value) as 45 | 50 | 60 })}>
                      <SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="45">45 dakika</SelectItem><SelectItem value="50">50 dakika</SelectItem><SelectItem value="60">60 dakika</SelectItem></SelectContent>
                    </Select>
                  </Field>
                  <Field label="Haftalık kapasite"><Input type="number" min={1} max={60} value={workspace.profile.weeklyCapacityHours} onChange={(event) => workspace.updateProfile({ weeklyCapacityHours: Math.max(1, Number(event.target.value)) })} /></Field>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-5">
              <Card>
                <CardHeader><div className="flex items-center gap-3"><Image src="/north-mark.png" alt="" width={36} height={36} className="rounded-lg bg-white p-1" /><div><CardTitle>Yön özeti</CardTitle><CardDescription>North’un planlama sırasında kullandığı bağlam.</CardDescription></div></div></CardHeader>
                <CardContent className="space-y-4">
                  <Direction label="Kategori" value={workspace.profile.track || "Belirtilmedi"} />
                  <Direction label="Ana odak" value={workspace.profile.primaryFocus || "Belirtilmedi"} />
                  <Direction label="Sonraki odak" value={workspace.profile.secondaryFocus || "Henüz yok"} />
                  <Direction label="Uzun vade" value={workspace.profile.futureFocus || "Henüz yok"} />
                  <Button className="w-full" asChild><Link href="/north-ai"><Bot />North ile planla</Link></Button>
                  <Button variant="outline" className="w-full" asChild><Link href="/areas"><Target />Hedef alanlarını aç</Link></Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Hesap ve veriler</CardTitle><CardDescription>Yedekleme, gizlilik ve hesap silme kontrolleri.</CardDescription></CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full" asChild><Link href="/data"><ShieldCheck />Verilerim ve güvenlik</Link></Button>
                  <Button variant="ghost" className="w-full" onClick={() => void signOutUser()}><LogOut />Çıkış yap</Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="notes">
          <div className="grid gap-5 lg:grid-cols-[1fr_.8fr]">
            <Card>
              <CardHeader><CardTitle>Yeni not</CardTitle><CardDescription>Öğrendiklerini, fikirlerini ve tekrar etmek istediklerini sakla.</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <Field label="Başlık"><Input value={note.title} onChange={(event) => setNote({ ...note, title: event.target.value })} placeholder="Önemli çıkarım" /></Field>
                <Field label="Kategori"><Input value={note.category} onChange={(event) => setNote({ ...note, category: event.target.value })} placeholder="Genel" /></Field>
                <Field label="İçerik"><Textarea className="min-h-64" value={note.content} onChange={(event) => setNote({ ...note, content: event.target.value })} placeholder="Kendi cümlelerinle yaz…" /></Field>
                <Button onClick={saveNote} disabled={!note.title.trim()}><Plus />Notu kaydet</Button>
              </CardContent>
            </Card>
            <div className="space-y-3">{workspace.notes.length ? workspace.notes.map((item) => <Card key={item.id}><CardHeader><div className="flex items-center justify-between gap-3"><CardTitle>{item.title}</CardTitle><Badge variant="outline">{item.category}</Badge></div></CardHeader><CardContent><p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{item.content}</p></CardContent></Card>) : <Empty text="Henüz not yok" />}</div>
          </div>
        </TabsContent>

        <TabsContent value="terms">
          <div className="grid gap-5 lg:grid-cols-[.8fr_1fr]">
            <Card>
              <CardHeader><CardTitle>Kişisel terim sözlüğü</CardTitle><CardDescription>Hedefinle ilgili yeni kavramları kendi açıklaman ve örneğinle kaydet.</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <Field label="Terim"><Input value={vocab.term} onChange={(event) => setVocab({ ...vocab, term: event.target.value })} /></Field>
                <Field label="Anlamı"><Input value={vocab.meaning} onChange={(event) => setVocab({ ...vocab, meaning: event.target.value })} /></Field>
                <Field label="Örnek"><Textarea value={vocab.example} onChange={(event) => setVocab({ ...vocab, example: event.target.value })} /></Field>
                <Button onClick={saveVocabulary} disabled={!vocab.term.trim() || !vocab.meaning.trim()}><Plus />Terimi kaydet</Button>
              </CardContent>
            </Card>
            <div className="space-y-3">{workspace.vocabulary.length ? workspace.vocabulary.map((item) => <Card key={item.id}><CardContent className="pt-5"><div className="flex items-center gap-2"><Languages className="size-4 text-primary" /><p className="font-medium">{item.term}</p></div><p className="mt-2 text-sm">{item.meaning}</p><p className="mt-2 border-l-2 border-primary/30 pl-3 text-xs italic leading-5 text-muted-foreground">{item.example}</p></CardContent></Card>) : <Empty text="Henüz terim yok" />}</div>
          </div>
        </TabsContent>

        <TabsContent value="guide"><UserGuide /></TabsContent>
      </Tabs>
    </div>
  </>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}

function Direction({ label, value }: { label: string; value: string }) {
  return <div className="flex items-start justify-between gap-4 border-b pb-3 last:border-0"><span className="text-xs text-muted-foreground">{label}</span><span className="text-right text-sm font-medium">{value}</span></div>;
}

function Empty({ text }: { text: string }) {
  return <Card className="border-dashed"><CardContent className="flex flex-col items-center py-10 text-center"><BookOpenText className="mb-3 size-6 text-muted-foreground" /><p className="text-sm font-medium">{text}</p></CardContent></Card>;
}
