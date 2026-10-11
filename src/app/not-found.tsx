import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="grid min-h-[70dvh] place-items-center p-6 text-center">
      <div>
        <p className="font-mono text-xs text-primary">404</p>
        <h1 className="mt-2 text-xl font-semibold">Aradığın sayfa bulunamadı</h1>
        <p className="mt-2 text-sm text-muted-foreground">Bağlantı eski olabilir ya da sayfa taşınmış olabilir.</p>
        <Button asChild className="mt-5"><Link href="/">Bugün ekranına dön</Link></Button>
      </div>
    </div>
  );
}
