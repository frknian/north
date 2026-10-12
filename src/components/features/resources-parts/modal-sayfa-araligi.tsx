"use client";

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

export function ModalSayfaAraligi({ ctx }: { ctx: ResourcesHubCtx }) {
  const {
    addRangeModalOpen,
    setAddRangeModalOpen,
    rangeBookTitle,
    setRangeBookTitle,
    rangeStart,
    setRangeStart,
    rangeEnd,
    setRangeEnd,
    rangeTopic,
    setRangeTopic,
    rangeNotes,
    setRangeNotes,
    rangeStatus,
    setRangeStatus,
    handleAddRangeSubmit,
  } = ctx;
  return (
    <>
      {/* ===================================================================== */}
      {/* MODAL 2: SAYFA ARALIĞI KAYDET                                         */}
      {/* ===================================================================== */}
      <Dialog open={addRangeModalOpen} onOpenChange={setAddRangeModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Sayfa Aralığı Kaydet</DialogTitle>
            <DialogDescription className="text-xs">
              Kitap veya dokümandan odaklanmak istediğin özel sayfaları kaydet.
            </DialogDescription>
          </DialogHeader>
    
          <form onSubmit={handleAddRangeSubmit} className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Kaynak / Kitap Adı</label>
              <input
                type="text"
                value={rangeBookTitle}
                onChange={(e) => setRangeBookTitle(e.target.value)}
                placeholder="Örn: The Web Application Hacker's Handbook"
                className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-hidden focus:border-amber-500"
              />
            </div>
    
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Başlangıç Sayfası</label>
                <input
                  type="number"
                  value={rangeStart}
                  onChange={(e) => setRangeStart(e.target.value)}
                  placeholder="115"
                  className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Bitiş Sayfası</label>
                <input
                  type="number"
                  value={rangeEnd}
                  onChange={(e) => setRangeEnd(e.target.value)}
                  placeholder="148"
                  className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-hidden"
                />
              </div>
            </div>
    
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Konu / Bölüm Başlığı</label>
              <input
                type="text"
                value={rangeTopic}
                onChange={(e) => setRangeTopic(e.target.value)}
                placeholder="Örn: Bölüm 5: Token Güvenliği ve Entropi Analizi"
                className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-hidden focus:border-amber-500"
              />
            </div>
    
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Önem / Durum</label>
              <select
                value={rangeStatus}
                onChange={(e) => setRangeStatus(e.target.value as any)}
                className="w-full rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-hidden"
              >
                <option value="important">Kritik / Öncelikli</option>
                <option value="reading">Okunuyor / İnceleniyor</option>
                <option value="completed">Tamamlandı</option>
              </select>
            </div>
    
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Notlar / Neden Önemli?</label>
              <textarea
                value={rangeNotes}
                onChange={(e) => setRangeNotes(e.target.value)}
                placeholder="Bu sayfalardaki hangi kavramı projene uygulayacaksın?"
                className="w-full h-20 rounded-xl border border-border bg-background p-2.5 text-xs text-foreground focus:outline-hidden resize-none"
              />
            </div>
    
            <div className="pt-2 flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setAddRangeModalOpen(false)}>
                İptal
              </Button>
              <Button type="submit" size="sm" className="rounded-xl">
                Aralığı Kaydet
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    
    </>
  );
}
