'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { WeekGrid } from '@/components/WeekGrid';
import { EmptyState, Kicker, RoomGate } from '@/components/ui';
import { api } from '@/lib/api';
import { formatWindow } from '@/lib/availability';
import { Connection, FreeWindow, MutualAvailability, ScheduleEntry } from '@/types';

export default function TogetherPage() {
  const { session, loading } = useAuth();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [partnerId, setPartnerId] = useState('');
  const [mutual, setMutual] = useState<MutualAvailability | null>(null);
  const [loaded, setLoaded] = useState(false);

  const accepted = connections.filter((c) => c.status === 'accepted' && c.partner);
  const partner = accepted.find((c) => c.partner.id === partnerId)?.partner || accepted[0]?.partner;
  const windows: FreeWindow[] = mutual?.windows || [];
  const highlight = windows.slice(0, 3).map((w) => w.day_of_week);

  useEffect(() => {
    if (!session || loading) return;
    api.getConnections().then((list: Connection[]) => {
      setConnections(list);
      const first = list.find((c) => c.status === 'accepted' && c.partner);
      if (first?.partner?.id) setPartnerId(first.partner.id);
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, [session, loading]);

  useEffect(() => {
    if (!session || !partnerId) return;
    api.getMutualAvailability(partnerId).then(setMutual).catch(() => setMutual(null));
  }, [session, partnerId]);

  if (loading) {
    return <div className="px-5 py-32 text-center text-[var(--stone-dark)]">Laying out the week…</div>;
  }

  if (!session) {
    return (
      <RoomGate
        title="Together is a private week."
        body="Two schedules on one grid. Sign in to see the hours that actually overlap."
      />
    );
  }

  if (!loaded) {
    return <div className="px-5 py-32 text-center text-[var(--stone-dark)]">Laying out the week…</div>;
  }

  if (!partner) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-16">
        <Kicker>Together</Kicker>
        <h1 className="font-display mt-3 text-5xl">No second calendar yet</h1>
        <div className="mt-8">
          <EmptyState
            title="Link them, then this page becomes the week"
            body="Until then, put your own classes down so you are ready."
            action={
              <div className="flex gap-5">
                <Link href="/connect" className="text-[0.72rem] uppercase tracking-[0.16em] hover:text-[var(--oxblood)]">Partner</Link>
                <Link href="/schedule" className="text-[0.72rem] uppercase tracking-[0.16em] hover:text-[var(--oxblood)]">Your week</Link>
              </div>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 md:px-8 md:py-16">
      <Kicker>Together</Kicker>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-4xl md:text-6xl">
          You and {partner.name?.split(' ')[0] || 'them'}
        </h1>
        {accepted.length > 1 && (
          <select value={partnerId} onChange={(e) => setPartnerId(e.target.value)} className="max-w-xs">
            {accepted.map((c) => (
              <option key={c.id} value={c.partner.id}>{c.partner.name || c.partner.email}</option>
            ))}
          </select>
        )}
      </div>

      <section className="mt-10 grid gap-4 md:grid-cols-3">
        {windows.slice(0, 3).map((window) => (
          <div key={`${window.day_of_week}-${window.start_time}`} className="border border-[var(--line)] bg-[var(--paper)] p-5">
            <p className="text-[0.68rem] uppercase tracking-[0.16em] text-[var(--stone-dark)]">Open</p>
            <p className="font-display mt-2 text-2xl leading-snug">{formatWindow(window)}</p>
          </div>
        ))}
        {windows.length === 0 && (
          <div className="md:col-span-3">
            <EmptyState
              title="No overlap on the grid yet"
              body="If either week is empty, add classes. If both are full, look at the edges — evenings still count."
              action={<Link href="/schedule" className="text-[0.72rem] uppercase tracking-[0.16em] hover:text-[var(--oxblood)]">Edit your week</Link>}
            />
          </div>
        )}
      </section>

      <div className="mt-10">
        <WeekGrid
          mine={(mutual?.mySchedule || []) as ScheduleEntry[]}
          theirs={(mutual?.partnerSchedule || []) as ScheduleEntry[]}
          highlightDays={highlight}
        />
      </div>

      <div className="mt-8 flex flex-wrap gap-6">
        <Link href="/schedule" className="text-[0.72rem] uppercase tracking-[0.16em] hover:text-[var(--oxblood)]">
          Your week
        </Link>
        <Link href={`/travel?partner=${partner.id}`} className="text-[0.72rem] uppercase tracking-[0.16em] hover:text-[var(--oxblood)]">
          Travel toward {partner.location_city || 'them'}
        </Link>
        <Link href="/letters" className="text-[0.72rem] uppercase tracking-[0.16em] hover:text-[var(--oxblood)]">
          Send a letter for one of these hours
        </Link>
      </div>
    </div>
  );
}
