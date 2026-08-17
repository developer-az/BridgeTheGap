import { Occasion } from '@/types';

export const OCCASIONS: Occasion[] = [
  {
    slug: 'halloween',
    title: 'Halloween',
    collection: 'seasonal',
    month: 10,
    day: 31,
    leadDays: 42,
    kicker: '31 October',
    prompt: 'Costumes, a film, or just the walk home in the cold. Decide it now.',
    letterGreeting: 'For the night of the 31st',
    letterBody:
      'If we wait until the week of, we will be tired and it will slip. Here is a date, a plan, and a yes waiting for you.',
    ideas: [
      { title: 'A film and candy from here', detail: 'Same movie, same start time, cameras off after.', effort: 'small' },
      { title: 'A visit built around the 31st', detail: 'Arrive Friday. Leave Sunday. One costume between two cities.', effort: 'full' },
      { title: 'A neighborhood walk', detail: 'If you are in the same place: leave the house, no reservation.', effort: 'small' },
    ],
  },
  {
    slug: 'valentines',
    title: "Valentine's Day",
    collection: 'seasonal',
    month: 2,
    day: 14,
    leadDays: 42,
    kicker: '14 February',
    prompt: 'The day gets expensive when it is last-minute. It gets easy when it is already on the calendar.',
    letterGreeting: 'For the 14th',
    letterBody:
      'Not a performance. A reserved evening, a train or a flight if we need it, and a time that is ours.',
    ideas: [
      { title: 'Dinner at one table', detail: 'Book the table when you send this letter, not the day of.', effort: 'full' },
      { title: 'Letters in the post', detail: 'Write them this week. They arrive when you cannot.', effort: 'small' },
      { title: 'A cooked meal on a call', detail: 'Same recipe, two kitchens, one hour.', effort: 'small' },
    ],
  },
  {
    slug: 'new-years',
    title: "New Year's Eve",
    collection: 'seasonal',
    month: 12,
    day: 31,
    leadDays: 45,
    kicker: '31 December',
    prompt: 'Tickets and trains vanish in December. Put a city on the letter now.',
    letterGreeting: 'For the last night of the year',
    letterBody:
      'We can be in one room, or on one call at midnight. Either way it should be chosen, not leftover.',
    ideas: [
      { title: 'One city, two tickets home after', detail: 'Pick who travels. Book the return for the 1st or 2nd.', effort: 'full' },
      { title: 'Midnight from two rooms', detail: 'Stay on the line from 11:30. No countdown video. Just be there.', effort: 'small' },
    ],
  },
  {
    slug: 'winter-break',
    title: 'Winter break',
    collection: 'long-weekends',
    month: 12,
    day: 20,
    leadDays: 50,
    kicker: 'Late December',
    prompt: 'The longest stretch you get. Protect a few days before the calendar fills with family only.',
    letterGreeting: 'For the break',
    letterBody:
      'Before we promise every day to other people, I am holding these dates for us.',
    ideas: [
      { title: 'Four nights in one place', detail: 'Not a tour. A kitchen, a bed, a week of ordinary time.', effort: 'full' },
      { title: 'The day after you both get home', detail: 'A first evening, even if the rest of break is split.', effort: 'small' },
    ],
  },
  {
    slug: 'summer-break',
    title: 'Summer',
    collection: 'long-weekends',
    month: 6,
    day: 1,
    leadDays: 60,
    kicker: 'June',
    prompt: 'Internships and sublets scatter people. Name the weeks you will be in the same city.',
    letterGreeting: 'For the summer',
    letterBody:
      'Tell me the weeks you can actually be here — or I will come there. We write it down so it does not become August panic.',
    ideas: [
      { title: 'A two-week overlap', detail: 'Same zip code. Work from the table. That is the visit.', effort: 'full' },
      { title: 'One long weekend a month', detail: 'Three visits beat one exhausted marathon in August.', effort: 'full' },
    ],
  },
  {
    slug: 'thanksgiving',
    title: 'Thanksgiving week',
    collection: 'long-weekends',
    month: 11,
    day: 26,
    leadDays: 40,
    kicker: 'Late November',
    prompt: 'Everyone travels. Fares jump. Decide whose table, and whose airport, early.',
    letterGreeting: 'For the long weekend',
    letterBody:
      'If we are splitting families, we still pick a night that is only ours — before or after the meal.',
    ideas: [
      { title: 'Arrive a day early', detail: 'The quiet night before the house fills.', effort: 'full' },
      { title: 'The Sunday return, together as far as you can', detail: 'Same airport, same wait, then the split.', effort: 'small' },
    ],
  },
  {
    slug: 'spring-break',
    title: 'Spring break',
    collection: 'long-weekends',
    month: 3,
    day: 15,
    leadDays: 45,
    kicker: 'March',
    prompt: 'Campuses empty on different weeks. Overlay the calendars before you assume you match.',
    letterGreeting: 'For the break in March',
    letterBody:
      'Our weeks may not line up. If they do not, we pick one weekend and treat it as the break.',
    ideas: [
      { title: 'The overlapping days only', detail: 'Do not force a full week. Keep what you both actually have.', effort: 'full' },
      { title: 'A cheap city between you', detail: 'Meet in the middle if neither campus works.', effort: 'full' },
    ],
  },
  {
    slug: 'small-thursday',
    title: 'A Thursday in',
    collection: 'small-nights',
    month: 0,
    day: 0,
    leadDays: 7,
    kicker: 'Any week',
    prompt: 'Not a holiday. A night you both keep, so the week has a middle.',
    letterGreeting: 'For Thursday',
    letterBody:
      'No occasion. I am putting Thursday on the table so we do not only talk when something is wrong.',
    ideas: [
      { title: 'Cook the same thing', detail: 'One recipe, two stoves, cameras on the counter.', effort: 'small' },
      { title: 'A walk with the phone in a pocket', detail: 'Forty minutes. No agenda.', effort: 'small' },
    ],
  },
  {
    slug: 'grocery-date',
    title: 'Errands, together',
    collection: 'small-nights',
    month: 0,
    day: 0,
    leadDays: 10,
    kicker: 'Ordinary',
    prompt: 'The visit is better when it includes the boring parts.',
    letterGreeting: 'For a useless afternoon',
    letterBody:
      'When you are here, we do the grocery run. That is the date. It is how a house feels.',
    ideas: [
      { title: 'The shop and the walk back', detail: 'List on a note. Nothing booked.', effort: 'small' },
      { title: 'Laundry and a film', detail: 'The machines running. Something easy on.', effort: 'small' },
    ],
  },
  {
    slug: 'first-weekend',
    title: 'The next open weekend',
    collection: 'small-nights',
    month: 0,
    day: 0,
    leadDays: 14,
    kicker: 'Soon',
    prompt: 'Not a holiday. The first Saturday you both still have.',
    letterGreeting: 'For the coming weekend',
    letterBody:
      'If we keep waiting for a perfect stretch, we will keep rushing. This is the next one that is free.',
    ideas: [
      { title: 'Arrive Friday night', detail: 'Even if Sunday is short. The evening is the visit.', effort: 'full' },
      { title: 'A day trip if neither can host', detail: 'One city between the two of you. Home the same night.', effort: 'full' },
    ],
  },
];

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function getOccasion(slug: string): Occasion | undefined {
  return OCCASIONS.find((item) => item.slug === slug);
}

export function occasionsByCollection(collection: Occasion['collection']): Occasion[] {
  return OCCASIONS.filter((item) => item.collection === collection);
}

function occurrenceThisOrNextYear(month: number, day: number, from: Date): Date {
  const year = from.getFullYear();
  let next = new Date(year, month - 1, day);
  next.setHours(12, 0, 0, 0);
  if (next.getTime() < from.getTime() - 12 * 60 * 60 * 1000) {
    next = new Date(year + 1, month - 1, day);
    next.setHours(12, 0, 0, 0);
  }
  return next;
}

export function occasionDate(occasion: Occasion, from = new Date()): Date | null {
  if (!occasion.month || !occasion.day) return null;
  return occurrenceThisOrNextYear(occasion.month, occasion.day, from);
}

export function daysUntil(occasion: Occasion, from = new Date()): number | null {
  const date = occasionDate(occasion, from);
  if (!date) return null;
  return Math.ceil((date.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

export function isOccasionLive(occasion: Occasion, from = new Date()): boolean {
  if (!occasion.month || !occasion.day) return true;
  const remaining = daysUntil(occasion, from);
  if (remaining === null) return false;
  return remaining >= 0 && remaining <= occasion.leadDays;
}

export function upcomingOccasions(from = new Date(), limit = 6): Array<Occasion & { date: Date | null; days: number | null }> {
  const dated = OCCASIONS.map((occasion) => {
    const date = occasionDate(occasion, from);
    const days = daysUntil(occasion, from);
    return { ...occasion, date, days };
  });

  const seasonal = dated
    .filter((item) => item.month && item.days !== null)
    .sort((a, b) => (a.days ?? 999) - (b.days ?? 999));

  const small = dated.filter((item) => !item.month);

  const live = seasonal.filter((item) => isOccasionLive(item, from));
  const rest = seasonal.filter((item) => !isOccasionLive(item, from));

  return [...live, ...small.slice(0, 2), ...rest].slice(0, limit);
}

export function nextDatedOccasion(from = new Date()): (Occasion & { date: Date; days: number }) | null {
  const next = OCCASIONS
    .map((occasion) => {
      const date = occasionDate(occasion, from);
      const days = daysUntil(occasion, from);
      return date && days !== null ? { ...occasion, date, days } : null;
    })
    .filter((item): item is Occasion & { date: Date; days: number } => Boolean(item))
    .sort((a, b) => a.days - b.days)[0];

  return next ?? null;
}

export function formatOccasionDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  });
}

export function nextWeekendDate(from = new Date()): string {
  const date = new Date(from);
  const day = date.getDay();
  const add = day <= 6 ? (6 - day + 7) % 7 || 7 : 7;
  date.setDate(date.getDate() + (day === 6 ? 7 : add));
  return date.toISOString().slice(0, 10);
}

export function weekdayName(day: number): string {
  return WEEKDAYS[day] || '';
}
