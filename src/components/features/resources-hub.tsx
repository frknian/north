"use client";


import { useResourcesHub } from "./resources-parts/use-resources-hub";
import { TopHeaderQuick } from "./resources-parts/top-header-quick";
import { TabKitaplikOkuma } from "./resources-parts/tab-kitaplik-okuma";
import { TabWebGoogle } from "./resources-parts/tab-web-google";
import { TabPinliBelgeler } from "./resources-parts/tab-pinli-belgeler";
import { TabNotebooklmOzetleyici } from "./resources-parts/tab-notebooklm-ozetleyici";
import { ModalYeniKitap } from "./resources-parts/modal-yeni-kitap";
import { ModalSayfaAraligi } from "./resources-parts/modal-sayfa-araligi";
import { ModalGorselPdf } from "./resources-parts/modal-gorsel-pdf";
import { ModalKaynakOzeti } from "./resources-parts/modal-kaynak-ozeti";
import { ModalGorselLightbox } from "./resources-parts/modal-gorsel-lightbox";

export function ResourcesHub() {
  const ctx = useResourcesHub();

  return (
    <div className="page-content space-y-6 pb-32 md:pb-20">
      <TopHeaderQuick ctx={ctx} />
      <TabKitaplikOkuma ctx={ctx} />
      <TabWebGoogle ctx={ctx} />
      <TabPinliBelgeler ctx={ctx} />
      <TabNotebooklmOzetleyici ctx={ctx} />
      <ModalYeniKitap ctx={ctx} />
      <ModalSayfaAraligi ctx={ctx} />
      <ModalGorselPdf ctx={ctx} />
      <ModalKaynakOzeti ctx={ctx} />
      <ModalGorselLightbox ctx={ctx} />
    </div>
  );
}
