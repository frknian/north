export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description: string; action?: React.ReactNode }) {
  return <header className="mx-auto max-w-[1440px] px-5 pt-8 sm:px-8"><div className="north-page-header"><div>{eyebrow ? <p className="north-eyebrow">{eyebrow}</p> : null}<h1>{title}</h1><p>{description}</p></div>{action}</div></header>;
}
