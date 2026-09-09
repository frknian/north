"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, Check, Plus, RefreshCw, Rotate3D, Sparkles, Trash2, X } from "lucide-react";
import { nextRepetition } from "@/lib/repetition";
import { toast } from "sonner";

interface Flashcard {
  id: string;
  front: string;
  back: string;
  tag: string;
  interval: number;
  nextReviewDate: string;
}

const STORAGE_KEY = "north:flashcards_items";

const STARTER_CARDS: Flashcard[] = [
  {
    id: "card-1",
    front: "20-20-20 Kuralı nedir?",
    back: "Her 20 dakikada bir, en az 20 fit (6 metre) uzaktaki bir nesneye 20 saniye odaklanarak göz kaslarını dinlendirmek.",
    tag: "Odak & Sağlık",
    interval: 1,
    nextReviewDate: new Date().toISOString().slice(0, 10),
  },
  {
    id: "card-2",
    front: "Derin Çalışma (Deep Work) ana prensibi nedir?",
    back: "Bölünmemiş dikkat ve sıfır bildirimle, bilişsel sınırları zorlayarak değer ve çıktı üretmek.",
    tag: "Verimlilik",
    interval: 3,
    nextReviewDate: new Date().toISOString().slice(0, 10),
  },
  {
    id: "card-3",
    front: "Aralıklı Tekrarın (Spaced Repetition) temel mantığı nedir?",
    back: "Unutma eğrisi devreye girmeden önce, giderek açılan zaman aralıklarıyla bilgiyi geri çağırmak ve kalıcı hafızaya aktarmak.",
    tag: "Öğrenme",
    interval: 7,
    nextReviewDate: new Date().toISOString().slice(0, 10),
  },
];

export function FlashcardsModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // New card form
  const [newFront, setNewFront] = useState("");
  const [newBack, setNewBack] = useState("");
  const [newTag, setNewTag] = useState("Genel");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setCards(parsed);
          return;
        }
      }
      setCards([]);
    } catch {
      setCards([]);
    }
  }, []);

  const saveCards = (next: Flashcard[]) => {
    setCards(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  };

  const currentCard = cards[currentIndex];

  const handleReview = (remembered: boolean) => {
    if (!currentCard) return;
    const rep = nextRepetition(currentCard.interval, remembered);
    const updated = cards.map((c, i) =>
      i === currentIndex
        ? { ...c, interval: rep.reviewIntervalDays, nextReviewDate: rep.nextReviewAt.slice(0, 10) }
        : c
    );
    saveCards(updated);
    setIsFlipped(false);
    toast.success(remembered ? `Harika! Tekrar aralığı ${rep.reviewIntervalDays} güne uzatıldı.` : "Tekrar planlandı: Yarın tekrar karşına çıkacak.");
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const handleCreateCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFront.trim() || !newBack.trim()) return;
    const card: Flashcard = {
      id: crypto.randomUUID(),
      front: newFront.trim(),
      back: newBack.trim(),
      tag: newTag.trim() || "Genel",
      interval: 1,
      nextReviewDate: new Date().toISOString().slice(0, 10),
    };
    saveCards([card, ...cards]);
    setNewFront("");
    setNewBack("");
    setIsAdding(false);
    toast.success("Yeni kart / yanlış notu eklendi.");
  };

  const handleDelete = (id: string) => {
    const next = cards.filter((c) => c.id !== id);
    saveCards(next);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl p-6 bg-card text-card-foreground border border-border shadow-2xl text-center">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto grid size-10 place-items-center rounded-xl bg-purple-500/15 text-purple-400 mb-1">
            <BookOpen className="size-5" />
          </div>
          <DialogTitle className="text-base font-bold text-foreground">Akıllı Bilgi Kartları &amp; Yanlış Defteri</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Aralıklı tekrar algoritması ile takıldığın konuları ve kritik bilgileri kalıcı hafızaya al.
          </DialogDescription>
        </DialogHeader>

        {!isAdding ? (
          <div>
            <div className="flex items-center justify-between text-xs text-muted-foreground my-2">
              <span>Kart {cards.length ? currentIndex + 1 : 0} / {cards.length}</span>
              <div className="flex items-center gap-1.5">
                <Button size="xs" variant="outline" onClick={() => setIsAdding(true)} className="rounded-lg text-[11px]">
                  <Plus className="mr-1 size-3" /> Yeni Kart Ekle
                </Button>
                {cards.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("Tüm bilgi kartlarını silmek istediğinizden emin misiniz?")) {
                        saveCards([]);
                        toast.info("Tüm kartlar temizlendi.");
                      }
                    }}
                    className="text-[11px] text-muted-foreground hover:text-red-500 px-1"
                    title="Tümünü Temizle"
                  >
                    Tümünü Temizle
                  </button>
                )}
              </div>
            </div>

            {currentCard ? (
              <div className="mt-2 space-y-4">
                {/* 3D FLIPPABLE CARD */}
                <div
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="cursor-pointer select-none min-h-52 rounded-2xl border-2 border-border/80 bg-background/80 p-6 flex flex-col justify-between items-center transition-all hover:border-primary/50 shadow-sm text-center relative"
                >
                  <span className="self-start rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    {currentCard.tag} · {isFlipped ? "Çözüm / Cevap" : "Soru / Kavram"}
                  </span>

                  <div className="my-auto py-2">
                    <p className="text-sm font-medium text-foreground leading-relaxed">
                      {isFlipped ? currentCard.back : currentCard.front}
                    </p>
                  </div>

                  <span className="text-[10px] text-muted-foreground/80 flex items-center gap-1">
                    <Rotate3D className="size-3" /> Çevirmek için tıkla
                  </span>
                </div>

                {/* REVIEW BUTTONS */}
                <div className="flex items-center justify-center gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReview(false)}
                    className="rounded-xl text-xs flex-1 border-rose-500/30 text-rose-500 hover:bg-rose-500/10"
                  >
                    <X className="mr-1 size-3.5" />
                    Zorlandım (1 Gün)
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleReview(true)}
                    className="rounded-xl text-xs flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Check className="mr-1 size-3.5" />
                    Hatırladım ({currentCard.interval * 2 || 2} Gün)
                  </Button>
                </div>

                <div className="flex justify-between items-center pt-2 text-[11px] text-muted-foreground">
                  <button
                    type="button"
                    onClick={() => handleDelete(currentCard.id)}
                    className="text-muted-foreground hover:text-destructive text-[11px] inline-flex items-center gap-1"
                  >
                    <Trash2 className="size-3" /> Bu kartı sil
                  </button>
                  <span>Sonraki tekrar: {currentCard.nextReviewDate}</span>
                </div>
              </div>
            ) : (
              <div className="py-10 text-center text-xs text-muted-foreground space-y-2">
                <p>Henüz kayıtlı bilgi kartı yok.</p>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <Button size="sm" onClick={() => setIsAdding(true)} className="rounded-xl text-xs">
                    <Plus className="mr-1 size-3" /> İlk Kartı Ekle
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      saveCards(STARTER_CARDS);
                      toast.success("Örnek kartlar yüklendi.");
                    }}
                    className="rounded-xl text-xs"
                  >
                    Örnek Kartları Yükle
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleCreateCard} className="mt-3 space-y-3 text-left">
            <div>
              <label className="text-xs font-semibold text-foreground">Ön Yüz (Soru, Terim veya Yanlış Soru)</label>
              <Input
                value={newFront}
                onChange={(e) => setNewFront(e.target.value)}
                placeholder="Örn. CSRF açığı nasıl önlenir? veya Bir terim / formül..."
                className="mt-1 text-xs rounded-xl"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground">Arka Yüz (Cevap, Çözüm veya Kural)</label>
              <Textarea
                value={newBack}
                onChange={(e) => setNewBack(e.target.value)}
                placeholder="Örn. Anti-CSRF token kullanımı ve SameSite cookie bayrağı..."
                className="mt-1 text-xs rounded-xl"
                rows={3}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground">Etiket / Kategori</label>
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Örn. Siber Güvenlik, Matematik, İngilizce"
                className="mt-1 text-xs rounded-xl"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsAdding(false)} className="rounded-xl text-xs">
                Vazgeç
              </Button>
              <Button type="submit" size="sm" className="rounded-xl text-xs">
                Kaydet
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
