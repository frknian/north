"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { NorthLogo } from "@/components/layout/north-logo";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import {
  BookOpenText,
  Bot,
  Brain,
  ChevronDown,
  ChevronUp,
  CircleHelp,
  History,
  Languages,
  LogOut,
  MessageSquare,
  Plus,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { UserGuide } from "@/components/features/user-guide";
import { ThemeToggle } from "@/components/layout/theme-toggle";
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
import { calculateAgeFromBirthDate, birthDateToAgeRange, type AgeRange, type FeedbackMemoryItem, type LearningPreferences, type LifeSituation, type UniversityMode } from "@/lib/types";

export default function ProfilePage() {
  const router = useRouter();
  const workspace = useWorkspace();
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== "undefined") {
      const tabParam = new URLSearchParams(window.location.search).get("tab");
      if (tabParam && ["profile", "memory", "notes", "terms", "guide"].includes(tabParam)) {
        return tabParam;
      }
    }
    return "profile";
  });
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [note, setNote] = useState({ title: "", category: "Genel", content: "" });
  const [vocab, setVocab] = useState({ term: "", meaning: "", example: "" });
  const [memoryDraft, setMemoryDraft] = useState<Partial<FeedbackMemoryItem>>({
    category: "schedule_time",
    signal: "",
    rule: "",
    enabled: true,
  });

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

  function saveMemory() {
    if (!memoryDraft.signal?.trim() || !memoryDraft.rule?.trim()) return;
    const item: FeedbackMemoryItem = {
      id: crypto.randomUUID(),
      category: memoryDraft.category ?? "other",
      signal: memoryDraft.signal.trim(),
      rule: memoryDraft.rule.trim(),
      enabled: true,
      createdAt: new Date().toISOString(),
    };
    workspace.addFeedbackMemory(item);
    setMemoryDraft({ category: "schedule_time", signal: "", rule: "", enabled: true });
    toast.success("Geri bildirim kuralı hafızaya eklendi.");
  }

  async function signOutUser() {
    const firebase = getFirebase();
    if (firebase) await signOut(firebase.auth);
    router.push("/login");
    router.refresh();
  }

  const prefs: LearningPreferences = workspace.profile.learningPreferences ?? {
    language: "both",
    cost: "free_only",
    format: ["reading", "interactive"],
    weeklyBudget: 0,
  };

  return <>
    <PageHeader eyebrow="Sistem ayarları" title="Profil ve koçluk tercihleri" description="Yaşam durumunu, öğrenme tercihlerini ve North AI hafızasını yönet." />
    <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-5 grid h-auto w-full grid-cols-2 sm:grid-cols-5">
          <TabsTrigger value="profile"><UserRound />Profil</TabsTrigger>
          <TabsTrigger value="memory"><Brain />AI Hafızası & Sohbet</TabsTrigger>
          <TabsTrigger value="notes"><BookOpenText />Notlar</TabsTrigger>
          <TabsTrigger value="terms"><Languages />Terimler</TabsTrigger>
          <TabsTrigger value="guide"><CircleHelp />Kılavuz</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <div className="grid gap-5 lg:grid-cols-[1fr_.8fr]">
            <Card>
              <CardHeader><CardTitle>Hedef ve çalışma düzeni</CardTitle><CardDescription>Yaş ve yaşam durumun yalnızca plan yoğunluğu ve dil tonu için kullanılır; ayrımcı karar üretilmez.</CardDescription></CardHeader>
              <CardContent className="space-y-5">
                <Field label="Adın"><Input value={workspace.profile.fullName} onChange={(event) => workspace.updateProfile({ fullName: event.target.value })} /></Field>
                
                {/* Birth Date & Life Situation */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Doğum Tarihi">
                    <div className="space-y-1">
                      <Input
                        type="date"
                        value={workspace.profile.birthDate ?? ""}
                        max={new Date().toISOString().split("T")[0]}
                        min="1940-01-01"
                        onChange={(event) => {
                          const bDate = event.target.value;
                          const computedRange = birthDateToAgeRange(bDate);
                          workspace.updateProfile({
                            birthDate: bDate,
                            ageRange: computedRange,
                          });
                        }}
                      />
                      <p className="text-[11px] text-muted-foreground">
                        {workspace.profile.birthDate
                          ? `${calculateAgeFromBirthDate(workspace.profile.birthDate)} yaşında · ${workspace.profile.ageRange ?? birthDateToAgeRange(workspace.profile.birthDate)} grubu`
                          : "Doğum tarihinizi giriniz"}
                      </p>
                    </div>
                  </Field>
                  <Field label="Yaşam durumu">
                    <Select value={workspace.profile.lifeSituation ?? "university"} onValueChange={(val) => workspace.updateProfile({ lifeSituation: val as LifeSituation })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high_school">Lise öğrencisi</SelectItem>
                        <SelectItem value="university">Üniversite öğrencisi</SelectItem>
                        <SelectItem value="working">Tam/Yarı zamanlı çalışan</SelectItem>
                        <SelectItem value="career_changer">Kariyer değiştiren</SelectItem>
                        <SelectItem value="other">Diğer</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Hedef kategorisi"><Input value={workspace.profile.track} onChange={(event) => workspace.updateProfile({ track: event.target.value })} placeholder="Kariyer, eğitim, sınav…" /></Field>
                  <Field label="Ana odak"><Input value={workspace.profile.primaryFocus} onChange={(event) => workspace.updateProfile({ primaryFocus: event.target.value })} placeholder="Neyi geliştirmek istiyorsun?" /></Field>
                </div>
                <Field label="Dönem / 90 günlük hedef"><Textarea value={workspace.profile.goal} onChange={(event) => workspace.updateProfile({ goal: event.target.value })} placeholder="Dönemin sonunda hangi somut sonuca ulaşmak istiyorsun?" /></Field>
                
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
                  <Field label="Haftalık kapasite (saat)"><Input type="number" min={1} max={60} value={workspace.profile.weeklyCapacityHours} onChange={(event) => workspace.updateProfile({ weeklyCapacityHours: Math.max(1, Number(event.target.value)) })} /></Field>
                </div>

                {/* Resource Preferences */}
                <div className="rounded-xl border bg-muted/20 p-4 space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold">Kaynak ve Bütçe Tercihleri</h3>
                    <p className="text-xs text-muted-foreground">North sana bu tercihlere göre kaynak ve görev önerir.</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Field label="Kaynak Dili">
                      <Select value={prefs.language} onValueChange={(val: "tr" | "en" | "both") => workspace.updateProfile({ learningPreferences: { ...prefs, language: val } })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tr">Yalnızca Türkçe</SelectItem>
                          <SelectItem value="en">İngilizce ağırlıklı</SelectItem>
                          <SelectItem value="both">Türkçe &amp; İngilizce</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Maliyet Tercihi">
                      <Select value={prefs.cost} onValueChange={(val: "free_only" | "paid_allowed") => workspace.updateProfile({ learningPreferences: { ...prefs, cost: val } })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free_only">Sadece Ücretsiz</SelectItem>
                          <SelectItem value="paid_allowed">Ücretli Olabilir</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Haftalık Bütçe (TL)">
                      <Input
                        type="number"
                        min="0"
                        value={prefs.weeklyBudget}
                        onChange={(e) => workspace.updateProfile({ learningPreferences: { ...prefs, weeklyBudget: Number(e.target.value) } })}
                      />
                    </Field>
                  </div>
                </div>

                {/* Area Levels & Competence Ratings */}
                {workspace.profile.interests && workspace.profile.interests.length > 0 && (
                  <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
                    <div>
                      <h3 className="text-sm font-semibold">Gelişim Alanları ve Güncel Seviyeler</h3>
                      <p className="text-xs text-muted-foreground">Her alan için güncel seviyeniz ve 10 üzerinden yetkinlik puanınız.</p>
                    </div>
                    <div className="grid gap-2">
                      {workspace.profile.interests.map((area) => {
                        const areaGoal = workspace.profile.areaGoals?.[area];
                        const lvl = areaGoal?.level || "beginner";
                        const rating = areaGoal?.levelRating ?? (lvl === "advanced" ? 9 : lvl === "intermediate" ? 5 : 2);
                        return (
                          <div key={area} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-background/70 px-3 py-2 text-xs">
                            <span className="font-medium text-foreground">{area}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[10px]">
                                {lvl === "advanced" ? "İleri Seviye" : lvl === "intermediate" ? "Orta Seviye" : "Başlangıç (Yeni)"}
                              </Badge>
                              <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-semibold">
                                {rating} / 10 Puan
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-5">
              <Card>
                <CardHeader><div className="flex items-center gap-3"><NorthLogo size={36} /><div><CardTitle>Yön özeti</CardTitle><CardDescription>North’un planlama sırasında kullandığı bağlam.</CardDescription></div></div></CardHeader>
                <CardContent className="space-y-4">
                  <Direction
                    label="Yaş &amp; Durum"
                    value={
                      workspace.profile.birthDate
                        ? `${calculateAgeFromBirthDate(workspace.profile.birthDate)} yaş (${workspace.profile.ageRange ?? birthDateToAgeRange(workspace.profile.birthDate)}) · ${workspace.profile.lifeSituation ?? "Belirtilmedi"}`
                        : `${workspace.profile.ageRange ?? "Belirtilmedi"} · ${workspace.profile.lifeSituation ?? "Belirtilmedi"}`
                    }
                  />
                  <Direction label="Kategori" value={workspace.profile.track || "Belirtilmedi"} />
                  <Direction label="Ana odak" value={workspace.profile.primaryFocus || "Belirtilmedi"} />
                  <Direction label="Kaynak tercihi" value={prefs.cost === "free_only" ? "Ücretsiz kaynaklar" : "Esnek bütçe"} />
                  <Button className="w-full" asChild><Link href="/north-ai"><Bot />North ile planla</Link></Button>
                  <Button variant="outline" className="w-full" asChild><Link href="/areas"><Target />Hedef alanlarını aç</Link></Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Görünüm ve Tema</CardTitle>
                  <CardDescription>Arayüz temasını tercihinize göre belirleyin.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between gap-3 rounded-xl border bg-muted/20 p-3.5">
                    <div>
                      <p className="text-xs font-semibold text-foreground">Koyu / Açık Tema</p>
                      <p className="text-[11px] text-muted-foreground">Gece ve gündüz çalışma modunu değiştir</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <ThemeToggle className="size-9 border bg-background" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Hesap ve veriler</CardTitle><CardDescription>Yedekleme, gizlilik ve hesap silme kontrolleri.</CardDescription></CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full" asChild><Link href="/data"><ShieldCheck />Verilerim ve güvenlik</Link></Button>
                  <Button variant="outline" className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive" asChild>
                    <Link href="/account-reset">
                      <Trash2 className="size-4" />
                      Sıfırdan başla / Eski hesabı güvenle sil
                    </Link>
                  </Button>
                  <Button variant="ghost" className="w-full" onClick={() => void signOutUser()}><LogOut />Çıkış yap</Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* FEEDBACK MEMORY & CHAT ARCHIVE TAB */}
        <TabsContent value="memory">
          <div className="space-y-6">
            {/* CHAT SESSION PREFERENCES */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <RotateCcw className="size-5 text-primary" />
                    <CardTitle className="text-base">North AI Sohbet ve Oturum Ayarı</CardTitle>
                  </div>
                  <Badge variant={workspace.coaching.preferences.clearChatOnClose !== false ? "default" : "secondary"}>
                    {workspace.coaching.preferences.clearChatOnClose !== false
                      ? "Kapatıldığında Temizle & Kaydet: Aktif"
                      : "Sohbeti Ekranda Tut: Aktif"}
                  </Badge>
                </div>
                <CardDescription>
                  North AI ekranını kapattığında veya başka sayfaya geçtiğinde eski konuşmanın nasıl yönetileceğini belirle.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border bg-muted/20 p-4">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-foreground">
                      Kapatıp açtığımda eski konuşma silinsin, ayarlarda kaydedilsin
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {workspace.coaching.preferences.clearChatOnClose !== false
                        ? "Aktif: North AI her açılışta temiz başlar. Önceki tüm konuşmaların kaybolmaması için aşağıdaki 'Geçmiş Sohbetler' arşivine otomatik kaydedilir."
                        : "Pasif: North AI ekranı kapatılsa bile eski konuşmalar ekranda kalır."}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant={workspace.coaching.preferences.clearChatOnClose !== false ? "outline" : "default"}
                    size="sm"
                    className="shrink-0"
                    onClick={() => {
                      const next = !(workspace.coaching.preferences.clearChatOnClose !== false);
                      workspace.updateCoachingPreferences({ clearChatOnClose: next });
                      toast.success(
                        next
                          ? "North AI kapatıldığında ekranın temizlenmesi ve Ayarlar'a kaydedilmesi aktif edildi."
                          : "Eski konuşmaların ekranda tutulması seçildi."
                      );
                    }}
                  >
                    {workspace.coaching.preferences.clearChatOnClose !== false
                      ? "Devre Dışı Bırak"
                      : "Etkinleştir (Önerilen)"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* ARCHIVED CHAT SESSIONS */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <History className="size-5 text-primary" />
                    <div>
                      <CardTitle className="text-base">Kaydedilen Geçmiş Sohbetler</CardTitle>
                      <CardDescription>
                        North AI ile yaptığın tüm önceki görüşmeler burada güvenle saklanır.
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {(workspace.coachSessionArchives ?? []).length} Oturum
                    </Badge>
                    {(workspace.coachSessionArchives ?? []).length > 0 && (
                      <Button
                        size="xs"
                        variant="ghost"
                        className="text-xs text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          workspace.clearAllCoachArchives();
                          toast.success("Tüm geçmiş sohbet arşivi temizlendi.");
                        }}
                      >
                        <Trash2 className="size-3 mr-1" />
                        Tümünü Temizle
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {(workspace.coachSessionArchives ?? []).length ? (
                  (workspace.coachSessionArchives ?? []).map((session) => {
                    const isExpanded = expandedSessionId === session.id;
                    const dateFormatted = new Date(session.startedAt).toLocaleDateString("tr-TR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    return (
                      <div key={session.id} className="rounded-xl border bg-card transition-all">
                        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 text-xs">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <MessageSquare className="size-3.5 text-primary" />
                              <span className="font-semibold text-foreground">{session.topic}</span>
                              <Badge variant="secondary" className="text-[10px]">
                                {session.messages.length} mesaj
                              </Badge>
                            </div>
                            <p className="text-[11px] text-muted-foreground">{dateFormatted}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => setExpandedSessionId(isExpanded ? null : session.id)}
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp className="size-3 mr-1" /> Gizle
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="size-3 mr-1" /> Konuşmayı Gör
                                </>
                              )}
                            </Button>
                            <Button
                              size="icon-xs"
                              variant="ghost"
                              className="text-muted-foreground hover:text-destructive"
                              onClick={() => {
                                workspace.deleteCoachSessionArchive(session.id);
                                toast.success("Sohbet kaydı silindi.");
                              }}
                              title="Bu sohbeti sil"
                            >
                              <Trash2 className="size-3" />
                            </Button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="border-t bg-muted/10 p-4 space-y-3 max-h-96 overflow-y-auto rounded-b-xl">
                            {session.messages.map((msg) => (
                              <div
                                key={msg.id}
                                className={`flex flex-col text-xs rounded-xl p-3 ${
                                  msg.role === "user"
                                    ? "bg-primary/10 border border-primary/20 ml-4 sm:ml-8"
                                    : "bg-background border mr-4 sm:mr-8"
                                }`}
                              >
                                <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                                  <span className="font-semibold text-foreground">
                                    {msg.role === "user" ? "Sen" : "North AI"}
                                  </span>
                                  <span>
                                    {new Date(msg.createdAt).toLocaleTimeString("tr-TR", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </div>
                                <p className="whitespace-pre-wrap leading-relaxed text-foreground">
                                  {msg.content}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-xl border border-dashed p-6 text-center text-xs text-muted-foreground">
                    <History className="mx-auto mb-2 size-5 text-muted-foreground" />
                    Henüz kaydedilmiş bir geçmiş sohbet yok. North AI ekranını kapattığında konuşmaların otomatik olarak buraya arşivlenir.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* FEEDBACK RULES SECTION */}
            <div className="grid gap-5 lg:grid-cols-[1fr_.8fr]">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Brain className="size-5 text-primary" />
                    <CardTitle>North AI Geri Bildirim Hafızası</CardTitle>
                  </div>
                  <CardDescription>
                    Çalışmalarında &quot;bu kaynak zor&quot;, &quot;akşam çalışamıyorum&quot;, &quot;video istemiyorum&quot; gibi belirttiğin sinyaller burada kurallara dönüşür. İstediklerini açabilir, düzenleyebilir veya silebilirsin.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {(workspace.feedbackMemory ?? []).map((item) => (
                      <div key={item.id} className="flex items-start justify-between gap-3 rounded-xl border p-3.5 text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={item.enabled ? "default" : "outline"} className="text-[10px]">
                              {item.category === "schedule_time" ? "Zamanlama" : item.category === "difficulty" ? "Zorluk" : item.category === "format" ? "Format" : item.category === "resource" ? "Kaynak" : "Genel"}
                            </Badge>
                            <span className="font-medium text-foreground">{item.rule}</span>
                          </div>
                          <p className="text-muted-foreground">Sinyal: &ldquo;{item.signal}&rdquo;</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            size="xs"
                            variant={item.enabled ? "outline" : "secondary"}
                            onClick={() => workspace.updateFeedbackMemory(item.id, { enabled: !item.enabled })}
                          >
                            {item.enabled ? "Devre Dışı Bırak" : "Etkinleştir"}
                          </Button>
                          <Button
                            size="icon-xs"
                            variant="ghost"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => {
                              workspace.deleteFeedbackMemory(item.id);
                              toast.success("Kural hafızadan silindi.");
                            }}
                          >
                            <Trash2 className="size-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {(!workspace.feedbackMemory || workspace.feedbackMemory.length === 0) && (
                      <div className="rounded-xl border border-dashed p-6 text-center text-xs text-muted-foreground">
                        <Sparkles className="mx-auto mb-2 size-5 text-muted-foreground" />
                        Henüz kayıtlı bir AI geri bildirim kuralı yok. North ile konuştukça veya aşağıdan kendin ekledikçe burada listelenir.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* ADD MANUAL FEEDBACK RULE */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Kendi Kuralını Ekle</CardTitle>
                  <CardDescription>North AI plan yaparken bu kuralları daima dikkate alır.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Field label="Kategori">
                    <Select value={memoryDraft.category} onValueChange={(val: FeedbackMemoryItem["category"]) => setMemoryDraft({ ...memoryDraft, category: val })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="schedule_time">Zamanlama / Saat</SelectItem>
                        <SelectItem value="format">Format / İçerik türü</SelectItem>
                        <SelectItem value="difficulty">Zorluk derecesi</SelectItem>
                        <SelectItem value="resource">Kaynak tercihi</SelectItem>
                        <SelectItem value="energy">Enerji seviyesi</SelectItem>
                        <SelectItem value="other">Diğer</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Kullanıcı Sinyali">
                    <Input
                      value={memoryDraft.signal}
                      onChange={(e) => setMemoryDraft({ ...memoryDraft, signal: e.target.value })}
                      placeholder="Örn: Akşam saat 21:00 sonrası odaklanamıyorum"
                    />
                  </Field>
                  <Field label="North AI Kuralı">
                    <Input
                      value={memoryDraft.rule}
                      onChange={(e) => setMemoryDraft({ ...memoryDraft, rule: e.target.value })}
                      placeholder="Örn: Akşam 21:00 sonrasına derin çalışma koyma, hafif tekrar ver"
                    />
                  </Field>
                  <Button className="w-full" onClick={saveMemory} disabled={!memoryDraft.signal?.trim() || !memoryDraft.rule?.trim()}>
                    <Plus className="size-3.5" /> Kuralı Hafızaya Ekle
                  </Button>
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
