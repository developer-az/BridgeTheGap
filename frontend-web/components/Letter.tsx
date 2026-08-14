'use client';

import { Occasion } from '@/types';
import { formatOccasionDate } from '@/lib/occasions';

export function EnvelopeCard({
  occasion,
  date,
  days,
  onOpen,
}: {
  occasion: Occasion;
  date?: Date | null;
  days?: number | null;
  onOpen?: () => void;
}) {
  return (
    <button type="button" onClick={onOpen} className="envelope w-full text-left">
      <span className="envelope-flap" />
      <span className="envelope-seal" />
      <div className="absolute inset-x-0 bottom-0 p-5">
        <p className="text-[0.62rem] uppercase tracking-[0.18em] text-[var(--stone-dark)]">
          {date ? formatOccasionDate(date) : occasion.kicker}
          {typeof days === 'number' && days >= 0 ? ` · ${days} days` : ''}
        </p>
        <p className="font-display mt-1 text-2xl">{occasion.title}</p>
      </div>
    </button>
  );
}

export function LetterSheet({
  greeting,
  body,
  children,
}: {
  greeting: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <article className="letter-sheet px-7 py-10 md:px-12 md:py-14">
      <p className="font-display text-sm italic text-[var(--stone-dark)]">{greeting}</p>
      <p className="font-display mt-6 text-2xl leading-snug md:text-3xl">{body}</p>
      {children}
    </article>
  );
}
