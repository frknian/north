import { Skeleton } from "@/components/ui/skeleton";
export default function Loading() { return <div className="space-y-5 p-4 sm:p-8"><div className="space-y-2"><Skeleton className="h-7 w-52" /><Skeleton className="h-4 w-full max-w-lg" /></div><Skeleton className="h-64 w-full" /><div className="grid gap-5 md:grid-cols-2"><Skeleton className="h-40" /><Skeleton className="h-40" /></div></div>; }
