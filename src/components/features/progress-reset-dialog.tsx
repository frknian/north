"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useWorkspace } from "@/components/features/workspace-provider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function ProgressResetDialog() {
  const router = useRouter();
  const workspace = useWorkspace();
  const [open, setOpen] = useState(false);

  function reset(reason: "progress_reset" | "full_reset") {
    workspace.resetProgress(reason);
    setOpen(false);
    if (reason === "full_reset") {
      toast.success("Profil ve tüm ilerleme temizlendi. Başlangıç değerlendirmesine geçiliyor.");
      router.push("/onboarding");
    } else {
      toast.success("İlerleme sıfırlandı; profilin ve kaynak tercihlerin korundu.");
    }
  }

  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild><Button variant="outline" size="sm"><RotateCcw /> İlerlemeyi sıfırla</Button></DialogTrigger>
    <DialogContent className="sm:max-w-lg">
      <DialogHeader><DialogTitle>Yeni başlangıç oluştur</DialogTitle><DialogDescription>Hangi verilerin korunacağını seç. Tam sıfırlama seni yeniden başlangıç değerlendirmesine gönderir.</DialogDescription></DialogHeader>
      <div className="space-y-3">
        <div className="rounded-lg border p-3"><p className="font-medium">Yalnızca ilerlemeyi sıfırla</p><p className="mt-1 text-xs text-muted-foreground">Odaklanma süreleri, lablar, beceri puanları, notlar, raporlar ve tüm kariyer kanıtları temizlenir. Profilin, görev başlıkların ve kaynak tercihlerin korunur.</p><Button className="mt-3" size="sm" onClick={() => reset("progress_reset")}><Archive /> İlerlemeyi sıfırla</Button></div>
        <div className="rounded-lg border border-destructive/30 p-3"><p className="font-medium">Tam yeni başlangıç</p><p className="mt-1 text-xs text-muted-foreground">Profil, hedefler, görevler, odak süresi, beceriler ve kanıtlar temizlenir. Sonra testi çözüp hedeflerini yeniden belirlersin.</p><Button className="mt-3" variant="destructive" size="sm" onClick={() => reset("full_reset")}><Trash2 /> Tam sıfırlama yap</Button></div>
      </div>
      <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Vazgeç</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}
