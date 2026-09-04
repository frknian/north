"use client";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) { return <div className="grid min-h-[70dvh] place-items-center p-6"><div className="max-w-sm text-center"><AlertTriangle className="mx-auto mb-4 size-8 text-destructive" /><h1 className="text-lg font-semibold">This view could not load</h1><p className="mt-2 text-sm text-muted-foreground">Your saved progress is untouched. Retry the current view.</p><Button className="mt-5" onClick={reset}>Try again</Button></div></div>; }
