import Link from 'next/link';

export default function TopNav({
  title,
  backHref
}: {
  title?: string;
  backHref?: string;
}) {
  return (
    <div className="mb-8 flex items-center justify-between text-sm text-[var(--muted)]">
      <div className="flex items-center gap-3">
        {backHref ? (
          <Link className="text-[var(--text)]" href={backHref}>
            Back
          </Link>
        ) : (
          <span className="text-[var(--text)]">Reservé</span>
        )}
      </div>
      {title ? <span className="text-xs uppercase tracking-[0.2em]">{title}</span> : null}
    </div>
  );
}
