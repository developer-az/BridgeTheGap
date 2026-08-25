'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { EnvelopeCard } from '@/components/Letter';
import { Button, EmptyState, Kicker, RoomGate } from '@/components/ui';
import { api } from '@/lib/api';
import { clearPendingPlan, readPendingPlan } from '@/lib/pending';
import { formatWindow } from '@/lib/availability';
import { nextEnvelopeOccasion } from '@/lib/occasions';
import { Connection, FreeWindow, Invitation, Visit } from '@/types';

export default function HomePage() {
  const { session, profile, loading, signOut } = useAuth();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [invites, setInvites] = useState<Invitation[]>([]);
  const [windows, setWindows] = useState<FreeWindow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [notice, setNotice] = useState('');

  const accepted = connections.filter((c) => c.status === 'accepted' && c.partner);
  const pendingIn = connections.filter((c) => c.status === 'pending');
  const partner = accepted[0]?.partner;
  const nextVisit = visits
    .filter((v) => v.status !== 'proposed' || true)
    .sort((a, b) => a.start_date.localeCompare(b.start_date))
    .find((v) => v.start_date >= new Date().toISOString().slice(0, 10)) || visits[0];
  const openLetter = invites.find((i) => i.status === 'sent' && i.to_user_id !== undefined) 
    || invites.find((i) => i.status === 'sent');
  const incomingLetter = invites.find((i) => i.status === 'sent' && i.from_user_id !== profile?.id);
  const season = nextEnvelopeOccasion();

  useEffect(() => {
    if (!session || loading) return;

    const load = async () => {
      try {
        const [conns, vs, letters] = await Promise.all([
          api.getConnections().catch(() => []),
          api.getVisits().catch(() => []),
          api.getInvitations().catch(() => []),
        ]);
        setConnections(conns);
        setVisits(vs);
        setInvites(letters);

        const first = (conns as Connection[]).find((c) => c.status === 'accepted' && c.partner);
        if (first?.partner?.id) {
          const mutual = await api.getMutualAvailability(first.partner.id).catch(() => null);
          setWindows(mutual?.windows?.slice(0, 3) || []);
        }

        const pending = readPendingPlan();
        if (pending) {
          try {
            await api.saveTravelPlan(pending);
            clearPendingPlan();
            setNotice('The trip you looked at is kept.');
          } catch {
            /* leave it */
          }
        }
      } finally {
        setLoaded(true);
      }
    };

    void load();
  }, [session, loading]);

  if (loading) {
    return <div className="px-5 py-32 text-center text-[var(--stone-dark)]">Opening the house…</div>;
  }

  if (!session) {
    return (
      <RoomGate
        title="This room is for the two of you."
        body="Travel and occasions stay open without an account. Home holds the visit, the letter, and the hours you both have."
      />
    );
  }

  if (!loaded) {
    return <div className="px-5 py-32 text-center text-[var(--stone-dark)]">Opening the house…</div>;
  }

  const firstName = profile?.name?.split(' ')[0] || 'You';

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 md:px-8 md:py-16">
      <div className="flex items-end justify-between gap-4">
        <div>
          <Kicker>Home</Kicker>
          <h1 className="font-display mt-3 text-4xl md:text-6xl">{firstName}’s house</h1>
        </div>
        <button type="button" onClick={() => signOut()} className="text-[0.72rem] uppercase tracking-[0.16em] text-[var(--stone-dark)] hover:text-[var(--espresso)]">
          Leave
        </button>
      </div>
      {notice && <p className="mt-4 text-sm text-[var(--live)]">{notice}</p>}

      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        <section className="border border-[var(--line)] bg-[var(--paper)] p-6 lg:col-span-2">
          <Kicker>The visit</Kicker>
          {nextVisit ? (
            <>
              <h2 className="font-display mt-3 text-4xl">{formatLong(nextVisit.start_date)}</h2>
              <p className="mt-2 text-[var(--espresso-soft)]">
                {nextVisit.status === 'booked' ? 'Booked' : nextVisit.status === 'accepted' ? 'Accepted' : 'Proposed'}
                {nextVisit.partner?.name ? ` · with ${nextVisit.partner.name}` : ''}
              </p>
              <div className="mt-6 flex gap-4">
                {nextVisit.status === 'proposed' && (
                  <Button onClick={() => api.updateVisit(nextVisit.id, { status: 'accepted' }).then(() => refreshVisits(setVisits))}>
                    Accept
                  </Button>
                )}
                {nextVisit.status === 'accepted' && (
                  <Button onClick={() => api.updateVisit(nextVisit.id, { status: 'booked' }).then(() => refreshVisits(setVisits))}>
                    Mark booked
                  </Button>
                )}
                <Link href="/travel" className="inline-flex items-center text-[0.72rem] uppercase tracking-[0.16em] hover:text-[var(--oxblood)]">
                  Find a way
                </Link>
              </div>
            </>
          ) : (
            <EmptyState
              title="No visit on the calendar yet"
              body="Pick a weekend you both still have. It stays until you change it."
              action={
                partner ? (
                  <ProposeVisit partnerId={partner.id} onCreated={() => refreshVisits(setVisits)} />
                ) : (
                  <Link href="/connect" className="text-[0.72rem] uppercase tracking-[0.16em] hover:text-[var(--oxblood)]">
                    Link them first
                  </Link>
                )
              }
            />
          )}
        </section>

        <section>
          {incomingLetter?.occasion ? (
            <Link href="/letters">
              <EnvelopeCard occasion={incomingLetter.occasion} />
              <p className="mt-3 text-[0.72rem] uppercase tracking-[0.16em] text-[var(--oxblood)]">A letter waiting</p>
            </Link>
          ) : season ? (
            <Link href={`/occasions/${season.slug}`}>
              <EnvelopeCard occasion={season} date={season.date} days={season.days} />
              <p className="mt-3 text-[0.72rem] uppercase tracking-[0.16em] text-[var(--stone-dark)]">Coming up · send it early</p>
            </Link>
          ) : openLetter?.occasion ? (
            <Link href="/letters">
              <EnvelopeCard occasion={openLetter.occasion} />
            </Link>
          ) : (
            <Link href="/occasions" className="block border border-[var(--line)] p-6">
              <Kicker>Letters</Kicker>
              <p className="font-display mt-3 text-3xl">Nothing unopened</p>
              <p className="mt-2 text-sm text-[var(--stone-dark)]">Browse the drawer when you want a date on paper.</p>
            </Link>
          )}
        </section>
      </div>

      <UpcomingDates partnerId={partner?.id} />

      <section className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="border border-[var(--line)] p-6">
          <Kicker>Hours you both have</Kicker>
          {partner && windows.length > 0 ? (
            <ul className="mt-5 space-y-3">
              {windows.map((window) => (
                <li key={`${window.day_of_week}-${window.start_time}`} className="font-display text-2xl">
                  {formatWindow(window)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm leading-relaxed text-[var(--espresso-soft)]">
              {partner
                ? 'Add your week and they add theirs. The overlap appears here.'
                : 'Once you are linked, this is the answer to “when can we talk.”'}
            </p>
          )}
          <Link href={partner ? '/together' : '/schedule'} className="mt-6 inline-block text-[0.72rem] uppercase tracking-[0.16em] hover:text-[var(--oxblood)]">
            {partner ? 'The full week' : 'Your week'}
          </Link>
        </div>

        <div className="border border-[var(--line)] p-6">
          <Kicker>Who is here</Kicker>
          {partner ? (
            <>
              <p className="font-display mt-4 text-3xl">{partner.name || partner.email}</p>
              <p className="mt-2 text-sm text-[var(--stone-dark)]">
                {[partner.university_name, partner.location_city].filter(Boolean).join(' · ')}
              </p>
              <Link
                href={`/travel?partner=${partner.id}`}
                className="mt-6 inline-block text-[0.72rem] uppercase tracking-[0.16em] hover:text-[var(--oxblood)]"
              >
                Toward them
              </Link>
            </>
          ) : pendingIn.length > 0 ? (
            <IncomingRequests items={pendingIn} onChange={setConnections} />
          ) : (
            <EmptyState
              title="No one linked yet"
              body="Give them your code. That is the whole introduction."
              action={
                <Link href="/connect" className="text-[0.72rem] uppercase tracking-[0.16em] hover:text-[var(--oxblood)]">
                  Your code
                </Link>
              }
            />
          )}
        </div>
      </section>
    </div>
  );
}

function formatLong(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

async function refreshVisits(setVisits: (visits: Visit[]) => void) {
  const next = await api.getVisits().catch(() => []);
  setVisits(next);
}

function ProposeVisit({ partnerId, onCreated }: { partnerId: string; onCreated: () => void }) {
  const [start, setStart] = useState('');
  return (
    <form
      className="flex flex-wrap items-end gap-3"
      onSubmit={async (event) => {
        event.preventDefault();
        await api.createVisit({ partner_id: partnerId, start_date: start, status: 'proposed' });
        onCreated();
      }}
    >
      <div>
        <label htmlFor="visit-start">Weekend</label>
        <input id="visit-start" type="date" required value={start} onChange={(e) => setStart(e.target.value)} />
      </div>
      <Button type="submit">Put it down</Button>
    </form>
  );
}

function UpcomingDates({ partnerId }: { partnerId?: string }) {
  const [items, setItems] = useState<{ id: string; title: string; date: string; kind: string }[]>([]);

  useEffect(() => {
    const now = new Date();
    api
      .getCoupleDates(now.getFullYear(), now.getMonth() + 1)
      .then((data: { upcoming?: { id: string; title: string; date: string; kind: string }[] }) => {
        setItems((data.upcoming || []).slice(0, 4));
      })
      .catch(() => setItems([]));
  }, []);

  return (
    <section className="mt-10 border border-[var(--line)] bg-[var(--paper)] p-6 reveal">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Kicker>Shared dates</Kicker>
          <h2 className="font-display mt-2 text-3xl">What is coming</h2>
        </div>
        <Link href="/calendar" className="text-[0.72rem] uppercase tracking-[0.16em] hover:text-[var(--oxblood)]">
          Open calendar
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="mt-4 max-w-lg text-sm leading-relaxed text-[var(--espresso-soft)]">
          Anniversaries, visits, and the days you name — they live on one wall. Add the first when you are ready.
        </p>
      ) : (
        <ul className="mt-5 divide-y divide-[var(--line)]">
          {items.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div>
                <p className="text-[0.65rem] uppercase tracking-[0.14em] text-[var(--stone-dark)]">{item.date}</p>
                <p className="font-display text-xl">{item.title}</p>
              </div>
              <Link
                href={`/travel?date=${item.date}${partnerId ? `&partner=${partnerId}` : ''}`}
                className="text-[0.68rem] uppercase tracking-[0.14em] text-[var(--espresso-soft)] hover:text-[var(--oxblood)]"
              >
                Cheapest trip
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function IncomingRequests({
  items,
  onChange,
}: {
  items: Connection[];
  onChange: (items: Connection[]) => void;
}) {
  return (
    <div className="mt-4 space-y-4">
      {items.map((item) => (
        <div key={item.id} className="border border-[var(--line)] p-4">
          <p className="font-display text-2xl">{item.partner?.name || 'Someone'}</p>
          <p className="text-sm text-[var(--stone-dark)]">{item.partner?.university_name}</p>
          <div className="mt-3 flex gap-4">
            <button
              type="button"
              className="text-[0.7rem] uppercase tracking-[0.16em] hover:text-[var(--oxblood)]"
              onClick={async () => {
                await api.acceptConnection(item.id);
                onChange(await api.getConnections());
              }}
            >
              Accept
            </button>
            <button
              type="button"
              className="text-[0.7rem] uppercase tracking-[0.16em] text-[var(--stone-dark)]"
              onClick={async () => {
                await api.deleteConnection(item.id);
                onChange(await api.getConnections());
              }}
            >
              Not now
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
