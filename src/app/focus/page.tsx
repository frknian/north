import { Suspense } from "react";
import { NorthFocus } from "@/components/north/focus";

export default function Page() {
  return (
    <Suspense fallback={<main className="flex min-h-[60vh] items-center justify-center p-8 text-sm text-muted-foreground">Oturum hazırlanıyor…</main>}>
      <NorthFocus id="free" />
    </Suspense>
  );
}
