import { Suspense } from "react";
import { NorthFocus } from "@/components/north/focus";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<main className="flex min-h-[60vh] items-center justify-center p-8 text-sm text-muted-foreground">Oturum hazırlanıyor…</main>}>
      <NorthFocus id={id} />
    </Suspense>
  );
}
