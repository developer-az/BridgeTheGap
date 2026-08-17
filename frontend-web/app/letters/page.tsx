'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { EnvelopeCard, LetterSheet } from '@/components/Letter';
import { Button, EmptyState, Kicker, RoomGate } from '@/components/ui';
import { api } from '@/lib/api';
import { Invitation } from '@/types';
import { formatOccasionDate, getOccasion } from '@/lib/occasions';

export default function LettersPage() {
  const { session, profile, loading } = useAuth();
  const [letters, setLetters] = useState<Invitation[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!session || loading) return;
    api.getInvitations().then((list: Invitation[]) => {
      setLetters(list);
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, [session, loading]);

  if (loading) {
    return <div className="px-5 py-32 text-center text-[var(--stone-dark)]">The drawer…</div>;
  }

  if (!session) {
    return (
      <RoomGate
        title="Letters live here once they are sent."
        body="You can still browse the lookbook without an account. Sending needs a name on the envelope."
      />
    );
  }

  if (!loaded) {
    return <div className="px-5 py-32 text-center text-[var(--stone-dark)]">The drawer…</div>;
  }

  const incoming = letters.filter((l) => l.from_user_id !== profile?.id);
  const outgoing = letters.filter((l) => l.from_user_id === profile?.id);
  const opened = letters.find((l) => l.id === openId);

  const act = async (id: string, status: string) => {
    const updated = await api.updateInvitation(id, { status, opened: true });
    setLetters((current) => current.map((item) => (item.id === id ? { ...item, ...updated } : item)));
    if (status === 'accepted' && updated.to_user_id) {
      try {
        await api.createVisit({
          partner_id: updated.from_user_id === profile?.id ? updated.to_user_id : updated.from_user_id,
          start_date: updated.proposed_date,
          status: 'accepted',
          note: updated.occasion_slug,
        });
      } catch {
        /* visit table may be missing */
      }
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 md:px-8 md:py-16">
      <div className="flex items-end justify-between">
        <div>
          <Kicker>The drawer</Kicker>
          <h1 className="font-display mt-3 text-4xl md:text-6xl">Letters</h1>
        </div>
        <Link href="/occasions" className="text-[0.72rem] uppercase tracking-[0.16em] hover:text-[var(--oxblood)]">
          Write one
        </Link>
      </div>

      {opened && (
        <div className="mt-10">
          <LetterSheet
            greeting={opened.occasion?.letterGreeting || 'For you'}
            body={opened.body}
          >
            <p className="mt-8 text-sm text-[var(--stone-dark)]">
              {opened.proposed_date ? formatOccasionDate(new Date(`${opened.proposed_date}T12:00:00`)) : ''}
              {' · '}
              {opened.status}
            </p>
            {opened.from_user_id !== profile?.id && opened.status === 'sent' && (
              <div className="mt-8 flex gap-4">
                <Button onClick={() => act(opened.id, 'accepted')}>Accept</Button>
                <Button variant="line" onClick={() => act(opened.id, 'later')}>Later</Button>
                <Button variant="ghost" onClick={() => act(opened.id, 'declined')}>Not this</Button>
              </div>
            )}
          </LetterSheet>
        </div>
      )}

      <section className="mt-14">
        <h2 className="font-display text-3xl">Waiting</h2>
        {incoming.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--stone-dark)]">Nothing unopened. The lookbook is still there when you want to send one.</p>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {incoming.map((letter) => {
              const occasion = letter.occasion || getOccasion(letter.occasion_slug);
              if (!occasion) return null;
              return (
                <EnvelopeCard
                  key={letter.id}
                  occasion={occasion}
                  onOpen={() => {
                    setOpenId(letter.id);
                    if (!letter.opened_at) api.updateInvitation(letter.id, { opened: true }).catch(() => {});
                  }}
                />
              );
            })}
          </div>
        )}
      </section>

      <section className="mt-14">
        <h2 className="font-display text-3xl">Sent</h2>
        {outgoing.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title="You have not sent one yet"
              body="Halloween, Valentine’s, or a Thursday — pick it while there is still time."
              action={<Link href="/occasions" className="text-[0.72rem] uppercase tracking-[0.16em] hover:text-[var(--oxblood)]">The lookbook</Link>}
            />
          </div>
        ) : (
          <ul className="mt-6 divide-y divide-[var(--line)] border-y border-[var(--line)]">
            {outgoing.map((letter) => (
              <li key={letter.id} className="flex items-center justify-between py-4">
                <button type="button" className="text-left" onClick={() => setOpenId(letter.id)}>
                  <p className="font-display text-2xl">{letter.occasion?.title || letter.occasion_slug}</p>
                  <p className="text-sm text-[var(--stone-dark)]">{letter.proposed_date} · {letter.status}</p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
