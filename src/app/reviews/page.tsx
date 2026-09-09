import { Suspense } from "react";
import { NorthProgress } from "@/components/north/progress";

export default function ReviewsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-muted-foreground">Değerlendirme verileri yükleniyor...</div>}>
      <NorthProgress initialTab="reviews" />
    </Suspense>
  );
}
