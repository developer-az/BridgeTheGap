'use client';

import Link from 'next/link';
import { WaitingItem, WaitingRoomState, kindIcon } from '@/lib/waiting-room';

export function WaitingRoom({ state }: { state: WaitingRoomState }) {
  const { headline, subline, primary, items, glowCount, partner } = state;

  return (
    <section className="waiting-room relative overflow-hidden border border-[var(--line)] bg-[var(--paper)] p-6 md:p-8">
      {glowCount > 0 && <div className="waiting-room-glow" aria-hidden />}

      <div className="relative">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-xl">
            {glowCount > 0 && (
              <p className="waiting-pulse-dot mb-4 inline-flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.2em] text-[var(--oxblood)]">
                <span className="pulse-dot" aria-hidden />
                {glowCount === 1 ? 'Something is here' : `${glowCount} things waiting`}
              </p>
            )}
            <h2 className="font-display text-3xl leading-tight md:text-5xl">{headline}</h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-[var(--espresso-soft)] md:text-base">
              {subline}
            </p>
          </div>

          {partner && (
            <div className="hidden text-right md:block">
              <p className="text-[0.62rem] uppercase tracking-[0.18em] text-[var(--stone-dark)]">Your person</p>
              <p className="font-display mt-1 text-2xl">{partner.name || partner.email}</p>
              <p className="mt-1 text-xs text-[var(--stone-dark)]">
                {[partner.university_name, partner.location_city].filter(Boolean).join(' · ')}
              </p>
            </div>
          )}
        </div>

        {primary && (
          <Link
            href={primary.href}
            className={`mt-8 block border p-5 transition-colors md:p-6 ${
              primary.glow
                ? 'waiting-card-glow border-[var(--oxblood)]/30 bg-[var(--ivory)]'
                : 'border-[var(--line)] bg-[var(--ivory-deep)]/40 hover:border-[var(--line-strong)]'
            }`}
          >
            <WaitingCard item={primary} featured />
          </Link>
        )}

        {items.length > 1 && (
          <div className="mt-6">
            <p className="text-[0.62rem] uppercase tracking-[0.18em] text-[var(--stone-dark)]">Also coming up</p>
            <ul className="mt-3 divide-y divide-[var(--line)]">
              {items.slice(primary ? 1 : 0, 6).map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className="group flex items-center gap-4 py-3 transition-colors hover:text-[var(--oxblood)]"
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center text-sm ${
                        item.glow ? 'waiting-icon-glow' : 'text-[var(--stone-dark)]'
                      }`}
                      aria-hidden
                    >
                      {kindIcon(item.kind)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-lg leading-snug">{item.title}</p>
                      <p className="text-xs text-[var(--stone-dark)]">{item.subtitle}</p>
                    </div>
                    {item.daysUntil !== null && (
                      <span
                        className={`shrink-0 text-[0.65rem] uppercase tracking-[0.14em] ${
                          item.glow ? 'text-[var(--oxblood)]' : 'text-[var(--stone-dark)]'
                        }`}
                      >
                        {item.daysUntil === 0 ? 'Today' : item.daysUntil === 1 ? '1 day' : `${item.daysUntil} days`}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {!partner && items.length === 0 && (
          <div className="mt-8 border border-dashed border-[var(--line-strong)] p-6 text-center">
            <p className="font-display text-2xl">The drawer is empty for now</p>
            <p className="mt-2 text-sm text-[var(--espresso-soft)]">
              Give someone your code. When they arrive, this room fills up.
            </p>
            <Link
              href="/connect"
              className="mt-4 inline-block text-[0.72rem] uppercase tracking-[0.16em] hover:text-[var(--oxblood)]"
            >
              Your code
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

function WaitingCard({ item, featured }: { item: WaitingItem; featured?: boolean }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="text-[0.62rem] uppercase tracking-[0.18em] text-[var(--stone-dark)]">
          {featured && item.glow ? 'Waiting for you' : 'Next'}
        </p>
        <p className={`font-display mt-2 ${featured ? 'text-2xl md:text-3xl' : 'text-xl'}`}>{item.title}</p>
        <p className="mt-2 text-sm text-[var(--espresso-soft)]">{item.subtitle}</p>
      </div>
      {item.daysUntil !== null && (
        <div className={`text-right ${item.glow ? 'waiting-countdown' : ''}`}>
          <p className="font-display text-4xl tabular-nums md:text-5xl">{item.daysUntil}</p>
          <p className="text-[0.62rem] uppercase tracking-[0.16em] text-[var(--stone-dark)]">
            {item.daysUntil === 1 ? 'day' : 'days'}
          </p>
        </div>
      )}
    </div>
  );
}

export function WaitingRoomCompact({ state }: { state: WaitingRoomState }) {
  if (state.items.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {state.items
        .filter((item) => item.glow)
        .slice(0, 4)
        .map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="waiting-chip inline-flex items-center gap-2 border border-[var(--oxblood)]/25 bg-[var(--ivory)] px-3 py-1.5 text-[0.62rem] uppercase tracking-[0.12em] text-[var(--oxblood)]"
          >
            <span className="pulse-dot pulse-dot-sm" aria-hidden />
            {item.title}
          </Link>
        ))}
    </div>
  );
}
