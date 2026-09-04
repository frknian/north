"use client";

import { useState } from "react";
import { Archive, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useWorkspace } from "@/components/features/workspace-provider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function ProgressResetDialog() {
  const workspace = useWorkspace();
  const [open, setOpen] = useState(false);
  function reset(reason: "progress_reset" | "full_reset") {
    workspace.resetProgress(reason);
    setOpen(false);
    toast.success(reason === "progress_reset" ? "İlerleme sıfırlandı; profilin ve kaynak tercihlerin korundu." : "Yeni başlangıç oluşturuldu.");
  }
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button variant="outline" size="sm"><RotateCcw /> İlerlemeyi sıfırla</Button></DialogTrigger><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>Yeni başlangıç oluştur</DialogTitle><DialogDescription>İşlemden önce son durumun özet olarak arşivlenir. Bu sürümde arşiv, geri yüklenebilir tam veri kopyası değil; ilerleme kaydıdır.</DialogDescription></DialogHeader><div className="space-y-3"><div className="rounded-lg border p-3"><p className="font-medium">İlerlemeyi sıfırla</p><p className="mt-1 text-xs text-muted-foreground">Odaklanma süreleri, lablar, beceri puanları, notlar, raporlar ve tüm kariyer kanıtları temizlenir. Profilin, görev başlıkların, kaynakların ve Source Lock tercihlerin korunur.</p><Button className="mt-3" size="sm" onClick={() => reset("progress_reset")}><Archive /> İlerlemeyi sıfırla</Button></div><div className="rounded-lg border border-destructive/30 p-3"><p className="font-medium">Tam yeni başlangıç</p><p className="mt-1 text-xs text-muted-foreground">Profil ve başlangıç değerlendirmesi dahil örnek başlangıç durumuna dönülür. Bu seçeneği yalnızca gerçekten temiz bir hesap istiyorsan kullan.</p><Button className="mt-3" variant="destructive" size="sm" onClick={() => reset("full_reset")}><Trash2 /> Tam sıfırlama yap</Button></div></div><DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Vazgeç</Button></DialogFooter></DialogContent></Dialog>;
}
