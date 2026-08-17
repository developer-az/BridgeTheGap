'use client';

import Link from 'next/link';
import { EnvelopeCard } from '@/components/Letter';
import { Kicker } from '@/components/ui';
import { OCCASIONS, occasionDate, daysUntil, occasionsByCollection } from '@/lib/occasions';

const collections = [
  { id: 'seasonal' as const, title: 'The year', intro: 'The days people rush. Put them on paper early.' },
  { id: 'long-weekends' as const, title: 'The breaks', intro: 'Weeks that vanish into family calendars unless you claim a few.' },
  { id: 'small-nights' as const, title: 'Small nights', intro: 'Ordinary time. The part that makes a visit feel like a house.' },
];

export default function OccasionsPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-12 md:px-8 md:py-16">
      <Kicker>Lookbook</Kicker>
      <h1 className="font-display mt-3 text-4xl md:text-6xl">Occasions</h1>
      <p className="mt-4 max-w-xl text-[var(--espresso-soft)]">
        Halloween, Valentine’s, a Thursday. Open a letter, pick a date, send it when you have someone to send it to.
      </p>

      {collections.map((collection) => {
        const items = occasionsByCollection(collection.id);
        return (
          <section key={collection.id} className="mt-16">
            <h2 className="font-display text-3xl md:text-4xl">{collection.title}</h2>
            <p className="mt-2 max-w-lg text-sm text-[var(--espresso-soft)]">{collection.intro}</p>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => {
                const date = occasionDate(item);
                return (
                  <Link key={item.slug} href={`/occasions/${item.slug}`}>
                    <EnvelopeCard occasion={item} date={date} days={daysUntil(item)} />
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}

      <p className="mt-16 text-sm text-[var(--stone-dark)]">
        {OCCASIONS.length} letters in the drawer. None of them require an account to read.
      </p>
    </div>
  );
}
