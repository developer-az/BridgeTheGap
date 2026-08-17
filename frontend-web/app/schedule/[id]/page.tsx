'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { WeekGrid } from '@/components/WeekGrid';
import { Kicker, RoomGate } from '@/components/ui';
import { api } from '@/lib/api';
import { ScheduleEntry, User } from '@/types';

export default function PartnerSchedulePage() {
  const params = useParams();
  const { session, loading } = useAuth();
  const partnerId = String(params.id || '');
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [partner, setPartner] = useState<User | null>(null);

  useEffect(() => {
    if (!session || !partnerId) return;
    api.getUserSchedule(partnerId).then(setSchedule).catch(() => setSchedule([]));
    api.getUser(partnerId).then(setPartner).catch(() => setPartner(null));
  }, [session, partnerId]);

  if (!loading && !session) {
    return <RoomGate title="Their week is private." body="Sign in as their linked partner to see it." />;
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 md:px-8 md:py-16">
      <Kicker>Their week</Kicker>
      <h1 className="font-display mt-3 text-4xl md:text-6xl">{partner?.name || 'Partner'}</h1>
      <p className="mt-4 text-[var(--espresso-soft)]">
        For the overlay — both calendars at once — use Together.
      </p>
      <div className="mt-10">
        <WeekGrid mine={schedule} />
      </div>
      <Link href="/together" className="mt-8 inline-block text-[0.72rem] uppercase tracking-[0.16em] hover:text-[var(--oxblood)]">
        Together
      </Link>
    </div>
  );
}
