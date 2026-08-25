'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { AuthGate } from '@/components/AuthGate';
import { LetterSheet } from '@/components/Letter';
import { Button, ButtonLink, Kicker } from '@/components/ui';
import { useAuth } from '@/components/AuthProvider';
import { api } from '@/lib/api';
import { getOccasion, occasionDate, formatOccasionDate, nextWeekendDate } from '@/lib/occasions';
import { Connection } from '@/types';
import { useEffect } from 'react';

export default function OccasionDetailPage() {
  const params = useParams();
  const slug = String(params.slug || '');
  const occasion = getOccasion(slug);
  const { session } = useAuth();
  const [open, setOpen] = useState(true);
  const [gate, setGate] = useState(false);
  const [partnerId, setPartnerId] = useState('');
  const [date, setDate] = useState(() => {
    if (!occasion) return nextWeekendDate();
    const dated = occasionDate(occasion);
    return dated ? dated.toISOString().slice(0, 10) : nextWeekendDate();
  });
  const [note, setNote] = useState(() => occasion?.letterBody || '');
  const [partners, setPartners] = useState<Connection[]>([]);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!session) return;
    api.getConnections().then((list: Connection[]) => {
      const accepted = list.filter((item) => item.status === 'accepted' && item.partner);
      setPartners(accepted);
      if (accepted[0]) setPartnerId(accepted[0].partner.id);
    }).catch(() => {});
  }, [session]);

  const dated = useMemo(() => (occasion ? occasionDate(occasion) : null), [occasion]);

  if (!occasion) {
    return (
      <div className="mx-auto max-w-xl px-5 py-24">
        <h1 className="font-display text-4xl">That letter is not in the drawer.</h1>
        <ButtonLink href="/occasions" variant="ghost" className="mt-6">
          Back to occasions
        </ButtonLink>
      </div>
    );
  }

  const send = async (event: FormEvent) => {
    event.preventDefault();
    if (!session) {
      setGate(true);
      return;
    }
    if (!partnerId) {
      setError('Link a partner first — then the letter has somewhere to go.');
      return;
    }
    setError('');
    try {
      await api.sendInvitation({
        to_user_id: partnerId,
        occasion_slug: occasion.slug,
        proposed_date: date,
        body: note,
      });
      setStatus('Sent. It will be waiting on their home.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not send');
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 md:px-8 md:py-16">
      <Kicker>{occasion.kicker}{dated ? ` · ${formatOccasionDate(dated)}` : ''}</Kicker>
      <h1 className="font-display mt-3 text-5xl md:text-6xl">{occasion.title}</h1>
      <p className="mt-4 text-[var(--espresso-soft)]">{occasion.prompt}</p>

      {!open ? (
        <button type="button" className="envelope mt-10 w-full max-w-md" onClick={() => setOpen(true)}>
          <span className="envelope-flap" />
          <span className="envelope-seal" />
          <span className="absolute inset-x-0 bottom-5 px-5 font-display text-2xl">Open</span>
        </button>
      ) : (
        <div className="mt-10">
          <LetterSheet greeting={occasion.letterGreeting} body={occasion.letterBody}>
            <ul className="mt-10 space-y-5">
              {occasion.ideas.map((idea) => (
                <li key={idea.title}>
                  <p className="text-[0.68rem] uppercase tracking-[0.16em] text-[var(--stone-dark)]">
                    {idea.effort === 'small' ? 'Small' : 'A visit'}
                  </p>
                  <p className="font-display text-2xl">{idea.title}</p>
                  <p className="mt-1 text-sm text-[var(--espresso-soft)]">{idea.detail}</p>
                </li>
              ))}
            </ul>
          </LetterSheet>
        </div>
      )}

      <form onSubmit={send} className="mt-12 space-y-5 border border-[var(--line)] bg-[var(--paper)] p-6">
        <h2 className="font-display text-3xl">Send this</h2>
        {partners.length > 0 && (
          <div>
            <label htmlFor="partner">To</label>
            <select id="partner" value={partnerId} onChange={(e) => setPartnerId(e.target.value)}>
              {partners.map((item) => (
                <option key={item.id} value={item.partner.id}>
                  {item.partner.name || item.partner.email}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label htmlFor="proposed">The date</label>
          <input id="proposed" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="note">The note</label>
          <textarea id="note" rows={4} value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        {error && <p className="text-sm text-[var(--oxblood)]">{error}</p>}
        {status && <p className="text-sm text-[var(--live)]">{status}</p>}
        <Button type="submit">Send the letter</Button>
      </form>

      <AuthGate
        open={gate}
        onClose={() => setGate(false)}
        intent="Letters need a name on them."
        nextPath={`/occasions/${occasion.slug}`}
      />
    </div>
  );
}
