import { Suspense } from "react";
import { NorthProgress } from "@/components/north/progress";

export default function ProgressPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-muted-foreground">İlerleme verileri yükleniyor...</div>}>
      <NorthProgress />
    </Suspense>
  );
}
