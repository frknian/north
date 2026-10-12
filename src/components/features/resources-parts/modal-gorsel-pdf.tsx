"use client";

import {
  toast,
} from "sonner";
import {
  Button,
} from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { ResourcesHubCtx } from "./use-resources-hub";

export function ModalGorselPdf({ ctx }: { ctx: ResourcesHubCtx }) {
  const {
    addPinModalOpen,
    setAddPinModalOpen,
    pinTitle,
    setPinTitle,
    pinType,
    setPinType,
    pinUrl,
    setPinUrl,
    pinPage,
    setPinPage,
    pinNotes,
    setPinNotes,
    pinTags,
    setPinTags,
    handleAddPinSubmit,
  } = ctx;
  return (
    <>
      {/* ===================================================================== */}
      {/* MODAL 3: GÖRSEL / PDF PİNLE                                           */}
      {/* ===================================================================== */}
      <Dialog open={addPinModalOpen} onOpenChange={setAddPinModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Görsel / PDF Şeması Pinle</DialogTitle>
            <DialogDescription className="text-xs">
              Masaüstünden ekran alıntısı, mimari şema veya PDF bağlantısı ekle.
            </DialogDescription>
          </DialogHeader>
    
          <form onSubmit={handleAddPinSubmit} className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Doküman Başlığı</label>
              <input
                type="text"
                value={pinTitle}
                onChange={(e) => setPinTitle(e.target.value)}
                placeholder="Örn: Active Directory Kerberos Akış Şeması"
                className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-hidden"
              />
            </div>
    
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Tür</label>
                <select
                  value={pinType}
                  onChange={(e) => setPinType(e.target.value as any)}
                  className="w-full rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-hidden"
                >
                  <option value="image">Görsel / Ekran Alıntısı</option>
                  <option value="pdf">PDF Dokümanı</option>
                  <option value="link">Web Kaynağı</option>
                </select>
              </div>
    
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Sayfa Numarası</label>
                <input
                  type="number"
                  value={pinPage}
                  onChange={(e) => setPinPage(e.target.value)}
                  placeholder="Örn: 14"
                  className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-hidden"
                />
              </div>
            </div>
    
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Görsel Dosyası veya URL</label>
              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 5 * 1024 * 1024) {
                      toast.error("Dosya boyutu 5MB'dan küçük olmalıdır.");
                      return;
                    }
                    const reader = new FileReader();
                    reader.onload = () => setPinUrl(reader.result as string);
                    reader.readAsDataURL(file);
                    if (!pinTitle) setPinTitle(file.name.replace(/\.[^/.]+$/, ""));
                  }}
                  className="w-full rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs text-muted-foreground file:mr-2 file:rounded-lg file:border-0 file:bg-primary/10 file:px-2 file:py-0.5 file:text-xs file:font-semibold file:text-primary"
                />
                <input
                  type="text"
                  value={pinUrl}
                  onChange={(e) => setPinUrl(e.target.value)}
                  placeholder="Veya web görsel/PDF URL'si yapıştır..."
                  className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-hidden"
                />
              </div>
            </div>
    
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Not / Çıkarım</label>
              <textarea
                value={pinNotes}
                onChange={(e) => setPinNotes(e.target.value)}
                placeholder="Bu şemadan veya sayfadan aldığın kilit çıkarım..."
                className="w-full h-16 rounded-xl border border-border bg-background p-2.5 text-xs text-foreground focus:outline-hidden resize-none"
              />
            </div>
    
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Etiketler (Virgülle ayır)</label>
              <input
                type="text"
                value={pinTags}
                onChange={(e) => setPinTags(e.target.value)}
                placeholder="Kerberos, Mimari, Windows"
                className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-hidden"
              />
            </div>
    
            <div className="pt-2 flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setAddPinModalOpen(false)}>
                İptal
              </Button>
              <Button type="submit" size="sm" className="rounded-xl">
                Panoya Pinle
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    
    </>
  );
}
