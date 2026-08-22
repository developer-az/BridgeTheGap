import { CoupleDate, CoupleDateKind, Invitation, Visit } from '@/types';
import { OCCASIONS, occasionDate } from './occasions';

function toIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function occurrenceInYear(month: number, day: number, year: number): string {
  return toIso(new Date(year, month - 1, day, 12));
}

export function occasionDatesForRange(from: Date, to: Date): CoupleDate[] {
  const years = new Set<number>([from.getFullYear(), to.getFullYear()]);
  const items: CoupleDate[] = [];

  for (const occasion of OCCASIONS) {
    if (!occasion.month || !occasion.day) continue;
    for (const year of years) {
      const iso = occurrenceInYear(occasion.month, occasion.day, year);
      if (iso < toIso(from) || iso > toIso(to)) continue;
      items.push({
        id: `occasion-${occasion.slug}-${year}`,
        user1_id: '',
        title: occasion.title,
        date: iso,
        kind: 'occasion',
        notes: occasion.prompt,
        recurring_yearly: true,
        source: 'occasion',
      });
    }
  }

  return items;
}

export function visitsAsDates(visits: Visit[], _userId: string): CoupleDate[] {
  return visits.map((visit) => ({
    id: `visit-${visit.id}`,
    user1_id: visit.user1_id,
    user2_id: visit.user2_id,
    title:
      visit.status === 'booked'
        ? 'Visit booked'
        : visit.status === 'accepted'
          ? 'Visit set'
          : 'Visit proposed',
    date: visit.start_date,
    end_date: visit.end_date,
    kind: 'visit' as CoupleDateKind,
    notes: visit.note,
    source: 'visit' as const,
    created_at: visit.created_at,
  }));
}

export function invitationsAsDates(invitations: Invitation[]): CoupleDate[] {
  return invitations
    .filter((item) => item.proposed_date)
    .map((item) => ({
      id: `invitation-${item.id}`,
      user1_id: item.from_user_id,
      user2_id: item.to_user_id,
      title: item.occasion_slug ? `Letter · ${item.occasion_slug}` : 'Letter date',
      date: item.proposed_date,
      kind: 'occasion' as CoupleDateKind,
      notes: item.body,
      source: 'invitation' as const,
      created_at: item.created_at,
    }));
}

export function mergeCoupleDates(parts: CoupleDate[][]): CoupleDate[] {
  const map = new Map<string, CoupleDate>();
  for (const list of parts) {
    for (const item of list) map.set(item.id, item);
  }
  return [...map.values()].sort(
    (a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title)
  );
}

export function datesInMonth(items: CoupleDate[], year: number, monthIndex: number): CoupleDate[] {
  const prefix = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
  return items.filter((item) => item.date.startsWith(prefix));
}

export function buildMonthGrid(year: number, monthIndex: number): Array<Date | null> {
  const first = new Date(year, monthIndex, 1);
  const startPad = first.getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells: Array<Date | null> = [];
  for (let i = 0; i < startPad; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(new Date(year, monthIndex, day, 12));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function kindLabel(kind: CoupleDateKind): string {
  switch (kind) {
    case 'anniversary':
      return 'Anniversary';
    case 'birthday':
      return 'Birthday';
    case 'first-met':
      return 'First met';
    case 'visit':
      return 'Visit';
    case 'occasion':
      return 'Occasion';
    default:
      return 'Ours';
  }
}

export function expandRecurring(items: CoupleDate[], from: Date, to: Date): CoupleDate[] {
  const out: CoupleDate[] = [];
  for (const item of items) {
    if (!item.recurring_yearly) {
      if (item.date >= toIso(from) && item.date <= toIso(to)) out.push(item);
      continue;
    }
    const base = new Date(`${item.date}T12:00:00`);
    for (let year = from.getFullYear(); year <= to.getFullYear(); year += 1) {
      const iso = occurrenceInYear(base.getMonth() + 1, base.getDate(), year);
      if (iso < toIso(from) || iso > toIso(to)) continue;
      out.push({ ...item, id: `${item.id}-${year}`, date: iso });
    }
  }
  return out;
}

/** Local calendar day as YYYY-MM-DD (avoids UTC shift from toISOString). */
export function localDateIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Strip yearly expansion suffix so deletes hit the real row. */
export function customDateDbId(id: string): string | null {
  if (
    id.startsWith('occasion-') ||
    id.startsWith('visit-') ||
    id.startsWith('invitation-')
  ) {
    return null;
  }
  const match = id.match(/^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?:-\d{4})?$/i);
  return match?.[1] || null;
}

export function nextOccasionHint(): { title: string; date: string; slug: string } | null {
  const now = new Date();
  let best: { title: string; date: string; slug: string; days: number } | null = null;
  for (const occasion of OCCASIONS) {
    const date = occasionDate(occasion, now);
    if (!date) continue;
    const days = Math.ceil((date.getTime() - now.getTime()) / 86400000);
    if (days < 0) continue;
    if (!best || days < best.days) {
      best = { title: occasion.title, date: toIso(date), slug: occasion.slug, days };
    }
  }
  return best ? { title: best.title, date: best.date, slug: best.slug } : null;
}
