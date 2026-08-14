'use client';

import Link from 'next/link';
import { EnvelopeCard } from '@/components/Letter';
import { TravelSearchForm } from '@/components/TravelSearchForm';
import { Kicker } from '@/components/ui';
import { occasionsByCollection, upcomingOccasions } from '@/lib/occasions';

export default function HomeLanding() {
  const upcoming = upcomingOccasions(new Date(), 4);
  const small = occasionsByCollection('small-nights');

  return (
    <div>
      <section className="mx-auto max-w-6xl px-5 pb-8 pt-16 md:px-8 md:pt-24">
        <Kicker>For two cities</Kicker>
        <h1 className="font-display mt-5 max-w-4xl text-5xl leading-[0.95] md:text-7xl">
          Plan the visit before you have to rush.
        </h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-[var(--espresso-soft)] md:text-lg">
          Calendars, a ticket, and the dates that actually matter — kept in one house. Browse freely. Save when you are ready.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-5 md:px-8">
        <TravelSearchForm />
        <p className="mt-3 text-[0.78rem] text-[var(--stone-dark)]">
          No account to look. A fare is marked live or estimate — we never pretend to sell the ticket.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20 md:px-8">
        <div className="flex items-end justify-between gap-6">
          <div>
            <Kicker>This season</Kicker>
            <h2 className="font-display mt-3 text-4xl md:text-5xl">Letters, not reminders</h2>
          </div>
          <Link href="/occasions" className="hidden text-[0.72rem] uppercase tracking-[0.16em] hover:text-[var(--oxblood)] md:inline">
            The lookbook
          </Link>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {upcoming.map((item) => (
            <Link key={item.slug} href={`/occasions/${item.slug}`}>
              <EnvelopeCard occasion={item} date={item.date} days={item.days} />
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-[var(--line)] bg-[var(--ivory-deep)]/60">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 md:grid-cols-3 md:px-8">
          <div>
            <p className="text-[0.68rem] uppercase tracking-[0.2em] text-[var(--stone-dark)]">01</p>
            <h3 className="font-display mt-3 text-3xl">The hours you both have</h3>
            <p className="mt-3 text-sm leading-relaxed text-[var(--espresso-soft)]">
              Two weeks on one grid. The open windows named, so a call or a visit is a choice, not a guess.
            </p>
          </div>
          <div>
            <p className="text-[0.68rem] uppercase tracking-[0.2em] text-[var(--stone-dark)]">02</p>
            <h3 className="font-display mt-3 text-3xl">The way there</h3>
            <p className="mt-3 text-sm leading-relaxed text-[var(--espresso-soft)]">
              Flight, rail, coach — compared once. Keep a trip. Book where tickets actually live.
            </p>
          </div>
          <div>
            <p className="text-[0.68rem] uppercase tracking-[0.2em] text-[var(--stone-dark)]">03</p>
            <h3 className="font-display mt-3 text-3xl">A date on paper</h3>
            <p className="mt-3 text-sm leading-relaxed text-[var(--espresso-soft)]">
              Halloween, Valentine’s, a Thursday. Send a letter. Accept it. The visit stays until you both change it.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20 md:px-8">
        <Kicker>Small nights</Kicker>
        <h2 className="font-display mt-3 text-4xl">Not every date is a holiday</h2>
        <ul className="mt-10 divide-y divide-[var(--line)] border-y border-[var(--line)]">
          {small.map((item) => (
            <li key={item.slug}>
              <Link href={`/occasions/${item.slug}`} className="flex items-baseline justify-between gap-6 py-5 hover:text-[var(--oxblood)]">
                <span className="font-display text-2xl md:text-3xl">{item.title}</span>
                <span className="max-w-md text-right text-sm text-[var(--stone-dark)]">{item.prompt}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
