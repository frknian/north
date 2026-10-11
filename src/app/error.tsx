"use client";
import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { reportClientError } from "@/lib/report-error";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { reportClientError(error, { digest: error.digest }); }, [error]);
  return (
    <div className="grid min-h-[70dvh] place-items-center p-6">
      <div className="max-w-sm text-center">
        <AlertTriangle className="mx-auto mb-4 size-8 text-destructive" />
        <h1 className="text-lg font-semibold">Bu ekran yüklenemedi</h1>
        <p className="mt-2 text-sm text-muted-foreground">Kayıtlı ilerlemen güvende. Ekranı yeniden yüklemeyi dene; sorun sürerse bize bildir.</p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Button onClick={reset}>Tekrar dene</Button>
          <Button variant="outline" asChild><a href="/support">Sorun bildir</a></Button>
        </div>
      </div>
    </div>
  );
}
