"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Brain, Trash2, Check, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface DumpItem {
  id: string;
  text: string;
  createdAt: string;
  done?: boolean;
}

const STORAGE_KEY = "north:brain_dump_items";

export function BrainDumpModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [items, setItems] = useState<DumpItem[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          setItems(JSON.parse(stored));
        }
      } catch {}
    }, 0);
    return () => window.clearTimeout(timer);
  }, [open]);

  const saveItems = (next: DumpItem[]) => {
    setItems(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const newItem: DumpItem = {
      id: crypto.randomUUID(),
      text: input.trim(),
      createdAt: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
    };
    saveItems([newItem, ...items]);
    setInput("");
    toast.success("Zihinsel not kaydedildi. Odaklanmaya devam edebilirsin.");
  };

  const handleDelete = (id: string) => {
    saveItems(items.filter((item) => item.id !== id));
  };

  const handleClearAll = () => {
    saveItems([]);
    toast.info("Tüm zihin dökümleri temizlendi.");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl p-6 bg-card text-card-foreground border border-border shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary mb-1">
            <Brain className="size-5" />
            <DialogTitle className="text-base font-bold text-foreground">Aklındakini Dök (Brain Dump)</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Çalışırken dikkatini dağıtan ani düşünceleri buraya yazıp zihninden çıkar; oturum bittiğinde bakarsın.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleAdd} className="mt-3 flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Aklına ne takıldı? (Örn. Kargoyu ara, şu makaleyi oku...)"
            className="text-xs h-10 rounded-xl"
            autoFocus
          />
          <Button type="submit" size="sm" className="rounded-xl px-4 shrink-0">
            Kaydet
          </Button>
        </form>

        <div className="mt-4 max-h-60 overflow-y-auto space-y-2 pr-1 divide-y divide-border/30">
          {items.length === 0 ? (
            <p className="text-center py-6 text-xs text-muted-foreground">
              Zihnin şu an berrak. Aklına gelenleri buraya yazarak odak kaybetmeden devam edebilirsin.
            </p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="pt-2 flex items-center justify-between gap-3 text-xs">
                <div>
                  <p className="font-medium text-foreground">{item.text}</p>
                  <span className="text-[10px] text-muted-foreground">{item.createdAt}</span>
                </div>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => handleDelete(item.id)}
                  className="text-muted-foreground hover:text-destructive size-7 p-0"
                  aria-label="Sil"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="mt-4 flex justify-between items-center pt-2 border-t border-border/50 text-xs">
            <span className="text-[11px] text-muted-foreground">{items.length} kayıtlı düşünce</span>
            <Button variant="ghost" size="xs" onClick={handleClearAll} className="text-xs text-muted-foreground">
              Tümünü Temizle
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
