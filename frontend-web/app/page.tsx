'use client';

import Link from 'next/link';
import { EnvelopeCard } from '@/components/Letter';
import { TravelSearchForm } from '@/components/TravelSearchForm';
import { Kicker, TextLink } from '@/components/ui';
import { occasionsByCollection, upcomingOccasions } from '@/lib/occasions';

export default function HomeLanding() {
  const upcoming = upcomingOccasions(new Date(), 4);
  const small = occasionsByCollection('small-nights');

  return (
    <div>
      <section className="relative isolate min-h-[100svh] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=2400&q=80')",
          }}
          aria-hidden
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(105deg, rgba(244,239,230,0.94) 0%, rgba(244,239,230,0.82) 42%, rgba(28,25,23,0.35) 100%)',
          }}
          aria-hidden
        />
        <div className="relative mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-end px-5 pb-16 pt-28 md:px-8 md:pb-24">
          <p className="hero-fade font-display text-5xl tracking-tight text-[var(--espresso)] md:text-7xl lg:text-8xl">
            Bridge
            <span className="ml-3 text-[0.28em] uppercase tracking-[0.28em] text-[var(--espresso-soft)]">
              the Gap
            </span>
          </p>
          <h1 className="hero-rise font-display mt-6 max-w-2xl text-3xl leading-tight text-[var(--espresso)] md:text-4xl">
            Plan the visit before you have to rush.
          </h1>
          <p className="hero-rise mt-4 max-w-md text-base leading-relaxed text-[var(--espresso-soft)] md:text-lg">
            Two calendars. One ticket. The dates that matter — kept in one house.
          </p>
          <div className="hero-rise mt-8 flex flex-wrap gap-4">
            <a
              href="#look"
              className="inline-flex bg-[var(--espresso)] px-6 py-3 text-[0.72rem] uppercase tracking-[0.18em] text-[var(--ivory)] transition-colors hover:bg-[var(--oxblood)]"
            >
              Look for a way
            </a>
            <Link
              href="/occasions"
              className="inline-flex border border-[var(--espresso)] px-6 py-3 text-[0.72rem] uppercase tracking-[0.18em] transition-colors hover:bg-[var(--espresso)] hover:text-[var(--ivory)]"
            >
              Browse occasions
            </Link>
          </div>
        </div>
      </section>

      <section id="look" className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-16">
        <Kicker>Travel</Kicker>
        <h2 className="font-display mt-3 text-3xl md:text-4xl">From here to there</h2>
        <div className="mt-6">
          <TravelSearchForm />
        </div>
        <p className="mt-3 text-[0.78rem] text-[var(--stone-dark)]">
          No account to look. A fare is marked live or estimate — we never pretend to sell the ticket.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-20">
        <div className="flex items-end justify-between gap-6">
          <div>
            <Kicker>This season</Kicker>
            <h2 className="font-display mt-3 text-4xl md:text-5xl">Letters, not reminders</h2>
          </div>
          <Link
            href="/occasions"
            className="hidden text-[0.72rem] uppercase tracking-[0.16em] hover:text-[var(--oxblood)] md:inline"
          >
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
              <Link
                href={`/occasions/${item.slug}`}
                className="flex items-baseline justify-between gap-6 py-5 hover:text-[var(--oxblood)]"
              >
                <span className="font-display text-2xl md:text-3xl">{item.title}</span>
                <span className="max-w-md text-right text-sm text-[var(--stone-dark)]">{item.prompt}</span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-8">
          <TextLink href="/occasions">All occasions</TextLink>
        </div>
      </section>
    </div>
  );
}
