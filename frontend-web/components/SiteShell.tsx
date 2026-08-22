'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';

const publicLinks = [
  { href: '/travel', label: 'Travel' },
  { href: '/occasions', label: 'Occasions' },
];

const privateLinks = [
  { href: '/home', label: 'Home' },
  { href: '/together', label: 'Together' },
  { href: '/calendar', label: 'Calendar' },
  { href: '/letters', label: 'Letters' },
  { href: '/connect', label: 'Partner' },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { session, profile, loading } = useAuth();
  const signedIn = Boolean(session);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--ivory)]/92 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 md:px-8">
        <Link href="/" className="leading-none">
          <span className="font-display text-2xl tracking-tight">Bridge</span>
          <span className="ml-2 text-[0.7rem] uppercase tracking-[0.22em] text-[var(--stone-dark)]">
            the Gap
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-[0.78rem] uppercase tracking-[0.18em] md:flex">
          {publicLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={pathname.startsWith(link.href) ? 'text-[var(--oxblood)]' : 'text-[var(--espresso-soft)] hover:text-[var(--espresso)]'}
            >
              {link.label}
            </Link>
          ))}
          {signedIn &&
            privateLinks
              .filter((link) => link.href !== '/home')
              .map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={pathname.startsWith(link.href) ? 'text-[var(--oxblood)]' : 'text-[var(--espresso-soft)] hover:text-[var(--espresso)]'}
                >
                  {link.label}
                </Link>
              ))}
        </nav>

        <div className="flex items-center gap-5 text-[0.78rem] uppercase tracking-[0.16em]">
          {loading ? (
            <span className="text-[var(--stone-dark)]">…</span>
          ) : signedIn ? (
            <>
              <Link href="/home" className="hidden sm:inline hover:text-[var(--oxblood)]">
                {profile?.name?.split(' ')[0] || 'Home'}
              </Link>
              <Link href="/profile" className="text-[var(--stone-dark)] hover:text-[var(--espresso)]">
                Account
              </Link>
            </>
          ) : (
            <Link href="/login" className="hover:text-[var(--oxblood)]">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-[var(--line)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 text-[0.78rem] text-[var(--stone-dark)] md:flex-row md:items-center md:justify-between md:px-8">
        <p className="font-display text-lg text-[var(--espresso)]">Bridge the Gap</p>
        <p>Two calendars. One visit. No scramble.</p>
      </div>
    </footer>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const { session } = useAuth();
  if (!session) return null;

  const items = [
    { href: '/home', label: 'Home' },
    { href: '/calendar', label: 'Dates' },
    { href: '/travel', label: 'Travel' },
    { href: '/together', label: 'Time' },
    { href: '/connect', label: 'Partner' },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line)] bg-[var(--ivory)]/95 backdrop-blur md:hidden">
      <ul className="grid grid-cols-5 text-center text-[0.62rem] uppercase tracking-[0.14em]">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={`block py-3 ${pathname.startsWith(item.href) ? 'text-[var(--oxblood)]' : 'text-[var(--stone-dark)]'}`}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-shell">
      <SiteHeader />
      <main className="page-main">{children}</main>
      <SiteFooter />
      <MobileNav />
    </div>
  );
}
