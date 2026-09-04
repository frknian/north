import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function NotFound() { return <div className="grid min-h-[70dvh] place-items-center p-6 text-center"><div><p className="font-mono text-xs text-primary">404</p><h1 className="mt-2 text-xl font-semibold">Workspace view not found</h1><p className="mt-2 text-sm text-muted-foreground">Return to today&apos;s mission and continue the loop.</p><Button asChild className="mt-5"><Link href="/">Go home</Link></Button></div></div>; }
