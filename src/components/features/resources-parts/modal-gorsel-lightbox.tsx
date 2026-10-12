"use client";

import {
  ExternalLink,
  FileText,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { ResourcesHubCtx } from "./use-resources-hub";

export function ModalGorselLightbox({ ctx }: { ctx: ResourcesHubCtx }) {
  const {
    lightboxDoc,
    setLightboxDoc,
  } = ctx;
  return (
    <>
      {/* ===================================================================== */}
      {/* MODAL 5: GÖRSEL LIGHTBOX                                              */}
      {/* ===================================================================== */}
      {lightboxDoc && (
        <Dialog open={!!lightboxDoc} onOpenChange={() => setLightboxDoc(null)}>
          <DialogContent className="max-w-4xl max-h-[95dvh] overflow-y-auto rounded-3xl p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">{lightboxDoc.title}</DialogTitle>
              {lightboxDoc.notes && (
                <DialogDescription className="text-xs">{lightboxDoc.notes}</DialogDescription>
              )}
            </DialogHeader>
    
            <div className="mt-3 flex items-center justify-center rounded-2xl overflow-hidden bg-black/80 p-2">
              {lightboxDoc.type === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={lightboxDoc.url}
                  alt={lightboxDoc.title}
                  className="max-h-[70dvh] w-auto object-contain rounded-xl"
                />
              ) : (
                <div className="p-8 text-center text-white space-y-2">
                  <FileText className="size-16 text-sky-400 mx-auto" />
                  <p className="text-sm font-semibold">{lightboxDoc.title}</p>
                  <a
                    href={lightboxDoc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-sky-400 underline"
                  >
                    <span>Belgeyi Yeni Sekmede Aç</span>
                    <ExternalLink className="size-3" />
                  </a>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
