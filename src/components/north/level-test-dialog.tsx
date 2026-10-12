"use client";

import { useMemo, useState } from "react";
import { Check, ClipboardCheck, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { AiQuotaHint, notifyAiUsed } from "@/components/features/ai-quota";
import { useWorkspace } from "@/components/features/workspace-provider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { authenticatedAiFetch } from "@/lib/ai/client";
import { LEVEL_TEST_LENGTH, isValidQuestion, levelLabels, pickNextQuestion, scoreLevelTest, type LevelTestAnswer, type LevelTestQuestion } from "@/lib/level-test";
import { dayKey, weekKey, type Area, type NorthTask } from "@/lib/north";
import { getAssessmentQuestions } from "@/lib/onboarding";
import { cn } from "@/lib/utils";
import { useNorth } from "./shared";

type Phase = "intro" | "loading" | "question" | "result";

/** Static questions from onboarding, used when the AI generator is unavailable. */
function fallbackPool(area: Area): LevelTestQuestion[] {
  return getAssessmentQuestions([area.name])
    .filter((question) => question.options.length >= 2 && !/^\d+$/.test(question.correct))
    .map((question, index): LevelTestQuestion => {
      const options = question.options.slice(0, 4).map((option) => option.label);
      const correctIndex = Math.max(0, question.options.findIndex((option) => option.value === question.correct));
      return { id: `static-${index}-${question.id}`, topic: question.subTopic ?? question.skill, difficulty: 2, prompt: question.prompt, options, correctIndex, explanation: question.explanation ?? "" };
    })
    .filter((question) => question.options.length === 4 && isValidQuestion(question));
}

export function LevelTestDialog({ area, open, onOpenChange }: { area: Area; open: boolean; onOpenChange: (open: boolean) => void }) {
  const workspace = useWorkspace();
  const { update } = useNorth();
  const [phase, setPhase] = useState<Phase>("intro");
  const [pool, setPool] = useState<LevelTestQuestion[]>([]);
  const [answers, setAnswers] = useState<LevelTestAnswer[]>([]);
  const [current, setCurrent] = useState<LevelTestQuestion | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [usedFallback, setUsedFallback] = useState(false);
  const [tasksAdded, setTasksAdded] = useState(false);
  const last = (workspace.levelTests ?? []).find((item) => item.areaId === area.id);

  const total = Math.min(LEVEL_TEST_LENGTH, pool.length);
  const result = useMemo(() => (phase === "result" ? scoreLevelTest(pool, answers) : null), [phase, pool, answers]);

  function reset() { setPhase("intro"); setPool([]); setAnswers([]); setCurrent(null); setPicked(null); setError(""); setUsedFallback(false); setTasksAdded(false); }
  function close(next: boolean) { onOpenChange(next); if (!next) reset(); }

  function begin(questions: LevelTestQuestion[]) {
    setPool(questions); setAnswers([]); setPicked(null);
    setCurrent(pickNextQuestion(questions, []));
    setPhase("question");
  }

  async function start() {
    setPhase("loading"); setError("");
    try {
      const response = await authenticatedAiFetch("/api/ai/level-test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ areaName: area.name, goal: area.goal }) });
      notifyAiUsed();
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "Test hazırlanamadı.");
      const questions = (data.questions as unknown[]).filter(isValidQuestion);
      if (questions.length < 8) throw new Error("Yeterli soru üretilemedi.");
      setUsedFallback(false);
      begin(questions);
    } catch (err) {
      const fallback = fallbackPool(area);
      if (fallback.length >= 3) { setUsedFallback(true); begin(fallback); return; }
      setError(err instanceof Error ? err.message : "Test hazırlanamadı.");
      setPhase("intro");
    }
  }

  function confirmAnswer() {
    if (!current || picked === null) return;
    const next = [...answers, { questionId: current.id, choice: picked }];
    setAnswers(next);
    setPicked(null);
    const following = pickNextQuestion(pool, next);
    if (!following) {
      setPhase("result");
      const scored = scoreLevelTest(pool, next);
      workspace.addLevelTest({ id: crypto.randomUUID(), areaId: area.id, areaName: area.name, takenAt: new Date().toISOString(), ...scored });
    } else setCurrent(following);
  }

  function addReviewTasks() {
    if (!result) return;
    const tasks: NorthTask[] = result.weakTopics.slice(0, 5).map((topic) => ({
      id: crypto.randomUUID(), areaId: area.id, title: `${topic} — konu tekrarı`, goal: `Seviye testinde zayıf çıkan “${topic}” konusunu çalış ve 5 soru çöz.`, minutes: 40,
      intensity: "normal", mandatory: false, status: "pending", date: "", deadline: "", resource: "", why: "Seviye testi sonucuna göre eklendi.", week: weekKey(dayKey()), taskType: "review",
    }));
    update((state) => ({ ...state, tasks: [...tasks, ...state.tasks] }));
    setTasksAdded(true);
    toast.success(`${tasks.length} tekrar görevi haftalık plana eklendi.`);
  }

  const progress = Math.round((answers.length / Math.max(1, total)) * 100);

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-xl max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><ClipboardCheck size={18} />Seviye testi · {area.name}</DialogTitle>
          <DialogDescription>Soruların zorluğu cevaplarına göre ayarlanır. Yaklaşık {LEVEL_TEST_LENGTH} soru, 8–10 dakika.</DialogDescription>
        </DialogHeader>

        {phase === "intro" && (
          <div className="grid gap-4">
            {last && <p className="rounded-xl bg-muted/50 p-3 text-sm">Son sonucun: <b>{levelLabels[last.level]}</b> (%{last.percent}) — {new Date(last.takenAt).toLocaleDateString("tr-TR")}</p>}
            <ul className="grid gap-1.5 text-sm text-muted-foreground"><li>• Yapay zekâ bu alana özel bir soru havuzu hazırlar.</li><li>• Bilmediğin soruda tahmin etmek yerine en yakın seçeneği işaretle; sonuç gerçek seviyeni yansıtsın.</li><li>• Sonunda konu bazlı güçlü ve zayıf yönlerin çıkar; istersen zayıf konular için tekrar görevleri eklenir.</li></ul>
            {error && <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm">{error}</p>}
            <div className="flex flex-wrap items-center gap-3"><Button onClick={start}>Testi başlat</Button><AiQuotaHint kind="levelTest" /></div>
          </div>
        )}

        {phase === "loading" && <p className="flex items-center gap-2 py-8 text-sm text-muted-foreground"><Loader2 className="animate-spin" size={16} />Sorular hazırlanıyor…</p>}

        {phase === "question" && current && (
          <div className="grid gap-4">
            {usedFallback && <p className="rounded-xl bg-amber-500/10 p-2.5 text-xs">Yapay zekâ şu an kullanılamadı; kısa hazır soru seti kullanılıyor.</p>}
            <div><div className="mb-1.5 flex justify-between text-xs text-muted-foreground"><span>Soru {answers.length + 1} / {total}</span><span>{current.topic}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} /></div></div>
            <p className="text-base font-medium leading-relaxed">{current.prompt}</p>
            <div className="grid gap-2" role="radiogroup" aria-label="Seçenekler">
              {current.options.map((option, index) => (
                <button key={index} type="button" role="radio" aria-checked={picked === index} onClick={() => setPicked(index)} className={cn("rounded-xl border p-3 text-left text-sm transition", picked === index ? "border-primary bg-primary/10" : "hover:border-primary/40")}>
                  <span className="mr-2 font-mono text-xs text-muted-foreground">{String.fromCharCode(65 + index)}</span>{option}
                </button>
              ))}
            </div>
            <div className="flex justify-between"><Button variant="ghost" size="sm" onClick={() => close(false)}>Vazgeç</Button><Button disabled={picked === null} onClick={confirmAnswer}>{answers.length + 1 >= total ? "Bitir" : "Sonraki"}</Button></div>
          </div>
        )}

        {phase === "result" && result && (
          <div className="grid gap-4">
            <div className="rounded-2xl border bg-primary/5 p-4 text-center">
              <p className="text-xs text-muted-foreground">Tahmini seviyen</p>
              <p className="mt-1 text-3xl font-bold tracking-tight">{levelLabels[result.level]}</p>
              <p className="mt-1 text-sm text-muted-foreground">%{result.percent} puan · {result.correct}/{result.total} doğru</p>
            </div>
            <div className="grid gap-2">
              {Object.entries(result.byTopic).map(([topic, value]) => {
                const ratio = value.correct / value.total;
                return <div key={topic}><div className="mb-1 flex justify-between text-xs"><span>{topic}</span><span className="text-muted-foreground">{value.correct}/{value.total}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className={cn("h-full rounded-full", ratio < 0.5 ? "bg-amber-500" : "bg-emerald-500")} style={{ width: `${Math.round(ratio * 100)}%` }} /></div></div>;
              })}
            </div>
            <details className="rounded-xl border p-3 text-sm"><summary className="cursor-pointer font-medium">Soruları ve doğru cevapları gör</summary>
              <ol className="mt-3 grid gap-3">{answers.map((answer) => { const q = pool.find((item) => item.id === answer.questionId)!; const right = answer.choice === q.correctIndex; return (
                <li key={q.id} className="text-xs"><p className="font-medium">{right ? <Check size={13} className="mr-1 inline text-emerald-500" /> : <X size={13} className="mr-1 inline text-destructive" />}{q.prompt}</p>{!right && <p className="mt-0.5 text-muted-foreground">Doğru cevap: {q.options[q.correctIndex]}</p>}{q.explanation && <p className="mt-0.5 text-muted-foreground">{q.explanation}</p>}</li>
              ); })}</ol>
            </details>
            <div className="flex flex-wrap gap-2">
              {result.weakTopics.length > 0 && <Button disabled={tasksAdded} onClick={addReviewTasks}>{tasksAdded ? "Görevler eklendi" : `${Math.min(5, result.weakTopics.length)} zayıf konu için görev ekle`}</Button>}
              <Button variant="outline" onClick={() => close(false)}>Kapat</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
