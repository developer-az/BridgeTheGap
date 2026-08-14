'use client';

import { FormEvent, Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AuthGate } from '@/components/AuthGate';
import { OfferCard } from '@/components/OfferCard';
import { Button, EmptyState, Kicker } from '@/components/ui';
import { useAuth } from '@/components/AuthProvider';
import { api } from '@/lib/api';
import { stashPendingPlan } from '@/lib/pending';
import { FlightOffer, GroundTransport, TravelPlan, TravelSearchResults, User } from '@/types';

function asList<T>(value: T[] | { error: string } | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function TravelPageInner() {
  const searchParams = useSearchParams();
  const { session, profile } = useAuth();
  const [origin, setOrigin] = useState(searchParams.get('origin') || '');
  const [destination, setDestination] = useState(searchParams.get('destination') || '');
  const [date, setDate] = useState(searchParams.get('date') || '');
  const [returnDate, setReturnDate] = useState(searchParams.get('return') || '');
  const [modes, setModes] = useState<string[]>(['flight', 'train', 'bus']);
  const [results, setResults] = useState<TravelSearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState<TravelPlan[]>([]);
  const [gateOpen, setGateOpen] = useState(false);
  const [partner, setPartner] = useState<User | null>(null);

  const partnerId = searchParams.get('partner');

  useEffect(() => {
    if (!session) return;
    api.getTravelPlans().then(setSaved).catch(() => setSaved([]));
  }, [session]);

  useEffect(() => {
    if (!partnerId || !session) return;
    api.getUser(partnerId).then((person: User) => {
      setPartner(person);
      if (person.location_city && !searchParams.get('destination')) {
        setDestination(
          person.location_state
            ? `${person.location_city}, ${person.location_state}`
            : person.location_city
        );
      }
    }).catch(() => {});
  }, [partnerId, session, searchParams]);

  useEffect(() => {
    if (searchParams.get('go') === '1' && origin && destination && date) {
      void runSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runSearch = async (event?: FormEvent) => {
    event?.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.searchTravel({
        origin,
        destination,
        date,
        returnDate: returnDate || undefined,
        modes,
      });
      setResults(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const keep = async (routes?: unknown) => {
    const plan = {
      origin,
      destination,
      travel_date: date,
      return_date: returnDate || undefined,
      saved_routes: routes || results,
      partner_id: partnerId || undefined,
    };
    if (!session) {
      stashPendingPlan(plan);
      setGateOpen(true);
      return;
    }
    try {
      const savedPlan = await api.saveTravelPlan(plan);
      setSaved((current) => [savedPlan, ...current]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not keep this trip');
    }
  };

  const flights = asList<FlightOffer>(results?.flights);
  const trains = asList<GroundTransport>(results?.trains);
  const buses = asList<GroundTransport>(results?.buses);
  const offers = useMemo(() => [...flights, ...trains, ...buses], [flights, trains, buses]);

  const toggleMode = (mode: string) => {
    setModes((current) =>
      current.includes(mode) ? current.filter((item) => item !== mode) : [...current, mode]
    );
  };

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 md:px-8 md:py-16">
      <Kicker>{partner ? `Toward ${partner.name || 'them'}` : 'Travel'}</Kicker>
      <h1 className="font-display mt-3 text-4xl md:text-6xl">The way there</h1>
      <p className="mt-4 max-w-xl text-[var(--espresso-soft)]">
        Compare once. Keep what you might take. Tickets open with the carrier — this house does not sell them.
      </p>

      <form onSubmit={runSearch} className="mt-10 grid gap-3 border border-[var(--line-strong)] bg-[var(--paper)] p-5 md:grid-cols-12">
        <div className="md:col-span-3">
          <label htmlFor="origin">From</label>
          <input id="origin" value={origin} onChange={(e) => setOrigin(e.target.value)} required placeholder="Your city" />
        </div>
        <div className="md:col-span-3">
          <label htmlFor="destination">To</label>
          <input id="destination" value={destination} onChange={(e) => setDestination(e.target.value)} required placeholder="Theirs" />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="date">Leave</label>
          <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="returnDate">Return</label>
          <input id="returnDate" type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
        </div>
        <div className="flex items-end md:col-span-2">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Looking' : 'Look'}
          </Button>
        </div>
        <div className="flex gap-5 md:col-span-12">
          {['flight', 'train', 'bus'].map((mode) => (
            <label key={mode} className="flex cursor-pointer items-center gap-2 text-[0.72rem] uppercase tracking-[0.14em] text-[var(--espresso-soft)]">
              <input
                type="checkbox"
                checked={modes.includes(mode)}
                onChange={() => toggleMode(mode)}
                className="h-3.5 w-3.5 accent-[var(--espresso)]"
              />
              {mode === 'flight' ? 'Flight' : mode === 'train' ? 'Rail' : 'Coach'}
            </label>
          ))}
        </div>
      </form>

      {error && <p className="mt-4 text-sm text-[var(--oxblood)]">{error}</p>}

      {results && offers.length === 0 && (
        <div className="mt-10">
          <EmptyState title="Nothing came back" body="Try nearby city names, or a 3-letter airport code for live fares." />
        </div>
      )}

      {offers.length > 0 && (
        <div className="mt-12">
          <div className="flex items-end justify-between">
            <h2 className="font-display text-3xl">Offers</h2>
            <button type="button" onClick={() => keep()} className="text-[0.72rem] uppercase tracking-[0.16em] hover:text-[var(--oxblood)]">
              Keep this search
            </button>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {offers.map((offer) => (
              <OfferCard key={offer.id} offer={offer} onKeep={() => keep(offer)} />
            ))}
          </div>
        </div>
      )}

      {session && saved.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-3xl">Kept</h2>
          <ul className="mt-6 divide-y divide-[var(--line)] border-y border-[var(--line)]">
            {saved.map((plan) => (
              <li key={plan.id} className="flex items-center justify-between gap-4 py-4">
                <div>
                  <p className="font-display text-xl">
                    {plan.origin} → {plan.destination}
                  </p>
                  <p className="text-sm text-[var(--stone-dark)]">{plan.travel_date}</p>
                </div>
                <button
                  type="button"
                  className="text-[0.7rem] uppercase tracking-[0.14em] text-[var(--stone-dark)] hover:text-[var(--oxblood)]"
                  onClick={async () => {
                    await api.deleteTravelPlan(plan.id);
                    setSaved((current) => current.filter((item) => item.id !== plan.id));
                  }}
                >
                  Release
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {profile?.location_city && !origin && (
        <p className="mt-8 text-sm text-[var(--stone-dark)]">
          Your city is {profile.location_city}. Use it as From when you are the one traveling.
        </p>
      )}

      <AuthGate
        open={gateOpen}
        onClose={() => setGateOpen(false)}
        intent="Keep this trip in the house."
        nextPath="/travel"
      />
    </div>
  );
}

export default function TravelPage() {
  return (
    <Suspense fallback={<div className="px-5 py-24 text-center text-[var(--stone-dark)]">Loading the desk…</div>}>
      <TravelPageInner />
    </Suspense>
  );
}
