import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react';
import Link from 'next/link';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'line';
};

const variantClass: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'btn-primary',
  ghost: 'btn-ghost',
  line: 'btn-line',
};

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  return <button className={`${variantClass[variant]} ${className}`.trim()} {...props} />;
}

export function ButtonLink({
  href,
  children,
  variant = 'primary',
  className = '',
}: {
  href: string;
  children: ReactNode;
  variant?: 'primary' | 'ghost' | 'line';
  className?: string;
}) {
  const isHash = href.startsWith('#');
  const classes = `${variantClass[variant]} ${className}`.trim();
  if (isHash) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}

export function TextLink({
  href,
  children,
  className = '',
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`text-[0.72rem] uppercase tracking-[0.16em] text-[var(--espresso)] hover:text-[var(--oxblood)] ${className}`}
    >
      {children}
    </Link>
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
  action?: ReactNode;
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
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <ButtonLink href="/login" variant="primary">
          Sign in
        </ButtonLink>
        <ButtonLink href="/signup" variant="line">
          Join
        </ButtonLink>
      </div>
    </section>
  );
}
