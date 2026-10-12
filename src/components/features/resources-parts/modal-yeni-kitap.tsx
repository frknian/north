"use client";

import {
  BookOpen,
} from "lucide-react";
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

export function ModalYeniKitap({ ctx }: { ctx: ResourcesHubCtx }) {
  const {
    addBookModalOpen,
    setAddBookModalOpen,
    updatePageModalOpen,
    setUpdatePageModalOpen,
    targetBookToUpdate,
    updateCurrentPage,
    setUpdateCurrentPage,
    updateTotalPages,
    setUpdateTotalPages,
    updateBookStatus,
    setUpdateBookStatus,
    newBookTitle,
    setNewBookTitle,
    newBookAuthor,
    setNewBookAuthor,
    newBookCategory,
    setNewBookCategory,
    newBookPages,
    setNewBookPages,
    handleAddBookSubmit,
    handleSavePageUpdate,
  } = ctx;
  return (
    <>
      {/* ===================================================================== */}
      {/* MODAL 1: YENİ KİTAP EKLE                                              */}
      {/* ===================================================================== */}
      <Dialog open={addBookModalOpen} onOpenChange={setAddBookModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Yeni Kitap Ekle</DialogTitle>
            <DialogDescription className="text-xs">
              Okuma hedeflerine yeni bir kitap ekle ve okuma seanslarını başlat.
            </DialogDescription>
          </DialogHeader>
    
          <form onSubmit={handleAddBookSubmit} className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Kitap Adı</label>
              <input
                type="text"
                value={newBookTitle}
                onChange={(e) => setNewBookTitle(e.target.value)}
                placeholder="Örn: Designing Data-Intensive Applications"
                className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-hidden focus:border-indigo-500"
              />
            </div>
    
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Yazar</label>
              <input
                type="text"
                value={newBookAuthor}
                onChange={(e) => setNewBookAuthor(e.target.value)}
                placeholder="Örn: Martin Kleppmann"
                className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-hidden focus:border-indigo-500"
              />
            </div>
    
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Kategori</label>
                <select
                  value={newBookCategory}
                  onChange={(e) => setNewBookCategory(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-hidden"
                >
                  <option value="Siber Güvenlik">Siber Güvenlik</option>
                  <option value="Teknoloji & Yazılım">Teknoloji &amp; Yazılım</option>
                  <option value="Alışkanlık & Zihin">Alışkanlık &amp; Zihin</option>
                  <option value="Bilim & Felsefe">Bilim &amp; Felsefe</option>
                  <option value="Psikoloji & Zihin">Psikoloji</option>
                  <option value="Edebiyat & Klasikler">Edebiyat</option>
                </select>
              </div>
    
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Toplam Sayfa</label>
                <input
                  type="number"
                  value={newBookPages}
                  onChange={(e) => setNewBookPages(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-hidden"
                />
              </div>
            </div>
    
            <div className="pt-3 flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setAddBookModalOpen(false)}>
                İptal
              </Button>
              <Button type="submit" size="sm" className="rounded-xl">
                Kitaplığıma Ekle
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    
      {/* ===================================================================== */}
      {/* MODAL 1.5: SAYFA SAYISI GÜNCELLE                                       */}
      {/* ===================================================================== */}
      <Dialog open={updatePageModalOpen} onOpenChange={setUpdatePageModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <BookOpen className="size-4 text-indigo-500" />
              Sayfa Sayısını Güncelle
            </DialogTitle>
            <DialogDescription className="text-xs">
              {targetBookToUpdate ? (
                <span>
                  <strong className="text-foreground">{targetBookToUpdate.title}</strong> ({targetBookToUpdate.author}) için okuma ilerlemeni kaydet.
                </span>
              ) : (
                "Kitap sayfa sayısını ve kaldığın sayfayı güncelle."
              )}
            </DialogDescription>
          </DialogHeader>
    
          {targetBookToUpdate && (
            <form onSubmit={handleSavePageUpdate} className="space-y-4 pt-2">
              {/* Live Progress Preview */}
              <div className="rounded-xl border bg-muted/20 p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">
                    Sayfa {updateCurrentPage} / {updateTotalPages}
                  </span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                    %{Math.min(100, Math.round((Math.max(0, updateCurrentPage) / Math.max(1, updateTotalPages)) * 100))}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted/60">
                  <div
                    className="h-full bg-indigo-500 transition-all duration-200 rounded-full"
                    style={{
                      width: `${Math.min(100, Math.max(0, (updateCurrentPage / Math.max(1, updateTotalPages)) * 100))}%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Kalan: {Math.max(0, updateTotalPages - updateCurrentPage)} sayfa</span>
                  <span className="font-medium">
                    {updateCurrentPage >= updateTotalPages ? "🎉 Kitap tamamlandı olarak işaretlenecek!" : "Okumaya devam ediliyor"}
                  </span>
                </div>
              </div>
    
              {/* Kaldığın Sayfa Stepper & Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Kaldığın Sayfa</span>
                  <span className="text-[10px] text-muted-foreground font-normal">Son okuduğun sayfa numarası</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 px-2 text-xs font-semibold"
                    onClick={() => setUpdateCurrentPage((p) => Math.max(0, p - 10))}
                    disabled={updateCurrentPage <= 0}
                  >
                    -10
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 px-2 text-xs font-semibold"
                    onClick={() => setUpdateCurrentPage((p) => Math.max(0, p - 1))}
                    disabled={updateCurrentPage <= 0}
                  >
                    -1
                  </Button>
                  <input
                    type="number"
                    min={0}
                    max={updateTotalPages}
                    value={updateCurrentPage}
                    onChange={(e) => setUpdateCurrentPage(Math.max(0, Number(e.target.value) || 0))}
                    className="flex-1 text-center rounded-xl border border-border bg-background px-3 py-1.5 text-sm font-bold font-mono text-foreground focus:border-indigo-500 focus:outline-hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 px-2 text-xs font-semibold"
                    onClick={() => setUpdateCurrentPage((p) => Math.min(updateTotalPages, p + 1))}
                    disabled={updateCurrentPage >= updateTotalPages}
                  >
                    +1
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 px-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400"
                    onClick={() => setUpdateCurrentPage((p) => Math.min(updateTotalPages, p + 5))}
                    disabled={updateCurrentPage >= updateTotalPages}
                  >
                    +5
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 px-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400"
                    onClick={() => setUpdateCurrentPage((p) => Math.min(updateTotalPages, p + 10))}
                    disabled={updateCurrentPage >= updateTotalPages}
                  >
                    +10
                  </Button>
                </div>
              </div>
    
              {/* Hızlı Kısayol Butonları */}
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  className="text-[10px] text-muted-foreground hover:text-foreground h-6 px-2"
                  onClick={() => setUpdateCurrentPage(0)}
                >
                  Başa Al (0)
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 h-6 px-2 ml-auto"
                  onClick={() => setUpdateCurrentPage(updateTotalPages)}
                >
                  Tamamlandı Yap ({updateTotalPages}. sf)
                </Button>
              </div>
    
              {/* Toplam Sayfa & Durum */}
              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-border/50">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Toplam Sayfa</label>
                  <input
                    type="number"
                    min={1}
                    value={updateTotalPages}
                    onChange={(e) => setUpdateTotalPages(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-mono font-semibold text-foreground focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Okuma Durumu</label>
                  <select
                    value={updateCurrentPage >= updateTotalPages ? "completed" : updateBookStatus}
                    onChange={(e) => setUpdateBookStatus(e.target.value as "reading" | "completed" | "want_to_read")}
                    className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:border-indigo-500 focus:outline-hidden"
                  >
                    <option value="reading">Okunuyor</option>
                    <option value="want_to_read">Okunacak</option>
                    <option value="completed">Tamamlandı</option>
                  </select>
                </div>
              </div>
    
              <div className="pt-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setUpdatePageModalOpen(false)}
                  className="rounded-xl text-xs"
                >
                  İptal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="rounded-xl text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
                >
                  Sayfayı Kaydet
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    
    </>
  );
}
