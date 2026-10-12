'use client';

import { useEffect, useState } from 'react';
import { useAuth } from './AuthProvider';
import { api } from '@/lib/api';
import { buildWaitingRoom } from '@/lib/waiting-room';
import { Connection, CoupleDate, Invitation, Visit } from '@/types';

export function useWaitingRoom() {
  const { session, profile, loading } = useAuth();
  const [state, setState] = useState(() =>
    buildWaitingRoom({ profileId: profile?.id })
  );

  useEffect(() => {
    if (!session || loading) return;

    const load = async () => {
      try {
        const [connections, visits, invitations] = await Promise.all([
          api.getConnections().catch(() => [] as Connection[]),
          api.getVisits().catch(() => [] as Visit[]),
          api.getInvitations().catch(() => [] as Invitation[]),
        ]);

        const partner = (connections as Connection[]).find(
          (c) => c.status === 'accepted' && c.partner
        )?.partner;

        const now = new Date();
        let upcomingDates: CoupleDate[] = [];
        try {
          const data = await api.getCoupleDates(now.getFullYear(), now.getMonth() + 1);
          upcomingDates = (data as { upcoming?: CoupleDate[] }).upcoming || [];
        } catch {
          /* optional */
        }

        setState(
          buildWaitingRoom({
            profileId: profile?.id,
            partner,
            connections,
            visits,
            invitations,
            upcomingDates,
          })
        );
      } catch {
        /* keep prior state */
      }
    };

    void load();
  }, [session, loading, profile?.id]);

  return { state, loading: loading || !session };
}

export function NavPendingBadge({ href }: { href: string }) {
  const { state, loading } = useWaitingRoom();
  if (loading) return null;

  const relevant =
    (href === '/letters' &&
      state.items.some((i) => i.kind === 'letter-incoming' && i.glow)) ||
    (href === '/connect' &&
      state.items.some((i) => i.kind === 'connection-pending' && i.glow)) ||
    (href === '/home' && state.glowCount > 0) ||
    (href === '/calendar' &&
      state.items.some((i) => (i.kind === 'visit-soon' || i.kind === 'date-upcoming') && i.glow));

  if (!relevant) return null;
  return <span className="nav-badge" aria-label="Something waiting" />;
}
