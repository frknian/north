"use client";

import {
  ExternalLink,
  FileText,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  type NorthBook,
} from "@/lib/books";
import {
  BookLibraryModal,
} from "../book-library-modal";
import {
  BreathworkModal,
} from "../breathwork-modal";
import {
  FocusResourcesModal,
} from "../focus-resources-dock";
import {
  toast,
} from "sonner";
import type { FocusSessionCtx } from "./use-focus-session";

export function BreathworkSection({ ctx }: { ctx: FocusSessionCtx }) {
  const {
    setActiveBookId,
    setReadingPageInput,
    bookLibraryOpen,
    setBookLibraryOpen,
    activeRange,
    setActiveRange,
    resourcesModalOpen,
    setResourcesModalOpen,
    resourcesModalTab,
    lightboxDoc,
    setLightboxDoc,
    task,
    activeBook,
    scratchpadText,
    breathworkOpen,
    setBreathworkOpen,
  } = ctx;
  return (
    <>
      {/* BREATHWORK MODAL */}
      <BreathworkModal open={breathworkOpen} onOpenChange={setBreathworkOpen} />
    
      {/* BOOK LIBRARY & RECOMMENDATIONS MODAL */}
      <BookLibraryModal
        open={bookLibraryOpen}
        onOpenChange={setBookLibraryOpen}
        onStartReadingFocus={(book: NorthBook) => {
          setActiveBookId(book.id);
          setReadingPageInput(book.currentPage);
          setBookLibraryOpen(false);
          toast.success(`"${book.title}" seçildi.`);
        }}
      />
    
      {/* FOCUS RESOURCES MODAL (FULL WORKSPACE) */}
      <FocusResourcesModal
        open={resourcesModalOpen}
        onOpenChange={setResourcesModalOpen}
        initialTab={resourcesModalTab}
        task={task}
        activeBook={activeBook}
        activeRange={activeRange}
        onSelectRange={(range) => {
          setActiveRange(range);
          toast.success(`"${range.topic}" bu seansın aktif hedefi yapıldı.`);
        }}
        scratchpadText={scratchpadText}
        readingQuotes={activeBook?.favoriteQuotes || []}
      />
    
      {/* LIGHTBOX FOR PINNED DOC */}
      {lightboxDoc && (
        <Dialog open={!!lightboxDoc} onOpenChange={() => setLightboxDoc(null)}>
          <DialogContent className="max-w-4xl p-2 bg-black/90 text-white border-zinc-800">
            <div className="relative flex flex-col items-center justify-center p-2">
              <div className="flex items-center justify-between w-full pb-2 px-2 border-b border-zinc-800 text-xs">
                <span className="font-bold truncate">{lightboxDoc.title}</span>
                {lightboxDoc.pageRange && (
                  <span className="font-mono text-zinc-400">{lightboxDoc.pageRange}</span>
                )}
              </div>
              <div className="my-4 max-h-[75vh] max-w-full overflow-auto flex items-center justify-center">
                {lightboxDoc.type === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={lightboxDoc.url}
                    alt={lightboxDoc.title}
                    className="max-h-[70vh] max-w-full object-contain rounded-lg"
                  />
                ) : (
                  <div className="p-8 text-center space-y-3">
                    <FileText className="size-16 mx-auto text-sky-400" />
                    <p className="text-sm font-semibold">{lightboxDoc.title}</p>
                    <a
                      href={lightboxDoc.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-sky-400 underline"
                    >
                      Harici Sekmede Aç
                      <ExternalLink className="size-3" />
                    </a>
                  </div>
                )}
              </div>
              {lightboxDoc.notes && (
                <p className="text-xs text-zinc-400 italic px-3 text-center">{lightboxDoc.notes}</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
