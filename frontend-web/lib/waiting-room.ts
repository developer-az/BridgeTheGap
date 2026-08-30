import { Connection, CoupleDate, Invitation, User, Visit } from '@/types';
import { daysUntil, isOccasionLive, nextDatedOccasion, upcomingOccasions } from './occasions';

export type WaitingKind =
  | 'letter-incoming'
  | 'letter-outgoing'
  | 'visit-incoming'
  | 'visit-outgoing'
  | 'visit-soon'
  | 'connection-pending'
  | 'occasion-live'
  | 'date-upcoming'
  | 'partner-missing';

export interface WaitingItem {
  id: string;
  kind: WaitingKind;
  priority: number;
  title: string;
  subtitle: string;
  daysUntil: number | null;
  href: string;
  glow: boolean;
  partnerName?: string;
  occasionSlug?: string;
}

export interface WaitingRoomState {
  headline: string;
  subline: string;
  primary: WaitingItem | null;
  items: WaitingItem[];
  glowCount: number;
  partner: User | null;
}

function daysFromToday(iso: string, from = new Date()): number {
  const target = new Date(`${iso}T12:00:00`);
  const start = new Date(from);
  start.setHours(12, 0, 0, 0);
  return Math.ceil((target.getTime() - start.getTime()) / 86400000);
}

function partnerFirstName(partner?: User | null): string {
  return partner?.name?.split(' ')[0] || partner?.email?.split('@')[0] || 'them';
}

function todayIso(from = new Date()): string {
  return from.toISOString().slice(0, 10);
}

export function buildWaitingRoom(input: {
  profileId?: string;
  partner?: User | null;
  connections?: Connection[];
  visits?: Visit[];
  invitations?: Invitation[];
  upcomingDates?: CoupleDate[];
  from?: Date;
}): WaitingRoomState {
  const from = input.from ?? new Date();
  const profileId = input.profileId;
  const partner = input.partner ?? null;
  const partnerName = partnerFirstName(partner);
  const items: WaitingItem[] = [];

  const pendingIn = (input.connections ?? []).filter((c) => c.status === 'pending');
  for (const conn of pendingIn) {
    const name = partnerFirstName(conn.partner);
    items.push({
      id: `conn-${conn.id}`,
      kind: 'connection-pending',
      priority: 1,
      title: `${name} wants to find you`,
      subtitle: 'Someone is holding your code at the door.',
      daysUntil: null,
      href: '/connect',
      glow: true,
      partnerName: name,
    });
  }

  for (const letter of input.invitations ?? []) {
    if (letter.status !== 'sent') continue;
    const isIncoming = letter.from_user_id !== profileId;
    const fromName = partnerFirstName(letter.from_user ?? (isIncoming ? partner : undefined));
    const occasionTitle = letter.occasion?.title || 'A letter';

    if (isIncoming) {
      items.push({
        id: `letter-in-${letter.id}`,
        kind: 'letter-incoming',
        priority: 0,
        title: `${fromName} sent you ${occasionTitle}`,
        subtitle: 'It is waiting in the drawer, unopened.',
        daysUntil: letter.proposed_date ? daysFromToday(letter.proposed_date, from) : null,
        href: '/letters',
        glow: true,
        partnerName: fromName,
        occasionSlug: letter.occasion_slug,
      });
    } else {
      items.push({
        id: `letter-out-${letter.id}`,
        kind: 'letter-outgoing',
        priority: 5,
        title: `Waiting for ${partnerName} to open it`,
        subtitle: `${occasionTitle} — sent, not yet answered.`,
        daysUntil: letter.proposed_date ? daysFromToday(letter.proposed_date, from) : null,
        href: '/letters',
        glow: false,
        partnerName,
        occasionSlug: letter.occasion_slug,
      });
    }
  }

  for (const visit of input.visits ?? []) {
    const isIncoming = visit.user1_id !== profileId && visit.status === 'proposed';
    const isOutgoing = visit.user1_id === profileId && visit.status === 'proposed';
    const days = daysFromToday(visit.start_date, from);

    if (isIncoming) {
      items.push({
        id: `visit-in-${visit.id}`,
        kind: 'visit-incoming',
        priority: 2,
        title: `${partnerName} proposed a visit`,
        subtitle: formatVisitDate(visit.start_date),
        daysUntil: days,
        href: '/home',
        glow: true,
        partnerName,
      });
    } else if (isOutgoing) {
      items.push({
        id: `visit-out-${visit.id}`,
        kind: 'visit-outgoing',
        priority: 6,
        title: `Waiting for ${partnerName} to say yes`,
        subtitle: formatVisitDate(visit.start_date),
        daysUntil: days,
        href: '/home',
        glow: false,
        partnerName,
      });
    } else if (visit.status !== 'proposed' && visit.start_date >= todayIso(from)) {
      items.push({
        id: `visit-soon-${visit.id}`,
        kind: 'visit-soon',
        priority: 3,
        title:
          visit.status === 'booked'
            ? `You're seeing ${partnerName} soon`
            : `${partnerName} is coming`,
        subtitle: formatVisitDate(visit.start_date),
        daysUntil: days,
        href: '/calendar',
        glow: days <= 14,
        partnerName,
      });
    }
  }

  const liveOccasions = upcomingOccasions(from, 8).filter(
    (item) => item.month && item.days !== null && isOccasionLive(item, from)
  );

  for (const occasion of liveOccasions) {
    const alreadyLettered = (input.invitations ?? []).some(
      (l) =>
        l.occasion_slug === occasion.slug &&
        (l.status === 'sent' || l.status === 'accepted')
    );
    if (alreadyLettered) continue;

    items.push({
      id: `occasion-${occasion.slug}`,
      kind: 'occasion-live',
      priority: occasion.days !== null && occasion.days <= 21 ? 3 : 4,
      title: `${occasion.title} is coming`,
      subtitle:
        occasion.days !== null && occasion.days <= 7
          ? 'This week — put something on paper.'
          : 'Send a letter before the week gets away from you.',
      daysUntil: occasion.days,
      href: `/occasions/${occasion.slug}`,
      glow: occasion.days !== null && occasion.days <= 42,
      occasionSlug: occasion.slug,
    });
  }

  for (const date of input.upcomingDates ?? []) {
    if (date.source === 'visit' || date.source === 'invitation' || date.source === 'occasion') {
      continue;
    }
    const days = daysFromToday(date.date, from);
    if (days < 0 || days > 90) continue;
    items.push({
      id: `date-${date.id}`,
      kind: 'date-upcoming',
      priority: 7,
      title: date.title,
      subtitle: days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : formatShortDate(date.date),
      daysUntil: days,
      href: '/calendar',
      glow: days <= 7,
    });
  }

  items.sort((a, b) => a.priority - b.priority || (a.daysUntil ?? 999) - (b.daysUntil ?? 999));

  const glowCount = items.filter((item) => item.glow).length;
  const primary = items[0] ?? null;

  let headline: string;
  let subline: string;

  if (!partner) {
    headline = pendingIn.length > 0 ? 'Someone is at the door' : 'The house is quiet';
    subline =
      pendingIn.length > 0
        ? 'Accept them, and the waiting begins.'
        : 'Link your person. Then every date has a name on it.';
  } else if (primary?.kind === 'letter-incoming') {
    headline = `${partnerName} wrote to you`;
    subline = 'There is something in the drawer with your name on it.';
  } else if (primary?.kind === 'visit-soon' && primary.daysUntil !== null && primary.daysUntil <= 7) {
    headline =
      primary.daysUntil === 0
        ? `Today with ${partnerName}`
        : primary.daysUntil === 1
          ? `Tomorrow with ${partnerName}`
          : `${primary.daysUntil} days until ${partnerName}`;
    subline = 'The visit is real. It is on the calendar.';
  } else if (primary?.kind === 'occasion-live') {
    headline = `Waiting for ${primary.title}`;
    subline = partner
      ? `You and ${partnerName} still have time to decide it together.`
      : 'Put a date on paper before the week fills up.';
  } else if (primary?.kind === 'visit-incoming') {
    headline = `${partnerName} picked a weekend`;
    subline = 'They are waiting for your yes.';
  } else if (primary?.kind === 'visit-outgoing' || primary?.kind === 'letter-outgoing') {
    headline = `Waiting for ${partnerName}`;
    subline = 'They have not answered yet. That is alright.';
  } else {
    const nextOcc = nextDatedOccasion(from);
    headline = partner ? `Waiting with ${partnerName}` : 'Waiting for what comes next';
    subline = nextOcc
      ? `${nextOcc.title} is ${nextOcc.days} days away — plenty of time to plan.`
      : 'The calendar is open. Pick the next thing together.';
  }

  return {
    headline,
    subline,
    primary,
    items,
    glowCount,
    partner: partner ?? null,
  };
}

export function countGlowingItems(state: WaitingRoomState): number {
  return state.glowCount;
}

function formatVisitDate(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function formatShortDate(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  });
}

export function kindIcon(kind: WaitingKind): string {
  switch (kind) {
    case 'letter-incoming':
    case 'letter-outgoing':
      return '✉';
    case 'visit-incoming':
    case 'visit-outgoing':
    case 'visit-soon':
      return '→';
    case 'connection-pending':
      return '◦';
    case 'occasion-live':
      return '✦';
    case 'date-upcoming':
      return '·';
    case 'partner-missing':
      return '—';
    default:
      return '·';
  }
}
