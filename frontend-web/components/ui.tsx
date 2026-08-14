import { CSSProperties } from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'line';
};

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  const styles: Record<string, string> = {
    primary:
      'inline-flex items-center justify-center bg-[var(--espresso)] px-6 py-3 text-[0.72rem] uppercase tracking-[0.18em] text-[var(--ivory)] transition-colors hover:bg-[var(--oxblood)] disabled:opacity-50',
    ghost:
      'inline-flex items-center justify-center px-4 py-3 text-[0.72rem] uppercase tracking-[0.18em] text-[var(--espresso)] hover:text-[var(--oxblood)] disabled:opacity-50',
    line:
      'inline-flex items-center justify-center border border-[var(--espresso)] px-6 py-3 text-[0.72rem] uppercase tracking-[0.18em] text-[var(--espresso)] hover:bg-[var(--espresso)] hover:text-[var(--ivory)] disabled:opacity-50',
  };

  return <button className={`${styles[variant]} ${className}`} {...props} />;
}

export function TextLink({
  href,
  children,
  className = '',
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a href={href} className={`text-[0.72rem] uppercase tracking-[0.16em] hover:text-[var(--oxblood)] ${className}`}>
      {children}
    </a>
  );
}

export function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[var(--stone-dark)]">{children}</p>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="border border-[var(--line)] bg-[var(--paper)] px-6 py-10">
      <h3 className="font-display text-3xl">{title}</h3>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-[var(--espresso-soft)]">{body}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function SourceBadge({ source }: { source: 'live' | 'estimate' }) {
  const style: CSSProperties =
    source === 'live'
      ? { color: 'var(--live)' }
      : { color: 'var(--stone-dark)' };
  return (
    <span className="text-[0.62rem] uppercase tracking-[0.16em]" style={style}>
      {source === 'live' ? 'Live fare' : 'Estimate'}
    </span>
  );
}

export function RoomGate({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <section className="mx-auto max-w-xl px-5 py-24 text-center md:px-8">
      <Kicker>Private rooms</Kicker>
      <h1 className="font-display mt-4 text-4xl md:text-5xl">{title}</h1>
      <p className="mt-4 text-[var(--espresso-soft)] leading-relaxed">{body}</p>
      <div className="mt-8 flex justify-center gap-4">
        <a href="/login" className="inline-flex bg-[var(--espresso)] px-6 py-3 text-[0.72rem] uppercase tracking-[0.18em] text-[var(--ivory)]">
          Sign in
        </a>
        <a href="/signup" className="inline-flex border border-[var(--espresso)] px-6 py-3 text-[0.72rem] uppercase tracking-[0.18em]">
          Join
        </a>
      </div>
    </section>
  );
}
