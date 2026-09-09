import { NorthLogo } from "@/components/layout/north-logo";

export default function Loading() {
  return (
    <div className="grid min-h-[70dvh] place-items-center px-6 text-center" aria-label="Planorth yükleniyor" aria-busy="true">
      <div className="flex flex-col items-center gap-3">
        <NorthLogo size={64} priority />
        <p className="font-planorth text-lg tracking-[0.08em]">PLANORTH</p>
        <p className="text-sm text-muted-foreground">Hazırlanıyor…</p>
      </div>
    </div>
  );
}
