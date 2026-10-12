"use client";

import Link from "next/link";
import { useFocusSession } from "./focus-parts/use-focus-session";
import { CompactTopControl } from "./focus-parts/compact-top-control";
import { MainBentoCockpit } from "./focus-parts/main-bento-cockpit";
import { ProofSection } from "./focus-parts/proof-section";
import { BreathworkSection } from "./focus-parts/breathwork-modal";

export function NorthFocus({ id }: { id: string }) {
  const ctx = useFocusSession({ id });
  const {
    ready,
    isReadingMode,
    isFreeMode,
    task,
  } = ctx;
  if (!ready) {
    return <main className="flex min-h-[60vh] items-center justify-center p-8 text-sm text-muted-foreground">Oturum hazırlanıyor…</main>;
  }

  if (!task && !isFreeMode && !isReadingMode) {
    return (
      <main className="mx-auto max-w-md p-10 text-center">
        <p className="text-muted-foreground">Görev bulunamadı.</p>
        <Link href="/" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
          Bugüne dön →
        </Link>
      </main>
    );
  }

  return (
    <main className="focus-stitch w-full max-w-none px-2 sm:px-3 py-2 min-h-screen xl:h-screen flex flex-col gap-2 overflow-y-auto xl:overflow-hidden">
      <CompactTopControl ctx={ctx} />
      <MainBentoCockpit ctx={ctx} />
      <ProofSection ctx={ctx} />
      <BreathworkSection ctx={ctx} />
    </main>
  );
}
