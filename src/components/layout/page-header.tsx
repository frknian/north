export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description: string; action?: React.ReactNode }) {
  return <header className="flex flex-col gap-4 border-b px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8"><div>{eyebrow ? <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.18em] text-primary">{eyebrow}</p> : null}<h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1><p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p></div>{action}</header>;
}
